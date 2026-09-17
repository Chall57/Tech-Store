package com.lucas.ecomm.venda.controller;

import com.lucas.ecomm.venda.dto.CheckoutRequest;
import com.lucas.ecomm.venda.service.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api")
public class PedidoController {
    private final PedidoService service;
    public PedidoController(PedidoService service) { this.service=service; }
    public record Status(@NotBlank String status) {}
    @PostMapping("/clientes/{clienteId}/checkout/orcamento")
    public PedidoService.Orcamento orcamento(@PathVariable UUID clienteId,@Valid @RequestBody PedidoService.Selecao selecao) { return service.orcamento(clienteId,selecao); }
    @PostMapping("/clientes/{clienteId}/pedidos")
    public ResponseEntity<ConsultaVendaService.Pedido> finalizar(@PathVariable UUID clienteId,@Valid @RequestBody CheckoutRequest request) {
        var resultado=service.finalizar(clienteId,request);
        return ResponseEntity.created(URI.create("/api/pedidos/"+resultado.id())).body(resultado);
    }
    @PostMapping("/pedidos/{id}/pagamento") public ConsultaVendaService.Pedido processar(@PathVariable UUID id) { return service.processar(id); }
    @PatchMapping("/pedidos/{id}/status") public ConsultaVendaService.Pedido status(@PathVariable UUID id,@Valid @RequestBody Status request) { return service.status(id,request.status()); }
    @PatchMapping("/clientes/{clienteId}/pedidos/{id}/status")
    public ConsultaVendaService.Pedido statusCliente(@PathVariable UUID clienteId,@PathVariable UUID id,@Valid @RequestBody Status request) { return service.statusCliente(clienteId,id,request.status()); }
}
