# Verificação e roteiro — criação de pedido

Data: 06/10/2026. Referência: DRS LES 2 2026 fornecido e escopo de criação de pedido informado pelo usuário. O domínio da Tech Store é hardware; as regras de venda continuam sendo as do DRS.

## 1. Resultado e ambiente

Rodada concluída: **14/14 testes Cypress aprovados, em 9 arquivos**, sem falhas, pendências ou testes ignorados. O resumo do Cypress registrou **11min10s** de execução dos cenários; o caminho feliz completo levou **3min52s**. Os quatro testes complementares do backend também passaram, sem falhas ou testes ignorados.

Conclusão: os sete pontos mínimos da apresentação foram comprovados com integração e persistência reais; a pasta completa acrescenta remoção, validações e RNFs. Não foi identificado bloqueio funcional nos cenários executados. Isso não equivale a cobertura exaustiva de todas as entradas possíveis nem garantia universal de desempenho; veja os limites na seção 7. Não foram alterados componentes, regras de negócio, testes ou tabelas nesta revisão. Foi criado somente este relatório, além dos artefatos gerados pelas ferramentas e dos registros de teste previstos nos schemas isolados.

- Cypress 16.1.0, Edge 154, viewport 1680 × 1050, ritmo de apresentação já configurado.
- Frontend de teste: `http://localhost:5174`; backend: porta 8081, perfil `e2e`.
- PostgreSQL real: schema `techstore_e2e`. Os cenários criam registros de teste pela API, não respostas fictícias no navegador.
- O backend e2e já estava ativo; a tentativa de iniciar outra instância encontrou a porta ocupada. Foi reutilizada a instância existente, sem interrompê-la.
- Ao terminar a rodada, foi encerrado apenas o frontend e2e iniciado para esta verificação. O backend preexistente foi preservado e continuava com saúde UP.
- Quatro testes complementares de servidor passaram no schema `techstore_integration`, com transações de teste: vínculos cliente/endereço/cartão/cupom; soma/mínimo/duplicidade de cartões; frete SP/RJ; bandeira não cadastrada e ausência de gravação parcial.
- Houve avisos do Cypress sobre limpeza de resultados antigos e perfil de navegador ocupado. Não houve falha de teste decorrente desses avisos; o comando terminou com exit code 0. Não foram apagados manualmente arquivos ou perfis antigos.

O DRS foi lido diretamente do conteúdo XML do Word, preservando os identificadores e textos. O renderizador disponível não encontrou o LibreOffice empacotado; não se afirma conferência visual de páginas do DRS. O arquivo original não foi alterado.

## 2. Resultado por arquivo Cypress

Todos os arquivos ficam em `Frontend/cypress/e2e/criacao-pedido`.

| Arquivo | Testes | Finalidade | Resultado desta rodada |
| --- | ---: | --- | --- |
| `00-fluxo-completo.cy.ts` | 1 | Cinco compras demonstram os sete passos mínimos | Passou — 3min52s |
| `01-carrinho.cy.ts` | 2 | Inclusão, quantidade, consulta, remoção e indisponibilidade | Passou — 31s |
| `02-dados-cadastrados.cy.ts` | 1 | Endereço/cartão existentes, frete e consulta após recarga | Passou — 31s |
| `03-novos-dados.cy.ts` | 2 | Novos endereço/cartão, com e sem incorporação | Passou — 2min35s |
| `04-multiplos-cartoes.cy.ts` | 1 | Dois cartões e soma exata | Passou — 27s |
| `05-cartao-e-cupons.cy.ts` | 1 | Promocional + troca + R$ 5 no cartão | Passou — 28s |
| `06-excedente-cupons.cy.ts` | 1 | Crédito excedente e bloqueio de cupom adicional | Passou — 28s |
| `07-validacoes.cy.ts` | 4 | Formulários incompletos, domínio e pagamentos incompatíveis | Passou — 1min42s |
| `08-consultas-e-auditoria.cy.ts` | 1 | Seis consultas ≤ 1s e auditoria no PostgreSQL | Passou — 33s |

O arquivo `00` não comprova sozinho todo o escopo: não remove um item, não executa todas as rejeições e não mede consultas nem consulta logs. Para isso, use também `01`, `07` e `08`, ou execute a pasta inteira.

