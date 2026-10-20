# Revisão da integração da Tech Store

## Estado verificado antes das alterações

Referência confirmada pelo responsável: DRS_LES_2_2026. Banco Tech_store em PostgreSQL 18.4 acessível por JDBC; a consulta ao information_schema retornou zero tabelas de usuário antes da primeira migração. Não há esquema legado a converter ou registros reais a excluir.

O backend contém somente inicialização, CORS e GET /api/public/status. Nenhuma entidade de negócio possui Model, Repository, Service ou Controller. JPA, validação, Flyway e o driver PostgreSQL já estão declarados. O namespace encontrado é com.les.ecommerce; será ajustado para com.lucas.ecomm conforme solicitado, preservando o endpoint de status.

O frontend contém catálogo, detalhe de produto, carrinho, finalização, cadastro, conta, endereços, cartões, pedidos, trocas, cupons e administração. React Router, React Query, ECharts e CSS próprio já existem. MUI ainda não está instalado. Não existe login: a seleção direta de perfis permanece somente para desenvolvimento local e não constitui autenticação/autorização.

## Mocks e problemas identificados

| Local | Situação encontrada | Destino |
| --- | --- | --- |
| context/DemoContext.tsx | Clientes, endereços, cartões, pedidos e trocas em useState; IDs fabricados; carrinho compartilhado | Substituir por API e persistência; seleção guarda somente ID |
| data/mockData.ts | Produtos e cupons fictícios; cópias de clientes/pedidos/cartões/endereços | Remover registros do runtime; manter somente metadados visuais |
| StorePages.tsx | Cadastro incompleto; endereço concatenado; cartão somente últimos dígitos; perfil assume primeiro cliente | Formulários reais e estados vazio/carregamento/erro |
| AdminPages.tsx | Edição de produto ignora vários campos; ações podem exibir sucesso sem gravar | CRUD mínimo persistente e sucesso somente após resposta |
| MockEditor.tsx | Marca sucesso antes de concluir a ação | Aguardar Promise; apresentar erro e impedir envio duplicado |
| Pedidos e trocas | Trocas referenciam pedidos inexistentes; valores de compra confiados ao navegador | Relações com FK; base persistente, regras de venda ficam explícitas como etapa posterior onde não implementadas |
| SalesChart.tsx | Séries fixas | Consultar transações reais; sem inventar vendas |
| MockAiChat.tsx | Respostas por palavras-chave e conversa inicial | Pode permanecer temporariamente: chatbot fora desta etapa; futura integração com Llama, versão indefinida |
| Layouts e formulários | Textos, opções de status, cores, menus | Não são dados transacionais: podem permanecer |
| Testes existentes | Playwright/Vitest dependem dos registros fictícios | Cypress com fluxos reais; fixtures somente nos testes, nunca fallback de produção |

## Decisões de relacionamento e segurança

Cliente terá 1:N com endereço e cartão; pedido pertence a um cliente; troca pertence a item do pedido, preservando o vínculo com o cliente do pedido. Produto terá categorias N:N e grupo de precificação N:1. Estoque é 1:1 com produto. Carrinho é individual por cliente. Pagamento pertence ao pedido e referencia cartão do mesmo cliente. Cupom promocional pode ser geral; cupom de troca pertence ao cliente e pode indicar a troca de origem. Não há ator vendedor definido para justificar uma entidade Vendedor.

Não será utilizado cascade REMOVE de cliente para transações. Inativação preserva cadastro e histórico; não equivale a exclusão. O backend deve impedir remover o último endereço residencial, de entrega ou de cobrança. Um mesmo endereço pode cumprir as três funções. O cadastro inicial é atômico com seus endereços.

RN0024 pede coleta de número e código de segurança. Esses campos serão validados na entrada, mas o CVV nunca será persistido e o PAN nunca será retornado nem armazenado integralmente. Serão mantidos identificação tokenizada local, últimos quatro dígitos, bandeira, titular e validade. Isso NÃO permite cobranças reais: para isso será necessário um provedor de pagamento com tokenização apropriada.

