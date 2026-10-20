# Cobertura de requisitos — Cliente, compra e administração persistentes

Complemento atual: [Revisão técnica de 17/10/2026](REVISAO_CODIGO_2026-10-17.md). Esta matriz conserva evidências de rodadas anteriores; os resultados e novos testes da revisão atual são discriminados no complemento.

Referência: requisitos fornecidos e versão atual confirmada pelo responsável. Esta matriz distingue implementação, evidência automatizada e limites. Não declara que todos os módulos do e-commerce estejam concluídos.

## Requisitos funcionais de Cliente

| Requisito | Implementação | Evidência automatizada |
| --- | --- | --- |
| RF0021 — cadastrar cliente | Cadastro transacional com dados pessoais, hash de senha e endereços iniciais; resposta 201; nenhuma gravação parcial | Cypress `clientes.cy.ts`: cadastro/CRUD, campos obrigatórios, duplicidades e cadastro atômico; JUnit `ClienteIntegrationTests` |
| RF0022 — alterar cliente | PUT de dados pessoais; confirmação após resposta; consulta e recarga verificam persistência | Cypress: cadastro/CRUD; JUnit: atualizar/consultar/inativar/reativar |
| RF0023 — inativar cliente | PATCH preserva o registro e seus vínculos; reativação adicional solicitada; não existe DELETE físico de Cliente | Cypress: cadastro/CRUD com recarga; JUnit verifica que a linha continua no banco |
| RF0024 — consultar clientes | Listagem, detalhe e filtros por todos os campos de identificação, isolados ou combinados; CPF formatado normalizado | Cypress: filtros isolados/combinados; JUnit: filtros e CPF formatado. As demais combinações de campos usam o mesmo mecanismo, mas não são todas enumeradas na suíte |
| RF0025 — consultar transações na ficha | Pedidos, itens, pagamentos, cupons e trocas persistidos; cupons aplicados e divisão de cartões no detalhe do pedido; histórico resumido de atividades | Cypress: ficha vazia, cupom vinculado e `perfil-lucas.cy.ts` com histórico não vazio; JUnit: consulta segura de atividades |
| RF0026 — múltiplos endereços | Cadastro, edição e remoção independente, nome curto único por cliente e finalidades distintas | Cypress: endereço adicional/edição/remoção; JUnit: propriedade e proteção do último endereço |
| RF0027 — múltiplos cartões/preferência | Cadastro, edição, exclusão e preferência única; exclusão do preferencial elege outro | Cypress: dois cartões, troca de preferência, duplicidade e exclusão; JUnit: persistência segura/bandeira |
| RF0028 — alteração independente de senha | PATCH específico; sem alterar os demais dados e sem exigir login | Cypress: confirmação inválida e alteração independente; JUnit: novo hash confere com a nova senha |

## Regras de negócio

| Regra | Aplicação e testes | Limite de evidência |
| --- | --- | --- |
| RN0021 — endereço de cobrança | Obrigatório no conjunto inicial e preservado nas alterações/remoções; Cypress cadastro sem cobrança | Não são enumeradas todas as combinações possíveis de múltiplos endereços |
| RN0022 — endereço de entrega | Mesmo mecanismo de manutenção do mínimo obrigatório | Proteção implementada; suíte percorre o endereço com as três finalidades e a retirada de cobrança no cadastro |
| RN0023 — dados de endereço | Tipo de residência, tipo/logradouro, número, bairro, CEP, cidade, estado e país; observações opcionais; Bean Validation e formulário | Cypress percorre preenchimento/edição completos; não testa cada campo inválido individualmente |
| RN0024 — dados de cartão | Coleta/valida número, titular, bandeira e CVV; também validade; número com Luhn e CVV de 3/4 dígitos | PAN e CVV não são persistidos. HMAC local não substitui token de adquirente e não realiza cobrança |
| RN0025 — bandeira cadastrada | FK e consulta da tabela de domínio; serviço rejeita bandeira inexistente | JUnit verifica bandeira inválida; Cypress usa as opções reais do banco |
| RN0026 — dados obrigatórios do cliente | Gênero, nome, nascimento, CPF, telefone com tipo/DDD/número, e-mail, senha e endereço residencial; CPF válido e unicidade CPF/e-mail | Cypress cobre campos vazios, CPF inválido e duplicidades; backend valida mesmo sem React |
| RN0027 — ranking numérico | Quantidade de pedidos aprovados, em transporte ou entregues, incluindo nomes legados | Fórmula inicial adotada porque não foi especificada uma fórmula detalhada; Cypress do Lucas verifica ranking 3 |
| RN0028 — baixa após aprovação de pagamento | Estoque físico só baixa após aprovação simulada; rejeição libera reservas | JUnit verifica estoque antes/depois, idempotência e recusa; Cypress consulta API após aprovação/recusa. Nenhuma operadora real |

