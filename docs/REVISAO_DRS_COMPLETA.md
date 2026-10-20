# Revisão do DRS — Tech Store

Atualização de 17/10/2026: o texto abaixo preserva a revisão histórica de setembro. Correções posteriores, critérios confirmados e a situação atual estão em [Revisão técnica de 17/10](REVISAO_CODIGO_2026-10-17.md), inclusive a implementação de RF0013/RN0016 e a incorporação opcional de endereço/cartão na compra.

Referência: documento de requisitos fornecido, versão 2 confirmada pelo responsável. Leitura integral realizada nesta etapa. O domínio original de livros foi adaptado para hardware, preservando carrinho, clientes, pagamento, pós-venda, estoque e análise. Os arquivos Word não foram alterados. Esta revisão não equivale a uma declaração de atendimento total.

Legenda: **implementado** = comportamento disponível no projeto; **parcial** = falta alguma possibilidade descrita; **pendente** = ainda não implementado. Evidências automatizadas específicas constam da matriz de cobertura e das suítes Cypress/JUnit. Implementação não significa cobertura exaustiva de todas as combinações.

## Requisitos funcionais

| ID | Situação | Resultado e limite |
| --- | --- | --- |
| RF0011 | Parcial | Cadastro de hardware com UUID único; falta identificador comercial único (SKU/código de barras) e atributos completos adaptados |
| RF0012 | Implementado | Inativação persistida pelo editor; exige justificativa e categoria da operação |
| RF0013 | Pendente | Não existe inativação automática. A condição sobre ausência de vendas e valor inferior a parâmetro precisa ser esclarecida; não foi inventado um limite |
| RF0014 | Implementado | Editor atual atualiza produto, categorias, preço e dados básicos pela API |
| RF0015 | Parcial | Busca textual na loja/admin por nome, marca, categoria e valores exibidos; não há filtros estruturados isolados/combinados para todos os identificadores |
| RF0016 | Implementado | Reativação persistida com justificativa e categoria |
| RF0021 | Implementado | Cadastro transacional de cliente e endereços; após cadastrar, abre ficha administrativa, não cria outro perfil selecionável |
| RF0022 | Implementado | Atualização real de dados pessoais |
| RF0023 | Implementado | Inativa sem excluir registro e histórico; reativação adicional disponível |
| RF0024 | Implementado | Filtros individuais/combinados dos campos de identificação, listagem e consulta |
| RF0025 | Implementado | Ficha consulta pedidos, itens, pagamentos, cupons, trocas, atividades e notificações persistidos |
| RF0026 | Implementado | Múltiplos endereços identificados por nome curto único por cliente |
| RF0027 | Implementado | Múltiplos cartões e preferência única |
| RF0028 | Implementado | Alteração independente de senha, sem login |
| RF0031 | Implementado | Carrinho individual persistente com inclusão, consulta, alteração e remoção |
| RF0032 | Implementado | Quantidade na adição e no carrinho; reserva própria considerada |
| RF0033 | Implementado | Compra real a partir do carrinho, com transação e idempotência |
| RF0034 | Implementado no escopo local | Frete parametrizado por destino/quantidade; simulação, não cotação comercial |
| RF0035 | Parcial | Seleção e novo endereço funcionam; novo endereço sempre é incorporado à conta, sem opção de uso exclusivo nesta compra |
| RF0036 | Parcial | Seleção/novo cartão e cupons funcionam; cartão novo sempre é associado à conta, sem opção de uso exclusivo nesta compra |
| RF0037 | Implementado | Combinação de cupons e múltiplos cartões com soma em centavos |
| RF0038 | Implementado | Criação grava EM PROCESSAMENTO; processamento simulado é chamada posterior, separada |
| RF0039 | Implementado | Administrador envia compra aprovada para EM TRANSPORTE; alias EM TRÂNSITO compatível |
| RF0040 | Implementado | Administrador confirma ENTREGUE; cliente também pode confirmar recebimento |
| RF0041 | Implementado | Cliente solicita troca de item comprado/entregue; quantidade disponível protegida |
| RF0042 | Implementado com correspondência de estados | Admin autoriza solicitação; estado DRS TROCA AUTORIZADA. Compra integral assume esse estado quando todas as solicitações são autorizadas |
| RF0043 | Implementado | Gestão de trocas consulta solicitações persistidas de todos os clientes |
| RF0044 | Implementado | Recebimento exige escolha explícita de reentrada; quantidade adicionada uma única vez |
| RF0045 | Implementado | Cupom individual gerado ao receber, antes da etapa adicional de processamento |
| RF0051 | Implementado | Formulário de entrada em estoque de produto existente, fornecedor e histórico persistentes |
| RF0052 | Implementado para entradas | Entrada recalcula preço: maior custo conhecido + margem do grupo, arredondado para cima em centavos |
| RF0053 | Implementado | Aprovação local baixa unidades uma vez; pendência/recusa não baixa estoque físico |
| RF0054 | Implementado | Reentrada vinculada à troca e à escolha do administrador, com auditoria |
| RF0055 | Implementado | Histórico mensal calculado no backend por período/categorias |
| RF0056 | Implementado | Datas obrigatórias, fim não anterior ao início, erro visível e limites de período |
| RF0057 | Implementado | Uma ou várias categorias comparáveis, inclusive sem vendas |
| RF0058 | Implementado | Exportação dos mesmos dados/filtros em CSV UTF-8 com BOM, separador ponto e vírgula e decimal brasileiro, aberto como planilha |

