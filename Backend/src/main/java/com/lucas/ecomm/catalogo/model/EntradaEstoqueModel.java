package com.lucas.ecomm.catalogo.model;
import com.lucas.ecomm.shared.model.BaseModel;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
@Entity @Table(name="entradas_estoque")
public class EntradaEstoqueModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="produto_id",nullable=false) private ProdutoModel produto;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="fornecedor_id",nullable=false) private FornecedorModel fornecedor;
    @Column(nullable=false) private int quantidade;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal custoUnitario;
    @Column(nullable=false) private LocalDate dataEntrada;
    public ProdutoModel getProduto() { return produto; }
    public void setProduto(ProdutoModel value) { produto=value; }
    public FornecedorModel getFornecedor() { return fornecedor; }
    public void setFornecedor(FornecedorModel value) { fornecedor=value; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int value) { quantidade=value; }
    public BigDecimal getCustoUnitario() { return custoUnitario; }
    public void setCustoUnitario(BigDecimal value) { custoUnitario=value; }
    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate value) { dataEntrada=value; }
}
