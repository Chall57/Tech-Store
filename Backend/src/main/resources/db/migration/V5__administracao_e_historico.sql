-- Marca de seleção local, não autenticação. Nenhum cliente é excluído.
ALTER TABLE clientes ADD COLUMN perfil_selecionavel boolean NOT NULL DEFAULT false;
UPDATE clientes SET perfil_selecionavel=true WHERE email='lucas.paulino@techstore.test';
-- Snapshot de categorias para não reescrever vendas após editar o catálogo.
CREATE TABLE item_pedido_categorias (
 item_pedido_id uuid NOT NULL REFERENCES itens_pedido(id),
 categoria_id uuid NOT NULL REFERENCES categorias(id),nome_categoria varchar(80) NOT NULL,
 PRIMARY KEY(item_pedido_id,categoria_id)
);
INSERT INTO item_pedido_categorias SELECT i.id,c.id,c.nome FROM itens_pedido i
 JOIN produto_categorias pc ON pc.produto_id=i.produto_id JOIN categorias c ON c.id=pc.categoria_id;
CREATE INDEX idx_pedidos_analise ON pedidos(criado_em,status);
CREATE INDEX idx_item_categoria_analise ON item_pedido_categorias(categoria_id,item_pedido_id);
ALTER TABLE trocas ADD COLUMN status_drs varchar(30) NOT NULL DEFAULT 'EM TROCA'
 CHECK(status_drs IN ('EM TROCA','TROCA AUTORIZADA','TROCA NEGADA','TROCADO'));
UPDATE trocas SET status_drs=CASE WHEN status='TROCA NEGADA' THEN 'TROCA NEGADA'
 WHEN status IN ('TROCA ACEITA','ITEM ENVIADO') THEN 'TROCA AUTORIZADA'
 WHEN status IN ('ITEM RECEBIDO','TROCA PROCESSADA') THEN 'TROCADO' ELSE 'EM TROCA' END;
ALTER TABLE trocas ADD COLUMN reentrada_estoque boolean NOT NULL DEFAULT false;
ALTER TABLE trocas ADD COLUMN observacoes varchar(1000);
ALTER TABLE trocas ADD COLUMN data_despacho date;
ALTER TABLE pedidos DROP CONSTRAINT pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check CHECK(status IN
 ('EM ABERTO','EM PROCESSAMENTO','APROVADA','REPROVADA','PAGAMENTO REALIZADO','EM TRÂNSITO','EM TRANSPORTE','ENTREGUE','CANCELADO','EM TROCA','TROCADO'));
CREATE TABLE notificacoes_cliente (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),criado_em timestamptz NOT NULL DEFAULT now(),
 atualizado_em timestamptz NOT NULL DEFAULT now(),versao bigint NOT NULL DEFAULT 0,
 cliente_id uuid NOT NULL REFERENCES clientes(id),mensagem varchar(1000) NOT NULL,troca_id uuid REFERENCES trocas(id)
);
CREATE INDEX idx_notificacoes_cliente ON notificacoes_cliente(cliente_id,criado_em);
