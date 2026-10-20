import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** Consulta somente leitura para evidência do Cypress no schema de testes. */
class ConsultarAuditoriaPedido {
    public static void main(String[] args) throws Exception {
        UUID cliente=UUID.fromString(args[1]), pedido=UUID.fromString(args[2]);
        var settings=new Properties();
        try(var reader=Files.newBufferedReader(Path.of(args[0]))) { settings.load(reader); }
        String url=settings.getProperty("DB_URL", "");
        if(!url.startsWith("jdbc:postgresql://localhost:5432/")&&!url.startsWith("jdbc:postgresql://127.0.0.1:5432/"))
            throw new IllegalArgumentException("A auditoria de testes requer PostgreSQL local.");
        try(var db=DriverManager.getConnection(url,settings.getProperty("DB_USERNAME"),settings.getProperty("DB_PASSWORD"))) {
            db.setReadOnly(true); db.setSchema("techstore_e2e");
            try(var query=db.prepareStatement("""
                SELECT json_build_object('pedidoId',?, 'auditorias',coalesce(json_agg(json_build_object(
                    'data',criado_em,'responsavel',responsavel,'operacao',operacao,'entidade',entidade,
                    'alteracoes',alteracoes::json)),'[]'::json))::text
                FROM auditorias WHERE entidade IN (?,?)
                  OR entidade IN (SELECT 'Troca:'||t.id FROM trocas t JOIN itens_pedido i ON i.id=t.item_pedido_id WHERE i.pedido_id=?::uuid)
                  OR entidade IN (SELECT 'Cupom:'||id FROM cupons WHERE cliente_id=?::uuid)
                  OR entidade IN (SELECT 'Estoque:'||e.id FROM estoques e JOIN itens_pedido i ON i.produto_id=e.produto_id WHERE i.pedido_id=?::uuid)
                  OR entidade IN (SELECT 'Notificacao:'||id FROM notificacoes_cliente WHERE cliente_id=?::uuid)
                """)) {
                query.setString(1,pedido.toString()); query.setString(2,"Pedido:"+pedido); query.setString(3,"Carrinho:"+cliente);
                query.setString(4,pedido.toString()); query.setString(5,cliente.toString()); query.setString(6,pedido.toString()); query.setString(7,cliente.toString());
                try(var rows=query.executeQuery()) { rows.next(); System.out.println(rows.getString(1)); }
            }
        }
    }
}
