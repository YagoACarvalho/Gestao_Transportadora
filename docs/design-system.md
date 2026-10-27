# Adaptação visual aprovada — kit Ultraleads

A direção azul-marinho, ciano e menta do kit recebido substitui a paleta verde
registrada abaixo. Os arquivos originais ficam em `src/ui/` como referência;
a implementação utilizada pela aplicação fica em `frontend/src/ui/`.

- Base: navy `#14305C`, ciano `#1FA0CE`, menta `#7CE3C1`, fundo `#E3E4E8`,
  superfície `#F5F8FC` e cartão `#FCFDFF`.
- Contraste: texto secundário `#52647B`, ação com texto branco `#08769D`,
  sucesso `#146452` e erro `#AF3334`; tons do anexo ajustados para AA.
- Fonte: Plus Jakarta Sans quando disponível localmente, com fallback do sistema.
  Sem importação de Google Fonts ou nova dependência.
- AppShell visual envolve a navegação existente; PageHeader compartilhado já
  atende todas as páginas. Autenticação, menu móvel, foco e URLs são preservados.
- UI adaptada usa CSS Modules; estilos antigos têm aliases para os tokens `--ul-*`.
  Viagens usa Card, Button e Badge. As demais telas migram incrementalmente.
- Bordas de controles permanecem perceptíveis; cartões suaves têm raios 20px,
  painel 28px e botões arredondados. Layout do Grid vira uma coluna abaixo de 900px.
- Dados da ExamplePage são ilustrativos e não entram na aplicação. Sem botões de
  menu sem ação, tabpanels simulados ou medidores sem dados reais.
- CSS respeita movimento reduzido e foco visível; Motion existente permanece.

## Registro anterior — referência histórica

# Design system — Gestão de Transportadora

## Direção aprovada e escopo

Sistema operacional de logística minimalista, com clareza, produtividade e identidade
própria. Sidebar escura e área de trabalho clara; priorizar tabelas e formulários úteis.
React, TypeScript, CSS Modules e Motion; Vite apenas para desenvolvimento e build.
Backend existente ASP.NET Core 10. Dependências, persistência e contratos HTTP
continuam exigindo autorização específica; o design system não amplia esse escopo.

A paleta verde, verde-limão, mostarda e branco e a fonte Inter estão aprovadas. Nome de marca, logotipo e refinamentos
definitivos continuam sob decisão do desenvolvedor. Esboços anteriores são referências,
não especificações pixel-perfect. Ajustes de composição e responsividade são esperados;
mudanças significativas de direção exigem aprovação.

## Tokens de referência

Os nomes abaixo correspondem às variáveis CSS compartilhadas. A composição usa
sidebar verde escura, seleção verde-limão e superfícies claras. O Financeiro concentra
o destaque visual no saldo previsto; tabelas e formulários mantêm a clareza operacional.

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-deep` | `#163B2B` | Sidebar, títulos, saldo e texto principal |
| `--color-primary` | `#2D6545` | Ação principal, links e foco em superfícies claras |
| `--color-background` | `#F4F6F0` | Fundo da área de trabalho |
| `--color-surface` | `#FFFFFF` | Formulários, tabelas e painéis |
| `--color-accent` | `#C5E86C` | Seleção e destaque, com texto verde escuro |
| `--color-mustard` | `#C5A136` | Barras de despesas, sem texto branco |
| `--color-text-muted` | `#526354` | Texto secundário em superfícies claras |
| `--color-border` | `#71816E` | Limites de controles em superfícies claras |
| `--color-divider` | `#DCE3D6` | Separadores decorativos de tabelas e cabeçalhos |
| `--color-soft` | `#EAF0E4` | Superfícies secundárias e filtros |
| `--color-success` | `#166534` | Sucesso, acompanhado de texto/ícone |
| `--color-warning` | `#854D0E` | Atenção, acompanhada de texto/ícone |
| `--color-error` | `#B91C1C` | Erro, acompanhado de descrição e recuperação |

Use texto branco sobre verde escuro e verde principal; use verde escuro sobre
verde-limão e mostarda. Não use branco sobre esses destaques nem os use como texto
pequeno sobre branco. Verifique combinações reais: texto normal
com contraste mínimo 4,5:1, texto grande 3:1 e limites/foco relevantes 3:1.
Não aplique opacidade em controles ou mensagens sem reavaliar contraste.
Na sidebar, foco e seleção precisam de tratamento claro sobre o fundo escuro.

| Grupo | Referência inicial |
| --- | --- |
| Fonte | `Inter, system-ui, sans-serif`; origem e distribuição da fonte a definir |
| Texto | 16px / entrelinha 24px |
| Texto auxiliar e labels | 14px / 20px; evitar texto operacional excessivamente pequeno |
| Título de seção | 20px / 28px, peso 600 |
| Título de página | 28px / 36px, peso 600; ajustar em telas pequenas |
| Pesos | 400 para conteúdo, 500 para labels/ações, 600 para hierarquia |
| Números | Alinhamento consistente; algarismos tabulares em colunas numéricas |
| Espaçamento | Unidade 4px; escala 4, 8, 12, 16, 24, 32, 40, 48px |
| Raios | 8px em controles, 12px na seleção da navegação, 20px em painéis |
| Controles | Altura inicial 40px; alvos confortáveis e operação por toque |
| Elevação | Bordas discretas; sombra reservada a sobreposições, sem decoração acumulada |

