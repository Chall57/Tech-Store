# Roteiro de apresentação — cliente real e fluxos Cypress

Este roteiro usa o DRS LES 2 2026 como referência vigente. Toda a suíte de apresentação simula um cliente comum: ela não abre o dashboard nem as telas administrativas. A apresentação principal deve priorizar o CRUD de Cliente; os demais fluxos ficam separados para demonstração complementar ou perguntas do professor.

Organização atual: os fluxos 00–08 ficam em `CRUD Cliente`; os fluxos 09–14 ficam em `testes`; a entrega específica de criação de pedido continua em `criacao-pedido`. Consulte `TESTES_CYPRESS.md` para os comandos e para ajustar o ritmo da apresentação.

## 1. Resultado já verificado

- Build do frontend: aprovado.
- Backend Spring Boot conectado ao PostgreSQL no schema isolado `techstore_e2e`.
- Suítes separadas de apresentação do cliente: 14 arquivos, 18 testes, previamente verificados com sucesso no Edge.
- Suíte adicional `00-cliente-crud-completo.cy.ts`: um teste de ponta a ponta aprovado no Edge, com cadastro, consulta, alteração, inativação e reativação do mesmo cliente. TypeScript e lint também aprovados.
- Os testes usam backend e PostgreSQL reais. Não há fallback para dados mockados.
- Nenhum teste da pasta `CRUD Cliente` visita uma rota `/admin`.
- Cada arquivo produz seu próprio vídeo em `Frontend/cypress/videos`.

## 2. Preparação antes da aula

Use três terminais e mantenha todos abertos durante a apresentação.

### Terminal 1 — backend de teste

```powershell
cd C:\Users\Lucas\Desktop\LES\Ecom\Backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e"
```

O perfil `e2e` usa a porta `8081` e o schema `techstore_e2e`. Isso evita conflito com o backend normal na porta `8080` e separa os dados criados pelos testes.

Confirme a inicialização:

```powershell
Invoke-RestMethod http://127.0.0.1:8081/actuator/health
```

O resultado esperado contém `status: UP`.

### Terminal 2 — frontend apontando para o backend de teste

```powershell
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run dev:e2e
```

O frontend da apresentação ficará em `http://localhost:5174`. O modo `e2e` configura automaticamente o proxy da API para `http://127.0.0.1:8081` no `vite.config.ts`.

### Terminal 3 — Cypress

Modo visual, recomendado para explicar cada teste:

```powershell
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run test:e2e:cliente:open
```

Na janela do Cypress, escolha **E2E Testing**, Microsoft Edge e abra a pasta `CRUD Cliente`. Execute os arquivos na ordem numérica.

CRUD principal pelo terminal:

```powershell
npm run test:e2e:crud
```

Todo o CRUD em uma única suíte, usando o mesmo cliente do início ao fim:

```powershell
npm run test:e2e:crud:completo
```

Para acompanhar o fluxo completo em uma janela visível:

```powershell
npm run test:e2e:crud:completo -- --headed
```

O arquivo `00-cliente-crud-completo.cy.ts` cadastra pela interface (RF0021), consulta após recarga (RF0024), altera nome/e-mail/telefone (RF0022), inativa sem apagar o cadastro (RF0023) e reativa. Cada etapa confere o mesmo identificador e a persistência. O teste não acessa o administrador, não usa respostas mockadas e não depende dos outros testes. As suítes separadas e as validações negativas continuam disponíveis.

Todos os fluxos da apresentação:

```powershell
npm run test:e2e:cliente
```

`test:e2e:apresentacao` permanece como um alias equivalente.

O comando padrão `npm run test:e2e` também executa somente essa suíte de cliente. Os testes antigos de regressão administrativa foram preservados para o desenvolvimento do sistema, mas ficaram fora da apresentação e só rodam quando chamados explicitamente com `npm run test:e2e:regressao`.

Um único fluxo, visível no Edge:

```powershell
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/CRUD Cliente/01-cliente-cadastro.cy.ts"
```

Troque somente o nome do arquivo para executar outro fluxo. Exemplos:

