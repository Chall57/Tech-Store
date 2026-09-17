package com.lucas.ecomm.venda.service;

import com.lucas.ecomm.cliente.model.CartaoModel;
import java.math.BigDecimal;

public interface ProcessadorPagamento {
    record Resultado(boolean aprovado,String referencia) {}
    Resultado autorizar(CartaoModel cartao,BigDecimal valor);
}
