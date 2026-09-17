package com.lucas.ecomm.cliente.dto;
import com.lucas.ecomm.cliente.model.ClienteModel;
import java.time.*;
import java.util.UUID;
public record ClienteResponse(UUID id, String nome, String genero, LocalDate dataNascimento, String cpf,
    String email, String tipoTelefone, String ddd, String telefone, boolean ativo, long ranking,
    Instant criadoEm, Instant atualizadoEm, long versao) {
    public static ClienteResponse de(ClienteModel c, long ranking) {
        return new ClienteResponse(c.getId(),c.getNome(),c.getGenero(),c.getDataNascimento(),c.getCpf(),
            c.getEmail(),c.getTipoTelefone(),c.getDdd(),c.getTelefone(),c.getAtivo(),ranking,
            c.getCriadoEm(),c.getAtualizadoEm(),c.getVersao());
    }
}
