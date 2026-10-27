# Cancelamento de viagens e despesas

## Regra aprovada

Cancelar não apaga a viagem nem os lançamentos. Quando houver despesas, o usuário
escolhe explicitamente entre manter todas no financeiro ou desconsiderar todas.
Sem seleção inicial; a tela mostra quantidade e soma de todas as despesas vinculadas.
Sem despesas, a confirmação não exige essa escolha. Viagens concluídas não cancelam.

Despesas desconsideradas ficam no histórico, com identificação visível; não entram
nos totais, categorias, evolução mensal ou últimos lançamentos financeiros. O total
do filtro da tela Despesas soma apenas as incluídas. A edição permite reincluir.
Editar outros campos ou trocar vínculo não reinclui um lançamento automaticamente.
Novas despesas em viagens já canceladas exigem escolha explícita de inclusão.
Em outras viagens ou despesas gerais, cadastrar sem escolha mantém o padrão true.

## Contratos

- GET `/api/Viagens/{id}/cancelamento`: 200 com `quantidadeDespesas`, `totalDespesas`
  e `versaoDespesas`, ou 404. A versão inclui os campos escalares da viagem e de
  todas as despesas vinculadas, ordenadas por ID, inclusive situação financeira.
- POST no mesmo caminho: JSON `versaoDespesas` (obrigatório) e `manterDespesas`
  (booleano obrigatório quando houver despesas). Retorna 204, 400 para escolha
  ausente/situação inválida, 404 se inexistente e 409 se a prévia estiver desatualizada.
- DELETE da viagem e PUT passando para Cancelada retornam 400 quando houver
  despesas e a viagem ainda não estiver cancelada. Usar o POST acima nesse caso.
  Sem despesas, preservam o comportamento existente. Repetir cancelamento não
  reaplica a escolha, preservando despesas lançadas ou editadas posteriormente.
- Despesa acrescenta `considerarNoFinanceiro` booleano nas respostas. POST/PUT
  aceitam o campo opcional/anulável. POST de viagem cancelada sem escolha retorna
  400. PUT omitido/nulo preserva o valor; false exclui das somas, true reinclui.
- Rotas continuam protegidas pela autenticação e autorização operacional existentes.

O filtro global já envolve POST em transação Serializable. Validações precedem as
alterações e SaveChanges grava viagem e despesas juntos. Falha desfaz ambas;
conflitos retornam 409 sem repetição automática. SQLite valida atomicidade e versão,
mas não comprova concorrência do PostgreSQL.

## Migration e ativação

`20261027010000_AdicionarSituacaoFinanceiraDespesa` acrescenta somente a coluna
`despesas.considerar_no_financeiro`, boolean NOT NULL DEFAULT TRUE. Assim, despesas
anteriores, inclusive de viagens já canceladas, continuam incluídas. Não há remoção
de lançamentos ou reclassificação retroativa. Down remove a coluna e perde apenas
as decisões de inclusão; não deve ser executado automaticamente.

A migration foi escrita sem inicializar a aplicação ou consultar User Secrets.
Teste com provider Npgsql verifica snapshot/modelo e gera o SQL em memória, sem
abrir conexão. Isso não aplica nem comprova a migration em um banco real.

Aplicar no PostgreSQL exige etapa separada: confirmar destino de desenvolvimento,
revisar SQL, backup e autorização. A nova API não deve iniciar contra banco que
ainda não tenha essa coluna. Atualizar API e frontend de forma coordenada após a
migration. Não iniciar o sistema automaticamente enquanto essa etapa estiver pendente.

Aplicação autorizada concluída no projeto Supabase de desenvolvimento já confirmado:
cinco migrations aplicadas e nenhuma pendente; tipo, nulabilidade e DEFAULT da coluna
verificados em information_schema. Somente a migration acima foi aplicada, sem
alterações individuais de lançamentos, sem limpeza e sem rollback. Não foi gerado
backup nesta operação. A API e o Vite locais foram reiniciados após a verificação.

## Validação

Harness oficial em SQLite efêmero: escolha manter/desconsiderar, bloqueio das rotas
legadas com despesas, criação em cancelada, preservação/reinclusão, versão antiga
após inclusão/edição/exclusão, rollback, idempotência e autenticação das novas rotas.
Frontend: escolha obrigatória, envio versionado, conflito sem sucesso falso,
histórico, total filtrado e remoção de despesas desconsideradas dos indicadores.
Build/testes não usam PostgreSQL, SMTP ou credenciais reais.
