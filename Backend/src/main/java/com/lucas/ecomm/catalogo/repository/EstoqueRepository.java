package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.EstoqueModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface EstoqueRepository extends JpaRepository<EstoqueModel, UUID> {
    Optional<EstoqueModel> findByProdutoId(UUID produtoId);
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from EstoqueModel e where e.produto.id=:id")
    Optional<EstoqueModel> bloquear(@Param("id") UUID id);
}
