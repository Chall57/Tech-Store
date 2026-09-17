package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.catalogo.model.*;
@Entity @Table(name="pedidos")
public class PedidoModel extends BaseModel {
    @org.hibernate.annotations.Generated(event=org.hibernate.generator.EventType.INSERT)
    @Column(nullable=false, unique=true, insertable=false, updatable=false)
    private Long numero;
    public Long getNumero() { return numero; }
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="cliente_id", nullable=false)
    private ClienteModel cliente;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="endereco_id")
    private EnderecoModel endereco;
    @Column(nullable=false, columnDefinition="text")
    private String enderecoEntrega;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal total;
    @Column(nullable=false, length=40)
    private String status;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal subtotal=BigDecimal.ZERO;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal frete=BigDecimal.ZERO;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal desconto=BigDecimal.ZERO;
    @Column(nullable=false,precision=12,scale=2) private BigDecimal excedenteCupons=BigDecimal.ZERO;
    @OneToOne(fetch=FetchType.LAZY) @JoinColumn(name="cupom_saldo_id",unique=true) private CupomModel cupomSaldo;
    private java.util.UUID chaveOperacao;
    private java.time.Instant expiraEm;
    @Column(nullable=false) private boolean controlaEstoque;
    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal valor) { subtotal=valor; }
    public BigDecimal getFrete() { return frete; }
    public void setFrete(BigDecimal valor) { frete=valor; }
    public BigDecimal getDesconto() { return desconto; }
    public void setDesconto(BigDecimal valor) { desconto=valor; }
    public BigDecimal getExcedenteCupons() { return excedenteCupons; }
    public void setExcedenteCupons(BigDecimal valor) { excedenteCupons=valor; }
    public CupomModel getCupomSaldo() { return cupomSaldo; }
    public void setCupomSaldo(CupomModel valor) { cupomSaldo=valor; }
    public java.util.UUID getChaveOperacao() { return chaveOperacao; }
    public void setChaveOperacao(java.util.UUID valor) { chaveOperacao=valor; }
    public java.time.Instant getExpiraEm() { return expiraEm; }
    public void setExpiraEm(java.time.Instant valor) { expiraEm=valor; }
    public boolean getControlaEstoque() { return controlaEstoque; }
    public void setControlaEstoque(boolean valor) { controlaEstoque=valor; }
    public ClienteModel getCliente() { return cliente; }
    public void setCliente(ClienteModel cliente) { this.cliente=cliente; }
    public EnderecoModel getEndereco() { return endereco; }
    public void setEndereco(EnderecoModel endereco) { this.endereco=endereco; }
    public String getEnderecoEntrega() { return enderecoEntrega; }
    public void setEnderecoEntrega(String enderecoEntrega) { this.enderecoEntrega=enderecoEntrega; }
    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total=total; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status=status; }
}
