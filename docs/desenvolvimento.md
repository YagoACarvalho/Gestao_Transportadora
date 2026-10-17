# Ciclo de desenvolvimento e validacao

## Preparar e executar

Use PowerShell com SDK .NET 10 instalado e espaco livre. A raiz e identificada por
`GestaoTransportadora.slnx`; o script a resolve pelo proprio diretorio, sem depender
do diretorio atual. Neste workspace, mantenha o repositorio no G:, pois o C: tem
espaco critico. Nao e necessario iniciar PostgreSQL ou configurar User Secrets.

Na raiz, execute em um processo separado (nao use dot-sourcing):

```powershell
powershell -NoProfile -File ./scripts/validar.ps1
$LASTEXITCODE
```

Tambem e possivel usar `pwsh -NoProfile -File ./scripts/validar.ps1` quando instalado.
Nao altere politicas de execucao ou configuracoes globais para contornar bloqueios.

O script cria apenas artefatos ignorados em `.local/harness/`, `bin/` e `obj/`.
Nao limpa caches nem artefatos anteriores. Configura no processo e restaura em
`finally` os valores originais (inclusive ausencia) destas variaveis:

| Variavel | Destino relativo a `.local/harness/` |
| --- | --- |
| `NUGET_PACKAGES` | `nuget/packages` |
| `NUGET_HTTP_CACHE_PATH` | `nuget/http-cache` |
| `NUGET_SCRATCH` | `nuget/scratch` |
| `TEMP`, `TMP` | `tmp` |
| `DOTNET_CLI_HOME` | `dotnet-home` |

Tambem configura temporariamente opcoes do CLI para desabilitar telemetria,
notificacoes de workloads e geracao inicial de certificado ASP.NET.

## Sequencia oficial

1. `dotnet restore GestaoTransportadora.slnx`
2. `dotnet build GestaoTransportadora.slnx --no-restore`
3. `dotnet test tests/Transportador.Api.Tests/Transportador.Api.Tests.csproj --list-tests --no-build --no-restore`
4. `dotnet test tests/Transportador.Api.Tests/Transportador.Api.Tests.csproj --no-build --no-restore`, com log de console e TRX.

Cada etapa verifica o codigo de saida antes de continuar. Restore e build usam
verbosidade minimal. A descoberta conta nomes completos no namespace
`Transportador.Api.Tests`; se ele mudar, atualize o reconhecimento no script.
A referencia atual e 19 casos (4 Facts e 15 variacoes de 7 Theories), sem exigir
essa quantidade permanentemente. Pelo menos um caso deve ser descoberto e
executado. O TRX confirma total, executados, aprovados, reprovados e nao executados;
testes ignorados precisam ser avaliados na revisao, mesmo com saida zero.

Cada execucao possui diretorio exclusivo em `.local/harness/test-results/`, com
logs por etapa e `motoristas.trx`, evitando reutilizar resultados antigos.
Codigos do script: `0` sucesso; `10` infraestrutura/restore/descoberta/relatorio;
`20` compilacao; `30` testes reprovados. Leia o log para a causa concreta: por
exemplo, um problema de permissao durante o build aparece na etapa compilacao.
Zero testes, TRX ausente ou resultado inconclusivo falham como infraestrutura.

## Ciclo e revisao

1. Investigue AGENTS.md, estado do Git, arquivos afetados e consumidores.
2. Planeje objetivo, impactos, arquivos e validacao para mudancas significativas.
3. Aguarde aprovacao explicita para mudancas significativas, migrations, esquema,
   dependencias ou contratos HTTP. Autorizacao generica nao substitui aprovacao especifica.
4. Implemente somente o escopo aprovado; preserve alteracoes preexistentes.
5. Execute o fluxo de build e testes; registre comandos, warnings e resultados reais.
6. Revise `git diff --check`, `git diff --stat`, `git diff` e
   `git status --short --untracked-files=all`. Leia tambem arquivos novos, ausentes
   do diff comum; confira segredos sem revelar valores. Commit exige autorizacao.

## Limites e bloqueios

A suite chama diretamente os controllers e usa uma conexao SQLite em memoria por
caso, com `EnsureCreatedAsync` apenas nesse banco efemero. Nao executa migrations,
API, PostgreSQL, User Secrets ou operacoes em banco externo. Os testes do DTO
verificam DataAnnotations separadamente; nao comprovam HTTP 400 automatico.
SQLite nao valida SQL especifico do PostgreSQL, collation, limites de tipos ou
migrations. Rotas, binding, serializacao e cabecalhos exigem testes HTTP futuros.
Cadastro de motorista inativo e caracterizacao atual pendente de decisao de negocio.

Em bloqueio de rede (como NU1301) ou permissao, pare e registre etapa, codigo e log.
Nao use `--ignore-failed-sources`, elevacao, mudancas globais ou saida do sandbox
sem autorizacao. O usuario pode executar o mesmo comando do script em PowerShell
normal autorizado; ele prepara os caches no G: sem exigir configuracao permanente.
Nao declare build ou testes aprovados quando a execucao tiver sido impedida.

Se a politica do PowerShell exigir assinatura, o script pode ser bloqueado antes
de iniciar (saida do host, nao um codigo interno do harness). Nao use bypass ou
altere a politica automaticamente. Encaminhe para assinatura por um responsavel
autorizado ou execute manualmente a sequencia oficial em uma sessao autorizada,
configurando os destinos de ambiente acima somente nessa sessao. Restaure os
valores originais ao terminar ou feche a sessao dedicada. Sem execucao do script,
a restauracao em `finally` e a verificacao automatica do TRX continuam pendentes.
