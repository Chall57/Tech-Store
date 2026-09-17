package com.lucas.ecomm.cliente;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import tools.jackson.databind.json.JsonMapper;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("integration") @Transactional
@EnabledIfEnvironmentVariable(named="RUN_DB_TESTS", matches="true")
class ClienteIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired JsonMapper json;
    private Map<String,Object> dados(String cpf, String email) {
        var m=new LinkedHashMap<String,Object>();
        m.put("nome","Integração Cliente"); m.put("genero","Masculino"); m.put("cpf",cpf); m.put("email",email);
        m.put("dataNascimento","1998-06-15"); m.put("tipoTelefone","Celular"); m.put("ddd","11"); m.put("telefone","987654321");
        m.put("senha","Teste@2026"); m.put("confirmacaoSenha","Teste@2026");
        m.put("enderecos",List.of(Map.ofEntries(
            Map.entry("nome","Casa"),Map.entry("tipoResidencia","Casa"),Map.entry("tipoLogradouro","Rua"),
            Map.entry("logradouro","Testes"),Map.entry("numero","10"),Map.entry("bairro","Centro"),
            Map.entry("cep","07400000"),Map.entry("cidade","Arujá"),Map.entry("estado","SP"),Map.entry("pais","Brasil"),
            Map.entry("residencial",true),Map.entry("entrega",true),Map.entry("cobranca",true))));
        return m;
    }
    private String cadastrar(String cpf,String email) throws Exception {
        var response=mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dados(cpf,email))))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.senha").doesNotExist()).andExpect(jsonPath("$.senhaHash").doesNotExist()).andReturn();
        return json.readTree(response.getResponse().getContentAsString()).get("id").asString();
    }
    @Test void cadastroGravaHashAuditoriaEEnderecoSemSegredos() throws Exception {
        String id=cadastrar("52998224725","integracao1@techstore.test");
        mvc.perform(get("/api/clientes/perfis")).andExpect(status().isOk())
            .andExpect(jsonPath("$[0].cpf").doesNotExist()).andExpect(jsonPath("$[0].email").doesNotExist());
        String hash=jdbc.queryForObject("select senha_hash from clientes where id=?::uuid",String.class,id);
        assertThat(new BCryptPasswordEncoder().matches("Teste@2026",hash)).isTrue();
        assertThat(jdbc.queryForObject("select count(*) from enderecos where cliente_id=?::uuid",Integer.class,id)).isEqualTo(1);
        mvc.perform(get("/api/clientes/"+id+"/transacoes")).andExpect(status().isOk())
            .andExpect(jsonPath("$.atividades.length()").value(2))
            .andExpect(jsonPath("$.atividades[0].alteracoes").doesNotExist());
        String auditoria=String.join("",jdbc.queryForList("select alteracoes from auditorias",String.class));
        assertThat(auditoria).doesNotContain("Teste@2026",hash,"senhaHash");
        mvc.perform(patch("/api/clientes/"+id+"/senha").contentType(MediaType.APPLICATION_JSON).content("{\"senha\":\"Nova@Senha2026\",\"confirmacaoSenha\":\"Nova@Senha2026\"}")).andExpect(status().isNoContent());
        String novoHash=jdbc.queryForObject("select senha_hash from clientes where id=?::uuid",String.class,id);
        assertThat(novoHash).isNotEqualTo(hash);
        assertThat(new BCryptPasswordEncoder().matches("Nova@Senha2026",novoHash)).isTrue();
    }
    @Test void atualizarConsultarInativarReativarSemExcluir() throws Exception {
        String id=cadastrar("52998224725","integracao2@techstore.test");
        var data=dados("52998224725","integracao2@techstore.test"); data.remove("senha");data.remove("confirmacaoSenha");data.remove("enderecos");data.put("nome","Nome alterado");
        mvc.perform(put("/api/clientes/"+id).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data))).andExpect(status().isOk());
        mvc.perform(get("/api/clientes/"+id)).andExpect(jsonPath("$.nome").value("Nome alterado"));
        mvc.perform(patch("/api/clientes/"+id+"/inativar")).andExpect(jsonPath("$.ativo").value(false));
        assertThat(jdbc.queryForObject("select count(*) from clientes where id=?::uuid",Integer.class,id)).isEqualTo(1);
        mvc.perform(patch("/api/clientes/"+id+"/ativar")).andExpect(jsonPath("$.ativo").value(true));
        mvc.perform(get("/api/clientes").param("nome","Nome alterado").param("cpf","52998224725")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/clientes").param("cpf","529.982.247-25")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/clientes").param("nome","Não existe").param("cpf","52998224725")).andExpect(jsonPath("$.length()").value(0));
    }
    @Test void duplicidadeEIdentificadorInexistente() throws Exception {
        cadastrar("52998224725","integracao3@techstore.test");
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dados("52998224725","novo@techstore.test")))).andExpect(status().isConflict());
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(dados("11144477735","integracao3@techstore.test")))).andExpect(status().isConflict());
        mvc.perform(get("/api/clientes/"+UUID.randomUUID())).andExpect(status().isNotFound());
        mvc.perform(get("/api/clientes/invalido")).andExpect(status().isBadRequest());
    }
    @Test void enderecosNaoPodemSerAcessadosPorOutroClienteNemRemoverUltimo() throws Exception {
        String primeiro=cadastrar("52998224725","integracao4@techstore.test");
        String segundo=cadastrar("11144477735","integracao5@techstore.test");
        var historico=mvc.perform(get("/api/clientes/"+segundo+"/transacoes")).andExpect(status().isOk()).andReturn();
        assertThat(historico.getResponse().getContentAsString()).doesNotContain("Cliente:"+primeiro);
        String endereco=jdbc.queryForObject("select id::text from enderecos where cliente_id=?::uuid",String.class,primeiro);
        mvc.perform(delete("/api/clientes/"+segundo+"/enderecos/"+endereco)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/clientes/"+primeiro+"/enderecos/"+endereco)).andExpect(status().isBadRequest());
        assertThat(jdbc.queryForObject("select count(*) from enderecos where cliente_id=?::uuid",Integer.class,primeiro)).isEqualTo(1);
    }
    @Test void cartaoSemPanCvvEBandeiraInvalida() throws Exception {
        String id=cadastrar("52998224725","integracao6@techstore.test");
        var card=new LinkedHashMap<String,Object>(Map.of("numero","4111111111111111","codigoSeguranca","123","titular","CLIENTE TESTE","bandeira","Visa","validade","12/39","preferencial",true));
        var result=mvc.perform(post("/api/clientes/"+id+"/cartoes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(card))).andExpect(status().isCreated()).andExpect(jsonPath("$.numero").doesNotExist()).andExpect(jsonPath("$.codigoSeguranca").doesNotExist()).andReturn();
        assertThat(result.getResponse().getContentAsString()).doesNotContain("4111111111111111");
        String columns=String.join(",",jdbc.queryForList("select column_name from information_schema.columns where table_schema='techstore_integration' and table_name='cartoes'",String.class));
        assertThat(columns).doesNotContain("codigo_seguranca","numero");
        assertThat(String.join("",jdbc.queryForList("select alteracoes from auditorias",String.class))).doesNotContain("4111111111111111","codigoSeguranca");
        mvc.perform(post("/api/clientes/"+id+"/cartoes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(card))).andExpect(status().isConflict());
        card.put("bandeira","Não cadastrada");
        mvc.perform(post("/api/clientes/"+id+"/cartoes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(card))).andExpect(status().isBadRequest());
    }
    @Test void backendValidaDadosMesmoSemReact() throws Exception {
        var data=dados("52998224725","integracao7@techstore.test");data.put("senha","fraca");data.put("confirmacaoSenha","fraca");
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data))).andExpect(status().isBadRequest());
        data.put("senha","Teste@2026"); data.put("confirmacaoSenha","Teste@2026");
        data.put("enderecos",Arrays.asList((Object)null));
        mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(data)))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fields['enderecos[0]']").value("Endereço obrigatório."));
        assertThat(jdbc.queryForObject("select count(*) from clientes where email='integracao7@techstore.test'",Integer.class)).isZero();
        var produto=new LinkedHashMap<String,Object>(Map.of("nome","Produto categoria inválida","marca","Teste",
            "descricao","Teste de validação de vínculo","preco",150,"custo",100,"ativo",true,"quantidade",10,
            "grupoPrecificacaoId",jdbc.queryForObject("select id from grupos_precificacao where nome='Padrão'",UUID.class)));
        produto.put("categorias",Arrays.asList((Object)null));
        mvc.perform(post("/api/produtos").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(produto)))
            .andExpect(status().isBadRequest());
    }
}
