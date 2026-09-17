package com.lucas.ecomm.catalogo.dto;
import jakarta.validation.constraints.*;
import java.util.*;
import java.math.BigDecimal;
public record ProdutoRequest(@NotBlank @Size(max=150) String nome, @NotBlank @Size(max=80) String marca,
    @NotBlank @Size(max=2000) String descricao, @Size(max=500) String imagem,
    @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal preco,
    @NotNull @DecimalMin("0.00") @Digits(integer=10,fraction=2) BigDecimal custo,
    boolean ativo, @NotNull UUID grupoPrecificacaoId, @NotEmpty Set<@NotNull UUID> categorias,
    @Min(0) int quantidade,@Size(max=1000) String justificativaStatus,@Size(max=80) String categoriaStatus) {}
