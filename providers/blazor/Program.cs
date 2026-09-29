using Blazor;
using Microsoft.AspNetCore.Components.Web;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddServerSideBlazor(options =>
    options.RootComponents.RegisterForJavaScript<Counter>("counter"));
var app = builder.Build();
app.UseCors();
app.UseStaticFiles();
app.MapBlazorHub();
app.MapGet("/health", () => "ok");
app.Run();
