package com.lucas.ecomm.venda.controller;
import com.lucas.ecomm.venda.service.CupomService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/cupons")
public class CupomController {
    private final CupomService service;
    public CupomController(CupomService service) { this.service=service; }
    @PostMapping public ResponseEntity<CupomService.Resposta> cadastrar(@Valid @RequestBody CupomService.Cadastro request) {
        var result=service.cadastrar(request);
        return ResponseEntity.created(URI.create("/api/cupons/"+result.id())).body(result);
    }
    @GetMapping("/{id}") public CupomService.Resposta consultar(@PathVariable UUID id) { return service.consultar(id); }
}