```powershell
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/CRUD Cliente/02-cliente-consulta.cy.ts"
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/CRUD Cliente/03-cliente-alteracao.cy.ts"
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/CRUD Cliente/04-cliente-inativacao.cy.ts"
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/CRUD Cliente/05-cliente-validacoes.cy.ts"
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/testes/10-compra.cy.ts"
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/testes/11-cupons-no-pedido.cy.ts"
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/testes/13-troca-pedido.cy.ts"
```

Se o professor quiser apenas o relatório no terminal, retire `--headed`. Para gerar XML JUnit:

```powershell
npm run test:e2e:crud -- --reporter junit --reporter-options "mochaFile=cypress/results/crud-[hash].xml,toConsole=true"
```

## 3. Roteiro oral recomendado

### Abertura — aproximadamente 40 segundos

> “A demonstração usa o DRS LES 2 2026. O fluxo é React, API REST do Spring Boot, Service, Repository e PostgreSQL. O Cypress opera somente as telas disponíveis ao cliente. Não há validação de login, conforme o escopo definido para o projeto: a seleção de perfil identifica o cliente local. O cadastro completo aparece somente nos cenários que o avaliam; os demais testes preparam um cliente isolado pela API e começam diretamente na tela da ação demonstrada.”

Mostre rapidamente:

- frontend em `5174`;
- backend saudável em `8081`;
- pasta `Frontend/cypress/e2e/CRUD Cliente`;
- nomes dos testes com os IDs do DRS.

### Bloco 1 — cadastrar cliente

Execute `01-cliente-cadastro.cy.ts`.

Requisitos demonstrados:

- RF0021: cadastrar cliente;
- RN0021: manter endereço de cobrança;
- RN0022: manter endereço de entrega;
- RN0023: campos obrigatórios do endereço;
- RN0026: dados obrigatórios do cliente;
- RNF0031 e RNF0032: força e confirmação da senha;
- RNF0033: proteção da senha;
- RNF0035: código único.

Fala sugerida:

> “O teste preenche o formulário como usuário, observa o POST real e exige HTTP 201. A aplicação seleciona o cliente criado e abre diretamente a própria conta. Depois o teste valida o UUID, verifica que senha e hash não estão na resposta, recarrega a página e consulta o mesmo cliente. O reload prova persistência, e não apenas estado mantido pelo React.”

Código principal:

- teste: `Frontend/cypress/e2e/CRUD Cliente/01-cliente-cadastro.cy.ts:5`;
- rota REST: `Backend/src/main/java/com/lucas/ecomm/cliente/controller/ClienteController.java:17`;
- cadastro transacional e hash: `Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:81`;
- formulário React: `Frontend/src/pages/CustomerPages.tsx:27`;
- UUID: `Backend/src/main/java/com/lucas/ecomm/shared/model/BaseModel.java:9`.

### Bloco 2 — cliente consulta a própria conta

Execute `02-cliente-consulta.cy.ts`.

> “O teste prepara um cliente exclusivo pela API, seleciona esse perfil e abre diretamente a tela Conta. A ação demonstrada é somente a consulta: o Cypress observa o GET real pelo identificador único, confere nome, e-mail, CPF e código e recarrega a tela. Nenhum dado vem de array local e nenhuma tela administrativa é acessada.”

Observação de escopo: a listagem e os filtros gerais previstos no RF0024 continuam implementados no backend e na gestão da loja, mas não são acionados nesta demonstração porque permitiriam consultar outros clientes. Neste roteiro, a evidência de interface do RF0024 é a consulta do próprio cadastro.

Código principal:

- teste: `Frontend/cypress/e2e/CRUD Cliente/02-cliente-consulta.cy.ts:5`;
- endpoint: `ClienteController.java:14` e `ClienteController.java:16`;
- consulta por identificador: `ClienteService.java` no método `consultar`;
- tela do próprio cliente: `AccountPage` em `Frontend/src/pages/CustomerPages.tsx`;
- chamada HTTP centralizada: `Frontend/src/services/clienteService.ts:21` e `:22`.

### Bloco 3 — alterar dados

Execute `03-cliente-alteracao.cy.ts`.

> “O RF0022 é demonstrado por uma alteração real via PUT na própria conta. O teste muda nome e telefone, espera a resposta 200, recarrega e também consulta a API. O ID é comparado antes e depois para provar que houve atualização do mesmo registro, não criação de outro.”

Código principal:

