package com.lucas.ecomm.cliente.repository;
import com.lucas.ecomm.cliente.model.EnderecoModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface EnderecoRepository extends JpaRepository<EnderecoModel, UUID> {
    List<EnderecoModel> findByClienteIdOrderByCriadoEmAsc(UUID clienteId);
    Optional<EnderecoModel> findByIdAndClienteId(UUID id, UUID clienteId);
}
