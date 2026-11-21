# Design system vigente: Leange

A migracao integral do frontend foi autorizada pelo usuario. Esta decisao substitui
as diretrizes visuais Ultraleads anteriores; nao altera regras de negocio ou API.

## Fonte de verdade

- Componentes: `frontend/src/ui/`, primitivas portadas em `ui/leange/`.
- Origem: DCSEmpresarial/LEANGE_sistema-erp, commit 140ce44332854c64a2151a17aede69e9dcdecaf2.
- Tokens: `ui/leange/src/styles/tokens.css` e extensoes semanticas em `ui/tokens.css`.
- Tipografia: Inter Variable, arquivo de fonte servido pelo proprio projeto.
- Temas: Claro, Escuro e Sistema; preferencia local preservada em gt.ui.theme.

Usar botoes, cards, badges, campos, tabelas e Dialog exportados pelo kit. Os
layouts de dominio continuam compondo esses componentes e os mesmos contratos.
Nao adicionar cores ou fontes de outro kit, nem restaurar tokens --ul-*.

## Layout e acessibilidade

Navegacao lateral no desktop, menu modal no mobile, cabecalho e conteudo fluido.
Superficies neutras, tipografia e cantos do kit Leange. As telas permanecem
responsivas em 360 px; tabelas tem rolagem local. Foco visivel, controles rotulados,
reduced-motion e retorno de foco dos dialogs permanecem obrigatorios.

Botoes de navegacao usam ancoras, sem dependencia de Next.js. Campos e seletores
preservam validacao nativa e eventos; nenhuma mascara ou regra de dados nova foi
introduzida. Tabelas preservam os totais, filtros e a semantica original.

## Dependencias

Emotion React/styled, Phosphor Icons, react-number-format e Inter Variable.
Motion foi removido por nao ser mais utilizado. React, Vite, Supabase, Leaflet e
Recharts permanecem; o ERP tambem usa Recharts. Nenhuma dependencia de servidor,
banco, IA, pagamentos ou Next.js do ERP foi trazida.

## Verificacao

Testes de fluxo preservados; testes de controles atualizados para a biblioteca
ativa. Vitest usa dois workers e timeout de 15 s para a renderizacao Emotion no
jsdom, evitando disputa de recursos nas consultas de acessibilidade.
Evidencias visuais isoladas em .local/harness/leange-visual/, sem dados reais ou
banco externo. Revisao nos dois temas em desktop/mobile, incluindo perfis,
calculadora, fechamentos, login e modal.

O kit original em src/ui/ na raiz e apenas arquivo historico, nao e importado no
frontend. Detalhes de procedencia/adaptacoes em frontend/src/ui/leange/README.md.
