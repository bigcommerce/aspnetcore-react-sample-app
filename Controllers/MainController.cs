#pragma warning disable 0649
using System;
using System.Net.Http;
using System.Threading.Tasks;
using DotNetEnv;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using System.Net;
using System.Security.Cryptography;
using System.Collections.Generic;
using System.IO;

namespace SampleApp.Controllers
{
    [ApiController]
    public class MainController : ControllerBase
    {
        private string baseUrl;
        private IHttpClientFactory _clientFactory;

        public MainController(IHttpClientFactory clientFactory)
        {
            _clientFactory = clientFactory;
            baseUrl = Env.GetString("APP_URL");
        }

        private string GetAppClientId()
            => Env.GetString("APP_ENV") == "local" ? Env.GetString("BC_LOCAL_CLIENT_ID") : Env.GetString("BC_APP_CLIENT_ID");

        private string GetAppSecret()
            => Env.GetString("APP_ENV") == "local" ? Env.GetString("BC_LOCAL_SECRET") : Env.GetString("BC_APP_SECRET");

        private string GetAccessToken()
            => Env.GetString("APP_ENV") == "local" ? Env.GetString("BC_LOCAL_ACCESS_TOKEN") : HttpContext.Session.GetString("access_token");

        private string GetStoreHash()
            => Env.GetString("APP_ENV") == "local" ? Env.GetString("BC_LOCAL_STORE_HASH") : HttpContext.Session.GetString("store_hash");

        [Route("auth/install")]
        public async Task<ActionResult> Install()
        {
            IQueryCollection query = Request.Query;
            if (!(query.ContainsKey("code") && query.ContainsKey("scope") && query.ContainsKey("context")))
            {
                return Error("Not enough information was passed to install this app.");
            }

            HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, "https://login.bigcommerce.com/oauth2/token");
            Dictionary<string, string> body = new Dictionary<string, string>()
            {
                {"client_id", GetAppClientId()},
                {"client_secret", GetAppSecret()},
                {"redirect_uri", baseUrl + "/auth/install"},
                {"grant_type", "authorization_code"},
                {"code", query["code"]},
                {"scope", query["scope"]},
                {"context", query["context"]}
            };
            request.Content = new FormUrlEncodedContent(body);

            HttpResponseMessage response = await _clientFactory.CreateClient().SendAsync(request);
            string content = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    OauthResponseDto oauthResponse = JsonSerializer.Deserialize<OauthResponseDto>(content);
                    HttpContext.Session.SetString("store_hash", oauthResponse.context);
                    HttpContext.Session.SetString("access_token", oauthResponse.access_token);
                    HttpContext.Session.SetInt32("user_id", oauthResponse.user.id);
                    HttpContext.Session.SetString("user_email", oauthResponse.user.email);
                    
