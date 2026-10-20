# Backlog Kanban da Tech Store

Este backlog transforma os requisitos do DRS_LES_2_2026 em cartões executáveis para o projeto Tech Store. Os requisitos do domínio original foram adaptados ao catálogo de hardware sem alterar as regras de cliente, carrinho, venda, pagamento, troca, estoque e análise. O quadro também considera o estado atual da implementação revisada em setembro de 2026.

## Como funciona um Kanban

Kanban é um método visual para acompanhar o fluxo do trabalho. Cada cartão representa uma unidade de trabalho e se move pelas colunas conforme avança. Diferentemente de uma lista comum, o quadro mostra onde há acúmulo, bloqueios e trabalho demais em execução.

### Componentes usados no quadro

| Componente | O que significa | Exemplo na Tech Store |
| --- | --- | --- |
| Épico | Objetivo grande que reúne várias histórias e normalmente atravessa várias entregas | Gestão de Clientes |
| História de usuário | Necessidade que entrega valor perceptível a um ator. Formato recomendado: “Como [ator], quero [objetivo], para [benefício]” | Como administrador, quero inativar um cliente para impedir novas compras sem perder o histórico |
| Tarefa ou task | Trabalho técnico concreto necessário para implementar ou sustentar uma história. Deve ter resultado verificável e ser pequeno o bastante para ser concluído em poucos dias | Criar endpoint `PATCH /api/clientes/{id}/inativar` |
| Subtarefa | Parte menor de uma tarefa; costuma ser uma checklist interna do cartão | Adicionar método no Service; criar teste 409; atualizar mensagem da tela |
| Bug | Comportamento atual que diverge do resultado esperado | Parâmetro obrigatório ausente na análise retorna 500 em vez de 400 |
| Spike | Investigação com tempo limitado para eliminar uma incerteza antes da implementação | Definir com o professor o critério da inativação automática de produtos |
| Dívida técnica | Melhoria estrutural que reduz risco ou custo futuro sem criar, sozinha, uma nova função para o usuário | Consultar pedidos já filtrados por cliente em vez de baixar todos para o frontend |
| Critério de aceite | Condição objetiva para considerar a história correta. Pode ser escrita em Dado/Quando/Então | Dado um cliente com pedidos, quando for inativado, então o registro e os pedidos permanecem consultáveis |
| Definição de pronto | Regras comuns que todo cartão deve satisfazer antes de chegar a Finalizado | Código revisado, migration aplicada, testes aprovados e RF/RN identificados |
| Limite de WIP | Quantidade máxima de cartões simultaneamente em uma coluna. Impede começar tudo e terminar pouco | No máximo 2 cartões em Em andamento e 3 em Testar |
| Swimlane | Faixa horizontal para separar classes de trabalho no mesmo quadro | Funcionalidades, bugs urgentes, dívida técnica e testes |
| Lead time | Tempo entre o pedido do cartão e sua conclusão | Do momento em que a história entra no Backlog até Finalizado |
| Cycle time | Tempo entre o início efetivo e a conclusão | De Em andamento até Finalizado |
| Throughput | Quantidade de cartões finalizados em um período | Histórias concluídas por semana |
| Bloqueio | Condição que impede progresso e deve registrar causa, responsável pela resolução e data | A regra de inativação automática depende de parâmetros do professor |

**Diferença principal:** história explica **por que e para quem** algo existe; tarefa explica **o trabalho técnico que será feito**. “Cadastrar cliente” é uma história. “Criar ClienteRequest com validações” é uma tarefa dessa história.

### Kanban e Scrum não são a mesma coisa

Sprint, Sprint Planning, Product Owner, Scrum Master e Sprint Backlog são componentes do Scrum, não exigências do Kanban. Story points também não são obrigatórios. É possível combinar as duas abordagens em um Scrumban: manter sprints da disciplina e, dentro delas, controlar o fluxo com colunas, limites de WIP, lead time e cycle time. Neste projeto, os tamanhos PP/P/M/G/GG são apenas estimativas relativas; não representam horas.

## Colunas recomendadas

