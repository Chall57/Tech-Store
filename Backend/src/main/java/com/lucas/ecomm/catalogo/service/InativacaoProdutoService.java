package com.lucas.ecomm.catalogo.service;

import com.lucas.ecomm.catalogo.repository.EstoqueRepository;
import com.lucas.ecomm.catalogo.repository.ProdutoRepository;
import com.lucas.ecomm.shared.service.AuditoriaService;
import java.time.Instant;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class InativacaoProdutoService {
    private final ProdutoRepository produtos;
    private final EstoqueRepository estoques;
    private final ProdutoService catalogo;
    private final AuditoriaService auditoria;
    private final int dias;

    public InativacaoProdutoService(ProdutoRepository produtos,EstoqueRepository estoques,ProdutoService catalogo,
        AuditoriaService auditoria,@Value("${app.catalogo.inativacao-dias:90}") int dias) {
        if(dias<1) throw new IllegalArgumentException("O período de inativação deve ser positivo.");
        this.produtos=produtos; this.estoques=estoques; this.catalogo=catalogo; this.auditoria=auditoria; this.dias=dias;
    }

    public List<UUID> candidatos() { return produtos.semEstoqueESemVendasDesde(Instant.now().minus(Duration.ofDays(dias))); }

    @Transactional
    public boolean inativar(UUID id) {
        // O mesmo lock da entrada/carrinho evita inativar um produto que acabou de ser reposto.
        var saldo=estoques.bloquear(id).orElse(null);
        if(saldo==null||saldo.getQuantidade()!=0) return false;
        var produto=saldo.getProduto();
        if(!produto.getAtivo()||produtos.possuiVendasDesde(id,Instant.now().minus(Duration.ofDays(dias)))) return false;
        var antes=catalogo.consultar(id);
        produto.setAtivo(false);
        produto.setCategoriaStatus("FORA DE MERCADO");
        produto.setJustificativaStatus("Sem estoque e sem vendas aprovadas nos últimos "+dias+" dias.");
        produtos.flush();
        auditoria.registrar("INATIVAR_AUTOMATICAMENTE","Produto:"+id,antes,catalogo.consultar(id));
        return true;
    }
}
