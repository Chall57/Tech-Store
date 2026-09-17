package com.lucas.ecomm.venda.service;
import com.lucas.ecomm.venda.model.*;
import com.lucas.ecomm.venda.repository.*;
import com.lucas.ecomm.cliente.service.ClienteService;
import com.lucas.ecomm.shared.repository.AuditoriaRepository;
import java.util.*;
import java.math.BigDecimal;
import java.time.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class ConsultaVendaService {
    private final PedidoRepository pedidos; private final ItemPedidoRepository itens;
    private final TrocaRepository trocas; private final PagamentoRepository pagamentos;
    private final CupomRepository cupons; private final ClienteService clientes;
    private final PedidoCupomRepository cuponsAplicados; private final AuditoriaRepository auditorias;
    private final NotificacaoClienteRepository notificacoes;
    public ConsultaVendaService(PedidoRepository pedidos, ItemPedidoRepository itens, TrocaRepository trocas,
        PagamentoRepository pagamentos, CupomRepository cupons, ClienteService clientes,
        PedidoCupomRepository cuponsAplicados, AuditoriaRepository auditorias,NotificacaoClienteRepository notificacoes) {
        this.pedidos=pedidos; this.itens=itens; this.trocas=trocas; this.pagamentos=pagamentos; this.cupons=cupons; this.clientes=clientes;
        this.cuponsAplicados=cuponsAplicados; this.auditorias=auditorias;
        this.notificacoes=notificacoes;
    }
    public record Item(UUID productId,int quantity,String name,BigDecimal unitPrice) {}
    public record PagamentoPedido(UUID cardId,BigDecimal amount,String status,String brand,String lastDigits) {}
    public record Pedido(UUID id,UUID customerId,Instant date,BigDecimal total,String status,List<Item> items,String productSummary,UUID addressId,String addressSnapshot,List<String> couponCodes,List<PagamentoPedido> payments,BigDecimal subtotal,BigDecimal frete,BigDecimal desconto,String creditCouponCode,BigDecimal creditValue,Instant expiresAt,Long numero) {}
    public record Troca(UUID id,UUID orderId,UUID customerId,UUID productId,String productName,int quantity,String reason,String status,String carrier,String trackingCode,String statusDrs,boolean reentradaEstoque,String couponCode,LocalDate dispatchDate,String observacoes,Long orderNumber) {}
    public record Notificacao(UUID id,Instant data,String mensagem) {}
    public record Pagamento(UUID id,UUID pedidoId,BigDecimal valor,String status,String cartaoFinal,Long pedidoNumero) {}
    public record Cupom(UUID id,String code,String type,BigDecimal value,LocalDate validUntil,String status) {}
    public record Atividade(UUID id,Instant data,String acao,String entidade,String responsavel) {}
    private Pedido pedido(PedidoModel p) {
        var lista=itens.findByPedidoId(p.getId());
        return new Pedido(p.getId(),p.getCliente().getId(),p.getCriadoEm(),p.getTotal(),p.getStatus(),
            lista.stream().map(i->new Item(i.getProduto().getId(),i.getQuantidade(),i.getNomeProduto(),i.getPrecoUnitario())).toList(),
            String.join(" + ",lista.stream().map(ItemPedidoModel::getNomeProduto).toList()),p.getEndereco()==null?null:p.getEndereco().getId(),p.getEnderecoEntrega(),
            cuponsAplicados.findByPedidoId(p.getId()).stream().map(c->c.getCupom().getCodigo()).toList(),
            pagamentos.findByPedidoId(p.getId()).stream().map(pg->new PagamentoPedido(
                pg.getCartao()==null?null:pg.getCartao().getId(),pg.getValor(),pg.getStatus(),
                pg.getBandeira()!=null?pg.getBandeira():pg.getCartao()==null?null:pg.getCartao().getBandeira().getNome(),
                pg.getCartaoFinal()!=null?pg.getCartaoFinal():pg.getCartao()==null?null:pg.getCartao().getUltimosDigitos())).toList(),
            p.getSubtotal(),p.getFrete(),p.getDesconto(),p.getCupomSaldo()==null?null:p.getCupomSaldo().getCodigo(),p.getExcedenteCupons(),p.getExpiraEm(),p.getNumero());
    }
    private Troca troca(TrocaModel t) {
        var i=t.getItemPedido(); var p=i.getPedido();
        return new Troca(t.getId(),p.getId(),p.getCliente().getId(),i.getProduto().getId(),i.getNomeProduto(),t.getQuantidade(),t.getMotivo(),t.getStatus(),t.getTransportadora(),t.getCodigoRastreio(),t.getStatusDrs(),t.getReentradaEstoque(),t.getCupom()==null?null:t.getCupom().getCodigo(),t.getDataDespacho(),t.getObservacoes(),p.getNumero());
    }
    public Troca consultarTroca(UUID id) { return troca(trocas.findById(id).orElseThrow(()->com.lucas.ecomm.shared.api.RegraException.inexistente("Troca não encontrada."))); }
    public List<Pedido> pedidos(UUID clienteId) {
        if(clienteId!=null) clientes.exigir(clienteId);
        return (clienteId==null?pedidos.findAllByOrderByCriadoEmDesc():pedidos.findByClienteIdOrderByCriadoEmDesc(clienteId)).stream().map(this::pedido).toList();
    }
    public Pedido consultar(UUID id) {
        return pedido(pedidos.findById(id).orElseThrow(()->com.lucas.ecomm.shared.api.RegraException.inexistente("Pedido não encontrado.")));
    }
    public List<Troca> trocas(UUID clienteId) {
        if(clienteId!=null) clientes.exigir(clienteId);
        return (clienteId==null?trocas.findAll():trocas.findByItemPedidoPedidoClienteId(clienteId)).stream().map(this::troca).toList();
    }
    public List<Cupom> cupons(UUID clienteId) {
        clientes.exigir(clienteId);
        return cupons.findByClienteIdOrClienteIsNull(clienteId).stream().map(c->new Cupom(c.getId(),c.getCodigo(),
            "Cupom "+(c.getTipo().equals("Troca")?"de troca":"promocional"),c.getValor(),c.getValidade(),
            c.getUtilizado()?"Utilizado":c.getValidade().isBefore(LocalDate.now())?"Expirado":"Disponível")).toList();
    }
    public Map<String,Object> transacoes(UUID clienteId) {
        clientes.exigir(clienteId);
        var lista=pagamentos.findByPedidoClienteId(clienteId).stream().map(p->new Pagamento(p.getId(),p.getPedido().getId(),p.getValor(),p.getStatus(),p.getCartaoFinal()!=null?p.getCartaoFinal():p.getCartao()==null?null:p.getCartao().getUltimosDigitos(),p.getPedido().getNumero())).toList();
        var atividades=auditorias.atividadesDoCliente(clienteId.toString()).stream()
            .map(a->new Atividade(a.getId(),a.getCriadoEm(),a.getOperacao(),a.getEntidade(),a.getResponsavel())).toList();
        var avisos=notificacoes.findByClienteIdOrderByCriadoEmDesc(clienteId).stream().map(n->new Notificacao(n.getId(),n.getCriadoEm(),n.getMensagem())).toList();
        return Map.of("pedidos",pedidos(clienteId),"trocas",trocas(clienteId),"pagamentos",lista,"cupons",cupons(clienteId),"atividades",atividades,"notificacoes",avisos);
    }
}
