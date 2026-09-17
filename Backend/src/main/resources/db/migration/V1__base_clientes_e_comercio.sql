-- Modelo inicial: sem clientes ou transações fictícias.
CREATE TABLE clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    nome varchar(150) NOT NULL,
    genero varchar(40) NOT NULL,
    data_nascimento date NOT NULL CHECK(data_nascimento < CURRENT_DATE),
    cpf varchar(11) NOT NULL UNIQUE CHECK(cpf ~ '^[0-9]{11}$'),
    email varchar(254) NOT NULL UNIQUE CHECK(email = lower(email)),
    tipo_telefone varchar(30) NOT NULL,
    ddd varchar(2) NOT NULL,
    telefone varchar(9) NOT NULL,
    senha_hash varchar(100) NOT NULL,
    ativo boolean NOT NULL DEFAULT true
);

CREATE TABLE enderecos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    nome varchar(60) NOT NULL,
    tipo_residencia varchar(40) NOT NULL,
    tipo_logradouro varchar(40) NOT NULL,
    logradouro varchar(150) NOT NULL,
    numero varchar(20) NOT NULL,
    bairro varchar(100) NOT NULL,
    cep varchar(8) NOT NULL,
    cidade varchar(100) NOT NULL,
    estado varchar(2) NOT NULL,
    pais varchar(60) NOT NULL,
    observacoes varchar(500),
    residencial boolean NOT NULL,
    entrega boolean NOT NULL,
    cobranca boolean NOT NULL,
    CHECK(residencial OR entrega OR cobranca),
    UNIQUE(cliente_id,nome)
);

CREATE TABLE bandeiras (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    nome varchar(30) NOT NULL UNIQUE
);

CREATE TABLE cartoes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    bandeira_id uuid NOT NULL REFERENCES bandeiras(id),
    titular varchar(150) NOT NULL,
    ultimos_digitos varchar(4) NOT NULL,
    validade varchar(5) NOT NULL,
    impressao_digital varchar(64) NOT NULL,
    preferencial boolean NOT NULL,
    UNIQUE(cliente_id,impressao_digital)
);

CREATE TABLE categorias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    nome varchar(80) NOT NULL UNIQUE
);

CREATE TABLE grupos_precificacao (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    nome varchar(80) NOT NULL UNIQUE,
    margem_minima numeric(5,2) NOT NULL CHECK(margem_minima>=0)
);

CREATE TABLE produtos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    nome varchar(150) NOT NULL,
    marca varchar(80) NOT NULL,
    descricao varchar(2000) NOT NULL,
    imagem varchar(500),
    preco numeric(12,2) NOT NULL CHECK(preco>=0),
    custo numeric(12,2) NOT NULL CHECK(custo>=0),
    ativo boolean NOT NULL,
    grupo_precificacao_id uuid NOT NULL REFERENCES grupos_precificacao(id)
);

CREATE TABLE produto_categorias (
    produto_id uuid NOT NULL REFERENCES produtos(id),
    categoria_id uuid NOT NULL REFERENCES categorias(id),
    PRIMARY KEY(produto_id,categoria_id)
);

CREATE TABLE estoques (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    produto_id uuid NOT NULL UNIQUE REFERENCES produtos(id),
    quantidade integer NOT NULL CHECK(quantidade>=0),
    reservado integer NOT NULL DEFAULT 0 CHECK(reservado>=0 AND reservado<=quantidade)
);

CREATE TABLE carrinhos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    cliente_id uuid NOT NULL UNIQUE REFERENCES clientes(id)
);

CREATE TABLE itens_carrinho (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    carrinho_id uuid NOT NULL REFERENCES carrinhos(id),
    produto_id uuid NOT NULL REFERENCES produtos(id),
    quantidade integer NOT NULL CHECK(quantidade>0),
    UNIQUE(carrinho_id,produto_id)
);

