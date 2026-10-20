# Tech Store — roteiro de apresentação do CRUD de Cliente

Base: DRS_LES_2_2026 e implementação existente do app. O responsável confirmou que a menção à versão 1 nas instruções do mentor corresponde à versão 2 utilizada no projeto. Revisão em 18/09/2026. Este roteiro prioriza a manutenção de clientes exigida pelo mentor; pedidos, trocas, estoque e análise são complementos. Não é uma declaração de atendimento integral do sistema.

## 1. A estratégia para apresentar

Para cada funcionalidade, explique nesta ordem: **qual requisito atende → qual teste o comprova → onde a regra está no código → qual efeito produz no banco**. Evite navegar manualmente como comprovação: quem preenche, clica e verifica os resultados deve ser o Cypress. Você pode abrir o código e explicar enquanto o teste roda.

Não tente decorar linhas inteiras. Memorize três ideias: a tela orienta o usuário; o Service decide a regra; o banco garante a integridade. Um requisito pode estar distribuído em várias camadas, não em uma única função.

Para atender aos critérios do mentor, apresente os **12 cenários de Cliente/histórico**, explicando os IDs antes de cada grupo. Acrescente o cenário de checkout relacionado à RN0028 para cobrir também essa regra do grupo Cliente. Não é necessário gastar a apresentação executando estoque/produtos/análise: a suíte completa fica como evidência complementar. Testes JUnit não substituem demonstração automatizada de interface.

Use os nomes e IDs reais do documento. “Validação de cliente” é uma explicação genérica; “RN0026 no `ClienteRequest` e no cadastro transacional do `ClienteService`” é uma resposta rastreável.

## 2. Preparação: como executar o Cypress

### Antes de começar

- PostgreSQL deve estar em execução, e o banco local configurado deve existir. O usuário do banco precisa ter permissão para criar o schema de testes.
- Use JDK 25, Node.js e PowerShell 7 (`pwsh.exe`). A configuração Cypress chama scripts PowerShell para preparar os históricos fictícios persistidos.
- Mantenha o `.env` local da raiz com `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` e `CARD_TOKEN_KEY`. A chave de identificação dos cartões precisa ter pelo menos 32 caracteres. Não mostre senhas/chaves na apresentação e não envie o `.env` ao GitHub.
- As dependências já estão instaladas neste ambiente. Em uma cópia nova, execute `npm ci` em `Frontend`; o Maven Wrapper baixa as dependências do backend na primeira execução.
- Não apague tabelas para repetir os testes. Os cenários criam registros próprios; as preparações do Lucas/admin são idempotentes. O schema E2E acumula dados de teste e não é limpo automaticamente entre execuções.

### Terminal 1 — backend isolado para testes

```powershell
cd C:\Users\Lucas\Desktop\LES\Ecom\Backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e"
```

Espere a mensagem de aplicação iniciada. O perfil `e2e` usa **porta 8081** e **schema `techstore_e2e`** no mesmo PostgreSQL, separando os dados das tabelas `public` usadas pelo app normal. As credenciais vêm da configuração local; os serviços e regras são os mesmos, não uma API falsa.

Configuração: [application-e2e.properties](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/resources/application-e2e.properties:1).

Para conferir a disponibilidade:

```powershell
Invoke-RestMethod http://127.0.0.1:8081/actuator/health
```

### Terminal 2 — frontend apontado para esse backend

```powershell
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
$env:API_PROXY_TARGET = 'http://127.0.0.1:8081'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Abra `http://localhost:5174` se quiser acompanhar o ambiente. O Cypress já está configurado para essa URL. Não misture o frontend de testes em 5174 com a API normal em 8080.

Configurações: [vite.config.ts](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/vite.config.ts:8) e [cypress.config.ts](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress.config.ts:7).

### Terminal 3 — demonstração visual automatizada

```powershell
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run test:e2e:open
```

Na janela Cypress: selecione **E2E Testing → Edge → Start E2E Testing → clientes.cy.ts**. Não escolha Component Testing: a exigência é exercitar a interface com API e banco reais. Depois execute `perfil-lucas.cy.ts` para demonstrar histórico e ranking. A seleção dos arquivos no runner é manual; as operações do sistema dentro dos testes são automatizadas.

Para executar os mesmos dois arquivos por comando, com o navegador visível:

```powershell
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/testes/clientes.cy.ts,cypress/e2e/testes/perfil-lucas.cy.ts"
```

Esses arquivos têm **12 testes: 11 de Cliente e 1 do histórico do Lucas**. Para complementar a RN0028, execute também `checkout.cy.ts`, que testa aprovação/recusa e o momento da baixa de estoque. Não diga que os 12 testes, sozinhos, cobrem essa regra financeira.

Para executar essa seleção ampliada, com **18 testes**, use:

```powershell
npm run test:e2e -- --browser edge --headed --spec "cypress/e2e/testes/clientes.cy.ts,cypress/e2e/testes/perfil-lucas.cy.ts,cypress/e2e/testes/checkout.cy.ts"
```

Para executar todos os módulos em modo headless:

```powershell
npm run test:e2e -- --browser edge
```

