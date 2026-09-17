package com.lucas.ecomm.venda.controller;
import com.lucas.ecomm.venda.service.CarrinhoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import java.util.*;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/clientes/{clienteId}/carrinho")
public class CarrinhoController {
    private final CarrinhoService service;
    @GetMapping("/resumo") public CarrinhoService.Resumo resumo(@PathVariable UUID clienteId) { return service.resumo(clienteId); }
    public CarrinhoController(CarrinhoService service) { this.service=service; }
    public record Quantidade(@Min(0) int quantidade) {}
    public record Adicao(@Min(1) int quantidade) {}
    @PostMapping("/itens/{produtoId}") public List<CarrinhoService.Item> adicionar(@PathVariable UUID clienteId,@PathVariable UUID produtoId,@Valid @RequestBody Adicao request) { return service.adicionar(clienteId,produtoId,request.quantidade()); }
    @GetMapping public List<CarrinhoService.Item> listar(@PathVariable UUID clienteId) { return service.listar(clienteId); }
    @PutMapping("/itens/{produtoId}") public List<CarrinhoService.Item> alterar(@PathVariable UUID clienteId,@PathVariable UUID produtoId,@Valid @RequestBody Quantidade request) { return service.quantidade(clienteId,produtoId,request.quantidade()); }
}
