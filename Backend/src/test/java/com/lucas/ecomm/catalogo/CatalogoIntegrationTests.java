package com.lucas.ecomm.catalogo;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Verifica a ordem real da API no schema isolado; os cadastros são revertidos ao final. */
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("integration") @Transactional
@EnabledIfEnvironmentVariable(named="RUN_DB_TESTS", matches="true")
class CatalogoIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired JsonMapper json;
    @Autowired jakarta.persistence.EntityManager em;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired com.lucas.ecomm.catalogo.service.InativacaoProdutoService inativacao;

    private String cadastrar(String nome, JsonNode dominios) throws Exception {
        var dados = Map.of("nome", nome, "marca", "NVIDIA", "descricao", "Placa de vídeo para o catálogo",
            "preco", 150, "custo", 50, "quantidade", 10, "ativo", true,
            "grupoPrecificacaoId", dominios.get("grupos").get(0).get("id").asString(),
            "categorias", List.of(dominios.get("categorias").get(0).get("id").asString()));
        var resposta = mvc.perform(post("/api/produtos").contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(dados)))
            .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return json.readTree(resposta).get("id").asString();
    }

    @Test void listaCadastrosMaisRecentesPrimeiroInclusiveComNomesIguais() throws Exception {
        var resposta = mvc.perform(get("/api/dominios/catalogo")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();
        var dominios = json.readTree(resposta);
        String primeiro = cadastrar("GeForce RTX 5070 12GB", dominios);
        String segundo = cadastrar("GeForce RTX 5070 12GB", dominios);
        for (int consulta = 0; consulta < 2; consulta++) {
            var lista = mvc.perform(get("/api/produtos")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
            var produtos = json.readTree(lista);
            assertThat(produtos.get(0).get("id").asString()).isEqualTo(segundo);
            assertThat(produtos.get(1).get("id").asString()).isEqualTo(primeiro);
        }
    }

    @Test void catalogoConsultaEstoqueECategoriasEmLoteSemUmaConsultaPorProduto() throws Exception {
        var dominios=json.readTree(mvc.perform(get("/api/dominios/catalogo")).andReturn().getResponse().getContentAsString());
        for(int i=0;i<3;i++) cadastrar("Hardware consulta em lote "+i,dominios);
        em.flush(); em.clear();
        var estatisticas=em.getEntityManagerFactory().unwrap(org.hibernate.SessionFactory.class).getStatistics();
        boolean habilitado=estatisticas.isStatisticsEnabled();
        try {
            estatisticas.setStatisticsEnabled(true); estatisticas.clear();
            mvc.perform(get("/api/produtos")).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].quantidade").value(10)).andExpect(jsonPath("$[0].categorias[0].nome").exists());
            assertThat(estatisticas.getPrepareStatementCount()).isLessThanOrEqualTo(3);
        } finally { estatisticas.setStatisticsEnabled(habilitado); }
    }

    private JsonNode dominios() throws Exception {
        return json.readTree(mvc.perform(get("/api/dominios/catalogo")).andReturn().getResponse().getContentAsString());
    }
    private void zerarEstoque(String id) {
        em.flush(); jdbc.update("update estoques set quantidade=0 where produto_id=?::uuid",id); em.clear();
    }
    private void venda(String produto,String status,int dias) {
        // Histórico mínimo isolado da rotina; nunca modifica a base da aplicação normal.
        var cliente=java.util.UUID.randomUUID(); var pedido=java.util.UUID.randomUUID();
        jdbc.update("""
            insert into clientes(id,nome,genero,data_nascimento,cpf,email,tipo_telefone,ddd,telefone,senha_hash)
            values(?,'Cliente histórico','Masculino','1998-06-15','52998224725',?,'Celular','11','987654321','hash-de-fixture')
            """,cliente,cliente+"@catalogo.test");
        jdbc.update("insert into pedidos(id,cliente_id,endereco_entrega,total,status,criado_em) values(?,?,'Histórico de teste',150,?,?)",
            pedido,cliente,status,java.sql.Timestamp.from(java.time.Instant.now().minus(java.time.Duration.ofDays(dias))));
        jdbc.update("insert into itens_pedido(pedido_id,produto_id,nome_produto,preco_unitario,quantidade) values(?,?::uuid,'Hardware',150,1)",pedido,produto);
    }
    @Test void inativaSemEstoqueESemVendaComCategoriaAuditoriaEIdempotencia() throws Exception {
        String id=cadastrar("RTX 5060 sem movimento",dominios()); zerarEstoque(id);
        var uuid=java.util.UUID.fromString(id);
        assertThat(inativacao.candidatos()).contains(uuid);
        assertThat(inativacao.inativar(uuid)).isTrue();
        assertThat(inativacao.inativar(uuid)).isFalse();
        mvc.perform(get("/api/produtos/"+id)).andExpect(jsonPath("$.ativo").value(false))
            .andExpect(jsonPath("$.categoriaStatus").value("FORA DE MERCADO"))
            .andExpect(jsonPath("$.justificativaStatus").value(org.hamcrest.Matchers.containsString("90 dias")));
        em.flush();
        assertThat(jdbc.queryForObject("select count(*) from auditorias where entidade=? and operacao='INATIVAR_AUTOMATICAMENTE' and responsavel<>''",Integer.class,"Produto:"+id)).isEqualTo(1);
    }
    @Test void vendaAprovadaRecenteImpedeInativacao() throws Exception {
        String id=cadastrar("RTX 5060 vendida",dominios()); zerarEstoque(id); venda(id,"APROVADA",30);
        var uuid=java.util.UUID.fromString(id);
        assertThat(inativacao.candidatos()).doesNotContain(uuid);
        assertThat(inativacao.inativar(uuid)).isFalse();
    }
    @Test void vendaAntigaNaoImpedeInativacaoApos90Dias() throws Exception {
        String id=cadastrar("RTX 5060 antiga",dominios()); zerarEstoque(id); venda(id,"ENTREGUE",91);
        assertThat(inativacao.inativar(java.util.UUID.fromString(id))).isTrue();
    }
    @Test void estoqueRepostoDepoisDaConsultaNaoEInativado() throws Exception {
        String id=cadastrar("RTX 5060 reposta",dominios()); zerarEstoque(id); var uuid=java.util.UUID.fromString(id);
        assertThat(inativacao.candidatos()).contains(uuid);
        jdbc.update("update estoques set quantidade=2 where produto_id=?::uuid",id); em.clear();
        assertThat(inativacao.inativar(uuid)).isFalse();
    }
}
