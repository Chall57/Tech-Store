package com.lucas.ecomm.catalogo.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="categorias")
public class CategoriaModel extends BaseModel {
    @Column(nullable=false, unique=true, length=80)
    private String nome;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
}
