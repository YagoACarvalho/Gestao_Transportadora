> Atualizacao: frontend enviado no commit 57a729a; imagem inicial aprovada:
> https://github.com/YagoACarvalho/Gestao_Transportadora/actions/runs/40601213028.
> Trechos sobre imagem nao executada abaixo descrevem o diagnostico inicial.
> A correcao atual adiciona `Hospedagem__HttpsGerenciadoRender=true` em Production
> no Render, sem CIDR de proxy. Exige nova validacao Docker nos dois modos.
> Commit/push da correcao autorizado; banco e migrations permanecem inalterados.

# Piloto gratuito no Render com o Supabase atual

## Configuração preparada

O usuário escolheu hospedagem gratuita e o projeto Supabase atual.
`render.yaml` define um único Web Service Docker Free e um subdomínio gratuito
fornecido pelo Render. Não cria banco no Render, disco pago nem domínio próprio.
O destino é a branch `consolidation/workspace-unificado`.

`autoDeployTrigger: "off"` desliga publicações automáticas posteriores; criar o
serviço ou aplicar o Blueprint ainda inicia o primeiro deploy. Não clicar em
Create Web Service/Apply Blueprint antes da revisão final.

## Próximo passo do responsável

Criar uma conta em [Render](https://dashboard.render.com/) usando o GitHub que
tem acesso ao repositório `YagoACarvalho/Gestao_Transportadora`. Autorizar apenas o
repositório necessário. Não contratar plano pago nem alterar o Supabase nesta etapa.
Não enviar senhas, connection strings, tokens ou chaves privadas pelo chat.

O frontend foi enviado no commit 57a729a; a imagem inicial passou no Actions.
A correcao HTTPS exige nova validacao nos dois modos antes de publicar.

## Validação da imagem

O workflow `Validar imagem de publicacao` executa em runner Ubuntu após push na
branch consolidada ou em PR para main. Ele constrói o Dockerfile com URL/chave
públicas fictícias e usa uma conexão fictícia de loopback, sem consultar o Supabase.
Uma falha de inicialização, 401/404 incorretos, ausência dos cabeçalhos esperados
ou usuário root reprova a verificação. Os logs ficam como artefatos do workflow.

A imagem inicial passou no Actions (link acima). Conferir a matriz do commit
de correcao antes de publicar. Os testes usam dados ficticios e nao validam
login real, banco ou SMTP. Nao enviam imagens a registry nem fazem deploy.

## Configuração do serviço, após revisão

Usar o Dockerfile da raiz e contexto `.`. Porta 8080, ambiente Production e
health check `/`. O health check confirma processo/HTML, não conexão do banco.
Não criar banco Render Postgres ou substituir o PostgreSQL atual.

Preencher somente no painel:

| Variável | Conteúdo esperado |
| --- | --- |
| `VITE_SUPABASE_URL` | Origem HTTPS do Supabase atual |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave pública `sb_publishable_…` do mesmo projeto |
| `Supabase__Url` | A mesma origem HTTPS usada no frontend |
| `Supabase__UsuariosPermitidos__0` | UUID do usuário existente autorizado; adicionar índices para outros |
| `ConnectionStrings__DefaultConnection` | Conexão Npgsql do banco atual, com SSL e destino confirmado |
| `Hospedagem__HttpsGerenciadoRender` | `true`, somente no Render em Production |

O Render fornece variáveis ao Docker como build arguments. O Dockerfile só usa
os dois argumentos VITE públicos; credenciais de banco não são argumentos de build.
Alterar VITE_* exige reconstruir a imagem. Não copiar arquivos de configuração
local para o repositório ou para a imagem.

Configurar `Hospedagem__HttpsGerenciadoRender=true` e remover
`Proxy__RedesConfiaveis__0` (inclusive placeholders) e `ASPNETCORE_HTTPS_PORT`.
Este modo exige Production e `RENDER=true`, fornecido pela plataforma.
Render termina TLS e redireciona HTTP para HTTPS na borda. A API serve o transporte
HTTP interno sem redirecionar e inclui HSTS para o navegador na resposta HTTPS
externa. Request.Scheme e a lista restrita de proxies permanecem preservados.
Fora deste modo, ASP.NET continua responsavel por HSTS e redirecionamento.
Nao usar esse modo em servidores expostos diretamente por HTTP.
Conferir TLS e redirecionamento na URL publicada; CI simula apenas a rede interna.

## Supabase e liberação

Preservar todos os dados. O uso do projeto atual não autoriza migrations,
limpeza, criação de usuários ou mudanças de políticas/RLS. Confirmar os usuários
iniciais, o estado do esquema e a exposição da Data API pelo painel autorizado.

Depois de conhecer a URL final do serviço, preparar a raiz HTTPS terminada em `/`
como retorno exato de convite/recuperação, mantendo os retornos locais necessários.
Alterações externas de Auth exigem revisão antes de salvar. O SMTP padrão do
Supabase tem restrições de destinatários e uso; conferir os usuários existentes
e o fluxo de recuperação sem presumir entrega livre de convites.

Só então autorizar a criação/publicação, conferir build e inicialização, e testar
login e navegação. Testes que gravem no banco atual exigem autorização específica.
O sistema ainda não está publicado.

## Limites gratuitos

Render Free suspende após 15 minutos sem tráfego e pode levar cerca de um minuto
para voltar. Sua documentação não o recomenda para produção. O Supabase continua
sujeito aos limites do plano atual. Este arranjo é um piloto, sem compromisso de
disponibilidade contínua. Não usar artifícios para contornar limites dos provedores.

Referências: [Render Free](https://render.com/docs/free),
[Blueprint](https://render.com/docs/blueprint-spec),
[Docker e variáveis](https://render.com/docs/docker#environment-variable-translation),
[SMTP do Supabase](https://supabase.com/docs/guides/auth/auth-smtp).
