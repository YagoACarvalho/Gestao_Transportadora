# Proposta: consulta e histórico de fechamentos

Status: aprovado pelo usuário em 03/11/2026, incluindo criação da tabela/migration
e novos contratos HTTP. Aplicação no Supabase e publicação continuam separadas.

## Objetivo e decisões confirmadas

O usuário confirmou que despesas reduzem o resultado da operação e que fechamento
pode ser consultado e também salvo como acerto, preservando histórico. Percentuais
de acréscimo da planilha não serão aplicados automaticamente. Os lançamentos atuais
de viagens, despesas e remuneração de 15% continuam sendo a origem dos valores.

Resultado do fechamento significa fretes menos despesas incluídas no financeiro.
Não comprova recebimento, pagamento ou lucro realizado; o aplicativo ainda não tem
controle de liquidação. Categoria semelhante não autoriza somar remuneração duas vezes.

## Fluxo proposto

1. Abrir Fechamentos na área financeira e escolher os filtros.
2. Consultar a prévia com totais e os lançamentos que compõem esses valores.
3. Conferir título, período e filtros e acionar Salvar acerto.
4. A API verifica se a prévia ainda corresponde aos dados atuais e salva uma cópia
   dos filtros, totais, lançamentos e identificação de quem salvou.
5. Consultar acertos anteriores e seus detalhes sem recalcular os valores salvos.

Salvar exige título e datas inicial/final explícitas, inclusivas. A consulta pode
usar datas abertas, como o financeiro atual. Não haverá edição/exclusão do acerto
nesta primeira entrega. Correções nos lançamentos originais aparecem nas próximas
consultas; um novo acerto pode registrar a revisão, sem substituir o anterior.

Acertos podem usar períodos sobrepostos. São relatórios independentes, não novos
lançamentos; a interface não deve somar o histórico como se fosse receita/despesa.
Salvar também não altera a situação de viagens ou despesas nem confirma pagamento.

## Filtros e cálculo

- Datas inicial/final: fretes por DataViagem e despesas por DataDespesa, mantendo
  o regime atual. Sem limites, legados sem data podem aparecer; com qualquer limite,
  os sem data não entram. Ao salvar com período fechado, a interface avisa sobre isso.
- Motorista e caminhão: opcionais e combináveis por interseção. Motorista de uma
  despesa é identificado pela viagem vinculada, sem inferência por texto/categoria.
- Situações das viagens: seleção opcional entre situações existentes; sem seleção,
  todas ficam disponíveis para conferência, mas fretes cancelados não geram receita.
  Despesas de canceladas mantidas no financeiro continuam obedecendo sua marcação.
- Categoria da despesa: opcional, correspondência exata, afeta somente despesas.
  A interface identifica quando o resultado contém apenas uma categoria de custos.
- Despesas gerais: opção explícita de inclusão. Quando há filtro de motorista,
  custos sem vínculo a viagem não são atribuídos a ele, nem rateados. Quando há
  filtro de caminhão sem motorista, custos gerais desse caminhão podem entrar,
  respeitando a opção de inclusão. Sem motorista/caminhão, a opção inclui os gerais
  da empresa. Despesas de viagem usam os vínculos da própria viagem.

Somente despesas com ConsiderarNoFinanceiro=true compõem o resultado. O resultado
separa fretes, despesas de viagens, despesas gerais e remuneração automática;
remuneração é um detalhamento das despesas de viagens, não outra subtração.
Combustível pode ser consultado pela categoria existente, sem tentar classificar
automaticamente categorias livres ou valores da planilha.

Cada consulta deve usar uma visão consistente dos dados, produzida no backend,
para os detalhes corresponderem aos totais. O servidor calcula os valores; não
aceita totais enviados pelo navegador como fonte de verdade.

## Contratos HTTP novos aprovados

Política de autenticação Transportadora existente, sem novos papéis.

Filtros: `dataInicial?`, `dataFinal?` (datas ISO), `motoristaId?`, `caminhaoId?`
(UUIDs), `situacoes?` (lista de situações), `categoria?` (até 50 caracteres),
`incluirDespesasGerais` (booleano explícito na entrada).

