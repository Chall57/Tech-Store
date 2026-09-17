package com.lucas.ecomm.catalogo.service;
import com.lucas.ecomm.catalogo.model.*;
import com.lucas.ecomm.catalogo.repository.*;
import com.lucas.ecomm.shared.service.AuditoriaService;
import com.lucas.ecomm.shared.api.RegraException;
import jakarta.validation.constraints.*;
import java.math.*;
import java.time.LocalDate;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @Transactional(readOnly=true)
public class EstoqueService {
    private final EstoqueRepository estoques; private final EntradaEstoqueRepository entradas;
    private final FornecedorRepository fornecedores; private final ProdutoService produtos; private final AuditoriaService auditoria;
    public EstoqueService(EstoqueRepository estoques,EntradaEstoqueRepository entradas,FornecedorRepository fornecedores,ProdutoService produtos,AuditoriaService auditoria) {
        this.estoques=estoques; this.entradas=entradas; this.fornecedores=fornecedores; this.produtos=produtos; this.auditoria=auditoria;
    }
    public record Fornecedor(UUID id,String nome) {}
    public record CadastroFornecedor(@NotBlank @Size(max=150) String nome) {}
    public record Entrada(@NotNull UUID produtoId,@NotNull UUID fornecedorId,@Min(1) int quantidade,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal custoUnitario,@NotNull @PastOrPresent LocalDate dataEntrada) {}
    public record Resposta(UUID id,UUID produtoId,String produto,UUID fornecedorId,String fornecedor,int quantidade,BigDecimal custoUnitario,LocalDate dataEntrada) {}
    public List<Fornecedor> fornecedores() { return fornecedores.findAll().stream().map(f->new Fornecedor(f.getId(),f.getNome())).toList(); }
    @Transactional public Fornecedor cadastrarFornecedor(CadastroFornecedor r) {
        String nome=r.nome().strip();
        if(fornecedores.existsByNomeIgnoreCase(nome)) throw RegraException.conflito("Fornecedor já cadastrado.");
        var f=new FornecedorModel(); f.setNome(nome); fornecedores.saveAndFlush(f);
        var result=new Fornecedor(f.getId(),f.getNome()); auditoria.registrar("CADASTRAR","Fornecedor:"+f.getId(),null,result); return result;
    }
    private Resposta resposta(EntradaEstoqueModel e) { return new Resposta(e.getId(),e.getProduto().getId(),e.getProduto().getNome(),e.getFornecedor().getId(),e.getFornecedor().getNome(),e.getQuantidade(),e.getCustoUnitario(),e.getDataEntrada()); }
    public List<Resposta> entradas() { return entradas.findAllByOrderByDataEntradaDescCriadoEmDesc().stream().map(this::resposta).toList(); }
    @Transactional public Resposta entrar(Entrada r) {
        var e=estoques.bloquear(r.produtoId()).orElseThrow(()->RegraException.inexistente("Estoque do produto não encontrado."));
        var p=produtos.exigir(r.produtoId());
        var f=fornecedores.findById(r.fornecedorId()).orElseThrow(()->RegraException.inexistente("Fornecedor não encontrado."));
        var antes=produtos.consultar(p.getId()); var entrada=new EntradaEstoqueModel(); entrada.setProduto(p); entrada.setFornecedor(f);
        entrada.setQuantidade(r.quantidade()); entrada.setCustoUnitario(r.custoUnitario()); entrada.setDataEntrada(r.dataEntrada()); entradas.saveAndFlush(entrada);
        var maior=entradas.maiorCusto(p.getId()).max(p.getCusto());
        p.setCusto(maior); p.setPreco(maior.multiply(BigDecimal.ONE.add(p.getGrupoPrecificacao().getMargemMinima().movePointLeft(2))).setScale(2,RoundingMode.CEILING));
        e.setQuantidade(Math.addExact(e.getQuantidade(),r.quantidade())); estoques.flush();
        auditoria.registrar("ENTRADA_ESTOQUE","Produto:"+p.getId(),antes,produtos.consultar(p.getId()));
        var result=resposta(entrada); auditoria.registrar("CADASTRAR","EntradaEstoque:"+entrada.getId(),null,result); return result;
    }
}
