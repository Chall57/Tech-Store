package com.lucas.ecomm.cliente.dto;
import jakarta.validation.constraints.*;
public record EnderecoRequest(
    @NotBlank @Size(max=60) String nome,
    @NotBlank @Size(max=40) String tipoResidencia,
    @NotBlank @Size(max=40) String tipoLogradouro,
    @NotBlank @Size(max=150) String logradouro,
    @NotBlank @Size(max=20) String numero,
    @NotBlank @Size(max=100) String bairro,
    @NotBlank @Pattern(regexp="\\d{5}-?\\d{3}", message="CEP deve conter 8 dígitos.") String cep,
    @NotBlank @Size(max=100) String cidade,
    @NotBlank @Pattern(regexp="[A-Za-z]{2}", message="Informe a UF com duas letras.") String estado,
    @NotBlank @Size(max=60) String pais,
    @Size(max=500) String observacoes,
    boolean residencial, boolean entrega, boolean cobranca
) {}
