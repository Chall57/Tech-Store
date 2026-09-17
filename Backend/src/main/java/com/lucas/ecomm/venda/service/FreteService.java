package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.cliente.model.EnderecoModel;
import java.math.BigDecimal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class FreteService {
    private final BigDecimal sp, outros, internacional, adicional;
    public FreteService(@Value("${app.frete.sp:14.90}") BigDecimal sp,
        @Value("${app.frete.outros:29.90}") BigDecimal outros,
        @Value("${app.frete.internacional:69.90}") BigDecimal internacional,
        @Value("${app.frete.item-adicional:2.00}") BigDecimal adicional) {
        for(var valor:java.util.List.of(sp,outros,internacional,adicional))
            if(valor.signum()<0||valor.scale()>2) throw new IllegalArgumentException("Tarifa de frete inválida.");
        this.sp=sp; this.outros=outros; this.internacional=internacional; this.adicional=adicional;
    }
    public BigDecimal calcular(EnderecoModel endereco,long quantidade) {
        if(endereco==null||quantidade==0) return new BigDecimal("0.00");
        BigDecimal base=endereco.getPais().equalsIgnoreCase("Brasil")
            ? endereco.getEstado().equalsIgnoreCase("SP")?sp:outros : internacional;
        return base.add(adicional.multiply(BigDecimal.valueOf(quantidade-1))).setScale(2);
    }
}
