# Viagens

## Regras aprovadas

Novas viagens exigem origem, destino, data civil, motorista e caminhão existentes.
Origem/destino respeitam o limite de 150 caracteres do mapeamento. Frete é opcional,
não negativo, com até duas casas decimais e até 9999999999,99 (numeric(12,2)). O
backend usa decimal sem arredondamento silencioso. O frontend aceita vírgula ou
ponto decimal, sem separadores de milhares; a moeda não foi definida.

O backend determina Planejada no cadastro, inclusive quando o cliente envia Status.
Os dados só podem ser editados enquanto a viagem persistida está Planejada, exceto
na regularização explícita de um registro sem situação (null, vazia ou só espaços).

| Atual | Próximas situações |
| --- | --- |
| Planejada | Em andamento, Cancelada |
| Em andamento | Pausada, Concluída, Cancelada |
| Pausada | Em andamento (retomar), Cancelada |
| Concluída | Planejada (reabrir) |
| Cancelada | Planejada (reabrir) |
| Sem situação | Planejada (regularizar, preenchendo os dados obrigatórios) |

Reabrir exige confirmação na interface e usa PUT com os dados atuais e status
Planejada. Não permite editar os dados no mesmo pedido; primeiro reabrir, depois
editar a viagem planejada. Preserva vínculos históricos inativos, despesas e suas
escolhas de inclusão financeira. O frete de uma cancelada volta aos totais previstos,
conforme os filtros de data. A tela informa esse efeito antes da confirmação.

Regularizar usa o mesmo PUT, exige os campos obrigatórios e valida novos vínculos
ativos. Não cria outra viagem, não altera automaticamente outros registros e não
converte situações desconhecidas preenchidas. Reabertura e regularização não
geram remuneração retroativa nem duplicam lançamentos. A flag de geração automática
permanece preservada. Não há nova rota, campo de contrato ou migration.

Pausar e retomar preservam dados, frete e despesas, inclusive a remuneração de 15%.
Uma viagem pausada precisa ser retomada antes da conclusão. Não há registro de
horários de pausa nem alteração de esquema nesta entrega. Despesas continuam
permitidas em todas as fases, inclusive Pausada.

Repetir a mesma situação sem alterar dados é idempotente. Cancelar não exclui a
viagem nem suas despesas. Novos vínculos exigem ativos; manter um vínculo existente
que foi desativado preserva o histórico. Não há novas regras de conflito de agenda,
CNH, distância ou datas passadas.

## Contratos preservados da main remota

Atualização: cancelamento com despesas usa confirmação versionada e exige escolha
financeira explícita. Os detalhes e as mudanças de contrato aprovadas estão em
[cancelamento-financeiro.md](cancelamento-financeiro.md); substituem o comportamento
anterior de manter despesas automaticamente nos totais.

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | /api/Viagens | 200 com coleção de Viagem |
| GET | /api/Viagens/{id:guid} | 200 com Viagem ou 404 |
| POST | /api/Viagens | 201 com Viagem e Location; 400 para entrada inválida |
| PUT | /api/Viagens/{id:guid} | 204; 400 para entrada/regra inválida; 404 se inexistente |
| DELETE | /api/Viagens/{id:guid} | Cancela preservando o registro: 204; 400 se situação não permitir; 404 se inexistente |

A entrada mantém os campos da main: origem, destino, dataViagem, motoristaId,
caminhaoId, valorFrete e status. POST aceita status mas o ignora para garantir
Planejada. PUT exige status explícito e todos os campos obrigatórios. As novas
validações e restrições de situação são mudanças comportamentais aprovadas: chamadas
que antes gravavam dados incompletos ou transições inválidas passam a retornar 400.

A resposta mantém as propriedades da entidade Viagem, incluindo motorista e caminhao
aninhados (ou null); não é substituída pelo DTO plano da branch original. GET inclui
as entidades relacionadas; POST pode retornar essas navegações nulas, como antes.
O frontend adapta a resposta internamente para exibir nomes/placas e faz cancelamento
pela confirmação versionada existente. A ordenação por data da viagem decrescente é preservada.

Datas civis usam YYYY-MM-DD, ids UUID e frete número JSON ou null. Erros de validação
usam ValidationProblem. Busca e filtros de situação/período inclusivo são locais.

## Dados anteriores e testes

O esquema anulável de viagens e as migrations existentes permanecem preservados.
A nova coluna financeira de despesas e sua migration estão documentadas em
cancelamento-financeiro.md. Campos antigos nulos aparecem como não
informados; situação desconhecida/nula não é convertida automaticamente. Início e
conclusão pelo PUT exigem os campos obrigatórios. Registros Planejada incompletos
podem ser completados por edição; cancelamento pelo DELETE não exige preencher
campos históricos, mas respeita as situações permitidas.

Despesas, Relatórios e seus contratos permanecem na base. O resumo financeiro
continua excluindo fretes de viagens canceladas e preservando suas despesas no
histórico; somente despesas incluídas entram nas somas. Testes isolados verificam
esse vínculo, a escolha no cancelamento e o CRUD de despesas.

O harness usa SQLite efêmero/Testing, sem User Secrets ou bancos externos. SQLite não
comprova PostgreSQL, migrations ou o certificado HTTPS real. Revisão visual e
persistência no Supabase continuam separadas. O cancelamento tem versão da prévia;
escritas usam o filtro transacional e ETags documentados em mvp.md.
