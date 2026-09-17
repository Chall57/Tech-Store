param([string]$ApiBase='http://127.0.0.1:8080/api', [ValidateSet('public','techstore_e2e')][string]$BancoSchema='public')
$ErrorActionPreference='Stop'
$uri=[Uri]$ApiBase
if ($uri.Host -notin @('localhost','127.0.0.1','::1') -or
    ($BancoSchema -eq 'public' -and $uri.Port -ne 8080) -or ($BancoSchema -eq 'techstore_e2e' -and $uri.Port -ne 8081)) { throw 'Use somente a API local correspondente ao esquema.' }
function Send-AdminFixture([string]$Route,[hashtable]$Data) {
    Invoke-RestMethod "$ApiBase/$Route" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes(($Data | ConvertTo-Json -Depth 8)))
}
function Get-FixtureCpf([string]$Base) {
    $number=$Base
    for ($length=9; $length -le 10; $length++) {
        $sum=0
        for ($n=0; $n -lt $length; $n++) { $sum += [int]::Parse($number.Substring($n,1))*($length+1-$n) }
        $digit=($sum*10)%11; if ($digit -eq 10) { $digit=0 }; $number += [string]$digit
    }
    $number
}
$customers=@(
    @{nome='Marina Oliveira'; base='842105739'; email='marina.oliveira@techstore.test'; cidade='Arujá'; cep='07400000'},
    @{nome='Pedro Almeida'; base='675309182'; email='pedro.almeida@techstore.test'; cidade='Mogi das Cruzes'; cep='08710200'},
    @{nome='Beatriz Santos'; base='390816527'; email='beatriz.santos@techstore.test'; cidade='Arujá'; cep='07400000'},
    @{nome='Rafael Costa'; base='713690284'; email='rafael.costa@techstore.test'; cidade='Mogi das Cruzes'; cep='08710200'}
)
foreach ($c in $customers) {
    $found=Invoke-RestMethod "$ApiBase/clientes?email=$([Uri]::EscapeDataString($c.email))"
    if ($found.Count -gt 0) { $customer=$found | Where-Object email -eq $c.email | Select-Object -First 1 }
    else {
        $customer=Send-AdminFixture 'clientes' @{
            nome=$c.nome; genero='Não informado'; cpf=(Get-FixtureCpf $c.base); email=$c.email; dataNascimento='1995-04-12'
            tipoTelefone='Celular'; ddd='11'; telefone='987654321'; senha='Local@Teste2026'; confirmacaoSenha='Local@Teste2026'
            enderecos=@(@{nome='Casa'; tipoResidencia='Casa'; tipoLogradouro='Rua'; logradouro='dos Ipês'; numero='100'; bairro='Centro'
                cep=$c.cep; cidade=$c.cidade; estado='SP'; pais='Brasil'; observacoes='Dados fictícios para consultas administrativas'
                residencial=$true; entrega=$true; cobranca=$true})
        }
    }
    $cards=Invoke-RestMethod "$ApiBase/clientes/$($customer.id)/cartoes"
    if ($cards.ultimosDigitos -notcontains '1111') {
        $null=Send-AdminFixture "clientes/$($customer.id)/cartoes" @{numero='4111111111111111'; codigoSeguranca='123'; titular=$c.nome; bandeira='Visa'; validade='12/39'; preferencial=$true}
    }
    Write-Output "Cliente de consulta preparado: $($c.nome)"
}
$domains=Invoke-RestMethod "$ApiBase/dominios/catalogo"
$group=$domains.grupos | Where-Object nome -eq 'Padrão' | Select-Object -First 1
$products=@(
    @{nome='Ryzen 7 9800X3D'; marca='AMD'; preco=2999.90; custo=2000; categoria='Processadores'; imagem='/images/products/ryzen-7-9800x3d.png'},
    @{nome='Memória DDR5 32 GB 6000 MHz'; marca='Kingston'; preco=899.90; custo=600; categoria='Memórias RAM'; imagem='/images/products/ddr5-32gb-6000.png'},
    @{nome='SSD NVMe 2 TB'; marca='Kingston'; preco=799.90; custo=500; categoria='Armazenamento'; imagem='/images/products/ssd-nvme-2tb.png'},
    @{nome='Radeon RX 9070 XT 16 GB'; marca='AMD Partner'; preco=4999.90; custo=3500; categoria='Placas de vídeo'; imagem='/images/products/rx-9070-xt-16gb.png'},
    @{nome='Placa-mãe B850 AORUS Elite'; marca='Gigabyte'; preco=1799.90; custo=1200; categoria='Placas-mãe'; imagem='/images/products/b850-aorus-elite.png'},
    @{nome='Fonte 850 W 80 Plus Gold'; marca='Corsair'; preco=799.90; custo=500; categoria='Fontes'; imagem='/images/products/fonte-850w-gold.png'},
    @{nome='Water Cooler 360 mm'; marca='Cooler Master'; preco=649.90; custo=400; categoria='Refrigeração'; imagem='/images/products/water-cooler-360.png'}
)
$existing=Invoke-RestMethod "$ApiBase/produtos"
foreach ($p in $products) {
    if ($existing.nome -contains $p.nome) { continue }
    $category=$domains.categorias | Where-Object nome -eq $p.categoria | Select-Object -First 1
    if (-not $group -or -not $category) { throw 'Grupo ou categoria de hardware não encontrado no catálogo.' }
    $null=Send-AdminFixture 'produtos' @{nome=$p.nome; marca=$p.marca; descricao='Hardware fictício cadastrado para testar consultas e histórico de vendas.'
        imagem=$p.imagem; preco=$p.preco; custo=$p.custo; quantidade=20; ativo=$true; grupoPrecificacaoId=$group.id; categorias=@($category.id)}
}
$suppliers=Invoke-RestMethod "$ApiBase/fornecedores"
if ($suppliers.nome -notcontains 'Distribuidora Hardware Local') { $null=Send-AdminFixture 'fornecedores' @{nome='Distribuidora Hardware Local'} }
$driver=Get-ChildItem (Join-Path $env:USERPROFILE '.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar') |
    Where-Object Name -Match '^postgresql-[0-9]+\.[0-9]+\.[0-9]+\.jar$' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $driver) { throw 'Driver PostgreSQL do backend não encontrado.' }
& java --class-path $driver.FullName (Join-Path $PSScriptRoot 'PrepararHistoricoAdmin.java') (Join-Path (Split-Path $PSScriptRoot -Parent) '.env') $BancoSchema
if ($LASTEXITCODE -ne 0) { throw 'Falha na preparação do histórico administrativo.' }
