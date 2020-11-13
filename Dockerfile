FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS builder
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && apt-get install -y nodejs
WORKDIR /app

# Copy csproj and restore as distinct layers
COPY *.csproj ./
COPY package*.json ./
RUN npm i && dotnet restore

# Copy everything else and run
COPY . ./
RUN dotnet publish -c Release -o out

# Build runtime image
FROM mcr.microsoft.com/dotnet/core/aspnet:3.1
WORKDIR /app
COPY --from=builder /app/out .
COPY --from=builder /app/docker/democertificate.pfx /cert/democertificate.pfx
ENV Kestrel__Certificates__Default__Path=/cert/democertificate.pfx\
    Kestrel__Certificates__Default__Password=demopassword\
    ASPNETCORE_URLS=https://+;http://+;\
    APP_URL=https://localhost\
    APP_ENV=local
ENTRYPOINT ["dotnet", "SampleApp.dll"]