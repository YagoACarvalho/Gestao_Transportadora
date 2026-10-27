namespace Transportador.Api.Authentication;

public sealed class ConfiguracaoAcesso
{
    public string Url { get; set; } = "";
    public string[] UsuariosPermitidos { get; set; } = [];

    public static bool UrlValida(string url) => Uri.TryCreate(url, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps && uri.AbsolutePath == "/"
        && string.IsNullOrEmpty(uri.Query) && string.IsNullOrEmpty(uri.Fragment) && string.IsNullOrEmpty(uri.UserInfo);
}
