# Kit Leange adaptado para a transportadora

Origem autorizada pelo usuário: `DCSEmpresarial/LEANGE_sistema-erp`, commit
`140ce44332854c64a2151a17aede69e9dcdecaf2`. Os arquivos em `src/` mantêm a estrutura
de origem para identificar componentes, estilos e utilitários portados.

Componentes utilizados: Button, Card, Badge, Text, Spinner, VisuallyHidden,
FieldShell, Input, EmptyState, estilos de DataTable e SegmentedControl, além dos
utilitários de cantos, máscaras, ícones e classes. Tokens vêm do kit de origem.

Adaptações:

- Imports relativos para React/Vite, sem alias ou servidor Next.js.
- Links usam âncoras com navegação hash; não usam prefetch/useLinkStatus do Next.
- Card aceita seções sem título e expõe o corpo para os layouts do projeto.
- Input mantém controles e máscaras; não importa o seletor internacional de telefone
  e os serviços auxiliares do ERP. Os dados dos formulários não ganham novas máscaras
  automaticamente.
- Campos nativos de seleção, checkbox, radio e textarea são adaptadores em
  `../Fields.tsx`; preservam opções, validação, rótulos e teclado existentes usando
  os tokens/métricas Leange. Não importam os providers de menu e cobrança do ERP.
- `../Dialog.tsx` adapta a superfície modal ao dialog nativo, preservando contenção
  de foco, Escape, bloqueio durante salvamento e retorno ao acionador.
- `../Table.tsx` aplica os estilos de tabela Leange à marcação semântica existente,
  sem adicionar seleção de linhas, ordenação ou virtualização não solicitadas.
- Ícones são importados individualmente para evitar carregar todo o catálogo nos testes.

O entry point `../index.tsx` preserva a API de composição usada pelas telas, mas os
componentes visuais e tokens ativos agora são Leange. Não carrega o kit Ultraleads.
Os overrides da aplicação em `../tokens.css` incluem dimensões de layout e ajustes
de contraste; a fonte Inter Variable é servida localmente por Fontsource.