## Compra, carrinho e pagamentos simulados

| Requisito/regra | Implementação | Evidência |
| --- | --- | --- |
| RF0031/RF0032 — carrinho e quantidades | Persistência individual, adição atômica, atualização e remoção; reserva inclui unidades do próprio cliente | Cypress `base-persistente.cy.ts`; JUnit reserva própria e disputa de unidades |
| RF0033 — comprar a partir do carrinho | Orçamento autoritativo, finalização transacional, chave idempotente e snapshots | Cypress `checkout.cy.ts`: catálogo → carrinho → compra → detalhe → recarga; JUnit pedido duplicado e revisão desatualizada |
| RF0034 — frete | Calculado pelo backend a partir de endereço e quantidade; tarifas locais parametrizadas | Cypress exibe total e consulta frete persistido; JUnit confere R$ 16,90 para duas unidades/SP. Sem cotação de transportadora |
| RF0035 — escolher/inserir endereço | Endereços de entrega da conta; formulário salva e seleciona um novo | Cypress compra com novo endereço, consulta dois endereços persistidos e snapshot |
| RF0036/RF0037 — cartões, cupons e combinação | Cartões da conta ou novos; divisão editável em centavos; cupons antes dos cartões | Cypress compra com dois cartões novos + promocional, cupons de troca sem cartões e recálculo; JUnit três cupons combinados com cartão |
| RF0038 — pedido em processamento | POST grava EM PROCESSAMENTO; processamento local separado aprova ou reprova | JUnit consulta status intermediário; Cypress consulta APROVADA/REPROVADA e cancelamento pendente |
| RF0039/RF0040 — transporte e entrega | API/administrador enviam para EM TRANSPORTE; cliente confirma recebimento; aliases legados preservados | Cypress compra → administração → transporte → recebimento → consulta ENTREGUE |
| RN0031/RN0032 — estoque disponível | Bloqueio transacional, validação/ajuste de quantidades e remoção de indisponíveis | JUnit: reserva exclusiva/própria; backend sincroniza carrinho. Não há teste de carga concorrente |
| RN0033 — um promocional | Frontend substitui o promocional selecionado; backend rejeita múltiplos | Cypress seleção e recálculo; JUnit rejeita dois promocionais |
| RN0034/RN0035 — mínimo e saldo | R$ 10/cartão; saldo menor após cupons aceita um cartão; soma exata | Cypress valida mínimo/soma; JUnit mínimo, duplicidade e saldo de R$ 4,90 |
| RN0036 — excedente e cupons necessários | Rejeita cupons redundantes; gera cupom de troca no valor excedente uma vez após aprovação | Cypress dois cupons → crédito R$ 15,10; JUnit crédito/idempotência e redundância |
| RN0037/RN0038 — validação e autorização | IDs próprios, cupons válidos, cartões não vencidos; processador local determinístico APROVADA/REPROVADA | JUnit vínculos/uso anterior e recusa; Cypress recusa simulada. Não valida limite ou situação bancária real |
| RN0044/RN0045 — reserva e liberação | Prazo configurável após adição, contagem regressiva, aviso cinco minutos antes, liberação integral ao remover/expirar | JUnit expira carrinho/pedido sem aguardar prazo; Cypress exibe contagem. Agendador/aviso de cinco minutos não têm teste de interface específico |
| RNF0042 — itens expirados | Exibe itens removidos e motivos; compra vazia/expirada bloqueada | JUnit resumo de remoção/reinclusão; frontend mostra aviso e desabilita finalizar |