## Regras de negócio

| ID | Situação | Aplicação e limite |
| --- | --- | --- |
| RN0011 | Parcial/adaptação | Nome, marca, descrição, categorias e grupo são obrigatórios; faltam atributos físicos, código de barras e especificações estruturadas. Autor/ISBN/editora/páginas não fazem sentido para hardware e não foram copiados |
| RN0012 | Implementado | Produto N:N categorias; todas as categorias de cada item são preservadas no histórico da compra |
| RN0013 | Implementado | Grupo obrigatório, validação de margem no cadastro/edição e cálculo automático na entrada |
| RN0014 | Parcial | Preço abaixo da margem é bloqueado; não existe a exceção com autorização documentada de gerente |
| RN0015 | Implementado para novas operações | Inativação manual exige justificativa e categoria, persistidas e auditadas; registros anteriores não recebem motivos inventados |
| RN0016 | Pendente | Depende da política de inativação automática; categoria FORA DE MERCADO não é atribuída sem executar essa política |
| RN0017 | Implementado para novas operações | Reativação exige justificativa e categoria. Cadastro inicial ativo é criação, não reativação |
| RN0021 | Implementado | Pelo menos um endereço de cobrança preservado |
| RN0022 | Implementado | Pelo menos um endereço de entrega preservado |
| RN0023 | Implementado | Todos os campos obrigatórios de endereço; observações opcionais |
| RN0024 | Implementado com adaptação segura | Número/titular/bandeira/CVV validados na entrada; PAN/CVV não ficam no banco. Identificação HMAC local e últimos quatro dígitos, sem token de adquirente |
| RN0025 | Implementado | Bandeira deve existir no domínio |
| RN0026 | Implementado | Dados pessoais, senha e endereço residencial obrigatórios; CPF válido/único e e-mail válido/único |
| RN0027 | Implementado com premissa | Ranking = quantidade de compras aprovadas/em transporte/entregues; fórmula adotada porque não há cálculo detalhado no requisito |
| RN0028 | Implementado no escopo local | Baixa apenas depois da aprovação simulada; rejeição libera reserva |
| RN0031 | Implementado | Quantidade disponível validada com locks de estoque |
| RN0032 | Implementado | Carrinho sincroniza disponibilidade e apresenta avisos/remoções; não há teste de carga concorrente amplo |
| RN0033 | Implementado | Até um promocional por compra; frontend substitui seleção e backend rejeita repetição |
| RN0034 | Implementado | Múltiplos cartões, mínimo de R$ 10 por cartão |
| RN0035 | Implementado | Cupons utilizados antes dos cartões; exceção para saldo inferior em um único cartão |
| RN0036 | Implementado | Excedente vira crédito após aprovação; cupons desnecessários rejeitados |
| RN0037 | Parcial no momento da validação | Cupons são validados no orçamento/finalização e cartões são autorizados pelo processador local. O processamento posterior ainda não revalida a expiração dos cupons, como pede a sequência literal do requisito; autorização externa é intencionalmente simulada |
| RN0038 | Implementado | APROVADA ou REPROVADA conforme retorno do processador local |
| RN0039 | Implementado | Envio administrativo → EM TRANSPORTE |
| RN0040 | Implementado | Confirmação administrativa → ENTREGUE |
| RN0041 | Implementado com correspondência | Solicitação com estado DRS EM TROCA; solicitação integral altera também compra para EM TROCA |
| RN0042 | Implementado com correspondência | Recebimento → estado DRS TROCADO; compra integral recebida → TROCADO |
| RN0043 | Implementado | Só compra entregue origina troca. EM TROCA conserva origem entregue e não permite ultrapassar quantidade comprada; autorização não reabre unidades já solicitadas |
| RN0044 | Implementado no carrinho; parcial na transferência ao pedido | Carrinho tem prazo parametrizável, renovação na última inclusão/aumento, aviso final de cinco minutos e liberação ao expirar. Ao finalizar, o pedido recebe novo prazo contado da finalização; falta alinhar essa transferência à interpretação literal de contagem desde a última inclusão |
| RN0045 | Implementado | Liberação retira integralmente as unidades do produto daquele carrinho |
| RN0046 | Implementado | Autorização gera notificação persistida, consultável na conta; não depende de popup transitório |
| RN0050 | Implementado nas entradas | Produto, quantidade, custo, fornecedor e data obrigatórios. Estoque inicial/ajuste legado do editor ainda não corresponde a uma entrada detalhada |
| RN0051 | Implementado nas entradas | Preço único pelo maior custo registrado + margem; edição não pode diminuir custo abaixo das entradas existentes |
| RN0061 | Implementado | Entrada de zero/quantidade negativa é rejeitada |
| RN0062 | Implementado | Entrada exige custo positivo; cadastro básico ainda permite custo zero, distinto de entrada |
| RN0071 | Implementado | Agregação mensal dos itens de compras com status elegível, em horário America/Sao_Paulo |
| RN0072 | Implementado | Intervalo civil inclusivo de 1 a 24 meses: fim entre início + 1 mês − 1 dia e início + 24 meses − 1 dia. Períodos não alinhados podem ter meses parciais |
| RN0073 | Implementado | Todos os meses do intervalo têm ponto, inclusive valor zero |
| RN0074 | Implementado | APROVADA/EM TRANSPORTE/EM TRÂNSITO/ENTREGUE; alias PAGAMENTO REALIZADO elegível. REPROVADA, CANCELADO, aberto, processamento e compra integral em troca não entram |

