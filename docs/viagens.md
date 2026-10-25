# Viagens

## Regras aprovadas

Novas viagens exigem origem, destino, data civil, motorista e caminhão existentes.
Origem/destino respeitam o limite de 150 caracteres do mapeamento. Frete é opcional,
não negativo, com até duas casas decimais e até 9999999999,99 (numeric(12,2)). O
backend usa decimal sem arredondamento silencioso. O frontend aceita vírgula ou
ponto decimal, sem separadores de milhares; a moeda não foi definida.

O backend determina Planejada no cadastro, inclusive quando o cliente envia Status.
Os dados só podem ser editados enquanto a viagem persistida está Planejada.

| Atual | Próximas situações |
| --- | --- |
| Planejada | Em andamento, Cancelada |
| Em andamento | Concluída, Cancelada |
| Concluída | Nenhuma |
| Cancelada | Nenhuma |

Repetir a mesma situação sem alterar dados é idempotente. Cancelar não exclui a
viagem nem suas despesas. Novos vínculos exigem ativos; manter um vínculo existente
que foi desativado preserva o histórico. Não há novas regras de conflito de agenda,
CNH, distância ou datas passadas.

## Contratos preservados da main remota

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
pelo DELETE existente. A ordenação por data da viagem decrescente é preservada.

Datas civis usam YYYY-MM-DD, ids UUID e frete número JSON ou null. Erros de validação
usam ValidationProblem. Busca e filtros de situação/período inclusivo são locais.

## Dados anteriores e testes

O esquema anulável, todas as migrations e AppDbContext da main remota permanecem
inalterados. Não há atualização em massa. Campos antigos nulos aparecem como não
informados; situação desconhecida/nula não é convertida automaticamente. Início e
conclusão pelo PUT exigem os campos obrigatórios. Registros Planejada incompletos
podem ser completados por edição; cancelamento pelo DELETE não exige preencher
campos históricos, mas respeita as situações permitidas.

Despesas, Relatórios e seus contratos permanecem na base. O resumo financeiro
continua excluindo fretes de viagens canceladas e preservando as despesas, conforme
o comportamento remoto. Testes isolados verificam esse vínculo e o CRUD de despesas.

O harness usa SQLite efêmero/Testing, sem User Secrets ou bancos externos. SQLite não
comprova PostgreSQL, migrations ou o certificado HTTPS real. Revisão visual e
persistência no Supabase continuam separadas. Não foi adicionado controle otimista
por token de versão; validação da situação lida não serializa gravações simultâneas.