- teste: `03-cliente-alteracao.cy.ts:5`;
- rota: `ClienteController.java:20`;
- regra: `ClienteService.java:98`;
- formulário: `CustomerPages.tsx:48` e `:56`;
- serviço React: `clienteService.ts:24`.

### Bloco 4 — inativar sem excluir

Execute `04-cliente-inativacao.cy.ts`.

> “O RF0023 fala em inativação. Por isso não criamos DELETE de Cliente. Na própria conta, o PATCH muda o campo `ativo`, mas mantém ID, dados e histórico. O teste recarrega, consulta o mesmo registro ainda existente e depois o reativa. Excluir fisicamente quebraria referências de pedido e auditoria.”

Código principal:

- teste: `04-cliente-inativacao.cy.ts:5`;
- endpoints PATCH: `ClienteController.java:21` e `:22`;
- alteração de status: `ClienteService.java:106`;
- mensagem explícita da interface: `CustomerPages.tsx:60`;
- tratamento de tentativa de método indevido: `ApiExceptionHandler.java:32` e `:33`.

Resposta curta se o professor disser que CRUD exige exclusão:

> “Neste domínio, o D de CRUD é atendido pela exclusão lógica especificada como inativação no RF0023. O registro não pode ser apagado porque mantém integridade referencial e histórico. O comportamento correto do requisito prevalece sobre um DELETE físico genérico.”

### Bloco 5 — regras e mensagens de validação

Execute `05-cliente-validacoes.cy.ts`.

> “Aqui estão as principais regras negativas: obrigatoriedade, CPF válido, senha forte, confirmação coincidente e unicidade de CPF/e-mail. O navegador ajuda com campos `required`, mas o backend repete as regras e é a fonte final de validação. Assim, uma requisição direta não consegue contornar o sistema.”

Código principal:

- DTO e Bean Validation: `ClienteRequest.java:7` a `:16`;
- CPF: `ValidacaoCliente.java:6` a `:16`;
- senha: `ValidacaoCliente.java:18` a `:23`;
- duplicidade: `ClienteService.java:70` a `:78`;
- validação React: `CustomerFormFields.ts:20` a `:23`;
- respostas 400/409: `ApiExceptionHandler.java:18` a `:29`.

### Fechamento do CRUD

> “Os quatro fluxos funcionais do CRUD foram executados separadamente e as regras negativas também. A mesma informação aparece na interface, na resposta HTTP e após recarga, demonstrando o caminho completo React → Spring → JPA → PostgreSQL e de volta ao React.”

## 4. Fluxos complementares separados

| Arquivo Cypress | Fluxo | Requisitos destacados |
|---|---|---|
| `06-cliente-enderecos.cy.ts` | cadastrar e alterar endereço; impedir retirada do último obrigatório | RF0026, RN0021–RN0023, RNF0034 |
| `07-cliente-cartoes.cy.ts` | dois cartões, preferência única e retorno seguro | RF0027, RN0024, RN0025 |
| `08-cliente-senha-historico.cy.ts` | senha independente, transações e ranking | RF0025, RF0028, RN0027, RNF0031–RNF0033 |
| `09-carrinho.cy.ts` | adicionar item e alterar quantidade persistida | RF0031, RF0032, RN0031, RN0032 |
| `10-compra.cy.ts` | endereço novo, cupom e dois cartões | RF0033–RF0038, RN0033, RN0034 |
| `11-cupons-no-pedido.cy.ts` | vários cupons e crédito do excedente | RN0036 |
| `12-pedidos.cy.ts` | compra, consulta do próprio pedido e cancelamento pelo cliente | RF0033, RF0038 e cancelamento do pedido |
| `13-troca-pedido.cy.ts` | solicitação de troca e informação do despacho pelo cliente | RF0041 e RF0043 |
| `14-pagamento-recusado.cy.ts` | pagamento local recusado, liberação e ausência de baixa | RN0028, RN0038 |

Esses testes existem em arquivos distintos para que um fluxo com falha ou maior duração não esconda o resultado dos outros, e para permitir execução sob demanda.

## 5. Matriz do módulo Cliente: DRS, teste e implementação

