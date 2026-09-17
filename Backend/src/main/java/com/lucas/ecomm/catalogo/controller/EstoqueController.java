package com.lucas.ecomm.catalogo.controller;
import com.lucas.ecomm.catalogo.service.EstoqueService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api")
public class EstoqueController {
    private final EstoqueService service;
    public EstoqueController(EstoqueService service) { this.service=service; }
    @GetMapping("/fornecedores") public List<EstoqueService.Fornecedor> fornecedores() { return service.fornecedores(); }
    @PostMapping("/fornecedores") public ResponseEntity<EstoqueService.Fornecedor> cadastrar(@Valid @RequestBody EstoqueService.CadastroFornecedor r) {
        var f=service.cadastrarFornecedor(r); return ResponseEntity.created(java.net.URI.create("/api/fornecedores/"+f.id())).body(f);
    }
    @GetMapping("/estoque/entradas") public List<EstoqueService.Resposta> entradas() { return service.entradas(); }
    @PostMapping("/estoque/entradas") public ResponseEntity<EstoqueService.Resposta> entrar(@Valid @RequestBody EstoqueService.Entrada r) {
        var e=service.entrar(r); return ResponseEntity.created(java.net.URI.create("/api/estoque/entradas/"+e.id())).body(e);
    }
}
