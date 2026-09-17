package com.lucas.ecomm.venda.controller;
import com.lucas.ecomm.venda.service.ConsultaVendaService;
import java.util.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api")
public class ConsultaVendaController {
    private final ConsultaVendaService service;
    public ConsultaVendaController(ConsultaVendaService service) { this.service=service; }
    @GetMapping("/pedidos") public List<ConsultaVendaService.Pedido> pedidos(@RequestParam(required=false) UUID clienteId) { return service.pedidos(clienteId); }
    @GetMapping("/pedidos/{id}") public ConsultaVendaService.Pedido consultar(@PathVariable UUID id) { return service.consultar(id); }
    @GetMapping("/trocas") public List<ConsultaVendaService.Troca> trocas(@RequestParam(required=false) UUID clienteId) { return service.trocas(clienteId); }
    @GetMapping("/clientes/{clienteId}/cupons") public List<ConsultaVendaService.Cupom> cupons(@PathVariable UUID clienteId) { return service.cupons(clienteId); }
    @GetMapping("/clientes/{clienteId}/transacoes") public Map<String,Object> transacoes(@PathVariable UUID clienteId) { return service.transacoes(clienteId); }
}
