# Preparação de publicação. Não publicar antes de concluir autenticação e revisão.
FROM node:24.18.0-bookworm-slim AS frontend-build
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Somente configurações públicas; nunca usar service_role ou conexão do banco aqui.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
RUN npm run typecheck && npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0.400 AS api-build
WORKDIR /src
COPY Transportador.Api/Transportador.Api.csproj Transportador.Api/
RUN dotnet restore Transportador.Api/Transportador.Api.csproj
COPY Transportador.Api/ Transportador.Api/
RUN dotnet publish Transportador.Api/Transportador.Api.csproj -c Release --no-restore --no-self-contained -o /out
COPY --from=frontend-build /src/frontend/dist/ /out/wwwroot/

FROM mcr.microsoft.com/dotnet/aspnet:10.0.11 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
COPY --from=api-build /out/ ./
USER $APP_UID
ENTRYPOINT ["dotnet", "Transportador.Api.dll"]
