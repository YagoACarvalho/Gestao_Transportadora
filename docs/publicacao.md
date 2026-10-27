> Atualizacao: frontend enviado no commit 57a729a; imagem inicial aprovada:
> https://github.com/YagoACarvalho/Gestao_Transportadora/actions/runs/40601213028.
> Trechos sobre imagem nao executada abaixo descrevem o diagnostico inicial.
> A correcao atual adiciona `Hospedagem__HttpsGerenciadoRender=true` em Production
> no Render, sem CIDR de proxy. Exige nova validacao Docker nos dois modos.
> Commit/push da correcao autorizado; banco e migrations permanecem inalterados.

# Preparação do piloto online

## Escopo aprovado

Uma transportadora; usuários convidados; login por e-mail e senha com Supabase Auth.
Render gratuito é uma opção proposta para o piloto, não uma publicação executada.
As melhorias funcionais permanecem na branch feature/mvp-operacional.

## Situação desta preparação

Dockerfile e .dockerignore preparam a construção do React e a publicação da API
em uma única imagem. Não há migrations ou seed no build nem na inicialização.
O container final roda com usuário não root e recebe configuração sensível em runtime.
Node e SDK ficam somente nos estágios de compilação; frontend/dist vai para wwwroot.

**A imagem ainda não foi validada para publicação.** Autenticação, autorização e
serviço de arquivos estáticos foram implementados. Faltam construir/executar a imagem,
configurar e testar o projeto Supabase de destino e validar HTTPS atrás do proxy.
Não criar serviço Render nem habilitar deploy automático neste estágio.

Docker não está instalado no ambiente de preparação. Nenhuma imagem foi construída,
executada, enviada a registry ou validada no Render. As tags fixam Node 24.18.0,
SDK .NET 10.0.400 e runtime 10.0.11, alinhados ao ambiente de validação; antes da
publicação, verificar disponibilidade dessas imagens e registrar os digests efetivamente
testadas para reproduzir a imagem e atualizar patches de segurança deliberadamente.

## Autenticação implementada

Dependências aprovadas e adicionadas:

- frontend: @supabase/supabase-js 2.118.0, versão exata no package.json e lockfile.
- API: Microsoft.AspNetCore.Authentication.JwtBearer 10.0.11.

Arquivos envolvidos: Transportador.Api/Authentication/, Program.cs, frontend/src/auth/,
cliente HTTP, main.tsx, AppShell, testes isolados e exemplos de configuração.

- Validar JWT com assinatura, emissor, destinatário e expiração; usar as chaves
  públicas do projeto, sem copiar o segredo de assinatura para o frontend.
- Proteger todos os endpoints de negócio. 401 para autenticação ausente/inválida;
  403 para usuário autenticado fora da lista autorizada do servidor.
- Negar acesso quando a configuração de autorização estiver ausente, sem fallback
  que libere o sistema em Development ou em falhas de comunicação.
- Mesmo acesso operacional para convidados autorizados, conforme aprovação; sem papéis adicionais.
- Login, logout, convite/definição de senha, recuperação e tratamento de sessão expirada.
- Não carregar dados operacionais antes da autenticação; limpar dados e versões ETag
  ao encerrar ou trocar sessão. Não registrar senhas, links de convite ou tokens.
- Servir build React e API na mesma origem; caminhos /api inexistentes devem continuar
  retornando resposta de API, sem cair no index.html do frontend.
- Configurar o proxy de produção com origem confiável, sem aceitar indiscriminadamente
  cabeçalhos de encaminhamento de clientes externos ou desabilitar TLS.

Configuração necessária (valores reais somente no ambiente local/painel do serviço):

| Nome | Onde | Finalidade |
| --- | --- | --- |
| `Supabase__Url` | API | Origem HTTPS do projeto, sem caminhos ou query |
| `Supabase__UsuariosPermitidos__0` (e `__1`, etc.) | API | UUIDs dos usuários convidados autorizados |
| `ConnectionStrings__DefaultConnection` | API, secret de runtime | Conexão PostgreSQL do destino confirmado |
| `Proxy__RedesConfiaveis__0` (e seguintes) | API atrás de proxy | CIDRs específicos confirmados com a hospedagem |
| `VITE_SUPABASE_URL` | frontend, build | Mesma origem Supabase configurada na API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | frontend, build | Chave pública `sb_publishable_…` |

