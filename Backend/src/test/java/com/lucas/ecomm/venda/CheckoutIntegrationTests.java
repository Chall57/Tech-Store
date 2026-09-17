package com.lucas.ecomm.venda;

import com.lucas.ecomm.venda.service.CarrinhoService;
import com.lucas.ecomm.venda.service.PedidoService;
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

/** Dados criados pela API e revertidos por transação no schema exclusivo de integração. */
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("integration") @Transactional
@EnabledIfEnvironmentVariable(named="RUN_DB_TESTS", matches="true")
class CheckoutIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;
    @Autowired EntityManager em;
    @Autowired CarrinhoService carrinhos;
    @Autowired PedidoService pedidos;

    private JsonNode postJson(String path,Object body,int expected) throws Exception {
        var response=mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)))
            .andExpect(status().is(expected)).andReturn();
        return json.readTree(response.getResponse().getContentAsString());
    }
    private String cliente(String cpf) throws Exception {
        return postJson("/api/clientes",Map.ofEntries(
            Map.entry("nome","Compra Integração"),Map.entry("genero","Masculino"),Map.entry("cpf",cpf),
            Map.entry("email",cpf+"@checkout.test"),Map.entry("dataNascimento","1998-06-15"),
            Map.entry("tipoTelefone","Celular"),Map.entry("ddd","11"),Map.entry("telefone","987654321"),
            Map.entry("senha","Teste@2026"),Map.entry("confirmacaoSenha","Teste@2026"),
            Map.entry("enderecos",List.of(Map.ofEntries(Map.entry("nome","Casa"),Map.entry("tipoResidencia","Casa"),
                Map.entry("tipoLogradouro","Rua"),Map.entry("logradouro","Compras"),Map.entry("numero","10"),Map.entry("bairro","Centro"),
                Map.entry("cep","07400000"),Map.entry("cidade","Arujá"),Map.entry("estado","SP"),Map.entry("pais","Brasil"),
                Map.entry("residencial",true),Map.entry("entrega",true),Map.entry("cobranca",true))))),201).get("id").asString();
    }
    private String endereco(String id) {
        return jdbc.queryForObject("select id::text from enderecos where cliente_id=?::uuid",String.class,id);
    }
    private String produto() throws Exception {
        return postJson("/api/produtos",Map.of("nome","Hardware integração","marca","Teste","descricao","Compra com estoque real",
            "preco",100,"custo",50,"quantidade",10,"ativo",true,
            "grupoPrecificacaoId",jdbc.queryForObject("select id from grupos_precificacao where nome='Padrão'",UUID.class),
            "categorias",List.of(jdbc.queryForObject("select id from categorias where nome='Placas de vídeo'",UUID.class))),201).get("id").asString();
    }
    private String cartao(String id,String numero) throws Exception {
        return postJson("/api/clientes/"+id+"/cartoes",Map.of("numero",numero,"codigoSeguranca","123","titular","CLIENTE TESTE",
            "bandeira",numero.startsWith("5")?"Mastercard":"Visa","validade","12/39","preferencial",false),201).get("id").asString();
    }
    private String cupom(String id,String tipo,double valor) throws Exception {
        return postJson("/api/cupons",Map.of("codigo","TESTE-"+UUID.randomUUID(),"tipo",tipo,"valor",valor,
            "validade","2039-12-31","clienteId",id),201).get("id").asString();
    }
    private void adicionar(String cliente,String produto,int quantidade) throws Exception {
        postJson("/api/clientes/"+cliente+"/carrinho/itens/"+produto,Map.of("quantidade",quantidade),200);
    }
    private JsonNode orcamento(String id,String endereco,List<String> coupons,int status) throws Exception {
        return postJson("/api/clientes/"+id+"/checkout/orcamento",Map.of("enderecoId",endereco,"cupomIds",coupons),status);
    }
    private Map<String,Object> compra(String endereco,List<String> coupons,JsonNode q,List<Map<String,Object>> payments) {
        return Map.of("enderecoId",endereco,"cupomIds",coupons,"pagamentos",payments,"chaveOperacao",UUID.randomUUID(),
            "totalEsperado",q.get("totalCompra").decimalValue(),"revisao",q.get("revisao").asString());
    }
    private Map<String,Object> pagamento(String card,double valor) { return Map.of("cartaoId",card,"valor",valor); }
    private int reservado(String p) { return jdbc.queryForObject("select reservado from estoques where produto_id=?::uuid",Integer.class,p); }
    private int estoque(String p) { return jdbc.queryForObject("select quantidade from estoques where produto_id=?::uuid",Integer.class,p); }
    private JsonNode processar(String id) throws Exception { return postJson("/api/pedidos/"+id+"/pagamento",Map.of(),200); }

    @Test void doisCartoesCupomPersistenciaAprovacaoEIdempotencia() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111"),b=cartao(c,"5555555555554444"),v=cupom(c,"Promocional",20);
        adicionar(c,p,2); assertThat(reservado(p)).isEqualTo(2); assertThat(estoque(p)).isEqualTo(10);
        var q=orcamento(c,endereco(c),List.of(v),200);
        assertThat(q.get("frete").asDouble()).isEqualTo(16.90);
        assertThat(q.get("totalCartoes").asDouble()).isEqualTo(196.90);
        var input=compra(endereco(c),List.of(v),q,List.of(pagamento(a,96.90),pagamento(b,100)));
        var order=postJson("/api/clientes/"+c+"/pedidos",input,201); String id=order.get("id").asString();
        long numero=order.get("numero").asLong();
        assertThat(numero).isGreaterThanOrEqualTo(111082);
        assertThat(order.get("status").asString()).isEqualTo("EM PROCESSAMENTO");
        assertThat(order.get("payments").size()).isEqualTo(2);
        assertThat(jdbc.queryForObject("select count(*) from itens_carrinho where carrinho_id in (select id from carrinhos where cliente_id=?::uuid)",Integer.class,c)).isZero();
        assertThat(estoque(p)).isEqualTo(10); assertThat(reservado(p)).isEqualTo(2);
        var repetido=postJson("/api/clientes/"+c+"/pedidos",input,201);
        assertThat(repetido.get("id").asString()).isEqualTo(id);
        assertThat(repetido.get("numero").asLong()).isEqualTo(numero);
        assertThat(processar(id).get("status").asString()).isEqualTo("APROVADA");
        assertThat(estoque(p)).isEqualTo(8); assertThat(reservado(p)).isZero(); processar(id);
        assertThat(estoque(p)).isEqualTo(8);
        assertThat(jdbc.queryForObject("select count(*) from pedidos where cliente_id=?::uuid",Integer.class,c)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select utilizado from cupons where id=?::uuid",Boolean.class,v)).isTrue();
        mvc.perform(get("/api/pedidos/"+id)).andExpect(status().isOk()).andExpect(jsonPath("$.desconto").value(20))
            .andExpect(jsonPath("$.numero").value(numero))
            .andExpect(jsonPath("$.addressSnapshot").value(org.hamcrest.Matchers.containsString("Arujá")));
        assertThat(String.join("",jdbc.queryForList("select alteracoes from auditorias",String.class))).doesNotContain("4111111111111111","5555555555554444","codigoSeguranca");
    }
    @Test void numeroPublicoUnicoEPersistenteSemAlterarIdentificadoresInternos() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111");
        adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(),200);
        var primeiro=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,114.90))),201);
        processar(primeiro.get("id").asString());
        adicionar(c,p,1);
        q=orcamento(c,endereco(c),List.of(),200);
        var segundo=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,114.90))),201);
        long numero=primeiro.get("numero").asLong();
        assertThat(segundo.get("numero").asLong()).isGreaterThan(numero);
        assertThat(UUID.fromString(primeiro.get("id").asString())).isNotEqualTo(UUID.fromString(segundo.get("id").asString()));
        em.flush(); em.clear();
        mvc.perform(get("/api/pedidos/"+primeiro.get("id").asString())).andExpect(status().isOk()).andExpect(jsonPath("$.numero").value(numero));
        assertThat(jdbc.queryForObject("select numero from pedidos where id=?::uuid",Long.class,primeiro.get("id").asString())).isEqualTo(numero);
        assertThat(jdbc.queryForObject("select count(distinct numero) from pedidos where cliente_id=?::uuid",Integer.class,c)).isEqualTo(2);
    }
    @Test void rejeitaSomaErradaCartaoAbaixoDoMinimoEDuplicado() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111"),b=cartao(c,"5555555555554444"); adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(),200);
        postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,100))),400);
        postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,5),pagamento(b,109.90))),400);
        postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,50),pagamento(a,64.90))),400);
        assertThat(jdbc.queryForObject("select count(*) from pedidos where cliente_id=?::uuid",Integer.class,c)).isZero();
    }
    @Test void saldoPequenoDepoisDosCuponsPermiteUmCartao() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111"),v=cupom(c,"Troca",110); adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(v),200);
        assertThat(q.get("totalCartoes").asDouble()).isEqualTo(4.90);
        var order=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(v),q,List.of(pagamento(a,4.90))),201);
        assertThat(processar(order.get("id").asString()).get("status").asString()).isEqualTo("APROVADA");
    }
    @Test void excedenteGeraCupomDeTrocaUmaVezSemCartoes() throws Exception {
        String c=cliente("52998224725"),p=produto(),v=cupom(c,"Troca",150); adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(v),200);
        assertThat(q.get("creditoTroca").asDouble()).isEqualTo(35.10);
        var order=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(v),q,List.of()),201);
        var paid=processar(order.get("id").asString()); processar(order.get("id").asString());
        assertThat(paid.get("creditCouponCode").asString()).startsWith("SALDO-");
        assertThat(paid.get("payments").size()).isZero();
        assertThat(jdbc.queryForObject("select count(*) from cupons where cliente_id=?::uuid and codigo like 'SALDO-%'",Integer.class,c)).isEqualTo(1);
        assertThat(jdbc.queryForObject("select valor from cupons where codigo=?",java.math.BigDecimal.class,paid.get("creditCouponCode").asString())).isEqualByComparingTo("35.10");
    }
    @Test void rejeitaDoisPromocionaisECuponsDesnecessarios() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cupom(c,"Promocional",20),b=cupom(c,"Promocional",10),x=cupom(c,"Troca",150); adicionar(c,p,1);
        orcamento(c,endereco(c),List.of(a,b),400); orcamento(c,endereco(c),List.of(x,a),400);
    }
    @Test void combinaDoisCuponsDeTrocaComPromocionalERejeitaCupomJaUsado() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111"),v=cupom(c,"Troca",20),w=cupom(c,"Troca",10),x=cupom(c,"Promocional",5); adicionar(c,p,1);
        var vouchers=List.of(v,w,x); var q=orcamento(c,endereco(c),vouchers,200);
        var o=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),vouchers,q,List.of(pagamento(a,79.90))),201);
        assertThat(o.get("couponCodes").size()).isEqualTo(3);
        processar(o.get("id").asString()); adicionar(c,p,1); orcamento(c,endereco(c),List.of(v),409);
    }
    @Test void recusaSimuladaDevolveCuponsEReservaSemBaixarEstoque() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4000000000000002"),v=cupom(c,"Troca",20); adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(v),200);
        var o=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(v),q,List.of(pagamento(a,94.90))),201);
        assertThat(processar(o.get("id").asString()).get("status").asString()).isEqualTo("REPROVADA");
        assertThat(estoque(p)).isEqualTo(10); assertThat(reservado(p)).isZero();
        assertThat(jdbc.queryForObject("select utilizado from cupons where id=?::uuid",Boolean.class,v)).isFalse();
    }
    @Test void enderecosCartoesECuponsDevemPertencerAoCliente() throws Exception {
        String c=cliente("52998224725"),other=cliente("11144477735"),p=produto(),a=cartao(other,"4111111111111111"),v=cupom(other,"Troca",20); adicionar(c,p,1);
        orcamento(c,endereco(other),List.of(),404); orcamento(c,endereco(c),List.of(v),404);
        var q=orcamento(c,endereco(c),List.of(),200);
        postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,114.90))),404);
    }
    @Test void reservaExpiradaRemoveItensEDisponibilizaMotivo() throws Exception {
        String c=cliente("52998224725"),p=produto(); adicionar(c,p,2); em.flush();
        jdbc.update("update carrinhos set expira_em=now()-interval '1 second' where cliente_id=?::uuid",c); em.clear();
        var summary=carrinhos.resumo(UUID.fromString(c)); em.flush();
        assertThat(summary.items()).isEmpty(); assertThat(summary.removed()).hasSize(1);
        assertThat(summary.removed().getFirst().reason()).contains("expirado"); assertThat(reservado(p)).isZero();
        adicionar(c,p,1); assertThat(carrinhos.resumo(UUID.fromString(c)).removed()).isEmpty(); assertThat(reservado(p)).isEqualTo(1);
    }
    @Test void pedidoExpiradoECancelamentoLiberamRecursos() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111"),v=cupom(c,"Troca",20); adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(v),200);
        var o=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(v),q,List.of(pagamento(a,94.90))),201); String id=o.get("id").asString(); em.flush();
        jdbc.update("update pedidos set expira_em=now()-interval '1 second' where id=?::uuid",id); em.clear(); pedidos.expirar(UUID.fromString(id)); em.flush();
        assertThat(reservado(p)).isZero(); assertThat(jdbc.queryForObject("select utilizado from cupons where id=?::uuid",Boolean.class,v)).isFalse();
        adicionar(c,p,1); q=orcamento(c,endereco(c),List.of(v),200);
        o=postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(v),q,List.of(pagamento(a,94.90))),201);
        mvc.perform(patch("/api/clientes/"+c+"/pedidos/"+o.get("id").asString()+"/status").contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"CANCELADO\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELADO")); assertThat(reservado(p)).isZero();
    }
    @Test void revisaoImpedeCompraComResumoDesatualizado() throws Exception {
        String c=cliente("52998224725"),p=produto(),a=cartao(c,"4111111111111111"); adicionar(c,p,1);
        var q=orcamento(c,endereco(c),List.of(),200); adicionar(c,p,1);
        postJson("/api/clientes/"+c+"/pedidos",compra(endereco(c),List.of(),q,List.of(pagamento(a,114.90))),409);
        assertThat(jdbc.queryForObject("select count(*) from pedidos where cliente_id=?::uuid",Integer.class,c)).isZero();
    }
    @Test void reservaPropriaPermiteAlterarQuantidadeENaoPodeSerConsumidaPorOutroCliente() throws Exception {
        String c=cliente("52998224725"),other=cliente("11144477735"),p=produto(); adicionar(c,p,10);
        postJson("/api/clientes/"+other+"/carrinho/itens/"+p,Map.of("quantidade",1),409);
        mvc.perform(put("/api/clientes/"+c+"/carrinho/itens/"+p).contentType(MediaType.APPLICATION_JSON).content("{\"quantidade\":9}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].quantity").value(9));
        assertThat(reservado(p)).isEqualTo(9); adicionar(other,p,1); assertThat(reservado(p)).isEqualTo(10);
    }
}
