param([Parameter(Mandatory)][Guid]$ClienteId, [Parameter(Mandatory)][Guid]$PedidoId)
$ErrorActionPreference = 'Stop'
$driver = Get-ChildItem (Join-Path $env:USERPROFILE '.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar') |
    Where-Object Name -Match '^postgresql-[0-9]+\.[0-9]+\.[0-9]+\.jar$' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $driver) { throw 'Driver PostgreSQL não encontrado. Execute o Maven do backend.' }
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env'
& java --class-path $driver.FullName (Join-Path $PSScriptRoot 'ConsultarAuditoriaPedido.java') $envFile $ClienteId $PedidoId
if ($LASTEXITCODE -ne 0) { throw 'Falha na consulta de auditoria do schema de testes.' }
