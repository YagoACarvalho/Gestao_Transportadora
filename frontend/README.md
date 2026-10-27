# Frontend — Gestão de Transportadora

React, TypeScript, Vite, CSS Modules e Motion. Motoristas e Caminhões possuem consulta, busca
local, filtro de situação, cadastro, edição e desativação. Viagens inclui cadastro,
edição enquanto planejada e acompanhamento de situação. A interface não contém registros ou métricas de demonstração.

Na pasta frontend/, usando Node.js compatível com package.json:

```powershell
npm.cmd ci
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Abra http://127.0.0.1:5173. A porta é fixa; o Vite falha se estiver ocupada.
Em outros sistemas, use npm. Execute testes e instalação somente nesta pasta;
o frontend usa seu próprio manifesto e lockfile. O harness completo está documentado em
../docs/desenvolvimento.md. Testes usam fetch substituído ou API simulada e nunca
acessam bancos externos. Dados ilustrativos existem exclusivamente nos testes.

## Integração local (depende de autorização separada)

Após confirmar configuração e destino PostgreSQL de desenvolvimento sem expor
credenciais, a API poderá ser iniciada pelo perfil https. O proxy encaminha /api
para https://localhost:7148, preserva o caminho e valida o certificado (secure: true).
O navegador usa URLs relativas. Não foi adicionado CORS à API. O proxy é exclusivo
do servidor de desenvolvimento; deploy requer encaminhamento /api na mesma origem
ou outra configuração previamente aprovada. preview serve somente o build estático.

Se o Node não reconhecer o certificado .NET, interrompa a validação real. Obtenha
uma exportação PEM do certificado público de desenvolvimento de fonte confiável e
configure NODE_EXTRA_CA_CERTS para seu caminho local antes de iniciar o Vite. Não
versione certificados ou chaves. Não use secure: false, NODE_TLS_REJECT_UNAUTHORIZED=0
ou alterações globais de TLS. A configuração do certificado precisa ser confirmada
antes de nova tentativa. O harness isolado não verifica esse certificado.

## Contratos e interface

O POST cria ativo pelo backend. O PUT envia Ativo explicitamente. A edição permite
marcar Cadastro ativo para reativar ou desmarcar para desativar. DELETE desativa sem excluir.
Campos opcionais vazios são enviados como null. Validade da CNH é texto ISO
YYYY-MM-DD; não é convertida para instante JavaScript ou UTC. Busca é local aos
registros carregados, sem paginação no servidor. Não há validação de dígitos ou
unicidade de CPF/CNH. A API normaliza CPF e valida os limites existentes dos campos.
Falhas de persistência recebem feedback genérico sem expor detalhes internos.

A interface usa o kit de `src/ui/`, com Plus Jakarta Sans e fallback local, sem
requisições a fontes externas. Navegação móvel e painéis usam dialog nativo.
Os testes jsdom não comprovam foco nativo ou apresentação visual; a revisão
isolada no Chrome cobre desktop e mobile. Autenticação real e PostgreSQL continuam
como validações separadas. Detalhes em [design system](../docs/design-system.md).

## Cards e perfil de motoristas

Motoristas agora é exibido em cards. `Ver perfil` abre Cadastro, Viagens e
Remuneração; o atalho `Viagens` abre diretamente os percursos vinculados.
Remuneração mostra valores previstos registrados, conforme inclusão financeira,
sem representar pagamentos. Regras, limites de atribuição e validação em
[perfil de motoristas](../docs/perfil-motoristas.md).

## Caminhões e navegação

Os endereços #/motoristas e #/caminhoes permitem acesso direto e navegação pelo
histórico do navegador. Navegação, cabeçalho e título acompanham o módulo atual.
Viagens está disponível em #/viagens; regras e contratos em ../docs/viagens.md.

Caminhões usa os contratos existentes de /api/Caminhoes: GET com incluirInativos,
GET por id, POST (ativo por padrão), PUT com Ativo explícito e DELETE por desativação.
Busca por placa/modelo é local; filtros Ativos/Inativos/Todos seguem a mesma estratégia
de Motoristas. A edição permite mudar explicitamente a situação do cadastro.

Placa e modelo são enviados como digitados, sem novas máscaras, normalizações ou
regras de unicidade. Essas regras de negócio continuam pendentes. Painel lateral e
estilos de cadastros são compartilhados, mantendo os formulários de cada domínio.
Os testes HTTP de Caminhões usam a mesma ApiFactory isolada com SQLite em memória.
Não foi executada verificação de Caminhões no Supabase; essa etapa permanece separada.

## Despesas e resumo financeiro

`#/despesas` oferece lançamentos com ou sem vínculo de viagem, em qualquer fase.
Descrição, categoria, data civil e valor positivo são obrigatórios. Exclusão é
permanente e exige confirmação. `#/financeiro` apresenta fretes previstos, despesas
e saldo previsto, sem representar valores recebidos ou lucro realizado.
Contratos, concorrência, decisões e limites de publicação: [MVP](../docs/mvp.md).

## Acesso por convite

O frontend agora exige login antes de montar os módulos e envia o token Supabase
somente para URLs relativas /api/. Configure as duas variáveis públicas de
.env.example em .env.local (ignorado) e reinicie o Vite. Sem configuração, a tela
informa que o acesso está em preparação; não há bypass de autenticação.

Login, recuperação e convite/definição de senha usam Supabase Auth. Sessões ficam
no armazenamento da aba. Sair limpa o armazenamento e cancela consultas pendentes;
respostas tardias e ETags de outra sessão não são reaproveitadas. A API nega tokens
inválidos com 401 e usuários fora da lista com 403. Convites/SMTP, assinatura JWT,
configuração da API e limitações de publicação: [publicação](../docs/publicacao.md).

## Kit visual e situações de viagem

`src/ui/` contém os componentes adaptados do kit visual aprovado, com CSS Modules
e tokens `--ul-*`. Os originais estão em `../src/ui/`, sem importação na aplicação.
A fonte usa fallback local; não há download de fontes de terceiros.

Viagens em andamento podem ser pausadas. Pausadas permitem retomar ou cancelar;
a conclusão exige retomar antes. Todas as ações pedem confirmação, preservam
dados e despesas e são validadas pela API. Não foi necessária migration.

Na listagem, as ações de andamento aparecem abaixo da situação, junto do percurso
na primeira coluna. Dados incompletos mantêm a ação visível, bloqueada e explicada;
viagens concluídas ou canceladas oferecem Reabrir, com confirmação. Viagens sem
situação oferecem Regularizar viagem, preenchendo os dados obrigatórios. Essas
operações usam PUT e preservam despesas e escolhas financeiras, sem remuneração
retroativa. Ao reabrir uma cancelada, o frete volta ao saldo previsto.