Notificações: Cypress usa relógio controlado para verificar fechamento em 4,5 segundos e reinício do prazo após nova adição. Avisos usam sete segundos; erros de formulário não desaparecem silenciosamente.

## Requisitos não funcionais relevantes

| Requisito | Situação |
| --- | --- |
| RNF0011 — consultas em até um segundo | **Parcial.** Medição local anterior: primeira consulta 1492 ms; seguintes 19–45 ms. Faltam otimização de inicialização e testes sob carga; não é uma garantia de SLA |
| RNF0012 — auditoria de alterações | Escritas do módulo e operações auxiliares implementadas registram data/hora, responsável contextual e DTOs antes/depois. JUnit comprova ausência de senha/hash/PAN/CVV. Sem login, o responsável contextual não comprova identidade |
| RNF0013 — registros de domínio | Bandeiras, categorias e grupos por migração Flyway; dados de teste são preparados separadamente e somente por execução explícita |
| RNF0031 — senha forte | Mínimo de 8 caracteres, maiúscula, minúscula e especial; validação nas duas camadas; Cypress/JUnit |
| RNF0032 — confirmação de senha | Conferência no frontend e backend; Cypress valida divergência |
| RNF0033 — senha criptografada/hash | BCrypt com salt e custo 12; JUnit consulta PostgreSQL e verifica hash; API/auditoria não retornam senha |
| RNF0034 — manutenção independente de endereço | API e formulário próprios, sem regravar dados pessoais; Cypress compara dados pessoais após alterar endereço |
| RNF0035 — código único de cliente | UUID gerado pela persistência, PK no PostgreSQL; Cypress verifica cadastro/consulta por ID |

## Organização da automação

- `Frontend/cypress/e2e/testes/clientes.cy.ts`: 11 testes de interface para fluxos principais, validações, erros e recarga.
- `Frontend/cypress/e2e/testes/base-persistente.cy.ts`: 3 testes de produto básico, carrinho individual e cupom vinculado.
- `Frontend/cypress/e2e/testes/perfil-lucas.cy.ts`: 1 teste de preparação idempotente e consulta do histórico completo do Lucas, incluindo valores divididos entre cartões.
- `Frontend/cypress/e2e/testes/checkout.cy.ts`: 6 testes de interface para compra, dois cartões, endereço novo, cupons, crédito excedente, recusa, cancelamento, entrega, validações e timer.
- `Frontend/cypress/e2e/testes/administracao.cy.ts`: 5 testes de perfis, consultas de histórico, análise mensal, filtros, CSV e entradas de estoque.
- `Frontend/cypress/e2e/testes/trocas.cy.ts`: 1 teste de interface do ciclo completo, com notificações, reentrada, crédito único e persistência.
- `Backend/src/test/java/com/lucas/ecomm/cliente/ClienteIntegrationTests.java`: 6 testes transacionais com PostgreSQL real e rollback, incluindo hash, integridade e ausência de exposição de dados sensíveis.
- `Backend/src/test/java/com/lucas/ecomm/venda/CheckoutIntegrationTests.java`: 12 testes transacionais PostgreSQL para compra, cupons, cartões, reserva, idempotência, expiração e cancelamento.
- `Backend/src/test/java/com/lucas/ecomm/venda/AdminIntegrationTests.java`: 8 testes transacionais PostgreSQL para análise, trocas, estoque e justificativas de catálogo.
- `ValidacaoClienteTests`: 6 testes unitários; os 2 testes originais de contexto/status foram preservados.
- `Frontend/src/App.test.tsx`: 10 testes unitários de navegação, ausência de fallback fictício, formulários assíncronos, erros HTTP (inclusive 502/503/504) e chatbot atual.
- `Frontend/src/utils/localDate.test.ts`: 2 testes de datas civis locais.

Os identificadores RF/RN aparecem nos nomes dos testes Cypress. Uma regra associada a um teste não significa cobertura exaustiva de todas as suas combinações. Testes de interface são complementados por verificações no backend/banco para aspectos que não podem ser comprovados pela tela, como armazenamento do hash.