Na API local, usar User Secrets ou variáveis de ambiente, sem versionar valores.
No React local, copiar frontend/.env.example para frontend/.env.local (ignorado)
e preencher somente as duas configurações públicas. Reiniciar Vite após mudanças.
Na publicação, os argumentos VITE_* devem estar disponíveis no estágio de build,
enquanto os secrets do banco só devem existir no container de runtime.

URL ausente/inválida impede a inicialização da API; lista de usuários vazia nega
acesso a todos. Reiniciar/reimplantar o serviço após alterar usuários em variáveis
de ambiente. A lista é verificada em cada requisição, não copiada para o JWT.
O projeto Supabase precisa usar chaves de assinatura assimétricas ES256 ou RS256
com JWKS público. Tokens legados HS256 não são aceitos; não rotacionar chaves
automaticamente para corrigir isso. Confirmar configuração antes do teste real.

Convites e recuperação usam a raiz da aplicação como retorno. Cadastrar exatamente
`http://127.0.0.1:5173/` para desenvolvimento e a origem HTTPS de publicação com `/`
no final. Não liberar wildcards. O SDK processa o fragmento de convite antes de
montar a navegação hash. Após definir senha, o usuário deve entrar novamente.

A sessão fica em sessionStorage, não em localStorage; fechar a aba normalmente
encerra o armazenamento daquela aba, sujeito à restauração de sessão do navegador.
Em equipamento compartilhado, sempre usar Sair. Logout limpa a sessão local e
invalida requisições/ETags; não invalida instantaneamente uma cópia de access token
que já tenha sido emitida. Para revogar acesso à API, remover o ID autorizado e
reiniciar/recarregar a configuração do servidor.

O proxy só aceita X-Forwarded-Proto de redes confiáveis explicitamente configuradas
(além dos padrões loopback do framework). Sem isso, o redirecionamento HTTPS pode
falhar atrás do Render. Não usar `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true`, limpar
as listas de proxies ou cadastrar redes universais para contornar o problema.
Produção recebe CSP, proteção contra framing e no-store para API/HTML de entrada.

## Configuração externa: etapa separada

1. Confirmar projeto de produção, região, domínio e destino do banco; não reutilizar
   automaticamente o Supabase de desenvolvimento como produção.
2. Desabilitar cadastro público no Supabase, configurar redirecionamentos exatos
   para convites/recuperação e um provedor SMTP apropriado aos endereços dos usuários.
3. Convidar usuários por administração do Supabase e incluir seus IDs na lista
   autorizada do servidor. Reiniciar/recarregar configuração após remover um ID
   revoga acesso à API sem esperar a expiração de tokens. Não há cadastro público na UI.
4. Revisar se tabelas de domínio estão acessíveis pela Data API do Supabase e quais
   permissões/RLS existem. Login na API .NET não protege acessos diretos ao banco
   ou à Data API. Mudanças de permissões/políticas precisam de plano e autorização.
5. Configurar conexão do banco e autorização em secrets do serviço. VITE_* é público
   e incorporado ao JavaScript. Apenas URL do Supabase e chave publicável podem
   ser usadas nos argumentos frontend; nunca credenciais de banco ou service_role.
6. Definir backup/restauração e validar manualmente o destino de produção antes
   de usar registros reais. Migrations, se necessárias nesse destino, exigem
   revisão e autorização separadas; nunca serão executadas automaticamente.

## Validação para liberar

- Harness isolado com SQLite e autenticação simulada somente na infraestrutura de
  testes; testes dedicados exercitando JWT real assinado com chaves efêmeras locais.
- Casos 401/403, token inválido/expirado, convidado permitido, logout, recuperação,
  limpeza de dados na troca de sessão e respostas de API sem fallback HTML.
- Build e execução da imagem em ambiente com Docker; sem conectar ao PostgreSQL
  externo como efeito colateral da compilação.
- Validação visual em navegador real, seguida de teste de convite/login/fluxos
  contra ambiente confirmado. Só então revisão de diff, commit, PR e autorização de deploy.

## Limites do piloto gratuito

Render Free suspende por inatividade e possui limites de consumo; não oferece a
disponibilidade necessária para assumir operação crítica contínua. Supabase Free
também pode pausar projetos de baixa atividade. Um serviço de e-mail/domínio pode
ter custos próprios. Nenhuma conta paga ou contratação foi realizada.

Referências: [Docker no Render](https://render.com/docs/docker),
[limites gratuitos](https://render.com/docs/free),
[SMTP do Supabase](https://supabase.com/docs/guides/auth/auth-smtp),
[imagens .NET](https://learn.microsoft.com/dotnet/core/docker/introduction).
