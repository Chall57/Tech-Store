package com.lucas.ecomm.venda.model;
import com.lucas.ecomm.shared.model.BaseModel;
import com.lucas.ecomm.cliente.model.ClienteModel;
import jakarta.persistence.*;
@Entity @Table(name="notificacoes_cliente")
public class NotificacaoClienteModel extends BaseModel {
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="cliente_id",nullable=false) private ClienteModel cliente;
    @ManyToOne(fetch=FetchType.LAZY) @JoinColumn(name="troca_id") private TrocaModel troca;
    @Column(nullable=false,length=1000) private String mensagem;
    public ClienteModel getCliente() { return cliente; }
    public void setCliente(ClienteModel value) { cliente=value; }
    public TrocaModel getTroca() { return troca; }
    public void setTroca(TrocaModel value) { troca=value; }
    public String getMensagem() { return mensagem; }
    public void setMensagem(String value) { mensagem=value; }
}
