using DeploymentRegistry.Api.Configuration;
using DeploymentRegistry.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<MongoDbSettings>()
    .Bind(builder.Configuration.GetSection("MongoDb"))
    .Validate(s => !string.IsNullOrWhiteSpace(s.ConnectionString), "MongoDb:ConnectionString is required.")
    .Validate(s => !string.IsNullOrWhiteSpace(s.DatabaseName), "MongoDb:DatabaseName is required.")
    .Validate(s => !string.IsNullOrWhiteSpace(s.CollectionName), "MongoDb:CollectionName is required.")
    .ValidateOnStart();

builder.Services.AddSingleton<IDeploymentService, DeploymentService>();
builder.Services.AddControllers();

var app = builder.Build();

app.MapControllers();

app.Run();
