-- Complementa FKs simples com a propriedade dos dados e unicidade sem distinção de caixa.
CREATE UNIQUE INDEX uk_endereco_nome_cliente ON enderecos(cliente_id, lower(nome));
ALTER TABLE enderecos ADD CONSTRAINT uk_endereco_cliente UNIQUE(id, cliente_id);
ALTER TABLE pedidos ADD CONSTRAINT fk_pedido_endereco_cliente
  FOREIGN KEY(endereco_id, cliente_id) REFERENCES enderecos(id, cliente_id);

CREATE FUNCTION validar_proprietario_pagamento() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.cartao_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM cartoes c JOIN pedidos p ON p.cliente_id=c.cliente_id
    WHERE c.id=NEW.cartao_id AND p.id=NEW.pedido_id
  ) THEN RAISE EXCEPTION 'Cartão não pertence ao cliente do pedido' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER proprietario_pagamento BEFORE INSERT OR UPDATE ON pagamentos
FOR EACH ROW EXECUTE FUNCTION validar_proprietario_pagamento();

CREATE FUNCTION validar_proprietario_cupom() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM cupons c JOIN pedidos p ON p.id=NEW.pedido_id
    WHERE c.id=NEW.cupom_id AND (c.cliente_id IS NULL OR c.cliente_id=p.cliente_id)
  ) THEN RAISE EXCEPTION 'Cupom não pertence ao cliente do pedido' USING ERRCODE='23514'; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER proprietario_cupom BEFORE INSERT OR UPDATE ON pedido_cupons
FOR EACH ROW EXECUTE FUNCTION validar_proprietario_cupom();
