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

Antes da criação do serviço, o código atual precisa estar no remoto. As mudanças
do produto ainda não foram commitadas e enviadas. A aprovação de commit/push é
separada da criação do serviço, alterações de banco e publicação.

## Validação da imagem

O workflow `Validar imagem de publicacao` executa em runner Ubuntu após push na
branch consolidada ou em PR para main. Ele constrói o Dockerfile com URL/chave
públicas fictícias e usa uma conexão fictícia de loopback, sem consultar o Supabase.
Uma falha de inicialização, 401/404 incorretos, ausência dos cabeçalhos esperados
ou usuário root reprova a verificação. Os logs ficam como artefatos do workflow.

Esse workflow ainda não foi executado. Não afirmar que a imagem está validada
até conferir seu resultado. Ele não testa login real, banco ou SMTP e não publica
imagens. O uso de Actions depende da franquia disponível na conta GitHub; não
habilitar cobrança ou orçamento pago para executar esta etapa.

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
| `Proxy__RedesConfiaveis__0` | CIDR específico do proxy confirmado com a hospedagem |

O Render fornece variáveis ao Docker como build arguments. O Dockerfile só usa
os dois argumentos VITE públicos; credenciais de banco não são argumentos de build.
Alterar VITE_* exige reconstruir a imagem. Não copiar arquivos de configuração
local para o repositório ou para a imagem.

`ASPNETCORE_HTTPS_PORT=443` e a rede confiável precisam ser compatíveis com a
terminação TLS real. Não usar `0.0.0.0/0`, desativar TLS ou confiar em cabeçalhos
de qualquer cliente. Essa rede ainda não foi confirmada; o Blueprint é um rascunho
e sua presença não comprova que o proxy está configurado.

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
