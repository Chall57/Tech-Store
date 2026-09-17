import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.sql.*;
import java.time.*;
import java.util.*;

/** Dados fictícios opt-in, não fallback da aplicação. Reexecução não sobrescreve compras existentes. */
class PrepararHistoricoAdmin {
    static UUID id(String key) { return UUID.nameUUIDFromBytes(("techstore:admin:historico:v1:"+key).getBytes(StandardCharsets.UTF_8)); }
    static int execute(Connection db,String sql,Object... values) throws SQLException {
        try(var q=db.prepareStatement(sql)) { for(int n=0;n<values.length;n++) q.setObject(n+1,values[n]); return q.executeUpdate(); }
    }
    static UUID lookup(Connection db,String sql,Object... values) throws SQLException {
        try(var q=db.prepareStatement(sql)) { for(int n=0;n<values.length;n++) q.setObject(n+1,values[n]);
            try(var rs=q.executeQuery()) { if(!rs.next()) throw new IllegalStateException("Prepare os cadastros pela API antes do histórico."); return rs.getObject(1,UUID.class); } }
    }
    public static void main(String[] args) throws Exception {
        if(args.length!=2||!Set.of("public","techstore_e2e").contains(args[1])) throw new IllegalArgumentException("Esquema local inválido.");
        var env=new Properties(); try(var reader=Files.newBufferedReader(Path.of(args[0]))) { env.load(reader); }
        String url=env.getProperty("DB_URL","");
        if(!url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1)(:[0-9]+)?/Tech_store(\\?.*)?")) throw new IllegalArgumentException("Permitido somente em Tech_store local.");
        var credentials=new Properties(); credentials.setProperty("user",env.getProperty("DB_USERNAME")); credentials.setProperty("password",env.getProperty("DB_PASSWORD"));
        credentials.setProperty("connectTimeout","8"); credentials.setProperty("socketTimeout","20");
        try(var db=DriverManager.getConnection(url,credentials)) {
            db.setAutoCommit(false);
            try {
                execute(db,"SET LOCAL search_path TO "+args[1]);
                // Trava exclusiva deste preparador; não interfere nos locks normais do checkout.
                try(var lock=db.createStatement()) { lock.execute("SELECT pg_advisory_xact_lock(581203761)"); }
                String[] emails={"marina.oliveira@techstore.test","pedro.almeida@techstore.test","beatriz.santos@techstore.test","rafael.costa@techstore.test"};
                String[] nomes={"GeForce RTX 5070 Gaming 12 GB","Ryzen 7 9800X3D","Memória DDR5 32 GB 6000 MHz","SSD NVMe 2 TB"};
                String[] statuses={"APROVADA","EM TRANSPORTE","ENTREGUE"};
                int added=0;
                // Âncora fixa: executar novamente no mês seguinte não desloca as datas já persistidas.
                for(int month=0;month<12;month++) for(int category=0;category<4;category++) {
                    if(month%4==0&&category==2) continue; // Meses zerados exercitam linhas contínuas.
                    String key=month+"-"+category;
                    UUID customer=lookup(db,"SELECT id FROM clientes WHERE email=?",emails[(month+category)%4]);
                    UUID product=lookup(db,"SELECT id FROM produtos WHERE nome=? ORDER BY criado_em,id LIMIT 1",nomes[category]);
                    UUID address=lookup(db,"SELECT id FROM enderecos WHERE cliente_id=? AND entrega ORDER BY criado_em,id LIMIT 1",customer);
                    UUID card=lookup(db,"SELECT id FROM cartoes WHERE cliente_id=? ORDER BY criado_em,id LIMIT 1",customer);
                    LocalDate when=LocalDate.of(2025,10,12).plusMonths(month);
                    Timestamp instant=Timestamp.from(when.atTime(12,0).atZone(ZoneId.of("America/Sao_Paulo")).toInstant());
                    UUID order=id("pedido-"+key), item=id("item-"+key); int qty=1+month%3;
                    added+=execute(db,"""
                        INSERT INTO pedidos(id,cliente_id,endereco_id,endereco_entrega,total,subtotal,frete,desconto,status,criado_em,atualizado_em)
                        SELECT ?,?,e.id,concat(e.logradouro,', ',e.numero,' - ',e.cidade,'/',e.estado),p.preco*?,p.preco*?,0,0,?,?,?
                        FROM produtos p,enderecos e WHERE p.id=? AND e.id=? AND e.cliente_id=? ON CONFLICT(id) DO NOTHING
                        """,order,customer,qty,qty,statuses[month%3],instant,instant,product,address,customer);
                    execute(db,"""
                        INSERT INTO itens_pedido(id,pedido_id,produto_id,nome_produto,preco_unitario,quantidade,criado_em,atualizado_em)
                        SELECT ?,?,id,nome,preco,?,?,? FROM produtos WHERE id=? ON CONFLICT(id) DO NOTHING
                        """,item,order,qty,instant,instant,product);
                    execute(db,"""
                        INSERT INTO item_pedido_categorias SELECT ?,c.id,c.nome FROM categorias c JOIN produto_categorias pc ON pc.categoria_id=c.id
                        WHERE pc.produto_id=? ON CONFLICT DO NOTHING
                        """,item,product);
                    execute(db,"""
                        INSERT INTO pagamentos(id,pedido_id,cartao_id,valor,status,referencia,bandeira,cartao_final,criado_em,atualizado_em)
                        SELECT ?,p.id,c.id,p.total-p.desconto,'APROVADO','HISTORICO-LOCAL-FICTICIO',b.nome,c.ultimos_digitos,?,?
                        FROM pedidos p,cartoes c JOIN bandeiras b ON b.id=c.bandeira_id WHERE p.id=? AND c.id=? ON CONFLICT(id) DO NOTHING
                        """,id("pagamento-"+key),instant,instant,order,card);
                    String payload="{\"antes\":{},\"depois\":{\"clienteId\":\""+customer+"\",\"pedidoId\":\""+order+"\",\"origem\":\"historico-local-ficticio\"}}";
                    execute(db,"""
                        INSERT INTO auditorias(id,responsavel,operacao,entidade,alteracoes,criado_em,atualizado_em)
                        VALUES(?,'DADOS_LOCAIS','PREPARAR_HISTORICO',?,?,?,?) ON CONFLICT(id) DO NOTHING
                        """,id("atividade-"+key),"Pedido:"+order,payload,instant,instant);
                }
                execute(db,"UPDATE clientes SET perfil_selecionavel=(email='lucas.paulino@techstore.test') WHERE perfil_selecionavel IS DISTINCT FROM (email='lucas.paulino@techstore.test')");
                db.commit(); System.out.println("Histórico administrativo preparado: "+added+" novos pedidos fictícios (45 ao todo), 4 clientes de consulta, 4 categorias. Esquema: "+args[1]);
            } catch(Exception error) { db.rollback(); throw error; }
        } catch(SQLException error) { System.err.println("Falha nos dados locais. SQLState="+error.getSQLState()); System.exit(1); }
    }
}
