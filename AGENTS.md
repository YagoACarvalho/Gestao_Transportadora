# Guia de trabalho dos agentes

## Projeto confirmado
- Raiz do repositório: diretório que contém `GestaoTransportadora.slnx`.
- Solução `GestaoTransportadora.slnx`: API `Transportador.Api` e testes `tests/Transportador.Api.Tests`.
- API C# / ASP.NET Core, .NET 10, nullable e implicit usings habilitados.
- EF Core Design e ASP.NET Core OpenAPI 10.0.11; Npgsql EF Core PostgreSQL 10.0.3.
- Controllers acessam `AppDbContext` diretamente por injeção de dependência. Frontend React/TypeScript em `frontend/`; não há camada separada de serviços/repositórios na API.
- PostgreSQL configurado por `DefaultConnection`, ausente nos appsettings examinados; há `UserSecretsId`. Banco efetivo e migrations aplicadas não foram verificados.

## Módulos
- `Controllers/MotoristasController.cs`: cadastro, consultas, atualização e desativação de motoristas.
- `Controllers/CaminhoesController.cs`: mesmas operações para caminhões.
- `Models/Models.cs`: entidade `Viagem`; `ViagensController` e DTOs implementam consulta, cadastro, edição e transições aprovadas, sem alteração de esquema.
- `Dtos`: entradas de cadastro e atualização. `Models`: entidades retornadas pela API, incluindo Viagem com Motorista/Caminhao aninhados.
- `DespesasController` e `RelatoriosController`: funcionalidades da main remota preservadas; testes de regressão isolados cobrem CRUD de despesas e resumo financeiro.
- `Data/AppDbContext.cs`: mapeamento de motoristas, caminhões e viagens; `Data/Migrations`: quatro migrations e snapshot, incluindo Despesas da main remota.
- `frontend/`: React, TypeScript, Vite, CSS Modules e Motion; Motoristas, Caminhões e Viagens integrados por URLs relativas e proxy HTTPS de desenvolvimento, sem CORS adicional.
- `WeatherForecast`: exemplo do template ainda presente.
- `tests/Transportador.Api.Tests`: xUnit v3/VSTest, testes de motoristas com SQLite em memória isolado por caso e validação DataAnnotations separada.

## Convenções existentes
- Identificadores de domínio em português, tipos e métodos em PascalCase; namespaces por arquivo.
- Operações de persistência assíncronas; consultas de leitura com `AsNoTracking`.
- IDs `Guid`, cadastro com `DateTime.UtcNow`, datas civis com `DateOnly`.
- Mapeamento Fluent API, tabelas e colunas em snake_case.
- Rotas de domínio `api/[controller]`; DTOs de entrada e entidades nas respostas.
- `DELETE` desativa via `Ativo`; listagens excluem inativos por padrão e aceitam `incluirInativos`.
- Preserve o estilo local; não faça reformatações amplas.

## Antes de implementar
- Leia os arquivos afetados, seus consumidores, DTOs, modelos, mapeamentos, configurações e referências do `.csproj`.
- Confira a estrutura e as instruções atuais; diferencie fatos do código, hipóteses e requisitos do usuário.
- Para mudanças significativas, apresente antes um plano com objetivo, arquivos envolvidos, impactos, riscos e validação prevista e aguarde aprovação explícita. Atualize-o se o escopo mudar.
- Obtenha aprovação explícita e específica antes de alterar migrations, esquema do banco, dependências ou contratos HTTP, incluindo rotas, entradas, respostas e códigos de status. Autorização genérica para implementar não basta.

## Segurança e escopo
- Não acesse banco de produção, exponha credenciais ou execute comandos destrutivos.
- Não leia nem imprima segredos para diagnóstico; trate configurações sensíveis sem revelar valores.
- Não altere arquivos sem relação com a tarefa nem descarte alterações existentes. Inspecione o estado disponível antes de editar e preserve o trabalho do usuário.
- Conciliação baseada em origin/main; a branch original permanece preservada. Confira branch, histórico e alterações atuais antes de trabalhar; não presuma cobertura de testes.
- Artefatos `bin/obj` não são fonte de verdade; podem conter caminhos antigos. Não os remova sem autorização apropriada.

