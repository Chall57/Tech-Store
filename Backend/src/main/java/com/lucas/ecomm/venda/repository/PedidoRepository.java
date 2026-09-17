package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.PedidoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PedidoRepository extends JpaRepository<PedidoModel,UUID> {
    List<PedidoModel> findByClienteIdOrderByCriadoEmDesc(UUID clienteId);
    List<PedidoModel> findAllByOrderByCriadoEmDesc();
    Optional<PedidoModel> findByClienteIdAndChaveOperacao(UUID clienteId,UUID chaveOperacao);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select p from PedidoModel p where p.id=:id")
    Optional<PedidoModel> bloquear(@org.springframework.data.repository.query.Param("id") UUID id);
    @org.springframework.data.jpa.repository.Query("select p.id from PedidoModel p where p.status='EM PROCESSAMENTO' and p.expiraEm < :agora")
    List<UUID> expirados(@org.springframework.data.repository.query.Param("agora") java.time.Instant agora);
}