A suíte completa tem 6 arquivos e 27 testes. O resultado válido é o resumo final com falhas zero e código de saída zero; uma tela bonita ou um screenshot não substitui as assertivas.

### Evidências para guardar

O modo `cypress run` gera vídeos e capturas de falhas. Para produzir também relatórios JUnit separados, use:

```powershell
npm run test:e2e -- --browser edge --reporter junit --reporter-options "mochaFile=cypress/results/apresentacao/resultado-[hash].xml,toConsole=true" --config "videosFolder=cypress/results/apresentacao/videos,screenshotsFolder=cypress/results/apresentacao/screenshots"
```

Guarde o resumo, os XMLs e os vídeos da execução real. Os títulos dos cenários já indicam os RFs/RNs relacionados. As pastas de resultados estão ignoradas pelo Git.

Se uma porta estiver ocupada, identifique o processo antes de decidir encerrá-lo:

```powershell
Get-NetTCPConnection -State Listen -LocalPort 8081 | Select-Object LocalAddress,LocalPort,OwningProcess
Get-Process -Id <PID_ENCONTRADO>
```

Não encerre qualquer processo apenas para liberar a porta. Também não troque só a porta da API sem ajustar o proxy e os scripts de preparação.

## 3. Roteiro falado, em ordem

Tempo de fala sugerido: aproximadamente 10–15 minutos, além do tempo de execução dos testes e das perguntas. Execute a suíte antes da aula para conhecer sua duração naquele computador.

### Abertura — contexto e escopo

> “A Tech Store é um e-commerce de hardware acessado em navegador desktop. Nesta entrega, o foco é a gestão de clientes: cadastrar, consultar, alterar e inativar, mantendo endereços, cartões e histórico. As operações utilizam API Spring Boot e persistência no PostgreSQL. Vou demonstrá-las com testes automatizados de interface no Cypress e mostrar a correspondência com os requisitos.”

> “A seleção de Lucas Paulino e Administrador é uma simplificação de escopo autorizada. Não implementamos login nem autenticação. Isso não elimina as validações cadastrais: dados obrigatórios, senha forte, confirmação e hash continuam presentes por exigência dos requisitos.”

Não chame essa seleção de autenticação, sessão autenticada ou controle de acesso seguro. O ID guardado no navegador apenas escolhe qual cliente está em uso.

### Bloco 1 — arquitetura antes da demonstração

> “Mantivemos o MVC com uma View React separada e Controllers REST no Spring MVC. O Model contém as entidades e o estado persistente. Dentro do backend, a organização em Controller, Service e Repository separa HTTP, regras de negócio e acesso ao banco. O PostgreSQL também impõe chaves e restrições; não dependemos apenas dos formulários.”

Fluxo de cadastro:

```text
CustomerRegistrationPage → clienteService.ts → api.ts
    → ClienteController → ClienteService → ClienteRepository/JPA → PostgreSQL
```

Na consulta, os dados voltam pelo Repository/Service/Controller, são convertidos para DTO e chegam ao React. O frontend não consulta PostgreSQL diretamente. Não é um MVC tradicional com páginas HTML renderizadas pelo servidor; é a aplicação do MVC ao backend REST com apresentação desacoplada.

Os pacotes `cliente`, `catalogo`, `venda` e `shared` organizam o backend por domínio, mantendo camadas internas. Endereço e Cartão têm `@ManyToOne` para Cliente: cada registro tem um dono, e um cliente pode ter vários. Não é necessário manter uma coleção bidirecional em `ClienteModel` para essa relação existir. Pedidos também pertencem ao cliente; a troca pertence a um item do pedido, permitindo recuperar seu cliente sem criar um segundo vínculo contraditório. Cupons de troca pertencem ao cliente; promocionais podem ser gerais. As FKs representam essas diferenças.

Abra [ClienteController.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/controller/ClienteController.java:14), [ClienteService.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:16) e [ClienteRepository.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/repository/ClienteRepository.java:6). Mostre a separação, sem ler todos os getters.

### Bloco 2 — cadastro, consulta, alteração e inativação

Execute `clientes.cy.ts`. O primeiro cenário inicia em [clientes.cy.ts](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:5).

> “Este cenário valida RF0021, RF0022, RF0023 e RF0024. O Cypress preenche o cadastro, observa a resposta real 201, abre a ficha e recarrega a página. Depois altera nome e telefone, recarrega novamente, inativa e reativa. Verificamos que o mesmo registro permanece consultável no backend.”

No código, aponte `cadastrar`, `alterar` e `ativar` em `ClienteService`. Destaque:

- O cadastro valida a senha e as finalidades dos endereços antes de concluir a transação.
- `@Transactional` impede deixar um cliente sem seus endereços caso alguma etapa falhe.
- O PUT de dados pessoais não altera senha/endereço por acidente: existem operações independentes.
- Inativação muda `ativo=false`; não usa `DELETE`. Preserva pedidos, pagamentos e vínculos. Reativação muda `ativo=true` no mesmo UUID.

> “Escolhemos inativação porque o RF0023 pede isso. Excluir fisicamente um cliente com pedidos comprometeria o histórico e as referências. O CRUD utiliza a manutenção prevista no requisito, não precisa apagar o registro para ser apresentado como completo.”

