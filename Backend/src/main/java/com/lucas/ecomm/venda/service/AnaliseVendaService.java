package com.lucas.ecomm.venda.service;
import com.lucas.ecomm.venda.repository.AnaliseVendaRepository;
import com.lucas.ecomm.catalogo.repository.CategoriaRepository;
import com.lucas.ecomm.shared.api.RegraException;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service @Transactional(readOnly=true)
public class AnaliseVendaService {
    private final AnaliseVendaRepository vendas; private final CategoriaRepository categorias;
    public AnaliseVendaService(AnaliseVendaRepository vendas,CategoriaRepository categorias) { this.vendas=vendas; this.categorias=categorias; }
    public record Serie(UUID categoriaId,String nome,List<BigDecimal> valores) {}
    public record Resultado(LocalDate inicio,LocalDate fim,List<String> meses,List<Serie> series,String criterio) {}
    public Resultado consultar(LocalDate inicio,LocalDate fim,List<UUID> ids) {
        if(inicio==null||fim==null) throw RegraException.invalido("Informe as datas inicial e final.");
        if(fim.isBefore(inicio)) throw RegraException.invalido("A data final não pode ser anterior à inicial.");
        if(fim.isBefore(inicio.plusMonths(1).minusDays(1))||fim.isAfter(inicio.plusMonths(24).minusDays(1)))
            throw RegraException.invalido("Selecione um intervalo de 1 a 24 meses.");
        if(ids==null||ids.isEmpty()||ids.contains(null)||new HashSet<>(ids).size()!=ids.size())
            throw RegraException.invalido("Selecione ao menos uma categoria, sem repetições.");
        var cats=categorias.findAllById(ids);
        if(cats.size()!=ids.size()) throw RegraException.inexistente("Categoria não encontrada.");
        var meses=new ArrayList<YearMonth>();
        for(var m=YearMonth.from(inicio);!m.isAfter(YearMonth.from(fim));m=m.plusMonths(1)) meses.add(m);
        var valores=new HashMap<UUID,Map<YearMonth,BigDecimal>>();
        for(var v:vendas.mensal(inicio,fim,ids)) valores.computeIfAbsent(v.categoriaId(),k->new HashMap<>()).put(v.mes(),v.total());
        return new Resultado(inicio,fim,meses.stream().map(YearMonth::toString).toList(),cats.stream()
            .sorted(Comparator.comparing(c->c.getNome())).map(c->new Serie(c.getId(),c.getNome(),meses.stream()
                .map(m->valores.getOrDefault(c.getId(),Map.of()).getOrDefault(m,new BigDecimal("0.00"))).toList())).toList(),
            "Valor bruto dos itens de pedidos aprovados, em transporte ou entregues; sem frete. Categorias podem se sobrepor e não devem ser somadas como receita líquida.");
    }
    public String exportar(LocalDate inicio,LocalDate fim,List<UUID> ids) {
        var r=consultar(inicio,fim,ids); var csv=new StringBuilder("\uFEFFInício;Fim;Mês;Categoria;Valor (R$)\r\n");
        for(var s:r.series()) for(int n=0;n<r.meses().size();n++) csv.append(inicio).append(';').append(fim).append(';')
            .append(r.meses().get(n)).append(';').append(celula(s.nome())).append(';')
            .append(s.valores().get(n).toPlainString().replace('.',',')).append("\r\n");
        return csv.toString();
    }
    private String celula(String value) {
        String safe=value.matches("^[=+@\\-\\t\\r].*")?"'"+value:value;
        return "\""+safe.replace("\"","\"\"")+"\"";
    }
}
