# Suítes de gestão de vendas da Tech Store

Os testes exercitam a interface existente com Spring Boot e PostgreSQL reais. O pagamento é exclusivamente um simulador local. Nenhuma resposta HTTP é substituída por mock. Não há login: os testes selecionam o contexto do cliente ou do administrador já utilizado no projeto.

Atualização de 19/10/2026: recorte da atividade de vendas, do carrinho ao recebimento da troca e uso do crédito em outra compra, adaptado ao catálogo de hardware da Tech Store. As opções de negativa de troca, estorno, cancelamento e recebimento sem reentrada não são demonstradas por esta pasta. As funcionalidades antigas da aplicação não foram excluídas: este ajuste é das suítes de apresentação, não uma remoção de módulos do sistema.

## Preparação e execução

Mantenha o PostgreSQL em execução e o `.env` local configurado. Não publique esse arquivo. Abra terminais na raiz do projeto e execute:

Terminal 1 — API de testes, porta 8081:

```powershell
cd Backend
$env:JAVA_HOME='C:\Program Files\Java\jdk-25.0.4'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
.\mvnw.cmd '-Dspring-boot.run.profiles=e2e' spring-boot:run
```

Terminal 2 — frontend de testes, porta 5174:

```powershell
cd Frontend
npm.cmd run dev:e2e
```

Terminal 3 — Cypress:

```powershell
cd Frontend
# Abre o navegador interativo para escolher a suíte da apresentação:
npm.cmd run test:e2e:vendas:open

# Executa apenas o caminho completo:
npm.cmd run test:e2e:vendas:completo

# Executa somente os cenários separados:
npm.cmd run test:e2e:vendas:separados

# Executa todos, incluindo o completo:
npm.cmd run test:e2e:vendas
```

Não execute os quatro comandos do Cypress simultaneamente. O primeiro abre a interface; os demais são alternativas pelo terminal. As portas normais 8080/5173 não substituem o ambiente e2e. Para conferir a preparação, `Invoke-RestMethod http://localhost:5174/actuator/health` deve responder `UP`.

## Organização e rastreabilidade

Arquivos em `Frontend/cypress/e2e/gestao-vendas`. Cada teste é independente; não é necessário executar a suíte anterior para preparar a próxima.

| Arquivo | O que demonstra | Referências do DRS verificadas |
| --- | --- | --- |
| `00-venda-completa.cy.ts` | Dois produtos, quantidades, novo endereço/cartão incorporados, dois cartões e promocional, aprovação, entrega, troca de todos os itens, notificação, recebimento com reentrada, cupons e segunda compra usando o crédito; auditoria do ciclo | RF0031–RF0045; RF0053/RF0054; RN0023–RN0025/RN0028; RN0031/RN0033/RN0034/RN0037–RN0043/RN0046; RNF0012, nos passos correspondentes |
| `01-carrinho.cy.ts` | Incluir, consultar, alterar, remover, limite de estoque, indisponibilidade e bloqueio de unidades para outro cliente até liberação | RF0031/RF0032; RN0031/RN0044/RN0045 |
| `02-finalizacao.cy.ts` | Dados cadastrados; novos dados incorporados ou exclusivos da compra; frete e pedido em processamento | RF0033–RF0036/RF0038; RN0023–RN0025 |
| `03-cartoes-e-cupons.cy.ts` | Tentativa abaixo de R$ 10 bloqueada, seguida de compra com dois cartões; apenas promocional + cartão de R$ 5; troca + promocional + cartão; cupons superiores ao total com crédito da diferença. Todos terminam aprovados | RF0036/RF0037; RN0033–RN0038 |
| `04-processamento-pagamento.cy.ts` | Compra pela interface com um cartão, aprovação e baixa única; recusa; cupom vencido após finalização provoca reprovação | RN0028/RN0037/RN0038; RF0053 |
| `05-entrega.cy.ts` | Admin consulta, despacha compra aprovada e confirma a entrega; cliente consulta status persistido | RF0039/RF0040; RN0039/RN0040 |
| `06-solicitacao-e-autorizacao-troca.cy.ts` | Troca de toda a compra e troca de uma unidade de um pedido com vários itens; autorização e notificação; preservação dos itens não trocados | RF0041–RF0045; RN0041/RN0042/RN0043/RN0046 |
| `07-recebimento-estoque-e-credito.cy.ts` | Despacho do cliente; recebimento com reentrada; crédito pelo preço histórico; repetição de recebimento/fechamento sem duplicar crédito ou estoque | RF0044/RF0045/RF0054; RN0042. ITEM ENVIADO/RECEBIDO/PROCESSADA detalham operacionalmente os estados do DRS |
| `08-validacoes.cy.ts` | Cartão abaixo do mínimo sem cupom, soma incorreta, transporte antes da aprovação, troca antes da entrega, dois promocionais, cupom desnecessário, alheio ou inexistente | RF0038; RN0033/RN0034/RN0036/RN0037/RN0039/RN0043 |
| `09-consultas-e-auditoria.cy.ts` | Amostras de consultas em até 1 segundo; logs reais com data, responsável e antes/depois | RNF0011/RNF0012, no recorte medido |
| `10-expiracao-carrinho.cy.ts` | Expira no backend, remove todas as unidades, mostra motivo/prazo, bloqueia comprar e exige nova inclusão; aviso dos últimos cinco minutos e renovação pelo último produto incluído | RN0044/RN0045/RNF0042 |
| `11-revalidacao-estoque.cy.ts` | Reconciliação externa reduz estoque entre inclusão e compra: backend ajusta quantidade e avisa; item indisponível é removido com alerta | RN0032 |
| `12-reutilizacao-cupom-troca.cy.ts` | Cupom emitido no recebimento é consultado e usado em uma segunda compra aprovada; consulta passa a mostrar Utilizado | RF0045/RF0036/RF0037; RN0037/RN0038 |

