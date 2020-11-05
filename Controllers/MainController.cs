using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using DotNetEnv;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using System.Text;
using System.Net;

namespace SampleApp.Controllers
{
    [Route("api/[controller]")]
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

        public async Task<ActionResult> Install()
        {
            IQueryCollection query = Request.Query;
            if (!(query.ContainsKey("code") && query.ContainsKey("scope") && query.ContainsKey("context")))
            {
                return Error("Not enough information was passed to install this app.");
            }

            StringContent json = new StringContent(JsonSerializer.Serialize(new InstallDto
            {
                client_id = GetAppClientId(),
                client_secret = GetAppSecret(),
                redirect_uri = baseUrl + "/auth/install",
                grant_type = "authorization_code",
                code = query["code"],
                scope = query["scope"],
                context = query["context"]
            }), Encoding.UTF8, "application/json");
            HttpResponseMessage response = await _clientFactory.CreateClient().PostAsync("https://login.bigcommerce.com/oauth2/token", json);

            if (response.IsSuccessStatusCode)
            {
                if (response.StatusCode == HttpStatusCode.OK)
                {
                    OauthResponseDto oauthResponse = JsonSerializer.Deserialize<OauthResponseDto>(response.Content.ToString());
                    HttpContext.Session.SetString("store_hash", oauthResponse.context);
                    HttpContext.Session.SetString("access_token", oauthResponse.access_token);
                    HttpContext.Session.SetString("user_id", oauthResponse.user.id);
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
                errorMessage = response.Content.ToString();
            }

            // If the merchant installed the app via an external link, redirect back to the 
            // BC installation success page for this app
            if (Request.Query.ContainsKey("external_install"))
            {
                return Redirect("https://login.bigcommerce.com/app/" + GetAppClientId() + "/install/failed");
            }
            return Error(errorMessage);
        }


        private ActionResult Error(string message = "Internal Application Error") =>
            BadRequest("<h4>An issue has occurred:</h4> <p>" + message + "</p> <a href=\"" + baseUrl + "\">Go back to home</a>");

        class InstallDto
        {
            public string client_id;
            public string client_secret;
            public string redirect_uri;
            public string grant_type;
            public string code;
            public string scope;
            public string context;
        }

        class OauthResponseDto
        {
            public string context;
            public string access_token;
            public OauthUserDto user;
        }

        class OauthUserDto
        {
            public string id;
            public string email;
        }
    }
}
