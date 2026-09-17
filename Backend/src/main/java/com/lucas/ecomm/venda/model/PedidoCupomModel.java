package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
@Entity @Table(name="pedido_cupons")
public class PedidoCupomModel {
    @EmbeddedId private PedidoCupomId id;
    @MapsId("pedidoId") @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="pedido_id") private PedidoModel pedido;
    @MapsId("cupomId") @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="cupom_id") private CupomModel cupom;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal valorAplicado;
    protected PedidoCupomModel() {}
    public PedidoCupomModel(PedidoModel pedido,CupomModel cupom,BigDecimal valorAplicado) {
        this.pedido=pedido; this.cupom=cupom; this.valorAplicado=valorAplicado; this.id=new PedidoCupomId(pedido.getId(),cupom.getId());
    }
    public PedidoCupomId getId() { return id; }
    public PedidoModel getPedido() { return pedido; }
    public CupomModel getCupom() { return cupom; }
    public BigDecimal getValorAplicado() { return valorAplicado; }
}
