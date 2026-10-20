# Roteiro de apresentação — criação de pedido da Tech Store

Este roteiro acompanha o código atual e as instruções de criação de pedido baseadas no DRS LES 2 2026. O domínio é hardware. O objetivo da apresentação é comprovar as funcionalidades pela interface automatizada e explicar onde as regras são aplicadas, não apresentar todos os módulos do sistema.

## 1. Preparação e comandos

Mantenha PostgreSQL, backend e frontend ligados. Não reinicie processos que já estejam nas portas corretas. Não mostre o conteúdo do `.env` na chamada do Teams.

Terminal 1:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e"
```

Terminal 2:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run dev:e2e
```

Terminal 3, com a janela do Cypress:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run test:e2e:pedido:open
```

Selecione `00-fluxo-completo.cy.ts`. Para executar diretamente com navegador visível:

```powershell
npm run test:e2e:pedido:completo -- --headed
```

Na preparação, abra também `PedidoService.java`, `CheckoutPage.tsx`, `CarrinhoService.java`, `FreteService.java` e a suíte completa no editor. Compartilhe a tela inteira ou a janela correta no Teams, para que o professor veja o Cypress, o site e o código. Use apenas números de cartões fictícios.

O backend de teste usa 8081 e o frontend 5174, com o schema PostgreSQL `techstore_e2e`. A preparação de cada cenário cria os registros pela API antes da navegação. São dados fictícios persistidos, não respostas mockadas. Os cadastros e entradas de estoque são feitos por funcionalidades existentes; os cupons também são preparados antes do fluxo, sem demonstrar o processo de troca.

## 2. Abertura — cerca de 40 segundos

> “Vou demonstrar a criação de pedido da Tech Store, adaptando o domínio de livros para hardware e mantendo as regras solicitadas. O Cypress opera as telas do cliente e usa o backend Spring Boot com PostgreSQL reais. O fluxo termina em EM PROCESSAMENTO. Aprovação de pagamento, baixa de estoque, entrega, reserva/expiração e troca não fazem parte desta apresentação.”

> “Cada etapa tem verificações de interface, resposta HTTP e persistência. Vou indicar o RF ou a RN correspondente enquanto o teste executa.”

Não diga que pagamento foi aprovado nem que houve cobrança. Validar os campos e a composição dos valores nesta fase não é autorizar a transação financeira.

## 3. Falas durante a suíte completa

A suíte executa cinco compras para demonstrar os sete pontos mínimos. Não é um único pedido que muda de forma de pagamento cinco vezes. São cenários independentes, reunidos em um teste, para não reutilizar cupons consumidos em uma compra anterior.

### Etapa 1 — carrinho com dois produtos e alteração de quantidades

> “Este trecho atende RF0031 e RF0032: adiciono dois produtos diferentes, escolho duas unidades do primeiro na inclusão e depois altero para três no carrinho. Com uma unidade do segundo produto, são quatro unidades no total. A RN0031 impede quantidades superiores ao estoque e produtos indisponíveis.”

Mostre o seletor no catálogo e o seletor no carrinho. O teste volta ao catálogo, abre os detalhes do segundo produto e o adiciona por essa tela. A remoção de item e a tentativa de exceder o estoque ficam na suíte separada `01-carrinho.cy.ts`; não afirme que a suíte completa também executa a remoção. Os testes agora têm ritmo configurável, descrito em `TESTES_CYPRESS.md`.

Código: [StorePages.tsx:33](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/StorePages.tsx:33), [CarrinhoService.java:75](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/CarrinhoService.java:75) e [CarrinhoService.java:96](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/CarrinhoService.java:96).

### Etapa 2 — compra com endereço e cartão cadastrados

> “Inicio a compra pelo carrinho, atendendo RF0033. Seleciono endereço e cartão já vinculados ao cliente, atendendo RF0035 e RF0036. O orçamento é calculado no backend, com os produtos persistidos, não com preços enviados livremente pelo navegador.”

Explique RF0034:

> “Como o DRS não fixa a fórmula, usamos tarifa por destino mais R$ 2 por unidade adicional. Para SP, são R$ 14,90 mais três adicionais de R$ 2: frete de R$ 20,90 nesta compra de quatro unidades. É um critério configurável da aplicação, não uma tarifa definida pelo DRS.”

Outros estados brasileiros: base de R$ 29,90. Outro país: base de R$ 69,90. O total considera subtotal dos itens mais frete.

Código: [FreteService.java:19](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/FreteService.java:19) e [PedidoService.java:83](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:83).

### Etapa 3 — novo endereço e novo cartão durante a compra

> “RF0035 e RF0036 também permitem informar novos dados durante a compra. Marco a opção de incorporá-los ao perfil. RN0023 exige a composição completa do endereço; RN0024 exige número, titular, bandeira e código do cartão; RN0025 restringe a bandeira ao domínio cadastrado.”

Campos do endereço: tipo de residência, tipo de logradouro, logradouro, número, bairro, CEP, cidade, estado e país; observações opcionais. A identificação do endereço também existe no formulário do projeto.

> “O formulário prepara os dados na memória da página. A gravação no perfil ocorre junto com a finalização do pedido. Depois o teste abre Endereços e Cartões para provar a incorporação. Se eu desmarcar as opções, os dados ficam apenas no pedido; esse caso tem teste separado.”

Código: [CheckoutPage.tsx:32](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:32), [EnderecoRequest.java:3](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/EnderecoRequest.java:3), [CartaoService.java:62](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:62), [PedidoService.java:130](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:130).

### Etapa 4 — pagamento com dois cartões

> “A RN0034 permite vários cartões. Sem cupons, cada cartão deve receber ao menos R$ 10, e a soma precisa fechar exatamente o saldo. A tela distribui o valor inicialmente e permite editar cada parcela. O backend repete a validação.”

> “Os valores monetários são conferidos em centavos no frontend e com BigDecimal no Java, evitando comparação de valores financeiros com ponto flutuante binário no servidor.”

Código: [CheckoutPage.tsx:45](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:45), [CheckoutPage.tsx:65](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:65) e [PedidoService.java:125](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:125).

### Etapa 5 — cupons mais cartão com saldo abaixo de R$ 10

> “RF0037 permite combinar cupons e cartões. RN0033 limita a um promocional. RN0035 exige considerar o valor máximo dos cupons e permite a exceção ao mínimo no cartão quando há essa combinação.”

Na base atual deste cenário: produto de R$ 67,50 + frete de R$ 14,90 = R$ 82,40. Promocional de R$ 20 + troca de R$ 57,40 = R$ 77,40 em cupons. O cartão paga R$ 5.

> “Não estou ignorando RN0034: aplico sua exceção específica da RN0035. Sem cupom, a mesma parcela abaixo de R$ 10 é rejeitada.”

Código: [PedidoService.java:76](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:76), [PedidoService.java:102](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:102) e [PedidoService.java:125](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:125).

### Etapa 6 — cupons acima do total e emissão da diferença

> “A RN0036 prevê devolver o excedente em um cupom de troca. Nesta compra de R$ 82,40, uso cupons de R$ 50 e R$ 60. São R$ 110, gerando crédito de R$ 27,60. Nenhum cartão precisa ser cobrado.”

> “Os dois cupons são necessários: nenhum deles, sozinho, cobre R$ 82,40. O servidor rejeita um conjunto no qual retirar um cupom ainda deixa os demais cobrindo a compra. Assim não adiciono cupons desnecessários só para gerar mais crédito.”

Os cupons originais são marcados como utilizados; o desconto da compra fica limitado ao total; o excedente é representado pelo novo cupom. O valor aplicado nas associações pedido/cupom não precisa coincidir com todo o valor nominal quando existe excedente: o restante está no crédito emitido.

Código: [PedidoService.java:95](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:95) e [PedidoService.java:191](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:191).

### Etapa 7 — persistência e EM PROCESSAMENTO

> “RF0038 exige registrar o pedido em EM PROCESSAMENTO. O teste verifica a resposta 201, o status na interface, recarrega a página e consulta novamente o mesmo pedido. Também comprova que não houve chamada de processamento do pagamento e que o estoque físico não foi baixado.”

> “Pedido, itens, endereço, pagamentos e cupons são tratados na mesma transação. Assim não deixamos uma compra parcialmente gravada se alguma validação ou gravação falhar.”

Código: [PedidoService.java:25](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:25), [PedidoService.java:135](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:135), [DemoContext.tsx:94](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/context/DemoContext.tsx:94), [pedido.ts:111](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/support/pedido.ts:111).

Não clique no botão “Processar pagamento” da consulta do pedido. Ele pertence ao módulo posterior, não à entrega atual.

## 4. Estrutura e raciocínio do código

```text
React/MUI → services HTTP → Controller REST → Service de negócio → Repository/JPA → PostgreSQL
```

- View: páginas React e componentes MUI apresentam dados e recebem as escolhas.
- Controller: mapeia a URL, recebe o DTO, executa validação estrutural e delega ao Service; não concentra os cálculos da compra.
- Service: aplica RN0031/RN0033–RN0036, calcula o orçamento, verifica vínculos e coordena a transação.
- Repository: consulta/persiste entidades pelo Spring Data JPA, sem conhecer componentes React.
- Model: representa entidades e relacionamentos persistidos. Não é o mesmo que DTO.

É uma aplicação em camadas baseada em MVC, com View separada em uma SPA. O Spring devolve JSON, não uma página HTML renderizada por JSP/Thymeleaf. A camada Service complementa o MVC; não o substitui.

| Arquivo | O que explicar |
| --- | --- |
| [CheckoutPage.tsx:20](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:20) | `useState` guarda seleções e formulários temporários; `useQuery` busca o orçamento com chave que inclui cliente/endereço/cupons; `finish` valida e aguarda o POST antes de navegar |
| [vendaService.ts:27](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/services/vendaService.ts:27) | Centraliza chamadas de orçamento e finalização; evita URLs espalhadas nas páginas |
| [api.ts:13](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/services/api.ts:13) | Usa `fetch`, timeout e tratamento de erros; HTTP 502 não vira sucesso fictício |
| [PedidoController.java:17](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/controller/PedidoController.java:17) | Recebe JSON em `@RequestBody`, valida com `@Valid`; orçamento retorna dados e criação responde HTTP 201 |
| [CheckoutRequest.java:10](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/dto/CheckoutRequest.java:10) | `record` define DTO de entrada; aceita ID existente ou novos dados; `@Valid` valida objetos internos; flags indicam incorporação |
| [PedidoService.java:105](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:105) | Recalcula, confere revisão, valida pagamentos e grava o conjunto da compra |
| [PedidoRepository.java:5](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/repository/PedidoRepository.java:5) | `JpaRepository<PedidoModel,UUID>` fornece persistência; consulta por cliente/chave evita duplicação por repetição |
| [PedidoModel.java:14](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/model/PedidoModel.java:14) | Vários pedidos pertencem a um cliente; o endereço da conta é opcional no pedido porque um novo pode ser usado sem incorporação |
| [ItemPedidoModel.java:10](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/model/ItemPedidoModel.java:10) | Item associa pedido e produto, guardando quantidade, preço e dados históricos; mudanças posteriores no catálogo não reescrevem a compra |
| [PedidoCupomModel.java:6](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/model/PedidoCupomModel.java:6) | Associação explícita pedido/cupom, com valor aplicado; não é uma lista solta no frontend |

`map` transforma itens em elementos ou payloads sem alterar o array original; `filter` seleciona dados; `reduce` soma valores. O método `finish` é assíncrono porque a API não responde imediatamente: `await` aguarda a Promise, `try/catch` trata falhas e `finally` libera o indicador de carregamento.

Nomes como `DemoContext` e `MockEditor` são legados do protótipo. Atualmente o contexto consulta APIs reais e o editor é um componente reutilizável de formulário. O nome não significa que o pedido seja mockado.

## 5. Perguntas prováveis e respostas

**Por que validar no frontend e no backend?**

> “O React oferece retorno imediato, mas pode ser contornado. O Spring é a fonte final das regras. Desabilitar um botão não substitui a validação no Service.”

**O navegador pode mudar o preço ou o total enviado?**

> “O backend recalcula com os produtos do banco. O total esperado e a revisão servem para detectar resumo desatualizado, não para confiar no preço informado pelo cliente.”

**O que é a revisão SHA-256 do orçamento?**

> “É uma impressão do estado relevante do orçamento. Se carrinho, preços ou frete mudarem, a finalização é rejeitada com 409. Não é autenticação nem uma assinatura de pagamento.”

**E se clicar duas vezes ou repetir a requisição?**

> “A tela usa `busy` e uma chave de operação estável. O Service busca um pedido anterior com cliente/chave antes de criar outro, e o banco tem uma restrição única para essa combinação. Uma repetição retorna o pedido existente.”

Referências: `CheckoutPage.tsx:31`, `PedidoService.java:107`, `PedidoRepository.java:8`, migração `V3__finalizacao_de_compra.sql:13`. A prova suplementar está no teste Java `doisCartoesCupomPersistenciaAprovacaoEIdempotencia`; ele também exercita etapas posteriores, portanto não execute seu fluxo inteiro como roteiro de interface desta fase.

**Por que não basta gravar o endereço antes do pedido?**

> “A incorporação é opcional e foi coordenada com a compra. A transação evita deixar novos registros de perfil de uma compra que falhou. Sem incorporação, o pedido guarda um retrato dos dados usados.”

**Se o cliente mudar o endereço ou o produto depois, o pedido muda?**

> “O pedido preserva o endereço de entrega e os itens com preço/nome históricos. O vínculo permite consultar a origem, mas a compra não é recalculada retroativamente.”

**Pode pagar com R$ 5 em cada cartão?**

> “Sem cupons, não: RN0034 exige R$ 10 por cartão. Com cupons, o código aplica a exceção de RN0035, desde que a soma pague exatamente o saldo. Não foi criada uma restrição adicional de quantidade de cartões nessa exceção.”

**Pode selecionar dois promocionais?**

> “A interface substitui o anterior. Mesmo que alguém envie dois diretamente, o backend rejeita.”

**Por que não cobrar o cartão quando os cupons cobrem tudo?**

> “O saldo nos cartões é zero. A lista de pagamentos pode estar vazia nesse caso, e o excedente vira crédito de troca.”

**O cartão está realmente validado por uma operadora?**

> “Não. Aqui verificamos composição dos dados e distribuição dos valores. A aplicação pessoal não realiza cobrança real; autorização financeira e estados posteriores estão fora desta entrega. Luhn e formato de CVV não provam titularidade nem existência do cartão.”

**Como são protegidos os dados do cartão?**

> “Não persistimos número integral nem CVV. Guardamos últimos quatro dígitos, metadados e uma impressão HMAC para identificar duplicidade. O HMAC não é uma tokenização certificada por uma operadora. Use apenas cartões fictícios neste projeto.”

**Por que usar API no Cypress? Isso não é demonstração manual ou mock?**

> “A API prepara a base e confere o resultado. A ação avaliada acontece por cliques/formulários. O `cy.intercept` observa respostas reais e não fornece uma resposta falsa. O `reload` demonstra que o dado não está apenas no estado React.”

**A escolha de perfil protege o acesso de outro cliente?**

> “Não é autenticação. A seleção e o cabeçalho `X-Perfil` são contexto local conforme o escopo acordado. O servidor confere os vínculos de endereço/cartão/cupom com o cliente informado, mas isso não substitui identificação/autorização de um usuário em produção.”

## 6. Erros que o professor pode pedir para testar

| Tentativa | Resultado esperado | Evidência atual |
| --- | --- | --- |
| Adicionar produto com estoque zero | Botão desabilitado; requisição direta rejeitada com 409 | Cypress `01-carrinho.cy.ts` |
| Adicionar quantidade acima do estoque | Servidor rejeita e preserva o carrinho | Cypress `01-carrinho.cy.ts` |
| Remover um dos dois itens | Item desaparece e não volta após recarga | Cypress `01-carrinho.cy.ts` |
| Salvar endereço sem logradouro | Obrigatoriedade na interface; payload incompleto rejeitado | Cypress `07-validacoes.cy.ts` |
| Cartão sem número ou com número inválido | Obrigatoriedade/erro; nenhum pedido criado | Cypress `07-validacoes.cy.ts` |
| Bandeira inexistente enviada diretamente | Backend rejeita, sem persistir pedido ou dados novos | Java `bandeiraNaoCadastradaNaoPersistePedidoOuNovosDados` |
| Dois promocionais | Interface substitui; API rejeita dois | Cypress `07-validacoes.cy.ts` |
| Cupons redundantes | Seleção adicional bloqueada; API rejeita conjunto redundante | Cypress `06-excedente-cupons.cy.ts` e `07-validacoes.cy.ts` |
| R$ 5 em cartão sem cupons | Mensagem de mínimo, sem criar pedido | Cypress `07-validacoes.cy.ts` |
| Soma dos cartões maior/menor que o saldo | Mensagem de soma incompatível, sem criar pedido | Cypress `07-validacoes.cy.ts` |
| Mesmo cartão repetido | Backend rejeita duplicidade por impressão digital | Java `rejeitaSomaErradaCartaoAbaixoDoMinimoEDuplicado` |
| Endereço/cartão/cupom de outro cliente | Backend rejeita o vínculo incompatível | Java `enderecosCartoesECuponsDevemPertencerAoCliente` |
| Alterar carrinho após obter orçamento | HTTP 409 e necessidade de conferir novo resumo | Java `revisaoImpedeCompraComResumoDesatualizado` |
| Não incorporar os novos dados | Pedido persiste, perfil não ganha endereço/cartão | Cypress `03-novos-dados.cy.ts` |

Os testes Java são provas suplementares da camada de servidor; não os anuncie como testes automatizados de interface. Os principais fluxos exigidos têm suítes Cypress próprias. Não provoque erros manualmente como substituição da demonstração automatizada.

Comandos para responder às perguntas ao vivo, na pasta Frontend:

```powershell
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/01-carrinho.cy.ts"
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/03-novos-dados.cy.ts"
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/07-validacoes.cy.ts"
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/08-consultas-e-auditoria.cy.ts"
```

## 7. RNF0011, RNF0012 e encerramento

Execute `08-consultas-e-auditoria.cy.ts`.

> “RNF0011 é conferida medindo consultas reais e exigindo até um segundo no ambiente local. RNF0012 é conferida em registros reais do PostgreSQL, com data/hora, responsável contextual, operação e dados antes/depois.”

Código: [AuditoriaService.java:15](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/shared/service/AuditoriaService.java:15), [08-consultas-e-auditoria.cy.ts:5](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/criacao-pedido/08-consultas-e-auditoria.cy.ts:5). A tarefa de auditoria usa consulta somente leitura no schema de testes, sem abrir uma API administrativa adicional.

> “Comprovei os sete cenários mínimos pela interface, a persistência em PostgreSQL, as regras de composição do pagamento e a finalização em EM PROCESSAMENTO. Mantive os módulos posteriores fora da demonstração.”

## 8. Limites e cuidados honestos

- As nove suítes de criação de pedido passaram na execução anterior: 14 testes. Esta elaboração do roteiro consultou o código, mas não repetiu a execução dos testes.
- Tempo de consulta local não garante o mesmo desempenho em qualquer máquina, rede, carga ou volume de dados.
- Reserva e expiração continuam implementadas em módulos existentes, mas não são objeto da apresentação. Não deixe a demonstração parada por longos períodos com um carrinho preparado.
- Dados novos ainda não finalizados ficam no estado da página. Recarregar a finalização antes de concluir pode descartar esse formulário temporário; não há promessa de persistência de rascunho.
- Na preparação da suíte adicional de CRUD foi observado `Maximum update depth exceeded` durante digitação automatizada muito rápida de um e-mail longo. A execução com e-mail mais curto passou; isso não comprova correção ou diagnóstico definitivo daquela falha. O formulário reutilizável merece investigação se esse cenário voltar a ocorrer. Não ignore exceções no Cypress para obter um resultado verde.
- Se a API ficar indisponível, a apresentação deve mostrar erro, não um pedido fictício de sucesso. Confira a saúde do backend e a porta do proxy antes de alterar código.

```powershell
Invoke-RestMethod http://127.0.0.1:8081/actuator/health
Invoke-WebRequest http://localhost:5174 -UseBasicParsing
```

Não apresente como requisito do DRS o HMAC, a chave de operação, o hash da revisão, Luhn ou os valores escolhidos para frete. São decisões técnicas da implementação; identifique o RF/RN que elas ajudam a atender, sem inventar novos identificadores.