Complemento, se perguntado: o cliente inativo continua consultável, mas os serviços de carrinho/compra bloqueiam novas operações comerciais desse cadastro. Reativar é uma funcionalidade adicional e não substitui demonstrar a inativação.

### Bloco 3 — validações e pesquisa

Comente os cenários de filtros, campos obrigatórios, CPF, senha e duplicidade. Não pule os negativos para mostrar apenas sucesso.

> “A RN0026 exige os dados cadastrais. O DTO valida presença, e-mail, nascimento e telefone. O Service normaliza CPF/e-mail, valida os dígitos do CPF e impede duplicidade. O banco reforça a unicidade. Portanto, enviar uma requisição fora do React não permite contornar as regras.”

Mostre [ClienteRequest.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/ClienteRequest.java:6), [ValidacaoCliente.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ValidacaoCliente.java:6) e [ClienteService.preencher](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:70).

> “No RF0024, os filtros preenchidos são combinados por AND. Não é uma busca apenas no array exibido: o backend constrói os predicados JPA, consulta o PostgreSQL e devolve os resultados. CPF com pontuação é normalizado.”

Exemplo de resposta a uma pergunta: “CPF inválido retorna 400; CPF ou e-mail duplicado retorna 409; cliente inexistente retorna 404.” Nome, CPF e e-mail obrigatórios fazem parte da manutenção; unicidade e checksum também atendem às restrições adicionais solicitadas para esta implementação.

### Bloco 4 — endereços

> “RF0026 permite vários endereços, cada um identificado por um nome curto. RN0021 e RN0022 exigem manter cobrança e entrega, e RN0026 exige endereço residencial. Um único endereço pode exercer as três funções: são finalidades, não necessariamente três residências diferentes.”

> “O teste tenta excluir o único endereço obrigatório e recebe erro. Em seguida cria outro, altera e exclui esse registro sem modificar os dados pessoais. Isso demonstra também a manutenção independente exigida por RNF0034.”

Mostre [EnderecoService.validarFuncoes](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/EnderecoService.java:30) e [EnderecoRequest.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/EnderecoRequest.java:3). Os campos obrigatórios são validados pelo DTO; observações são opcionais.

O cadastro também testa atomicidade: ao faltar finalidade obrigatória, o cliente inteiro é rejeitado, em vez de gravar um cadastro incompleto.

### Bloco 5 — cartões

> “RF0027 permite múltiplos cartões e um preferencial. RN0024 valida os dados de entrada, e RN0025 restringe a bandeira ao domínio cadastrado. O teste cadastra dois cartões fictícios, troca a preferência, rejeita duplicidade, recarrega a tela e confirma que só um permanece preferencial.”

Mostre [CartaoService.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:42) e [índice de preferência única](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/resources/db/migration/V1__base_clientes_e_comercio.sql:217).

> “Número completo e CVV são validados na entrada, mas não armazenados. Persistimos titular, bandeira, validade, últimos quatro dígitos e uma identificação HMAC para detectar duplicidade. Essa identificação é local, não um token de adquirente, e o sistema não é uma solução de pagamento certificada. Só usamos cartões fictícios.”

O teste de número inválido/CVV incompleto complementa o fluxo positivo. A rejeição explícita de bandeira inexistente está comprovada no teste de integração do backend; a interface oferece apenas bandeiras cadastradas. Não apresente isso como um cenário negativo de UI já existente.

### Bloco 6 — senha, histórico e ranking

> “RF0028 é a alteração independente de senha. RNF0031 exige força, RNF0032 exige confirmação e RNF0033 exige proteção no armazenamento. Usamos BCrypt, que é hash de mão única com salt e custo 12, não criptografia reversível. A senha e o hash não entram na resposta de consulta nem na auditoria.”

Mostre [alterarSenha](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:113), [ClienteResponse.java](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/ClienteResponse.java:5) e o cenário de senha. O Cypress comprova a operação e ausência de segredo no retorno; o teste de integração complementa a comprovação de hash no PostgreSQL.

Depois execute `perfil-lucas.cy.ts`:

> “RF0025 exige registro das transações do cliente. O histórico fictício do Lucas está persistido no PostgreSQL, não fixo em um componente. O teste consulta pedidos, pagamentos, trocas, cupons e atividades. Para RN0027, adotamos como ranking a quantidade de pedidos aprovados, em transporte ou entregues, porque o documento não detalha a fórmula.”

Esse cenário prepara o histórico duas vezes e verifica que a reexecução não duplica a massa. A linha do tempo exibe até 50 atividades recentes; a consulta dos pedidos e pagamentos não fica limitada a essas 50 entradas.

### Bloco 7 — RN0028 e encerramento

Se a cobrança incluir todas as RNs do grupo Cliente, execute `checkout.cy.ts`, especialmente o cenário [RN0028/RN0038](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/checkout.cy.ts:113).

> “RN0028 diz respeito à baixa do estoque após autorização. Reservar não é baixar: na aprovação simulada a quantidade física diminui; na recusa a reserva e o cupom são liberados. Não existe cobrança financeira real neste projeto.”

