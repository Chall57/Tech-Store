package com.lucas.ecomm.cliente.service;
import com.lucas.ecomm.cliente.dto.*;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.cliente.repository.EnderecoRepository;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @Transactional(readOnly=true)
public class EnderecoService {
    private final EnderecoRepository repository;
    private final ClienteService clientes;
    private final AuditoriaService auditoria;
    public EnderecoService(EnderecoRepository repository, ClienteService clientes, AuditoriaService auditoria) {
        this.repository=repository; this.clientes=clientes; this.auditoria=auditoria;
    }
    public List<EnderecoResponse> listar(UUID clienteId) {
        clientes.exigir(clienteId);
        return repository.findByClienteIdOrderByCriadoEmAsc(clienteId).stream().map(EnderecoResponse::de).toList();
    }
    public static void preencher(EnderecoModel e, EnderecoRequest r) {
        if(!r.residencial()&&!r.entrega()&&!r.cobranca()) throw RegraException.invalido("Selecione ao menos uma finalidade do endereço.");
        e.setNome(r.nome().strip()); e.setTipoResidencia(r.tipoResidencia().strip()); e.setTipoLogradouro(r.tipoLogradouro().strip());
        e.setLogradouro(r.logradouro().strip()); e.setNumero(r.numero().strip()); e.setBairro(r.bairro().strip());
        e.setCep(r.cep().replace("-","")); e.setCidade(r.cidade().strip()); e.setEstado(r.estado().toUpperCase(Locale.ROOT));
        e.setPais(r.pais().strip()); e.setObservacoes(r.observacoes()); e.setResidencial(r.residencial()); e.setEntrega(r.entrega()); e.setCobranca(r.cobranca());
    }
    public static void validarFuncoes(List<List<Boolean>> funcoes) {
        for(int i=0;i<3;i++) {
            final int idx=i;
            if(funcoes.stream().noneMatch(f->f.get(idx))) throw RegraException.invalido("Mantenha pelo menos um endereço "+List.of("residencial","de entrega","de cobrança").get(i)+".");
        }
    }
    private EnderecoModel exigir(UUID clienteId, UUID id) {
        return repository.findByIdAndClienteId(id,clienteId).orElseThrow(()->RegraException.inexistente("Endereço não encontrado para este cliente."));
    }
    @Transactional
    public EnderecoResponse salvar(UUID clienteId, UUID id, EnderecoRequest r) {
        var cliente=clientes.bloquear(clienteId);
        var model=id==null?new EnderecoModel():exigir(clienteId,id);
        var antes=id==null?null:EnderecoResponse.de(model);
        var outros=repository.findByClienteIdOrderByCriadoEmAsc(clienteId).stream().filter(e->!e.getId().equals(id)).toList();
        if(outros.stream().anyMatch(e->e.getNome().equalsIgnoreCase(r.nome().strip()))) throw RegraException.conflito("Já existe um endereço com esse nome.");
        var funcoes=new ArrayList<>(outros.stream().map(e->List.of(e.getResidencial(),e.getEntrega(),e.getCobranca())).toList());
        funcoes.add(List.of(r.residencial(),r.entrega(),r.cobranca())); validarFuncoes(funcoes);
        model.setCliente(cliente); preencher(model,r); repository.saveAndFlush(model);
        var depois=EnderecoResponse.de(model); auditoria.registrar(id==null?"CADASTRAR":"ALTERAR","Endereco:"+model.getId(),antes,depois);
        return depois;
    }
    @Transactional
    public void excluir(UUID clienteId, UUID id) {
        clientes.bloquear(clienteId); var model=exigir(clienteId,id);
        validarFuncoes(repository.findByClienteIdOrderByCriadoEmAsc(clienteId).stream().filter(e->!e.getId().equals(id))
            .map(e->List.of(e.getResidencial(),e.getEntrega(),e.getCobranca())).toList());
        var antes=EnderecoResponse.de(model); repository.delete(model); repository.flush();
        auditoria.registrar("EXCLUIR","Endereco:"+id,antes,null);
    }
}
