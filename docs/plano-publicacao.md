# Plano de lançamento do MVP — proposta de 27/10/2026

## Decisões confirmadas

O usuário escolheu um piloto inteiramente gratuito e autorizou usar o projeto
Supabase atual. Todos os dados existentes serão preservados, independentemente
de serem dados de teste ou reais. Não foi autorizada contratação, mudança de plano,
criação de banco adicional, exclusão de registros ou execução de migrations.

Preparação local: `render.yaml` descreve um serviço Docker Free, sem disco ou
banco adicionais, na branch consolidada e com deploy automático desligado.
O Blueprint exige configurações reais pelo painel, sem valores no Git.
Aplicar um Blueprint inicia seu primeiro deploy mesmo com auto-deploy desligado;
essa aplicação continua sendo uma etapa de publicação sujeita à revisão final.

`.github/workflows/validar-imagem.yml` prepara a construção e execução da imagem
no GitHub, com configurações fictícias e sem secrets ou banco externo. Verifica
arquivos estáticos, 401 sem token, 404 de rota inexistente, HTTPS, CSP, HSTS e
usuário não root. A imagem de teste não é enviada a registry nem publicada.
O workflow está preparado, mas ainda não foi executado. Seu teste de proxy usa
somente o gateway da rede Docker isolada; não define a rede confiável do Render.

Pendências atuais: autorização para commit/push, conexão da conta gratuita Render
ao repositório, resultado do workflow de imagem e confirmação das configurações
externas, especialmente a origem dos proxies. Não cadastrar CIDRs por suposição.

## Estado confirmado

- Workspace oficial na raiz, branch `consolidation/workspace-unificado`.
- Último commit local: `16f96a8`; reformulação visual e perfil dos motoristas ainda
  têm alterações modificadas e arquivos novos sem commit. Publicar só o commit
  atual deixaria essas funcionalidades de fora.
- Última validação completa: 188 testes backend e 175 frontend aprovados, sem
  falhas ou ignorados, com builds e TypeScript aprovados. Relatórios em
  `.local/harness/test-results/83f73699a5ae4b6ebf99f7caeef5ea9d/`.
- Dockerfile multiestágio já prepara React e API na mesma imagem, com usuário
  não root, porta HTTP 8080, configuração de banco somente em runtime e sem
  migrations automáticas.
- Em 27/10/2026, consultas públicas retornaram HTTP 200 para as três referências:
  `node:24.18.0-bookworm-slim`, `mcr.microsoft.com/dotnet/sdk:10.0.400` e
  `mcr.microsoft.com/dotnet/aspnet:10.0.11`. Isso confirma disponibilidade das tags,
  não construção ou funcionamento da imagem final.
- Docker e CLIs de GitHub, Azure, Render e Railway não estão disponíveis neste
  ambiente. A imagem ainda não foi construída ou executada. É necessário um
  ambiente de construção Docker, local autorizado ou runner remoto.
- Nenhum acesso administrativo a hospedagem, Supabase de destino ou DNS foi
  confirmado. Não foram lidos secrets nem acessado banco de produção.

## Arquitetura proposta

Publicar frontend e API juntos em um serviço Docker, com uma única origem HTTPS.
Preservar PostgreSQL e autenticação no Supabase. Esse formato corresponde ao
Dockerfile existente e evita uma nova arquitetura de frontend e backend separados.

Render é uma opção já prevista na documentação; sua escolha e plano de cobrança
dependem da confirmação do usuário. O domínio inicial pode ser o subdomínio HTTPS
fornecido pela hospedagem, se aprovado; domínio próprio é uma decisão separada.

O plano gratuito do Render é adequado apenas a um piloto: a documentação informa
suspensão após 15 minutos sem tráfego e não recomenda instâncias Free para produção.
Para operação diária, definir hospedagem e disponibilidade compatíveis com o uso.

## Decisões necessárias

1. Hospedagem e conta de destino; piloto ou uso diário; orçamento autorizado.
2. Domínio existente ou uso inicial do subdomínio da hospedagem.
3. Projeto Supabase de destino: separado ou atual; confirmar se os dados existentes
   são reais e precisam ser preservados. Não tratar automaticamente desenvolvimento
   como produção.
4. Usuários iniciais autorizados e forma de envio dos convites. Credenciais devem
   ser configuradas nos painéis/armazenamentos apropriados, nunca no chat ou no Git.

## Execução proposta, após aprovação do destino e deste plano

1. Revisar as alterações do produto e preparar um commit de release incluindo
   arquivos novos. Apresentar a revisão antes de publicar a branch ou PR remoto.
2. Preparar a configuração da hospedagem e a validação Docker no ambiente escolhido.
   Construir a imagem, executar a verificação de inicialização e conferir conteúdo
   estático, respostas da API e cabeçalhos. Não usar banco real como efeito do build.
3. Configurar as duas variáveis públicas `VITE_SUPABASE_*` no build. A configuração
   local do Vite não vai para a imagem, e valores de runtime não alteram o JavaScript
   já compilado. Não publicar o build local sem conferir esses argumentos.
4. Confirmar banco, backup/restauração e estado das migrations do destino pelo fluxo
   administrativo autorizado. Qualquer aplicação de migration ou mudança de esquema
   exige autorização específica posterior; não executar automaticamente.
5. Configurar secrets de runtime, lista de usuários permitidos e origem Supabase.
   Confirmar JWT assimétrico, cadastro por convite, redirecionamentos HTTPS exatos e
   SMTP. Revisar a exposição das tabelas pela Data API; alterações de políticas ou
   permissões exigem plano e autorização específicos.
6. Confirmar a terminação TLS e as redes específicas dos proxies da hospedagem.
   O código exige proxies confiáveis: não cadastrar rede universal nem desabilitar
   a validação de TLS para contornar incompatibilidades.
7. Apresentar serviço, branch/commit, plano, custos conhecidos, destino do banco,
   domínio e rollback para aprovação final da publicação. Então executar o deploy.
8. Validar a origem publicada, login permitido, acesso negado, convites, recuperação
   e navegação. Qualquer escrita de teste em banco real precisa de autorização;
   validação isolada não comprova os fluxos externos.

## Impactos e limites

Arquivos previstos: Dockerfile e `.dockerignore` se a validação exigir correção,
workflow de validação da imagem e configuração de hospedagem conforme provedor,
além de `docs/publicacao.md`. Não há necessidade identificada de novos contratos
HTTP, dependências de aplicação ou migrations para apenas hospedar o MVP.

A configuração do proxy, a imagem ainda não validada e os ajustes externos de
Supabase são pendências concretas de publicação. A última suíte passou, mas isso
não equivale a um ambiente de produção liberado. Nada foi publicado, contratado,
enviado ao remoto ou alterado no banco nesta preparação.

## Referências verificadas

- [Docker no Render](https://render.com/docs/docker)
- [Configuração de Web Services](https://render.com/docs/web-services)
- [Limites do Render Free](https://render.com/docs/free)
- [SMTP do Supabase](https://supabase.com/docs/guides/auth/auth-smtp)
- [Preparação para produção no Supabase](https://supabase.com/docs/guides/deployment/going-into-prod)

Este plano não substitui as aprovações exigidas pelo `AGENTS.md` e não autoriza
automaticamente alterações administrativas ou contratação de serviços.
