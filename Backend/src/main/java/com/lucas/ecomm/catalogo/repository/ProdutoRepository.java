package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.ProdutoModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface ProdutoRepository extends JpaRepository<ProdutoModel, UUID> {
    @EntityGraph(attributePaths={"grupoPrecificacao","categorias"})
    List<ProdutoModel> findAllByOrderByCriadoEmDescIdAsc();
    @Query("""
        select e.produto.id from EstoqueModel e where e.quantidade=0 and e.produto.ativo=true
        and not exists (select i.id from ItemPedidoModel i where i.produto=e.produto and i.pedido.criadoEm>=:limite
          and i.pedido.status in ('APROVADA','PAGAMENTO REALIZADO','EM TRANSPORTE','EM TRÂNSITO','ENTREGUE'))
        """)
    List<UUID> semEstoqueESemVendasDesde(@Param("limite") java.time.Instant limite);
    @Query("""
        select count(i)>0 from ItemPedidoModel i where i.produto.id=:id and i.pedido.criadoEm>=:limite
          and i.pedido.status in ('APROVADA','PAGAMENTO REALIZADO','EM TRANSPORTE','EM TRÂNSITO','ENTREGUE')
        """)
    boolean possuiVendasDesde(@Param("id") UUID id,@Param("limite") java.time.Instant limite);
}