`cypress/support/vendas.ts` centraliza preparação e ações de pós-venda, e reutiliza `pedido.ts`/`data.ts`. Nos testes separados, a API cria as pré-condições (por exemplo, um pedido já entregue para testar troca), evitando repetir a compra em todas as apresentações. A ação em avaliação ocorre pela tela. Verificações complementares por API/banco conferem persistência, integridade e repetição de requisições.

No arquivo 00, somente os cadastros prévios de cliente, produtos, entradas de estoque, cartões e cupons são preparados pela API. **Todas as operações da venda e da troca são feitas pelos botões e formulários da aplicação**, alternando explicitamente entre cliente e Admin. O mesmo pedido percorre os estados:

`EM PROCESSAMENTO → APROVADA → EM TRANSPORTE → ENTREGUE → EM TROCA → TROCA AUTORIZADA → TROCADO`.

O pedido é trocado integralmente por meio de uma solicitação para cada produto. As solicitações exibem os estados operacionais `TROCA SOLICITADA`, `TROCA ACEITA`, `ITEM ENVIADO`, `ITEM RECEBIDO` e `TROCA PROCESSADA`; a API expõe `statusDrs` para conferir a correspondência com os estados exigidos. O crédito aparece no recebimento, não no fechamento operacional posterior.

Após a consulta dos cupons, o mesmo cliente volta ao catálogo, compra novamente usando o crédito recém-gerado e processa o novo pagamento. A consulta confirma que o cupom ficou Utilizado e que o segundo pedido foi aprovado. O botão “Processar pagamento” é o gatilho do simulador de retorno da operadora: a decisão APROVADA/REPROVADA é do serviço, não uma seleção manual de status pelo administrador.

## Correspondência com o roteiro mínimo

