package com.lucas.ecomm.cliente.dto;
import jakarta.validation.constraints.*;
public record CartaoRequest(
    String numero, String codigoSeguranca,
    @NotBlank @Size(max=150) String titular,
    @NotBlank String bandeira,
    @NotBlank @Pattern(regexp="(0[1-9]|1[0-2])/[0-9]{2}", message="Validade deve usar MM/AA.") String validade,
    boolean preferencial
) {}
