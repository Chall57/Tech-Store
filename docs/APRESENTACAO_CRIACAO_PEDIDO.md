# Criação de pedido da Tech Store

O projeto precisava de ajustes para atender esta entrega. A criação do pedido era seguida automaticamente pelo processamento simulado do pagamento; endereço e cartão novos eram sempre incorporados. Es à conta; o cupom da diferença só era emitido depois da aprovaçãoses pontos foram corrigidos. A conclusão da compra agora termina em **EM PROCESSAMENTO**, com pagamentos pendentes e sem baixa no estoque físico.

A referência é o DRS fornecido para o projeto, na versão DRS_LES_2_2026, encontrado em `C:\Users\Lucas\Desktop\LES\DRS_LES_2_2026.docx`. A adaptação do domínio mantém os identificadores e substitui livros por componentes de hardware. Esta revisão cobre o escopo de criação de pedido solicitado, não certifica todos os módulos do DRS.

## Checklist da entrega

| Requisito ou regra | Implementação atual | Suíte Cypress |
| --- | --- | --- |
| RF0031 — adicionar, consultar, alterar e excluir itens do carrinho | Carrinho por cliente persistido; mais de um produto; remoção pela interface | `01-carrinho.cy.ts` |
| RF0032 — definir quantidades na inclusão e no carrinho | Seletores respeitam a quantidade disponível, sem os limites artificiais anteriores de 5/20 unidades | `01-carrinho.cy.ts`, `02-dados-cadastrados.cy.ts` |
| RN0031 — validar disponibilidade e quantidade | Interface desabilita produto indisponível; backend rejeita excesso, mesmo que a requisição seja feita diretamente | `01-carrinho.cy.ts` |
| RF0033 — iniciar a compra pelo carrinho | Botão Finalizar compra abre a rota `/checkout` | `02-dados-cadastrados.cy.ts` |
| RF0035 — endereço existente ou novo, com incorporação opcional | Novo endereço pode ser salvo na conta ou usado só no pedido; a opção é aplicada na mesma transação da compra | `03-novos-dados.cy.ts` |
| RN0023 — composição do endereço | Tipo de residência, tipo de logradouro, logradouro, número, bairro, CEP, cidade, estado e país obrigatórios; observações opcionais | `03-novos-dados.cy.ts`, `07-validacoes.cy.ts` |
| RF0034 — frete por itens e endereço | Tarifa do destino acrescida de valor por unidade adicional; calculada no backend | `02-dados-cadastrados.cy.ts`; teste Java `freteDependeDoEnderecoEDoNumeroDeUnidades` |
| RF0036 — cartão existente ou novo, com incorporação opcional | Cartões da conta e da compra podem ser selecionados; novos cartões podem permanecer apenas no pedido | `03-novos-dados.cy.ts`, `04-multiplos-cartoes.cy.ts` |
| RN0024 — composição do cartão | Número, nome impresso, bandeira e código de segurança informados e conferidos; PAN/CVV não persistidos nem devolvidos pela API | `03-novos-dados.cy.ts`, `07-validacoes.cy.ts` |
| RN0025 — bandeira registrada | Seletor alimentado pelo domínio da API; backend exige a bandeira no banco | `07-validacoes.cy.ts`; teste Java de bandeira inexistente |
| RF0037 — cupons e cartões | Seleção conjunta de cupom de troca, promocional e cartões; orçamento recalculado pelo backend | `05-cartao-e-cupons.cy.ts`, `06-excedente-cupons.cy.ts` |
| RN0033 — um promocional | Selecionar outro promocional substitui o anterior; envio de dois é rejeitado pelo backend | `07-validacoes.cy.ts` |
| RN0034 — vários cartões, mínimo de R$ 10 | Soma deve fechar o saldo em centavos; sem cupons, cada cartão paga ao menos R$ 10 | `04-multiplos-cartoes.cy.ts`, `07-validacoes.cy.ts` |
| RN0035 — valor máximo dos cupons e exceção ao mínimo | Valor dos cupons selecionados é consumido integralmente; saldo de R$ 5 no cartão é aceito | `05-cartao-e-cupons.cy.ts` |
| RN0036 — excedente e ausência de cupons desnecessários | Cupom da diferença emitido na finalização, sem aprovar pagamento; seleção redundante é rejeitada | `06-excedente-cupons.cy.ts`, `07-validacoes.cy.ts` |
| RF0038 — pedido EM PROCESSAMENTO | Pedido, itens, pagamentos, endereço e cupons persistidos em uma transação; nova consulta conserva o status | Todos os cenários de finalização |
| RNF0011 — consulta em até 1 segundo | Medição das consultas reais de produtos, endereços, cartões, cupons, carrinho e pedido | `08-consultas-e-auditoria.cy.ts` |
| RNF0012 — log de escrita | Auditorias com data/hora, perfil responsável e dados antes/depois; confirmação adicional diretamente no PostgreSQL | `08-consultas-e-auditoria.cy.ts` |