Verificação da etapa anterior, em 16/09/2026: **21 testes Cypress aprovados no Edge**, 26 testes backend aprovados (18 com PostgreSQL real), 7 testes frontend aprovados; lint e build aprovados. A verificação ampliada desta etapa será registrada abaixo. Nenhum stylesheet alterado. O backend rejeita endereço/categoria nulos com HTTP 400. O teste completo da compra consulta persistência, estoque e relacionamentos após operações reais pela interface; autorização financeira permanece simulada localmente.

Após o ajuste visual final, os seis testes de compra passaram novamente; captura conferida e ausência de transbordamento horizontal verificada pelo Cypress.

## Modelo persistente e próximo trabalho

| Entidades | Relações e estado |
| --- | --- |
| Cliente, Endereco, Cartao, Bandeira | Cliente 1:N endereços/cartões; cartão N:1 bandeira; CRUD Cliente e relacionamentos implementados |
| Produto, Categoria, GrupoPrecificacao, Estoque | Produto N:N categoria, N:1 grupo e 1:1 estoque; CRUD mínimo e quantidade persistidos |
| Carrinho, ItemCarrinho | Carrinho único por cliente, itens únicos por produto; quantidade e reserva persistidas; prazo/remoção controlados |
| Pedido, ItemPedido, Pagamento | Pedido N:1 cliente e endereço do próprio cliente; snapshots históricos de item/endereço; pagamentos vinculados a cartões do comprador |
| Cupom, PedidoCupom | Cupom de troca pertence ao cliente; promocional pode ser geral ou individual; associação pedido/cupom conserva valor aplicado |
| Troca, NotificacaoCliente | Vinculada ao item do pedido e ao cupom gerado uma vez no recebimento; ciclo operacional e notificações persistidos |
| Fornecedor, EntradaEstoque | Entrada N:1 fornecedor/produto, com quantidade, custo e data; maior custo histórico protege precificação |
| Auditoria | Registro persistente da alteração; histórico resumido na ficha sem devolver o JSON completo de alterações |

As migrações definem PKs, FKs, campos obrigatórios, unicidade, limites de valores e restrições de propriedade de endereço/cartão/cupom. Não há remoção em cascata do Cliente para seu histórico. Dados históricos podem impedir exclusão de endereço/cartão referenciado, retornando conflito.

Atualização: solicitação/despacho/reentrada/processamento de trocas, notificações persistentes, análise por período/categoria e exportação CSV foram integrados na etapa administrativa abaixo. Cancelamento de pedidos pendentes está implementado; cancelamento após aprovação/estorno não faz parte deste fluxo. Operadoras financeiras e cobrança real não fazem parte do escopo pessoal/local. Chatbot mantém conversa de protótipo; futura IA: Llama, versão indefinida.

## Perfil Lucas para testes

`scripts/preparar-dados-locais.ps1` prepara registros locais explícitos. Lucas Paulino tem dados fictícios, dois endereços em Arujá, dois cartões de teste, quatro pedidos (dois entregues, um em trânsito e um em aberto), cinco pagamentos fictícios, quatro cupons (três disponíveis e um utilizado), duas trocas e atividades históricas.

Cliente/endereço/cartão/produto são preparados pela API. O histórico antigo é inserido por um preparador JDBC transacional restrito ao banco local e a esquemas permitidos; não reexecuta as movimentações de compras históricas. UUIDs estáveis tornam essa preparação idempotente; o script não sobrescreve registros existentes. Novas compras passam pelos endpoints operacionais. Não existe fallback de dados no React. Essas fixtures comprovam leitura/relacionamentos, **não** processamento operacional de trocas.

O esquema `public` é de uso normal, `techstore_e2e` contém a automação Cypress e `techstore_integration` recebe testes JUnit com rollback. Não se deve limpar o banco inteiro para repetir testes.

## Evolução administrativa e leitura integral do DRS

A matriz de todos os RF/RN/RNF, adaptações e pendências está em `REVISAO_DRS_COMPLETA.md`. As verificações finais desta etapa constam do checkpoint; os números acima registram a etapa anterior.

