package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.FornecedorModel;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FornecedorRepository extends JpaRepository<FornecedorModel,UUID> {
    boolean existsByNomeIgnoreCase(String nome);
}
