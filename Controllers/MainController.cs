using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using DotNetEnv;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace SampleApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MainController : ControllerBase
    {
        private string baseUrl;

        MainController()
        {
            baseUrl = Env.GetString("APP_URL");
        }


        public ActionResult Error(string message = "Internal Application Error") =>
            BadRequest("<h4>An issue has occurred:</h4> <p>" + message + "</p> <a href=\"" + baseUrl +"\">Go back to home</a>");
    }
}