## O que mudou e por quê

`Frontend/src/context/DemoContext.tsx:94` passou a chamar somente a criação do pedido. O processamento posterior continua sendo uma ação explícita do módulo já existente. A suíte desta entrega não o aciona. Isso evita terminar a apresentação em APROVADA, que contrariaria RF0038 e incluiria uma fase excluída do escopo.

`Frontend/src/pages/CheckoutPage.tsx:101` e `:121` oferecem as opções “Salvar endereço na minha conta” e “Salvar cartão na minha conta”. Novos dados ficam no estado da tela até a finalização. O backend decide se cria registros no perfil. Usar só na compra mantém o endereço como snapshot do pedido e o cartão pelos dados mascarados do pagamento. Nenhum cliente fictício é usado como fallback no frontend.

`Backend/src/main/java/com/lucas/ecomm/venda/dto/CheckoutRequest.java:10` aceita endereço/cartão existente ou novo, com flags opcionais de incorporação. `PedidoService.java:105` valida a seleção e persiste os vínculos em uma transação. Uma requisição repetida com a mesma chave retorna o mesmo pedido, sem duplicar endereço, cartão ou cupom.

`PedidoService.java:151` emite o saldo exigido pela RN0036 nessa finalização. `gerarCredito`, em `:191`, verifica se já há um cupom associado antes de criar outro. O total descontado da compra e o valor da diferença são registrados separadamente.

RN0034 é aplicada à distribuição entre cartões. RN0035 é a exceção específica quando também há cupons: não foi mantida a restrição anterior, sem previsão no texto, de aceitar a exceção apenas com um cartão. O exemplo obrigatório da apresentação usa um único cartão de R$ 5,00; há um teste Java adicional para a combinação com dois cartões.

## Onde mostrar as regras no código

| Ponto a explicar | Arquivo e linha de entrada | Explicação curta |
| --- | --- | --- |
| Adicionar e editar quantidade | `Backend/src/main/java/com/lucas/ecomm/venda/service/CarrinhoService.java:75` e `:86` | Inclusão soma a nova quantidade ao item existente; alteração verifica o estoque disponível antes de persistir |
| Rejeição de estoque insuficiente | `CarrinhoService.java:96` | A regra também está no servidor, portanto não depende do seletor do React |
| Campos de endereço | `Backend/src/main/java/com/lucas/ecomm/cliente/dto/EnderecoRequest.java:3` | `@NotBlank` exige dados; `@Pattern` verifica CEP e UF; observações têm apenas tamanho máximo |
| Campos e bandeira de cartão | `Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:42` e `:62` | Confere a composição e consulta o domínio de bandeiras; não registra número integral ou CVV |
| Um promocional | `Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:76` | Conta os cupons do tipo Promocional e rejeita mais de um |
| Cupom desnecessário | `PedidoService.java:95` | Se retirar qualquer cupom ainda deixa os demais cobrindo toda a compra, esse conjunto é redundante |
| Valor máximo e saldo | `PedidoService.java:102` | Desconto é limitado ao total; saldo dos cartões e crédito de troca são calculados separadamente |
| Mínimo no cartão | `PedidoService.java:125` | Verifica RN0034 com a exceção da combinação prevista em RN0035 |
| Status e persistência | `PedidoService.java:135` | Cria o pedido EM PROCESSAMENTO, com itens e pagamentos pendentes; não chama a operadora |
| Log | `Backend/src/main/java/com/lucas/ecomm/shared/service/AuditoriaService.java:15` | Guarda o perfil contextual e DTOs antes/depois; `BaseModel.java:16` fornece a data/hora |
| Comunicação HTTP | `Frontend/src/services/vendaService.ts:27` | Centraliza orçamento e finalização; página e contexto usam essa camada |
| Prova de persistência | `Frontend/cypress/support/pedido.ts:111` | Clica na tela, observa o POST real, recarrega a página e consulta o pedido novamente |

## Critério de frete para explicar

`Backend/src/main/java/com/lucas/ecomm/venda/service/FreteService.java:19` calcula:

```text
frete = tarifa do destino + R$ 2,00 × (quantidade total de unidades − 1)
```

A tarifa-base é R$ 14,90 para SP, R$ 29,90 para outros estados brasileiros e R$ 69,90 para outro país. Com quatro unidades e entrega em SP, o frete é R$ 20,90. O resultado muda ao alterar destino ou quantidade. Os valores são parâmetros da aplicação, não uma fórmula estabelecida pelo DRS. Trata-se do critério local adotado porque RF0034 não define tarifa, peso, transportadora ou fórmula.

## Comandos para a apresentação

PostgreSQL deve estar em execução e o `.env` local configurado. Use três terminais PowerShell. Se estes processos já estiverem rodando, reutilize-os para evitar conflito de porta.

