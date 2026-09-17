package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.catalogo.model.*;
@Entity @Table(name="pagamentos")
public class PagamentoModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="pedido_id", nullable=false)
    private PedidoModel pedido;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="cartao_id")
    private CartaoModel cartao;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal valor;
    @Column(nullable=false, length=30)
    private String status;
    @Column(length=150)
    private String referencia;
    @Column(length=30) private String bandeira;
    @Column(length=4) private String cartaoFinal;
    public String getBandeira() { return bandeira; }
    public void setBandeira(String valor) { bandeira=valor; }
    public String getCartaoFinal() { return cartaoFinal; }
    public void setCartaoFinal(String valor) { cartaoFinal=valor; }
    public PedidoModel getPedido() { return pedido; }
    public void setPedido(PedidoModel pedido) { this.pedido=pedido; }
    public CartaoModel getCartao() { return cartao; }
    public void setCartao(CartaoModel cartao) { this.cartao=cartao; }
    public BigDecimal getValor() { return valor; }
    public void setValor(BigDecimal valor) { this.valor=valor; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status=status; }
    public String getReferencia() { return referencia; }
    public void setReferencia(String referencia) { this.referencia=referencia; }
}