| ID | O que o DRS exige | Evidência Cypress | Implementação principal |
|---|---|---|---|
| RF0021 | Cadastrar cliente | `01-cliente-cadastro.cy.ts:5` | `ClienteController.java:17`; `ClienteService.java:81` |
| RF0022 | Alterar dados cadastrais | `03-cliente-alteracao.cy.ts:5` | `ClienteController.java:20`; `ClienteService.java:98` |
| RF0023 | Inativar cliente | `04-cliente-inativacao.cy.ts:5` | `ClienteController.java:21`; `ClienteService.java:106` |
| RF0024 | Consultar cliente; nesta suíte, o próprio cadastro | `02-cliente-consulta.cy.ts:5` | `ClienteService.java` nos métodos `consultar` e `listar` |
| RF0025 | Disponibilizar transações na ficha | `08-cliente-senha-historico.cy.ts:21` | `ConsultaVendaService.java:68`; `CustomerDetails` em `CustomerPages.tsx:35` |
| RF0026 | Manter vários endereços identificados | `06-cliente-enderecos.cy.ts:5` | `EnderecoService.java:40`; `AddressesPage` em `CustomerPages.tsx:73` |
| RF0027 | Manter cartões e um preferencial | `07-cliente-cartoes.cy.ts:5` | `CartaoService.java:62` e `:81`; `CardsPage` em `CustomerPages.tsx:85` |
| RF0028 | Alterar somente a senha | `08-cliente-senha-historico.cy.ts:5` | `ClienteController.java:23`; `ClienteService.java:113` |
| RN0021 | Pelo menos um endereço de cobrança | `06-cliente-enderecos.cy.ts:5` | `EnderecoService.java:30` |
| RN0022 | Pelo menos um endereço de entrega | `06-cliente-enderecos.cy.ts:5` | `EnderecoService.java:30` |
| RN0023 | Campos completos do endereço | `01-cliente-cadastro.cy.ts:5` e `06-cliente-enderecos.cy.ts:5` | `EnderecoRequest`; `EnderecoService.java:23` |
| RN0024 | Número, titular, bandeira e código do cartão | `07-cliente-cartoes.cy.ts:5` | `CartaoService.java:42` e `:62` |
| RN0025 | Bandeira deve estar cadastrada | `07-cliente-cartoes.cy.ts:5` | `CartaoService.java:65` |
| RN0026 | Dados obrigatórios do cliente | `05-cliente-validacoes.cy.ts:5` | `ClienteRequest.java:7`; `ClienteService.java:70` |
| RN0027 | Ranking numérico | `08-cliente-senha-historico.cy.ts:21` | `ClienteService.java:31` |
| RN0028 | Baixar estoque apenas após aprovação | `10-compra.cy.ts:13` e `14-pagamento-recusado.cy.ts:5` | `PedidoService.java:144`, `:159` e `:190` |
| RNF0031 | Senha forte | `05-cliente-validacoes.cy.ts:16` | `ValidacaoCliente.java:18`; `CustomerFormFields.ts:20` |
| RNF0032 | Confirmação da senha | `05-cliente-validacoes.cy.ts:16` | `ValidacaoCliente.java:23`; `CustomerFormFields.ts:23` |
| RNF0033 | Senha protegida | `01-cliente-cadastro.cy.ts:14` e `08-cliente-senha-historico.cy.ts:16` | BCrypt custo 12 em `ClienteService.java:21`, hash em `:86` e `:115`; DTO seguro em `ClienteResponse.java:5` |
| RNF0034 | Endereço alterado independentemente | `06-cliente-enderecos.cy.ts:5` | API separada em `clienteService.ts:28`; `EnderecoService.java:40` |
| RNF0035 | Código único | `01-cliente-cadastro.cy.ts:12` | UUID em `BaseModel.java:9` e PK no PostgreSQL |

Observação importante sobre RNF0033: o Cypress comprova que senha/hash não vazam pela interface ou API. O fato de o valor persistido ser BCrypt é uma regra interna e deve ser mostrado no código ou no teste de integração `Backend/src/test/java/com/lucas/ecomm/cliente/ClienteIntegrationTests.java`.

## 6. Como explicar as linhas dos testes Cypress

Use esta leitura para qualquer arquivo da pasta de apresentação:

