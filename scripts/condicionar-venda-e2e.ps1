param(
    [Parameter(Mandatory)][Guid]$ClienteId,
    [Parameter(Mandatory)][ValidateSet('prazo', 'estoque', 'cupom')][string]$Operacao,
    [Parameter(Mandatory)][int]$Valor,
    [Guid]$ReferenciaId = [Guid]::Empty
)
$ErrorActionPreference = 'Stop'
$driver = Get-ChildItem (Join-Path $env:USERPROFILE '.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar') |
    Where-Object Name -Match '^postgresql-[0-9]+\.[0-9]+\.[0-9]+\.jar$' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $driver) { throw 'Driver PostgreSQL não encontrado. Execute o Maven do backend.' }
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env'
# Não cria endpoint de teste e nunca recebe nome de schema ou SQL do navegador.
& java --class-path $driver.FullName (Join-Path $PSScriptRoot 'CondicionarVendaE2e.java') $envFile $ClienteId $Operacao $Valor $ReferenciaId
if ($LASTEXITCODE -ne 0) { throw 'Falha na preparação controlada do cenário de venda e2e.' }
