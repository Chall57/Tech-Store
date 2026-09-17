package com.lucas.ecomm.shared.service;
import com.lucas.ecomm.shared.model.AuditoriaModel;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import tools.jackson.databind.json.JsonMapper;
import java.util.Map;

@Service
public class AuditoriaService {
    private final EntityManager entityManager;
    private final JsonMapper mapper;
    public AuditoriaService(EntityManager entityManager, JsonMapper mapper) {
        this.entityManager=entityManager; this.mapper=mapper;
    }
    public void registrar(String operacao, String entidade, Object antes, Object depois) {
        // Identidade contextual local; não é autenticação. Recebe somente DTOs sem segredos.
        var atributos=org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
        String perfil=atributos instanceof org.springframework.web.context.request.ServletRequestAttributes servlet
            ? servlet.getRequest().getHeader("X-Perfil") : "SISTEMA";
        String responsavel=perfil == null ? "LOCAL" : perfil.substring(0,Math.min(100,perfil.length()));
        entityManager.persist(new AuditoriaModel(responsavel,operacao,entidade,
            mapper.writeValueAsString(Map.of("antes",antes==null?Map.of():antes,"depois",depois==null?Map.of():depois))));
    }
}