1. **Backlog:** ideia ou requisito ainda não refinado.
2. **A fazer:** cartão entendido, priorizado e sem impedimento para começar.
3. **Em andamento:** trabalho sendo executado. Limite recomendado: 2 cartões.
4. **Testar:** implementação terminada aguardando revisão, Cypress, integração ou homologação. Limite recomendado: 3 cartões.
5. **Bloqueado:** trabalho que depende de decisão ou recurso externo. Se a ferramenta não tiver essa coluna, use uma etiqueta vermelha “Bloqueado”.
6. **Finalizado:** critérios de aceite e definição de pronto cumpridos.

O quadro solicitado pode usar apenas **A fazer, Em andamento, Testar e Finalizado**. Nesse caso, mantenha o Backlog fora do quadro principal e marque bloqueios com etiquetas.

## Campos de cada cartão

Todo cartão deve conter:

- identificador único;
- tipo: épico, história, tarefa, bug, spike ou dívida técnica;
- título com verbo e resultado;
- descrição e benefício esperado;
- RF, RN e RNF relacionados;
- critérios de aceite;
- prioridade: P0 crítica, P1 alta, P2 média ou P3 futura;
- responsável;
- estimativa relativa: PP, P, M, G ou GG;
- dependências e bloqueios;
- evidência de teste esperada.

Não use “Frontend” ou “Backend” como título. Escreva o resultado: “Persistir endereço sem remover a última finalidade obrigatória”. Frontend e backend são etiquetas ou tarefas filhas.

## Épicos do projeto

| ID | Épico | Escopo |
| --- | --- | --- |
| EP01 | Arquitetura e qualidade | MVC, API, persistência, auditoria, erros e desempenho |
| EP02 | Catálogo de hardware | Produtos, categorias, grupos de precificação e ativação |
| EP03 | Gestão de clientes | Cadastro, consulta, alteração, inativação, endereços, cartões, senha e histórico |
| EP04 | Carrinho e venda | Reserva, frete, finalização, cupons, múltiplos cartões e processamento simulado |
| EP05 | Pedidos e pós venda | Consulta, entrega, cancelamento, troca, despacho, recebimento e créditos |
| EP06 | Estoque | Entrada, custo, fornecedor, baixa e reentrada |
| EP07 | Administração e análise | Gestão administrativa, gráfico e exportação |
| EP08 | Recomendação por IA | Chatbot generativo futuro baseado em Llama |

## A fazer

| ID | Tipo | Cartão | Requisitos | Prioridade | Critérios de aceite resumidos |
| --- | --- | --- | --- | --- | --- |
| SPI-CAT-01 | Spike | Definir a regra de inativação automática do produto | RF0013, RN0016 | P1 | Critério de “sem vendas”, valor parametrizado, periodicidade e categoria FORA DE MERCADO documentados e aprovados |
| US-CAT-05 | História | Inativar produtos automaticamente conforme a política definida | RF0013, RN0016 | P1 | Job ou serviço identifica apenas produtos elegíveis, registra motivo/categoria, audita e possui teste automatizado |
| US-CAT-06 | História | Autorizar preço abaixo da margem somente por gerente | RN0014 | P2 | Preço abaixo da margem é bloqueado por padrão; exceção registra responsável, justificativa e auditoria |
| US-CHK-04 | História | Usar novo endereço somente na compra ou salvá-lo na conta | RF0035 | P1 | Checkout oferece as duas opções; uso temporário não cria endereço permanente; endereço escolhido fica no snapshot do pedido |
| US-CHK-05 | História | Usar novo cartão somente na compra ou salvá-lo na conta | RF0036 | P1 | Checkout oferece as duas opções; cartão temporário não aparece na conta; PAN e CVV não são armazenados |
| BUG-PAG-01 | Bug | Revalidar cupom no processamento do pagamento | RN0037 | P1 | Cupom utilizado/expirado entre finalização e processamento reprova a operação e libera os recursos de forma transacional |
| BUG-CAR-01 | Bug | Preservar a origem do prazo da reserva ao gerar o pedido | RN0044 | P1 | Prazo do pedido respeita o último bloqueio do carrinho e não ganha uma janela indevida ao finalizar |
| BUG-ANA-01 | Bug | Retornar HTTP 400 quando faltarem filtros obrigatórios da análise | RF0056, RN0072 | P2 | Ausência ou formato inválido de início, fim ou categorias retorna 400 com mensagem compreensível, nunca 500 |
| QA-CLI-02 | Tarefa | Ampliar os testes Cypress negativos de Cliente | RF0021-RF0028, RN0021-RN0028, RNF0031-RNF0035 | P0 | Cobrir nascimento futuro, DDD/telefone, campos de endereço, duplicidade na edição, bandeira inválida e cada filtro relevante pela interface |
| QA-CAT-01 | Tarefa | Criar cobertura Cypress para os requisitos pendentes do catálogo | RF0011-RF0016, RN0011-RN0017 | P1 | Cada fluxo e validação implementados possui cenário nomeado com os IDs correspondentes |
| QA-PAG-01 | Tarefa | Testar concorrência de estoque, reserva, cupons e idempotência | RN0031, RN0032, RN0036, RN0037, RN0044, RN0045 | P1 | Chamadas concorrentes não vendem acima do estoque, não duplicam pedido/crédito e não reutilizam cupom |
| QA-PERF-01 | Tarefa | Medir consultas com limite de um segundo | RNF0011 | P1 | Cenários, massa, máquina e resultados documentados; consultas acima de 1 s geram cartões de otimização |
| TECH-VEN-01 | Dívida técnica | Consultar pedidos e trocas já filtrados pelo cliente | RNF0011 | P2 | View chama endpoints com `clienteId`; dados de outros clientes não são baixados para a tela de conta |
| US-IA-01 | História | Integrar chatbot de recomendação com Llama | RNF0044 IA | P3 | Modelo/versão definidos; recomendação usa catálogo e preferências permitidas; erros, feedback e limites são tratados; respostas deixam de ser fixas |

