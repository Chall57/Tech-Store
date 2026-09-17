package com.lucas.ecomm.venda.model;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.*;
@Embeddable
public class PedidoCupomId implements Serializable {
    private UUID pedidoId;
    private UUID cupomId;
    public PedidoCupomId() {}
    public PedidoCupomId(UUID pedidoId,UUID cupomId) { this.pedidoId=pedidoId; this.cupomId=cupomId; }
    public UUID getPedidoId() { return pedidoId; }
    public UUID getCupomId() { return cupomId; }
    @Override public boolean equals(Object other) { return other instanceof PedidoCupomId id && Objects.equals(pedidoId,id.pedidoId) && Objects.equals(cupomId,id.cupomId); }
    @Override public int hashCode() { return Objects.hash(pedidoId,cupomId); }
}
