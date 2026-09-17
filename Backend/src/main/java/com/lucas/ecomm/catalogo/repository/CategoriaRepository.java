package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.CategoriaModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface CategoriaRepository extends JpaRepository<CategoriaModel, UUID> {
}
