package com.lucas.ecomm.cliente.dto;
import java.util.UUID;
public record PerfilClienteResponse(UUID id,String nome,boolean ativo,boolean selecionavel) {}