> “O CRUD de Cliente está integrado e os fluxos principais possuem testes automatizados. O resultado de cada execução e os IDs nos cenários permitem verificar a rastreabilidade. Não afirmamos atendimento integral do e-commerce: há pendências fora do núcleo desta entrega, registradas no checklist.”

## 4. Consulta rápida: onde está cada RF de Cliente

| ID | Implementação decisiva | Interface/API e teste |
| --- | --- | --- |
| RF0021 — cadastrar | [ClienteService.cadastrar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:81) | `CustomerRegistrationPage`; POST `/api/clientes`; [Cypress: CRUD](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:5) |
| RF0022 — alterar | [ClienteService.alterar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:98) | `CustomerActions`; PUT `/api/clientes/{id}`; mesmo cenário CRUD |
| RF0023 — inativar | [ClienteService.ativar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:106) | PATCH `/{id}/inativar`; reativação adicional em `/{id}/ativar`; mesmo cenário CRUD |
| RF0024 — consultar | [ClienteService.listar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:37) e `consultar` | `AdminCustomersPage`/`AccountPage`; GET coleção/por ID; [Cypress: filtros](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:39) |
| RF0025 — transações | [ConsultaVendaService.transacoes](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/ConsultaVendaService.java:68) | `CustomerDetails`/`CustomerTransactions`; GET `/api/clientes/{id}/transacoes`; [Cypress: Lucas](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/perfil-lucas.cy.ts:4) |
| RF0026 — endereços | [EnderecoService.salvar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/EnderecoService.java:40) | `AddressesPage`; `/api/clientes/{id}/enderecos`; [Cypress: endereço](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:90) |
| RF0027 — cartões | [CartaoService.salvar/preferir](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:51) | `CardsPage`; `/api/clientes/{id}/cartoes`; [Cypress: cartões](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:122) |
| RF0028 — senha independente | [ClienteService.alterarSenha](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:113) | PATCH `/api/clientes/{id}/senha`; [Cypress: senha](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:162) |

As rotas completas partem de `/api/clientes`. Para navegar pelas páginas, abra [CustomerPages.tsx](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/pages/CustomerPages.tsx:27); os principais componentes estão em `CustomerRegistrationPage`, `CustomerActions`, `AccountPage`, `AddressesPage`, `CardsPage` e `AdminCustomersPage`.

## 5. Consulta rápida: onde está cada RN do grupo Cliente

| ID | Regra e código | Comprovação automatizada existente |
| --- | --- | --- |
| RN0021 | Pelo menos um endereço de cobrança: [validarFuncoes](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/EnderecoService.java:30), chamada no cadastro/edição/exclusão | `clientes.cy.ts`: preservação do último endereço (linha 90) e rejeição de cadastro incompleto (114) |
| RN0022 | Pelo menos um de entrega: mesmo método | Mesmos cenários; cuidado para não eliminar a última finalidade ao editar |
| RN0023 | Composição obrigatória do endereço: [EnderecoRequest](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/EnderecoRequest.java:3) e `EnderecoService.preencher` | Cadastro/manutenção válidos em Cypress; validações diretas complementares em JUnit. Não há cenário UI negativo separado para cada campo |
| RN0024 | Entrada de número, titular, bandeira e CVV: [CartaoService.validarNumero/salvar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:42), DTO e armazenamento reduzido | Cypress linhas 122 e 149: cadastro, proteção do retorno, número inválido e CVV incompleto |
| RN0025 | Bandeira deve existir: [CartaoService.salvar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/CartaoService.java:65); FK `bandeira_id` | Cypress usa domínio real; [JUnit: bandeira inválida](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/test/java/com/lucas/ecomm/cliente/ClienteIntegrationTests.java:88) |
| RN0026 | Dados pessoais, senha e endereço residencial obrigatórios: [ClienteRequest](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/dto/ClienteRequest.java:6), `ValidacaoCliente`, cadastro e `validarFuncoes` | Cypress linhas 5, 60 e 114; unicidade em 79; [JUnit: validação sem React](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/test/java/com/lucas/ecomm/cliente/ClienteIntegrationTests.java:100) |
| RN0027 | Ranking numérico: [ClienteService.ranking](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:31); fórmula adotada, não especificada pelo cliente | `perfil-lucas.cy.ts`: ranking e histórico persistidos |
| RN0028 | Estoque físico somente após aprovação: [PedidoService.movimentarReserva/processar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:144) | `checkout.cy.ts`: aprovação e recusa simuladas, incluindo cenário em 113; `CheckoutIntegrationTests` |

## 6. RNFs relevantes para a entrega

