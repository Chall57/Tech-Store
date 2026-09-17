package com.lucas.ecomm.cliente.dto;
import com.lucas.ecomm.cliente.model.EnderecoModel;
import java.util.UUID;
public record EnderecoResponse(UUID id, UUID clienteId, String nome, String tipoResidencia,
    String tipoLogradouro, String logradouro, String numero, String bairro, String cep,
    String cidade, String estado, String pais, String observacoes, boolean residencial, boolean entrega, boolean cobranca) {
    public static EnderecoResponse de(EnderecoModel e) {
        return new EnderecoResponse(e.getId(),e.getCliente().getId(),e.getNome(),e.getTipoResidencia(),e.getTipoLogradouro(),
            e.getLogradouro(),e.getNumero(),e.getBairro(),e.getCep(),e.getCidade(),e.getEstado(),e.getPais(),
            e.getObservacoes(),e.getResidencial(),e.getEntrega(),e.getCobranca());
    }
}
