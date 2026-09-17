package com.lucas.ecomm.venda;
import jakarta.persistence.EntityManager;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("integration") @Transactional
@EnabledIfEnvironmentVariable(named="RUN_DB_TESTS",matches="true")
class AdminIntegrationTests {
    @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired JsonMapper json; @Autowired EntityManager em;
    JsonNode postJson(String path,Object body,int status) throws Exception {
        return json.readTree(mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
            .andExpect(status().is(status)).andReturn().getResponse().getContentAsString());
    }
    JsonNode patchJson(String path,Object body,int status) throws Exception {
        return json.readTree(mvc.perform(patch(path).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
            .andExpect(status().is(status)).andReturn().getResponse().getContentAsString());
    }
    String cliente() throws Exception {
        return postJson("/api/clientes",Map.ofEntries(Map.entry("nome","Admin Integração"),Map.entry("genero","Não informado"),
            Map.entry("cpf","52998224725"),Map.entry("email","admin-integracao@techstore.test"),Map.entry("dataNascimento","1998-06-15"),
            Map.entry("tipoTelefone","Celular"),Map.entry("ddd","11"),Map.entry("telefone","987654321"),Map.entry("senha","Teste@2026"),Map.entry("confirmacaoSenha","Teste@2026"),
            Map.entry("enderecos",List.of(Map.ofEntries(Map.entry("nome","Casa"),Map.entry("tipoResidencia","Casa"),Map.entry("tipoLogradouro","Rua"),
                Map.entry("logradouro","Teste"),Map.entry("numero","1"),Map.entry("bairro","Centro"),Map.entry("cep","07400000"),Map.entry("cidade","Arujá"),
                Map.entry("estado","SP"),Map.entry("pais","Brasil"),Map.entry("residencial",true),Map.entry("entrega",true),Map.entry("cobranca",true))))),201).get("id").asString();
    }
    UUID categoria(String name) { return jdbc.queryForObject("select id from categorias where nome=?",UUID.class,name); }
    String produto() throws Exception {
        return postJson("/api/produtos",Map.of("nome","Produto Admin Teste","marca","Teste","descricao","Produto real para testes",
            "preco",100,"custo",50,"quantidade",10,"ativo",true,"grupoPrecificacaoId",jdbc.queryForObject("select id from grupos_precificacao where nome='Padrão'",UUID.class),
            "categorias",List.of(categoria("Placas de vídeo"))),201).get("id").asString();
    }
    String historico(String cliente,String produto,String status,int qty,String date) {
        var order=UUID.randomUUID(); var item=UUID.randomUUID();
        jdbc.update("insert into pedidos(id,cliente_id,endereco_entrega,total,subtotal,status,criado_em) values(?,?::uuid,'Snapshot',?,?,?,?::timestamptz)",order,cliente,qty*100,qty*100,status,date);
        jdbc.update("insert into itens_pedido(id,pedido_id,produto_id,nome_produto,preco_unitario,quantidade) values(?,?,?::uuid,'Produto histórico',100,?)",item,order,produto,qty);
        jdbc.update("insert into item_pedido_categorias values(?,?,?)",item,categoria("Placas de vídeo"),"Placas de vídeo");
        return order.toString();
    }
    String solicitar(String c,String o,String p,int qty,int status) throws Exception { return postJson("/api/clientes/"+c+"/trocas",Map.of("orderId",o,"productId",p,"quantity",qty,"reason","Defeito"),status).get("id").asString(); }
    void enviado(String c,String troca) throws Exception {
        patchJson("/api/trocas/"+troca+"/status",Map.of("status","TROCA ACEITA"),200);
        postJson("/api/clientes/"+c+"/trocas/"+troca+"/despacho",Map.of("carrier","Transportadora local","trackingCode","TESTE-001","dispatchDate",java.time.LocalDate.now().toString()),200);
    }
    @Test void analiseFiltraStatusCategoriasEZeraMesSemVenda() throws Exception {
        var c=cliente(); var p=produto();
        historico(c,p,"APROVADA",2,"2026-01-15T12:00:00-03:00"); historico(c,p,"ENTREGUE",1,"2026-03-01T00:00:00-03:00");
        historico(c,p,"CANCELADO",7,"2026-01-15T12:00:00-03:00"); historico(c,p,"REPROVADA",7,"2026-01-15T12:00:00-03:00");
        historico(c,p,"EM PROCESSAMENTO",7,"2026-01-15T12:00:00-03:00"); historico(c,p,"ENTREGUE",9,"2026-04-01T00:00:00-03:00");
        var r=mvc.perform(get("/api/analises/vendas").param("inicio","2026-01-01").param("fim","2026-03-31")
            .param("categorias",categoria("Placas de vídeo")+","+categoria("Memórias RAM"))).andExpect(status().isOk()).andReturn();
        var data=json.readTree(r.getResponse().getContentAsString()); assertThat(data.get("meses").size()).isEqualTo(3);
        for(int n=0;n<3;n++) assertThat(data.get("series").get(0).get("valores").get(n).asDouble()).isZero();
        assertThat(data.get("series").get(1).get("valores").get(0).asDouble()).isEqualTo(200);
        assertThat(data.get("series").get(1).get("valores").get(1).asDouble()).isZero();
        assertThat(data.get("series").get(1).get("valores").get(2).asDouble()).isEqualTo(100);
        // Alterar a relação atual do catálogo não remove a categoria histórica.
        jdbc.update("delete from produto_categorias where produto_id=?::uuid",p);
        mvc.perform(get("/api/analises/vendas").param("inicio","2026-01-01").param("fim","2026-03-31").param("categorias",categoria("Placas de vídeo").toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.series[0].valores[0]").value(200));
    }
    @Test void analiseValidaPeriodoECategoriasEExportaCsv() throws Exception {
        var cat=categoria("Placas de vídeo").toString();
        for(var dates:List.of(List.of("2026-03-01","2026-01-01"),List.of("2026-01-01","2026-01-02"),List.of("2024-01-01","2026-01-01")))
            mvc.perform(get("/api/analises/vendas").param("inicio",dates.get(0)).param("fim",dates.get(1)).param("categorias",cat)).andExpect(status().isBadRequest());
        mvc.perform(get("/api/analises/vendas").param("inicio","2026-01-01").param("fim","2026-01-31").param("categorias",UUID.randomUUID().toString())).andExpect(status().isNotFound());
        var csv=mvc.perform(get("/api/analises/vendas/exportacao").param("inicio","2026-01-01").param("fim","2026-01-31").param("categorias",cat))
            .andExpect(status().isOk()).andExpect(header().string("Content-Disposition","attachment; filename=tech-store-vendas.csv")).andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(csv).startsWith("\uFEFFInício;Fim;Mês;Categoria;Valor (R$)").contains("2026-01;\"Placas de vídeo\";0,00");
    }
    @Test void trocaCompletaGeraCupomNoRecebimentoEReentradaUmaVez() throws Exception {
        var c=cliente(); var p=produto(); var o=historico(c,p,"ENTREGUE",2,"2026-01-15T12:00:00-03:00"); var t=solicitar(c,o,p,2,201);
        mvc.perform(get("/api/pedidos/"+o)).andExpect(jsonPath("$.status").value("EM TROCA")); enviado(c,t);
        var result=patchJson("/api/trocas/"+t+"/status",Map.of("status","ITEM RECEBIDO","reentradaEstoque",true),200);
        assertThat(result.get("statusDrs").asString()).isEqualTo("TROCADO"); assertThat(result.get("couponCode").asString()).startsWith("TROCA-");
        patchJson("/api/trocas/"+t+"/status",Map.of("status","ITEM RECEBIDO","reentradaEstoque",true),200);
        patchJson("/api/trocas/"+t+"/status",Map.of("status","TROCA PROCESSADA"),200);
        assertThat(jdbc.queryForObject("select quantidade from estoques where produto_id=?::uuid",Integer.class,p)).isEqualTo(12);
        assertThat(jdbc.queryForObject("select count(*) from cupons where cliente_id=?::uuid",Integer.class,c)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select valor from cupons where cliente_id=?::uuid",java.math.BigDecimal.class,c)).isEqualByComparingTo("200");
        mvc.perform(get("/api/pedidos/"+o)).andExpect(jsonPath("$.status").value("TROCADO"));
        mvc.perform(get("/api/clientes/"+c+"/transacoes")).andExpect(jsonPath("$.notificacoes.length()").value(3));
    }
    @Test void trocaParcialSemReentradaENegativaPermiteNovaSolicitacao() throws Exception {
        var c=cliente(); var p=produto(); var o=historico(c,p,"ENTREGUE",2,"2026-01-15T12:00:00-03:00");
        var negada=solicitar(c,o,p,1,201); patchJson("/api/trocas/"+negada+"/status",Map.of("status","TROCA NEGADA"),200);
        var t=solicitar(c,o,p,1,201); enviado(c,t);
        patchJson("/api/trocas/"+t+"/status",Map.of("status","ITEM RECEBIDO","reentradaEstoque",false),200);
        assertThat(jdbc.queryForObject("select quantidade from estoques where produto_id=?::uuid",Integer.class,p)).isEqualTo(10);
        mvc.perform(get("/api/pedidos/"+o)).andExpect(jsonPath("$.status").value("ENTREGUE"));
    }
    @Test void trocaRejeitaPedidoNaoEntregueExcessoDespachoSemAutorizacaoERecebimentoSemEscolha() throws Exception {
        var c=cliente(); var p=produto(); var o=historico(c,p,"APROVADA",1,"2026-01-15T12:00:00-03:00");
        postJson("/api/clientes/"+c+"/trocas",Map.of("orderId",o,"productId",p,"quantity",1,"reason","Defeito"),409);
        jdbc.update("update pedidos set status='ENTREGUE' where id=?::uuid",o); em.clear(); var t=solicitar(c,o,p,1,201);
        postJson("/api/clientes/"+c+"/trocas",Map.of("orderId",o,"productId",p,"quantity",1,"reason","Defeito"),409);
        postJson("/api/clientes/"+c+"/trocas/"+t+"/despacho",Map.of("carrier","Local","trackingCode","123","dispatchDate",java.time.LocalDate.now().toString()),409);
        enviado(c,t); patchJson("/api/trocas/"+t+"/status",Map.of("status","ITEM RECEBIDO"),400);
    }
    @Test void entradaCalculaMaiorCustoMaisMargemEValidaCampos() throws Exception {
        var p=produto(); var f=postJson("/api/fornecedores",Map.of("nome","Fornecedor Teste"),201).get("id").asString();
        var data=new HashMap<String,Object>(Map.of("produtoId",p,"fornecedorId",f,"quantidade",2,"custoUnitario",60,"dataEntrada",java.time.LocalDate.now().toString()));
        postJson("/api/estoque/entradas",data,201); data.put("custoUnitario",40); postJson("/api/estoque/entradas",data,201);
        mvc.perform(get("/api/produtos/"+p)).andExpect(jsonPath("$.quantidade").value(14)).andExpect(jsonPath("$.custo").value(60)).andExpect(jsonPath("$.preco").value(81));
        data.put("quantidade",0); postJson("/api/estoque/entradas",data,400);
        data.put("quantidade",1); data.remove("dataEntrada"); postJson("/api/estoque/entradas",data,400);
        data.put("dataEntrada",java.time.LocalDate.now().toString()); data.put("fornecedorId",UUID.randomUUID()); postJson("/api/estoque/entradas",data,404);
        assertThat(jdbc.queryForObject("select count(*) from entradas_estoque where produto_id=?::uuid",Integer.class,p)).isEqualTo(2);
    }
    Map<String,Object> produtoInput(boolean ativo) {
        return new HashMap<>(Map.of("nome","Produto Admin Teste","marca","Teste","descricao","Produto real para testes",
            "preco",100,"custo",50,"quantidade",10,"ativo",ativo,
            "grupoPrecificacaoId",jdbc.queryForObject("select id from grupos_precificacao where nome='Padrão'",UUID.class),"categorias",List.of(categoria("Placas de vídeo"))));
    }
    @Test void ativacaoInativacaoExigemMotivoECategoriaSemExcluirProduto() throws Exception {
        var p=produto(); var data=produtoInput(false);
        mvc.perform(put("/api/produtos/"+p).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data))).andExpect(status().isBadRequest());
        data.put("justificativaStatus","Modelo descontinuado"); data.put("categoriaStatus","Descontinuação");
        mvc.perform(put("/api/produtos/"+p).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data))).andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));
        var ativar=produtoInput(true);
        mvc.perform(put("/api/produtos/"+p).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(ativar))).andExpect(status().isBadRequest());
        ativar.put("justificativaStatus","Retorno do modelo"); ativar.put("categoriaStatus","Retorno ao catálogo");
        mvc.perform(put("/api/produtos/"+p).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(ativar))).andExpect(status().isOk());
        mvc.perform(get("/api/produtos/"+p)).andExpect(jsonPath("$.ativo").value(true)).andExpect(jsonPath("$.justificativaStatus").value("Retorno do modelo"));
    }
    @Test void edicaoNaoPodeReduzirMaiorCustoPersistido() throws Exception {
        var p=produto(); var f=postJson("/api/fornecedores",Map.of("nome","Custo Teste"),201).get("id").asString();
        postJson("/api/estoque/entradas",Map.of("produtoId",p,"fornecedorId",f,"quantidade",1,"custoUnitario",60,"dataEntrada",java.time.LocalDate.now().toString()),201);
        var data=produtoInput(true); data.put("quantidade",11);
        mvc.perform(put("/api/produtos/"+p).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/produtos/"+p)).andExpect(jsonPath("$.custo").value(60));
    }
}
