[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$solutionPath = Join-Path $repositoryRoot 'GestaoTransportadora.slnx'
$testProjectPath = Join-Path $repositoryRoot 'tests/Transportador.Api.Tests/Transportador.Api.Tests.csproj'
$harnessRoot = Join-Path $repositoryRoot '.local/harness'
$runDirectory = Join-Path $harnessRoot ('test-results/' + [Guid]::NewGuid().ToString('N'))
$environmentValues = @{
    NUGET_PACKAGES = Join-Path $harnessRoot 'nuget/packages'
    NUGET_HTTP_CACHE_PATH = Join-Path $harnessRoot 'nuget/http-cache'
    NUGET_SCRATCH = Join-Path $harnessRoot 'nuget/scratch'
    TEMP = Join-Path $harnessRoot 'tmp'
    TMP = Join-Path $harnessRoot 'tmp'
    DOTNET_CLI_HOME = Join-Path $harnessRoot 'dotnet-home'
    DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    DOTNET_SKIP_FIRST_TIME_EXPERIENCE = '1'
    DOTNET_NOLOGO = '1'
    DOTNET_CLI_WORKLOAD_UPDATE_NOTIFY_DISABLE = 'true'
    DOTNET_GENERATE_ASPNET_CERTIFICATE = 'false'
}
$originalEnvironment = @{}
$originalLocation = Get-Location
$failureCategory = 'infraestrutura'
$exitCode = 10

function Invoke-DotnetStep {
    param([string]$Name, [string[]]$Arguments)

    Write-Host "Etapa: $Name"
    # Windows PowerShell pode representar stderr nativo como ErrorRecord.
    # O codigo nativo, e nao a presenca de stderr, determina o sucesso.
    $previousErrorPreference = $ErrorActionPreference
    try {
        if (-not (Test-Path -LiteralPath $runDirectory -PathType Container)) {
            throw 'Diretorio de resultados inexistente ou invalido.'
        }
        $ErrorActionPreference = 'Continue'
        & dotnet @Arguments 2>&1 | Tee-Object -FilePath (Join-Path $runDirectory "$Name.log") -ErrorAction Stop
        $nativeExitCode = $LASTEXITCODE
    }
    catch {
        # Pipeline interrompido: LASTEXITCODE pode ser antigo. Preserve o erro
        # original e nao o apresente como sucesso ou falha de assercao.
        $_.Exception.Data['HarnessInfrastructure'] = $true
        throw
    }
    finally {
        $ErrorActionPreference = $previousErrorPreference
    }
    if ($nativeExitCode -ne 0) {
        throw "Etapa $Name falhou (codigo nativo $nativeExitCode). Consulte o log local."
    }
}

try {
    foreach ($name in $environmentValues.Keys) {
        $originalEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
    }
    if (-not (Test-Path -LiteralPath $solutionPath -PathType Leaf)) {
        throw 'Solucao nao encontrada ao lado do diretorio scripts.'
    }
    if (-not (Test-Path -LiteralPath $testProjectPath -PathType Leaf)) {
        throw 'Projeto de testes nao encontrado.'
    }
    Get-Command dotnet -ErrorAction Stop | Out-Null
    foreach ($directory in @(
        $environmentValues.NUGET_PACKAGES, $environmentValues.NUGET_HTTP_CACHE_PATH,
        $environmentValues.NUGET_SCRATCH, $environmentValues.TEMP,
        $environmentValues.DOTNET_CLI_HOME, $runDirectory
    )) {
        New-Item -ItemType Directory -Path $directory -Force -ErrorAction Stop | Out-Null
    }
    foreach ($name in $environmentValues.Keys) {
        [Environment]::SetEnvironmentVariable($name, $environmentValues[$name], 'Process')
    }
    Set-Location -LiteralPath $repositoryRoot
    Write-Host "Raiz: $repositoryRoot"
    Write-Host "Logs e TRX desta execucao: $runDirectory"

    $failureCategory = 'restore'
    Invoke-DotnetStep -Name 'restore' -Arguments @('restore', $solutionPath, '--verbosity', 'minimal')
    $failureCategory = 'compilacao'
    $exitCode = 20
    Invoke-DotnetStep -Name 'build' -Arguments @('build', $solutionPath, '--no-restore', '--verbosity', 'minimal')

    $failureCategory = 'infraestrutura de testes'
    $exitCode = 10
    Invoke-DotnetStep -Name 'descoberta' -Arguments @('test', $testProjectPath, '--list-tests', '--no-build', '--no-restore')
    # VSTest lista os nomes completos; nao depende do idioma do cabecalho.
    $discoveredTests = @(Get-Content -LiteralPath (Join-Path $runDirectory 'descoberta.log') |
        Where-Object { $_ -match '^\s*Transportador\.Api\.Tests\.[^\s]+' })
    if ($discoveredTests.Count -eq 0) {
        throw 'Nenhum teste identificado na descoberta. Verifique o runner e o log.'
    }
    Write-Host "Casos listados: $($discoveredTests.Count)"

    # Mesmo com codigo nativo nao zero, ler o TRX para distinguir falhas de
    # assercao de problemas de descoberta, host ou infraestrutura.
    $testCommandFailure = $null
    try {
        Invoke-DotnetStep -Name 'testes' -Arguments @(
            'test', $testProjectPath, '--no-build', '--no-restore',
            '--logger', 'console;verbosity=normal',
            '--logger', 'trx;LogFileName=motoristas.trx', '--results-directory', $runDirectory
        )
    }
    catch {
        if ($_.Exception.Data['HarnessInfrastructure']) {
            throw
        }
        $testCommandFailure = $_
    }
    $trxPath = Join-Path $runDirectory 'motoristas.trx'
    if (-not (Test-Path -LiteralPath $trxPath -PathType Leaf)) {
        throw 'Execucao nao produziu o TRX esperado; falha de infraestrutura de testes.'
    }
    [xml]$trx = Get-Content -LiteralPath $trxPath -Raw
    $counters = $trx.SelectSingleNode("/*[local-name()='TestRun']/*[local-name()='ResultSummary']/*[local-name()='Counters']")
    if ($null -eq $counters -or [int]$counters.total -le 0 -or [int]$counters.executed -le 0) {
        throw 'TRX sem testes efetivamente executados.'
    }
    Write-Host "TRX: total=$($counters.total); executados=$($counters.executed); aprovados=$($counters.passed); reprovados=$($counters.failed); nao executados=$($counters.notExecuted)"
    $summary = $counters.ParentNode
    if ([int]$counters.error -gt 0 -or [int]$counters.timeout -gt 0 -or [int]$counters.aborted -gt 0 -or $summary.outcome -eq 'Aborted') {
        throw 'TRX indica erro de infraestrutura, timeout ou execucao abortada.'
    }
    if ([int]$counters.failed -gt 0) {
        $failureCategory = 'testes'
        $exitCode = 30
        throw 'Ha testes reprovados. Revise as falhas sem alterar expectativas para mascarar defeitos.'
    }
    if ($null -ne $testCommandFailure) {
        throw 'Comando de testes falhou apesar de nao haver assercoes reprovadas no TRX.'
    }
    if ($summary.outcome -ne 'Completed' -or [int]$counters.passed -ne [int]$counters.executed) {
        throw 'Resultado TRX inconclusivo; revise o relatorio.'
    }
    Write-Host 'Validacao concluida. Revise warnings, testes ignorados, diff e arquivos novos antes de concluir a tarefa.'
    $exitCode = 0
}
catch {
    if ($_.Exception.Data['HarnessInfrastructure']) {
        $failureCategory = 'infraestrutura'
        $exitCode = 10
    }
    Write-Host "VALIDACAO INTERROMPIDA [$failureCategory]: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Nao contorne bloqueios de rede ou permissao; execute manualmente em ambiente autorizado.'
}
finally {
    foreach ($name in $originalEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($name, $originalEnvironment[$name], 'Process')
    }
    Set-Location -LiteralPath $originalLocation.Path
}
exit $exitCode
