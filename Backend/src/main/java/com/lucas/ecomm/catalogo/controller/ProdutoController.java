package com.lucas.ecomm.catalogo.controller;
import com.lucas.ecomm.catalogo.dto.*;
import com.lucas.ecomm.catalogo.service.ProdutoService;
import com.lucas.ecomm.cliente.service.CartaoService;
import jakarta.validation.Valid;
import java.util.*;
import java.net.URI;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api")
public class ProdutoController {
    private final ProdutoService service; private final CartaoService cartoes;
    public ProdutoController(ProdutoService service, CartaoService cartoes) { this.service=service; this.cartoes=cartoes; }
    @GetMapping("/produtos") public List<ProdutoResponse> listar() { return service.listar(); }
    @GetMapping("/produtos/{id}") public ProdutoResponse consultar(@PathVariable UUID id) { return service.consultar(id); }
    @PostMapping("/produtos") public ResponseEntity<ProdutoResponse> cadastrar(@Valid @RequestBody ProdutoRequest request) {
        var p=service.salvar(null,request); return ResponseEntity.created(URI.create("/api/produtos/"+p.id())).body(p);
    }
    @PutMapping("/produtos/{id}") public ProdutoResponse alterar(@PathVariable UUID id,@Valid @RequestBody ProdutoRequest request) { return service.salvar(id,request); }
    @GetMapping("/dominios/catalogo") public Map<String,List<ProdutoResponse.Dominio>> dominios() { return service.dominios(); }
    @GetMapping("/dominios/bandeiras") public List<String> bandeiras() { return cartoes.bandeiras(); }
}