Terminal 1 — backend de testes, porta 8081:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e"
```

Terminal 2 — frontend de testes, porta 5174, proxy para 8081:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run dev:e2e
```

Terminal 3 — Cypress com navegador e seleção das suítes desta entrega:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run test:e2e:pedido:open
```

Selecione `00-fluxo-completo.cy.ts` no Cypress para a apresentação principal. Esse teste executa os sete pontos pedidos em sequência: compra com dados existentes, compra com novos dados incorporados, dois cartões, cupons e saldo de R$ 5,00, cupom de diferença e conservação de EM PROCESSAMENTO. Os cenários usam clientes independentes para não consumir os cupons necessários à próxima compra.

Para executar o caminho completo em janela visível sem escolher arquivos no painel:

```powershell
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/00-fluxo-completo.cy.ts"
```

Para executar todas as suítes separadas pelo terminal:

```powershell
npm run test:e2e:pedido
```

Para executar somente o fluxo completo em modo headless:

```powershell
npm run test:e2e:pedido:completo
```

Para executar apenas um cenário, por exemplo o saldo de R$ 5,00:

```powershell
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/05-cartao-e-cupons.cy.ts"
```

## Roteiro sugerido

1. Informe que a entrega termina na criação do pedido, em EM PROCESSAMENTO. Mostre o hardware como adaptação do domínio e identifique RF0031–RF0038 e as RNs do escopo.
2. Execute `00-fluxo-completo.cy.ts`. Ao editar quantidades, explique RF0032 e a proteção final de RN0031 no backend.
3. Na primeira compra, mostre o endereço e o cartão existentes. Explique o critério do frete com a conta de quatro unidades em SP.
4. Na segunda compra, destaque as opções de incorporar os novos dados. A suíte abre a conta depois para mostrar os registros persistidos. Se solicitado, execute `03-novos-dados.cy.ts` para demonstrar também a escolha de não incorporar.
5. Na distribuição de pagamento, identifique RN0034. No cenário seguinte, identifique RN0033/RN0035 e mostre o uso integral dos dois tipos de cupom, deixando R$ 5,00 no cartão.
6. Na compra com excedente, identifique RN0036. Mostre o novo cupom da diferença e o pedido ainda EM PROCESSAMENTO. Não execute processamento de pagamento.
7. Execute `07-validacoes.cy.ts` para os erros e `08-consultas-e-auditoria.cy.ts` para a evidência de RNF0011/RNF0012. Mostre os registros e tempos no log do Cypress.

Os testes de negócio usam cliques, formulários e navegação do cliente. `cy.request` é usado para preparar a base antes das ações, verificar o que foi persistido e provar adicionalmente restrições no servidor. `cy.intercept` apenas observa as respostas reais: não fornece mocks. A verificação de auditoria usa uma tarefa somente leitura no schema `techstore_e2e`, sem expor um novo endpoint administrativo.

## Escopo e limites da evidência

Os cadastros necessários são feitos pelos endpoints existentes de cliente, produto, cartão, fornecedor e entrada de estoque. Os cupons são preparados pela API antes do fluxo. Não se demonstra geração de cupom pelo processo de troca; o cupom de diferença usado aqui é especificamente RN0036.

As suítes de criação de pedido não abrem dashboard administrativo, não autorizam pagamento, não mudam o estado após EM PROCESSAMENTO, não baixam o estoque físico e não executam troca. Reserva e expiração permanecem no código existente, mas não compõem as verificações nem o roteiro desta fase. As suítes antigas de entrega, recusa e troca são regressões de outras funcionalidades e não devem ser escolhidas para esta apresentação.

A medição de RNF0011 verifica as consultas no ambiente local de teste. Ela não equivale a garantia de desempenho sob qualquer volume ou infraestrutura. A tarefa de auditoria confere inserções/alterações do carrinho e criação do pedido; os testes Java também conferem a emissão de crédito e cadastros relacionados.

## Validação da implementação

- Backend: 40 testes aprovados no PostgreSQL, incluindo 18 do fluxo de compra; nenhuma falha ou teste ignorado.
- Frontend: build, TypeScript do Cypress e lint aprovados; 13 testes de componentes/utilitários aprovados.
- Cypress: 14 testes aprovados nas nove suítes de criação de pedido, incluindo o fluxo completo; nenhuma falha ou teste ignorado.
- Regressões Cypress afetadas: 12 testes aprovados em seis arquivos de compra, cupons, consulta/cancelamento, troca e recusa simulada. Essas suítes antigas não fazem parte do roteiro desta entrega.
- Banco: migração V9 acrescenta a validade do cartão ao pagamento, permitindo o uso sem associação ao perfil. Número integral e CVV não são armazenados. A migração é aplicada automaticamente pelo Flyway ao iniciar cada ambiente.
- Design: layout, estilos, rotas e componentes MUI reaproveitados; os controles novos usam o editor e os cartões de opção existentes.