## Em andamento

Estes cartões representam requisitos parcialmente atendidos: já existe uma base, mas a história completa ainda não satisfaz o DRS.

| ID | Tipo | Cartão | Requisitos | Prioridade | Trabalho restante |
| --- | --- | --- | --- | --- | --- |
| US-CAT-01 | História | Completar o cadastro técnico de hardware | RF0011, RN0011, RNF0021 | P1 | Definir SKU/código de barras único e atributos técnicos/físicos coerentes para hardware; criar migration, DTOs, filtros e testes |
| US-CAT-04 | História | Consultar produtos por todos os campos de identificação | RF0015 | P1 | Criar filtros estruturados individuais e combinados, mantendo busca textual como conveniência |
| TECH-AUD-01 | Dívida técnica | Completar a auditoria de todas as inclusões e alterações | RNF0012 | P1 | Mapear operações sem antes/depois/responsável; cobrir transições históricas e testar conteúdo sem segredos |
| TECH-EST-01 | Dívida técnica | Transformar ajustes diretos de estoque em movimentações rastreáveis | RN0050, RN0051, RNF0064 | P2 | Toda alteração quantitativa passa por entrada/saída com origem, responsável, data e custo quando aplicável |

## Testar

| ID | Tipo | Cartão | Requisitos | Prioridade | Evidência esperada |
| --- | --- | --- | --- | --- | --- |
| QA-REL-01 | Tarefa recorrente | Executar regressão Cypress completa antes da entrega | Todos os RFs/RNs cobertos pela suíte | P0 | 27 testes atuais aprovados no Edge, vídeos/XML preservados e nenhuma falha ignorada |
| QA-CLI-01 | Tarefa recorrente | Apresentar o CRUD de Cliente por Cypress | RF0021-RF0028, RN0021-RN0028, RNF0031-RNF0035 | P0 | Cadastro, consulta, alteração e inativação executados automaticamente; cada teste indica os IDs que comprova |
| QA-DB-01 | Tarefa | Validar migrations em banco vazio e banco atualizado | RNF0012 e integridade geral | P1 | V1-V8 aplicam do zero e sobre versão anterior; Hibernate valida o schema; PKs, FKs, UNIQUE e CHECKs conferidos |
| QA-DESK-01 | Tarefa | Validar o layout nos navegadores desktop suportados | Escopo de interface desktop | P2 | Fluxos essenciais utilizáveis em Edge/Chrome nas resoluções definidas, sem rolagem horizontal indevida ou controles inacessíveis |

