# Workspace consolidado

A pasta de trabalho oficial é `G:\projetos\Gestao_Transportadora-main`.
A branch de consolidação é `consolidation/workspace-unificado`.

## Origem e preservação

O estado de trabalho do MVP foi preservado no commit `4872152`, baseado em
`afd23e9`. A integração anterior com a main remota já está nessa base; o histórico
original de `feature/frontend-react` permanece disponível, sem um novo merge de
históricos sem ancestral comum.

A salvaguarda local está em `.local/consolidacao/20261027-192424/`: arquivo de
fontes, lista de arquivos e patches das alterações do MVP e da integração.
Configurações sensíveis, dependências e builds não fazem parte do arquivo de fontes.

Os worktrees antigos foram preservados:

- `.local/worktrees/mvp`: cópia no commit de salvaguarda, em detached HEAD;
  não usar como pasta de desenvolvimento diário.
- `.local/worktrees/integracao-main`: branch de integração anterior, com duas
  linhas em branco locais preservadas em `ViagensTable.tsx`.

Não remover worktrees manualmente nem descartar suas alterações. Sua remoção
continua dependendo de autorização específica. Branches antigas permanecem no Git.

## Onde trabalhar

- `frontend/src/ui/`: componentes e tokens usados pela aplicação React.
- `src/ui/`: kit original e `ExamplePage.tsx`, como referência visual.
- `frontend/src/pages/` e `frontend/src/features/`: telas e lógica por domínio.
- `Transportador.Api/`: API, autenticação, persistência e migrations existentes.
- `tests/`: testes backend; testes frontend ficam junto ao código em `frontend/src/`.

Abra o editor na pasta oficial e execute comandos a partir dela. Para o frontend,
entre em `frontend/`. Não copie dependências, configurações sensíveis ou artefatos
dos worktrees antigos para a raiz.

## Validação

Na raiz, execute `powershell -NoProfile -File ./scripts/validar.ps1`.
Logs e relatórios ficam em `.local/harness/`. A consolidação preserva o código
existente: não aplica migrations nem comprova conexão com PostgreSQL, autenticação
real, publicação ou comportamento visual no navegador.

A próxima etapa de produto é concluir a reformulação de todas as telas usando
o kit em `frontend/src/ui/`, conforme o `AGENTS.md` da raiz.

## Resultado da consolidação — 27/10/2026

O harness oficial terminou com código 0 na raiz consolidada:

- Backend: 188 casos descobertos, 188 executados e aprovados; zero falhas e ignorados.
- Frontend: 154 testes executados e aprovados; zero falhas e ignorados.
- Restore, build backend, instalação pelo lockfile, TypeScript e build frontend aprovados.
- `git diff --check` sem problemas nas alterações de organização.

Relatórios locais: `.local/harness/test-results/09b3720a7aac4228b8098a661f713c0a/`.
Foram emitidos avisos xUnit1051, de dependência descontinuada `whatwg-encoding`,
de dimensões de gráficos no ambiente de testes e de diretivas `use client` do Motion
no bundle. Esses avisos ficam registrados nos logs e não foram alterados nesta etapa.
Nenhuma migration foi aplicada, nenhum banco externo foi acessado e a interface
não foi revisada no navegador durante a consolidação.
