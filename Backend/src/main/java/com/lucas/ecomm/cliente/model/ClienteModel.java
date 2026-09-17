package com.lucas.ecomm.cliente.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="clientes")
public class ClienteModel extends BaseModel {
    @Column(nullable=false, length=150)
    private String nome;
    @Column(nullable=false, length=40)
    private String genero;
    @Column(nullable=false)
    private LocalDate dataNascimento;
    @Column(nullable=false, unique=true, length=11)
    private String cpf;
    @Column(nullable=false, unique=true, length=254)
    private String email;
    @Column(nullable=false, length=30)
    private String tipoTelefone;
    @Column(nullable=false, length=2)
    private String ddd;
    @Column(nullable=false, length=9)
    private String telefone;
    @Column(nullable=false, length=100)
    private String senhaHash;
    @Column(nullable=false)
    private boolean ativo = true;
    @Column(nullable=false)
    private boolean perfilSelecionavel;
    public boolean getPerfilSelecionavel() { return perfilSelecionavel; }
    public void setPerfilSelecionavel(boolean value) { perfilSelecionavel=value; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }
    public LocalDate getDataNascimento() { return dataNascimento; }
    public void setDataNascimento(LocalDate dataNascimento) { this.dataNascimento = dataNascimento; }
    public String getCpf() { return cpf; }
    public void setCpf(String cpf) { this.cpf = cpf; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getTipoTelefone() { return tipoTelefone; }
    public void setTipoTelefone(String tipoTelefone) { this.tipoTelefone = tipoTelefone; }
    public String getDdd() { return ddd; }
    public void setDdd(String ddd) { this.ddd = ddd; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public boolean getAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
