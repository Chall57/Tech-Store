package com.lucas.ecomm.shared.api;
import org.springframework.http.HttpStatus;
public class RegraException extends RuntimeException {
    private final HttpStatus status;
    public RegraException(HttpStatus status, String mensagem) { super(mensagem); this.status = status; }
    public HttpStatus getStatus() { return status; }
    public static RegraException invalido(String texto) { return new RegraException(HttpStatus.BAD_REQUEST, texto); }
    public static RegraException inexistente(String texto) { return new RegraException(HttpStatus.NOT_FOUND, texto); }
    public static RegraException conflito(String texto) { return new RegraException(HttpStatus.CONFLICT, texto); }
}