| ID | Onde está | O que afirmar |
| --- | --- | --- |
| RNF0031 | [ValidacaoCliente.senha](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ValidacaoCliente.java:18), [validatePassword](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/components/CustomerFormFields.ts:20) | Pelo menos 8 caracteres, maiúscula, minúscula e especial; backend também limita a 72 bytes para BCrypt |
| RNF0032 | Mesmos validadores e campos de confirmação | Senha e confirmação precisam coincidir; Cypress linhas 70 e 162 |
| RNF0033 | [BCryptPasswordEncoder](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/cliente/service/ClienteService.java:21), `setSenhaHash`; `ClienteResponse` sem segredo | Hash com salt/custo 12, sem armazenamento em texto puro; [JUnit verifica persistência](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/test/java/com/lucas/ecomm/cliente/ClienteIntegrationTests.java:42) |
| RNF0034 | `EnderecoController`/`EnderecoService`, `AddressesPage` | Endereço tem manutenção própria, sem PUT dos dados pessoais; Cypress linha 90 |
| RNF0035 | [BaseModel](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/shared/model/BaseModel.java:9), herdado pelo Cliente | UUID gerado, PK única; não é CPF usado como chave primária |
| RNF0012 | [AuditoriaService.registrar](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/shared/service/AuditoriaService.java:15) e chamadas nos Services | Data/contexto/antes/depois das operações implementadas; o contexto `X-Perfil` não prova identidade sem autenticação. Atendimento global ainda parcial |
| RNF0011 | Consultas e índices do banco | A meta de todas as consultas em até 1 segundo não está comprovada. Não confundir timeout HTTP de 15 segundos com essa meta |

## 7. Por que cada parte existe

| Parte | Responsabilidade e motivo |
| --- | --- |
| React + MUI | A View monta as telas e reaproveita formulários/layout, sem conhecer SQL. MUI mantém componentes e estados visuais consistentes |
| React Router | Define navegação por URL; `/clientes/novo`, `/conta` e `/conta/enderecos` são rotas do frontend, não endpoints REST do backend |
| `CustomerFormFields.ts` | Centraliza descrição dos campos e montagem dos payloads, evitando versões diferentes do cadastro em cada tela |
| `MockEditor.tsx` | Nome herdado do protótipo. Hoje aguarda uma operação real assíncrona, mostra erro e bloqueia reenvio durante o salvamento; o nome não significa persistência mockada |
| `clienteService.ts` | Reúne os caminhos e métodos HTTP de Cliente/Endereço/Cartão. As páginas não duplicam URLs |
| `api.ts` | Comunicação central com `fetch`, JSON, timeout e erro padronizado. Fetch é a abordagem escolhida em vez de acrescentar Axios sem necessidade |
| React Query | Busca/cache/loading/erro. Após uma alteração, invalida as consultas para mostrar novamente o estado vindo da API, não um sucesso fictício local |
| `DemoContext.tsx` | Nome legado. Compartilha perfil selecionado e operações/dados obtidos da API; `sessionStorage` guarda o ID de perfil, não o cadastro como banco paralelo |
| Controller | Mapeia verbos/URLs e recebe DTOs com `@Valid`; delega ao Service. Evita colocar SQL ou toda a regra no HTTP |
| DTO Request/Response | Define contrato de entrada/saída. Não serializa toda a entidade JPA nem expõe senha/hash/PAN/CVV ou relações circulares |
| Service | Fonte final das regras: CPF, duplicidade, finalidades, preferência, cadastro atômico e auditoria |
| Repository | Spring Data implementa operações de persistência e filtros. Não é onde fica a decisão de negócio de inativar |
| Model JPA | Representa dados persistidos e relacionamentos; `@Entity` mapeia tabela, `@ManyToOne` aponta para o dono |
| PostgreSQL | PK/FK/UNIQUE/CHECK protegem a integridade mesmo em operações concorrentes ou fora da interface |
| Flyway | Migrações V1–V8 evoluem o schema de maneira versionada. JPA usa `ddl-auto=validate`, não recria as tabelas a cada início |
| Auditoria | Permite acompanhar mudanças sem registrar senhas ou CVV. Contexto local não deve ser confundido com autenticação |
| UUID e número de pedido | UUID permanece como chave técnica; um número sequencial é a identificação visual do pedido. Não trocamos FKs para embelezar a interface |

### Conceitos React que podem aparecer na pergunta

- **Componente/props:** função que produz a interface; props levam dados e callbacks ao formulário. `children` é o conteúdo envolvido pelo Provider.
- **`useState`:** mantém estado local como qual editor está aberto. Atualizar com `setState` provoca nova renderização; não equivale a gravar no banco.
- **`useEffect`:** executa efeitos, como fechar um aviso após 4,5 segundos. O cleanup cancela o timer antigo. Esse `setTimeout` é comportamento visual, não simulação de API.
- **`useQuery`:** carrega dados reais; a `queryKey` identifica o cache, e `enabled` evita consultar sem ID de cliente.
- **Context/Provider:** disponibiliza estado/operações compartilhados sem passar tudo por muitas camadas de props.
- **`map`:** transforma uma coleção em outra. Aqui produz campos e cartões de interface; `key={id}` ajuda o React a identificar cada item. O `map` não persiste nem altera sozinho o cadastro.
- **Spread (`...`) e atualização funcional:** criam uma nova representação do estado, por exemplo `{ ...current, [name]: value }`, preservando os demais campos. Isso é atualização imutável, não imutabilidade obrigatória de todo objeto JavaScript.
- **TypeScript `:` e `=>`:** `:` indica tipo; `=>` define arrow function. `type` descreve um formato em tempo de compilação, não substitui validação do backend em execução.
- **`async`/`await`:** aguarda a Promise da chamada HTTP antes de anunciar sucesso. Não bloqueia a thread da interface como uma espera síncrona.

