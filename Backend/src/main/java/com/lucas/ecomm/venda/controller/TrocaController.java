package com.lucas.ecomm.venda.controller;
import com.lucas.ecomm.venda.service.*;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api")
public class TrocaController {
    private final TrocaService service;
    public TrocaController(TrocaService service) { this.service=service; }
    @PostMapping("/clientes/{clienteId}/trocas") public ResponseEntity<ConsultaVendaService.Troca> solicitar(@PathVariable UUID clienteId,@Valid @RequestBody TrocaService.Solicitar r) {
        var t=service.solicitar(clienteId,r); return ResponseEntity.created(java.net.URI.create("/api/trocas/"+t.id())).body(t);
    }
    @PatchMapping("/trocas/{id}/status") public ConsultaVendaService.Troca alterar(@PathVariable UUID id,@Valid @RequestBody TrocaService.Alterar r) { return service.alterar(id,r); }
    @PostMapping("/clientes/{clienteId}/trocas/{id}/despacho") public ConsultaVendaService.Troca despachar(@PathVariable UUID clienteId,@PathVariable UUID id,@Valid @RequestBody TrocaService.Despachar r) { return service.despachar(clienteId,id,r); }
}