                    // If the merchant installed the app via an external link, redirect back to the 
                    // BC installation success page for this app
                    if (Request.Query.ContainsKey("external_install"))
                    {
                        return Redirect("https://login.bigcommerce.com/app/" + GetAppClientId() + "/install/succeeded");
                    }
                }
                return Redirect("/");
            }

            string errorMessage = "An error occurred.";

            if (response.Content.ToString().Length > 0 && response.StatusCode != HttpStatusCode.InternalServerError)
            {
                errorMessage = content;
            }

            // If the merchant installed the app via an external link, redirect back to the 
            // BC installation success page for this app
            if (Request.Query.ContainsKey("external_install"))
            {
                return Redirect("https://login.bigcommerce.com/app/" + GetAppClientId() + "/install/failed");
            }
            return Error(errorMessage);
        }

        [Route("auth/load")]
        public ActionResult Load(string signed_payload)
        {
            string signedPayload = signed_payload;
            if (signedPayload.Length > 0)
            {
                VerifiedSignedRequest verifiedSignedRequest = VerifySignedRequest(signedPayload);
                if (verifiedSignedRequest != null)
                {
                    HttpContext.Session.SetInt32("user_id", verifiedSignedRequest.user.id);
                    HttpContext.Session.SetString("user_email", verifiedSignedRequest.user.email);
                    HttpContext.Session.SetInt32("owner_id", verifiedSignedRequest.owner.id);
                    HttpContext.Session.SetString("owner_email", verifiedSignedRequest.owner.email);
                    HttpContext.Session.SetString("store_hash", verifiedSignedRequest.context);
                }
                else
                {
                    return Error("The signed request from BigCommerce could not be validated.");
                }
            }
            else
            {
                return Error("The signed request from BigCommerce was empty.");
            }

            return Redirect("/");
        }

        [Route("bc-api/{**endpoint}")]
        public async Task<ActionResult> ProxyBigCommerceApiRequest(string endpoint)
        {
            if (endpoint.Contains("v2"))
            {
                // For v2 endpoints, add a .json to the end of each endpoint, to normalize against the v3 API standards
                endpoint += ".json";
            }
            HttpResponseMessage response = await MakeBigCommerceApiRequest(endpoint);
            Response.StatusCode = Convert.ToInt32(response.StatusCode);
            Response.ContentType = "application/json";
            string body = await response.Content.ReadAsStringAsync();
            return Content(body);
        }

        private async Task<HttpResponseMessage> MakeBigCommerceApiRequest(string endpoint)
        {
            HttpRequestMessage request = new HttpRequestMessage(new HttpMethod(Request.Method), "https://api.bigcommerce.com/" + GetStoreHash() + "/" + endpoint);
            request.Headers.Add("X-Auth-Token", GetAccessToken());

            if (Request.Method == "PUT")
            {
                string body;
                using (StreamReader reader = new StreamReader(Request.Body, Encoding.UTF8))
                {
                    body = await reader.ReadToEndAsync();
                }
                request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            }

            return await _clientFactory.CreateClient().SendAsync(request);
        }

        private ActionResult Error(string message = "Internal Application Error")
        {
            Response.StatusCode = (int) HttpStatusCode.BadRequest;
            return Content("<h4>An issue has occurred:</h4> <p>" + message + "</p> <a href=\"" + baseUrl + "\">Go back to home</a>", "text/html");
        }

        private VerifiedSignedRequest VerifySignedRequest(string signedRequest)
        {
            string[] parts = signedRequest.Split('.', 2);
            string encodedData = parts[0];
            string encodedSignature = parts[1];

            // decode the data
            string signature = Encoding.UTF8.GetString(Convert.FromBase64String(encodedSignature));
            string jsonStr = Encoding.UTF8.GetString(Convert.FromBase64String(encodedData));

            // confirm the signature
            string expectedSignature;
            using (var hmacsha256 = new HMACSHA256(Encoding.UTF8.GetBytes(GetAppSecret())))
            {
                expectedSignature = ByteToString(hmacsha256.ComputeHash(Encoding.UTF8.GetBytes(jsonStr)));
            }
            if (!SlowEquals(Encoding.UTF8.GetBytes(expectedSignature), Encoding.UTF8.GetBytes(signature)))
            {
                Console.Error.WriteLine("Bad signed request from BigCommerce!");
                return null;
            }

            return JsonSerializer.Deserialize<VerifiedSignedRequest>(jsonStr);
        }

        // from: https://bryanavery.co.uk/cryptography-net-avoiding-timing-attack/
        private static bool SlowEquals(byte[] a, byte[] b)
        {
            uint diff = (uint)a.Length ^ (uint)b.Length;
            for (int i = 0; i < a.Length && i < b.Length; i++)
                diff |= (uint)(a[i] ^ b[i]);
            return diff == 0;
        }

        // from: https://stackoverflow.com/a/12804391/7414734
        static string ByteToString(byte[] buff)
        {
            string sbinary = "";
            for (int i = 0; i < buff.Length; i++)
                sbinary += buff[i].ToString("X2"); /* hex format */
            return sbinary.ToLower();
        }

        class OauthResponseDto
        {
            public string context { get; set; }
            public string access_token { get; set; }
            public OauthUserDto user { get; set; }
        }

        class OauthUserDto
        {
            public int id { get; set; }
            public string username { get; set; }
            public string email { get; set; }
        }

        class VerifiedSignedRequest
        {
            public string context { get; set; }
            public OauthUserDto user { get; set; }
            public OauthUserDto owner { get; set; }
        }
    }
}
