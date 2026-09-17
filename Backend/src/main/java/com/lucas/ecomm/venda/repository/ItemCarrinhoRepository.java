package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.ItemCarrinhoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface ItemCarrinhoRepository extends JpaRepository<ItemCarrinhoModel,UUID> {
    List<ItemCarrinhoModel> findByCarrinhoClienteId(UUID clienteId);
    Optional<ItemCarrinhoModel> findByCarrinhoClienteIdAndProdutoId(UUID clienteId, UUID produtoId);
}
