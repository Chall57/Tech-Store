package com.lucas.ecomm.cliente.controller;
import com.lucas.ecomm.cliente.dto.*;
import com.lucas.ecomm.cliente.service.ClienteService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/clientes")
public class ClienteController {
    private final ClienteService service;
    public ClienteController(ClienteService service) { this.service=service; }
    @GetMapping public List<ClienteResponse> listar(@RequestParam Map<String,String> filtros) { return service.listar(filtros); }
    @GetMapping("/perfis") public List<PerfilClienteResponse> perfis() { return service.perfis(); }
    @GetMapping("/{id}") public ClienteResponse consultar(@PathVariable UUID id) { return service.consultar(id); }
    @PostMapping public ResponseEntity<ClienteResponse> cadastrar(@Valid @RequestBody ClienteRequest request) {
        var cliente=service.cadastrar(request); return ResponseEntity.created(URI.create("/api/clientes/"+cliente.id())).body(cliente);
    }
    @PutMapping("/{id}") public ClienteResponse alterar(@PathVariable UUID id, @Valid @RequestBody ClienteRequest request) { return service.alterar(id,request); }
    @PatchMapping("/{id}/inativar") public ClienteResponse inativar(@PathVariable UUID id) { return service.ativar(id,false); }
    @PatchMapping("/{id}/ativar") public ClienteResponse ativar(@PathVariable UUID id) { return service.ativar(id,true); }
    @PatchMapping("/{id}/senha") public ResponseEntity<Void> senha(@PathVariable UUID id,@Valid @RequestBody SenhaRequest request) {
        service.alterarSenha(id,request); return ResponseEntity.noContent().build();
    }
}
