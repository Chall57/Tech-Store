package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.ItemPedidoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ItemPedidoRepository extends JpaRepository<ItemPedidoModel,UUID> {
    List<ItemPedidoModel> findByPedidoId(UUID pedidoId);
}