## Requisitos não funcionais

| ID | Situação | Aplicação e limite |
| --- | --- | --- |
| RNF0011 | Parcial | Meta de todas as consultas ≤ 1s não comprovada; medição anterior fria de 1492ms. Índices/agregado SQL melhoram análise, mas não são garantia de SLA |
| RNF0012 | Parcial no sistema inteiro | Operações implementadas auditam data/hora, contexto e antes/depois. Sem login o contexto não comprova identidade. Migrações/fixtures são preparações explícitas; alguns históricos legados não contêm todas as transições de negócio |
| RNF0021 | Implementado | UUID/PK único do produto |
| RNF0013 | Implementado para domínios usados | Flyway prepara bandeiras, categorias e grupos; script local prepara fornecedor. Domínios de livro não são introduzidos artificialmente |
| RNF0031 | Implementado | Senha forte nas duas camadas |
| RNF0032 | Implementado | Confirmação coincidente |
| RNF0033 | Implementado por hash | BCrypt com salt/custo 12; senha não retornada nem auditada |
| RNF0034 | Implementado | Manutenção independente de endereço |
| RNF0035 | Implementado | UUID/PK único do cliente |
| RNF0042 | Implementado | Itens expirados/motivos visíveis, compra vazia bloqueada e reinclusão disponível |
| RNF0043 | Implementado | Linhas distintas, X mês/ano, Y reais e categorias identificadas |
| RNF0044 — Análise | Implementado | Eixo em moeda brasileira e escala automática |
| RNF0045 | Implementado | Legenda inferior com cores/nomes |
| RNF0046 | Implementado | Tooltip com valor exato; tabela acessível para consulta/exportação |
| RNF0044 — IA | Pendente intencional | ID repetido no documento, separado aqui por grupo. Chatbot mantém conversa de protótipo. Llama/versão/integração/treinamento/feedback ainda não implementados, conforme orientação |
| RNF0064 | Implementado nas entradas | Data obrigatória e não futura; datas padrão dos formulários são locais, não UTC |

