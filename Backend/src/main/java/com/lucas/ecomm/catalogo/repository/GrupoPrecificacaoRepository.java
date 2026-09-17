package com.lucas.ecomm.catalogo.repository;
import com.lucas.ecomm.catalogo.model.GrupoPrecificacaoModel;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.*;
public interface GrupoPrecificacaoRepository extends JpaRepository<GrupoPrecificacaoModel, UUID> {
}
