package com.lucas.ecomm.cliente.dto;
import java.time.LocalDate;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
public record ClienteRequest(
    @NotBlank @Size(max=150) String nome,
    @NotBlank @Size(max=40) String genero,
    @NotNull @Past(message="Nascimento deve ser uma data passada.") LocalDate dataNascimento,
    @NotBlank String cpf,
    @NotBlank @Email @Size(max=254) String email,
    @NotBlank @Size(max=30) String tipoTelefone,
    @NotBlank @Pattern(regexp="[1-9][0-9]", message="DDD deve conter dois dígitos.") String ddd,
    @NotBlank @Pattern(regexp="[0-9]{8,9}", message="Telefone deve conter 8 ou 9 dígitos, sem DDD.") String telefone,
    String senha, String confirmacaoSenha,
    List<@NotNull(message="Endereço obrigatório.") @Valid EnderecoRequest> enderecos
) {}
