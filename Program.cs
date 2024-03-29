using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;

namespace React.Sample.Webpack.CoreMvc
{
	public class Program
	{
		public static void Main(string[] args)
		{
			DotNetEnv.Env.Load();
			BuildWebHost(args).Run();
		}

		public static IWebHost BuildWebHost(string[] args) =>
			WebHost.CreateDefaultBuilder(args)
				.UseStartup<Startup>()
				.Build();
	}
}
