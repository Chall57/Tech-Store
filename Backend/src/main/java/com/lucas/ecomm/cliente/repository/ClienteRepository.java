package com.lucas.ecomm.cliente.repository;
import com.lucas.ecomm.cliente.model.ClienteModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface ClienteRepository extends JpaRepository<ClienteModel, UUID>, JpaSpecificationExecutor<ClienteModel> {
    @Query("select new com.lucas.ecomm.cliente.dto.PerfilClienteResponse(c.id,c.nome,c.ativo,c.perfilSelecionavel) from ClienteModel c order by c.nome")
    List<com.lucas.ecomm.cliente.dto.PerfilClienteResponse> listarPerfis();
    boolean existsByCpfAndIdNot(String cpf, UUID id);
    boolean existsByEmailAndIdNot(String email, UUID id);
    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ClienteModel c where c.id = :id")
    Optional<ClienteModel> bloquear(@Param("id") UUID id);
}