## Execução e verificação
- Fluxo oficial: `powershell -NoProfile -File ./scripts/validar.ps1`; detalhes em `docs/desenvolvimento.md`.
- O script configura caches e temporários em `.local/harness/` na raiz (G: neste workspace), restaura o ambiente ao terminar e executa restore, build sem restore, descoberta e testes sem build/restore. Interrompa em falhas; não aceite zero testes como sucesso.
- Comandos individuais, após preparar o ambiente: `dotnet restore GestaoTransportadora.slnx`; `dotnet build GestaoTransportadora.slnx --no-restore`; `dotnet test tests/Transportador.Api.Tests/Transportador.Api.Tests.csproj --list-tests --no-build --no-restore`; `dotnet test tests/Transportador.Api.Tests/Transportador.Api.Tests.csproj --no-build --no-restore`.
- Ciclo: investigação → planejamento → aprovação aplicável → implementação → build → testes → revisão de alterações. Revise `git diff --check`, `git diff`, status e arquivos novos; não descarte trabalho existente nem crie commits sem autorização.
- A suíte backend contém 64 casos após os testes HTTP isolados; essa contagem é referência, não limite permanente. Registre descoberta, execução, aprovados, reprovados e ignorados; preserve TRX e logs ignorados em `.local/harness/`.
- SQLite não comprova PostgreSQL ou migrations. Testes HTTP isolados validam o pipeline com SQLite; testes não devem acessar PostgreSQL, User Secrets ou bancos externos.
- Execução: `dotnet run --project Transportador.Api --launch-profile http` ou perfil `https`.
- Perfis: HTTP `localhost:5117`; HTTPS `localhost:7148`. Há redirecionamento HTTPS.
- Em Development, OpenAPI em `/openapi/v1.json`. `Transportador.Api.http` contém somente uma requisição WeatherForecast.
- Execute apenas verificações compatíveis com o escopo autorizado; build pode restaurar dependências e gerar artefatos. Antes de iniciar a API, confirme configuração e destino de desenvolvimento sem expor segredos.
- Não execute migrations ou comandos de banco como validação automática.
- Não foram identificados CI, Docker ou manifesto local do `dotnet-ef`. Confirme ferramentas disponíveis antes de depender delas.
- Em bloqueio de rede ou permissão, interrompa e informe a etapa e o procedimento manual; não ignore fontes com falha, altere permissões ou saia do sandbox sem autorização.
- Relate comandos realmente executados, resultados e limitações. Compilar não equivale a testar comportamento; nunca invente testes, sucesso ou conexão validada.

## Pendências de negócio — não assumir decisões
- Regra aprovada: novos motoristas são cadastrados ativos (`Ativo = true`), garantido pelo backend. Cadastros existentes não são alterados automaticamente.
- Nome, placa e modelo obrigatórios no cadastro e edição; limites alinhados ao esquema.
- CPF opcional normalizado também no backend; CPF/CNH continuam sem validação de dígitos ou unicidade. Placa sem nova máscara/unicidade.
- Reativação de motoristas/caminhões disponível na edição, sempre com Ativo explícito.
- Despesas: descrição, categoria, data e valor positivo com até duas casas obrigatórios. Viagem opcional, permitida em todas as fases. Exclusão física com confirmação.
- Remuneração automática: 15% do frete por nova viagem, arredondado com AwayFromZero; legado sem geração retroativa. Lançamento automático só altera inclusão financeira por PATCH; valor/data acompanham a viagem, sem duplicação. Migration criada, aplicação separada. Ver docs/remuneracao-motoristas.md.
- Resumo financeiro mantém contrato legado, apresentado como saldo previsto, não lucro realizado. Detalhes e concorrência em docs/mvp.md.
- Confirmar semântica de atualização: omitir `Ativo` nos DTOs atuais resulta em `false`.
- Viagens: origem, destino, data, motorista e caminhão obrigatórios para novas entradas; frete opcional não negativo com até duas casas. Nasce Planejada; segue para Em andamento e Concluída; pode cancelar antes da conclusão. Dados editáveis somente em Planejada; novos vínculos exigem ativos, preservando vínculos históricos. Contratos e limites em docs/viagens.md.
- Autenticação aprovada: Supabase Auth, uma transportadora, acesso por convite e mesmo acesso operacional para usuários autorizados. JWT ES256/RS256 com JWKS, lista de IDs permitidos na API; 401 sem autenticação, 403 sem autorização. Configuração externa/deploy exigem confirmação separada. Detalhes em docs/publicacao.md.
- Registrar decisões somente quando confirmadas pelo usuário; manter lacunas explicitamente como pendências.

