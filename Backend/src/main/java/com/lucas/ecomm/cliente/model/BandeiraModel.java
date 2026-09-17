package com.lucas.ecomm.cliente.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="bandeiras")
public class BandeiraModel extends BaseModel {
    @Column(nullable=false, unique=true, length=30)
    private String nome;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
}