- `/// <reference types="cypress" />`: carrega tipos e autocompletar do Cypress para o TypeScript.
- `import { ... } from '../../support/data'`: reutiliza criação de dados válidos e ações repetidas; evita duplicação.
- `describe('Fluxo...', () => {})`: agrupa testes do mesmo fluxo de negócio.
- `it('RF... RN...', () => {})`: declara um cenário independente. Os IDs no nome tornam a cobertura rastreável durante a apresentação.
- `registerCustomerThroughUi()`: cadastra pela tela, aguarda HTTP 201 e só libera o teste após a navegação para `/conta`.
- `apiCustomer()`: prepara um cliente válido e isolado pela API quando o cadastro não é o objeto do teste; assim, consulta, alteração e inativação começam diretamente em seus próprios fluxos.
- `apiProduct()`, `apiCoupon()` e semelhantes: criam somente pré-condições que não são o objeto do cenário. A operação avaliada continua sendo executada pela interface.
- `cy.visit('/rota')`: abre a rota real do React.
- `selectProfile(id, rota)`: registra o perfil na sessão local e abre a tela. Isso representa a decisão do projeto de não implementar autenticação.
- `cy.get(...)` e `cy.contains(...)`: localizam componentes por seletor, papel, rótulo ou texto visível.
- `.within(...)`: limita as buscas ao formulário ou cartão correto, evitando clicar em um elemento homônimo fora daquele componente.
- `.click()`, `.type()`, `.select()` e `.check()`: simulam ações reais de interface.
- `cy.intercept(...).as('nome')`: observa a requisição real. Como não foi fornecida uma resposta falsa, ele não cria mock.
- `cy.wait('@nome')`: sincroniza o teste com a conclusão da chamada HTTP; é mais confiável do que esperar um tempo fixo.
- `.should(...)`: asserção com repetição automática enquanto a interface atualiza.
- `expect(...)`: asserção imediata sobre um valor que já foi recebido.
- `cy.reload()`: descarta o estado momentâneo do componente e demonstra que os dados voltam do backend.
- `cy.request(...)`: verificação complementar da persistência e do contrato HTTP. Não substitui a ação de interface do cenário.
- `.then(valor => {})`: continua o encadeamento quando o resultado anterior é necessário para os próximos passos.

### Exemplo de leitura do cadastro

No arquivo `01-cliente-cadastro.cy.ts`:

1. O helper preenche o formulário com dados válidos e únicos.
2. Ele observa o `POST /api/clientes` sem substituí-lo e clica em “Cadastrar e acessar conta”.
3. O teste exige `201`, UUID e ausência de dados sensíveis.
4. A aplicação seleciona o novo perfil e navega para `/conta`.
5. A tela exibe nome, código e status do cadastro.
6. O teste recarrega a página e consulta o backend para comprovar a persistência.

### Exemplo de leitura da inativação

No arquivo `04-cliente-inativacao.cy.ts`:

1. `apiCustomer()` prepara um cliente exclusivo sem repetir visualmente o fluxo de cadastro.
2. `selectProfile(cliente.id)` abre diretamente `/conta`, que é o ponto inicial da ação avaliada.
3. `cy.intercept('PATCH', .../inativar)` prova qual endpoint a tela Conta utiliza.
4. O Cypress abre a confirmação e clica em “Confirmar inativação”.
5. A resposta precisa ser `200` e o botão passa a ser “Reativar cliente”.
6. Após `reload`, o status continua “Inativo”.
7. `GET /api/clientes/{id}` ainda devolve o mesmo ID com `ativo=false`: isso prova que não houve exclusão.
8. Por fim, o teste reativa o registro pela própria conta para demonstrar reversibilidade.

## 7. Por que o código foi estruturado dessa forma

### Arrange, Act, Assert

Cada teste segue três partes:

1. Arrange: cria pré-condições únicas.
2. Act: executa a ação na interface.
3. Assert: verifica interface, HTTP e persistência.

Essa separação facilita identificar exatamente qual requisito falhou.

### Dados únicos e independência

`Frontend/cypress/support/data.ts` gera CPF válido, e-mail e nome únicos. Um teste não precisa reutilizar o cliente criado por outro. Isso permite rodar qualquer arquivo isoladamente e reduz falhas causadas pela ordem de execução.

### API para preparação, interface para comprovação

