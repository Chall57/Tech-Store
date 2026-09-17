package com.lucas.ecomm.cliente;

import com.lucas.ecomm.cliente.service.ValidacaoCliente;
import com.lucas.ecomm.shared.api.RegraException;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class ValidacaoClienteTests {
    @Test void cpfNormalizado() { assertThat(ValidacaoCliente.cpf("529.982.247-25")).isEqualTo("52998224725"); }
    @Test void cpfComDigitosInvalidos() { assertThatThrownBy(()->ValidacaoCliente.cpf("52998224726")).isInstanceOf(RegraException.class); }
    @Test void cpfRepetido() { assertThatThrownBy(()->ValidacaoCliente.cpf("11111111111")).isInstanceOf(RegraException.class); }
    @Test void senhaForte() { assertThatCode(()->ValidacaoCliente.senha("Senha@Segura","Senha@Segura")).doesNotThrowAnyException(); }
    @Test void senhaFraca() { assertThatThrownBy(()->ValidacaoCliente.senha("senhafraca","senhafraca")).isInstanceOf(RegraException.class); }
    @Test void confirmacaoDiferente() { assertThatThrownBy(()->ValidacaoCliente.senha("Senha@Segura","Outra@Senha")).hasMessageContaining("confirmação"); }
}
