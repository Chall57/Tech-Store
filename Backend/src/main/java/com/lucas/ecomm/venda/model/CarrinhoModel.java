package com.lucas.ecomm.venda.model;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.catalogo.model.*;
@Entity @Table(name="carrinhos")
public class CarrinhoModel extends BaseModel {
    @OneToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="cliente_id", nullable=false, unique=true)
    private ClienteModel cliente;
    private java.time.Instant expiraEm;
    public java.time.Instant getExpiraEm() { return expiraEm; }
    public void setExpiraEm(java.time.Instant valor) { expiraEm=valor; }
    public ClienteModel getCliente() { return cliente; }
    public void setCliente(ClienteModel cliente) { this.cliente=cliente; }
}
