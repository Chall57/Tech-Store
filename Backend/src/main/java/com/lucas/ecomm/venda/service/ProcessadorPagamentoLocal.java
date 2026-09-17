package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.cliente.model.CartaoModel;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import org.springframework.stereotype.Service;

/** Adaptador de testes: não envia dados nem realiza cobranças em operadoras. */
@Service
public class ProcessadorPagamentoLocal implements ProcessadorPagamento {
    public Resultado autorizar(CartaoModel cartao,BigDecimal valor) {
        boolean valido=valor.signum()>0 && !YearMonth.parse(cartao.getValidade(),DateTimeFormatter.ofPattern("MM/yy")).isBefore(YearMonth.now());
        // Número fictício 4000 0000 0000 0002 permite demonstrar recusa no ambiente local.
        return new Resultado(valido&&!cartao.getUltimosDigitos().equals("0002"),"LOCAL-"+UUID.randomUUID());
    }
}