## Finalizado

Um cartão nesta coluna continua sujeito a regressão. “Finalizado” significa que seu escopo específico foi implementado e testado; não significa que o épico inteiro terminou.

| ID | Tipo | Cartão | Requisitos atendidos | Evidência principal |
| --- | --- | --- | --- | --- |
| TECH-BASE-01 | Tarefa | Estruturar frontend React, API Spring MVC, JPA, PostgreSQL e Flyway | Arquitetura base, RNF0035, RNF0021, RNF0013 | Aplicação integrada, migrations V1-V8, domínios iniciais e testes de integração |
| US-CAT-02 | História | Alterar dados básicos, categorias, preço e grupo do produto | RF0014, RN0012, RN0013 | Editor administrativo e API persistente |
| US-CAT-03 | História | Inativar e reativar produto com motivo e categoria | RF0012, RF0016, RN0015, RN0017 | Fluxos administrativos auditados e teste E2E básico de produto |
| US-CLI-01 | História | Cadastrar cliente com endereço inicial | RF0021, RN0021-RN0023, RN0026, RNF0031-RNF0033, RNF0035 | Cadastro transacional, BCrypt e Cypress de Cliente |
| US-CLI-02 | História | Consultar e filtrar clientes | RF0024 | Filtros individuais/combinados, consulta da ficha e Cypress |
| US-CLI-03 | História | Alterar dados pessoais sem afetar os vínculos | RF0022 | PUT persistente, recarga da ficha e histórico preservado |
| US-CLI-04 | História | Inativar e reativar cliente sem excluir o cadastro | RF0023 | Mesmo UUID permanece consultável; não existe DELETE de Cliente; Cypress comprova o status |
| US-CLI-05 | História | Manter vários endereços do cliente | RF0026, RN0021-RN0023, RNF0034 | CRUD independente impede remover a última finalidade obrigatória |
| US-CLI-06 | História | Manter vários cartões e um preferencial | RF0027, RN0024, RN0025 | Bandeiras cadastradas, Luhn, preferência única e ausência de PAN/CVV no banco/retorno |
| US-CLI-07 | História | Alterar a senha independentemente | RF0028, RNF0031-RNF0033 | PATCH próprio, BCrypt custo 12 e segredo ausente das respostas/auditoria |
| US-CLI-08 | História | Consultar transações e ranking do cliente | RF0025, RN0027 | Perfil Lucas com pedidos, pagamentos, trocas, cupons e atividades persistidos |
| US-CAR-01 | História | Adicionar, consultar, alterar e remover itens do carrinho | RF0031, RF0032, RN0031, RN0032 | Carrinho persistente por cliente e verificação de disponibilidade |
| US-CAR-02 | História | Reservar e liberar unidades do carrinho | RN0044, RN0045, RNF0042 | Prazo, aviso, expiração, remoção e reinclusão implementados; ver BUG-CAR-01 para a transferência ao pedido |
| US-CHK-01 | História | Finalizar compra a partir do carrinho com frete simulado | RF0033, RF0034 | Orçamento/checkout persistentes, endereço de entrega e frete parametrizado |
| US-CHK-02 | História | Combinar cupons e múltiplos cartões | RF0036, RF0037, RN0033-RN0036 | Um promocional, cartões com mínimo de R$ 10, cálculo em centavos e saldo excedente; ver US-CHK-05 e BUG-PAG-01 |
| US-PAG-01 | História | Processar pagamento local e baixar estoque somente na aprovação | RF0038, RF0053, RN0028, RN0038 | Processador simulado aprova/reprova; recusa libera reserva e aprovação baixa uma vez |
| US-PED-01 | História | Movimentar pedido até transporte e entrega | RF0039, RF0040, RN0039, RN0040 | Transições administrativas persistentes e confirmação de recebimento |
| US-TRO-01 | História | Solicitar, autorizar, despachar, receber e processar troca | RF0041-RF0044, RN0041-RN0043, RN0046 | Fluxo cliente/admin completo, notificações e Cypress de pós-venda |
| US-TRO-02 | História | Gerar crédito e reentrada após recebimento da troca | RF0045, RF0054 | Cupom único e retorno opcional ao estoque, sem duplicação em retentativa |
| US-EST-01 | História | Registrar entrada de estoque com fornecedor, custo e data | RF0051, RF0052, RN0050, RN0051, RN0061, RN0062, RNF0064 | Entrada positiva persistida e preço recalculado pelo maior custo + margem; ver TECH-EST-01 para ajustes legados |
| US-ANA-01 | História | Analisar vendas mensalmente por período e categorias | RF0055-RF0057, RN0071-RN0074, RNF0043-RNF0046 | Série temporal, meses zerados, categorias comparáveis, moeda, legenda e tooltip |
| US-ANA-02 | História | Exportar análise de vendas | RF0058 | CSV com os mesmos filtros e dados do gráfico |

