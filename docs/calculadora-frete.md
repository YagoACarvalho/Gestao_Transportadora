# Calculadora de frete

Tela em `#/calcular-frete`, no menu Operação. Adaptada para ASP.NET Core e React/Vite
a partir do mapa de replicação fornecido pelo usuário. Não depende do código Python
ou Next.js do projeto original e não grava endereços, simulações, viagens ou despesas.

## Configuração externa

O backend lê `Fretes:OrsApiKey` (variável de ambiente `Fretes__OrsApiKey`).
Obtenha uma chave na [HeiGIT](https://account.heigit.org/). Configure-a pelo mecanismo
seguro do ambiente de desenvolvimento ou hospedagem, sem colocá-la no frontend,
Git, arquivos públicos ou logs. A configuração real e o deploy são etapas separadas.
Sem chave, a tela permite preparar os dados, informa a pendência e bloqueia o cálculo;
a API retorna 503 sem fazer chamadas externas. O backend existente ainda precisa
de sua configuração de inicialização, mesmo que a calculadora não consulte o banco.

### Publicação no serviço Render existente

Destino informado pelo usuário: `https://gestao-transportadora.onrender.com/`.
Repositório: `YagoACarvalho/Gestao_Transportadora`, branch
`consolidation/workspace-unificado`. Preservar as configurações existentes de
autenticação, banco e HTTPS. A calculadora não exige migration.

1. No painel do serviço existente, em Environment, definir `Fretes__OrsApiKey`
   com a chave HeiGIT/ORS. O valor não deve ir para este documento, chat ou Git.
   `Save only` permite preparar a variável sem iniciar a publicação.
2. Publicar o commit revisado na branch configurada e conferir o workflow
   `Validar imagem de publicacao` para esse mesmo SHA, nos modos padrão e Render.
3. Após liberar a publicação, usar `Manual Deploy > Deploy a specific commit`
   no serviço existente e selecionar o SHA validado. Não criar outro serviço
   nem reaplicar o Blueprint para essa atualização.
4. Confirmar página inicial HTTP 200 e `/api/fretes/opcoes` HTTP 401 sem sessão.
   Depois do login, conferir `mapasConfigurados: true` e realizar uma simulação
   com endereços conhecidos. A flag confirma presença da configuração; somente
   a consulta real confirma validade da chave e disponibilidade do provedor.

Referências: [variáveis e opções de salvamento no Render](https://render.com/docs/configure-environment-variables)
e [publicação de um commit específico](https://render.com/docs/deploys#deploying-a-specific-commit).
Antes desta atualização, a consulta pública retornou 200 na raiz e 404 em
`/api/fretes/opcoes`; isso não valida a configuração administrativa ou a chave.

URLs fixas atuais, conforme [aviso oficial de migração do provedor](https://ask.openrouteservice.org/t/deprecating-api-openrouteservice-org-in-favour-of-api-heigit-org/7912/):

- `https://api.heigit.org/pelias/v1/search`
- `https://api.heigit.org/pelias/v1/autocomplete`
- `https://api.heigit.org/openrouteservice/v2/directions/driving-hgv/geojson`

Credencial no cabeçalho Authorization, somente do servidor para a HeiGIT.
Direções solicitam `instructions: true`: o ORS remove `segments` quando essa opção
é false, impedindo a leitura das distâncias oficiais por trecho. As instruções
de navegação são descartadas pelo adaptador, sem alterar a resposta da nossa API.
Esse comportamento consta no [RouteResultBuilder do ORS](https://github.com/GIScience/openrouteservice/blob/main/ors-engine/src/main/java/org/heigit/ors/routing/RouteResultBuilder.java).
Cliente HTTP dedicado, sem logging de requisições, sem proxies do ambiente, cookies
ou redirecionamento, timeout de 40 s por consulta e limite de 1 MiB por resposta.
Não há URL configurável nem URL externa aceita como entrada. Cálculo no navegador
tem timeout total de 60 s, cancelamento e invalidação ao sair ou trocar sessão.

## Contratos HTTP

Todos os endpoints usam a política `Transportadora` existente: 401 sem autenticação,
403 sem autorização. JSON em camelCase, datas civis `yyyy-MM-dd`, valores em reais,
distâncias em km, coordenadas `{lat, lon}`, altura/largura/comprimento em metros,
peso bruto em toneladas. Os nomes completos constam em `Fretes/ContratosFrete.cs`.

| Método e rota | Entrada / resposta |
| --- | --- |
| GET `/api/fretes/opcoes` | `tiposCarga: [{id,nome}]`, `hoje` (São Paulo), `primeiraVigencia`, `mapasConfigurados` |
| GET `/api/fretes/sugestoes?texto=...` | Texto de 4–250 caracteres; até seis `{texto,ponto}` |
| POST `/api/fretes/calcular` | `origem`, `destino`: `{texto,ponto?}`; `paradas`: até cinco endereços; `tipoCarga`: 1–12; `eixos`: inteiro 2–20; `contratacao`: `composicao` ou `tracao`; `altoDesempenho`, `retornoEspecial`: booleanos; `dataReferencia`; medidas opcionais; `pedagio`: valor ou null; `adicionais`: valor |
| GET `/api/fretes/mapa-tiles/{z}/{x}/{y}` | PNG autenticado, usado exclusivamente pelo mapa interativo |

POST retorna endereços resolvidos, distância de ida/retorno, trechos, geometrias de até
800 pontos cada, coeficientes, piso de ida, retorno vazio, piso total, pedágio,
adicionais, total da operação, norma, vigência, fonte e avisos.

Status: 200 sucesso; 400 entrada inválida, endereço ambíguo/não encontrado,
combinação sem coeficiente ou rota recusada; 413 corpo acima de 16 KiB;
429 limite por usuário (Retry-After: 60); 502 resposta inválida/excessiva do provedor;
503 falta de chave, falha de rede, timeout ou indisponibilidade/cota externa.
Erros de domínio usam ValidationProblemDetails com mensagens em `errors`.

Limites em memória, por instância: 10 cálculos, 60 sugestões e 300 imagens por
minuto/usuário. Em múltiplas réplicas, as cotas são independentes; não há Redis.
Autocomplete aguarda 350 ms e cancela buscas anteriores. Edição do texto remove
o ponto selecionado. Geocodificação ambígua é recusada quando os dois primeiros
resultados ficam a mais de 500 m. Coordenadas fora do bbox brasileiro são recusadas;
esse limite retangular não é uma verificação geopolítica exata de fronteiras.

## Tabelas e regras

Fonte: [Portaria SUROC 22/2026 no ANTTlegis](https://anttlegis.datalegis.inf.br/action/ActionDatalegis.php?acao=abrirTextoAto&cod_menu=7817&cod_modulo=161&link=S&numeroAto=00000022&orgao=SUROC%2FANTT%2FMT&seqAto=000&tipo=POR&valorAno=2026).
Regras: [Resolução ANTT 5.867/2020, texto consolidado](https://anttlegis.datalegis.inf.br/action/ActionDatalegis.php?acao=abrirTextoAto&cod_menu=10797&cod_modulo=392&link=S&numeroAto=00005867&orgao=DG%2FANTT%2FMI&seqAto=000&tipo=RES&valorAno=2020).

`Fretes/Dados/2026-09-30.json` contém quatro tabelas, 12 cargas e os coeficientes
CCD/CC de 2, 3, 4, 5, 6, 7 e 9 eixos, incluindo células vazias como null.
Metadados incluem fonte, vigência e SHA-256 do HTML original. Incorporado na DLL,
também funciona no publish sem depender do diretório de execução.

- Ida = km × CCD + CC; retorno vazio = 0,92 × CCD × km do retorno.
- Valores calculados em decimal; cada parcela monetária arredondada a duas casas
  com AwayFromZero. Piso total soma as parcelas apresentadas.
- A/B: composição/unidade de tração; C/D: equivalentes de alto desempenho.
- Eixos intermediários usam a referência inferior; uma célula vazia recusa o cálculo,
  sem saltar para outra combinação.
- Retorno obrigatório para cargas conteinerizadas (4 e 10); nas demais, somente
  pelo enquadramento específico informado. Sempre consulta entrega → coleta,
  sem repetir paradas ou presumir a mesma distância da ida.
- Data anterior à primeira tabela ou posterior a hoje é recusada. A versão de maior
  vigência não posterior à referência é usada. Só há a versão de 30/09/2026 incluída;
  acompanhar novas normas é necessário. Não há atualização automática pela rede.
- Sem cobertura nacional de pedágios: informar manualmente o total da operação,
  incluindo retorno. Null = pendente; zero = ausência confirmada pelo usuário.
  Totais e preços com pedágio pendente são explicitamente parciais.

Para reproduzir a importação, obtenha o HTML da fonte oficial e execute:

```powershell
node scripts/importar-tabela-antt.mjs caminho-do-html novo-destino.json
```

O importador específico desta portaria não sobrescreve arquivos existentes e recusa
estrutura inesperada. Uma norma nova exige rever o HTML, adaptar o importador se
necessário, gerar um novo arquivo, revisar os coeficientes e testar a nova vigência.
Não executar o importador antigo em normas diferentes sem essa revisão.

## Custos, comparação, compartilhamento e impressão

Custo próprio = (km de ida + km de retorno obrigatório) / consumo × preço do diesel
+ outros custos/km × distância + fixos + pedágio + adicionais.
Preço sugerido = máximo entre total da operação e custo próprio × (1 + acréscimo/100).
Esse acréscimo é sobre custo, não margem líquida. O usuário deve compor os demais
custos sem duplicar os itens já considerados. Nenhum custo real da transportadora
é presumido. O preço só aparece com consumo e diesel positivos.

Preferências de custos ficam em `localStorage` (`fretes:custos:v1`); endereços não.
Até quatro cenários mantêm snapshots independentes apenas na memória da tela.
Editar dados de rota/carga invalida o resultado atual, sem modificar comparações.

O link em `#/calcular-frete?simulacao=...` usa JSON versionado em base64url, com
validação de todos os campos conhecidos, limites e Unicode. Contém endereços e
parâmetros, não inclui credencial nem resposta de cálculo. Não é link público:
exige login e cálculo explícito com a tabela e o provedor do sistema do destinatário.
Base64 não é criptografia; quem recebe o link pode ler seus dados.

Impressão usa folha separada via portal e `@media print`, na mesma página, preservando
o formulário. O usuário escolhe salvar PDF no diálogo de impressão. A folha contém
trajeto textual, medidas, coeficientes, custos, avisos e fonte; não depende de tiles.

O mapa usa Leaflet por import dinâmico e proxy de imagens autenticado, sem liberar
origens externas na CSP. Atribuição de OpenStreetMap e HeiGIT aparece na tela.
Cache de tiles em memória (64 MiB, validade de sete dias; evicção/reinício pode removê-los).
Não há prefetch/offline. A disponibilidade é best effort. Para uso intenso ou cache
persistente, rever hospedagem/provedor à luz da [política de tiles OSM](https://operations.osmfoundation.org/policies/tiles/).

## Validação

Executar `powershell -NoProfile -File ./scripts/validar.ps1`: restore, build, descoberta
e testes .NET, npm ci, typecheck, Vitest e build Vite. Testes de cálculo reproduzem
o caso B, quatro eixos, 200 km ida + 200 km retorno = R$ 2.589,26. Integrações de mapas
são simuladas; testes HTTP usam a infraestrutura Testing e SQLite isolada existente.
Nenhum teste automatizado usa a chave real, User Secrets ou PostgreSQL.

Homologação externa pendente até configurar uma chave: conferir endereços conhecidos,
restrições de caminhão, quotas do plano, rota de retorno e quilômetros reais.
PDF deve também ser conferido no diálogo de impressão do navegador usado na operação.

### Verificação realizada em 03/11/2026

Fluxo oficial completo concluído com código 0, incluindo restore, build, descoberta,
testes, npm ci, typecheck e build Vite. Backend: 227 casos listados e executados,
227 aprovados, zero reprovados e zero não executados. Frontend: 213 executados e
aprovados, zero reprovados e zero ignorados (26 arquivos). `git diff --check` passou.
O build .NET registrou 40 avisos xUnit1051 de uso de CancellationToken nos testes;
o frontend registrou os avisos de dimensões de gráficos no jsdom e de `use client`
do Motion no build. Não foram tratados como comprovação de comportamento visual.

Logs e relatórios da execução final, ignorados pelo Git:
`.local/harness/test-results/24ce871546c5432a922e9b71defd0eb6/` (TRX e JSON Vitest)
e `.local/harness/fretes/validacao-final.log`.

A tentativa de prévia isolada ficou em branco; a nova inicialização do Chrome
headless foi bloqueada pela revisão automática de aprovação (`blocked by policy`).
Portanto, conferência visual desktop/360 px, tema escuro, mapa real e impressão
continuam pendentes. Não houve configuração de chave, acesso a PostgreSQL,
execução de migrations, deploy ou criação de commit.

Continuação da verificação: adicionados três testes de comportamento para a folha de
impressão (conteúdo, fonte, preservação do formulário e limpeza do modo de impressão),
o link compartilhado com custos e a seleção por teclado das sugestões com invalidação
do ponto ao editar o endereço. Executados `npm run typecheck` e
`npm test -- --reporter=verbose src/features/fretes`: 16 testes aprovados em quatro
arquivos, sem falhas ou ignorados. Essa execução direcionada não substitui a
homologação visual nem afirma uma nova execução completa das suítes anteriores.

Antes do commit, o fluxo oficial foi executado novamente e concluiu com código 0:
227 testes backend listados/executados/aprovados e 216 testes frontend aprovados
em 27 arquivos, sem falhas ou ignorados. Restore, builds e TypeScript aprovados.
Relatórios em `.local/harness/test-results/593bec95a64446678ff6f6f6471f908a/` e
log consolidado em `.local/harness/fretes/validacao-pre-commit.log`.

### Correção da integração ORS após homologação

O erro 502 com mensagem de rota inválida foi reproduzido por três testes com
zero, uma e cinco paradas. A integração enviava `instructions: false`, que faz
o ORS limpar os segmentos; o mock inicial devolvia segmentos indevidamente nessa
situação. Corrigida a opção para true e adicionado um mock que respeita esse
comportamento do provedor. Os três casos falharam antes do ajuste e passaram depois.
Não houve mudança nos contratos da API, coeficientes ou esquema do banco.

Fluxo oficial após a correção: 230 testes backend descobertos, executados e aprovados;
216 testes frontend aprovados; nenhum reprovado ou ignorado. Restore, builds e
TypeScript aprovados. Relatórios em
`.local/harness/test-results/2a33711fe73346df8cbacef86dc70859/` e
`.local/harness/fretes/validacao-correcao-ors.log`. A simulação autenticada real
precisa ser repetida após a atualização do serviço Render.