CREATE TABLE pedidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    cliente_id uuid NOT NULL REFERENCES clientes(id),
    endereco_id uuid REFERENCES enderecos(id),
    endereco_entrega text NOT NULL,
    total numeric(12,2) NOT NULL CHECK(total>=0),
    status varchar(40) NOT NULL CHECK(status IN ('EM ABERTO','EM PROCESSAMENTO','PAGAMENTO REALIZADO','EM TRÂNSITO','ENTREGUE','CANCELADO'))
);

CREATE TABLE itens_pedido (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    pedido_id uuid NOT NULL REFERENCES pedidos(id),
    produto_id uuid NOT NULL REFERENCES produtos(id),
    nome_produto varchar(150) NOT NULL,
    preco_unitario numeric(12,2) NOT NULL CHECK(preco_unitario>=0),
    quantidade integer NOT NULL CHECK(quantidade>0)
);

CREATE TABLE pagamentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    pedido_id uuid NOT NULL REFERENCES pedidos(id),
    cartao_id uuid REFERENCES cartoes(id),
    valor numeric(12,2) NOT NULL CHECK(valor>0),
    status varchar(30) NOT NULL DEFAULT 'PENDENTE',
    referencia varchar(150)
);

CREATE TABLE cupons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    cliente_id uuid REFERENCES clientes(id),
    codigo varchar(60) NOT NULL UNIQUE,
    tipo varchar(20) NOT NULL CHECK(tipo IN ('Promocional','Troca')),
    valor numeric(12,2) NOT NULL CHECK(valor>0),
    validade date NOT NULL,
    utilizado boolean NOT NULL DEFAULT false,
    CHECK(tipo <> 'Troca' OR cliente_id IS NOT NULL)
);

CREATE TABLE pedido_cupons (
    pedido_id uuid NOT NULL REFERENCES pedidos(id),
    cupom_id uuid NOT NULL REFERENCES cupons(id),
    valor_aplicado numeric(12,2) NOT NULL CHECK(valor_aplicado>0),
    PRIMARY KEY(pedido_id,cupom_id)
);

CREATE TABLE trocas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    item_pedido_id uuid NOT NULL REFERENCES itens_pedido(id),
    quantidade integer NOT NULL CHECK(quantidade>0),
    motivo varchar(1000) NOT NULL,
    status varchar(40) NOT NULL CHECK(status IN ('TROCA SOLICITADA','TROCA ACEITA','TROCA NEGADA','ITEM ENVIADO','ITEM RECEBIDO','TROCA PROCESSADA')),
    transportadora varchar(100),
    codigo_rastreio varchar(100),
    cupom_id uuid UNIQUE REFERENCES cupons(id)
);

CREATE TABLE auditorias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),
    versao bigint NOT NULL DEFAULT 0,
    responsavel varchar(255) NOT NULL,
    operacao varchar(255) NOT NULL,
    entidade varchar(255) NOT NULL,
    alteracoes text NOT NULL
);

CREATE INDEX idx_enderecos_cliente ON enderecos(cliente_id);
CREATE INDEX idx_cartoes_cliente ON cartoes(cliente_id);
CREATE UNIQUE INDEX uk_cartao_preferencial ON cartoes(cliente_id) WHERE preferencial;
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_itens_pedido ON itens_pedido(pedido_id);
CREATE INDEX idx_pagamentos_pedido ON pagamentos(pedido_id);
CREATE INDEX idx_trocas_item ON trocas(item_pedido_id);
CREATE INDEX idx_cupons_cliente ON cupons(cliente_id);

INSERT INTO bandeiras(nome) VALUES ('Visa'), ('Mastercard'), ('Elo'), ('American Express');
INSERT INTO categorias(nome) VALUES ('Placas de vídeo'), ('Processadores'), ('Placas-mãe'), ('Memórias RAM'), ('Armazenamento'), ('Fontes'), ('Refrigeração');
INSERT INTO grupos_precificacao(nome,margem_minima) VALUES ('Padrão',35.00),('Premium',28.00),('Acessórios',40.00);