Somente `01-cliente-cadastro.cy.ts` e as validações específicas de cadastro de `05-cliente-validacoes.cy.ts` percorrem o formulário de cadastro. Consulta, alteração, inativação e os demais fluxos preparam os registros necessários pela API e abrem diretamente a página da ação avaliada. Essas chamadas representam o `Arrange` do teste; a operação exigida pelo RF/RN continua sendo executada e comprovada pela interface.

### Sem `setTimeout` fixo

Os testes sincronizam com requisições por `cy.intercept`/`cy.wait` e com o DOM por `.should`. Esperas fixas seriam frágeis em computadores mais lentos ou mais rápidos.

### Validação em duas camadas

O React fornece retorno imediato, mas o Spring valida novamente. O backend é a fonte final da regra de negócio. O PostgreSQL ainda reforça CPF/e-mail únicos e chaves estrangeiras.

### DTO em vez de devolver entidade

`ClienteResponse` não possui senha ou hash. Isso evita referência circular, payload excessivo e vazamento de segredo. O frontend recebe somente o que precisa exibir.

### Inativação em vez de DELETE

`ClienteModel.ativo` preserva o registro e seus vínculos. Não existe `@DeleteMapping` em `ClienteController`. A decisão segue RF0023 e evita perder histórico de pedidos, pagamentos e trocas.

### Perfil de teste e schema separado

O perfil `e2e` usa portas e schema próprios. Os testes podem inserir dados sem misturá-los à base utilizada na demonstração manual.

## 8. Perguntas prováveis do professor

**“O Cypress está usando mock?”**

> “Não. `cy.intercept` apenas observa a requisição porque não recebe uma resposta simulada. O `reload` e as consultas à API comprovam persistência no PostgreSQL.”

**“Por que usar API para criar a pré-condição?”**

> “Para manter o teste focado e independente. O cadastro via tela tem um cenário próprio. No teste de alteração, a criação é preparação e a alteração é a ação de interface avaliada.”

**“Onde está a regra de senha?”**

> “No frontend em `CustomerFormFields.ts:20`, para retorno imediato, e no backend em `ValidacaoCliente.java:18`, que é a validação autoritativa. O hash BCrypt é feito em `ClienteService.java:86` e `:115`.”

**“Como prova que inativar não exclui?”**

> “Depois do PATCH, o teste consulta o mesmo ID e recebe o cliente com `ativo=false`. Também recarrega a própria conta e mantém os dados visíveis. O controller não possui rota DELETE.”

**“Por que o teste recarrega a página?”**

> “Sem recarga, o dado poderia existir apenas no estado React. Com recarga, a tela precisa buscar novamente no backend e no PostgreSQL.”

**“Como o cartão é protegido?”**

> “O projeto acadêmico não processa cobrança real. O backend valida Luhn/CVV, guarda somente os quatro últimos dígitos e uma impressão HMAC para detectar duplicidade. PAN e CVV não são retornados nem armazenados como texto.”

**“A RNF0033 fala em criptografia. Por que BCrypt?”**

> “Para senha, a prática correta é hash unidirecional com salt, não criptografia reversível. Usamos BCrypt com custo 12. A API nunca devolve senha nem hash.”

**“Por que a compra e o pagamento são simulados?”**

> “O projeto é acadêmico e local. O processador é determinístico para testar aprovação e recusa, sem dados ou transações financeiras reais. As regras de estoque, cupom e status continuam persistidas.”

## 9. Plano de contingência

Se um serviço não responder:

```powershell
Invoke-RestMethod http://127.0.0.1:8081/actuator/health
Invoke-WebRequest http://127.0.0.1:5174 -UseBasicParsing
```

Se a porta estiver ocupada:

```powershell
Get-NetTCPConnection -LocalPort 8081,5174 -State Listen | Select-Object LocalPort,OwningProcess
```

Reinicie apenas o processo da porta necessária. Não altere as portas do roteiro no meio da apresentação, porque `cypress.config.ts` já está configurado para `5174` e as tarefas de preparação para `8081`.

Se não houver tempo para todos os fluxos, apresente nesta ordem:

1. `01-cliente-cadastro.cy.ts`;
2. `02-cliente-consulta.cy.ts`;
3. `03-cliente-alteracao.cy.ts`;
4. `04-cliente-inativacao.cy.ts`;
5. `05-cliente-validacoes.cy.ts`.

Os demais arquivos e vídeos servem como evidência complementar.