## Decisões de interpretação e persistência

- Não há autenticação nem pagamento externo. Os clientes fictícios existem no PostgreSQL, mas apenas Lucas Paulino e Admin aparecem como perfis utilizáveis; cadastro novo abre consulta administrativa. Isso não é uma barreira de autorização da API.
- Tela de troca conserva as etapas existentes: TROCA SOLICITADA → TROCA ACEITA/NEGADA → ITEM ENVIADO → ITEM RECEBIDO → TROCA PROCESSADA. O campo `statusDrs` registra EM TROCA → TROCA AUTORIZADA → TROCADO. ITEM RECEBIDO já gera crédito; TROCA PROCESSADA apenas encerra acompanhamento. Negativa libera a quantidade para eventual nova solicitação.
- Retorno de estoque é escolha explícita. Crédito corresponde ao preço unitário histórico × unidades recebidas, sem frete. Essa política inicial não adiciona estorno financeiro real.
- Análise usa valor bruto histórico dos itens, sem frete. Não representa receita líquida descontada/devolvida. Produto em duas categorias conta em ambas para comparação; somar linhas pode duplicar valores. O KPI de receita aprovada usa total menos desconto, separado dessa comparação.
- Migração V5 preserva categorias conhecidas das vendas antigas no momento da migração; não é possível recuperar categorias anteriores que nunca foram registradas. Novas vendas guardam o snapshot ao finalizar.
- V5–V7 acrescentam relações, notificações, entrada/fornecedor e justificativas, sem apagar registros ou editar migrações anteriores. PKs/FKs, unicidade do cupom de troca e locks evitam crédito/estoque duplicados.
- Histórico fictício administrativo: 45 pedidos de outubro/2025 a setembro/2026, quatro clientes de consulta e quatro categorias, com meses zerados para teste. UUIDs estáveis e execução opt-in; reexecução não desloca datas nem sobrescreve pedidos. Não baixa de novo estoque de vendas passadas.
- A fixture antiga de troca processada do Lucas conserva a compra como ENTREGUE, pois foi preparada antes da implementação do pós-venda e não é sobrescrita. É um limite da massa histórica, não evidência de RN0042. Novas trocas integrais recebidas são testadas como TROCADO; corrigir uma massa legada alterada exige revisão explícita, não reexecutar vendas passadas.
- Ajustes quantitativos diretos pelo editor legado continuam auditados, mas não substituem o registro de entrada com fornecedor/data; a distinção precisa ser mantida ao evoluir o estoque.

## Próximos ajustes necessários para atendimento integral

1. Esclarecer parâmetro/critério de inativação automática e implementar RF0013/RN0016.
2. Completar atributos e identidade comercial de hardware (RN0011/RF0011), com mapeamento aprovado do domínio original.
3. Filtros completos de identificação de produtos e exceção autorizada de margem (RF0015/RN0014).
4. Uso pontual de novo cartão/endereço sem incorporar à conta (RF0035/RF0036).
5. Evoluir controle/auditoria de estoque inicial/ajustes e medir consultas sob carga (RN0050/RNF0012/RNF0011).
6. Integrar Llama apenas quando solicitado; versão e estratégia de personalização ainda pendentes.
7. Revalidar cupons no processamento posterior (RN0037) e esclarecer/preservar a origem do prazo da reserva transferida ao pedido (RN0044).
8. Tratar parâmetros obrigatórios ausentes da análise como 400, ampliar casos negativos Cypress de Cliente e usar os filtros por cliente já existentes nas consultas de pedidos/trocas da View.

## Complemento da revisão — 18/09/2026

O núcleo de Cliente está integrado ao PostgreSQL: cadastro, listagem, consulta, edição, inativação e reativação, endereços e cartões. Não foi identificado defeito funcional nesses fluxos pelos testes executados. Isso não equivale a cobertura exaustiva de todos os campos e combinações previstos no documento.

### Pontos adicionais localizados no código