Senha será hash com salt, nunca texto puro nem campo de consulta. A confirmação é validada no React e no backend. A preferência anterior por ausência de login não dispensa RF0028/RNF0031–33. Autenticação e autorização completas continuam pendentes; não publicar a aplicação nem usar dados pessoais/cartões reais nesta configuração local.

## Cobertura a verificar

- RF0021–24: cadastro, alteração, inativação e consultas combinadas; reativação adicional solicitada.
- RF0025: consulta das transações persistidas na ficha do cliente, inclusive quando vazia.
- RF0026 / RN0021–23 / RN0026 / RNF0034: endereço completo, múltiplos endereços e manutenção independente, mínimo obrigatório.
- RF0027 / RN0024–25: múltiplos cartões, bandeiras do banco e preferência única.
- RF0028 / RNF0031–33: alteração independente de senha, força, confirmação e hash.
- RN0027: ranking numérico; o DRS não define fórmula. Critério inicial documentado: quantidade de pedidos com pagamento aprovado, em trânsito ou entregues.
- RNF0035: identificador único gerado pelo banco/JPA.
- RNF0012: auditoria transacional de escrita com data/hora, responsável contextual e mudanças, sem segredos.
- RNF0011: meta de consulta em até um segundo; medir no ambiente local, sem prometer SLA universal.
- RNF0013: migrações versionadas com registros de domínio, sem semear clientes fictícios.

Os RFs de vendas, estoque avançado, pagamentos externos, trocas completas e recomendação não devem ser considerados integralmente atendidos apenas por existir uma tabela ou uma tela. A etapa prioriza manutenção real de Cliente e a base persistente dos próximos módulos.

## Resultado da implementação

O CRUD de Cliente e a manutenção de endereços/cartões foram conectados às telas existentes e ao PostgreSQL. A camada HTTP centralizada usa fetch, com timeout e erros explícitos; React Query controla consultas e invalidações. MUI foi incorporado aos formulários, preservando CSS, estrutura e rotas. A seleção de perfis consulta somente id/nome/ativo; dados pessoais completos são consultados na ficha. Não foi implementado login, conforme orientação do responsável.

Foram criados Models/Repositories e DTOs/Services/Controllers necessários para Cliente, Endereco, Cartao, catálogo mínimo e consultas de vendas, sem controllers vazios para cada tabela. As migrações V1/V2 implementam o modelo e reforçam integridade de vínculos. Estoque esgotado passou a ser derivado da quantidade, preservando a distinção de produto inativo. Adicionar ao carrinho soma quantidade atomicamente por cliente.

Os registros fictícios embutidos no React foram removidos. O chatbot permanece como protótipo solicitado. Metadados de menus, status e campos não são mocks de negócio. Produtos e perfis de teste são registros do banco preparados explicitamente por script; o histórico do Lucas também é persistido, separado da execução operacional de vendas que ainda será desenvolvida.

Testes backend e frontend foram atualizados; a automação de interface usa Cypress, conforme a ferramenta escolhida. A matriz de evidências e limitações está em `COBERTURA_REQUISITOS.md`. Medição de desempenho identificou uma primeira consulta de 1492 ms, seguida de 19–45 ms; a meta de um segundo não está integralmente comprovada.

## Evolução: compra local persistente

Foi concluída a integração do checkout com reserva de estoque, frete local parametrizado, endereço escolhido/novo, cartões associados à conta e divisão em centavos, cupons promocionais/de troca, pedido e pagamentos persistidos. O responsável confirmou o uso pessoal, sem produção: autorização é simulada no próprio backend, sem gateways externos e sem cobrança real.

Problemas corrigidos nesta etapa: checkout ainda sem escrita real; quantidade de carrinho não considerava a reserva do próprio cliente; notificações não tinham fechamento automático; status administrativos ainda não usavam API; consultas/gráficos não incluíam os estados canônicos APROVADA/EM TRANSPORTE. As correções reaproveitam telas, classes CSS, rotas e contratos existentes, incluindo os aliases de status.

