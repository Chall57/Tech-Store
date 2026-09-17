package com.lucas.ecomm.cliente.service;

import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.cliente.repository.*;
import com.lucas.ecomm.cliente.dto.*;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;

@Service @Transactional(readOnly=true)
public class ClienteService {
    private final ClienteRepository repository;
    private final EnderecoRepository enderecos;
    private final AuditoriaService auditoria;
    private final EntityManager em;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
    public ClienteService(ClienteRepository repository, EnderecoRepository enderecos, AuditoriaService auditoria, EntityManager em) {
        this.repository=repository; this.enderecos=enderecos; this.auditoria=auditoria; this.em=em;
    }
    public ClienteModel exigir(UUID id) {
        return repository.findById(id).orElseThrow(()->RegraException.inexistente("Cliente não encontrado."));
    }
    public ClienteModel bloquear(UUID id) {
        return repository.bloquear(id).orElseThrow(()->RegraException.inexistente("Cliente não encontrado."));
    }
    private long ranking(UUID id) {
        return ((Number)em.createNativeQuery("select count(*) from pedidos where cliente_id=:id and status in ('APROVADA','PAGAMENTO REALIZADO','EM TRÂNSITO','EM TRANSPORTE','ENTREGUE')")
            .setParameter("id",id).getSingleResult()).longValue();
    }
    public ClienteResponse consultar(UUID id) { return ClienteResponse.de(exigir(id),ranking(id)); }
    public List<PerfilClienteResponse> perfis() { return repository.listarPerfis(); }
    public List<ClienteResponse> listar(Map<String,String> filtros) {
        var encontrados=repository.findAll((root,query,cb)-> {
            var condicoes=new ArrayList<Predicate>();
            for(String campo:List.of("nome","genero","cpf","email","tipoTelefone","ddd","telefone")) {
                var valor=filtros.get(campo);
                if (valor!=null && campo.equals("cpf")) valor=valor.replaceAll("[.\\-\\s]", "");
                if(valor!=null&&!valor.isBlank()) condicoes.add(cb.like(cb.lower(root.get(campo)), "%"+valor.trim().toLowerCase(Locale.ROOT).replace("%","\\%").replace("_","\\_")+"%",'\\'));
            }
            String id=filtros.get("id");
            if(id!=null&&!id.isBlank()) {
                try { condicoes.add(cb.equal(root.get("id"),UUID.fromString(id))); }
                catch(IllegalArgumentException e) { throw RegraException.invalido("Código de cliente inválido."); }
            }
            String nascimento=filtros.get("dataNascimento");
            if(nascimento!=null&&!nascimento.isBlank()) {
                try { condicoes.add(cb.equal(root.get("dataNascimento"),java.time.LocalDate.parse(nascimento))); }
                catch(Exception e) { throw RegraException.invalido("Data de nascimento inválida."); }
            }
            String ativo=filtros.get("ativo");
            if(ativo!=null&&!ativo.isBlank()) {
                if(!List.of("true","false").contains(ativo)) throw RegraException.invalido("Status inválido.");
                condicoes.add(cb.equal(root.get("ativo"),Boolean.parseBoolean(ativo)));
            }
            query.orderBy(cb.asc(root.get("nome")));
            return cb.and(condicoes.toArray(Predicate[]::new));
        });
        // Um agregado para toda a lista, sem uma consulta por cliente.
        Map<UUID,Long> rankings=new HashMap<>();
        for(Object row:em.createNativeQuery("select cliente_id,count(*) from pedidos where status in ('APROVADA','PAGAMENTO REALIZADO','EM TRÂNSITO','EM TRANSPORTE','ENTREGUE') group by cliente_id").getResultList()) {
            Object[] r=(Object[])row; rankings.put((UUID)r[0],((Number)r[1]).longValue());
        }
        return encontrados.stream().map(c->ClienteResponse.de(c,rankings.getOrDefault(c.getId(),0L))).toList();
    }
    private void preencher(ClienteModel c, ClienteRequest r) {
        String cpf=ValidacaoCliente.cpf(r.cpf());
        String email=r.email().strip().toLowerCase(Locale.ROOT);
        UUID id=c.getId()==null?new UUID(0,0):c.getId();
        if(repository.existsByCpfAndIdNot(cpf,id)) throw RegraException.conflito("CPF já cadastrado.");
        if(repository.existsByEmailAndIdNot(email,id)) throw RegraException.conflito("E-mail já cadastrado.");
        c.setNome(r.nome().strip()); c.setGenero(r.genero().strip()); c.setDataNascimento(r.dataNascimento());
        c.setCpf(cpf); c.setEmail(email); c.setTipoTelefone(r.tipoTelefone().strip());
        c.setDdd(r.ddd()); c.setTelefone(r.telefone());
    }
    @Transactional
    public ClienteResponse cadastrar(ClienteRequest r) {
        ValidacaoCliente.senha(r.senha(),r.confirmacaoSenha());
        if(r.enderecos()==null||r.enderecos().isEmpty()) throw RegraException.invalido("Cadastre os endereços obrigatórios.");
        EnderecoService.validarFuncoes(r.enderecos().stream().map(e->List.of(e.residencial(),e.entrega(),e.cobranca())).toList());
        var cliente=new ClienteModel(); preencher(cliente,r);
        cliente.setSenhaHash(encoder.encode(r.senha()));
        repository.saveAndFlush(cliente);
        for(var endereco:r.enderecos()) {
            var model=new EnderecoModel(); model.setCliente(cliente); EnderecoService.preencher(model,endereco);
            enderecos.saveAndFlush(model);
            auditoria.registrar("CADASTRAR","Endereco:"+model.getId(),null,EnderecoResponse.de(model));
        }
        var resposta=ClienteResponse.de(cliente,0);
        auditoria.registrar("CADASTRAR","Cliente:"+cliente.getId(),null,resposta);
        return resposta;
    }
    @Transactional
    public ClienteResponse alterar(UUID id, ClienteRequest r) {
        if(r.senha()!=null||r.confirmacaoSenha()!=null||r.enderecos()!=null)
            throw RegraException.invalido("Altere senha e endereços pelos formulários independentes.");
        var c=bloquear(id); var antes=ClienteResponse.de(c,ranking(id)); preencher(c,r);
        repository.saveAndFlush(c); var depois=ClienteResponse.de(c,antes.ranking());
        auditoria.registrar("ALTERAR","Cliente:"+id,antes,depois); return depois;
    }
    @Transactional
    public ClienteResponse ativar(UUID id, boolean ativo) {
        var c=bloquear(id); var antes=ClienteResponse.de(c,ranking(id));
        c.setAtivo(ativo); repository.saveAndFlush(c);
        var depois=ClienteResponse.de(c,antes.ranking());
        auditoria.registrar(ativo?"REATIVAR":"INATIVAR","Cliente:"+id,antes,depois); return depois;
    }
    @Transactional
    public void alterarSenha(UUID id, SenhaRequest r) {
        ValidacaoCliente.senha(r.senha(),r.confirmacaoSenha());
        var c=bloquear(id); c.setSenhaHash(encoder.encode(r.senha())); repository.saveAndFlush(c);
        auditoria.registrar("ALTERAR_SENHA","Cliente:"+id,null,Map.of("senhaAlterada",true));
    }
}
