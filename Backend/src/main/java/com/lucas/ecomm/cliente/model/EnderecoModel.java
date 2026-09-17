package com.lucas.ecomm.cliente.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="enderecos")
public class EnderecoModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="cliente_id", nullable=false)
    private ClienteModel cliente;
    @Column(nullable=false, length=60)
    private String nome;
    @Column(nullable=false, length=40)
    private String tipoResidencia;
    @Column(nullable=false, length=40)
    private String tipoLogradouro;
    @Column(nullable=false, length=150)
    private String logradouro;
    @Column(nullable=false, length=20)
    private String numero;
    @Column(nullable=false, length=100)
    private String bairro;
    @Column(nullable=false, length=8)
    private String cep;
    @Column(nullable=false, length=100)
    private String cidade;
    @Column(nullable=false, length=2)
    private String estado;
    @Column(nullable=false, length=60)
    private String pais;
    @Column(length=500)
    private String observacoes;
    @Column(nullable=false)
    private boolean residencial;
    @Column(nullable=false)
    private boolean entrega;
    @Column(nullable=false)
    private boolean cobranca;
    public ClienteModel getCliente() { return cliente; }
    public void setCliente(ClienteModel cliente) { this.cliente = cliente; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getTipoResidencia() { return tipoResidencia; }
    public void setTipoResidencia(String tipoResidencia) { this.tipoResidencia = tipoResidencia; }
    public String getTipoLogradouro() { return tipoLogradouro; }
    public void setTipoLogradouro(String tipoLogradouro) { this.tipoLogradouro = tipoLogradouro; }
    public String getLogradouro() { return logradouro; }
    public void setLogradouro(String logradouro) { this.logradouro = logradouro; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getBairro() { return bairro; }
    public void setBairro(String bairro) { this.bairro = bairro; }
    public String getCep() { return cep; }
    public void setCep(String cep) { this.cep = cep; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public boolean getResidencial() { return residencial; }
    public void setResidencial(boolean residencial) { this.residencial = residencial; }
    public boolean getEntrega() { return entrega; }
    public void setEntrega(boolean entrega) { this.entrega = entrega; }
    public boolean getCobranca() { return cobranca; }
    public void setCobranca(boolean cobranca) { this.cobranca = cobranca; }
}
