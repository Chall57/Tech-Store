package com.lucas.ecomm.cliente.repository;
import com.lucas.ecomm.cliente.model.CartaoModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface CartaoRepository extends JpaRepository<CartaoModel, UUID> {
    List<CartaoModel> findByClienteIdOrderByCriadoEmAsc(UUID clienteId);
    Optional<CartaoModel> findByIdAndClienteId(UUID id, UUID clienteId);
}
