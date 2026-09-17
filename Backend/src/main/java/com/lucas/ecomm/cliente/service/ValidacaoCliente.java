package com.lucas.ecomm.cliente.service;
import com.lucas.ecomm.shared.api.RegraException;
import java.nio.charset.StandardCharsets;
public final class ValidacaoCliente {
    private ValidacaoCliente() {}
    public static String cpf(String valor) {
        String cpf = valor == null ? "" : valor.replaceAll("[.\\-\\s]", "");
        if (!cpf.matches("[0-9]{11}") || cpf.chars().distinct().count() == 1) throw RegraException.invalido("CPF inválido.");
        for (int pos=9; pos<11; pos++) {
            int soma=0;
            for(int i=0;i<pos;i++) soma+=(cpf.charAt(i)-'0')*(pos+1-i);
            int digito=(soma*10)%11;
            if(digito==10) digito=0;
            if(digito!=cpf.charAt(pos)-'0') throw RegraException.invalido("CPF inválido.");
        }
        return cpf;
    }
    public static void senha(String senha, String confirmacao) {
        if(senha == null || senha.length()<8 || senha.getBytes(StandardCharsets.UTF_8).length>72
           || !senha.matches("(?s).*[A-Z].*") || !senha.matches("(?s).*[a-z].*")
           || !senha.matches("(?s).*[^a-zA-Z0-9\\s].*"))
            throw RegraException.invalido("Senha deve ter pelo menos 8 caracteres, maiúscula, minúscula e caractere especial (máximo 72 bytes).");
        if(!senha.equals(confirmacao)) throw RegraException.invalido("A confirmação de senha não confere.");
    }
}