Não carregar fontes de terceiros nem instalar pacotes sem avaliar e autorizar a
forma de distribuição. A escala pode ser expressa em rem para respeitar preferências
de fonte; manter a base espacial de 4px.

## Layout e componentes

- Sidebar: navegação real, estado ativo com texto/forma além de cor e foco visível.
  Em telas menores, converter em navegação recolhível acessível sem ocultar ações essenciais.
- Cabeçalho de página: título, descrição curta útil e ação principal contextual.
  Permitir quebra e empilhamento; não reservar espaço para ações inexistentes.
- Conteúdo: margens adaptáveis na escala espacial, alinhamento comum entre cabeçalho,
  filtros e dados; evitar cards ou gráficos sem finalidade operacional.
- Tabelas: cabeçalhos semânticos, alinhamento numérico à direita, ações identificáveis,
  estados de carregamento/vazio/erro e conteúdo longo tratado. Não simular ordenação,
  paginação ou filtros sem suporte funcional. Em telas pequenas, permitir rolagem
  horizontal localizada ou outra apresentação que preserve contexto e ações.
- Formulários: labels persistentes, campos relacionados agrupados, erros junto ao campo,
  instruções necessárias e botão de envio protegido contra repetição. Não inventar
  obrigatoriedade, máscaras ou validações de negócio ausentes dos contratos aprovados.
- Botões: primário verde com texto branco; secundário com limite visível;
  ação destrutiva identificada pelo significado e texto. Verde-limão destaca a seleção
  na sidebar; mostarda distingue as despesas na evolução mensal.
- Feedback: alertas e badges com significado textual. Diálogos apenas quando úteis,
  com foco inicial, contenção de foco, fechamento e retorno ao acionador.
- Componentes React com props tipadas e responsabilidades claras; estilos em
  `.module.css`; tokens compartilhados em variáveis CSS. Reutilizar antes de abstrair.

## Estados, acessibilidade e movimento

Prever carregamento, vazio, erro recuperável, sucesso, validação, envio, desabilitado,
hover, foco e seleção quando aplicáveis. Estado vazio deve explicar a ausência e
oferecer ação real, sem preencher a tela com registros inventados. Dados de demonstração
só em contexto isolado explicitamente fictício, nunca como registros de produção.

Usar HTML semântico, labels associados, nomes acessíveis, teclado e mensagens
anunciadas quando necessário. Validar zoom, conteúdo longo, foco e contraste.
Adaptar por necessidade do conteúdo; verificar ao menos uma largura estreita e uma
larga, sem transformar larguras de referência em especificação pixel-perfect.

Motion deve apoiar feedback e continuidade: transições curtas e discretas, sem
animações contínuas decorativas, atrasos na operação ou efeitos em cada linha de tabela.
Respeitar `prefers-reduced-motion` no CSS e a preferência equivalente no Motion;
reduzir/remover deslocamentos e manter informação e funcionalidade sem animação.

Não usar gradientes decorativos excessivos, dashboards genéricos, métricas falsas,
conteúdo factual inventado ou componentes sem função.

## Gráficos financeiros

Saldo previsto, fretes e total de despesas lideram a leitura. O painel de saldo usa
verde escuro com valor verde-limão; mostarda identifica despesas nas barras e custos
gerais na composição. Legendas e valores distinguem as séries além da cor.
Recharts é carregado sob demanda. Barras mensais com tooltip, composição em rosca
por vínculo e barras por categoria usam o mesmo período dos indicadores.
Tabelas/valores textuais oferecem alternativa aos SVGs e tooltips; nomes completos
de categorias permanecem disponíveis mesmo quando abreviados no eixo do gráfico.
Gráficos sem animação evitam movimento desnecessário e respeitam movimento reduzido.
Não criar percentuais de crescimento sem consulta comparativa nem confundir frete
previsto com recebimento. Valores zerados não geram uma rosca artificial.

## Revisão e decisões abertas

Antes da implementação, relacionar a tela ao fluxo real e à direção já aprovada;
pedir aprovação para desvios significativos, sem solicitar novamente decisões vigentes.
Após implementar, revisar no navegador hierarquia, espaçamento, contraste, responsividade,
teclado, foco, estados e operações reais. Relatar evidências e lacunas honestamente.
O harness .NET não substitui verificações React/TypeScript nem revisão visual.

Pendências: marca/logotipo, distribuição da Inter, refinamento dos tokens adicionais,
densidade e breakpoints conforme conteúdo, além de regras de negócio e endpoints
ainda não aprovados. Não decidir essas questões silenciosamente na interface.
