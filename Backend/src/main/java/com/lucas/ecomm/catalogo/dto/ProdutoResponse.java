package com.lucas.ecomm.catalogo.dto;
import java.util.*;
import java.math.BigDecimal;
public record ProdutoResponse(UUID id, String nome, String marca, String descricao, String imagem,
    BigDecimal preco, BigDecimal custo, boolean ativo, UUID grupoPrecificacaoId,
    List<Dominio> categorias, int quantidade, int reservado,String justificativaStatus,String categoriaStatus) {
    public record Dominio(UUID id, String nome) {}
}