## 3. Rastreabilidade: requisito, prova e implementação

As referências apontam para linhas conferidas no código desta revisão. Elas podem mudar em futuras edições.

| Requisito | Evidência automatizada | Onde está implementado |
| --- | --- | --- |
| RF0031 — adicionar, alterar, excluir e visualizar carrinho | `00` e `01`; remoção pela interface seguida de recarga | [StorePages.tsx:51](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/StorePages.tsx:51), [CarrinhoService.java:75](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/CarrinhoService.java:75) |
| RF0032 — quantidade na inclusão e no carrinho | Helper escolhe 2 unidades no catálogo e altera para 3 no carrinho; segundo produto é incluído pelos detalhes | [StorePages.tsx:33](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/StorePages.tsx:33), [StorePages.tsx:48](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/StorePages.tsx:48), [StorePages.tsx:55](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/StorePages.tsx:55) |
| RN0031 — não adicionar indisponível/acima do estoque | `01`: botão indisponível, limites do seletor, HTTP 409 para estoque zero e excesso | [CarrinhoService.java:96](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/CarrinhoService.java:96) |
| RF0033 — começar compra a partir do carrinho | `00` e `02`: clique em Finalizar compra no carrinho | [StorePages.tsx:55](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/StorePages.tsx:55), [pedido.ts:78](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/support/pedido.ts:78) |
| RF0035 — endereço existente/novo, incorporação opcional | `02` usa existente; `03` verifica os dois modos e o perfil | [CheckoutPage.tsx:97](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:97), [PedidoService.java:130](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:130) |
| RN0023 — composição obrigatória do endereço | `03` preenche endereço completo; `07` rejeita formulário/payload incompletos | [CustomerFormFields.ts:25](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/components/CustomerFormFields.ts:25), [EnderecoRequest.java:3](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/EnderecoRequest.java:3) |
| RF0034 — frete por itens e destino | `02`: quatro unidades para SP = R$ 20,90; teste Java complementar compara SP/RJ | [FreteService.java:19](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/FreteService.java:19), [PedidoService.java:90](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:90) |
| RF0036 — cartão existente/novo, incorporação opcional | `02` e `03`: consulta após compra confirma vínculo ou somente dados da compra | [CheckoutPage.tsx:111](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:111), [PedidoService.java:144](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:144) |
| RN0024 — número, nome impresso, bandeira e código de segurança | `03` preenche os dados; `07` verifica obrigatoriedade e erro de número inválido | [CustomerFormFields.ts:64](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/components/CustomerFormFields.ts:64), [CartaoService.java:62](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:62) |
| RN0025 — bandeira cadastrada no sistema | `07`: opções da interface; teste Java complementar rejeita domínio inexistente | [CheckoutPage.tsx:37](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:37), [CartaoService.java:64](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:64) |
| RF0037 — combinação de cartões e cupons | `04`, `05` e `06` | [vendaService.ts:27](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/services/vendaService.ts:27), [PedidoService.java:118](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:118) |
| RN0033 — um promocional | `07`: troca seleção anterior; orçamento com dois promocionais retorna 400 | [CheckoutPage.tsx:52](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:52), [PedidoService.java:76](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:76) |
| RN0034 — vários cartões, mínimo R$ 10 | `04` verifica valores e soma; `07` mostra erro abaixo do mínimo sem cupons; teste Java complementa rejeição no servidor | [CheckoutPage.tsx:70](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CheckoutPage.tsx:70), [PedidoService.java:125](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:125) |
| RN0035 — máximo dos cupons e exceção do cartão < R$ 10 | `05`: desconto integral de R$ 77,40 e cartão de R$ 5 | [PedidoService.java:102](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:102), [PedidoService.java:125](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:125) |
| RN0036 — crédito excedente sem cupons desnecessários | `06`: diferença persistida e cupom visível; `07`: combinação redundante retorna 400 | [PedidoService.java:94](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:94), [PedidoService.java:191](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:191) |
| RF0038 — finalizar e registrar EM PROCESSAMENTO | Helper comum a todas as compras: HTTP 201, tela, recarga, nova consulta e ausência de processamento posterior | [PedidoService.java:135](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:135), [pedido.ts:127](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/support/pedido.ts:127) |
| RNF0011 — consultas em até 1 segundo | `08` exige `duration <= 1000` em seis GETs reais | [08-consultas-e-auditoria.cy.ts:9](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/criacao-pedido/08-consultas-e-auditoria.cy.ts:9) |
| RNF0012 — data/hora, responsável e dados das escritas | `08` consulta o banco e exige dados antes/depois, responsável e data; revisão confirma chamadas de auditoria também em endereço/cartão/cupom | [AuditoriaService.java:15](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/shared/service/AuditoriaService.java:15), [BaseModel.java:16](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/shared/model/BaseModel.java:16), [PedidoService.java:164](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:164) |

