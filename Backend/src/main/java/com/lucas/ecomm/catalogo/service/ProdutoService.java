package com.lucas.ecomm.catalogo.service;
import com.lucas.ecomm.catalogo.model.*;
import com.lucas.ecomm.catalogo.repository.*;
import com.lucas.ecomm.catalogo.dto.*;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import java.util.*;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @Transactional(readOnly=true)
public class ProdutoService {
    private final ProdutoRepository produtos; private final EstoqueRepository estoques;
    private final CategoriaRepository categorias; private final GrupoPrecificacaoRepository grupos;
    private final AuditoriaService auditoria;
    private final EntradaEstoqueRepository entradas;
    public ProdutoService(ProdutoRepository produtos, EstoqueRepository estoques, CategoriaRepository categorias, GrupoPrecificacaoRepository grupos, AuditoriaService auditoria,EntradaEstoqueRepository entradas) {
        this.produtos=produtos; this.estoques=estoques; this.categorias=categorias; this.grupos=grupos; this.auditoria=auditoria;
        this.entradas=entradas;
    }
    public ProdutoModel exigir(UUID id) { return produtos.findById(id).orElseThrow(()->RegraException.inexistente("Produto não encontrado.")); }
    private ProdutoResponse resposta(ProdutoModel p) {
        var e=estoques.findByProdutoId(p.getId()).orElseThrow(()->RegraException.conflito("Produto sem registro de estoque."));
        return new ProdutoResponse(p.getId(),p.getNome(),p.getMarca(),p.getDescricao(),p.getImagem(),p.getPreco(),p.getCusto(),p.getAtivo(),
            p.getGrupoPrecificacao().getId(),p.getCategorias().stream().map(c->new ProdutoResponse.Dominio(c.getId(),c.getNome())).toList(),e.getQuantidade(),e.getReservado(),p.getJustificativaStatus(),p.getCategoriaStatus());
    }
    public List<ProdutoResponse> listar() { return produtos.findAll().stream().map(this::resposta).toList(); }
    public ProdutoResponse consultar(UUID id) { return resposta(exigir(id)); }
    public Map<String,List<ProdutoResponse.Dominio>> dominios() {
        return Map.of("categorias",categorias.findAll().stream().map(c->new ProdutoResponse.Dominio(c.getId(),c.getNome())).toList(),
            "grupos",grupos.findAll().stream().map(g->new ProdutoResponse.Dominio(g.getId(),g.getNome())).toList());
    }
    @Transactional public ProdutoResponse salvar(UUID id, ProdutoRequest r) {
        var grupo=grupos.findById(r.grupoPrecificacaoId()).orElseThrow(()->RegraException.invalido("Grupo de precificação inexistente."));
        var cats=categorias.findAllById(r.categorias());
        if(cats.size()!=r.categorias().size()) throw RegraException.invalido("Categoria inexistente.");
        if(r.preco().compareTo(r.custo().multiply(BigDecimal.ONE.add(grupo.getMargemMinima().movePointLeft(2))))<0)
            throw RegraException.invalido("Preço abaixo da margem mínima do grupo de precificação.");
        var p=id==null?new ProdutoModel():exigir(id);
        // Compartilha o lock com carrinho/pedido antes de consultar ou alterar as quantidades.
        var e=id==null?new EstoqueModel():estoques.bloquear(id).orElseThrow();
        var antes=id==null?null:resposta(p);
        var maior=id==null?null:entradas.maiorCusto(id);
        if(maior!=null&&r.custo().compareTo(maior)<0) throw RegraException.invalido("O custo não pode ser inferior ao maior custo das entradas registradas.");
        if((id!=null&&p.getAtivo()!=r.ativo())||(id==null&&!r.ativo())) {
            if(r.justificativaStatus()==null||r.justificativaStatus().isBlank()||r.categoriaStatus()==null||r.categoriaStatus().isBlank())
                throw RegraException.invalido("Informe justificativa e categoria para ativar ou inativar o produto.");
            p.setJustificativaStatus(r.justificativaStatus().strip()); p.setCategoriaStatus(r.categoriaStatus().strip());
        }
        p.setNome(r.nome().strip()); p.setMarca(r.marca().strip()); p.setDescricao(r.descricao().strip()); p.setImagem(r.imagem());
        p.setPreco(r.preco()); p.setCusto(r.custo()); p.setAtivo(r.ativo()); p.setGrupoPrecificacao(grupo); p.setCategorias(new HashSet<>(cats));
        produtos.saveAndFlush(p);
        if(r.quantidade()<e.getReservado()) throw RegraException.invalido("Estoque não pode ficar abaixo da quantidade reservada.");
        e.setProduto(p); e.setQuantidade(r.quantidade()); estoques.saveAndFlush(e);
        var depois=resposta(p); auditoria.registrar(id==null?"CADASTRAR":"ALTERAR","Produto:"+p.getId(),antes,depois); return depois;
    }
}
