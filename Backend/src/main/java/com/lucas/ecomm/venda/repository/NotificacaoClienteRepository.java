package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.NotificacaoClienteModel;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface NotificacaoClienteRepository extends JpaRepository<NotificacaoClienteModel,UUID> {
    List<NotificacaoClienteModel> findByClienteIdOrderByCriadoEmDesc(UUID clienteId);
}
