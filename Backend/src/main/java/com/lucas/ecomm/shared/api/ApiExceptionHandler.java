package com.lucas.ecomm.shared.api;
import java.time.Instant;
import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class ApiExceptionHandler {
    public record Erro(int status, String message, Map<String,String> fields, Instant timestamp) {}
    private ResponseEntity<Erro> resposta(HttpStatus status, String mensagem, Map<String,String> campos) {
        return ResponseEntity.status(status).body(new Erro(status.value(), mensagem, campos, Instant.now()));
    }
    @ExceptionHandler(RegraException.class)
    ResponseEntity<Erro> regra(RegraException e) { return resposta(e.getStatus(),e.getMessage(),Map.of()); }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<Erro> validacao(MethodArgumentNotValidException e) {
        Map<String,String> campos = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> campos.putIfAbsent(f.getField(),f.getDefaultMessage()));
        return resposta(HttpStatus.BAD_REQUEST,"Confira os dados informados.",campos);
    }
    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    ResponseEntity<Erro> formato(Exception e) { return resposta(HttpStatus.BAD_REQUEST,"Formato de dados ou identificador inválido.",Map.of()); }
    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Erro> integridade(Exception e) { return resposta(HttpStatus.CONFLICT,"Registro duplicado ou vínculo incompatível. Confira CPF, e-mail e registros relacionados.",Map.of()); }
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    ResponseEntity<Erro> rota(Exception e) { return resposta(HttpStatus.NOT_FOUND,"Recurso não encontrado.",Map.of()); }
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    ResponseEntity<Erro> metodo(Exception e) { return resposta(HttpStatus.METHOD_NOT_ALLOWED,"Operação não disponível para este recurso. Clientes são inativados, não excluídos.",Map.of()); }
    @ExceptionHandler(ObjectOptimisticLockingFailureException.class)
    ResponseEntity<Erro> concorrencia(Exception e) { return resposta(HttpStatus.CONFLICT,"O registro foi alterado por outra operação. Atualize a página.",Map.of()); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<Erro> inesperado(Exception e) {
        // Não devolver SQL, stack traces, payloads ou credenciais ao navegador.
        org.slf4j.LoggerFactory.getLogger(getClass()).error("Falha interna: {}", e.getClass().getSimpleName());
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR,"Não foi possível concluir a operação. Tente novamente.",Map.of());
    }
}