| Método / rota | Entrada | Resposta |
| --- | --- | --- |
| POST `/api/fechamentos/previa` | Filtros | 200: filtros normalizados, totais, lançamentos, avisos e `versaoPrevia` |
| POST `/api/fechamentos` | `titulo` obrigatório (até 150), filtros com datas definidas, `versaoPrevia` e `chaveRequisicao` (UUID) | 201 e Location: identificação e conteúdo do acerto salvo; repetição da mesma requisição retorna o mesmo acerto, sem duplicá-lo |
| GET `/api/fechamentos?pagina=1&tamanhoPagina=20` | Página positiva, tamanho 1–100 | 200: itens resumidos, página, tamanho e quantidade total |
| GET `/api/fechamentos/{id}` | UUID | 200: filtros, totais, lançamentos e metadados preservados |

Erros de validação: 400; autenticação: 401; usuário sem autorização: 403;
acerto inexistente: 404; prévia desatualizada ou reutilização incompatível da chave
de requisição: 409. Conflito exige consultar novamente e confirmar a nova prévia.
Respostas de validação seguem ValidationProblemDetails e não expõem detalhes internos.
Não alterar `/api/Relatorios/resumo-financeiro` ou contratos existentes.

## Persistência aprovada — aplicação no banco separada

Uma nova tabela `fechamentos`, com migration e atualização do snapshot EF:

- `id`: UUID, chave primária.
- `titulo`: texto obrigatório, máximo 150 caracteres.
- `data_inicial`, `data_final`: datas obrigatórias.
- `data_criacao`: timestamp UTC obrigatório.
- `usuario_id`: UUID do usuário autenticado.
- `chave_requisicao`: UUID para impedir duplicação por repetição do salvamento.
- `versao_formato`: inteiro para identificar o formato dos dados preservados.
- `conteudo_json`: texto obrigatório com filtros, totais e cópias dos lançamentos.
- Índice único de usuário + chave de requisição; índice de data de criação.

O conteúdo inclui IDs de origem e cópias dos nomes, placas, datas, categorias,
valores e situações necessários para interpretar o fechamento antigo. Não depende
de consultar os cadastros atuais para exibir nomes e valores antigos; exclusão ou
edição posterior dos lançamentos não modifica o acerto. Sem geração retroativa.

Essa aprovação autoriza criar a migration, não aplicá-la no Supabase. Aplicação no
banco e deploy continuam sendo etapas separadas, com destino e autorização próprios.

## Arquivos e impactos

- API: novos modelos/DTOs/controller e componente de apuração de fechamentos;
  `Data/AppDbContext.cs`, nova migration e snapshot. Revisar o filtro transacional
  existente para manter consistência e comparação da prévia na gravação.
- Frontend: nova página e módulo de fechamentos; navegação em AppShell/Sidebar;
  reutilizar componentes/tokens existentes e manter o resumo financeiro atual.
- Testes backend/frontend e documentação das regras e contratos.
- Nenhuma dependência adicional prevista. Sem importação automática da planilha.

## Riscos e validação

Principais riscos: dupla contagem de remuneração/despesas gerais, atribuição errada
de custos a motoristas, divergência entre prévia e gravação, duplicação por reenvio
e alteração retroativa do histórico. Cobrir filtros combinados, canceladas, legados,
períodos inclusivos, arredondamentos existentes, resultado negativo, repetição de
salvamento, conflito concorrente e preservação após editar/excluir as origens.

Testes HTTP isolados com SQLite, sem banco externo ou User Secrets. Verificar o
modelo/migration sem aplicação automática no PostgreSQL. Executar o fluxo oficial
`powershell -NoProfile -File ./scripts/validar.ps1`, revisar diff, status e arquivos
novos. Verificação PostgreSQL e homologação visual dependem de ambientes disponíveis
e devem ser relatadas separadamente, sem afirmar validação que não ocorreu.
