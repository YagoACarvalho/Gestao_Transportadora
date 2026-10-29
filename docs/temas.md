# Tema claro, escuro e do sistema

O seletor Tema está disponível no login (incluindo estados de erro e recuperação)
e no cabeçalho do sistema, também no mobile. As opções são Claro, Escuro e Sistema.
Sem preferência válida salva, acompanha o sistema operacional.

A escolha é salva apenas neste navegador em `localStorage`, na chave
`gt.ui.theme`. Não é configuração do usuário no servidor. Logout preserva a escolha;
nenhuma informação de autenticação é gravada nessa chave. Se o armazenamento
estiver bloqueado, a escolha continua funcionando na aba atual até recarregar.
Abas abertas sincronizam alterações; Sistema acompanha mudanças do sistema ao vivo.

`public/theme-init.js` é um script externo da mesma origem, executado no head antes
do React e dos estilos para restaurar o tema inicial. Não exige liberar scripts
inline na CSP. `src/ui/theme.ts` integra a preferência, eventos e a cor da barra do
navegador. O seletor reutilizável fica em `src/ui/ThemeSelector.tsx`.

As cores ficam exclusivamente em `frontend/src/ui/tokens.css`, incluindo a variante
`:root[data-theme='dark']`. Os temas usam os mesmos componentes, fontes, espaços,
raios e hierarquia. Tokens semânticos específicos cuidam de links, foco, hover,
seleção e gráficos sem comprometer o texto branco dos botões e destaques navy.
`color-scheme` adapta controles nativos e barras de rolagem. A troca não adiciona
animações nem dependências. Sem mudanças no banco, API ou permissões de acesso.

## Verificação

- Testes de persistência/restauração, acompanhamento do sistema, limpeza de
  listeners, sincronização entre abas, valores inválidos e armazenamento bloqueado.
- Bootstrap exercitado antes da inicialização React.
- Revisão Chrome isolada em 1440 px e 360 px, com dados fictícios: módulos de
  motoristas, caminhões, viagens, despesas, financeiro, login e modal de despesa.
- 44 verificações visuais/de layout passaram, sem exceções JavaScript.
- 30 pares de tokens de texto/fundo dos dois temas atingiram contraste de 4,5:1
  ou superior. Isso não equivale a uma auditoria completa de acessibilidade.
- Evidências locais ignoradas pelo Git em `.local/harness/tema-visual/`.

Publicação exige commit/push autorizado e validação do build. Não há migration.