| Cenário da atividade | Onde executar |
| --- | --- |
| 1. Compra aprovada com um cartão | `04-processamento-pagamento`, primeiro teste |
| 2. Dois cartões e tentativa abaixo do mínimo | `03-cartoes-e-cupons`, primeiro teste: tenta R$ 5, recebe erro, corrige para R$ 10 e conclui |
| 3. Promocional + cartão abaixo de R$ 10 | `03-cartoes-e-cupons`, teste “apenas cupom promocional e saldo de R$ 5,00” |
| 4. Cupons de troca acima do total, com diferença | `03-cartoes-e-cupons`, teste “cobre a compra com cupons” |
| 5. Reprovação sem baixa, com desbloqueio | `04-processamento-pagamento`, teste de recusa do cartão |
| 6. Expiração, remoção e bloqueio de compra | `10-expiracao-carrinho`, primeiro teste |
| 7. Fluxo administrativo até ENTREGUE | `05-entrega` ou etapas centrais do arquivo `00` |
| 8. Impedir troca antes de ENTREGUE | `08-validacoes`, teste “não oferece despacho [...] nem troca antes da entrega”: tenta também a URL direta e confere rejeição da API |
| 9. Troca parcial e integral | `06-solicitacao-e-autorizacao-troca`, segundo teste (uma unidade); `00` (todos os itens de dois produtos) |
| 10. Autorização, notificação, recebimento, cupom e reentrada | `00` ou `07-recebimento-estoque-e-credito` |
| 11. Uso do crédito de troca em outra compra | Final do `00` ou suíte independente `12-reutilizacao-cupom-troca` |

Nenhum teste depende de outro ter sido executado. Para mostrar os onze cenários e as validações complementares, execute todas as suítes; o arquivo `00` é um caminho feliz contínuo, não concentra todos os ramos de erro.

## Divergências de referência no enunciado

O texto da atividade desloca alguns RFs em relação ao DRS fornecido. A rastreabilidade dos testes mantém os IDs do DRS, sem renumerar requisitos ou transformar RN em RNF:

| Comportamento | ID citado nesse trecho do enunciado | ID no DRS usado pelo projeto |
| --- | --- | --- |
| Finalizar e registrar EM PROCESSAMENTO | RF0037 | RF0038 |
| Despachar compra aprovada | RF0038 | RF0039 |
| Confirmar entrega | RF0039 | RF0040 |
| Solicitar troca | RF0040 | RF0041 |
| Autorizar troca | RF0041 | RF0042 |
| Visualizar solicitações de troca | RF0042 | RF0043 |
| Confirmar recebimento da troca | RF0043 | RF0044 |
| Gerar cupom pelo recebimento | RF0044 | RF0045 |
| Retirar itens desbloqueados do carrinho | RNF0045 | RN0045 |
| Notificação de autorização | RNF0046 | RN0046 |

Há ainda uma divergência textual em RNF0042: o enunciado diz que os itens “voltam ao carrinho”, mas o DRS exige que sejam adicionados novamente pelo usuário. O teste verifica remoção real, botão desabilitado, motivo com o prazo parametrizado e posterior inclusão explícita pelo catálogo. Essas diferenças devem ser comunicadas ao avaliador; não se presumiu uma reinclusão automática incompatível com o DRS.

## Isolamento, evidências e limites

- O perfil `e2e` usa o schema `techstore_e2e`. Não altera as tabelas do schema normal `public`. Não aponte esses testes para a base de uso pessoal.
- Cada teste cria seus próprios clientes/produtos; IDs são obtidos da API, não fixados. Esses registros persistem no schema de testes como evidência, sem limpeza destrutiva automática.
- As suites antigas de CRUD e de criação de pedido até EM PROCESSAMENTO foram preservadas. A criação de pedido continua separada das operações posteriores de pagamento, estoque e troca.
- Intercepts observam as requisições reais. Esperas se apoiam na resposta da API e em assertions; o ritmo visual existente foi preservado.
- Após aprovação, o estoque físico diminui; após reprovação, a reserva é liberada sem baixa física. Todos os recebimentos demonstrados neste recorte escolhem “Sim” para reentrada.
- A regra do frete é conferida conforme a configuração local padrão: SP R$ 14,90 e R$ 2 por unidade adicional. Não se trata de integração com transportadora.
- RNF0011 é medido com amostras locais; isso não comprova desempenho em qualquer carga ou infraestrutura.
- A tarefa `condicionarVenda` usa `scripts/condicionar-venda-e2e.ps1` e `scripts/CondicionarVendaE2e.java`, sem endpoint especial. Ela só alcança `techstore_e2e`, clientes Cypress criados há menos de duas horas e alvos identificados por UUID. SQL parametrizado, tabelas qualificadas, transação e validação de alvo impedem atingir a base normal por fallback de schema.
- No cenário de prazo, apenas `expira_em` da fixture é antecipado; quem remove e libera é o backend real. No cenário de inventário, emula-se uma reconciliação externa com perda da reserva, preservando o CHECK `reservado <= quantidade`. Essa injeção é necessária porque a API administrativa normal corretamente impede reduzir o estoque abaixo da reserva. No cenário de cupom, a validade da fixture é antecipada para testar a revalidação posterior.
- Essas condições controladas não são respostas HTTP mockadas nem uma prova de execução espontânea pelo tempo de parede. Evitam esperar meia hora ou depender de alterações manuais no banco durante a apresentação.
- O cenário de dois clientes prova isolamento sequencial de reservas; testes de integração já existentes complementam as condições de concorrência simultânea. Estas suítes não são certificação integral de todo o DRS.
- Não há operadora real, envio real, validação de login ou IA implementada nesta entrega.

