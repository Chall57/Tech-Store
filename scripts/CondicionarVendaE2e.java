import java.nio.file.*;
import java.sql.*;
import java.util.*;

/** Injeção de tempo/condição externa, exclusivamente em fixtures recentes do Cypress. */
class CondicionarVendaE2e {
    public static void main(String[] args) throws Exception {
        UUID cliente=UUID.fromString(args[1]), referencia=UUID.fromString(args[4]);
        String operacao=args[2]; int valor=Integer.parseInt(args[3]);
        if(!Set.of("prazo","estoque","cupom").contains(operacao)) throw new IllegalArgumentException("Operação de teste desconhecida.");
        if(operacao.equals("prazo")&&(valor < -60 || valor > 1800) || operacao.equals("estoque")&&(valor < 0 || valor > 100))
            throw new IllegalArgumentException("Condição de teste fora dos limites.");
        var settings=new Properties();
        try(var reader=Files.newBufferedReader(Path.of(args[0]))) { settings.load(reader); }
        String url=settings.getProperty("DB_URL", "");
        if(!url.matches("jdbc:postgresql://(localhost|127\\.0\\.0\\.1):5432/[^?;]+"))
            throw new IllegalArgumentException("A tarefa requer PostgreSQL local, sem parâmetros de redirecionamento de schema.");
        try(var db=DriverManager.getConnection(url,settings.getProperty("DB_USERNAME"),settings.getProperty("DB_PASSWORD"))) {
            db.setSchema("techstore_e2e"); db.setAutoCommit(false);
            try {
                // SQL sempre qualificado: ausência do schema não pode cair em public.
                try(var q=db.prepareStatement("SELECT id FROM techstore_e2e.clientes WHERE id=? AND email LIKE 'cypress-%@techstore.test' AND criado_em > now()-interval '2 hours' FOR UPDATE")) {
                    q.setObject(1,cliente);
                    try(var r=q.executeQuery()) { if(!r.next()) throw new IllegalArgumentException("Só é permitido alterar uma fixture recente de cliente Cypress."); }
                }
                switch(operacao) {
                    case "prazo" -> {
                        try(var q=db.prepareStatement("UPDATE techstore_e2e.carrinhos SET expira_em=clock_timestamp() + (? * interval '1 second') WHERE cliente_id=? AND EXISTS (SELECT 1 FROM techstore_e2e.itens_carrinho i WHERE i.carrinho_id=carrinhos.id AND i.removido_em IS NULL)")) {
                            q.setInt(1,valor); q.setObject(2,cliente); exigirUm(q.executeUpdate());
                        }
                    }
                    case "estoque" -> {
                        // Emula reconciliação externa após perda da reserva. Não viola o CHECK
                        // reservado<=quantidade. O serviço real ajustará o carrinho ao consultá-lo.
                        try(var q=db.prepareStatement("SELECT e.id FROM techstore_e2e.estoques e JOIN techstore_e2e.produtos p ON p.id=e.produto_id WHERE p.id=? AND p.criado_em>now()-interval '2 hours' AND EXISTS (SELECT 1 FROM techstore_e2e.itens_carrinho i JOIN techstore_e2e.carrinhos c ON c.id=i.carrinho_id WHERE i.produto_id=p.id AND c.cliente_id=? AND i.removido_em IS NULL) AND NOT EXISTS (SELECT 1 FROM techstore_e2e.itens_carrinho i JOIN techstore_e2e.carrinhos c ON c.id=i.carrinho_id WHERE i.produto_id=p.id AND c.cliente_id<>? AND i.removido_em IS NULL) AND NOT EXISTS (SELECT 1 FROM techstore_e2e.itens_pedido i WHERE i.produto_id=p.id) FOR UPDATE OF e")) {
                            q.setObject(1,referencia); q.setObject(2,cliente); q.setObject(3,cliente);
                            try(var r=q.executeQuery()) { if(!r.next()) throw new IllegalArgumentException("Produto deve pertencer exclusivamente ao carrinho desta fixture e não ter vendas."); }
                        }
                        try(var q=db.prepareStatement("UPDATE techstore_e2e.estoques SET quantidade=?,reservado=0 WHERE produto_id=?")) {
                            q.setInt(1,valor); q.setObject(2,referencia); exigirUm(q.executeUpdate());
                        }
                        try(var q=db.prepareStatement("UPDATE techstore_e2e.itens_carrinho i SET reservado=false FROM techstore_e2e.carrinhos c WHERE c.id=i.carrinho_id AND c.cliente_id=? AND i.produto_id=? AND i.removido_em IS NULL")) {
                            q.setObject(1,cliente); q.setObject(2,referencia); exigirUm(q.executeUpdate());
                        }
                    }
                    case "cupom" -> {
                        try(var q=db.prepareStatement("UPDATE techstore_e2e.cupons SET validade=CURRENT_DATE-1 WHERE id=? AND cliente_id=? AND criado_em>now()-interval '2 hours'")) {
                            q.setObject(1,referencia); q.setObject(2,cliente); exigirUm(q.executeUpdate());
                        }
                    }
                }
                db.commit(); System.out.println("{\"schema\":\"techstore_e2e\",\"operacao\":\""+operacao+"\",\"aplicado\":true}");
            } catch(Exception erro) { db.rollback(); throw erro; }
        }
    }
    private static void exigirUm(int afetados) {
        if(afetados!=1) throw new IllegalArgumentException("A condição deve atingir exatamente um registro de teste.");
    }
}
