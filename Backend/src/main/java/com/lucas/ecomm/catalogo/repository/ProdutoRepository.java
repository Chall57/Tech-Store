package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.ProdutoModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface ProdutoRepository extends JpaRepository<ProdutoModel, UUID> {
}
