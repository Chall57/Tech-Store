param([string]$ApiBase = 'http://127.0.0.1:8080/api', [ValidateSet('public','techstore_e2e')][string]$BancoSchema = 'public')
$ErrorActionPreference = 'Stop'
$apiUri = [Uri]$ApiBase
if ($apiUri.Host -notin @('localhost', '127.0.0.1', '::1')) { throw 'Este script só pode preparar uma API local.' }
if (($BancoSchema -eq 'public' -and $apiUri.Port -ne 8080) -or ($BancoSchema -eq 'techstore_e2e' -and $apiUri.Port -ne 8081)) {
    throw 'Use a API 8080 para public ou 8081 para techstore_e2e.'
}

function Send-LocalJson([string]$Route, [hashtable]$Data) {
    $payload = $Data | ConvertTo-Json -Depth 8
    Invoke-RestMethod "$ApiBase/$Route" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($payload))
}
# Registros de desenvolvimento criados pela API. Não são fallback do frontend.
$profiles = @(
    @{ nome='Lucas Paulino'; cpf='11144477735'; email='lucas.paulino@techstore.test'; cidade='Arujá'; cep='07400000'; rua='Serra de Bragança'; numero='120' },
    @{ nome='João da Couves'; cpf='12345678909'; email='joao.couves@techstore.test'; cidade='Mogi das Cruzes'; cep='08710200'; rua='Professor Flaviano de Melo'; numero='45' }
)
foreach ($profile in $profiles) {
    $existing = Invoke-RestMethod "$ApiBase/clientes?email=$([Uri]::EscapeDataString($profile.email))"
    if ($existing.Count -gt 0) { Write-Output "Perfil já existente: $($profile.nome)"; continue }
    $data = @{
        nome=$profile.nome; genero='Masculino'; dataNascimento='1998-06-15'; cpf=$profile.cpf; email=$profile.email
        tipoTelefone='Celular'; ddd='11'; telefone='987654321'; senha='Local@Teste2026'; confirmacaoSenha='Local@Teste2026'
        enderecos=@(@{
            nome='Casa'; tipoResidencia='Casa'; tipoLogradouro='Rua'; logradouro=$profile.rua; numero=$profile.numero
            bairro='Centro'; cep=$profile.cep; cidade=$profile.cidade; estado='SP'; pais='Brasil'
            observacoes='Endereço fictício para desenvolvimento local'; residencial=$true; entrega=$true; cobranca=$true
        })
    }
    $created = Send-LocalJson 'clientes' $data
    Write-Output "Perfil persistido: $($created.nome)"
}
$domains = Invoke-RestMethod "$ApiBase/dominios/catalogo"
$group = $domains.grupos | Where-Object nome -eq 'Padrão' | Select-Object -First 1
$category = $domains.categorias | Where-Object nome -eq 'Placas de vídeo' | Select-Object -First 1
$products = @(
    @{ nome='GeForce RTX 5070 Gaming 12 GB'; marca='NVIDIA Partner'; preco=4499.90; custo=3000.00; imagem='/images/products/rtx-5070-12gb.png' },
    @{ nome='Radeon RX 9070 XT 16 GB'; marca='AMD Partner'; preco=5299.90; custo=3500.00; imagem='/images/products/rx-9070-xt-16gb.png' }
)
$existingProducts = Invoke-RestMethod "$ApiBase/produtos"
foreach ($product in $products) {
    if ($existingProducts.nome -contains $product.nome) { Write-Output "Produto já existente: $($product.nome)"; continue }
    $data = @{
        nome=$product.nome; marca=$product.marca; descricao='Produto cadastrado para testes locais da Tech Store.'
        imagem=$product.imagem; preco=$product.preco; custo=$product.custo; ativo=$true; quantidade=10
        grupoPrecificacaoId=$group.id; categorias=@($category.id)
    }
    $created = Send-LocalJson 'produtos' $data
    Write-Output "Produto persistido: $($created.nome)"
}

$lucasCustomers = Invoke-RestMethod "$ApiBase/clientes?email=lucas.paulino%40techstore.test"
$lucas = $lucasCustomers | Where-Object email -eq 'lucas.paulino@techstore.test' | Select-Object -First 1
if (-not $lucas) { throw 'O cadastro local de Lucas não foi encontrado.' }
$addresses = Invoke-RestMethod "$ApiBase/clientes/$($lucas.id)/enderecos"
if ($addresses.nome -notcontains 'Trabalho') {
    $null = Send-LocalJson "clientes/$($lucas.id)/enderecos" @{
        nome='Trabalho'; tipoResidencia='Comercial'; tipoLogradouro='Avenida'; logradouro='dos Expedicionários'; numero='350'
        bairro='Centro'; cep='07400000'; cidade='Arujá'; estado='SP'; pais='Brasil'
        observacoes='Endereço fictício'; residencial=$false; entrega=$true; cobranca=$false
    }
}
$cards = Invoke-RestMethod "$ApiBase/clientes/$($lucas.id)/cartoes"
foreach ($card in @(@{numero='4111111111111111'; final='1111'; bandeira='Visa'}, @{numero='5555555555554444'; final='4444'; bandeira='Mastercard'})) {
    if ($cards.ultimosDigitos -contains $card.final) { continue }
    $null = Send-LocalJson "clientes/$($lucas.id)/cartoes" @{
        numero=$card.numero; codigoSeguranca='123'; bandeira=$card.bandeira; titular='LUCAS PAULINO'; validade='12/39'; preferencial=$false
    }
}
# Pedidos históricos são fixtures opt-in, independentes das compras realizadas pela API.
# JDBC usa o mesmo driver do backend e uma transação; não modifica os registros já preparados.
$envFile = Join-Path (Split-Path $PSScriptRoot -Parent) '.env'
$driver = Get-ChildItem (Join-Path $env:USERPROFILE '.m2/repository/org/postgresql/postgresql/*/postgresql-*.jar') |
    Where-Object Name -Match '^postgresql-[0-9]+\.[0-9]+\.[0-9]+\.jar$' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $driver) { throw 'Execute o Maven do backend para obter o driver PostgreSQL.' }
& java --class-path $driver.FullName (Join-Path $PSScriptRoot 'PrepararHistoricoLocal.java') $envFile $BancoSchema
if ($LASTEXITCODE -ne 0) { throw 'Não foi possível preparar o histórico local.' }
