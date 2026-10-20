# Revisão técnica da Tech Store

Data: 17/10/2026. Referência: requisitos fornecidos no DRS versão 2, adaptados ao comércio de hardware.

## Escopo desta revisão

Foram inspecionados os fontes de frontend e backend, rotas, serviços HTTP, contexto React, DTOs, entidades, repositórios, serviços de negócio, controllers, migrações SQL, configurações e testes. As alterações locais anteriores foram preservadas. Nenhum stylesheet foi alterado nesta revisão.

Continuam fora do escopo: autenticação/autorização de login, integração integral com Llama, cobrança real e integração com transportadoras. A escolha de perfis continua local. Senhas de cadastro continuam validadas e armazenadas como hash, sem introduzir login. A identidade `X-Perfil` serve ao contexto da demonstração e não comprova identidade.

## Problemas corrigidos

| Problema encontrado | Correção | Relação com o DRS |
| --- | --- | --- |
| Consulta de análise sem parâmetros obrigatórios retornava 500 | Resposta 400 com identificação do parâmetro ausente | RF0056; tratamento de entrada inválida |
| Finalizar a compra reiniciava o prazo da reserva | Pedido mantém exatamente a expiração do carrinho | RN0044 |
| Cupom podia expirar depois da finalização e ainda aprovar a compra | Processamento local revalida os cupons antes de aprovar | RN0037/RN0038/RN0028 |
| Alterar um cartão no perfil podia mudar o resultado de um pedido anterior | Autorização simulada usa os dados históricos do pagamento, com compatibilidade para registros legados | RF0036/RN0037; integridade histórica |
| Seleção de troca ficava vazia ao carregar um pedido pela URL | Item selecionado é derivado dos dados carregados | RF0041 |
| Pedido aberto no histórico do administrador seguia para a rota de cliente e podia mostrar 404 | Consulta existente reutilizada em `/admin/pedidos/:orderId`; links preservam o contexto | RF0025; consulta administrativa de pedidos |
| Formulário oferecia unidades já solicitadas para troca | Saldo considera solicitações não negadas; formulário bloqueia nova solicitação sem saldo | RF0041/RN0043 |
| Quantidade selecionada nos detalhes podia ficar maior que o estoque atualizado | Valor enviado acompanha o limite disponível | RF0032/RN0031 |
| Resposta de erro JSON nula ou malformada podia quebrar o tratamento de erro | Camada HTTP normaliza mensagem e campos, mantendo o status original | Tratamento de falhas da API |
| Loja carregava pedidos e trocas de todos os clientes | Consultas usam `clienteId`; administração mantém visão global, com caches separados | RF0025; redução de dados transferidos, sem alegação de autorização |
| Listagem de produtos e pedidos disparava consultas por registro | Estoques, categorias, itens, cupons e pagamentos são carregados em lote | RNF0011; reduz consultas, mas não garante SLA sob qualquer carga |
| Mensagem de expiração não mostrava o prazo configurado | Itens removidos informam o prazo em minutos | RNF0042 |
| Botão do carrinho continuava navegável até a próxima consulta depois de expirar | Relógio local também controla o botão; servidor continua sendo a fonte final de validação | RN0044/RNF0042 |
| Detalhe de pedido cancelado/reprovado anunciava crédito disponível | Mensagem de disponibilidade deixa de aparecer nesses estados | Consistência da consulta; não resolve a pendência financeira abaixo |
| Fluxos de processamento podiam adquirir locks em ordem diferente da finalização | Estoques são bloqueados em ordem de produto antes dos cupons | Integridade transacional; RN0031/RN0028 |
| Auditoria de uso/liberação de cupom e baixa/liberação de estoque não explicitava todos os valores anteriores e posteriores | Logs passam a registrar flags de utilização e quantidades/reservas antes e depois, com vínculo ao pedido | RNF0012 |
| Teste antigo de troca tentava despachar pedido ainda em processamento | Cenário executa a aprovação local antes do despacho | RF0039/RN0038/RN0039 |

Os quatro primeiros defeitos foram reproduzidos por testes de integração antes da correção. Os defeitos de seleção de troca e de quantidade foram reproduzidos por três testes React antes da correção.

## Inativação automática implementada

