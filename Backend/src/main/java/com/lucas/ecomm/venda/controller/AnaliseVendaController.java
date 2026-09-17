package com.lucas.ecomm.venda.controller;
import com.lucas.ecomm.venda.service.AnaliseVendaService;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/analises/vendas")
public class AnaliseVendaController {
    private final AnaliseVendaService service;
    public AnaliseVendaController(AnaliseVendaService service) { this.service=service; }
    @GetMapping public AnaliseVendaService.Resultado consultar(@RequestParam LocalDate inicio,@RequestParam LocalDate fim,@RequestParam List<UUID> categorias) {
        return service.consultar(inicio,fim,categorias);
    }
    @GetMapping("/exportacao") public ResponseEntity<byte[]> exportar(@RequestParam LocalDate inicio,@RequestParam LocalDate fim,@RequestParam List<UUID> categorias) {
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=tech-store-vendas.csv")
            .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
            .body(service.exportar(inicio,fim,categorias).getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }
}
