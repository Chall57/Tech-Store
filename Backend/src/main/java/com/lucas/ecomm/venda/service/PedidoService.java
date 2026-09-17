package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.venda.dto.CheckoutRequest;
import com.lucas.ecomm.venda.model.*;
import com.lucas.ecomm.venda.repository.*;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.cliente.repository.*;
import com.lucas.ecomm.cliente.service.ClienteService;
import com.lucas.ecomm.catalogo.repository.EstoqueRepository;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class PedidoService {
    private final ClienteService clientes; private final CarrinhoService carrinho;
    private final ItemCarrinhoRepository itensCarrinho; private final CarrinhoRepository carrinhos;
    private final EnderecoRepository enderecos; private final CartaoRepository cartoes;
    private final CupomRepository cupons; private final PedidoRepository pedidos;
    private final ItemPedidoRepository itens; private final PagamentoRepository pagamentos;
    private final PedidoCupomRepository aplicados; private final EstoqueRepository estoques;
    private final FreteService frete; private final ProcessadorPagamento processador;
    private final ConsultaVendaService consultas; private final AuditoriaService auditoria;
    private static final BigDecimal ZERO=new BigDecimal("0.00");
    public PedidoService(ClienteService clientes,CarrinhoService carrinho,ItemCarrinhoRepository itensCarrinho,
        CarrinhoRepository carrinhos,EnderecoRepository enderecos,CartaoRepository cartoes,CupomRepository cupons,
        PedidoRepository pedidos,ItemPedidoRepository itens,PagamentoRepository pagamentos,PedidoCupomRepository aplicados,
        EstoqueRepository estoques,FreteService frete,ProcessadorPagamento processador,ConsultaVendaService consultas,AuditoriaService auditoria) {
        this.clientes=clientes; this.carrinho=carrinho; this.itensCarrinho=itensCarrinho; this.carrinhos=carrinhos;
        this.enderecos=enderecos; this.cartoes=cartoes; this.cupons=cupons; this.pedidos=pedidos; this.itens=itens;
        this.pagamentos=pagamentos; this.aplicados=aplicados; this.estoques=estoques; this.frete=frete;
        this.processador=processador; this.consultas=consultas; this.auditoria=auditoria;
    }
    public record Selecao(UUID enderecoId,List<@NotNull UUID> cupomIds) {}
    public record Item(UUID productId,String name,int quantity,BigDecimal unitPrice,BigDecimal subtotal) {}
    public record Orcamento(List<Item> items,BigDecimal subtotal,BigDecimal frete,BigDecimal totalCompra,BigDecimal desconto,
        BigDecimal totalCartoes,BigDecimal creditoTroca,Instant expiresAt,List<CarrinhoService.Removido> removed,
        List<String> warnings,String revisao,String modoPagamento) {}
    private EnderecoModel endereco(UUID clienteId,UUID id) {
        if(id==null) return null;
        var e=enderecos.findByIdAndClienteId(id,clienteId).orElseThrow(()->RegraException.inexistente("Endereço não encontrado para este cliente."));
        if(!e.getEntrega()) throw RegraException.invalido("Selecione um endereço de entrega.");
        return e;
    }
    private List<CupomModel> selecionarCupons(UUID clienteId,List<UUID> ids) {
        if(ids==null) return List.of();
        if(new HashSet<>(ids).size()!=ids.size()||ids.contains(null)) throw RegraException.invalido("Não repita cupons na compra.");
        var lista=ids.stream().sorted().map(id->cupons.bloquear(id).orElseThrow(()->RegraException.inexistente("Cupom não encontrado."))).toList();
        for(var c:lista) {
            if(c.getCliente()!=null&&!c.getCliente().getId().equals(clienteId)) throw RegraException.inexistente("Cupom não disponível para este cliente.");
            if(c.getUtilizado()||c.getValidade().isBefore(LocalDate.now())) throw RegraException.conflito("Cupom "+c.getCodigo()+" utilizado ou expirado.");
        }
        if(lista.stream().filter(c->c.getTipo().equals("Promocional")).count()>1) throw RegraException.invalido("Utilize apenas um cupom promocional por compra.");
        return lista;
    }
    private List<ItemCarrinhoModel> ativos(UUID clienteId) {
        return itensCarrinho.findByCarrinhoClienteId(clienteId).stream().filter(i->i.getRemovidoEm()==null)
            .sorted(Comparator.comparing(i->i.getProduto().getId())).toList();
    }
    public Orcamento orcamento(UUID clienteId,Selecao selecao) {
        var cliente=clientes.bloquear(clienteId);
        if(!cliente.getAtivo()) throw RegraException.conflito("Cliente inativo não pode finalizar compras.");
        var resumo=carrinho.resumo(clienteId); var destino=endereco(clienteId,selecao.enderecoId());
        var lista=ativos(clienteId).stream().map(i->new Item(i.getProduto().getId(),i.getProduto().getNome(),i.getQuantidade(),
            i.getProduto().getPreco(),i.getProduto().getPreco().multiply(BigDecimal.valueOf(i.getQuantidade())))).toList();
        BigDecimal subtotal=lista.stream().map(Item::subtotal).reduce(ZERO,BigDecimal::add);
        BigDecimal entrega=frete.calcular(destino,lista.stream().mapToLong(Item::quantity).sum());
        BigDecimal total=subtotal.add(entrega);
        var selecionados=selecionarCupons(clienteId,selecao.cupomIds());
        BigDecimal valor=selecionados.stream().map(CupomModel::getValor).reduce(ZERO,BigDecimal::add);
        if(!lista.isEmpty()) for(var c:selecionados) {
            if(valor.subtract(c.getValor()).compareTo(total)>=0)
                throw RegraException.invalido("Remova cupons desnecessários: os demais já cobrem a compra.");
        }
        String estado=lista.toString()+selecao.enderecoId()+entrega+selecionados.stream().map(c->c.getId()+":"+c.getValor()).toList();
        String revisao;
        try { revisao=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(estado.getBytes(StandardCharsets.UTF_8))); }
        catch(java.security.NoSuchAlgorithmException erro) { throw new IllegalStateException(erro); }
        return new Orcamento(lista,subtotal,entrega,total,total.min(valor),total.subtract(valor).max(ZERO),valor.subtract(total).max(ZERO),
            resumo.expiresAt(),resumo.removed(),resumo.warnings(),revisao,"LOCAL");
    }
    public ConsultaVendaService.Pedido finalizar(UUID clienteId,CheckoutRequest r) {
        var cliente=clientes.bloquear(clienteId);
        var anterior=pedidos.findByClienteIdAndChaveOperacao(clienteId,r.chaveOperacao());
        if(anterior.isPresent()) return consultas.consultar(anterior.get().getId());
        var q=orcamento(clienteId,new Selecao(r.enderecoId(),r.cupomIds()));
        if(q.items().isEmpty()) throw RegraException.conflito("Carrinho vazio ou reserva expirada. Adicione os produtos novamente.");
        if(!q.revisao().equals(r.revisao())||q.totalCompra().compareTo(r.totalEsperado())!=0)
            throw RegraException.conflito("O carrinho, os preços ou o frete mudaram. Confira o resumo atualizado antes de finalizar.");
        var lista=ativos(clienteId); var vouchers=selecionarCupons(clienteId,r.cupomIds());
        var destinos=new HashSet<UUID>(); BigDecimal soma=ZERO;
        for(var pagamento:r.pagamentos()) {
            if(!destinos.add(pagamento.cartaoId())) throw RegraException.invalido("Selecione cada cartão uma única vez.");
            var c=cartoes.findByIdAndClienteId(pagamento.cartaoId(),clienteId).orElseThrow(()->RegraException.inexistente("Cartão não encontrado para este cliente."));
            if(YearMonth.parse(c.getValidade(),java.time.format.DateTimeFormatter.ofPattern("MM/yy")).isBefore(YearMonth.now())) throw RegraException.invalido("Cartão vencido.");
            boolean excecao=!vouchers.isEmpty()&&q.totalCartoes().compareTo(new BigDecimal("10.00"))<0&&r.pagamentos().size()==1;
            if(pagamento.valor().compareTo(new BigDecimal("10.00"))<0&&!excecao) throw RegraException.invalido("Cada cartão deve pagar pelo menos R$ 10,00. Para saldo inferior após cupons, utilize um único cartão.");
            soma=soma.add(pagamento.valor());
        }
        if(soma.compareTo(q.totalCartoes())!=0) throw RegraException.invalido("A soma dos cartões deve corresponder ao saldo após os cupons.");
        var e=endereco(clienteId,r.enderecoId());
        var p=new PedidoModel(); p.setCliente(cliente); p.setEndereco(e);
        p.setEnderecoEntrega(e.getTipoLogradouro()+" "+e.getLogradouro()+", "+e.getNumero()+" - "+e.getBairro()+" - "+e.getCidade()+"/"+e.getEstado()+" - CEP "+e.getCep()+" - "+e.getPais());
        p.setSubtotal(q.subtotal()); p.setFrete(q.frete()); p.setDesconto(q.desconto()); p.setTotal(q.totalCompra());
        p.setExcedenteCupons(q.creditoTroca()); p.setStatus("EM PROCESSAMENTO"); p.setControlaEstoque(true);
        p.setChaveOperacao(r.chaveOperacao()); p.setExpiraEm(Instant.now().plus(carrinho.prazo())); pedidos.saveAndFlush(p);
        for(var item:lista) {
            var i=new ItemPedidoModel(); i.setPedido(p); i.setProduto(item.getProduto()); i.setNomeProduto(item.getProduto().getNome());
            i.setCategoriasHistoricas(item.getProduto().getCategorias().stream().collect(java.util.stream.Collectors.toMap(c->c.getId(),c->c.getNome())));
            i.setPrecoUnitario(item.getProduto().getPreco()); i.setQuantidade(item.getQuantidade()); itens.save(i);
        }
        for(var pag:r.pagamentos()) {
            var c=cartoes.findByIdAndClienteId(pag.cartaoId(),clienteId).orElseThrow();
            var pg=new PagamentoModel(); pg.setPedido(p); pg.setCartao(c); pg.setValor(pag.valor()); pg.setStatus("PENDENTE");
            pg.setBandeira(c.getBandeira().getNome()); pg.setCartaoFinal(c.getUltimosDigitos()); pagamentos.save(pg);
        }
        BigDecimal restante=q.desconto();
        for(var c:vouchers) {
            // Distribui centavos proporcionalmente: toda associação tem valor aplicado positivo.
            BigDecimal proporcao=c.getValor().multiply(q.desconto()).divide(vouchers.stream().map(CupomModel::getValor).reduce(ZERO,BigDecimal::add),2,java.math.RoundingMode.DOWN);
            BigDecimal utilizado=c==vouchers.getLast()?restante:proporcao; restante=restante.subtract(utilizado);
            if(utilizado.signum()>0) aplicados.save(new PedidoCupomModel(p,c,utilizado));
            c.setUtilizado(true);
            auditoria.registrar("UTILIZAR_CUPOM","Cupom:"+c.getId(),null,Map.of("clienteId",clienteId,"pedidoId",p.getId(),"codigo",c.getCodigo()));
        }
        // A reserva passa do carrinho ao pedido; a quantidade física só baixa após aprovação.
        itensCarrinho.deleteAll(lista); itensCarrinho.flush(); carrinhos.findByClienteId(clienteId).ifPresent(c->c.setExpiraEm(null));
        itens.flush(); pagamentos.flush(); aplicados.flush();
        var resultado=consultas.consultar(p.getId()); auditoria.registrar("FINALIZAR_COMPRA","Pedido:"+p.getId(),null,resultado);
        return resultado;
    }
    private PedidoModel bloquear(UUID id) {
        var existente=pedidos.findById(id).orElseThrow(()->RegraException.inexistente("Pedido não encontrado."));
        clientes.bloquear(existente.getCliente().getId());
        return pedidos.bloquear(id).orElseThrow();
    }
    private void movimentarReserva(PedidoModel p,boolean aprovado) {
        if(!p.getControlaEstoque()) return; // Históricos anteriores não possuíam reserva controlada.
        for(var i:itens.findByPedidoId(p.getId()).stream().sorted(Comparator.comparing(i->i.getProduto().getId())).toList()) {
            var e=estoques.bloquear(i.getProduto().getId()).orElseThrow();
            if(e.getReservado()<i.getQuantidade()) throw RegraException.conflito("Reserva de estoque inconsistente. O pedido não foi alterado.");
            e.setReservado(e.getReservado()-i.getQuantidade());
            if(aprovado) e.setQuantidade(e.getQuantidade()-i.getQuantidade());
        }
    }
    private void devolverCupons(PedidoModel p) {
        for(var a:aplicados.findByPedidoId(p.getId()).stream().sorted(Comparator.comparing(a->a.getCupom().getId())).toList()) {
            var c=cupons.bloquear(a.getCupom().getId()).orElseThrow(); c.setUtilizado(false);
            auditoria.registrar("DEVOLVER_CUPOM","Cupom:"+c.getId(),null,Map.of("clienteId",p.getCliente().getId(),"pedidoId",p.getId()));
        }
    }
    public ConsultaVendaService.Pedido processar(UUID id) {
        var p=bloquear(id);
        if(!p.getStatus().equals("EM PROCESSAMENTO")) return consultas.consultar(id); // Retentativa idempotente.
        if(p.getExpiraEm()!=null&&!p.getExpiraEm().isAfter(Instant.now())) return recusar(p,"REPROVADA");
        assegurarReserva(p);
        var lista=pagamentos.findByPedidoId(id); boolean aprovado=true;
        for(var pg:lista) {
            var retorno=processador.autorizar(pg.getCartao(),pg.getValor()); pg.setReferencia(retorno.referencia());
            aprovado&=retorno.aprovado();
        }
        if(!aprovado) return recusar(p,"REPROVADA");
        var antes=consultas.consultar(id); movimentarReserva(p,true);
        lista.forEach(pg->pg.setStatus("APROVADO")); p.setStatus("APROVADA"); p.setExpiraEm(null);
        if(p.getExcedenteCupons().signum()>0&&p.getCupomSaldo()==null) {
            var c=new CupomModel(); c.setCliente(p.getCliente()); c.setCodigo("SALDO-"+id); c.setTipo("Troca");
            c.setValor(p.getExcedenteCupons()); c.setValidade(LocalDate.now().plusYears(1)); cupons.saveAndFlush(c); p.setCupomSaldo(c);
            auditoria.registrar("GERAR_CREDITO","Cupom:"+c.getId(),null,Map.of("clienteId",p.getCliente().getId(),"valor",c.getValor(),"pedidoId",id));
        }
        pedidos.flush(); pagamentos.flush(); var depois=consultas.consultar(id);
        auditoria.registrar("APROVAR_PAGAMENTO","Pedido:"+id,antes,depois); return depois;
    }
    private void assegurarReserva(PedidoModel p) {
        if(p.getControlaEstoque()) return;
        for(var item:itens.findByPedidoId(p.getId()).stream().sorted(Comparator.comparing(i->i.getProduto().getId())).toList()) {
            var e=estoques.bloquear(item.getProduto().getId()).orElseThrow();
            if(e.getQuantidade()-e.getReservado()<item.getQuantidade()) throw RegraException.conflito("Estoque insuficiente para processar o pedido.");
            e.setReservado(e.getReservado()+item.getQuantidade());
        }
        p.setControlaEstoque(true); p.setExpiraEm(Instant.now().plus(carrinho.prazo()));
    }
    private ConsultaVendaService.Pedido recusar(PedidoModel p,String status) {
        var antes=consultas.consultar(p.getId()); movimentarReserva(p,false); devolverCupons(p);
        p.setStatus(status); p.setExpiraEm(null); pagamentos.findByPedidoId(p.getId()).forEach(pg->pg.setStatus(status.equals("CANCELADO")?"CANCELADO":"REPROVADO"));
        pedidos.flush(); pagamentos.flush(); var depois=consultas.consultar(p.getId());
        auditoria.registrar(status,"Pedido:"+p.getId(),antes,depois); return depois;
    }
    public ConsultaVendaService.Pedido status(UUID id,String status) {
        var p=bloquear(id); String atual=p.getStatus();
        if(atual.equals(status)) return consultas.consultar(id);
        if(status.equals("APROVADA")||status.equals("PAGAMENTO REALIZADO")) {
            if(!atual.equals("EM PROCESSAMENTO")) throw RegraException.conflito("Somente pedido em processamento pode ter pagamento aprovado.");
            var resultado=processar(id);
            if(status.equals("PAGAMENTO REALIZADO")&&resultado.status().equals("APROVADA")) {
                p.setStatus(status); pedidos.flush(); auditoria.registrar("ALTERAR_STATUS","Pedido:"+id,resultado,consultas.consultar(id));
            }
            pedidos.flush(); return consultas.consultar(id);
        }
        if(Set.of("CANCELADO","REPROVADA").contains(status)&&Set.of("EM ABERTO","EM PROCESSAMENTO").contains(atual)) return recusar(p,status);
        boolean permitido=status.equals("EM PROCESSAMENTO")&&atual.equals("EM ABERTO")
            ||Set.of("EM TRÂNSITO","EM TRANSPORTE").contains(status)&&Set.of("APROVADA","PAGAMENTO REALIZADO").contains(atual)
            ||status.equals("ENTREGUE")&&Set.of("EM TRÂNSITO","EM TRANSPORTE").contains(atual);
        if(!permitido) throw RegraException.conflito("Transição incompatível com o status atual do pedido.");
        var antes=consultas.consultar(id);
        if(status.equals("EM PROCESSAMENTO")) assegurarReserva(p);
        p.setStatus(status); pedidos.flush(); var depois=consultas.consultar(id);
        auditoria.registrar("ALTERAR_STATUS","Pedido:"+id,antes,depois); return depois;
    }
    public ConsultaVendaService.Pedido statusCliente(UUID clienteId,UUID id,String status) {
        var p=bloquear(id);
        if(!p.getCliente().getId().equals(clienteId)) throw RegraException.inexistente("Pedido não encontrado para este cliente.");
        if(!Set.of("CANCELADO","ENTREGUE").contains(status)) throw RegraException.invalido("Ação de cliente inválida.");
        return status(id,status);
    }
    public void expirar(UUID id) {
        var p=bloquear(id);
        if(p.getStatus().equals("EM PROCESSAMENTO")&&p.getExpiraEm()!=null&&!p.getExpiraEm().isAfter(Instant.now())) recusar(p,"REPROVADA");
    }
}
