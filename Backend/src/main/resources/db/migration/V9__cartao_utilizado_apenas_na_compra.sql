-- Permite consultar/processar o cartão da compra sem obrigar sua inclusão no perfil.
-- PAN e código de segurança nunca são persistidos.
ALTER TABLE pagamentos ADD COLUMN cartao_validade varchar(5);
UPDATE pagamentos p SET cartao_validade=c.validade FROM cartoes c WHERE p.cartao_id=c.id;
