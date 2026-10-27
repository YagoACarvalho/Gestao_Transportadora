# MVP operacional

## Decisões aprovadas

- Remuneração automática de motoristas: 15% por nova viagem, arredondamento por
  lançamento, sincronizada ao frete, sem retroatividade. Detalhes, contratos e
  migration pendente em [remuneracao-motoristas.md](remuneracao-motoristas.md).

- Motoristas: cadastro ativo; CPF opcional normalizado na API e na interface,
  removendo pontos, traços e espaços. Nome obrigatório também na edição.
- Caminhões: placa e modelo obrigatórios. Não acrescentar máscaras, unicidade
  ou validação de dígitos verificadores de CPF/CNH/placa.
- Reativação de motoristas/caminhões disponível na edição. O PUT continua
  enviando Ativo explicitamente. Omissão por outros consumidores continua false.
- Despesas: descrição, categoria, data e valor obrigatórios. Valor maior que zero,
  até duas casas decimais, máximo 9999999999,99. Descrição até 200 e categoria até
  50 caracteres, conforme esquema existente. Viagem é opcional e deve existir
  quando informada. Aceitar despesas em TODAS as fases: Planejada, Em andamento,
  Concluída e Cancelada. Nenhuma despesa é removida ao cancelar uma viagem.
  Cancelamento com despesas exige escolha manter/desconsiderar no financeiro;
  contratos e migration em [cancelamento-financeiro.md](cancelamento-financeiro.md).
- Exclusão de despesa é física, pelo DELETE existente, com confirmação na UI.
- Financeiro: manter o contrato `lucro`, mas apresentar como **saldo previsto**.
  Soma dos fretes de todas as viagens não canceladas (incluindo legados sem situação)
  menos despesas com ConsiderarNoFinanceiro=true. Não há contas a pagar/receber ou confirmação de pagamento.
- Períodos inclusivos: fretes pela DataViagem e despesas pela DataDespesa. Registros
  sem data entram apenas quando não há limites de período. Datas civis ISO, sem UTC.

## Contratos e persistência

Rotas e campos JSON existentes preservados. O resumo financeiro acrescenta
`totalDespesasViagens` (ViagemId preenchido) e `totalDespesasGerais` (ViagemId nulo).
A soma desses valores corresponde a `totalDespesas`; `lucro` mantém a semântica
legada de saldo previsto. Os mesmos limites inclusivos de DataDespesa se aplicam
a ambos os grupos, inclusive despesas mantidas de viagens canceladas. A situação
financeira acrescenta a migration descrita em cancelamento-financeiro.md.

DTOs agora retornam 400 antes de persistir
campos obrigatórios ausentes e entradas que excedam os limites existentes. Não há
índice novo ou limpeza. A coluna financeira nova tem DEFAULT TRUE para preservar
a inclusão dos registros anteriores, sem desconsiderar despesas retroativamente.

GET por id retorna ETag calculado dos campos escalares. O cliente retém a versão
e a envia em If-Match no PUT/DELETE. Uma versão antiga retorna 409 e mantém os
dados digitados no formulário. Feche o painel, atualize e revise antes de reenviar.
Clientes antigos sem If-Match continuam aceitos; não têm proteção contra formulários
antigos. Não há coluna de versão; o campo financeiro é independente do ETag.

Escritas usam transações Serializable. No PostgreSQL, conflitos de serialização,
deadlock e violações de vínculo/unicidade recebem 409, sem repetição automática.
Outras falhas recebem 500 com mensagem genérica e referência, sem SQL, detalhes do
driver ou credenciais na resposta. Não crie regras de unicidade a partir desse tratamento.
SQLite valida o pipeline e os conflitos de ETag; não comprova concorrência PostgreSQL.

