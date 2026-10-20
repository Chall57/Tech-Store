# Cypress — organização e ritmo de demonstração

## Pastas

- `Frontend/cypress/e2e/CRUD Cliente`: cadastro, consulta, alteração, inativação/reativação, validações, endereços, cartões e histórico; inclui `00-cliente-crud-completo.cy.ts`.
- `Frontend/cypress/e2e/criacao-pedido`: caminho feliz completo e cenários separados de carrinho, endereço, cartões, cupons, validações e auditoria.
- `Frontend/cypress/e2e/testes`: regressões gerais e fluxos de compra/pós-venda que antes estavam fora dessas pastas.
- `Frontend/cypress/support`: preparação pela API e ações reutilizáveis da interface.

Os arquivos foram movidos, não descartados. Os aliases antigos de apresentação continuam disponíveis; os scripts npm apontam para os caminhos novos.

## Inicialização

Com PostgreSQL ativo e o `.env` local configurado, mantenha três terminais separados:

```powershell
# Terminal 1 — backend real no schema isolado techstore_e2e
cd C:\Users\Lucas\Desktop\LES\Ecom\Backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=e2e"
```

```powershell
# Terminal 2 — frontend de testes
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
npm run dev:e2e
```

```powershell
# Terminal 3 — conferir proxy e abrir a suíte desejada
cd C:\Users\Lucas\Desktop\LES\Ecom\Frontend
Invoke-RestMethod http://localhost:5174/actuator/health
npm run test:e2e:pedido:open
```

O backend usa 8081; o frontend/Cypress, 5174. A preparação dos testes cria dados fictícios persistidos pela API; não utiliza respostas falsas como fallback.

## Comandos

```powershell
npm run test:e2e:pedido:completo -- --headed
npm run test:e2e:pedido -- --headed
npm run test:e2e:crud:completo -- --headed
npm run test:e2e:cliente -- --headed
npm run test:e2e:cliente:open
npm run test:e2e:testes:open
npm run test:e2e:regressao
```

Um arquivo específico (as aspas são necessárias no caminho com espaço):

```powershell
npx cypress run --browser edge --headed --spec "cypress/e2e/CRUD Cliente/03-cliente-alteracao.cy.ts"
```

## Ritmo

`Frontend/cypress/support/e2e.ts` usa os valores públicos de `expose` definidos em `Frontend/cypress.config.ts`:

- `actionDelay: 500`: pausa de 500 ms após cliques, seleções, marcações e digitação.
- `pageDelay: 800`: pausa de leitura após navegação/recarregamento e nas etapas sinalizadas com `demoPause`.
- `typeDelay: 40`: intervalo de 40 ms entre caracteres.

