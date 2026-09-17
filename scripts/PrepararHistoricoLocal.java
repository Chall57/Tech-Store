import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.time.*;
import java.util.*;

/** Fixtures locais opt-in. Não implementa checkout nem executa cobranças ou trocas reais. */
class PrepararHistoricoLocal {
    private static UUID id(String name) {
        return UUID.nameUUIDFromBytes(("techstore:lucas:fixture:v1:" + name).getBytes(StandardCharsets.UTF_8));
    }
    private static int insert(Connection db, String sql, Object... params) throws SQLException {
        try (var query = db.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) query.setObject(i + 1, params[i]);
            return query.executeUpdate();
        }
    }
    private static UUID lookup(Connection db, String sql, Object... params) throws SQLException {
        try (var query = db.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) query.setObject(i + 1, params[i]);
            try (var rows = query.executeQuery()) {
                if (!rows.next()) throw new IllegalStateException("Prepare o cliente, os produtos e cartões pela API antes do histórico.");
                return rows.getObject(1, UUID.class);
            }
        }
    }
    private static BigDecimal price(Connection db, UUID product) throws SQLException {
        try (var query = db.prepareStatement("SELECT preco FROM produtos WHERE id=?")) {
            query.setObject(1, product);
            try (var rows = query.executeQuery()) { rows.next(); return rows.getBigDecimal(1); }
        }
    }
    private static void activity(Connection db, String key, UUID customer, String operation, String entity, int days) throws SQLException {
        String json = "{\"antes\":{},\"depois\":{\"clienteId\":\"" + customer + "\",\"origem\":\"fixture-local\"}}";
        insert(db, """
            INSERT INTO auditorias(id,criado_em,atualizado_em,responsavel,operacao,entidade,alteracoes)
            VALUES(?,now()-make_interval(days => ?),now()-make_interval(days => ?),'DADOS_LOCAIS',?,?,?)
            ON CONFLICT(id) DO NOTHING
            """, id("atividade-" + key), days, days, operation, entity, json);
    }
    private static UUID coupon(Connection db, String key, UUID customer, String code, String type, BigDecimal value, boolean used) throws SQLException {
        UUID coupon = id(key);
        insert(db, """
            INSERT INTO cupons(id,cliente_id,codigo,tipo,valor,validade,utilizado)
            VALUES(?,?,?,?,?,CURRENT_DATE + 365,?) ON CONFLICT(id) DO NOTHING
            """, coupon, customer, code, type, value, used);
        activity(db, key, customer, "CUPOM_DISPONIBILIZADO", "Cupom:" + coupon, used ? 62 : 5);
        return coupon;
    }
    private static UUID order(Connection db, String key, UUID customer, UUID address, UUID product, String status, int days, BigDecimal discount) throws SQLException {
        UUID order = id(key);
        BigDecimal price = price(db, product);
        // Nome, preço e endereço são snapshots históricos, independentes de alterações cadastrais.
        insert(db, """
            INSERT INTO pedidos(id,cliente_id,endereco_id,endereco_entrega,total,subtotal,frete,desconto,status,criado_em,atualizado_em)
            SELECT ?,?,e.id,concat(e.tipo_logradouro,' ',e.logradouro,', ',e.numero,' - ',e.bairro,' - ',e.cidade,'/',e.estado,' - CEP ',e.cep),?,?,0,?,?,
              now()-make_interval(days => ?),now()-make_interval(days => ?)
            FROM enderecos e WHERE e.id=? AND e.cliente_id=? ON CONFLICT(id) DO NOTHING
            """, order, customer, price, price, discount, status, days, days, address, customer);
        insert(db, """
            INSERT INTO itens_pedido(id,pedido_id,produto_id,nome_produto,preco_unitario,quantidade,criado_em,atualizado_em)
            SELECT ?,?,id,nome,preco,1,now()-make_interval(days => ?),now()-make_interval(days => ?)
            FROM produtos WHERE id=? ON CONFLICT(id) DO NOTHING
            """, id("item-" + key), order, days, days, product);
        activity(db, key, customer, "PEDIDO_CADASTRADO", "Pedido:" + order, days);
        if (!status.equals("EM ABERTO")) activity(db, key + "-status", customer, status.replace(' ', '_'), "Pedido:" + order, Math.max(0, days - 4));
        return order;
    }
    private static void payment(Connection db, String key, UUID order, UUID card, BigDecimal amount, String status, int days) throws SQLException {
        insert(db, """
            INSERT INTO pagamentos(id,pedido_id,cartao_id,valor,status,referencia,bandeira,cartao_final,criado_em,atualizado_em)
            SELECT ?,?,c.id,?,?,?,b.nome,c.ultimos_digitos,now()-make_interval(days => ?),now()-make_interval(days => ?)
            FROM cartoes c JOIN bandeiras b ON b.id=c.bandeira_id WHERE c.id=? ON CONFLICT(id) DO NOTHING
            """, id(key), order, amount, status, "LOCAL-FICTICIO-" + key, days, days, card);
    }
    public static void main(String[] args) throws Exception {
        if (args.length != 2 || !Set.of("public", "techstore_e2e").contains(args[1])) throw new IllegalArgumentException("Informe .env e o esquema local permitido.");
        var settings = new Properties();
        try (var reader = Files.newBufferedReader(Path.of(args[0]))) { settings.load(reader); }
        String url = settings.getProperty("DB_URL", "");
        if (!url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/Tech_store(\\?.*)?")) throw new IllegalArgumentException("Fixtures permitidas somente no banco local Tech_store.");
        var credentials = new Properties();
        credentials.setProperty("user", settings.getProperty("DB_USERNAME"));
        credentials.setProperty("password", settings.getProperty("DB_PASSWORD"));
        credentials.setProperty("connectTimeout", "8");
        credentials.setProperty("socketTimeout", "15");
        Class.forName("org.postgresql.Driver");
        try (var db = DriverManager.getConnection(url, credentials)) {
            db.setAutoCommit(false);
            try {
                insert(db, "SET LOCAL search_path TO " + args[1]); // enum fechado validado acima
                UUID lucas = lookup(db, "SELECT id FROM clientes WHERE email=?", "lucas.paulino@techstore.test");
                insert(db,"UPDATE clientes SET perfil_selecionavel=true WHERE id=? AND NOT perfil_selecionavel",lucas);
                // Serializa reexecuções concorrentes do preparador, sem bloquear outros clientes.
                lookup(db, "SELECT id FROM clientes WHERE id=? FOR UPDATE", lucas);
                UUID address = lookup(db, "SELECT id FROM enderecos WHERE cliente_id=? AND entrega ORDER BY criado_em,id LIMIT 1", lucas);
                UUID visa = lookup(db, "SELECT id FROM cartoes WHERE cliente_id=? AND ultimos_digitos='1111' ORDER BY criado_em,id LIMIT 1", lucas);
                UUID master = lookup(db, "SELECT id FROM cartoes WHERE cliente_id=? AND ultimos_digitos='4444' ORDER BY criado_em,id LIMIT 1", lucas);
                UUID rtx = lookup(db, "SELECT id FROM produtos WHERE nome=? ORDER BY criado_em,id LIMIT 1", "GeForce RTX 5070 Gaming 12 GB");
                UUID rx = lookup(db, "SELECT id FROM produtos WHERE nome=? ORDER BY criado_em,id LIMIT 1", "Radeon RX 9070 XT 16 GB");
                UUID used = coupon(db, "cupom-usado", lucas, "LUCAS-BOASVINDAS-USADO", "Promocional", new BigDecimal("100.00"), true);
                coupon(db, "cupom-promo", lucas, "LUCAS-TECH100", "Promocional", new BigDecimal("100.00"), false);
                coupon(db, "cupom-promo2", lucas, "LUCAS-HARDWARE150", "Promocional", new BigDecimal("150.00"), false);
                UUID credit = coupon(db, "cupom-troca", lucas, "LUCAS-TROCA", "Troca", price(db, rx), false);
                UUID delivered = order(db, "pedido-entregue", lucas, address, rtx, "ENTREGUE", 60, new BigDecimal("100.00"));
                UUID transit = order(db, "pedido-transito", lucas, address, rx, "EM TRÂNSITO", 15, BigDecimal.ZERO);
                UUID open = order(db, "pedido-aberto", lucas, address, rtx, "EM ABERTO", 2, BigDecimal.ZERO);
                UUID returned = order(db, "pedido-trocado", lucas, address, rx, "ENTREGUE", 45, BigDecimal.ZERO);
                insert(db,"""
                    INSERT INTO item_pedido_categorias SELECT i.id,c.id,c.nome FROM itens_pedido i
                    JOIN produto_categorias pc ON pc.produto_id=i.produto_id JOIN categorias c ON c.id=pc.categoria_id
                    WHERE i.pedido_id IN (?,?,?,?) ON CONFLICT DO NOTHING
                    """,delivered,transit,open,returned);
                insert(db, "INSERT INTO pedido_cupons(pedido_id,cupom_id,valor_aplicado) VALUES(?,?,100.00) ON CONFLICT DO NOTHING", delivered, used);
                BigDecimal deliveredTotal = price(db, rtx).subtract(new BigDecimal("100.00"));
                BigDecimal part = deliveredTotal.divide(new BigDecimal("2"), 2, RoundingMode.DOWN);
                payment(db, "pagamento-entregue-visa", delivered, visa, part, "APROVADO", 59);
                payment(db, "pagamento-entregue-master", delivered, master, deliveredTotal.subtract(part), "APROVADO", 59);
                payment(db, "pagamento-transito", transit, visa, price(db, rx), "APROVADO", 14);
                payment(db, "pagamento-aberto", open, master, price(db, rtx), "PENDENTE", 2);
                payment(db, "pagamento-trocado", returned, master, price(db, rx), "APROVADO", 44);
                insert(db, """
                    INSERT INTO trocas(id,item_pedido_id,quantidade,motivo,status,criado_em,atualizado_em)
                    VALUES(?,?,1,'Solicitação fictícia: produto apresentou falha.','TROCA SOLICITADA',now()-interval '3 days',now()-interval '3 days') ON CONFLICT(id) DO NOTHING
                    """, id("troca-solicitada"), id("item-pedido-entregue"));
                insert(db, """
                    INSERT INTO trocas(id,item_pedido_id,quantidade,motivo,status,transportadora,codigo_rastreio,cupom_id,criado_em,atualizado_em)
                    VALUES(?,?,1,'Troca fictícia concluída para testes.','TROCA PROCESSADA','Transportadora Local','LOCAL-FICTICIO-001',?,now()-interval '20 days',now()-interval '5 days') ON CONFLICT(id) DO NOTHING
                    """, id("troca-processada"), id("item-pedido-trocado"), credit);
                activity(db, "troca-solicitada", lucas, "TROCA_SOLICITADA", "Troca:" + id("troca-solicitada"), 3);
                insert(db,"UPDATE trocas SET status_drs='TROCADO' WHERE id=? AND status='TROCA PROCESSADA' AND status_drs='EM TROCA'",id("troca-processada"));
                activity(db, "troca-enviada", lucas, "ITEM_ENVIADO", "Troca:" + id("troca-processada"), 12);
                activity(db, "troca-processada", lucas, "TROCA_PROCESSADA", "Troca:" + id("troca-processada"), 5);
                // Verifica o saldo de cada fixture; inclui cartões múltiplos e cupom aplicado.
                try (var query = db.prepareStatement("""
                    SELECT p.id FROM pedidos p LEFT JOIN pagamentos pg ON pg.pedido_id=p.id
                    WHERE p.id IN (?,?,?,?) GROUP BY p.id,p.total,p.desconto HAVING coalesce(sum(pg.valor),0) <> p.total-p.desconto
                    """)) {
                    query.setObject(1, delivered); query.setObject(2, transit); query.setObject(3, open); query.setObject(4, returned);
                    try (var rows = query.executeQuery()) { if (rows.next()) throw new IllegalStateException("Uma fixture existente foi alterada; revise seus valores sem sobrescrever os dados."); }
                }
                db.commit();
                System.out.println("Lucas preparado: 4 pedidos, 5 pagamentos fictícios, 4 cupons, 2 trocas e histórico persistido. Esquema: " + args[1]);
            } catch (Exception error) { db.rollback(); throw error; }
        } catch (SQLException error) {
            System.err.println("Falha ao preparar fixtures. SQLState=" + error.getSQLState());
            System.exit(1); // Não imprime credenciais ou payloads.
        }
    }
}
