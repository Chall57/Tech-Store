ALTER TABLE carrinhos ADD COLUMN expira_em timestamptz;
ALTER TABLE itens_carrinho ADD COLUMN reservado boolean NOT NULL DEFAULT false;
ALTER TABLE itens_carrinho ADD COLUMN removido_em timestamptz;
ALTER TABLE itens_carrinho ADD COLUMN motivo_remocao varchar(200);
ALTER TABLE pedidos ADD COLUMN subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK(subtotal>=0);
ALTER TABLE pedidos ADD COLUMN frete numeric(12,2) NOT NULL DEFAULT 0 CHECK(frete>=0);
ALTER TABLE pedidos ADD COLUMN desconto numeric(12,2) NOT NULL DEFAULT 0 CHECK(desconto>=0);
ALTER TABLE pedidos ADD COLUMN excedente_cupons numeric(12,2) NOT NULL DEFAULT 0 CHECK(excedente_cupons>=0);
ALTER TABLE pedidos ADD COLUMN cupom_saldo_id uuid UNIQUE REFERENCES cupons(id);
ALTER TABLE pedidos ADD COLUMN chave_operacao uuid;
ALTER TABLE pedidos ADD COLUMN expira_em timestamptz;
ALTER TABLE pedidos ADD COLUMN controla_estoque boolean NOT NULL DEFAULT false;
ALTER TABLE pedidos ADD CONSTRAINT uk_pedido_operacao UNIQUE(cliente_id,chave_operacao);
ALTER TABLE pedidos DROP CONSTRAINT pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check CHECK(status IN
 ('EM ABERTO','EM PROCESSAMENTO','APROVADA','REPROVADA','PAGAMENTO REALIZADO','EM TRÂNSITO','EM TRANSPORTE','ENTREGUE','CANCELADO'));
UPDATE pedidos p SET subtotal=coalesce((SELECT sum(i.preco_unitario*i.quantidade) FROM itens_pedido i WHERE i.pedido_id=p.id),p.total),
 desconto=coalesce((SELECT sum(pc.valor_aplicado) FROM pedido_cupons pc WHERE pc.pedido_id=p.id),0);
ALTER TABLE pagamentos ADD COLUMN bandeira varchar(30);
ALTER TABLE pagamentos ADD COLUMN cartao_final varchar(4);
UPDATE pagamentos pg SET bandeira=b.nome,cartao_final=c.ultimos_digitos
 FROM cartoes c JOIN bandeiras b ON b.id=c.bandeira_id WHERE pg.cartao_id=c.id;
CREATE INDEX idx_carrinho_expiracao ON carrinhos(expira_em) WHERE expira_em IS NOT NULL;
CREATE INDEX idx_pedido_expiracao ON pedidos(expira_em) WHERE status='EM PROCESSAMENTO';
