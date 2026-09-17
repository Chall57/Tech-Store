package com.lucas.ecomm.cliente.controller;
import com.lucas.ecomm.cliente.dto.*;
import com.lucas.ecomm.cliente.service.EnderecoService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/clientes/{clienteId}/enderecos")
public class EnderecoController {
    private final EnderecoService service;
    public EnderecoController(EnderecoService service) { this.service=service; }
    @GetMapping public List<EnderecoResponse> listar(@PathVariable UUID clienteId) { return service.listar(clienteId); }
    @PostMapping public ResponseEntity<EnderecoResponse> cadastrar(@PathVariable UUID clienteId,@Valid @RequestBody EnderecoRequest request) {
        var item=service.salvar(clienteId,null,request);
        return ResponseEntity.created(URI.create("/api/clientes/"+clienteId+"/enderecos/"+item.id())).body(item);
    }
    @PutMapping("/{id}") public EnderecoResponse alterar(@PathVariable UUID clienteId,@PathVariable UUID id,@Valid @RequestBody EnderecoRequest request) { return service.salvar(clienteId,id,request); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> excluir(@PathVariable UUID clienteId,@PathVariable UUID id) { service.excluir(clienteId,id); return ResponseEntity.noContent().build(); }
    
}
