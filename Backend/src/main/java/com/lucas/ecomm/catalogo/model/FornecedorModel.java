package com.lucas.ecomm.catalogo.model;
import com.lucas.ecomm.shared.model.BaseModel;
import jakarta.persistence.*;
@Entity @Table(name="fornecedores")
public class FornecedorModel extends BaseModel {
    @Column(nullable=false,length=150) private String nome;
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome=nome; }
}
