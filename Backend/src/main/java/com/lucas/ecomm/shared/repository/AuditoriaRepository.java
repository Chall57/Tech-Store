package com.lucas.ecomm.shared.repository;

import com.lucas.ecomm.shared.model.AuditoriaModel;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditoriaRepository extends JpaRepository<AuditoriaModel, UUID> {
    @Query(value = """
        SELECT * FROM auditorias
        WHERE entidade IN ('Cliente:' || :clienteId, 'Carrinho:' || :clienteId)
          OR CAST(alteracoes AS jsonb)->'antes'->>'clienteId' = :clienteId
          OR CAST(alteracoes AS jsonb)->'depois'->>'clienteId' = :clienteId
          OR CAST(alteracoes AS jsonb)->'antes'->>'customerId' = :clienteId
          OR CAST(alteracoes AS jsonb)->'depois'->>'customerId' = :clienteId
        ORDER BY criado_em DESC, id DESC LIMIT 50
        """, nativeQuery = true)
    List<AuditoriaModel> atividadesDoCliente(@Param("clienteId") String clienteId);
}
