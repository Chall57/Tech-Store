-- Campos novos preservam registros anteriores; exigência é aplicada às novas mudanças de estado.
ALTER TABLE produtos ADD COLUMN justificativa_status varchar(1000);
ALTER TABLE produtos ADD COLUMN categoria_status varchar(80);
ALTER TABLE pedidos DROP CONSTRAINT pedidos_status_check;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_status_check CHECK(status IN
 ('EM ABERTO','EM PROCESSAMENTO','APROVADA','REPROVADA','PAGAMENTO REALIZADO','EM TRÂNSITO','EM TRANSPORTE','ENTREGUE','CANCELADO','EM TROCA','TROCA AUTORIZADA','TROCADO'));