Por padrão o Cypress grava vídeos e capturas de falha. Para uma captura documental de cada etapa principal, o fluxo completo também registra a finalização, o pedido em processamento e os cupons após a troca. O resultado de cada execução deve ser consultado no Cypress; não se deve interpretar “arquivo criado” como “teste aprovado”.

## Validação realizada em 19/10/2026

Resultado consolidado mais recente: **28 cenários de gestão de vendas aprovados nas 13 suítes (00–12), além de 2 regressões de criação de pedido**, sem cenários pendentes ou ignorados. TypeScript do Cypress e lint aprovados. Nenhum código de interface, CSS, serviço da aplicação ou migração foi modificado nesta etapa.

A rodada principal executou 30 testes em 15 arquivos, com 29 aprovados e uma falha no helper de troca parcial: `clear()` restaurava o mínimo 1 no campo controlado e a digitação concatenava outro dígito. O helper passou a substituir a seleção com `{selectall}` e conferir a quantidade antes de enviar. Os arquivos 06, 00, 07 e 12 foram repetidos: **5/5 aprovados**, incluindo a troca de exatamente uma unidade e o fluxo completo com nova compra. O consolidado considera o resultado mais recente de cada caso, sem apagar a evidência inicial.

- Rodada principal: `Frontend/cypress/results/vendas-escopo-20261019`, log `Frontend/cypress/vendas-escopo-20261019.log`.
- Repetição após correção: `Frontend/cypress/results/vendas-final-20261019`, log `Frontend/cypress/vendas-final-20261019.log`.
- Foco prévio em expiração/revalidação: 4/4 em `Frontend/cypress/results/vendas-condicoes-20261019`.
- Proteção da tarefa de preparação: referência de cliente inexistente rejeitada antes de qualquer update.

As execuções usaram Edge headless e PostgreSQL real no schema isolado, com delays 75/120/2 ms e vídeo desligado somente pela CLI de validação. O ritmo padrão da apresentação continua preservado. Os testes de prazo/frete assumem os parâmetros locais padrão, respectivamente 30 minutos e frete SP de R$ 14,90 mais R$ 2 por unidade adicional.

## Histórico da validação de 17/10/2026

22 testes aprovados nas 10 suítes, sem falhas ou testes ignorados. Os arquivos 00–08 passaram juntos (21 testes em 6min01s); a suíte 09, adicionada durante a rodada, passou separadamente (1 teste em 26s). Relatórios JUnit em `Frontend/cypress/results/gestao-vendas-20261017`; logs `Frontend/cypress/gestao-vendas-20261017.log` e `Frontend/cypress/gestao-vendas-auditoria-20261017.log`. TypeScript dos testes e lint também aprovados.

Nesta validação foi usado Edge headless, com `--expose 'actionDelay=75,pageDelay=120,typeDelay=2'` e vídeo desabilitado apenas pela linha de comando. O ritmo padrão de apresentação não foi alterado. Os testes usaram Spring Boot na porta 8081, Vite na 5174 e PostgreSQL no schema `techstore_e2e`. Nenhum arquivo de interface, CSS ou regra de negócio foi modificado nesta etapa.
