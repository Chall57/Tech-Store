package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.catalogo.model.*;
@Entity @Table(name="itens_pedido")
public class ItemPedidoModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="pedido_id", nullable=false)
    private PedidoModel pedido;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="produto_id", nullable=false)
    private ProdutoModel produto;
    @Column(nullable=false, length=150)
    private String nomeProduto;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal precoUnitario;
    @Column(nullable=false)
    private int quantidade;
    @ElementCollection
    @CollectionTable(name="item_pedido_categorias",joinColumns=@JoinColumn(name="item_pedido_id"))
    @MapKeyColumn(name="categoria_id") @Column(name="nome_categoria",nullable=false,length=80)
    private java.util.Map<java.util.UUID,String> categoriasHistoricas=new java.util.HashMap<>();
    public java.util.Map<java.util.UUID,String> getCategoriasHistoricas() { return categoriasHistoricas; }
    public void setCategoriasHistoricas(java.util.Map<java.util.UUID,String> value) { categoriasHistoricas=value; }
    public PedidoModel getPedido() { return pedido; }
    public void setPedido(PedidoModel pedido) { this.pedido=pedido; }
    public ProdutoModel getProduto() { return produto; }
    public void setProduto(ProdutoModel produto) { this.produto=produto; }
    public String getNomeProduto() { return nomeProduto; }
    public void setNomeProduto(String nomeProduto) { this.nomeProduto=nomeProduto; }
    public BigDecimal getPrecoUnitario() { return precoUnitario; }
    public void setPrecoUnitario(BigDecimal precoUnitario) { this.precoUnitario=precoUnitario; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade=quantidade; }
}