| Requisito/regra | Implementação | Automação |
| --- | --- | --- |
| RF0041–45, RN0041–43, RN0046, RF0054 | Solicitação, decisão, despacho, recebimento, estoque opcional, cupom único e notificação na conta | Cypress `trocas.cy.ts`: compra prévia/fluxo integral/consultas/recarga. JUnit `AdminIntegrationTests`: integral/parcial, negativa, sem reentrada, excessos, pré-condições e idempotência |
| RF0051/RF0052, RN0050/RN0051/RN0061/RN0062, RNF0064 | Entrada com fornecedor/data/custo/quantidade; maior custo + margem; histórico | Cypress `administracao.cy.ts`: fornecedor/entrada/zero/recarga/preço. JUnit: custos distintos, data obrigatória, fornecedor inexistente e proteção do custo na edição |
| RN0015/RN0017 | Justificativa/categoria obrigatórias nas novas mudanças de estado de produto | Cypress `base-persistente.cy.ts`: inativação/reativação persistidas; JUnit: motivos ausentes rejeitados e persistência |
| RF0055–58, RN0071–74 | Agregado mensal por intervalo/categorias, zeros, status elegíveis e CSV dos mesmos filtros | Cypress `administracao.cy.ts`: filtros/erros/exportação. JUnit: exclusão de canceladas/reprovadas/pendentes e fora do intervalo; preservação da categoria histórica |
| RNF0043–46 (Análise) | ECharts existente, reais, mês/ano, legenda inferior, cores distintas, tooltip | Cypress verifica canvas/tabela/ausência de transbordamento; captura conferida. Tooltip e cores não são percorridos exaustivamente |
| Perfis/história fictícia | Só Lucas/Admin nos cartões de perfil; quatro clientes de consulta e 45 compras históricas no PostgreSQL | Cypress prepara duas vezes e consulta ficha/histórico. Reexecução normal também registrou zero compras novas |
| Miniatura | Imagem compartilhada entre loja, carrinho e compra; caminho do cadastro persistido | Cypress compra verifica imagem visível, alt e naturalWidth positiva |
| Data local | Campos civis não usam conversão UTC que podia preencher o dia seguinte | Dois testes unitários e despacho real no Cypress |

`DemoContext`/`MockEditor` são nomes legados de componentes conectados à API, não arquivos descartáveis de mocks. Placeholders de imagem permanecem para cadastros sem imagem. Chatbot é a única funcionalidade mockada mantida deliberadamente; timers são de notificações/revogação de URL de download, não simulação de API.

## Verificação final — 17/09/2026

- **Cypress no Edge: 27/27 aprovados em uma execução completa**, saída 0, seis specs, zero pendentes/ignorados. Relatórios XML persistentes em `Frontend/cypress/results/validacao-concluida`; vídeos e capturas também disponíveis. Não somar arquivos de execuções anteriores a esses resultados.
- **Backend: 34/34 aprovados**, zero falhas/erros/ignorados, incluindo 26 testes de integração transacionais no PostgreSQL com rollback. Apenas relatórios do package atual `com.lucas.ecomm` compõem essa contagem.
- **Frontend: 12/12 aprovados**; lint e build aprovados. Permanece aviso não bloqueante de bundle acima de 500 kB; não é garantia de desempenho.
- Cadastro/edição/inativação de produtos, cartões/endereço, pedidos e ciclo completo de trocas revalidados após proteger abertura/fechamento de formulários contra respostas assíncronas antigas. Nenhum atraso artificial ou exceção ignorada foi usado para obter aprovação.
- API normal: `/actuator/health` UP e `/api/produtos` HTTP 200, diretamente e pelo Vite. Catálogo local contém oito produtos com imagens, categorias e estoque; os 45 pedidos administrativos históricos não foram duplicados.

A aprovação da suíte comprova os cenários enumerados, não atendimento a todos os RF/RN/RNF. As pendências para atendimento integral continuam explicitadas em `REVISAO_DRS_COMPLETA.md`. Nenhum stylesheet ou documento Word original foi alterado.
