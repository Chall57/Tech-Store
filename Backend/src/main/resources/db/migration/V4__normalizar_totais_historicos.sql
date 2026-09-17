-- Históricos anteriores armazenavam total líquido. A compra nova usa total bruto e desconto separado.
-- Normaliza somente registros reconhecíveis; preserva itens, pagamentos, cupons e status existentes.
UPDATE pedidos SET total=subtotal+frete
 WHERE NOT controla_estoque AND desconto>0 AND subtotal>0
 AND total=subtotal+frete-desconto;
