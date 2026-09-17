package com.lucas.ecomm.cliente.service;
import com.lucas.ecomm.cliente.dto.*;
import com.lucas.ecomm.cliente.model.*;
import com.lucas.ecomm.cliente.repository.*;
import com.lucas.ecomm.shared.api.RegraException;
import com.lucas.ecomm.shared.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

@Service @Transactional(readOnly=true)
public class CartaoService {
    private final CartaoRepository repository;
    private final BandeiraRepository bandeiras;
    private final ClienteService clientes;
    private final AuditoriaService auditoria;
    private final String chave;
    public CartaoService(CartaoRepository repository, BandeiraRepository bandeiras, ClienteService clientes,
        AuditoriaService auditoria, @Value("${app.cartao-chave}") String chave) {
        if(chave.length()<32) throw new IllegalArgumentException("CARD_TOKEN_KEY deve conter pelo menos 32 caracteres.");
        this.repository=repository; this.bandeiras=bandeiras; this.clientes=clientes; this.auditoria=auditoria; this.chave=chave;
    }
    public List<CartaoResponse> listar(UUID clienteId) {
        clientes.exigir(clienteId); return repository.findByClienteIdOrderByCriadoEmAsc(clienteId).stream().map(CartaoResponse::de).toList();
    }
    public List<String> bandeiras() { return bandeiras.findAll().stream().map(BandeiraModel::getNome).sorted().toList(); }
    private CartaoModel exigir(UUID clienteId, UUID id) {
        return repository.findByIdAndClienteId(id,clienteId).orElseThrow(()->RegraException.inexistente("Cartão não encontrado para este cliente."));
    }
    private String identificar(String numero) {
        try {
            Mac mac=Mac.getInstance("HmacSHA256"); mac.init(new SecretKeySpec(chave.getBytes(StandardCharsets.UTF_8),"HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(numero.getBytes(StandardCharsets.UTF_8)));
        } catch(java.security.GeneralSecurityException e) { throw new IllegalStateException("Falha de tokenização local.",e); }
    }
    private String validarNumero(String numero, String cvv) {
        String n=numero==null?"":numero.replaceAll("[ -]","");
        if(!n.matches("[0-9]{13,19}")||n.chars().distinct().count()==1) throw RegraException.invalido("Número de cartão inválido.");
        int soma=0; boolean dobrar=false;
        for(int i=n.length()-1;i>=0;i--) { int d=n.charAt(i)-'0'; if(dobrar) { d*=2; if(d>9)d-=9; } soma+=d; dobrar=!dobrar; }
        if(soma%10!=0) throw RegraException.invalido("Número de cartão inválido.");
        if(cvv==null||!cvv.matches("[0-9]{3,4}")) throw RegraException.invalido("Código de segurança deve conter 3 ou 4 dígitos.");
        return n;
    }
    private void preferir(UUID clienteId, CartaoModel escolhido) {
        for(var c:repository.findByClienteIdOrderByCriadoEmAsc(clienteId)) {
            if(c.getPreferencial()&&!c.getId().equals(escolhido.getId())) {
                var antes=CartaoResponse.de(c); c.setPreferencial(false);
                auditoria.registrar("ALTERAR_PREFERENCIA","Cartao:"+c.getId(),antes,CartaoResponse.de(c));
            }
        }
        repository.flush(); // Libera o índice único parcial antes de marcar outro preferencial.
        escolhido.setPreferencial(true);
    }
    @Transactional
    public CartaoResponse salvar(UUID clienteId, UUID id, CartaoRequest r) {
        var cliente=clientes.bloquear(clienteId); var model=id==null?new CartaoModel():exigir(clienteId,id);
        var antes=id==null?null:CartaoResponse.de(model);
        var bandeira=bandeiras.findByNomeIgnoreCase(r.bandeira()).orElseThrow(()->RegraException.invalido("Bandeira não cadastrada."));
        if(YearMonth.parse(r.validade(),DateTimeFormatter.ofPattern("MM/yy")).isBefore(YearMonth.now())) throw RegraException.invalido("Cartão vencido.");
        if(id==null || (r.numero()!=null&&!r.numero().isBlank())) {
            String numero=validarNumero(r.numero(),r.codigoSeguranca());
            String identificacao=identificar(numero);
            if(repository.findByClienteIdOrderByCriadoEmAsc(clienteId).stream().anyMatch(c->!c.getId().equals(id)&&c.getImpressaoDigital().equals(identificacao)))
                throw RegraException.conflito("Este cartão já está cadastrado para o cliente.");
            model.setImpressaoDigital(identificacao); model.setUltimosDigitos(numero.substring(numero.length()-4));
        }
        model.setCliente(cliente); model.setBandeira(bandeira); model.setTitular(r.titular().strip()); model.setValidade(r.validade());
        if(r.preferencial()||repository.findByClienteIdOrderByCriadoEmAsc(clienteId).isEmpty()) preferir(clienteId,model);
        // Desmarcar o único preferencial não é permitido; escolha outro cartão pela ação dedicada.
        repository.saveAndFlush(model); var depois=CartaoResponse.de(model);
        auditoria.registrar(id==null?"CADASTRAR":"ALTERAR","Cartao:"+model.getId(),antes,depois); return depois;
    }
    @Transactional
    public CartaoResponse preferencial(UUID clienteId, UUID id) {
        clientes.bloquear(clienteId); var model=exigir(clienteId,id); var antes=CartaoResponse.de(model);
        preferir(clienteId,model); repository.saveAndFlush(model);
        var depois=CartaoResponse.de(model); auditoria.registrar("ALTERAR_PREFERENCIA","Cartao:"+id,antes,depois); return depois;
    }
    @Transactional
    public void excluir(UUID clienteId, UUID id) {
        clientes.bloquear(clienteId); var model=exigir(clienteId,id); boolean preferencial=model.getPreferencial();
        var antes=CartaoResponse.de(model); repository.delete(model); repository.flush();
        if(preferencial) {
            var restantes=repository.findByClienteIdOrderByCriadoEmAsc(clienteId);
            if(!restantes.isEmpty()) { var proximo=restantes.getFirst(); var anterior=CartaoResponse.de(proximo); proximo.setPreferencial(true); repository.flush();
                auditoria.registrar("ALTERAR_PREFERENCIA","Cartao:"+proximo.getId(),anterior,CartaoResponse.de(proximo)); }
        }
        auditoria.registrar("EXCLUIR","Cartao:"+id,antes,null);
    }
}