## Exemplo de decomposição de uma história

### História US CLI 04 Inativar cliente

**Descrição:** Como administrador, quero inativar um cliente para impedir novas operações comerciais sem apagar seu cadastro ou histórico.

**Critérios de aceite:**

1. Dado um cliente ativo, quando o administrador confirmar a inativação, então o status deve se tornar Inativo.
2. O registro, endereço, cartões, pedidos, pagamentos e auditoria devem permanecer no PostgreSQL.
3. O cliente inativo deve continuar consultável pelo administrador.
4. O cliente inativo não pode alterar o carrinho nem finalizar compras.
5. A API deve usar PATCH de inativação; DELETE de Cliente não deve ser disponibilizado.
6. O Cypress deve executar a ação, recarregar a página e confirmar o mesmo UUID com `ativo=false`.

**Tasks da história:**

- `TASK-CLI-04-BE`: implementar regra transacional de alteração do status no `ClienteService`.
- `TASK-CLI-04-API`: expor `PATCH /api/clientes/{id}/inativar` e resposta adequada para inexistente.
- `TASK-CLI-04-FE`: adicionar confirmação e atualizar a ficha após a resposta real da API.
- `TASK-CLI-04-DB`: manter status, datas e vínculos sem exclusão física.
- `TASK-CLI-04-AUD`: registrar antes/depois e responsável sem dados sensíveis.
- `TASK-CLI-04-E2E`: automatizar inativação, recarga, consulta e tentativa comercial bloqueada.

Esse exemplo mostra por que não se deve chamar tudo de task: a história descreve o valor e os critérios; cada task descreve uma entrega técnica necessária.

## Modelo para novos cartões

```text
ID:
Tipo:
Épico:
Título:
História: Como..., quero..., para...
Descrição:
RF/RN/RNF:
Prioridade:
Estimativa:
Responsável:
Dependências:

Critérios de aceite:
- Dado...
- Quando...
- Então...

Subtarefas:
- Frontend:
- Backend:
- Banco/migration:
- Testes Cypress:
- Testes de integração:

Evidências:
- PR/commit:
- Teste:
- Captura/relatório:
```

## Definição de pronto da Tech Store

Um cartão só vai para Finalizado quando:

- critérios de aceite estiverem atendidos;
- nomenclatura e comportamento forem coerentes com os RFs/RNs vinculados;
- frontend usar a API real, sem fallback mockado silencioso;
- regra final estiver no backend, não apenas no React;
- migration for criada quando o schema mudar;
- nenhum segredo for retornado ou auditado;
- erros esperados tiverem status e mensagem apropriados;
- testes de integração relevantes passarem;
- fluxo principal e validações principais tiverem Cypress com IDs no título;
- suíte de regressão passar;
- código revisado e cartão atualizado com evidências.

## Política de priorização sugerida

- **P0:** entrega imediata ou bloqueio de avaliação, como CRUD de Cliente e seus testes Cypress.
- **P1:** lacuna direta do DRS ou risco de integridade, como cupom, reserva, catálogo e desempenho.
- **P2:** melhoria importante que não bloqueia o fluxo principal atual.
- **P3:** evolução futura aprovada, como a integração Llama.

Não use a prioridade para manter muitos cartões abertos. Comece pelo P0/P1 mais antigo, respeite o limite de WIP e termine antes de puxar outro.
