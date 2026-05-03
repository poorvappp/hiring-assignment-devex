# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# 1. Copy everything from the registry folder
COPY . .

# 2. Navigate to the actual folder containing the .csproj
# Based on your 'ls', it's in src/DeploymentRegistry.Api
WORKDIR /app/src/DeploymentRegistry.Api

# 3. Restore and Publish using the specific file
RUN dotnet restore "DeploymentRegistry.Api.csproj"
RUN dotnet publish "DeploymentRegistry.Api.csproj" -c Release -o /publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
# Copy the compiled files from the /publish folder in the build stage
COPY --from=build /publish .

ENV ASPNETCORE_URLS=http://+:5176
EXPOSE 5176
# The DLL name usually matches the project name
ENTRYPOINT ["dotnet", "DeploymentRegistry.Api.dll"]

