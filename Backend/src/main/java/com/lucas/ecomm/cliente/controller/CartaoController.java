package com.lucas.ecomm.cliente.controller;
import com.lucas.ecomm.cliente.dto.*;
import com.lucas.ecomm.cliente.service.CartaoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/clientes/{clienteId}/cartoes")
public class CartaoController {
    private final CartaoService service;
    public CartaoController(CartaoService service) { this.service=service; }
    @GetMapping public List<CartaoResponse> listar(@PathVariable UUID clienteId) { return service.listar(clienteId); }
    @PostMapping public ResponseEntity<CartaoResponse> cadastrar(@PathVariable UUID clienteId,@Valid @RequestBody CartaoRequest request) {
        var item=service.salvar(clienteId,null,request);
        return ResponseEntity.created(URI.create("/api/clientes/"+clienteId+"/cartoes/"+item.id())).body(item);
    }
    @PutMapping("/{id}") public CartaoResponse alterar(@PathVariable UUID clienteId,@PathVariable UUID id,@Valid @RequestBody CartaoRequest request) { return service.salvar(clienteId,id,request); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> excluir(@PathVariable UUID clienteId,@PathVariable UUID id) { service.excluir(clienteId,id); return ResponseEntity.noContent().build(); }
    @PatchMapping("/{id}/preferencial") public CartaoResponse preferencial(@PathVariable UUID clienteId,@PathVariable UUID id) { return service.preferencial(clienteId,id); }
}