### Conceitos Java/Spring que podem aparecer

- **Injeção pelo construtor:** Spring fornece as dependências do Service; facilita teste e evita criar um Repository manualmente em cada método.
- **`@Transactional`:** confirma o conjunto inteiro de alterações ou desfaz em caso de falha; o cadastro inclui cliente, endereços e auditoria.
- **Lock pessimista:** as escritas relacionadas bloqueiam a linha do cliente para serializar operações concorrentes, como troca de cartão preferencial.
- **`@Version`:** versiona entidades e permite detecção de certos conflitos de persistência. O frontend não envia a versão como condição de atualização; não afirme que já impede toda edição baseada em tela desatualizada.
- **`record`:** estrutura concisa de DTO com componentes finais e accessors. É imutabilidade superficial; listas recebidas não se tornam profundamente imutáveis por serem componentes de um record.
- **`JpaSpecificationExecutor`:** permite montar filtros combinados sem criar um endpoint para cada combinação.
- **`@RestControllerAdvice`:** padroniza erros HTTP/JSON em vez de cada Controller inventar uma mensagem.

## 8. Como os testes funcionam e como explicar

Um cenário Cypress tem preparação, ações e verificações. Em [clientes.cy.ts](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/e2e/testes/clientes.cy.ts:5), o padrão real é:

```typescript
registerCustomerThroughUi().then(cliente => {
  cy.location('pathname').should('eq', '/conta')
  cy.location('pathname').should('not.contain', '/admin')
  cy.contains('h2', cliente.nome).should('be.visible')
  cy.reload()
  cy.contains('h2', cliente.nome).should('be.visible')
})
```

O trecho é uma parte do cenário existente, não uma nova suíte criada neste roteiro. Explicação:

- `describe` agrupa; `it` é o cenário. Seu título informa os IDs atendidos.
- `cy.visit`, `fill` e `click` exercitam a interface. `registerCustomerThroughUi`/`fill`/`submit` são helpers em [data.ts](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/support/data.ts:21).
- `cy.intercept` **sem resposta fornecida** observa o POST real; `cy.wait('@cadastro')` sincroniza com a chamada, sem depender de um tempo arbitrário.
- `expect` valida a resposta recebida. `should` verifica o resultado no navegador e repete a assertiva dentro do timeout enquanto a UI atualiza.
- `cy.reload` elimina o estado transitório daquela tela; a nova consulta deve continuar mostrando o registro persistido.
- `cy.request` é usado para preparar massa ou confirmar o efeito no backend. Não substitui os cliques de CRUD que o cenário precisa comprovar.
- CPF/e-mail de teste são gerados para evitar colisão; os dados são gravados pela API no schema E2E, não introduzidos como fallback no React.
- O cadastro seleciona automaticamente o novo cliente no `sessionStorage`, sem fazer login, coerente com o escopo. Os testes continuam apenas pelas telas do cliente.
- Apenas o cenário de falha controlada devolve propositalmente um 500 com `cy.intercept`; ali o objetivo é provar tratamento de erro, não simular sucesso do CRUD.

Os comandos `cy.*` entram na fila do Cypress. Não transforme o teste em uma função `async` com `await cy.click()`: essa fila tem seu próprio modelo de encadeamento.

Para acrescentar um cenário no futuro: identifique o RF/RN, crie dados próprios via helper/API, execute a operação principal pela UI, verifique sucesso ou erro, recarregue e confira persistência. Prefira seletores por `name`, `aria-label` e ID do registro; não dependa da posição visual da linha ou de `cy.wait(5000)` para sincronização.

### Testes complementares do backend e frontend

Os testes JUnit/Vitest ajudam a verificar regras e componentes, mas **não substituem** os testes automatizados de interface exigidos pelo mentor.

```powershell
# Terminal independente, Backend
cd C:\Users\Lucas\Desktop\LES\Ecom\Backend
$env:RUN_DB_TESTS = 'true'
.\mvnw.cmd test
```

`RUN_DB_TESTS=true` é importante: sem essa variável, os testes de integração com PostgreSQL são pulados. O perfil de integração usa `techstore_integration`; os testes transacionais desfazem sua massa ao terminar.

```powershell
# Frontend
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run test
npm run lint
npm run build
```

## 9. Respostas curtas para perguntas do professor

**“Onde está a RN0026?”** No `ClienteRequest`, que valida formato/presença; no `ClienteService.cadastrar`, que exige senha/endereço; no `ValidacaoCliente`, que valida CPF/senha; e no `EnderecoService.validarFuncoes`, que preserva o residencial. O teste de UI fica em `clientes.cy.ts` e o backend também testa requisições sem React.

**“Por que validar no React e no Java?”** React dá feedback rápido. Java é a autoridade: alguém pode ignorar o React e chamar a API diretamente. O banco reforça as restrições estruturais.

**“Como sei que não é mock?”** O teste observa a chamada real, verifica 201/200, recarrega, consulta o mesmo UUID e usa PostgreSQL. Não há fallback silencioso de clientes. A massa fictícia é persistida, o que é diferente de um array fixo no componente.

