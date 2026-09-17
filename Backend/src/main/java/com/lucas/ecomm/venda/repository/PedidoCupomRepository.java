package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.*;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface PedidoCupomRepository extends JpaRepository<PedidoCupomModel,PedidoCupomId> {
    List<PedidoCupomModel> findByPedidoId(UUID pedidoId);
}
