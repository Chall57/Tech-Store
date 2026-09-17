package com.lucas.ecomm.venda.service;
import com.lucas.ecomm.venda.model.*;
import com.lucas.ecomm.venda.repository.*;
import com.lucas.ecomm.catalogo.repository.EstoqueRepository;
import com.lucas.ecomm.cliente.service.ClienteService;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class TrocaService {
    private final TrocaRepository trocas; private final PedidoRepository pedidos; private final ItemPedidoRepository itens;
    private final CupomRepository cupons; private final EstoqueRepository estoques; private final ClienteService clientes;
    private final NotificacaoClienteRepository notificacoes; private final AuditoriaService auditoria; private final ConsultaVendaService consultas;
    private final jakarta.persistence.EntityManager em;
    public TrocaService(TrocaRepository trocas,PedidoRepository pedidos,ItemPedidoRepository itens,CupomRepository cupons,
        EstoqueRepository estoques,ClienteService clientes,NotificacaoClienteRepository notificacoes,AuditoriaService auditoria,ConsultaVendaService consultas,jakarta.persistence.EntityManager em) {
        this.trocas=trocas; this.pedidos=pedidos; this.itens=itens; this.cupons=cupons; this.estoques=estoques;
        this.clientes=clientes; this.notificacoes=notificacoes; this.auditoria=auditoria; this.consultas=consultas;
        this.em=em;
    }
    public record Solicitar(@NotNull UUID orderId,@NotNull UUID productId,@Min(1) int quantity,@NotBlank @Size(max=1000) String reason) {}
    public record Alterar(@NotBlank String status,Boolean reentradaEstoque,@Size(max=1000) String observacoes) {}
    public record Despachar(@NotBlank @Size(max=100) String carrier,@NotBlank @Size(max=100) String trackingCode,@NotNull @PastOrPresent LocalDate dispatchDate) {}
    private ConsultaVendaService.Troca resposta(UUID id) { return consultas.consultarTroca(id); }
    private TrocaModel bloquear(UUID id) {
        var t=trocas.findById(id).orElseThrow(()->RegraException.inexistente("Troca não encontrada."));
        pedidos.bloquear(t.getItemPedido().getPedido().getId()).orElseThrow();
        // O lock do pedido serializa todas as solicitações e quantidades dos seus itens.
        em.refresh(t);
        return t;
    }
    public ConsultaVendaService.Troca solicitar(UUID clienteId,Solicitar r) {
        clientes.exigir(clienteId);
        var p=pedidos.bloquear(r.orderId()).orElseThrow(()->RegraException.inexistente("Pedido não encontrado."));
        if(!p.getCliente().getId().equals(clienteId)) throw RegraException.inexistente("Pedido não encontrado para este cliente.");
        if(!Set.of("ENTREGUE","EM TROCA").contains(p.getStatus())) throw RegraException.conflito("Somente itens de pedidos entregues podem ser trocados.");
        var i=itens.findByPedidoId(p.getId()).stream().filter(item->item.getProduto().getId().equals(r.productId())).findFirst()
            .orElseThrow(()->RegraException.inexistente("Produto não pertence ao pedido."));
        int solicitados=trocas.findByItemPedidoPedidoId(p.getId()).stream().filter(t->t.getItemPedido().getId().equals(i.getId())&&!t.getStatus().equals("TROCA NEGADA"))
            .mapToInt(TrocaModel::getQuantidade).sum();
        if(r.quantity()>i.getQuantidade()-solicitados) throw RegraException.conflito("Quantidade excede os itens disponíveis para troca.");
        var t=new TrocaModel(); t.setItemPedido(i); t.setQuantidade(r.quantity()); t.setMotivo(r.reason().strip()); t.setStatus("TROCA SOLICITADA");
        trocas.saveAndFlush(t); atualizarPedido(p);
        var result=resposta(t.getId()); auditoria.registrar("SOLICITAR_TROCA","Troca:"+t.getId(),null,result); return result;
    }
    public ConsultaVendaService.Troca despachar(UUID clienteId,UUID id,Despachar r) {
        var t=bloquear(id);
        if(!t.getItemPedido().getPedido().getCliente().getId().equals(clienteId)) throw RegraException.inexistente("Troca não encontrada para este cliente.");
        if(!t.getStatus().equals("TROCA ACEITA")) throw RegraException.conflito("A troca deve estar autorizada antes do despacho.");
        var antes=resposta(id); t.setTransportadora(r.carrier().strip()); t.setCodigoRastreio(r.trackingCode().strip()); t.setDataDespacho(r.dispatchDate()); t.setStatus("ITEM ENVIADO");
        trocas.flush(); var depois=resposta(id); auditoria.registrar("DESPACHAR_TROCA","Troca:"+id,antes,depois); return depois;
    }
    public ConsultaVendaService.Troca alterar(UUID id,Alterar r) {
        var t=bloquear(id); var antes=resposta(id);
        if(t.getStatus().equals(r.status())) return antes; // Repetir recebimento não cria crédito/estoque novamente.
        var permitidos=switch(t.getStatus()) {
            case "TROCA SOLICITADA" -> Set.of("TROCA ACEITA","TROCA NEGADA");
            case "ITEM ENVIADO" -> Set.of("ITEM RECEBIDO");
            case "ITEM RECEBIDO" -> Set.of("TROCA PROCESSADA");
            default -> Set.<String>of();
        };
        if(!permitidos.contains(r.status())) throw RegraException.conflito("Transição de troca inválida.");
        if(r.status().equals("ITEM RECEBIDO")&&r.reentradaEstoque()==null) throw RegraException.invalido("Informe se o item deve retornar ao estoque.");
        t.setStatus(r.status()); t.setObservacoes(r.observacoes());
        t.setStatusDrs(switch(r.status()) { case "TROCA ACEITA" -> "TROCA AUTORIZADA"; case "TROCA NEGADA" -> "TROCA NEGADA"; default -> "TROCADO"; });
        if(r.status().equals("ITEM RECEBIDO")) {
            var i=t.getItemPedido();
            if(Boolean.TRUE.equals(r.reentradaEstoque())) {
                var e=estoques.bloquear(i.getProduto().getId()).orElseThrow(()->RegraException.conflito("Produto sem estoque."));
                var saldoAntes=Map.of("produtoId",i.getProduto().getId(),"quantidade",e.getQuantidade());
                e.setQuantidade(Math.addExact(e.getQuantidade(),t.getQuantidade())); t.setReentradaEstoque(true);
                auditoria.registrar("REENTRADA_TROCA","Estoque:"+e.getId(),saldoAntes,Map.of("produtoId",i.getProduto().getId(),"quantidade",e.getQuantidade(),"trocaId",id));
            }
            var cupom=new CupomModel(); cupom.setCliente(i.getPedido().getCliente()); cupom.setTipo("Troca");
            cupom.setCodigo("TROCA-"+id); cupom.setValor(i.getPrecoUnitario().multiply(BigDecimal.valueOf(t.getQuantidade())));
            if(cupom.getValor().signum()<=0) throw RegraException.conflito("Item sem valor positivo para gerar crédito de troca.");
            cupom.setValidade(LocalDate.now().plusYears(1)); cupons.saveAndFlush(cupom); t.setCupom(cupom);
            auditoria.registrar("GERAR_CUPOM_TROCA","Cupom:"+cupom.getId(),null,Map.of("clienteId",cupom.getCliente().getId(),"valor",cupom.getValor(),"trocaId",id));
        }
        trocas.flush(); atualizarPedido(t.getItemPedido().getPedido());
        var n=new NotificacaoClienteModel(); n.setCliente(t.getItemPedido().getPedido().getCliente()); n.setTroca(t);
        n.setMensagem("Troca de "+t.getItemPedido().getNomeProduto()+": "+t.getStatus()+"."+(t.getCupom()==null?"":" Cupom disponível: "+t.getCupom().getCodigo()));
        notificacoes.saveAndFlush(n); auditoria.registrar("NOTIFICAR_CLIENTE","Notificacao:"+n.getId(),null,Map.of("clienteId",n.getCliente().getId(),"mensagem",n.getMensagem()));
        var depois=resposta(id); auditoria.registrar("ALTERAR_TROCA","Troca:"+id,antes,depois); return depois;
    }
    private void atualizarPedido(PedidoModel p) {
        var lista=trocas.findByItemPedidoPedidoId(p.getId()).stream().filter(t->!t.getStatus().equals("TROCA NEGADA")).toList();
        int quantidade=itens.findByPedidoId(p.getId()).stream().mapToInt(ItemPedidoModel::getQuantidade).sum();
        String status=lista.stream().mapToInt(TrocaModel::getQuantidade).sum()==quantidade
            ? lista.stream().allMatch(t->t.getStatusDrs().equals("TROCADO"))?"TROCADO"
              : lista.stream().allMatch(t->!t.getStatusDrs().equals("EM TROCA"))?"TROCA AUTORIZADA":"EM TROCA" : "ENTREGUE";
        if(!p.getStatus().equals(status)) { var antes=Map.of("status",p.getStatus()); p.setStatus(status);
            auditoria.registrar("STATUS_TROCA_PEDIDO","Pedido:"+p.getId(),antes,Map.of("clienteId",p.getCliente().getId(),"status",status)); }
    }
}