**“Por que não excluir o cliente?”** RF0023 pede inativação. O campo de status preserva relações e histórico. Não há endpoint DELETE de Cliente; DELETE de endereço é outra operação e possui proteção das finalidades obrigatórias/FKs.

**“Como garante que não haverá dois cartões preferenciais?”** O Service bloqueia o cliente, retira a preferência antiga e define a nova na mesma transação. Um índice único parcial no banco impede duas linhas preferenciais para o mesmo cliente.

**“É seguro porque está sem login?”** Não. Ausência de autenticação é uma simplificação autorizada para uso local. Não há garantia de autorização por perfil na API. DTO/hash/minimização de dados são cuidados diferentes e não transformam isso em segurança de produção.

**“Como sabe a quem pertence o endereço/cartão?”** A consulta usa o par `id` e `clienteId`, e há FKs/restrições. Isso valida consistência de propriedade dentro da operação, não autentica a pessoa que enviou o `clienteId`.

**“Por que não guardar o CVV pedido no documento?”** Ele é obrigatório e validado na entrada, mas guardar um segredo de pagamento não é necessário para a simulação. A adaptação é explícita: não existe CVV/PAN nas tabelas nem nos DTOs de saída. Só cartões fictícios, sem gateway real.

**“Por que BCrypt?”** Hash lento, com salt e custo configurado, adequado para senha; não precisamos recuperar a senha original. Comparar com SHA puro ou guardar texto seria uma proteção inadequada.

**“Por que o endereço não vem dentro de todo ClienteResponse?”** Há endpoints próprios; evitamos payload excessivo, entidades expostas e ciclos JSON. Alterar telefone não regrava todos os endereços/cartões.

**“Qual RF cada teste valida?”** Os títulos e as matrizes deste roteiro mostram a correspondência. O primeiro cenário cobre várias operações; os seguintes cobrem pesquisa e regras negativas. Título é rastreabilidade, mas são as assertivas que comprovam o comportamento.

**“Já atende 100% do DRS?”** Não. O núcleo de Cliente funciona e os fluxos principais estão testados. Existem pendências do produto, IA, algumas possibilidades da compra, auditoria global e desempenho; estão no checklist, sem omiti-las.

## 10. Limites que precisam ficar claros

- A suíte de Cliente cobre os principais fluxos e validações, mas não todas as combinações de campos. Faltam cenários UI negativos individualizados para nascimento futuro, DDD/telefone inválidos, cada campo obrigatório do endereço, duplicidade durante edição e cada filtro isolado. Bandeira inexistente é testada negativamente no backend, não pela UI. Se a cobrança for exaustiva, ampliar Cypress antes da entrega.
- O ranking é uma premissa documentada, não uma fórmula fornecida pelo cliente. A proteção de cartão é uma adaptação segura, não processamento bancário.
- O chatbot atual é protótipo; integração Llama/personalização ainda não existe. Não o apresente como IA generativa funcionando.
- Produtos ainda não possuem todas as especificações/identificadores/filtros adaptados e não há inativação automática. Isso não deve dominar uma apresentação de Cliente, mas precisa ser reconhecido se perguntado.
- Novo cartão/endereço da compra sempre é salvo na conta; ainda não existe a escolha de uso apenas naquela compra.
- Há dois detalhes pendentes em vendas: revalidar a expiração dos cupons também no processamento posterior e alinhar a renovação do prazo do pedido à interpretação da reserva contada desde a última adição ao carrinho.
- Confirmamos que a API de análise sem os parâmetros obrigatórios retorna 500; deveria tratar essa requisição inválida como 400. Esse problema é fora do CRUD de Cliente.
- A View de cliente ainda carrega a coleção geral de pedidos/trocas antes de filtrar localmente. Há endpoints com filtro por cliente que podem reduzir dados e custo. Não confundir a ausência intencional de login com autorização segura ou minimização já completa.
- O histórico antigo de troca processada do Lucas não comprova a transição integral para TROCADO; use o cenário operacional `trocas.cy.ts` para demonstrar essa regra.

Checklist completo do documento: [REVISAO_DRS_COMPLETA.md](C:/Users/Lucas/Desktop/LES/Ecom/docs/REVISAO_DRS_COMPLETA.md). Ele separa implementado, parcial e pendente. Implementação e cobertura de teste são coisas diferentes.

## 11. O que deixar aberto antes da aula

1. Runner Cypress com `clientes.cy.ts`, `perfil-lucas.cy.ts` e, se solicitado, `checkout.cy.ts`.
2. `ClienteController`, `ClienteService`, `ClienteRequest` e `ValidacaoCliente`.
3. `EnderecoService`, `CartaoService` e `ClienteResponse`.
4. Migração V1 (clientes/FKs/preferência), `clienteService.ts` e `api.ts`.
5. Este roteiro e o checklist para localizar IDs rapidamente.

O melhor encerramento é mostrar o resultado efetivo dos testes e apontar a regra no código. Não diga apenas “funciona”; diga “este cenário verifica esta operação e esta restrição, por esta chamada real, preservando este registro”.

## 12. Se o professor ampliar a cobrança para outros módulos

