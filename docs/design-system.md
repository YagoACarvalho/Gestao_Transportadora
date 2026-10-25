# Design system — Gestão de Transportadora

## Direção aprovada e escopo

Sistema operacional de logística minimalista, com clareza, produtividade e identidade
própria. Sidebar escura e área de trabalho clara; priorizar tabelas e formulários úteis.
React, TypeScript, CSS Modules e Motion; Vite apenas para desenvolvimento e build.
Backend existente ASP.NET Core 10. Este documento não autoriza implementar React,
instalar dependências ou alterar contratos HTTP.

A paleta inicial e Inter estão aprovadas. Nome de marca, logotipo e refinamentos
definitivos continuam sob decisão do desenvolvedor. Esboços anteriores são referências,
não especificações pixel-perfect. Ajustes de composição e responsividade são esperados;
mudanças significativas de direção exigem aprovação.

## Tokens de referência

Os nomes abaixo orientam futuras variáveis CSS compartilhadas; nenhum CSS é criado
nesta etapa. Tokens adicionais são propostas operacionais iniciais, sujeitos à revisão
visual, sem substituir a paleta aprovada.

| Token | Valor | Uso |
| --- | --- | --- |
| `--color-deep` | `#172B3A` | Sidebar, títulos e texto principal |
| `--color-primary` | `#24647A` | Ação principal, links e foco em superfícies claras |
| `--color-background` | `#F4F6F8` | Fundo da área de trabalho |
| `--color-surface` | `#FFFFFF` | Formulários, tabelas e painéis |
| `--color-accent` | `#EA9149` | Destaque pontual, com texto azul profundo |
| `--color-text-muted` | `#52616B` | Texto secundário em superfícies claras |
| `--color-border` | `#647682` | Limites de controles em superfícies claras |
| `--color-success` | `#166534` | Sucesso, acompanhado de texto/ícone |
| `--color-warning` | `#854D0E` | Atenção, acompanhada de texto/ícone |
| `--color-error` | `#B91C1C` | Erro, acompanhado de descrição e recuperação |

Use texto branco sobre azul profundo, azul-petróleo e fundos semânticos acima;
use azul profundo sobre o laranja. Não use branco sobre o destaque laranja nem
laranja como texto pequeno sobre branco. Verifique combinações reais: texto normal
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
| Raios | 8px em controles, 12px em painéis |
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
- Botões: primário azul-petróleo com texto branco; secundário com limite visível;
  ação destrutiva identificada pelo significado e texto. Laranja é destaque, não
  substituto automático de todos os botões primários.
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

## Revisão e decisões abertas

Antes da implementação, relacionar a tela ao fluxo real e à direção já aprovada;
pedir aprovação para desvios significativos, sem solicitar novamente decisões vigentes.
Após implementar, revisar no navegador hierarquia, espaçamento, contraste, responsividade,
teclado, foco, estados e operações reais. Relatar evidências e lacunas honestamente.
O harness .NET não substitui verificações React/TypeScript nem revisão visual.

Pendências: marca/logotipo, distribuição da Inter, refinamento dos tokens adicionais,
densidade e breakpoints conforme conteúdo, além de regras de negócio e endpoints
ainda não aprovados. Não decidir essas questões silenciosamente na interface.
