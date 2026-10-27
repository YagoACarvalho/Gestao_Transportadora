# Cards e perfil de motoristas

## Fluxo

O módulo `#/motoristas` apresenta cada motorista em um card do kit, com avatar,
nome, situação, telefone, categoria e validade da CNH. Busca e filtros existentes
continuam disponíveis; editar, desativar e reativar mantêm os fluxos de confirmação.
A lista não consulta viagens ou despesas para cada card.

`Ver perfil` abre `#/motoristas?motoristaId={id}`. O atalho `Viagens` abre a mesma
página com `&aba=viagens`. O perfil contém três seções controladas pela URL:

- `cadastro`: dados completos e edição com o formulário existente.
- `viagens`: viagens atualmente vinculadas pelo ID do motorista, em qualquer fase,
  com filtro por período e situação, além de detalhes em diálogo.
- `remuneracao`: lançamentos automáticos das viagens vinculadas, valores previstos,
  separação da inclusão financeira e filtro por período.

Links diretos, voltar/avançar do navegador e retorno à lista são suportados.
Uma aba desconhecida abre Cadastro. Motoristas inativos continuam consultáveis.
Carregamento, erro recuperável, vazio e cadastro não encontrado são tratados.

## Dados e valores

O perfil usa os GET existentes de Motoristas, Viagens e Despesas. Viagens só são
consultadas ao abrir Viagens ou Remuneração; despesas só ao abrir Remuneração.
Trocar filtros locais não faz novas requisições. Atualizar perfil busca os dados
novamente. As falhas de viagens/despesas não impedem a consulta de Cadastro.

Não foi criado contrato de ganhos pagos. A interface apresenta **remuneração
prevista** e considera somente despesas com `origem = RemuneracaoMotorista`.
Não infere origem pela descrição ou categoria e não inclui lançamentos manuais,
despesas sem viagem ou lançamentos de viagens vinculadas a outro motorista.

O total previsto soma em centavos os valores já registrados pelo backend e
incluídos no financeiro. Desconsiderados compõem `Somente no histórico`, com
identificação individual. Canceladas respeitam a inclusão de cada lançamento.
Não recalcular 15% do agregado de fretes nem estimar valores retroativos.
Um valor ausente ou inválido deixa seu total correspondente indisponível.
Totais não aparecem como zero durante carregamento ou erro.

O período de viagens usa DataViagem; o de remuneração usa DataDespesa. Os limites
são inclusivos e as datas civis não são convertidas para UTC. Registros sem data
entram apenas sem limites de período. Período invertido suspende os resultados
até correção; o filtro de situação de viagens não altera os totais de remuneração.

**Limite de atribuição:** o modelo atual vincula a despesa à viagem e não guarda
um beneficiário histórico independente. O perfil associa lançamentos ao motorista
atualmente vinculado à viagem. Uma troca de motorista altera essa associação.
A interface informa esse limite; os dados não comprovam ganhos históricos pagos.

## Implementação e verificação

- `frontend/src/ui/PersonCard.*`: composição reutilizável usando Card e Avatar.
- `features/motoristas/MotoristasCards.tsx`: ações e dados de cada motorista.
- `features/motoristas/perfilMotorista.ts`: seleção por ID, período e totais.
- `pages/MotoristaPerfilPage.tsx`: consulta, seções, filtros, detalhes e edição.
- `app/AppShell.tsx`: parâmetros do perfil, título e foco na navegação.

O harness oficial `powershell -NoProfile -File ./scripts/validar.ps1` terminou
com código 0 em 27/10/2026: 188 casos backend descobertos, executados e aprovados;
175 testes frontend executados e aprovados. Zero reprovados e ignorados.
TypeScript e builds aprovados. Os 20 novos testes cobrem seleção, somas, exclusões,
estados de consulta, edição, cards, links e histórico das abas.
Avisos existentes de Recharts em jsdom, dependência descontinuada e diretivas do
Motion no bundle continuam nos logs, sem alteração das dependências.

Logs e TRX: `.local/harness/test-results/83f73699a5ae4b6ebf99f7caeef5ea9d/`.
Revisão visual: 18 cenários aprovados no Chrome, a 1440 e 360 px, sem exceções
JavaScript ou transbordamento da página. Foram conferidos dados de motoristas
distintos, valores incluídos/desconsiderados, filtros, histórico, erros, vazios,
contenção de foco, edição e retorno de foco por Escape.
Capturas e relatório: `.local/harness/perfil-motorista/`.

A revisão visual usa dados fictícios identificados em uma página local ignorada
pelo Git; não acessa bancos ou sessões reais. A API em execução foi preservada.
Não há alterações de backend, esquema, migrations, dependências ou contratos HTTP.
As alterações permanecem sem commit, junto à reformulação visual anterior.