O checklist contém todos os 92 itens do documento: 37 RFs, 39 RNs e 16 entradas RNF. O ID RNF0044 aparece duas vezes no documento, para análise e IA; ele é mantido e desambiguado, não renumerado. Use o checklist para o estado de cada item e este mapa para iniciar a busca no código:

| Grupo | Código principal | Testes e ressalva |
| --- | --- | --- |
| Produtos: RF0011–RF0016, RN0011–RN0017 | [ProdutoService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/catalogo/service/ProdutoService.java:33) e Models de catálogo | `base-persistente.cy.ts`; atributos completos, filtros, inativação automática e exceção gerencial ainda têm pendências |
| Carrinho: RF0031/RF0032, RN0031/RN0032/RN0044/RN0045, RNF0042 | [CarrinhoService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/CarrinhoService.java:42) | `base-persistente.cy.ts` e JUnit de checkout; distinguir reserva da baixa e o detalhe de transferência do prazo |
| Compra/pagamento: RF0033–RF0038, RN0033–RN0038, RN0028 | [PedidoService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:89), `FreteService` e processador simulado | `checkout.cy.ts`; persistência real, cobrança externa inexistente; ressalvas de cupons e uso pontual de cartão/endereço |
| Entrega: RF0039/RF0040, RN0039/RN0040 | [PedidoService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/PedidoService.java:159) e transições administrativas posteriores | `checkout.cy.ts`/`trocas.cy.ts`; estado do documento `EM TRANSPORTE`, com compatibilidade do alias `EM TRÂNSITO` |
| Trocas: RF0041–RF0045, RN0041–RN0043/RN0046, RF0054 | [TrocaService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/TrocaService.java:38) | `trocas.cy.ts` e JUnit; `statusDrs` corresponde a EM TROCA/TROCA AUTORIZADA/TROCADO, sem apagar as etapas visuais já construídas |
| Estoque: RF0051–RF0053, RN0050/RN0051/RN0061/RN0062, RNF0064 | [EstoqueService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/catalogo/service/EstoqueService.java:21) e `PedidoService.movimentarReserva` | `administracao.cy.ts`/`checkout.cy.ts`; entrada com fornecedor/data não equivale ao ajuste quantitativo legado do editor |
| Análise: RF0055–RF0058, RN0071–RN0074, RNF0043–RNF0046 | [AnaliseVendaService](C:/Users/Lucas/Desktop/LES/Ecom/Backend/src/main/java/com/lucas/ecomm/venda/service/AnaliseVendaService.java:16), Repository SQL e [SalesChart](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/components/SalesChart.tsx:26) | `administracao.cy.ts`; soma mensal bruta dos itens, sem frete; categorias sobrepostas não devem ser somadas como receita líquida |
| IA: RNF0044 do grupo generativo | [MockAiChat](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/src/components/MockAiChat.tsx:11) | Protótipo intencional. Llama ainda não foi integrado; uma conversa pronta não comprova IA generativa |

Nos módulos financeiros, use estes argumentos: valores são calculados com `BigDecimal` no backend e centavos inteiros no rateio de cartões no frontend; uma chave de idempotência evita duplicar o pedido na repetição da chamada; snapshots preservam endereço, preço, identificação do cartão e categorias da compra para que uma edição futura não reescreva o histórico. Locks e transações protegem reserva, baixa e crédito de troca. Os testes verificam os resultados desses mecanismos, sem exigir uma operadora real.

## 13. Resultados recuperados e validados nesta revisão

| Verificação | Resultado | Evidência |
| --- | --- | --- |
| Cypress completo no Edge — 18/09/2026 | **27/27 aprovados**, 6 arquivos, sem falhas ou testes pulados; tempo somado dos cenários aproximadamente 7min24s | [Relatórios XML](C:/Users/Lucas/Desktop/LES/Ecom/Frontend/cypress/results/revisao-2026-09-18-edge) e vídeos na subpasta `videos` |
| Cliente e histórico, dentro dessa execução | **11/11 Cliente + 1/1 Lucas**; aproximadamente 4min08s somados | `clientes.cy.ts` e `perfil-lucas.cy.ts`, com as assertivas de persistência |
| Backend — revisão de 17/09/2026 | **35/35 aprovados**, zero falhas/erros/pulados, integração PostgreSQL habilitada | [Surefire](C:/Users/Lucas/Desktop/LES/Ecom/Backend/target/surefire-reports); considerar os XMLs `TEST-com.lucas.ecomm.*`, não relatórios antigos de outro package |
| Frontend — revisão de 17/09/2026 | **13/13 aprovados**; lint e build concluídos | Vitest, ESLint e compilação TypeScript/Vite |

A execução completa anterior no Electron apresentou uma falha na compra preparatória do teste de troca. Esse mesmo cenário passou isoladamente no Edge e depois na execução completa de 27 testes. Não houve alteração de código entre essas verificações; a causa exata daquela falha não foi demonstrada. Não esconda uma eventual falha futura: registre o erro e investigue, em vez de remover a assertiva.

Passar os testes existentes não comprova todas as combinações do DRS, nem remove as pendências registradas. Nenhum arquivo de implementação do frontend/backend foi alterado para montar este roteiro. A revisão e o guia são locais; não houve push nesta etapa.
