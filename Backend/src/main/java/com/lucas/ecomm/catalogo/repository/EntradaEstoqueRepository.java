package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.EntradaEstoqueModel;
import java.util.*;
import org.springframework.data.jpa.repository.*;
public interface EntradaEstoqueRepository extends JpaRepository<EntradaEstoqueModel,UUID> {
    List<EntradaEstoqueModel> findAllByOrderByDataEntradaDescCriadoEmDesc();
    @Query("select max(e.custoUnitario) from EntradaEstoqueModel e where e.produto.id=:id")
    java.math.BigDecimal maiorCusto(@org.springframework.data.repository.query.Param("id") UUID id);
}
