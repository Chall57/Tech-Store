package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.catalogo.model.*;
@Entity @Table(name="trocas")
public class TrocaModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="item_pedido_id", nullable=false)
    private ItemPedidoModel itemPedido;
    @Column(nullable=false)
    private int quantidade;
    @Column(nullable=false, length=1000)
    private String motivo;
    @Column(nullable=false, length=40)
    private String status;
    @Column(length=100)
    private String transportadora;
    @Column(length=100)
    private String codigoRastreio;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="cupom_id", unique=true)
    private CupomModel cupom;
    @Column(nullable=false,length=30) private String statusDrs="EM TROCA";
    @Column(nullable=false) private boolean reentradaEstoque;
    @Column(length=1000) private String observacoes;
    private LocalDate dataDespacho;
    public String getStatusDrs() { return statusDrs; }
    public void setStatusDrs(String value) { statusDrs=value; }
    public boolean getReentradaEstoque() { return reentradaEstoque; }
    public void setReentradaEstoque(boolean value) { reentradaEstoque=value; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String value) { observacoes=value; }
    public LocalDate getDataDespacho() { return dataDespacho; }
    public void setDataDespacho(LocalDate value) { dataDespacho=value; }
    public ItemPedidoModel getItemPedido() { return itemPedido; }
    public void setItemPedido(ItemPedidoModel itemPedido) { this.itemPedido=itemPedido; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade=quantidade; }
    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo=motivo; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status=status; }
    public String getTransportadora() { return transportadora; }
    public void setTransportadora(String transportadora) { this.transportadora=transportadora; }
    public String getCodigoRastreio() { return codigoRastreio; }
    public void setCodigoRastreio(String codigoRastreio) { this.codigoRastreio=codigoRastreio; }
    public CupomModel getCupom() { return cupom; }
    public void setCupom(CupomModel cupom) { this.cupom=cupom; }
}
