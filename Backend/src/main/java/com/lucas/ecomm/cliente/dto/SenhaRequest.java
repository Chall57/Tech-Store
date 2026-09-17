package com.lucas.ecomm.cliente.dto;
import jakarta.validation.constraints.NotBlank;
public record SenhaRequest(@NotBlank String senha, @NotBlank String confirmacaoSenha) {}
