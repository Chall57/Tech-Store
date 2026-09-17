package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.venda.repository.*;
import java.time.Instant;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration @EnableScheduling @Profile("!test & !integration")
public class ReservaScheduler {
    private final CarrinhoRepository carrinhos; private final PedidoRepository pedidos;
    private final CarrinhoService carrinhoService; private final PedidoService pedidoService;
    public ReservaScheduler(CarrinhoRepository carrinhos,PedidoRepository pedidos,CarrinhoService carrinhoService,PedidoService pedidoService) {
        this.carrinhos=carrinhos; this.pedidos=pedidos; this.carrinhoService=carrinhoService; this.pedidoService=pedidoService;
    }
    @Scheduled(fixedDelay=30000,initialDelay=30000) public void liberarReservas() {
        for(var id:carrinhos.expirados(Instant.now())) tentar(()->carrinhoService.resumo(id));
        for(var id:pedidos.expirados(Instant.now())) tentar(()->pedidoService.expirar(id));
    }
    private void tentar(Runnable acao) {
        try { acao.run(); } catch(Exception erro) {
            org.slf4j.LoggerFactory.getLogger(getClass()).warn("Não foi possível liberar uma reserva: {}",erro.getClass().getSimpleName());
        }
    }
}
