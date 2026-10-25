# Viagens

## Regras aprovadas

Novas viagens exigem origem, destino, data civil, motorista e caminhão existentes.
Origem/destino respeitam o limite de 150 caracteres do mapeamento. Frete é opcional;
quando informado deve ser não negativo, ter no máximo duas casas decimais e caber
em numeric(12,2): até 9999999999,99. O backend usa decimal e não arredonda entradas.
O frontend aceita vírgula ou ponto decimal, sem separadores de milhares. Não foi
definida moeda; a interface apresenta o valor decimal, sem assumir símbolo monetário.

O backend determina a situação inicial como `Planejada`. Transições:

| Atual | Próximas situações |
| --- | --- |
| Planejada | Em andamento, Cancelada |
| Em andamento | Concluída, Cancelada |
| Concluída | Nenhuma |
| Cancelada | Nenhuma |

Repetir a mesma situação sem alterar dados é idempotente. Alterar os dados só é
permitido quando a situação persistida ainda é Planejada. O backend verifica as
regras mesmo que o cliente envie um PUT diretamente. Não existe exclusão de viagens;
cancelar preserva o registro. Não há retorno de viagens encerradas para Planejada.

Novo vínculo exige motorista/caminhão ativo. Se um vínculo existente for desativado
posteriormente, o histórico é preservado: a viagem continua consultável e pode
manter o mesmo vínculo durante edição ou transição. Substituir o vínculo exige
outro cadastro ativo. Nenhuma regra adicional de disponibilidade, conflito de agenda,
CNH, distância ou datas passadas foi criada.

## Contratos HTTP

| Método | Caminho | Resultado |
| --- | --- | --- |
| GET | /api/Viagens | 200 com coleção |
| GET | /api/Viagens/{id:guid} | 200 ou 404 |
| POST | /api/Viagens | 201 com resposta e Location; 400 para entrada inválida |
| PUT | /api/Viagens/{id:guid} | 204 sem corpo; 400 para entrada/regra inválida; 404 se inexistente |

POST recebe `origem`, `destino`, `dataViagem`, `motoristaId`, `caminhaoId` e
`valorFrete`. PUT recebe todos esses campos e `status` explicitamente. Omissão
de um campo obrigatório produz 400. Datas usam `YYYY-MM-DD`, sem fuso horário.
Identificadores usam UUID; `valorFrete` é número JSON ou null.

A resposta plana contém `id`, os campos de entrada, `status`, `dataCadastro` e
`motoristaNome`, `motoristaAtivo`, `caminhaoPlaca`, `caminhaoAtivo`. Não retorna
entidades relacionadas completas. Erros 400 usam ValidationProblem com `errors`
por campo. O cliente trata 204 sem tentar interpretar JSON.

Listagem ordena pela data da viagem e cadastro decrescentes, com id como desempate.
Busca e filtros de situação/período inclusivo são locais à coleção carregada.
Não há paginação, indicadores ou dados de demonstração na aplicação.

## Registros anteriores e verificação

O esquema existente permanece anulável. Nenhuma migration ou atualização em massa
é executada. A resposta mantém campos nulos, e a tela os identifica como não
informados. Situação desconhecida/nula não é convertida automaticamente. Registros
incompletos não recebem ações de transição; se Planejada, podem ser completados
pela edição antes de prosseguir. Registros em outras situações são consultáveis.

Testes HTTP usam ApiFactory com SQLite em memória, sem PostgreSQL ou User Secrets.
Cobrem o ciclo, transições, bloqueio de edição, campos obrigatórios, frete,
vínculos inválidos/inativos, histórico, legado nulo e 404. Os testes React verificam
contratos, filtros, formulários, confirmação, falhas e navegação. O harness valida
os módulos juntos. Verificação visual e persistência no Supabase são etapas separadas.

Concorrência entre gravações simultâneas não possui controle otimista com token de
versão nesta entrega. O backend valida a situação lida para a operação; isso não
equivale a garantir serialização de alterações simultâneas por múltiplos usuários.