As migrações V3/V4 acrescentam prazo de reserva, itens removidos, composição de valores, snapshots de pagamento e chave idempotente. Históricos reconhecíveis tinham total líquido; foram normalizados para total bruto e desconto separado, sem mudar pagamentos. Novas compras são transacionais: reserva passa do carrinho ao pedido, estoque físico baixa uma vez após aprovação, e recusa/cancelamento pendente devolve reserva/cupons. Crédito excedente é emitido uma vez. Revisão de orçamento impede confirmar valores desatualizados.

Não foram removidos dados de clientes nem produtos do banco. Somente logos padrão sem referências e uma função obsoleta de transição de pedidos foram retirados. O formulário de nome legado MockEditor é funcional e permanece; metadados visuais não representam mocks de registros. Na conclusão dessa etapa, chatbot/Llama e operações de pós-venda ainda estavam pendentes. A evolução administrativa abaixo substitui essa situação para o pós-venda.

## Evolução: administração, pós-venda e análise de vendas

As migrações V5–V7 acrescentam categorias históricas dos itens, perfis selecionáveis, notificações persistentes, informações operacionais de trocas, fornecedores/entradas e motivos de ativação/inativação de produtos. Controllers, services transacionais e repositories foram incorporados aos módulos existentes, sem substituir a arquitetura nem os stylesheets.

Trocas passaram a usar a API desde a solicitação até o encerramento. Locks e verificações de propriedade/quantidade protegem o histórico; o recebimento exige escolha de reentrada e gera crédito uma vez. O campo statusDrs mantém correspondência com os estados da referência fornecida sem renomear os estados operacionais consolidados das telas. Notificações ficam na ficha do cliente. Pagamentos e transporte continuam simulações locais.

Análise utiliza valores/categorias históricos dos itens, status elegíveis, intervalo inclusivo de 1 a 24 meses e categorias selecionadas. Meses sem vendas retornam zero. O gráfico existente foi preservado e recebeu filtros, dados acessíveis e exportação dos mesmos resultados em CSV. Séries de categorias sobrepostas não representam uma soma de receita líquida.

O preparador local acrescenta quatro clientes apenas consultáveis, 45 compras históricas idempotentes e produtos de sete categorias de hardware. Só Lucas Paulino e Admin são oferecidos na seleção de perfil; isso não representa autorização, pois não há login. Nenhum cliente/histórico anterior foi apagado.

Na retomada de 17/09, o frontend normal continuava ativo, mas as APIs haviam terminado. Após iniciar a API, GET /api/produtos respondeu 200 tanto diretamente na porta 8080 quanto pelo Vite na 5173. Foram confirmados oito produtos com categorias, imagens e estoque. Esse diagnóstico de indisponibilidade não exige recriar tabela nem usar mocks. O tratamento HTTP do frontend agora explica 502/503/504, sem fallback.

Um teste de interface revelou uma corrida: a conclusão assíncrona do cadastro de produto podia fechar um novo editor aberto durante a atualização da listagem. O fechamento agora só remove a mesma instância de editor que originou a ação; respostas antigas não fecham outro formulário.

O mesmo cuidado foi aplicado a endereços e cartões: não abrir outro cadastro enquanto o formulário anterior estiver aberto, e fechar apenas a edição que originou a ação. A gravação continua assíncrona, sem bloquear a atualização real da listagem e sem introduzir atrasos artificiais.

Pedidos/trocas administrativos, entradas de estoque e cadastros auxiliares na finalização também impedem formulários sobrepostos. Na gestão, a identidade do formulário inclui registro/status; a resposta da etapa anterior não pode fechar nem reutilizar valores da próxima etapa.

A matriz integral de RF/RN/RNF e as pendências reais estão em REVISAO_DRS_COMPLETA.md. Chatbot/Llama, inativação automática e outras pendências explícitas dessa matriz não são declarados concluídos.
