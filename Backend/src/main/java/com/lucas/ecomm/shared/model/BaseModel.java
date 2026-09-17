package com.lucas.ecomm.shared.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@MappedSuperclass
public abstract class BaseModel {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @Column(nullable = false, updatable = false)
    private Instant criadoEm;
    @Column(nullable = false)
    private Instant atualizadoEm;
    @Version private long versao;
    @PrePersist protected void criar() { criadoEm = atualizadoEm = Instant.now(); }
    @PreUpdate protected void atualizar() { atualizadoEm = Instant.now(); }
    public UUID getId() { return id; }
    public Instant getCriadoEm() { return criadoEm; }
    public Instant getAtualizadoEm() { return atualizadoEm; }
    public long getVersao() { return versao; }
}
