# Remuneração automática de motoristas

## Regra aprovada

Novas viagens geram remuneração prevista de 15% do frete. O backend calcula com
decimal e arredonda por viagem para duas casas, com meio centavo para cima
(MidpointRounding.AwayFromZero). Frete 1500,50 gera 225,08; frete 0,10 gera 0,02.
O total é a soma dos lançamentos arredondados, não 15% do agregado dos fretes.
Não confirma pagamento ou recebimento e não cria contas bancárias ou folha salarial.

Sem frete, frete zero ou remuneração arredondada zero não geram novo lançamento.
Quando já existe lançamento automático e o frete passa a zero/ausente, o lançamento
permanece com valor zero, preservando ID, DataCadastro e ConsiderarNoFinanceiro.
Voltar a informar frete positivo atualiza esse mesmo lançamento, sem reincluir
automaticamente despesas desconsideradas. DataDespesa acompanha DataViagem.
Recalcular respeita as restrições existentes: frete e data só editam em Planejada.

## Persistência e proteção

- Viagem tem GerarRemuneracaoAutomatica. DEFAULT FALSE preserva viagens anteriores;
  POST define true explicitamente, sem aceitar controle desse campo pelo cliente.
  Editar viagens antigas não gera remuneração retroativa.
- Despesa tem Origem: Manual ou RemuneracaoMotorista. DEFAULT Manual preserva os
  lançamentos anteriores, sem inferir origem a partir de descrição ou categoria.
- Índice único parcial (ViagemId, Origem), apenas para RemuneracaoMotorista com
  vínculo, impede duas remunerações automáticas na mesma viagem. O índice de vínculo
  anterior continua preservado. Não restringe despesas manuais da mesma categoria.
- Criação/edição da viagem e da remuneração usam a transação Serializable existente
  e um único SaveChanges; falhas não deixam viagem ou despesa parcialmente gravada.
- Cancelamento inclui a remuneração na escolha de manter/desconsiderar e na versão
  da prévia. O histórico é preservado, conforme cancelamento-financeiro.md.

Um lançamento manual adicional continua possível, inclusive com categoria parecida.
O sistema impede duplicação do lançamento automático, mas não tenta adivinhar se
uma despesa digitada manualmente corresponde ao mesmo pagamento.

## Contratos HTTP

- Respostas de viagens acrescentam gerarRemuneracaoAutomatica (boolean).
- Respostas de despesas acrescentam origem (string). POST de despesa cria somente
  Manual; não permite escolher RemuneracaoMotorista pela entrada.
- PUT/DELETE de despesa automática retornam 400. Seus dados e valor são controlados
  pelo frete e pela data da viagem; não é permitido excluir e recriar manualmente.
- PATCH `/api/Despesas/{id}/situacao-financeira` aceita somente
  `{ "considerarNoFinanceiro": true/false }`, campo obrigatório. Funciona também para
  despesas manuais; não altera valor, origem, vínculo, descrição ou data. Retorna
  204, 400 para entrada inválida, 404 se inexistente ou 409 para versão antiga.
  Autenticação/autorização iguais às demais rotas de negócio.
- O cliente envia no PATCH o If-Match obtido no GET da própria despesa. O filtro
  trata PATCH como escrita transacional e compara o ETag; assim como nos contratos
  anteriores, consumidores que omitem If-Match não têm proteção contra formulário antigo.
- Resumo financeiro acrescenta totalRemuneracaoMotoristas: soma das despesas
  automáticas incluídas, filtradas por DataDespesa. Já integra totalDespesasViagens
  e totalDespesas: não é subtraído uma segunda vez de lucro/saldo previsto.

## Interface

Formulário mostra prévia usando centavos inteiros, com arredondamento equivalente
ao backend, e aviso de ausência de geração retroativa em viagens antigas. A prévia
não é enviada como valor confiável; o servidor determina a remuneração.
Despesas identifica a origem automática, oculta exclusão e oferece somente situação
financeira para esses lançamentos. Financeiro destaca a parcela de remunerações
automáticas e informa sua inclusão no total. Gráficos por categoria continuam
incluindo essas despesas uma única vez, conforme período e ConsiderarNoFinanceiro.

## Migration e validação

Migration `20261027020000_AdicionarRemuneracaoMotorista`: duas colunas e um índice
único parcial; sem atualização retroativa de negócios. Snapshot e SQL Npgsql são
verificados sem conexão pelos testes. Após autorização específica, a migration foi
aplicada no mesmo Supabase de desenvolvimento: seis aplicadas, nenhuma pendente.
Colunas, defaults e índice único parcial foram conferidos nos catálogos do PostgreSQL,
sem criar lançamentos reais de teste. A API e o Vite locais ficaram em execução.
Em outros destinos, a aplicação exige autorização; não iniciar a nova API contra esquema anterior.
Rollback remove as colunas/índice e perde a identificação de origem; não executar
automaticamente. Não há novas dependências.

Harness isolado cobre limites/arredondamento, frete opcional/zero, atualização do
mesmo lançamento, preservação da exclusão financeira, viagens anteriores, tentativa
de forjar flags, PUT/DELETE bloqueados, PATCH com conflito, cancelamento, períodos,
total sem dupla contagem e rollback em falha de persistência. Testes frontend cobrem
prévia, proteção do formulário, PATCH/ETag e destaque no dashboard.
SQLite não comprova migrations ou concorrência PostgreSQL. Nenhum lançamento real
ou pagamento é criado pela validação; testes visuais usam dados isolados.
