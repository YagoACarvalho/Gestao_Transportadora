# Perfis operacionais e dashboard correlacionado

## Navegação

O Resumo financeiro mostra comparativos por motorista e caminhão, usando o
período aplicado no dashboard. Cada linha atribuída oferece acesso ao perfil.
Os links transferem o período e permitem navegar entre motorista, caminhão e
dashboard. O dashboard guarda o período aplicado na URL para restaurá-lo ao voltar.

O perfil existente do motorista ganhou a seção Operação e despesas; Cadastro,
Viagens e Remuneração continuam disponíveis. O perfil do caminhão é acessível
pela lista da frota e pelos comparativos. Inclui cadastro/editável, motoristas
das viagens, percursos, fretes previstos e despesas gerais/do veículo.

Filtros dos perfis atualizam os dados locais sem novas consultas; Atualizar
operação busca os dados novamente. Erros de consulta não são apresentados como
totais zerados. Não há alteração em rotas HTTP, banco ou dependências.

## Regras aprovadas

- Viagens: pela data da viagem, em todas as situações; canceladas aparecem na
  lista e na contagem, com frete explicitamente excluído do total.
- Fretes previstos: soma das viagens não canceladas, incluindo legado sem status.
  Não representam recebimentos ou pagamentos realizados.
- Despesas: pela data do lançamento, apenas quando incluídas no financeiro.
  A associação usa todas as viagens consultadas, mesmo fora do período filtrado.
- Motorista: despesas da viagem atualmente vinculada; custos gerais não são
  distribuídos entre motoristas. Remuneração soma os lançamentos automáticos
  armazenados, sem calcular retroativamente 15% dos fretes.
- Caminhão: despesas das viagens atualmente vinculadas mais custos gerais
  diretamente vinculados ao veículo. Os destaques de despesas gerais e remuneração
  já fazem parte dos gastos; não são subtraídos novamente.
- As duas visões são perspectivas do mesmo conjunto; seus totais não devem ser
  somados. Cada despesa entra uma vez em cada visão.
- Legado com ambos os vínculos usa a viagem para atribuição, sem dupla contagem.
- Sem vínculo reconhecido, usa Não atribuídos. Não infere IDs por nomes ou placas.
- Dados sem data entram apenas sem limites de período. Limites são inclusivos.
- Valores nulos ou não finitos tornam o total correspondente Não informado.
  O resumo legado da API trata nulos como zero; o detalhamento sinaliza a lacuna.

As correlações representam os vínculos atuais, não um beneficiário ou condutor
histórico imutável. Cadastros inativos permanecem consultáveis nos perfis.

## Implementação e limites

`features/financeiro/operacao.ts` concentra agrupamentos e URLs; ResumoPerfil e
RelacoesOperacionais reutilizam o cálculo e o kit visual nos perfis e dashboard.
As consultas continuam usando as listagens completas existentes. Para bases
grandes, uma etapa futura pode implementar agregação/paginação no backend,
mediante aprovação de novos contratos.

Testes cobrem atribuição por ID, datas independentes, cancelamento, desconsiderados,
custos diretos, remuneração, centavos, dados incompletos, recuperação de erros,
período na navegação, consulta/edição de inativos e roteamento do caminhão.
Revisão Chrome local em 1440 px e 360 px, nos temas claro/escuro: 20 verificações
de layout e navegação passaram sem exceções JavaScript. Evidências ignoradas em
`.local/harness/operacao-visual/`; dados exclusivamente simulados, sem banco externo.

Commit, push e publicação dependem de autorização separada. Não há migration.
