# Fechamentos e acertos preservados

Escopo aprovado em [plano-fechamentos.md](plano-fechamentos.md). A planilha foi usada
para entender o processo, sem importar seus registros ou adotar seus percentuais.

## Uso

Em Financeiro → Fechamentos, escolha período, motorista, caminhão, situações,
categoria e inclusão de despesas gerais. Clique em Consultar prévia, confira os
totais e os lançamentos, informe um título e use Salvar acerto conferido.
Salvar exige as duas datas; consultas podem usar período aberto. Atalhos de mês
usam o calendário local, seguindo a tela financeira existente.

Acertos salvos mantêm valores, nomes, placas, filtros e identificação do responsável
do momento do salvamento. Editar ou excluir os registros originais não recalcula
o histórico. A consulta atual continua mostrando os dados atuais. Não há edição ou
exclusão de acerto nesta entrega; uma nova conferência pode gerar outro acerto.
Períodos podem se sobrepor e os resultados do histórico não devem ser somados.

O resultado é fretes menos despesas incluídas no financeiro, não confirmação de
pagamento, recebimento ou lucro realizado. Salvar não altera viagens, despesas,
remunerações ou marcações financeiras e não faz lançamento contábil adicional.

## Regras de apuração

- Fretes usam DataViagem e despesas usam DataDespesa, com limites inclusivos.
  Uma despesa dentro do período pode pertencer a uma viagem de outro período.
- Sem limites, legados sem data podem aparecer. Com qualquer limite ficam fora.
  Valores nulos permanecem explícitos nos detalhes e contribuem com zero na soma.
- Viagens canceladas aparecem na conferência, mas não geram receita. Despesas
  delas ainda entram se ConsiderarNoFinanceiro=true e atenderem aos filtros.
- Sem situações selecionadas, todas são consideradas, incluindo legados. Ao
  selecionar situações, o filtro atua nas viagens e nos custos vinculados a elas,
  preservando os custos gerais compatíveis com os demais filtros.
- Motorista e caminhão combinam por interseção. Na despesa de viagem, os vínculos
  são os da viagem. Uma despesa geral pode ter caminhão, mas não recebe motorista
  por aproximação, descrição, placa digitada ou rateio.
- Filtro de motorista exclui gerais. Filtro apenas de caminhão pode incluir gerais
  do próprio caminhão. Sem motorista/caminhão, podem entrar os gerais da empresa.
  A opção Incluir despesas gerais controla a inclusão em todos esses casos.
- Categoria é opcional, exata e limita apenas as despesas. A interface avisa que
  esse resultado usa apenas parte dos custos, com os fretes dos demais filtros.
- Remuneração automática é detalhamento das despesas de viagens; nunca é subtraída
  de novo. Nenhum percentual de 4,5% ou 6,5% é aplicado no fechamento.

## API

Todos os endpoints exigem a política Transportadora existente. Não há novos papéis.

| Método / rota | Entrada / saída |
| --- | --- |
| POST `/api/fechamentos/previa` | Filtros → filtros normalizados, nomes dos vínculos selecionados, totais, viagens, despesas, avisos e versaoPrevia |
| POST `/api/fechamentos` | titulo, filtros com datas, versaoPrevia, chaveRequisicao UUID → 201, Location e acerto completo |
| GET `/api/fechamentos?pagina=1&tamanhoPagina=20` | Lista resumida por criação decrescente, com itens, pagina, tamanhoPagina e quantidadeTotal; tamanho máximo 100 |
| GET `/api/fechamentos/{id}` | Metadados e conteúdo preservado |

Filtros: dataInicial/dataFinal (datas ISO ou null), motoristaId/caminhaoId (UUID ou
null), situacoes (lista opcional), categoria (até 50 caracteres ou null),
incluirDespesasGerais (booleano obrigatório). Datas devem estar em ordem, situações
devem existir e vínculos selecionados precisam existir, podendo estar inativos.