## 4. O que falar em cada etapa

### Abertura

“Vou demonstrar a criação de pedidos da Tech Store. O domínio é hardware, mas preservamos os RFs e RNs de venda solicitados. O Cypress opera as telas do cliente com API e PostgreSQL reais. A entrega termina em EM PROCESSAMENTO; não vou demonstrar autorização de pagamento, baixa de estoque, expiração ou troca.”

### 1 — Carrinho e disponibilidade

“RF0031 permite adicionar, consultar, alterar e remover; RF0032 permite escolher quantidade na inclusão e depois no carrinho. Adiciono dois produtos, seleciono duas unidades do primeiro e altero para três. A RN0031 é aplicada no backend, não só no botão: excesso ou indisponibilidade devolvem 409, sem aceitar a operação.”

O `00` mostra inclusão/edição; execute também `01` para mostrar remoção e rejeições. Não diga que o `00` remove um item.

### 2 — Começar compra, dados existentes e frete

“RF0033 começa pelo carrinho. RF0035 e RF0036 permitem usar endereço e cartão da conta. RF0034 calcula o frete no servidor com o destino e a quantidade total de unidades.”

Critério adotado: base de R$ 14,90 para SP, R$ 29,90 para outros estados brasileiros e R$ 69,90 para outro país; mais R$ 2 por unidade além da primeira. Não utiliza peso, distância nem cotação de transportadora.

`frete = tarifa do destino + 2 × (unidades − 1)`

Exemplo demonstrado: três unidades de um produto e uma do outro = quatro unidades. Para Arujá/SP: `14,90 + 2 × 3 = R$ 20,90`. Essa fórmula é uma decisão configurável do projeto, não uma regra escrita no DRS. As tarifas estão em [application.properties:19](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/resources/application.properties:19).

### 3 — Novos endereço e cartão

“RN0023 exige tipo de residência, tipo de logradouro, logradouro, número, bairro, CEP, cidade, estado e país. Observações são opcionais. RN0024 exige número do cartão, nome impresso, bandeira e código de segurança; RN0025 exige uma bandeira registrada no sistema.”

“Durante a compra posso marcar Salvar na minha conta. Os dados ficam temporariamente na página e são incorporados ao perfil na transação da finalização. Depois o teste consulta a conta e comprova a gravação. Com a opção desmarcada, o pedido preserva os dados usados, sem acrescentar endereço/cartão ao perfil.”

O formulário tem também identificação do endereço e validade do cartão. Luhn, validade e esses campos auxiliares não devem ser apresentados como exigências da RN0023/RN0024.

### 4 — Dois cartões

“RN0034 permite distribuir o saldo entre cartões, com ao menos R$ 10 em cada um quando não há cupons. A soma precisa fechar o saldo. Há conferência imediata na tela e validação final no Service.”

“O frontend confere a distribuição em centavos; o backend utiliza BigDecimal. Isso evita usar aproximações de ponto flutuante para decidir se o pagamento fecha.”

### 5 — Cupons e cartão de R$ 5

“RF0037 permite a combinação; RN0033 limita um promocional. RN0035 usa o máximo dos cupons e abre a exceção para o cartão abaixo de R$ 10 nessa combinação.”

Na base controlada: produto R$ 67,50 + frete R$ 14,90 = R$ 82,40. Promocional R$ 20 + troca R$ 57,40 = R$ 77,40. Restam R$ 5 no cartão. São preços fictícios para testar a regra, não preços comerciais reais das placas.

“Não estou desrespeitando RN0034: aplico a exceção expressa da RN0035. Sem cupons, a mesma parcela de R$ 5 é rejeitada.”

### 6 — Excedente e cupom de troca