Para RF0013/RN0016, Lucas confirmou nesta revisão o critério da Tech Store: estoque físico zero e nenhuma venda elegível nos últimos 90 dias. São elegíveis pedidos APROVADA, EM TRANSPORTE/EM TRÂNSITO e ENTREGUE; o alias legado PAGAMENTO REALIZADO também representa pagamento aprovado.

A rotina verifica candidatos, bloqueia o estoque e revalida a condição em uma transação por produto. Registra `ativo=false`, categoria `FORA DE MERCADO`, justificativa e auditoria com contexto de sistema. Produtos repostos e produtos com vendas recentes não são inativados. Reexecução não duplica a mudança nem a auditoria. Uma entrada de estoque posterior não reativa o produto automaticamente: a ativação continua pelo fluxo existente com justificativa e categoria.

| Parâmetro de ambiente | Padrão | Uso |
| --- | --- | --- |
| `CATALOGO_INATIVACAO_DIAS` | 90 | Janela de vendas consideradas |
| `CATALOGO_INATIVACAO_INTERVALO_MS` | 3600000 | Intervalo de uma hora entre verificações |
| `CATALOGO_INATIVACAO_ESPERA_INICIAL_MS` | 60000 | Primeira verificação um minuto após iniciar |

Implementação: `InativacaoProdutoService`, `CatalogoScheduler` e consultas de `ProdutoRepository`. Testes de integração cobrem ausência de vendas, venda recente, venda antiga, reposição entre consulta e execução, categoria e auditoria única. A fórmula de 90 dias é uma decisão confirmada do projeto, não uma fórmula explícita do DRS.

## Situação funcional após a revisão

| Área | Situação e limite |
| --- | --- |
| Cliente — RF0021–RF0028, RN0021–RN0027, RNF0031–RNF0035 | CRUD persistente, inativação lógica, reativação, endereços, cartões, preferencial, senha independente e histórico. Ranking segue o critério já adotado pelo projeto, não uma fórmula definida no DRS. |
| Carrinho — RF0031/RF0032, RN0031/RN0032/RN0044/RN0045, RNF0042 | Persistência, quantidades, disponibilidade, bloqueio, atualização e expiração implementados. A cobertura automatizada não representa uma prova de ausência de problemas sob concorrência irrestrita. |
| Compra — RF0033–RF0038, RN0023–RN0025, RN0033–RN0036 | Endereço/cartão existentes ou novos, incorporação opcional ao perfil, frete, múltiplos cartões, cupons, excedente e pedido EM PROCESSAMENTO implementados. |
| Pagamento e entrega — RF0039/RF0040/RF0053, RN0028/RN0037–RN0040 | Aprovação/recusa locais, liberação/baixa de estoque e transições persistentes. Não há cobrança externa. |
| Trocas — RF0041–RF0045/RF0054, RN0041–RN0043/RN0046 | Solicitação, autorização, despacho, recebimento, reentrada opcional e crédito único. Estados operacionais da UI conservados e correspondência DRS em `statusDrs`. |
| Estoque — RF0051/RF0052, RN0050/RN0051/RN0061/RN0062/RNF0064 | Entrada detalhada com produto, fornecedor, data e custo; maior custo e margem. Editor legado ainda permite estoque inicial/ajuste quantitativo direto. |
| Análise — RF0055–RF0058, RN0071–RN0074, RNF0043–RNF0046 | Período/categorias, meses zerados, estados elegíveis, linhas, BRL, tooltip, legenda e CSV implementados. A interpretação dos meses e o valor bruto dos itens são critérios documentados do projeto. |
| Catálogo — RF0011–RF0016, RN0012/RN0013/RN0015–RN0017 | Cadastro/edição, múltiplas categorias, margem mínima, situação manual e automática implementados. Há pendências específicas abaixo. |

## Pendências que não devem ser confundidas com funcionalidades concluídas

