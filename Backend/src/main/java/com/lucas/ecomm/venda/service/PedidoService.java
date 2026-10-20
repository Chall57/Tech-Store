package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.venda.dto.CheckoutRequest;
import com.lucas.ecomm.venda.model.*;
import com.lucas.ecomm.venda.repository.*;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.cliente.repository.*;
import com.lucas.ecomm.cliente.service.ClienteService;
import com.lucas.ecomm.cliente.service.EnderecoService;
import com.lucas.ecomm.cliente.service.CartaoService;
import com.lucas.ecomm.cliente.dto.EnderecoRequest;
import com.lucas.ecomm.catalogo.repository.EstoqueRepository;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.Valid;
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
    private final EnderecoService enderecoService; private final CartaoService cartaoService;
    private static final BigDecimal ZERO=new BigDecimal("0.00");
    public PedidoService(ClienteService clientes,CarrinhoService carrinho,ItemCarrinhoRepository itensCarrinho,
        CarrinhoRepository carrinhos,EnderecoRepository enderecos,CartaoRepository cartoes,CupomRepository cupons,
        PedidoRepository pedidos,ItemPedidoRepository itens,PagamentoRepository pagamentos,PedidoCupomRepository aplicados,
        EstoqueRepository estoques,FreteService frete,ProcessadorPagamento processador,ConsultaVendaService consultas,AuditoriaService auditoria,
        EnderecoService enderecoService,CartaoService cartaoService) {
        this.clientes=clientes; this.carrinho=carrinho; this.itensCarrinho=itensCarrinho; this.carrinhos=carrinhos;
        this.enderecos=enderecos; this.cartoes=cartoes; this.cupons=cupons; this.pedidos=pedidos; this.itens=itens;
        this.pagamentos=pagamentos; this.aplicados=aplicados; this.estoques=estoques; this.frete=frete;
        this.processador=processador; this.consultas=consultas; this.auditoria=auditoria;
        this.enderecoService=enderecoService; this.cartaoService=cartaoService;
    }
    public record Selecao(UUID enderecoId,List<@NotNull UUID> cupomIds,@Valid EnderecoRequest novoEndereco) {
        public Selecao(UUID enderecoId,List<UUID> cupomIds) { this(enderecoId,cupomIds,null); }
    }
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
    private EnderecoModel destino(UUID clienteId,Selecao selecao) {
        if(selecao.novoEndereco()==null) return endereco(clienteId,selecao.enderecoId());
        if(selecao.enderecoId()!=null) throw RegraException.invalido("Selecione um endereço cadastrado ou informe um novo, não ambos.");
        var e=new EnderecoModel(); EnderecoService.preencher(e,selecao.novoEndereco());
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
        var resumo=carrinho.resumo(clienteId); var destino=destino(clienteId,selecao);
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
        String estado=lista.toString()+selecao.enderecoId()+selecao.novoEndereco()+entrega+selecionados.stream().map(c->c.getId()+":"+c.getValor()).toList();
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
        var selecao=new Selecao(r.enderecoId(),r.cupomIds(),r.novoEndereco());
        var e=destino(clienteId,selecao);
        if(e==null) throw RegraException.invalido("Selecione um endereço de entrega.");
        var q=orcamento(clienteId,selecao);
        if(q.items().isEmpty()) throw RegraException.conflito("Carrinho vazio ou reserva expirada. Adicione os produtos novamente.");
        if(!q.revisao().equals(r.revisao())||q.totalCompra().compareTo(r.totalEsperado())!=0)
            throw RegraException.conflito("O carrinho, os preços ou o frete mudaram. Confira o resumo atualizado antes de finalizar.");
        var lista=ativos(clienteId); var vouchers=selecionarCupons(clienteId,r.cupomIds());
        var destinos=new HashSet<String>(); var cartoesCompra=new ArrayList<CartaoModel>(); BigDecimal soma=ZERO;
        for(var pagamento:r.pagamentos()) {
            if((pagamento.cartaoId()==null)==(pagamento.novoCartao()==null)) throw RegraException.invalido("Selecione um cartão cadastrado ou informe um novo.");
            var c=pagamento.novoCartao()!=null?cartaoService.prepararCompra(clienteId,pagamento.novoCartao())
                :cartoes.findByIdAndClienteId(pagamento.cartaoId(),clienteId).orElseThrow(()->RegraException.inexistente("Cartão não encontrado para este cliente."));
            if(!destinos.add(c.getImpressaoDigital())) throw RegraException.invalido("Selecione cada cartão uma única vez.");
            cartoesCompra.add(c);
            if(YearMonth.parse(c.getValidade(),java.time.format.DateTimeFormatter.ofPattern("MM/yy")).isBefore(YearMonth.now())) throw RegraException.invalido("Cartão vencido.");
            boolean excecao=!vouchers.isEmpty(); // RN0035: a combinação de cupons e cartões é a exceção à RN0034.
            if(pagamento.valor().compareTo(new BigDecimal("10.00"))<0&&!excecao) throw RegraException.invalido("Cada cartão deve pagar pelo menos R$ 10,00 quando não há cupons.");
            soma=soma.add(pagamento.valor());
        }
        if(soma.compareTo(q.totalCartoes())!=0) throw RegraException.invalido("A soma dos cartões deve corresponder ao saldo após os cupons.");
        if(r.novoEndereco()!=null&&Boolean.TRUE.equals(r.incorporarEndereco())) e=enderecos.findById(enderecoService.salvar(clienteId,null,r.novoEndereco()).id()).orElseThrow();
        var p=new PedidoModel(); p.setCliente(cliente); if(r.novoEndereco()==null||Boolean.TRUE.equals(r.incorporarEndereco())) p.setEndereco(e);
        p.setEnderecoEntrega(e.getTipoResidencia()+" · "+e.getTipoLogradouro()+" "+e.getLogradouro()+", "+e.getNumero()+" - "+e.getBairro()+" - "+e.getCidade()+"/"+e.getEstado()+" - CEP "+e.getCep()+" - "+e.getPais()
            +(e.getObservacoes()==null||e.getObservacoes().isBlank()?"":" · "+e.getObservacoes()));
        p.setSubtotal(q.subtotal()); p.setFrete(q.frete()); p.setDesconto(q.desconto()); p.setTotal(q.totalCompra());
        p.setExcedenteCupons(q.creditoTroca()); p.setStatus("EM PROCESSAMENTO"); p.setControlaEstoque(true);
        // RN0044: finalizar transfere o bloqueio; não reinicia o prazo da última inclusão.
        p.setChaveOperacao(r.chaveOperacao()); p.setExpiraEm(q.expiresAt()); pedidos.saveAndFlush(p);
        for(var item:lista) {
            var i=new ItemPedidoModel(); i.setPedido(p); i.setProduto(item.getProduto()); i.setNomeProduto(item.getProduto().getNome());
            i.setCategoriasHistoricas(item.getProduto().getCategorias().stream().collect(java.util.stream.Collectors.toMap(c->c.getId(),c->c.getNome())));
            i.setPrecoUnitario(item.getProduto().getPreco()); i.setQuantidade(item.getQuantidade()); itens.save(i);
        }
        for(int indice=0;indice<r.pagamentos().size();indice++) {
            var pag=r.pagamentos().get(indice); var c=cartoesCompra.get(indice);
            if(pag.novoCartao()!=null&&Boolean.TRUE.equals(pag.incorporarCartao())) c=cartoes.findById(cartaoService.salvar(clienteId,null,pag.novoCartao()).id()).orElseThrow();
            var pg=new PagamentoModel(); pg.setPedido(p);
            if(pag.novoCartao()==null||Boolean.TRUE.equals(pag.incorporarCartao())) pg.setCartao(c);
            pg.setValor(pag.valor()); pg.setStatus("PENDENTE");
            pg.setBandeira(c.getBandeira().getNome()); pg.setCartaoFinal(c.getUltimosDigitos()); pg.setCartaoValidade(c.getValidade()); pagamentos.save(pg);
        }
        // RN0036 pertence à composição desta compra: o saldo é emitido sem aprovar pagamento ou baixar estoque.
        gerarCredito(p);
        BigDecimal restante=q.desconto();
        for(var c:vouchers) {
            // Distribui centavos proporcionalmente: toda associação tem valor aplicado positivo.
            BigDecimal proporcao=c.getValor().multiply(q.desconto()).divide(vouchers.stream().map(CupomModel::getValor).reduce(ZERO,BigDecimal::add),2,java.math.RoundingMode.DOWN);
            BigDecimal utilizado=c==vouchers.getLast()?restante:proporcao; restante=restante.subtract(utilizado);
            if(utilizado.signum()>0) aplicados.save(new PedidoCupomModel(p,c,utilizado));
            var antesCupom=Map.of("clienteId",clienteId,"utilizado",c.getUtilizado()); c.setUtilizado(true);
            auditoria.registrar("UTILIZAR_CUPOM","Cupom:"+c.getId(),antesCupom,Map.of("clienteId",clienteId,"pedidoId",p.getId(),"codigo",c.getCodigo(),"utilizado",true));
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
            var antes=Map.of("produtoId",i.getProduto().getId(),"quantidade",e.getQuantidade(),"reservado",e.getReservado());
            e.setReservado(e.getReservado()-i.getQuantidade());
            if(aprovado) e.setQuantidade(e.getQuantidade()-i.getQuantidade());
            auditoria.registrar(aprovado?"BAIXAR_ESTOQUE":"LIBERAR_RESERVA","Estoque:"+e.getId(),antes,
                Map.of("produtoId",i.getProduto().getId(),"quantidade",e.getQuantidade(),"reservado",e.getReservado(),"clienteId",p.getCliente().getId(),"pedidoId",p.getId()));
        }
    }
    private void devolverCupons(PedidoModel p) {
        for(var a:aplicados.findByPedidoId(p.getId()).stream().sorted(Comparator.comparing(a->a.getCupom().getId())).toList()) {
            var c=cupons.bloquear(a.getCupom().getId()).orElseThrow(); boolean utilizado=c.getUtilizado(); c.setUtilizado(false);
            auditoria.registrar("DEVOLVER_CUPOM","Cupom:"+c.getId(),Map.of("utilizado",utilizado),Map.of("clienteId",p.getCliente().getId(),"pedidoId",p.getId(),"utilizado",false));
        }
        if(p.getCupomSaldo()!=null&&!p.getCupomSaldo().getUtilizado()) {
            p.getCupomSaldo().setUtilizado(true);
            auditoria.registrar("INVALIDAR_CREDITO","Cupom:"+p.getCupomSaldo().getId(),Map.of("utilizado",false),Map.of("clienteId",p.getCliente().getId(),"pedidoId",p.getId(),"utilizado",true));
        }
    }
    private void gerarCredito(PedidoModel p) {
        if(p.getExcedenteCupons().signum()<=0||p.getCupomSaldo()!=null) return;
        var c=new CupomModel(); c.setCliente(p.getCliente()); c.setCodigo("SALDO-"+p.getId()); c.setTipo("Troca");
        c.setValor(p.getExcedenteCupons()); c.setValidade(LocalDate.now().plusYears(1)); cupons.saveAndFlush(c); p.setCupomSaldo(c);
        auditoria.registrar("GERAR_CREDITO","Cupom:"+c.getId(),null,Map.of("clienteId",p.getCliente().getId(),"valor",c.getValor(),"pedidoId",p.getId()));
    }
    public ConsultaVendaService.Pedido processar(UUID id) {
        var p=bloquear(id);
        if(!p.getStatus().equals("EM PROCESSAMENTO")) return consultas.consultar(id); // Retentativa idempotente.
        if(p.getExpiraEm()!=null&&!p.getExpiraEm().isAfter(Instant.now())) return recusar(p,"REPROVADA");
        assegurarReserva(p);
        // RN0037: a validade pode mudar entre a finalização e o processamento local.
        for(var aplicado:aplicados.findByPedidoId(id).stream().sorted(Comparator.comparing(a->a.getCupom().getId())).toList()) {
            var cupom=cupons.bloquear(aplicado.getCupom().getId()).orElseThrow();
            if(!cupom.getUtilizado()||cupom.getValidade().isBefore(LocalDate.now())
                ||(cupom.getCliente()!=null&&!cupom.getCliente().getId().equals(p.getCliente().getId()))) return recusar(p,"REPROVADA");
        }
        var lista=pagamentos.findByPedidoId(id); boolean aprovado=true;
        for(var pg:lista) {
            // A compra usa os dados registrados nela, não uma edição posterior do perfil.
            var c=new CartaoModel(); var cadastrado=pg.getCartao();
            c.setUltimosDigitos(pg.getCartaoFinal()!=null?pg.getCartaoFinal():cadastrado==null?null:cadastrado.getUltimosDigitos());
            c.setValidade(pg.getCartaoValidade()!=null?pg.getCartaoValidade():cadastrado==null?null:cadastrado.getValidade());
            if(c.getValidade()==null||c.getUltimosDigitos()==null) return recusar(p,"REPROVADA");
            var retorno=processador.autorizar(c,pg.getValor()); pg.setReferencia(retorno.referencia());
            aprovado&=retorno.aprovado();
        }
        if(!aprovado) return recusar(p,"REPROVADA");
        var antes=consultas.consultar(id); movimentarReserva(p,true);
        lista.forEach(pg->pg.setStatus("APROVADO")); p.setStatus("APROVADA"); p.setExpiraEm(null);
        gerarCredito(p);
        pedidos.flush(); pagamentos.flush(); var depois=consultas.consultar(id);
        auditoria.registrar("APROVAR_PAGAMENTO","Pedido:"+id,antes,depois); return depois;
    }
    private void assegurarReserva(PedidoModel p) {
        // Mesmo com reserva existente, estoque vem antes dos cupons na ordem de locks.
        for(var item:itens.findByPedidoId(p.getId()).stream().sorted(Comparator.comparing(i->i.getProduto().getId())).toList()) {
            var e=estoques.bloquear(item.getProduto().getId()).orElseThrow();
            if(p.getControlaEstoque()) continue;
            if(e.getQuantidade()-e.getReservado()<item.getQuantidade()) throw RegraException.conflito("Estoque insuficiente para processar o pedido.");
            e.setReservado(e.getReservado()+item.getQuantidade());
        }
        if(p.getControlaEstoque()) return;
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
