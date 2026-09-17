package com.lucas.ecomm.cliente.dto;
import com.lucas.ecomm.cliente.model.CartaoModel;
import java.util.UUID;
public record CartaoResponse(UUID id, UUID clienteId, String bandeira, String titular, String ultimosDigitos,
    String validade, boolean preferencial) {
    public static CartaoResponse de(CartaoModel c) {
        return new CartaoResponse(c.getId(),c.getCliente().getId(),c.getBandeira().getNome(),c.getTitular(),
            c.getUltimosDigitos(),c.getValidade(),c.getPreferencial());
    }
}
