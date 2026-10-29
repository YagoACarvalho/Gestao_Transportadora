# Despesas gerais por caminhão

Uma despesa geral pode ter um caminhão opcional, sem viagem. Novos vínculos
exigem caminhão ativo existente; a edição preserva o vínculo atual mesmo após
desativação. É possível remover ou trocar por outro caminhão ativo.

Despesas de viagem continuam vinculadas ao caminhão pela própria viagem.
Enviar `viagemId` e `caminhaoId` simultaneamente retorna 400 com erro no campo
`caminhaoId`. Despesas automáticas mantêm as restrições de edição existentes.

## Contrato aprovado

- POST e PUT de `/api/Despesas`: novo `caminhaoId` UUID opcional/nulo.
- PUT com campo ausente ou nulo remove o vínculo direto; frontend envia nulo
  explicitamente ao selecionar despesa de viagem ou remover o caminhão.
- Respostas de despesas incluem `caminhaoId` e `caminhao`; listagem e consulta
  individual carregam o caminhão para exibir placa, modelo e situação.
- Rotas e códigos de sucesso permanecem os mesmos.
- Lançamentos anteriores permanecem sem vínculo direto. Não há preenchimento retroativo.
- Totais continuam baseados em cada despesa uma única vez. Sem viagem, continua
  classificada como geral, mesmo com caminhão associado.

## Interface

O formulário de despesa geral oferece caminhão opcional e recuperação de falha
da consulta. A lista mostra o caminhão e permite busca por placa/modelo e filtro
específico de caminhão da despesa geral. O filtro não infere caminhões de viagens.
O seletor preserva o caminhão inativo atual e não oferece outros inativos.

## Banco e publicação

Migration `20261029001926_VincularDespesaGeralCaminhao`: coluna nullable
`despesas.caminhao_id`, índice e FK para `caminhoes.id`, com SET NULL na exclusão
física. A operação normal de desativação não remove o vínculo. Snapshot e designer
acompanham a migration. Nenhuma migration é aplicada no startup.

Não aplicada ao Supabase. Antes de publicar este código, revisar e aplicar a
migration no destino confirmado, em etapa autorizada separadamente. A versão nova
consulta a coluna e não deve ser publicada antes dela existir. Reverter a migration
remove os vínculos registrados e exige planejamento próprio.

Testes HTTP usam SQLite isolado; isso não comprova aplicação no PostgreSQL.
