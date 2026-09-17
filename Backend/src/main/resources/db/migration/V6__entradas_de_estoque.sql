CREATE TABLE fornecedores (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now(),versao bigint NOT NULL DEFAULT 0,
 nome varchar(150) NOT NULL CHECK(length(trim(nome))>0)
);
CREATE UNIQUE INDEX uk_fornecedor_nome ON fornecedores(lower(nome));
CREATE TABLE entradas_estoque (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now(),versao bigint NOT NULL DEFAULT 0,
 produto_id uuid NOT NULL REFERENCES produtos(id),fornecedor_id uuid NOT NULL REFERENCES fornecedores(id),
 quantidade integer NOT NULL CHECK(quantidade>0),custo_unitario numeric(12,2) NOT NULL CHECK(custo_unitario>0),
 data_entrada date NOT NULL
);
CREATE INDEX idx_entrada_produto ON entradas_estoque(produto_id,data_entrada);