1. **RN0011 / RF0011:** formalizar o mapeamento completo dos atributos obrigatórios de livro para hardware. Marca/nome/descrição/categorias/grupo existem; dimensões, peso, código de barras e especificações estruturadas não possuem implementação completa. Não foram inventados ISBN, autor ou editora para hardware.
2. **RF0015:** catálogo e administração possuem busca textual, mas não filtros individuais/combinados para todos os identificadores do produto. Não declarar aderência integral deste RF.
3. **RN0014:** preço abaixo da margem é bloqueado; falta o fluxo de exceção com autorização explícita do gerente de vendas. Não simular uma autorização por um booleano sem regra de responsabilidade definida.
4. **RN0050/RNF0012:** ajustes quantitativos do editor legado são auditados, mas não equivalem a uma entrada detalhada com fornecedor e data. Sua evolução exige alinhar o fluxo do editor à movimentação de estoque.
5. **RNF0011:** testes locais medem consultas específicas e há testes de limite de SELECTs; não foi executado ensaio de carga que comprove todas as consultas em até um segundo em qualquer condição.
6. **RN0036 e cancelamento/recusa:** o crédito excedente é emitido na finalização, conforme o fluxo de demonstração. É necessário definir o tratamento do crédito já gasto em outra compra antes de cancelar/reprovar a compra de origem; o DRS não detalha esse encadeamento. Não tratar esta versão como um sistema financeiro de produção.
7. **Ambiguidades do DRS:** RNF0044 aparece para gráfico e IA; fórmulas de frete/ranking e contagem de meses não são detalhadas. Critérios do projeto devem ser apresentados como decisões da Tech Store, não como transcrições do documento.

## Banco e preservação

Inspeção do schema `public`: 7 clientes, 8 produtos, 49 pedidos; 23 PKs, 29 FKs, 16 restrições UNIQUE e 29 CHECKs, sem constraints não validadas. Na inspeção inicial, `public` estava em V8. A inicialização normal aplicou pelo Flyway a V9 já existente no projeto, adicionando/preenchendo a validade histórica do cartão no pagamento. Não houve exclusão ou recriação de registros. Antes de iniciar foram confirmadas ausência de reservas ativas, de pedidos pendentes com prazo e de produtos ativos sem estoque.

Os testes usam `techstore_integration` (transações revertidas) e `techstore_e2e` (massa própria persistente). Não foi apagado/recriado o banco normal, nem alteradas migrações antigas. Nenhum novo campo guarda número completo ou CVV de cartão.

API normal verificada através do frontend: GET de produtos retornou 8 registros em 539 ms; GET de pedidos retornou 49 registros em 519 ms; saúde UP. São medições pontuais locais, não um ensaio de carga. Aplicação normal disponível em `http://localhost:5173`, backend em `http://127.0.0.1:8080`.

## Validação desta rodada

- Backend: 51 testes aprovados, zero falhas/erros/ignorados, com PostgreSQL real no schema de integração. Inclui limites de SELECTs do catálogo e da lista de pedidos.
- React: 29 testes aprovados; lint, build e tipagem dos testes Cypress aprovados. Permanece o aviso de bundle acima de 500 kB, que não é erro de compilação.
- Cypress: rodada completa com 64/64 testes aprovados em 31 arquivos, zero falhas/pulados. XMLs em `Frontend/cypress/results/revisao-20261017`. Após os últimos ajustes, a repetição na API final aprovou 13/13 em cinco specs: compra completa, consultas/auditoria, administração, trocas e interface. Relatórios em `Frontend/cypress/results/revisao-final-20261017`. Os totais das duas rodadas não representam casos únicos e não devem ser somados como cobertura diferente.
- Conferência visual: capturas da finalização, pedido, catálogo desktop (inclusive 1280 px), carrinho expirado e análise preservam o design. Repetições de painéis sticky em algumas capturas de página inteira são artefatos de composição da captura, não elementos duplicados no JSX.
- Repetição visual administrativa adicional: 5/5 aprovados; consulta de pedido sem overflow e captura `admin-pedido-detalhe` conferida. Evidências em `Frontend/cypress/results/revisao-admin-20261017` e `Frontend/cypress/screenshots/revisao-admin-20261017`.

Não houve commit, push, publicação ou alteração dos documentos Word nesta revisão.

Ao concluir, os servidores e2e usados nesta rodada foram encerrados para liberar 8081/5174. Os servidores normais em 8080/5173 permaneceram em execução; não iniciar outra instância nas mesmas portas sem conferir os processos.
