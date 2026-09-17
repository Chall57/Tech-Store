package com.lucas.ecomm.venda.service;
import com.lucas.ecomm.venda.model.CupomModel;
import com.lucas.ecomm.venda.repository.CupomRepository;
import com.lucas.ecomm.cliente.service.ClienteService;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import jakarta.validation.constraints.*;
import java.util.*;
import java.time.LocalDate;
import java.math.BigDecimal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CupomService {
    private final CupomRepository repository;
    private final ClienteService clientes;
    private final AuditoriaService auditoria;
    public CupomService(CupomRepository repository, ClienteService clientes, AuditoriaService auditoria) {
        this.repository=repository; this.clientes=clientes; this.auditoria=auditoria;
    }
    public record Cadastro(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{3,60}") String codigo,
        @NotBlank @Pattern(regexp="Promocional|Troca") String tipo,
        @NotNull @DecimalMin("0.01") @Digits(integer=10,fraction=2) BigDecimal valor,
        @NotNull @FutureOrPresent LocalDate validade, UUID clienteId) {}
    public record Resposta(UUID id,String codigo,String tipo,BigDecimal valor,LocalDate validade,UUID clienteId) {}
    @Transactional(readOnly=true) public Resposta consultar(UUID id) {
        var c=repository.findById(id).orElseThrow(()->RegraException.inexistente("Cupom não encontrado."));
        return new Resposta(c.getId(),c.getCodigo(),c.getTipo(),c.getValor(),c.getValidade(),c.getCliente()==null?null:c.getCliente().getId());
    }
    @Transactional public Resposta cadastrar(Cadastro r) {
        if(r.tipo().equals("Troca") && r.clienteId()==null) throw RegraException.invalido("Cupom de troca deve pertencer a um cliente.");
        var model=new CupomModel();
        if(r.clienteId()!=null) model.setCliente(clientes.exigir(r.clienteId()));
        model.setCodigo(r.codigo().toUpperCase(Locale.ROOT)); model.setTipo(r.tipo());
        model.setValor(r.valor()); model.setValidade(r.validade()); repository.saveAndFlush(model);
        var resposta=new Resposta(model.getId(),model.getCodigo(),model.getTipo(),model.getValor(),model.getValidade(),r.clienteId());
        auditoria.registrar("CADASTRAR","Cupom:"+model.getId(),null,resposta);
        return resposta;
    }
}
