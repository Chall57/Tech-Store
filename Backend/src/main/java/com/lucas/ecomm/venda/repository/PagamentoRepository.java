package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.PagamentoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface PagamentoRepository extends JpaRepository<PagamentoModel,UUID> {
    List<PagamentoModel> findByPedidoClienteId(UUID clienteId);
    List<PagamentoModel> findByPedidoId(UUID pedidoId);
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths="cartao.bandeira")
    List<PagamentoModel> findByPedidoIdIn(Collection<UUID> pedidoIds);
}
