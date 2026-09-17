package com.lucas.ecomm.catalogo.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="grupos_precificacao")
public class GrupoPrecificacaoModel extends BaseModel {
    @Column(nullable=false, unique=true, length=80)
    private String nome;
    @Column(nullable=false, precision=5, scale=2)
    private BigDecimal margemMinima;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public BigDecimal getMargemMinima() { return margemMinima; }
    public void setMargemMinima(BigDecimal margemMinima) { this.margemMinima = margemMinima; }
}
