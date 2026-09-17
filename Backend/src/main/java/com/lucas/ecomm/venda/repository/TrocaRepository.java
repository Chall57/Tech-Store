package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.TrocaModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface TrocaRepository extends JpaRepository<TrocaModel,UUID> {
    List<TrocaModel> findByItemPedidoPedidoClienteId(UUID clienteId);
    List<TrocaModel> findByItemPedidoPedidoId(UUID pedidoId);
}