Totais: totalFretes, totalDespesasViagens, totalDespesasGerais, totalDespesas,
totalRemuneracaoMotoristas, resultado, quantidadeViagens e quantidadeDespesas.
Os detalhes usam DTOs próprios; não alteram respostas de viagens/despesas existentes.

Status: 200 consulta, 201 salvamento e repetição idêntica, 400 validação,
401/403 autenticação/autorização, 404 acerto inexistente e 409 prévia alterada,
chave reutilizada com outra requisição ou conflito transacional de persistência.
Erros de campos usam ValidationProblemDetails; conflitos usam ProblemDetails.

## Consistência e reenvio

Prévia, salvamento e listagem paginada usam transações Serializable próprias. O
filtro genérico de edição existente não inclui este controller, evitando transações
aninhadas. Os totais saem dos mesmos lançamentos retornados na prévia.

A versão é um SHA-256 do conteúdo normalizado, com ordenação determinística e sem
timestamp de consulta. Ao salvar, a API apura novamente dentro da transação e compara
a versão; alterações relevantes provocam 409 sem gravar acerto. O cliente exige
nova consulta e conferência. Totais do navegador nunca são usados para persistência.

O navegador mantém a mesma chave de requisição após falha de rede para permitir
nova tentativa sem duplicar. A API busca usuário + chave antes de recalcular: pedido
idêntico devolve o mesmo acerto mesmo após alterações nas origens. Outra combinação
de título/filtros/versão com a mesma chave recebe 409. Um índice único protege também
requisições simultâneas; uma colisão pode retornar 409 e a repetição idêntica posterior
recupera o acerto já criado. Não há repetição automática de transações no servidor.

## Banco e publicação

Migration criada: `20261103030000_CriarFechamentos`. Adiciona somente a tabela
fechamentos, índice de criação e índice único usuário + chave de requisição.
Conteúdo preservado em texto JSON com versão de formato 1, produzido exclusivamente
no servidor. Sem chaves estrangeiras para as origens, sem backfill e sem alteração
dos lançamentos existentes. O Down remove a tabela e perde seu histórico; não executar
automaticamente.

**A migration não foi aplicada ao Supabase.** Não publicar esta versão antes de
aprovar separadamente a aplicação no destino correto e validar backup/restauração.
Não há migrations automáticas no startup ou no deploy. O resumo financeiro anterior
e os contratos existentes permanecem preservados. Nenhuma dependência adicionada.

## Verificação

Fluxo oficial: `powershell -NoProfile -File ./scripts/validar.ps1`. Testes HTTP com
SQLite isolado cobrem totais, filtros, datas, canceladas, remuneração única, versões,
reenvio, histórico após alterar/excluir origens, paginação e autenticação. Teste Npgsql
confere correspondência do snapshot e gera o SQL da migration sem abrir conexão.
Frontend cobre consulta explícita, invalidação, salvamento, reenvio, conflito,
histórico, paginação e falhas. Isso não comprova concorrência real PostgreSQL ou a
aparência no navegador. A ferramenta de navegador integrado não está disponível
nesta sessão; homologação visual em desktop/360 px continua separada.

### Resultado da validação isolada

Em 03/11/2026, o fluxo oficial concluiu com código 0: 248 testes backend
descobertos/executados/aprovados e 225 testes frontend aprovados em 29 arquivos,
sem reprovados ou ignorados; restore, builds e TypeScript aprovados.
Relatórios em `.local/harness/test-results/c7a2539c0e4147e8a3601ddbf9b1aae5/`
e log consolidado em `.local/harness/validacao-fechamentos-entrega.log`.
O build frontend mantém os avisos de diretiva `use client` do Motion, e testes
de gráficos existentes registram dimensões indisponíveis no jsdom. A migração
foi verificada sem execução de SQL em banco externo. Não houve push ou deploy
deste módulo, pois sua publicação depende da aprovação separada da migration.
