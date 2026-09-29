using Blazor;
using Microsoft.AspNetCore.Components.Web;

var builder = WebApplication.CreateBuilder(args);
var origin = builder.Configuration["HOST_ORIGIN"] ?? "http://localhost:4321";
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins(origin).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddServerSideBlazor(options =>
    options.RootComponents.RegisterForJavaScript<Counter>("counter"));
var app = builder.Build();
app.UseCors();
// WebSocket upgrades do not use CORS preflight.
app.Use(async (context, next) => {
    if (context.Request.Path.StartsWithSegments("/_blazor") &&
        context.Request.Headers.Origin is var supplied && supplied.Count > 0 && supplied != origin)
    {
        context.Response.StatusCode = 403;
        return;
    }
    await next();
});
app.UseStaticFiles();
app.MapBlazorHub();
app.MapGet("/health", () => "ok");
app.Run();
