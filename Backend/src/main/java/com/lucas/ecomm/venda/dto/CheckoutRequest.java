package com.lucas.ecomm.venda.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.cliente.dto.EnderecoRequest;
import com.lucas.ecomm.cliente.dto.CartaoRequest;

public record CheckoutRequest(UUID enderecoId, List<@NotNull UUID> cupomIds,
    @NotNull List<@NotNull @Valid Pagamento> pagamentos, @NotNull UUID chaveOperacao,
    @NotNull @DecimalMin("0.00") @Digits(integer=10,fraction=2) BigDecimal totalEsperado,
    @NotBlank String revisao, @Valid EnderecoRequest novoEndereco, Boolean incorporarEndereco) {
    public record Pagamento(UUID cartaoId,@NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal valor,
        @Valid CartaoRequest novoCartao, Boolean incorporarCartao) {}
}
