package com.lucas.ecomm.venda.repository;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
@Repository
public class AnaliseVendaRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public AnaliseVendaRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc=jdbc; }
    public record Valor(UUID categoriaId,YearMonth mes,BigDecimal total) {}
    public List<Valor> mensal(LocalDate inicio,LocalDate fim,List<UUID> categorias) {
        return jdbc.query("""
            SELECT hc.categoria_id,to_char(p.criado_em AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') mes,
              sum(i.preco_unitario*i.quantidade) total
            FROM pedidos p JOIN itens_pedido i ON i.pedido_id=p.id
              JOIN item_pedido_categorias hc ON hc.item_pedido_id=i.id
            WHERE p.status IN ('APROVADA','PAGAMENTO REALIZADO','EM TRANSPORTE','EM TRÂNSITO','ENTREGUE')
              AND p.criado_em >= :inicio AND p.criado_em < :fim AND hc.categoria_id IN (:categorias)
            GROUP BY hc.categoria_id,mes ORDER BY mes
            """,Map.of("inicio",java.sql.Timestamp.from(inicio.atStartOfDay(ZoneId.of("America/Sao_Paulo")).toInstant()),
                "fim",java.sql.Timestamp.from(fim.plusDays(1).atStartOfDay(ZoneId.of("America/Sao_Paulo")).toInstant()),"categorias",categorias),
            (rs,n)->new Valor(rs.getObject("categoria_id",UUID.class),YearMonth.parse(rs.getString("mes")),rs.getBigDecimal("total")));
    }
}