“RN0036 devolve o excedente em um novo cupom. Uso R$ 50 e R$ 60 numa compra de R$ 82,40; a diferença é R$ 27,60. Nenhum desses cupons sozinho cobre a compra, portanto ambos são necessários.”

“Para identificar redundância, o backend calcula se retirar algum cupom ainda deixa os demais cobrindo a compra. Se sim, rejeita. A interface também bloqueia a seleção adicional quando o total já está coberto.”

Não confunda a emissão do crédito desta compra, exigida pela RN0036, com o processo de devolução/troca de produtos, que está fora desta fase.

### 7 — Persistência e status

“RF0038 termina em EM PROCESSAMENTO. O clique gera um POST real; o servidor responde 201. O teste confere o status, recarrega a tela e consulta novamente o pedido. Não chama o endpoint de processamento de pagamento e confirma que a quantidade física do estoque não foi baixada.”

“A transação coordena pedido, itens, dados opcionais de perfil, pagamentos e cupons. Se uma validação ou gravação falhar, o conjunto não é confirmado parcialmente.”

Não clique em Processar pagamento no detalhe do pedido. O botão pertence à etapa seguinte, embora exista no sistema.

### 8 — Requisitos não funcionais

“RNF0011 é aferida com consultas HTTP reais, limitadas a 1000 ms no teste. RNF0012 é comprovada consultando os registros de auditoria persistidos: data/hora, responsável contextual e dados antes/depois.”

O Cypress mostra os tempos no Command Log do teste `08`. O script de auditoria é somente leitura, usa o driver PostgreSQL e não cria um endpoint administrativo para essa comprovação.

Não diga que timeout de 15s da API atende RNF0011: ele trata indisponibilidade e não é uma garantia de consulta em 1s. Não diga que X-Perfil autentica o usuário: é contexto local, conforme a decisão de não implementar login.

## 5. Comandos para a apresentação

Não inicie uma segunda instância se as portas já estiverem ocupadas pelos serviços corretos. PostgreSQL deve estar ativo; não exponha o `.env` na chamada.

Terminal 1 — backend de testes:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e"
```

Terminal 2 — frontend de testes:

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run dev:e2e
```

Terminal 3 — interface do Cypress (prefira esta opção para explicar assertions ao vivo):

```powershell
Set-Location C:\Users\Lucas\Desktop\LES\Ecom\Frontend
Invoke-RestMethod http://localhost:5174/actuator/health
npm run test:e2e:pedido:open
```

Escolha `00-fluxo-completo.cy.ts`; depois `01`, `07` e `08` para completar a comprovação do escopo. Para executar tudo automaticamente com navegador visível:

```powershell
npm run test:e2e:pedido -- --headed
```

Somente caminho feliz, com navegador visível:

```powershell
npm run test:e2e:pedido:completo -- --headed
```

Somente remoção/validações/RNFs, também com navegador visível:

```powershell
npx cypress run --browser edge --headed --spec "cypress/e2e/criacao-pedido/01-carrinho.cy.ts,cypress/e2e/criacao-pedido/07-validacoes.cy.ts,cypress/e2e/criacao-pedido/08-consultas-e-auditoria.cy.ts"
```

`cy.intercept` nesses testes observa as requisições; não fornece respostas mockadas. `cy.wait('@alias')` espera a API real. As pausas de apresentação não substituem asserts. Os POSTs de preparação criam as pré-condições antes da navegação; a finalização é provocada pelo botão na interface.

## 6. Perguntas de código e respostas curtas

