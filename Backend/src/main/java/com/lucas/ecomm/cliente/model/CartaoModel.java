package com.lucas.ecomm.cliente.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="cartoes")
public class CartaoModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="cliente_id", nullable=false)
    private ClienteModel cliente;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="bandeira_id", nullable=false)
    private BandeiraModel bandeira;
    @Column(nullable=false, length=150)
    private String titular;
    @Column(nullable=false, length=4)
    private String ultimosDigitos;
    @Column(nullable=false, length=5)
    private String validade;
    @Column(nullable=false, length=64)
    private String impressaoDigital;
    @Column(nullable=false)
    private boolean preferencial;
    public ClienteModel getCliente() { return cliente; }
    public void setCliente(ClienteModel cliente) { this.cliente = cliente; }
    public BandeiraModel getBandeira() { return bandeira; }
    public void setBandeira(BandeiraModel bandeira) { this.bandeira = bandeira; }
    public String getTitular() { return titular; }
    public void setTitular(String titular) { this.titular = titular; }
    public String getUltimosDigitos() { return ultimosDigitos; }
    public void setUltimosDigitos(String ultimosDigitos) { this.ultimosDigitos = ultimosDigitos; }
    public String getValidade() { return validade; }
    public void setValidade(String validade) { this.validade = validade; }
    public String getImpressaoDigital() { return impressaoDigital; }
    public void setImpressaoDigital(String impressaoDigital) { this.impressaoDigital = impressaoDigital; }
    public boolean getPreferencial() { return preferencial; }
    public void setPreferencial(boolean preferencial) { this.preferencial = preferencial; }
}
