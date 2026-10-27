# Reformulação completa do frontend — 27/10/2026

## Resultado

Motoristas, Caminhões, Viagens, Despesas, Resumo financeiro e todos os estados do
acesso usam a linguagem visual do kit. A navegação desktop é horizontal; no celular,
ela se abre em diálogo. Cabeçalhos, cards, botões, badges, tabelas e formulários
compartilham os tokens `--ul-*`. Os aliases e dois arquivos CSS do design anterior,
sem consumidores, foram removidos. A lógica de autenticação e persistência foi mantida.

Os resumos são derivados das consultas existentes. Não há requisições ou contratos
novos. O filtro de viagens oferece atalhos sincronizados com a seleção existente.
Carregamento e erro não exibem contagens falsas de zero. Financeiro mantém saldo
previsto, alternativas textuais, categorias e tratamento dos valores negativos.

## Validação executada

Comando oficial: `powershell -NoProfile -File ./scripts/validar.ps1`.

Execução concluída: `.local/harness/test-results/4471fdc04a4a4eb6a09718b19dfdbea7/`.

| Etapa | Resultado |
| --- | --- |
| Restore e build backend | Aprovados |
| Descoberta backend | 188 casos |
| Testes backend | 188 executados e aprovados; zero reprovados e ignorados |
| Instalação frontend pelo lockfile | Aprovada; zero vulnerabilidades reportadas |
| TypeScript | Aprovado |
| Testes frontend | 155 executados e aprovados; zero reprovados e ignorados |
| Build frontend | Aprovado |
| Revisão `git diff --check` | Sem problemas |

A primeira tentativa do harness parou em `npm ci` porque o servidor Vite da revisão
visual mantinha um módulo nativo em uso no Windows. Esse servidor foi encerrado e
o fluxo oficial foi repetido por completo, sem alterações de permissões.
Avisos de dependência descontinuada, dimensões dos gráficos em jsdom e diretivas
`use client` do Motion permanecem registrados nos logs.

## Revisão no Chrome

Revisão com Chrome headless local, em página isolada e ignorada pelo Git,
`frontend/.local/visual.html`. Dados fictícios são explicitamente identificados;
a página intercepta consultas e não acessa serviços reais. Não altera a entrada
de produção nem o controle de acesso da aplicação.

Relatório: `.local/harness/reformulacao-visual/resultados.json`.
Capturas: `.local/harness/reformulacao-visual/*.png`.

- 32 cenários concluídos, sem exceções JavaScript nem transbordamento horizontal
  da página ou dos formulários verificados.
- Cinco módulos e login revisados a 1440 px e 360 px; capturas de página completa.
- Formulários de Motoristas, Caminhões, Viagens e Despesas revisados no celular.
- Escape fecha esses formulários e retorna foco ao acionador.
- Menu móvel navega e fecha; confirmação de pausa mantém o foco dentro do diálogo
  e atualiza a ação para retomar depois da resposta simulada.
- Estados vazio e erro de viagens revisados; preferência por movimento reduzido
  ativada no navegador.

## Limites e continuidade

Nenhuma alteração em API, migrations, banco, dependências ou contratos HTTP.
Não foram testados Supabase real, PostgreSQL, deploy ou entrega de e-mails.
A família Plus Jakarta Sans está declarada, mas seu arquivo não está distribuído;
o navegador utiliza fallback local quando a fonte não está instalada. Nenhum
serviço externo de fontes é consultado.

As alterações desta reformulação permanecem sem commit para revisão.
Direção visual vigente: [design-system.md](design-system.md).
