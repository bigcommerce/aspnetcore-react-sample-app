using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

namespace React.Sample.Webpack.CoreMvc.Controllers
{
	public class IndexController : Controller
	{
		[Route("{path?}")]
		public ActionResult Index()
		{
			if (Request.Path.Value != "/") return Redirect("/");
			return View();
		}
	}
}
