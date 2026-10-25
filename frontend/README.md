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

O POST cria ativo pelo backend. O PUT envia Ativo explicitamente, preservando a
situação atual; esta entrega não oferece reativação. DELETE desativa sem excluir.
Campos opcionais vazios são enviados como null. Validade da CNH é texto ISO
YYYY-MM-DD; não é convertida para instante JavaScript ou UTC. Busca é local aos
registros carregados, sem paginação no servidor. Não há novas regras de CPF/CNH.
Falhas de persistência recebem feedback genérico sem expor detalhes internos.

Inter usa fallback do sistema até a distribuição da fonte ser definida. Menu móvel
e painéis usam dialog nativo; teclado, foco, responsividade e movimento reduzido
precisam de revisão em navegador real. Os testes jsdom adaptam showModal/close e
não comprovam foco nativo ou apresentação visual. Motion permanece no feedback do
menu. A validação real com PostgreSQL continua separada e pendente.

## Caminhões e navegação

Os endereços #/motoristas e #/caminhoes permitem acesso direto e navegação pelo
histórico do navegador. Sidebar, cabeçalho e título acompanham o módulo atual.
Viagens está disponível em #/viagens; regras e contratos em ../docs/viagens.md.

Caminhões usa os contratos existentes de /api/Caminhoes: GET com incluirInativos,
GET por id, POST (ativo por padrão), PUT com Ativo explícito e DELETE por desativação.
Busca por placa/modelo é local; filtros Ativos/Inativos/Todos seguem a mesma estratégia
de Motoristas. A edição mantém a situação atual, sem oferecer reativação.

Placa e modelo são enviados como digitados, sem novas máscaras, normalizações ou
regras de unicidade. Essas regras de negócio continuam pendentes. Painel lateral e
estilos de cadastros são compartilhados, mantendo os formulários de cada domínio.
Os testes HTTP de Caminhões usam a mesma ApiFactory isolada com SQLite em memória.
Não foi executada verificação de Caminhões no Supabase; essa etapa permanece separada.
