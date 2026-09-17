package com.lucas.ecomm.catalogo.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="estoques")
public class EstoqueModel extends BaseModel {
    @OneToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="produto_id", nullable=false, unique=true)
    private ProdutoModel produto;
    @Column(nullable=false)
    private int quantidade;
    @Column(nullable=false)
    private int reservado;
    public ProdutoModel getProduto() { return produto; }
    public void setProduto(ProdutoModel produto) { this.produto = produto; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
    public int getReservado() { return reservado; }
    public void setReservado(int reservado) { this.reservado = reservado; }
}