As pausas servem para acompanhar a apresentação. A sincronização continua sendo feita por respostas reais (`cy.intercept` + `cy.wait`) e assertions com retry. Nenhum erro/404 é ignorado para fazer o teste passar. Consulte a [documentação de comandos customizados do Cypress](https://docs.cypress.io/api/cypress-api/custom-commands) para a extensão dos comandos nativos.

Para uma execução mais rápida, sem editar arquivos:

```powershell
npm run test:e2e:pedido -- --expose "actionDelay=0,pageDelay=0,typeDelay=20"
```

Para apresentação mais lenta:

```powershell
npm run test:e2e:pedido:completo -- --headed --expose "actionDelay=1000,pageDelay=1600,typeDelay=65"
```

O viewport passou a 1680 × 1050, com janela Chromium de 1920 × 1200 e rolagem centralizada.

## Percurso de compra

O cenário com dois produtos começa pela home, prioriza a primeira fileira do catálogo, escolhe sua quantidade, adiciona e abre o carrinho. Depois usa “Continuar comprando”, seleciona outro produto próximo do início da vitrine, abre seus detalhes, adiciona e volta ao carrinho pela navegação. A barra de pesquisa não é utilizada. A compra com um item visita também seus detalhes, sem adicionar uma segunda unidade artificialmente.

A preparação pode usar API; as ações avaliadas de compra continuam ocorrendo pelos botões e formulários do cliente. Não há acesso ao dashboard no caminho feliz ou nos testes de `CRUD Cliente`.

## Carregamento e fontes

`LoadingScreen.tsx` apresenta indicador circular laranja enquanto catálogo, produto ou pedido estão pendentes. Só é mostrado 404 quando a consulta conclui com sucesso e o registro não existe; falha de comunicação é apresentada como erro da API. Não foi adicionado atraso artificial ao webapp.

O acréscimo das fontes é controlado por `--font-size-increase: 2px` em `Frontend/src/index.css`. Os tamanhos CSS e variantes MUI somam esse valor ao tamanho anterior; o gráfico lê a mesma variável. Para voltar apenas aos tamanhos anteriores, altere essa variável para `0px` e recarregue a página. Isso não reverte os testes nem a correção do carregamento.

`testes/interface.cy.ts` verifica legibilidade/layout desktop e observa o spinner atrasando a entrega de uma resposta real, sem substituir dados da API.

## Verificação realizada em 06/10/2026

- Compilação do frontend, lint e tipos do Cypress: aprovados.
- Vitest: 17 testes aprovados.
- Caminho feliz completo com o ritmo padrão de apresentação: 1 teste aprovado, cinco compras, duração de aproximadamente 5 minutos.
- Suítes de `CRUD Cliente`, criação de pedido 01–08, fluxos gerais 09–14 e interface: 34 testes aprovados em 24 arquivos. Para reduzir a duração desta rodada foi usado `actionDelay=100,pageDelay=200,typeDelay=20`; o padrão naquela rodada era 600/1000/45. O ajuste posterior para 500/800/40 preserva o ritmo de apresentação com pausas um pouco menores.
- Layout conferido nas larguras 1680 e 1280; spinner conferido contra resposta real com latência controlada. As consultas e os registros de auditoria também foram verificados.

Os seis arquivos históricos (`administracao`, `base-persistente`, `checkout`, `clientes`, `perfil-lucas`, `trocas`) foram preservados em `testes`, com imports ajustados e tipos/lint conferidos. Não foram executados novamente nesta rodada. Use `test:e2e:regressao` para executar também esses arquivos.

Durante a rodada, o backend registrou ocorrências de `HttpMessageNotWritableException`. Os fluxos executados passaram, mas o tratamento atual registra apenas a classe da exceção, sem informação suficiente para confirmar a causa. Essas ocorrências não foram ocultadas pelos testes nem tratadas como 404; precisam de diagnóstico separado caso se repitam no uso normal.

## Ajuste posterior — seleção direta no catálogo

Os helpers de compra agora localizam o cartão do produto pelo ID, rolam até ele e utilizam os botões do catálogo, sem digitar na barra de pesquisa. A navegação para os detalhes do produto e o retorno ao carrinho foram mantidos. Cada seleção também confirma que a página está em `/`, sem parâmetros de busca.

Com os valores padrão 500/800/40, o caminho feliz completo passou em aproximadamente 4 minutos e 2 segundos (a rodada anterior levou aproximadamente 5 minutos e 9 segundos). Tempo observado nesta máquina, não garantia de duração em outros computadores.

Nesta verificação, os sete testes executados foram aprovados: dois de interface, o caminho feliz completo, dois de carrinho em `criacao-pedido`, o fluxo 09 e o fluxo 10. Tipos do Cypress e lint também passaram. As demais suítes não foram executadas novamente neste ajuste.

## Nomes comerciais e primeira fileira

Os novos produtos dos cenários usam os nomes `GeForce RTX 5070 12GB` e `Radeon RX 9070 XT 16GB`, com as marcas NVIDIA/AMD e as imagens correspondentes já existentes no projeto. Preços, estoques e demais dados de preparação continuam fictícios e controlados para demonstrar as regras de compra; não são preços reais de mercado.

A API de produtos passou a listar por data de criação decrescente, com desempate por ID. Essa ordem vale também para o catálogo normal e para as consultas administrativas. Assim, cada cenário mantém produtos próprios, sem reutilizar estoques reservados de outros testes, e os dois cadastros mais recentes aparecem no início da vitrine. Nenhuma resposta da API foi mockada ou reordenada pelo Cypress.

`mostrarProdutoNoCatalogo` procura primeiro na primeira fileira. Se o produto do cenário estiver abaixo dela, permite selecioná-lo, rolando até seu cartão, sem uma navegação deliberada até o fim do catálogo. Os cliques usam o comportamento `nearest` para evitar deslocamentos extras. A seleção pelos IDs evita escolher um cadastro antigo com o mesmo nome comercial.

`testes/interface.cy.ts` inclui verificações da preferência pela primeira fileira, da seleção permitida na segunda fileira, da ordem retornada pela API e dos nomes comerciais. `CatalogoIntegrationTests.java` verifica a ordem das consultas mesmo quando dois produtos têm o mesmo nome.

Registros de execuções antigas não foram excluídos nem renomeados em massa; seus IDs e históricos foram preservados. Os novos cenários deixam de criar produtos com o nome `Hardware Cypress`.

Verificação deste ajuste em 06/10/2026: nove testes Cypress aprovados em cinco arquivos (interface, caminho feliz completo, carrinho e fluxos 09/10); 19 testes de integração aprovados no backend (`CatalogoIntegrationTests` e `CheckoutIntegrationTests`, schema isolado com rollback). Tipos do Cypress e lint aprovados. O caminho completo levou aproximadamente 3 minutos e 51 segundos, mantendo os valores padrão 500/800/40. As demais suítes não foram executadas novamente nesta rodada.