## Kit visual recebido — integração incremental

Transições aprovadas nesta entrega: Em andamento permite Pausada; Pausada permite
retomar para Em andamento ou cancelar. Não concluir diretamente uma pausa.
Preservar despesas e remuneração ao pausar/retomar; dados continuam editáveis
somente em Planejada. Não há migration para a nova situação.

Reabertura aprovada: Concluída/Cancelada podem voltar a Planejada após confirmação,
sem editar dados no mesmo pedido. Regularização aprovada: situação null/vazia ou
só espaços pode virar Planejada com os campos obrigatórios completos. Preservar
despesas, escolhas financeiras e flag de remuneração, sem geração retroativa.
Novos vínculos exigem ativos; vínculos históricos inativos são preservados.

O kit solicitado foi copiado para `src/ui/` na raiz deste worktree. O código da
aplicação continua em `frontend/src/`. A adaptação aprovada está em
`frontend/src/ui/`, com CSS Modules e tokens compartilhados. Não importar o CSS
global do kit de referência; ele permanece preservado em `src/ui/`.
O `ExamplePage.tsx` é uma referência ilustrativa: seus nomes, valores e métricas
não representam dados da transportadora e não devem aparecer nas telas reais.
As diretrizes visuais abaixo são o conteúdo do anexo solicitado pelo usuário;
não substituem as regras de segurança, aprovação, contratos e validação acima.
Preservar autenticação, navegação, CSS Modules e lógica de dados ao adaptar o kit.
Não carregar automaticamente a fonte externa declarada no CSS. Antes da adoção,
revisar contraste, tokens literais restantes, controles sem ação e acessibilidade.
A migração de telas ocorre na etapa de integração aprovada, sem ampliar o escopo
de uma correção funcional isolada para uma reformulação visual geral.

### Diretrizes visuais do anexo
# AGENTS.md — Design System "Ultraleads"

Todas as telas do frontend DEVEM seguir este design system. A referência visual é o
dashboard "Sales Overview" (Ultraleads): interface clara, suave, com vidro fosco (glassmorphism leve),
cartões grandes arredondados, azul-marinho como cor de autoridade e ciano → menta como cor de energia.

## Regras obrigatórias

1. **Nunca escreva cores, raios, sombras ou fontes soltos.** Use sempre as variáveis de `src/ui/tokens.css`
   (`var(--ul-...)`). Se faltar um token, crie-o em `tokens.css` antes de usar.
2. **Reutilize os componentes de `src/ui/`** (`Card`, `StatCard`, `Badge`, `Pill`, `Button`, `Tabs`,
   `Avatar`, `ProgressCard`, `GaugeChart`, `BarChartCard`, `ListRow`, `PageHeader`, `AppShell`).
   Só crie um componente novo se nenhum existente resolver — e então ele deve usar os mesmos tokens
   e ficar em `src/ui/`.
