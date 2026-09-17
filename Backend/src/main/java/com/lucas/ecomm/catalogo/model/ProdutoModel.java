package com.lucas.ecomm.catalogo.model;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.*;
import com.lucas.ecomm.shared.model.BaseModel;

@Entity @Table(name="produtos")
public class ProdutoModel extends BaseModel {
    @Column(nullable=false, length=150)
    private String nome;
    @Column(nullable=false, length=80)
    private String marca;
    @Column(nullable=false, length=2000)
    private String descricao;
    @Column(length=500)
    private String imagem;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal preco;
    @Column(nullable=false, precision=12, scale=2)
    private BigDecimal custo;
    @Column(nullable=false)
    private boolean ativo = true;
    @Column(length=1000) private String justificativaStatus;
    @Column(length=80) private String categoriaStatus;
    public String getJustificativaStatus() { return justificativaStatus; }
    public void setJustificativaStatus(String value) { justificativaStatus=value; }
    public String getCategoriaStatus() { return categoriaStatus; }
    public void setCategoriaStatus(String value) { categoriaStatus=value; }
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="grupo_precificacao_id", nullable=false)
    private GrupoPrecificacaoModel grupoPrecificacao;
    @ManyToMany @JoinTable(name="produto_categorias", joinColumns=@JoinColumn(name="produto_id"), inverseJoinColumns=@JoinColumn(name="categoria_id"))
    private Set<CategoriaModel> categorias = new HashSet<>();
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public String getImagem() { return imagem; }
    public void setImagem(String imagem) { this.imagem = imagem; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public BigDecimal getCusto() { return custo; }
    public void setCusto(BigDecimal custo) { this.custo = custo; }
    public boolean getAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
    public GrupoPrecificacaoModel getGrupoPrecificacao() { return grupoPrecificacao; }
    public void setGrupoPrecificacao(GrupoPrecificacaoModel grupoPrecificacao) { this.grupoPrecificacao = grupoPrecificacao; }
    public Set<CategoriaModel> getCategorias() { return categorias; }
    public void setCategorias(Set<CategoriaModel> categorias) { this.categorias = categorias; }
}
