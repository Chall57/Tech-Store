-- Número público estável; os UUIDs continuam identificando os vínculos internos.
CREATE SEQUENCE pedidos_numero_seq START WITH 111082;
ALTER TABLE pedidos ADD COLUMN numero bigint;

WITH ordenados AS (
    SELECT id, row_number() OVER (ORDER BY criado_em, id) + 111081 AS numero
    FROM pedidos
)
UPDATE pedidos p SET numero = o.numero FROM ordenados o WHERE p.id = o.id;

SELECT setval('pedidos_numero_seq', COALESCE((SELECT max(numero) FROM pedidos), 111081), true);
ALTER TABLE pedidos ALTER COLUMN numero SET DEFAULT nextval('pedidos_numero_seq');
ALTER TABLE pedidos ALTER COLUMN numero SET NOT NULL;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_numero_unique UNIQUE (numero);
ALTER SEQUENCE pedidos_numero_seq OWNED BY pedidos.numero;
