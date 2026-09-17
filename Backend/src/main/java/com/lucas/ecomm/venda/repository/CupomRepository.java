package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.CupomModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CupomRepository extends JpaRepository<CupomModel,UUID> {
    List<CupomModel> findByClienteIdOrClienteIsNull(UUID clienteId);
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select c from CupomModel c where c.id=:id")
    Optional<CupomModel> bloquear(@org.springframework.data.repository.query.Param("id") UUID id);
}
