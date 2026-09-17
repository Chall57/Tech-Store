package com.lucas.ecomm.cliente.repository;
import com.lucas.ecomm.cliente.model.BandeiraModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface BandeiraRepository extends JpaRepository<BandeiraModel, UUID> {
    Optional<BandeiraModel> findByNomeIgnoreCase(String nome);
}