3. **Toda tela nova** usa `<AppShell>` (barra superior + fundo) e `<PageHeader>` (título + subtítulo + ações).
4. **Layout:** grid de cartões com `gap: var(--ul-space-5)`; o conteúdo fica dentro de um painel
   `.ul-surface` com raio `--ul-radius-xl`. Em telas < 900px, o grid vira 1 coluna.
5. **Telas existentes:** ao tocar em qualquer tela antiga, migre-a para estes componentes e tokens
   (sem reescrever a lógica de dados).
6. **Não adicione** bordas pretas, sombras duras, cantos retos, cores saturadas fora da paleta,
   nem fontes diferentes da definida em `--ul-font`.

## Paleta (resumo)

| Papel | Token | Valor |
|---|---|---|
| Fundo da página | `--ul-bg-page` | `#E3E4E8` |
| Painel principal | `--ul-bg-surface` | `#F5F8FC` |
| Cartão | `--ul-bg-card` | `#FCFDFF` |
| Azul-marinho (destaque, item ativo) | `--ul-navy-600` | `#244B7E` |
| Ciano (ação primária) | `--ul-cyan-500` | `#1FA0CE` |
| Menta (positivo/gráficos) | `--ul-mint-400` | `#7CE3C1` |
| Vermelho suave (negativo) | `--ul-red-500` | `#E5605E` |
| Texto principal | `--ul-text` | `#0F1F3D` |
| Texto secundário | `--ul-text-muted` | `#7A8799` |

## Tipografia

- Fonte única: **Plus Jakarta Sans** (fallback: Inter, system-ui). Importada em `tokens.css`.
- Título de página: 34px / 700. Título de cartão: 18px / 500. Número grande (KPI): 40px / 600.
  Corpo: 14px. Legenda: 12px muted.
- Texto em sentence case (não use CAIXA ALTA em rótulos).

## Forma e profundidade

- Raios: cartão `20px`, painel `28px`, pílula/botão `999px`, barra de gráfico `14px`.
- Sombra: sempre `--ul-shadow-card` (suave, azulada). Sem bordas escuras; no máximo `1px` com `--ul-border`.
- Cartão de destaque (1 por tela, no máximo): gradiente `--ul-grad-navy` com texto branco.
- Gradientes de dados: `--ul-grad-cyan-mint`. Barras e progresso levam listras diagonais sutis (`.ul-stripes`).

## Padrões de componentes

- **Item ativo** (nav, tabs): pílula preenchida navy, texto branco. Inativo: texto `--ul-text-muted`, sem fundo.
- **Variação percentual:** `<Badge tone="positive">+22%</Badge>` (menta) ou `tone="negative"` (vermelho suave).
- **Botão primário:** pílula ciano com ícone à esquerda. **Secundário:** pílula translúcida `--ul-bg-pill`.
- **Cartão com menu:** título à esquerda e `⋯` (três pontos ciano) à direita.
- **Lista com avatar:** `ListRow` = avatar redondo + texto à esquerda e pílula azul à direita.
- **Gráficos:** segmentos arredondados, degradê ciano→menta, o item de maior valor em destaque
  (mais saturado), os demais translúcidos; valores negativos em vermelho suave.

## Acessibilidade e qualidade

- Contraste mínimo AA em texto (texto muted só em fundos claros).
- Foco visível em todo elemento interativo (`:focus-visible` já está em `components.css`).
- Respeitar `prefers-reduced-motion`. Sem animações decorativas.
- Responsivo até 360px; nada com largura fixa em px nos cartões.

## Checklist antes de finalizar qualquer tela

- [ ] Só usei `var(--ul-*)` para cor, raio, sombra, espaçamento e fonte
- [ ] Usei `AppShell` + `PageHeader`
- [ ] Reaproveitei componentes de `src/ui/`
- [ ] Máximo de um cartão navy de destaque
- [ ] Testei em mobile (1 coluna) e desktop
