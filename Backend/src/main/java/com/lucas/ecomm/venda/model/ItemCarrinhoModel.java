package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.catalogo.model.*;
@Entity @Table(name="itens_carrinho")
public class ItemCarrinhoModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="carrinho_id", nullable=false)
    private CarrinhoModel carrinho;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="produto_id", nullable=false)
    private ProdutoModel produto;
    @Column(nullable=false)
    private int quantidade;
    @Column(nullable=false) private boolean reservado;
    private java.time.Instant removidoEm;
    @Column(length=200) private String motivoRemocao;
    public String getMotivoRemocao() { return motivoRemocao; }
    public void setMotivoRemocao(String valor) { motivoRemocao=valor; }
    public boolean getReservado() { return reservado; }
    public void setReservado(boolean valor) { reservado=valor; }
    public java.time.Instant getRemovidoEm() { return removidoEm; }
    public void setRemovidoEm(java.time.Instant valor) { removidoEm=valor; }
    public CarrinhoModel getCarrinho() { return carrinho; }
    public void setCarrinho(CarrinhoModel carrinho) { this.carrinho=carrinho; }
    public ProdutoModel getProduto() { return produto; }
    public void setProduto(ProdutoModel produto) { this.produto=produto; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade=quantidade; }
}
