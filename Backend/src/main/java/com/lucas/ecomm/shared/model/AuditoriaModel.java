package com.lucas.ecomm.shared.model;
import jakarta.persistence.*;
@Entity @Table(name="auditorias")
public class AuditoriaModel extends BaseModel {
    @Column(nullable=false) private String responsavel;
    @Column(nullable=false) private String operacao;
    @Column(nullable=false) private String entidade;
    @Column(nullable=false, columnDefinition="text") private String alteracoes;
    protected AuditoriaModel() {}
    public AuditoriaModel(String responsavel, String operacao, String entidade, String alteracoes) {
        this.responsavel=responsavel; this.operacao=operacao; this.entidade=entidade; this.alteracoes=alteracoes;
    }
    public String getResponsavel() { return responsavel; }
    public String getOperacao() { return operacao; }
    public String getEntidade() { return entidade; }
}