- **Cupons após finalizar:** `PedidoService.selecionarCupons` verifica uso/validade no orçamento e na finalização; `processar` autoriza pagamentos sem repetir a verificação de expiração. Há uma lacuna temporal se um cupom expirar entre as duas chamadas. Por isso RN0037 foi reclassificada como parcial.
- **Origem da reserva do pedido:** `PedidoService.finalizar` define `expiraEm = Instant.now() + carrinho.prazo()`. O carrinho conta corretamente desde a última inclusão/aumento, mas o pedido ganha uma janela nova. A continuidade do prazo original precisa de alinhamento com RN0044; não foi alterada nesta revisão.
- **Erro HTTP da análise:** GET `/api/analises/vendas` sem parâmetros obrigatórios foi consultado e retornou 500. `AnaliseVendaController` exige os parâmetros; falta tratamento específico de `MissingServletRequestParameterException` no `ApiExceptionHandler` para responder 400. Não é falha do CRUD de Cliente.
- **Payload das telas de cliente:** `DemoContext` carrega todos os pedidos/trocas e filtra na View. `ConsultaVendaController` já aceita `clienteId`, portanto é possível reduzir dados desnecessários e consultas sem recriar endpoints. A ausência de login continua sendo uma decisão explícita de escopo, não garantia de autorização.
- **Cobertura UI não exaustiva:** os cenários atuais verificam os fluxos principais, CPF, senha, duplicidade, finalidades de endereço e cartões. Não há negativos UI individualizados para todos os campos de endereço, nascimento futuro, DDD/telefone inválidos e duplicidade durante edição, nem cenário de cada filtro isolado. Bandeira inexistente é negativa em JUnit e limitada ao domínio real na UI. Essa distinção importa na avaliação que exige testes de interface.

### Verificação somente de leitura do banco normal

Schema `public` com migração V8 aplicada. A inspeção encontrou 23 PKs, 29 FKs, 16 restrições UNIQUE e 29 CHECKs, além de índices únicos parciais/funcionais. Não havia constraints não validadas, CPF/e-mail duplicados, clientes sem finalidades obrigatórias de endereço ou clientes com cartões sem preferência única. As senhas dos clientes inspecionados estavam no padrão BCrypt de custo 12. A tabela de cartões não contém colunas PAN/número completo/CVV.

Esses resultados descrevem o estado inspecionado, não prometem ausência de todos os defeitos ou performance sob carga. As consultas de auditoria não alteraram registros. Os testes E2E geram massa apenas no schema isolado `techstore_e2e`; os testes transacionais do backend usam `techstore_integration`.

Roteiro com falas, comandos Cypress e referências verificadas ao código: [ROTEIRO_APRESENTACAO_CLIENTE.md](C:/Users/Lucas/Desktop/LES/Ecom/docs/ROTEIRO_APRESENTACAO_CLIENTE.md).

### Resultados dos testes nesta revisão

- **Cypress, 18/09/2026, Edge:** 27/27 aprovados nos 6 arquivos, zero falhas/pulados, execução concluída com código de saída 0. Inclui os 11 testes de Cliente e 1 do histórico do Lucas. Relatórios XML e vídeos em `Frontend/cypress/results/revisao-2026-09-18-edge`.
- **Backend, 17/09/2026:** 35/35 testes aprovados, zero falhas/erros/pulados, com `RUN_DB_TESTS=true` e persistência real no schema de integração. Relatórios atuais em `Backend/target/surefire-reports/TEST-com.lucas.ecomm.*.xml`.
- **Frontend, 17/09/2026:** 13/13 testes Vitest aprovados, lint e build concluídos. O build sinaliza bundle acima de 500 kB; não é falha de compilação nem comprovação de desempenho.
- A execução completa anterior no Electron teve 26/27 aprovados, com falha na compra que prepara a troca. Repetição isolada e suíte completa no Edge passaram sem mudar o código. A causa exata dessa falha anterior não foi estabelecida; os dois resultados foram preservados.

Conclusão: **CRUD de Cliente funcional nos fluxos testados; aderência integral do e-commerce ainda não alcançada**. Mapa de implementação e cobertura precisam ser lidos separadamente. A revisão alterou apenas documentação, não código de negócio, schema ou registros do banco normal. Não houve commit/push nesta etapa.