| Pergunta | Resposta e referência |
| --- | --- |
| Onde está a API no React? | [vendaService.ts:27](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/services/vendaService.ts:27) centraliza orçamento/finalização; [api.ts:13](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/services/api.ts:13) centraliza fetch, cabeçalho, timeout e erros. |
| Qual é a arquitetura? | View React/MUI → serviços HTTP → Controller REST → Service de negócio → Repository/JPA → PostgreSQL. O Service complementa MVC e coordena regras/transações; o Controller recebe DTO e delega. |
| Posso forjar um preço no navegador? | O servidor lê preços dos produtos persistidos e recalcula em [PedidoService.java:87](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:87). Total/revisão enviados servem para detectar resumo desatualizado, não são fonte de preço. |
| Por que DTO? | [CheckoutRequest.java:10](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/dto/CheckoutRequest.java:10) define os dados de entrada e valida objetos internos com @Valid. Não se devolve o grafo de entidades JPA nem dados secretos. |
| Por que o perfil só recebe dados novos no final? | Incorporação é opcional; a mesma transação evita cadastro parcial de compra que falhou. Sem incorporação, ficam snapshots no pedido/pagamento, sem obrigar vínculo com o perfil. |
| Onde garante o status? | [PedidoService.java:135](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:135) atribui EM PROCESSAMENTO; [PedidoController.java:20](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/controller/PedidoController.java:20) cria a resposta 201. |
| E clique duplicado? | Busy reduz repetição na tela; cliente/chave de operação identifica pedido anterior no Service, e há restrição única no banco. É decisão técnica, não um RF adicional do DRS. |
| O cartão completo/CVV fica no banco ou log? | Não. Há validação transitória, identificação HMAC e últimos dígitos. [CartaoResponse.java:4](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/CartaoResponse.java:4) não contém PAN/CVV. Não é integração real com operadora nem solução de produção. |
| DemoContext/MockEditor significam que tudo é mock? | São nomes legados. O contexto consulta APIs reais, e o editor é formulário reutilizável. Novos dados na memória antes de finalizar são estado de edição, não fallback fictício de API. |

## 7. Limites da comprovação

- O caminho feliz mínimo está no `00`; cobertura de RF0031 completo, rejeições e RNFs depende das suítes adicionais.
- A suíte exercita edição do primeiro produto no catálogo e no carrinho; o seletor nos detalhes do segundo é verificado no valor padrão. Não há teste que altere quantidades de ambos os produtos em todas as telas possíveis.
- RN0023/RN0024 possuem os campos obrigatórios no código, mas o teste negativo de interface não omite individualmente cada campo. Ele verifica logradouro/número ausentes e um payload de endereço incompleto. Isso é cobertura representativa, não exaustiva campo a campo.
- RNF0011 mede seis endpoints localmente, sem teste de carga, percentis ou garantia para toda máquina/rede. O orçamento POST e o tempo total de renderização não são medidos pelo teste `08`.
- RNF0012 verifica diretamente escritas de carrinho/pedido; outros logs são identificados por leitura do código, não todos aferidos por essa task Cypress.
- A identificação obrigatória do endereço, a validade e Luhn são restrições adicionais do projeto, não expressamente exigidas pelos RFs/RNs desta fase. Não as apresente como texto do DRS; se a avaliação exigir retirar qualquer restrição extra, é necessário discutir esse ajuste.
- As consultas de perfil são contextuais, sem autenticação real. Não se deve apresentar a seleção de perfis como controle de acesso seguro.
- Reserva/expiração existem no aplicativo, mas não são demonstradas nem contam como cumprimento deste escopo. Evite deixar a apresentação parada por mais que o prazo do carrinho.
- Testes Java complementares não são testes automatizados de interface e não substituem Cypress.

## 8. Evidências já conferidas nesta rodada

- Pedido 111648: dois produtos, quatro unidades, frete R$ 20,90, EM PROCESSAMENTO. Consulta somente leitura no PostgreSQL encontrou três ALTERAR do carrinho e um FINALIZAR_COMPRA, com responsável correto.
- Pedido 111651: total R$ 82,40, cupons R$ 77,40 e cartão R$ 5, confirmado por nova consulta à API.
- Pedido 111652: total R$ 82,40, zero pagamentos em cartões, crédito R$ 27,60 e cupom SALDO persistido, confirmado por nova consulta à API.
- Pedidos 111654 e 111655: ambos EM PROCESSAMENTO; o primeiro tem endereço/cartão associados ao perfil; o segundo preserva os dados da compra sem IDs de vínculo com o perfil.
- Teste `08`: os seis GETs passaram na condição `duration <= 1000 ms`; os registros de auditoria passaram nas verificações de data, responsável e dados antes/depois. Essa rodada não exportou os tempos individuais do Command Log para um relatório numérico.
- Vídeo do caminho completo: [00-fluxo-completo.cy.ts.mp4](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/videos/00-fluxo-completo.cy.ts.mp4). Vídeos/screenshots são artefatos locais ignorados pelo Git.

Não reutilize IDs desses pedidos como dependência dos testes: cada cenário prepara seus próprios registros.
