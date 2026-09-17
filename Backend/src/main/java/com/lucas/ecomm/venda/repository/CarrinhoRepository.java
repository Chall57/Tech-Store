package com.lucas.ecomm.venda.repository;
import com.lucas.ecomm.venda.model.CarrinhoModel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;
public interface CarrinhoRepository extends JpaRepository<CarrinhoModel,UUID> {
    Optional<CarrinhoModel> findByClienteId(UUID clienteId);
    @org.springframework.data.jpa.repository.Query("select c.cliente.id from CarrinhoModel c where c.expiraEm < :agora and exists (select i.id from ItemCarrinhoModel i where i.carrinho=c and i.reservado=true)")
    List<UUID> expirados(@org.springframework.data.repository.query.Param("agora") java.time.Instant agora);
}
