# Design system — Gestão de Transportadora

## Direção vigente

A reformulação completa usa o kit Ultraleads recebido pelo usuário. Esta direção
substitui a paleta e o layout anteriores. A referência original permanece em
`src/ui/`; a implementação utilizada pelo React está em `frontend/src/ui/`.

A interface combina fundo cinza claro, painel de trabalho arredondado, cartões
claros e navegação horizontal em pílulas. Azul-marinho estabelece hierarquia,
ciano identifica ações e menta sinaliza resultados positivos. Não há novas
regras de negócio ou contratos HTTP nesta reformulação.

## Tokens e componentes

Todas as cores, famílias tipográficas, raios, sombras e espaçamentos visuais
partem de `frontend/src/ui/tokens.css`, com prefixo `--ul-*`. O antigo arquivo
`styles/tokens.css` somente importa esses tokens, sem aliases do design antigo.

- Fonte: `Plus Jakarta Sans`, com fallback local Inter e fontes de sistema.
  O arquivo da fonte não está distribuído no repositório; não há download de fontes
  de terceiros no navegador. A família efetivamente usada depende da instalação local.
- Fundo: `--ul-bg-page`; painel: `--ul-bg-surface`; cartões: `--ul-bg-card`.
- Hierarquia: `--ul-navy-600`; ações: `--ul-cyan-600`, com contraste para texto branco.
- Sinais positivos: `--ul-mint-100` e `--ul-mint-700`; negativos: `--ul-red-*`.
- Raios: `--ul-radius-lg` em cartões, `--ul-radius-xl` no painel e `--ul-radius-full`
  em botões, badges e navegação. Controles de entrada usam `--ul-radius-sm`.
- `AppShell` e `PageHeader` estruturam as telas, incluindo autenticação.
- `Card`, `Grid`, `Badge`, `Avatar`, `Button`, `LinkButton` e `Tabs` compõem os módulos.
- `CollectionHeader`, `CollectionSummary` e `EmptyState` padronizam consultas.
- `ChartBar` fornece a forma arredondada dos gráficos com raios do kit.

Os componentes são compartilhados; estilos específicos continuam em CSS Modules.
Não adicionar cores literais em telas nem importar o CSS global do kit original.
No máximo um cartão de destaque navy por tela. Não adicionar animações decorativas.

## Telas e comportamento

- Motoristas e Caminhões: totais do conjunto carregado, busca, filtro de situação,
  avatares quando aplicáveis, badges e ações de cadastro, edição e situação.
  A consulta de ativos não permite deduzir o total de inativos; nenhum total global
  é inferido a partir dela.
- Viagens: resumo por andamento, atalhos de situação sincronizados com o select,
  período, percurso, ações de transição e detalhes. Dados, confirmação, despesas e
  remuneração seguem as regras existentes da API.
- Despesas: resumo por vínculo, filtros, inclusão financeira e formulários existentes.
- Financeiro: período, saldo previsto, fretes e despesas em cards do kit; remuneração
  destacada como parcela já incluída. Gráficos usam Recharts sob demanda, cores do
  kit e valores textuais alternativos. Valores negativos permanecem consultáveis.
- Acesso: identidade visual compartilhada para login, recuperação, definição de
  senha, sessão pendente, acesso negado, erro e ausência de configuração.

Contagens exibem um traço durante carregamento ou erro, sem apresentar zero falso.
Dados ilustrativos do `ExamplePage.tsx` não são usados na aplicação.

## Responsividade e acessibilidade

O grid vira uma coluna abaixo de 900 px. A navegação passa a um menu em diálogo;
resumos ficam compactos no celular. Tabelas mantêm semântica e rolagem horizontal
restrita à região dos dados, sem alargar a página. Formulários e confirmações usam
diálogos nativos, com contenção de foco, Escape quando não há envio e retorno ao
acionador. Todos os botões usam o componente do kit; submissões têm tipo explícito.

Manter nomes acessíveis, labels, mensagens de status e erro, foco visível em
controles e `prefers-reduced-motion`. Rótulos e valores distinguem as séries além
da cor. Gráficos vazios ou incompatíveis com valores negativos têm explicação textual.

## Verificação

Executar o harness oficial documentado em `desenvolvimento.md`. Revisão visual
isolada usa dados fictícios identificados, sem acessar banco ou autenticação real.
Capturas e relatórios da reformulação ficam em `.local/harness/reformulacao-visual/`.
A validação visual isolada não comprova configuração Supabase, PostgreSQL ou deploy.
