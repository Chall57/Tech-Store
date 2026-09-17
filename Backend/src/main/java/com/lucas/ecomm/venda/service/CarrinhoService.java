package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.venda.model.*;
import com.lucas.ecomm.venda.repository.*;
import com.lucas.ecomm.catalogo.model.EstoqueModel;
import com.lucas.ecomm.catalogo.repository.EstoqueRepository;
import com.lucas.ecomm.catalogo.service.ProdutoService;
import com.lucas.ecomm.cliente.service.ClienteService;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import java.util.*;
import java.time.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional
public class CarrinhoService {
    private final CarrinhoRepository carrinhos; private final ItemCarrinhoRepository itens;
    private final ClienteService clientes; private final ProdutoService produtos; private final EstoqueRepository estoques;
    private final AuditoriaService auditoria; private final Duration prazo;
    public CarrinhoService(CarrinhoRepository carrinhos, ItemCarrinhoRepository itens, ClienteService clientes,
        ProdutoService produtos, EstoqueRepository estoques, AuditoriaService auditoria, @Value("${app.reserva-minutos:30}") long minutos) {
        if(minutos<6) throw new IllegalArgumentException("Prazo de reserva deve ser de pelo menos 6 minutos.");
        this.carrinhos=carrinhos; this.itens=itens; this.clientes=clientes; this.produtos=produtos;
        this.estoques=estoques; this.auditoria=auditoria; this.prazo=Duration.ofMinutes(minutos);
    }
    public Duration prazo() { return prazo; }
    public record Item(UUID productId,int quantity) {}
    public record Removido(UUID productId,String name,int quantity,String reason,Instant removedAt) {}
    public record Resumo(List<Item> items,Instant expiresAt,List<Removido> removed,List<String> warnings) {}
    private EstoqueModel bloquearEstoque(UUID id) {
        return estoques.bloquear(id).orElseThrow(()->RegraException.conflito("Produto sem estoque cadastrado."));
    }
    private void bloquearEstoquesDaAlteracao(UUID clienteId,UUID produtoId) {
        var ids=new TreeSet<UUID>(); ids.add(produtoId);
        itens.findByCarrinhoClienteId(clienteId).stream().filter(i->i.getRemovidoEm()==null)
            .forEach(i->ids.add(i.getProduto().getId()));
        ids.forEach(this::bloquearEstoque);
    }
    // A ordem global dos locks de estoque evita inversões entre carrinhos com vários produtos.
    public Resumo resumo(UUID clienteId) {
        clientes.bloquear(clienteId);
        var carrinho=carrinhos.findByClienteId(clienteId);
        if(carrinho.isEmpty()) return new Resumo(List.of(),null,List.of(),List.of());
        var c=carrinho.get(); var agora=Instant.now(); var avisos=new ArrayList<String>();
        var lista=itens.findByCarrinhoClienteId(clienteId);
        var ativos=lista.stream().filter(i->i.getRemovidoEm()==null).sorted(Comparator.comparing(i->i.getProduto().getId())).toList();
        if(!ativos.isEmpty()&&c.getExpiraEm()==null) c.setExpiraEm(agora.plus(prazo));
        boolean expirou=c.getExpiraEm()!=null&&!c.getExpiraEm().isAfter(agora);
        for(var item:ativos) {
            var e=bloquearEstoque(item.getProduto().getId());
            int propria=item.getReservado()?item.getQuantidade():0;
            int disponivel=e.getQuantidade()-e.getReservado()+propria;
            int nova=expirou||!item.getProduto().getAtivo()?0:Math.min(item.getQuantidade(),disponivel);
            if(nova==0) {
                e.setReservado(e.getReservado()-propria); item.setReservado(false); item.setRemovidoEm(agora);
                item.setMotivoRemocao(expirou?"Prazo de reserva expirado. Adicione o produto novamente.":"Produto indisponível. Adicione novamente quando houver estoque.");
                auditoria.registrar("REMOVER_ITEM","Carrinho:"+clienteId,null,Map.of("produtoId",item.getProduto().getId(),"motivo",item.getMotivoRemocao()));
            } else {
                if(nova!=item.getQuantidade()) {
                    avisos.add("A quantidade de "+item.getProduto().getNome()+" foi ajustada para "+nova+".");
                    auditoria.registrar("AJUSTAR_QUANTIDADE","Carrinho:"+clienteId,Map.of("quantidade",item.getQuantidade()),Map.of("quantidade",nova,"produtoId",item.getProduto().getId()));
                }
                e.setReservado(e.getReservado()-propria+nova); item.setQuantidade(nova); item.setReservado(true);
            }
        }
        itens.flush();
        var removidos=lista.stream().filter(i->i.getRemovidoEm()!=null)
            .map(i->new Removido(i.getProduto().getId(),i.getProduto().getNome(),i.getQuantidade(),i.getMotivoRemocao(),i.getRemovidoEm())).toList();
        var atuais=lista.stream().filter(i->i.getRemovidoEm()==null).map(i->new Item(i.getProduto().getId(),i.getQuantidade())).toList();
        return new Resumo(atuais,atuais.isEmpty()?null:c.getExpiraEm(),removidos,avisos);
    }
    public List<Item> listar(UUID clienteId) { return resumo(clienteId).items(); }
    public List<Item> adicionar(UUID clienteId,UUID produtoId,int incremento) {
        clientes.bloquear(clienteId);
        if(incremento<1) throw RegraException.invalido("Quantidade deve ser positiva.");
        produtos.exigir(produtoId);
        bloquearEstoquesDaAlteracao(clienteId,produtoId);
        resumo(clienteId);
        int atual=itens.findByCarrinhoClienteIdAndProdutoId(clienteId,produtoId)
            .filter(i->i.getRemovidoEm()==null).map(ItemCarrinhoModel::getQuantidade).orElse(0);
        if((long)atual+incremento>Integer.MAX_VALUE) throw RegraException.invalido("Quantidade inválida.");
        return quantidade(clienteId,produtoId,atual+incremento);
    }
    public List<Item> quantidade(UUID clienteId,UUID produtoId,int quantidade) {
        var cliente=clientes.bloquear(clienteId);
        if(!cliente.getAtivo()) throw RegraException.conflito("Cliente inativo não pode alterar o carrinho.");
        if(quantidade<0) throw RegraException.invalido("Quantidade inválida.");
        produtos.exigir(produtoId);
        bloquearEstoquesDaAlteracao(clienteId,produtoId);
        var antes=resumo(clienteId).items();
        var produto=produtos.exigir(produtoId); var e=bloquearEstoque(produtoId);
        var existente=itens.findByCarrinhoClienteIdAndProdutoId(clienteId,produtoId);
        int propria=existente.filter(i->i.getReservado()).map(ItemCarrinhoModel::getQuantidade).orElse(0);
        if(quantidade>0&&(!produto.getAtivo()||quantidade>e.getQuantidade()-e.getReservado()+propria))
            throw RegraException.conflito("Quantidade indisponível em estoque.");
        e.setReservado(e.getReservado()-propria+quantidade);
        if(quantidade==0) existente.ifPresent(itens::delete);
        else {
            var c=carrinhos.findByClienteId(clienteId).orElseGet(()-> {var novo=new CarrinhoModel();novo.setCliente(cliente);return carrinhos.save(novo);});
            if(quantidade>propria||c.getExpiraEm()==null) c.setExpiraEm(Instant.now().plus(prazo));
            var item=existente.orElseGet(ItemCarrinhoModel::new);
            item.setCarrinho(c); item.setProduto(produto); item.setQuantidade(quantidade); item.setReservado(true);
            item.setRemovidoEm(null); item.setMotivoRemocao(null); itens.save(item);
        }
        itens.flush();
        var depois=itens.findByCarrinhoClienteId(clienteId).stream().filter(i->i.getRemovidoEm()==null)
            .map(i->new Item(i.getProduto().getId(),i.getQuantidade())).toList();
        auditoria.registrar("ALTERAR","Carrinho:"+clienteId,antes,depois); return depois;
    }
}
