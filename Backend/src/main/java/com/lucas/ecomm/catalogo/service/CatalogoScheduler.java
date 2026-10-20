package com.lucas.ecomm.catalogo.service;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component @Profile("!test & !integration")
public class CatalogoScheduler {
    private final InativacaoProdutoService inativacao;
    public CatalogoScheduler(InativacaoProdutoService inativacao) { this.inativacao=inativacao; }

    @Scheduled(fixedDelayString="${app.catalogo.inativacao-intervalo-ms:3600000}",initialDelayString="${app.catalogo.inativacao-espera-inicial-ms:60000}")
    public void inativarSemMovimento() {
        for(var id:inativacao.candidatos()) {
            try { inativacao.inativar(id); }
            catch(Exception erro) {
                org.slf4j.LoggerFactory.getLogger(getClass()).warn("Falha ao inativar produto {}: {}",id,erro.getClass().getSimpleName());
            }
        }
    }
}
