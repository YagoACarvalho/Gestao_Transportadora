# Design system vigente: Componentes v2

Migração aprovada para o kit de `DCSEmpresarial/application`, em
`docs/rh/src/app/componentes-v2`, incluindo os dashboards e cards do RH.
Essa decisão substitui as diretrizes Leange e Ultraleads anteriores.

## Fonte de verdade

- Base e indicadores reais portados: `frontend/src/ui/v2/`.
- Origem fixada no commit `7739a8a82f01fec5d34ba63a7940f52e69e41ec8`.
- Tokens da base em `v2/base/tema/tokens.css`, extensões em `ui/tokens.css`.
- Cores, espaços e tipografia por `--aleph-*`; dimensões específicas por `--app-*`.
- Inter Variable servida localmente; Lucide para ícones.
- Temas claro/escuro/sistema preservam a preferência `gt.ui.theme`.

## Composição

A aplicação renderiza CascaApp, MenuLateral, BarraSuperior e CabecalhoPagina.
Cards de motoristas e caminhões usam Cartao e Avatar; campos usam CaixaEntrada;
ações usam Botao e Selo; filtros usam GrupoAlternavel; janelas usam Modal.
Os adaptadores em `ui/` preservam a API de composição usada pelas telas.

Financeiro, contadores de listagens e totais dos perfis usam as molduras reais
MolduraIndicador, GradeIndicadores e ValorIndicador. O financeiro aplica notas,
legendas e BarraSegmentada para a divisão de despesas não negativas. Valores
negativos e ausência de dados continuam explícitos. Séries temporais permanecem
no Recharts para conservar ordem, sinais, escala e lacunas. Não usar colunas
proporcionais que ordenam valores para representar meses.

O layout segue as superfícies neutras, molduras e painéis da referência.
As listagens semânticas reutilizam a base Tabela por TabelaSemantica, sem alterar
os recortes existentes ou adicionar paginação de negócio nesta migração.

## Acessibilidade e integração

Preservar labels, validação nativa, navegação, ações, carregamento e erros.
Foco visível, movimento reduzido, Escape e retorno de foco dos modais são
obrigatórios. Não importar os estilos do RH que apagam o foco.
Indicadores e cartões se adaptam a 360 px; tabelas rolam localmente.
Nenhum dado demonstrativo, serviço ou provider do RH foi trazido ao runtime.

Emotion, Phosphor e react-number-format saíram das dependências ativas.
Leange em `ui/leange/` e Ultraleads em `src/ui/` da raiz permanecem históricos,
sem imports no frontend ativo. A pasta Leange foi excluída do projeto TypeScript.

## Validação

Executar `powershell -NoProfile -File ./scripts/validar.ps1`. Evidências visuais
isoladas em `.local/harness/v2-visual/`, com dados fictícios, sem banco externo.
Conferir financeiro, perfis, cadastros, viagens, despesas, calculadora,
fechamentos e login nos dois temas e em desktop/mobile.

Detalhes de procedência e adaptações: `frontend/src/ui/v2/README.md`.