Referências técnicas: [isolamento PostgreSQL](https://www.postgresql.org/docs/current/transaction-iso.html),
[filtros MVC](https://learn.microsoft.com/aspnet/core/mvc/controllers/filters?view=aspnetcore-10.0).

## Interface

- Motoristas e Caminhões: consulta, busca local, filtros, cadastro, edição,
  desativação com confirmação e reativação explícita na edição.
  A tabela de inativos também oferece Reativar, com confirmação, GET atualizado
  e PUT com Ativo=true preservando os outros dados e o ETag. Conflito não fecha
  o painel nem apresenta sucesso; voltar e reabrir consulta novamente o registro.
- Viagens: fluxo aprovado de cadastro/edição/transições, preservando históricos.
  Ver detalhes está disponível em qualquer situação, inclusive legados e viagens
  concluídas/canceladas, sem permitir editar dados nessas situações. Lançar despesa
  navega para `#/despesas?viagemId=...`, consulta a viagem atual e abre o formulário
  com o vínculo selecionado. Nenhuma gravação ocorre ao navegar. Viagem inexistente
  informa falha sem abrir um cadastro genérico. Em canceladas, a inclusão financeira
  continua exigindo escolha explícita no formulário.
- Despesas: consulta, busca por descrição/categoria/percurso, filtros por data e
  vínculo, total do filtro, cadastro, edição e exclusão confirmada. Filtros Todas,
  De viagens e Gerais tornam explícita a separação já existente. No formulário,
  tipo Geral envia ViagemId nulo; tipo De viagem exige selecionar uma viagem.
  Na edição, mudar o tipo altera apenas o vínculo e preserva o lançamento.
  Ações têm ícones decorativos com texto, foco visível e quebra de linha; tabelas
  mantêm rolagem localizada no celular. Remuneração automática oferece Situação
  financeira, com nome acessível correspondente, e não oferece exclusão manual.
- Resumo financeiro: período aplicado por ação explícita; carregamento e erro não
  são representados como totais zero. Sem período, usa todos os lançamentos.
  Atalhos de mês atual/anterior usam calendário local, sem converter datas civis
  para UTC. Painel com fretes, saldo, despesas de viagens e gerais, evolução mensal,
  categorias e os seis lançamentos mais recentes do período. A evolução considera
  apenas registros com data; a ausência de registros não produz séries fictícias.
  Dados legados sem valor aparecem como não informados na lista e zero na soma.
  Categorias permanecem livres, sem criar classificação ou rateio automáticos.

O resumo vem do endpoint financeiro; evolução, categorias e recentes são agrupados
na interface a partir dos GETs existentes. As consultas são independentes e não
constituem um snapshot transacional: escritas simultâneas podem produzir diferenças
temporárias. Reaplicar o período recarrega tudo. Falha nos detalhes preserva o resumo
e oferece nova tentativa.

O dashboard destaca saldo previsto acumulado (todo o histórico) ou do período,
fretes e soma das despesas incluídas, com divisão por vínculo. Gráficos Recharts
3.10.1, com react-is 19.3.1 alinhado ao React, são carregados sob demanda: barras
mensais, composição em rosca por tipo e barras por categoria. Versões fixadas no
manifest e lockfile, sem mudanças de API ou persistência nesta revisão.
Gráficos não animam e oferecem valores textuais/tabelas alternativas; ausência de
registros mostra estado vazio. Rosca só representa totais positivos com parcelas
não negativas: valores legados negativos permanecem explícitos no texto, sem
transformação em valores absolutos ou percentuais enganosos. Saldo negativo é
preservado; não se trata de saldo bancário ou lucro recebido.
Identidade visual e acessibilidade estão em [design-system.md](design-system.md).

As listas ainda são carregadas integralmente. Paginação no servidor exige desenho
e aprovação específica do contrato; não faz parte desta mudança. Não substituir
o contrato de array existente sem adaptar todos os consumidores e seus testes.

## Testes e CI

Executar `powershell -NoProfile -File ./scripts/validar.ps1` na raiz desta cópia.
O harness realiza restore/build/descoberta/testes .NET, npm ci, TypeScript, Vitest e
build Vite. Logs/TRX/JSON em `.local/harness/test-results/`. Nunca conecta ao banco
externo. A CI executa o mesmo fluxo em PRs para main e pushes na main, com ações
fixadas por SHA, permissões contents:read e sem secrets do Supabase.

Os testes cobrem validação, despesas em todas as fases, CPF normalizado,
reativação, contratos financeiros, conflitos por versão e erros sem detalhes internos.
Testes jsdom não comprovam foco modal nativo, responsividade ou comportamento visual.

## Operação e pendências

A sessão anterior confirmou quatro migrations aplicadas no desenvolvimento.
A migration de situação financeira foi aplicada após autorização específica no
mesmo Supabase de desenvolvimento: cinco migrations aplicadas, nenhuma pendente,
coluna boolean NOT NULL DEFAULT true confirmada. Isso não verifica outros destinos.
Os fluxos de cancelamento foram testados isoladamente; não foram criados ou
cancelados registros reais como parte da aplicação da migration.
A migration de remuneração também foi aplicada após autorização específica no
mesmo desenvolvimento: seis aplicadas, nenhuma pendente. API e Vite locais foram
deixados em execução. Não houve geração retroativa ou cadastro de teste real.
Motoristas foi reportado pelo usuário como validado no Supabase. A validação real
dos novos fluxos de Despesas/Financeiro/concorrência exige autorização separada,
destino confirmado e registros de teste identificáveis.

Autenticação Supabase Auth aprovada para uma transportadora, com usuários convidados
e mesmo acesso operacional. API exige JWT válido e usuário na lista permitida;
sem configuração não há acesso liberado. Login, recuperação, convite e logout
estão implementados. Configuração e validação reais ainda pendentes; detalhes
em [publicacao.md](publicacao.md). Não inventar usuários, papéis ou credenciais.

Para publicação futura: confirmar hospedagem; servir `frontend/dist` por HTTPS;
encaminhar `/api` ao backend na mesma origem; configurar conexão somente no servidor;
manter TLS validado; não usar o proxy de desenvolvimento ou `vite preview` como
servidor de produção. Definir e testar backup/restauração antes de depender de dados
reais. Nenhum deploy, alteração em Supabase ou restauração de backup foi executado.

Revisão de navegador: verificar cinco módulos em larguras estreita/larga, zoom,
rolagem localizada das tabelas, teclado, foco e retorno de foco dos diálogos,
Escape e bloqueio durante envio. Respeitar movimento reduzido.
Nesta revisão, capturas do Edge em ambiente isolado verificaram Financeiro em
desktop e viewport de 390px e Despesas em desktop. Os dados de teste estão apenas
em artefatos ignorados de revisão; não foram cadastrados no banco nem incluídos na
aplicação. Contrastes principais de texto superam 4,5:1 e bordas de controles 3:1.
Isso não comprova interação por teclado, foco modal nativo ou operação autenticada
com PostgreSQL. A dependência Playwright continua sem ser adicionada.
