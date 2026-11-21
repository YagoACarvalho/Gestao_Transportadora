# Componentes v2 da Gestão Transportadora

Origem autorizada: `DCSEmpresarial/application`, commit
`7739a8a82f01fec5d34ba63a7940f52e69e41ec8`.
Fonte: `docs/rh/src/app/componentes-v2/`. A documentação da origem identifica a
base como código incorporado da aleph-ui 0.4.0, de `INTERFACE_biblioteca` (`443b567`).

São renderizados os componentes reais da base: CascaApp, MenuLateral,
BarraSuperior, CabecalhoPagina, Botao, Cartao, Selo, Avatar, CaixaEntrada,
EstadoVazio, GrupoAlternavel e Modal. As dependências internas necessárias estão
preservadas em `base/`. Não foram importados dados, APIs, autenticação ou regras
do RH.

Os indicadores vêm de `indicadores.tsx` e `indicadores.module.css`: MolduraIndicador,
GradeIndicadores, ValorIndicador, RodapeIndicador, BarraSegmentada e ListaSegmentos.
Os demais indicadores da origem ficam disponíveis para composição. Nenhuma
comparação, percentual ou meta é inventada. Séries mensais continuam no Recharts,
preservando ordem, lacunas, sinais e valores do domínio.

Adaptações para React/Vite:

- Imports relativos, links hash nativos e remoção de `next/link`.
- Entrada central exporta somente os componentes portados e suas dependências.
  Utilitários internacionais de telefone não utilizados ficaram fora.
- CabecalhoPagina aceita refTitulo para preservar o foco das telas existentes.
- Modal fecha o diálogo nativo antes de devolver o foco ao acionador na desmontagem.
- TabelaSemantica é uma composição na própria base Tabela, com suas classes,
  densidade e estrutura. Preserva captions, células, eventos e listas existentes,
  sem introduzir paginação ou ordenação que mudem os recortes de negócio.
- Campos nativos de `../Fields.tsx` ficam dentro de CaixaEntrada para preservar
  eventos, labels e validação dos formulários. Nenhuma máscara nova foi aplicada.
- As notas dos indicadores podem quebrar linha para mostrar informações completas.

Tokens originais em `base/tema/tokens.css`; extensões em `../tokens.css` aplicam
cores neutras de ação, sombras zeradas, fonte Inter local e contraste do texto
secundário. Não copiar o CSS de remoção de foco do RH: foco visível é obrigatório.
A preferência existente `gt.ui.theme` aplica `data-tema=claro/escuro` da base e
preserva `data-theme` para integrações existentes.

O kit anterior em `../leange/` é histórico: não é importado pela aplicação e está
fora do projeto TypeScript. Emotion, Phosphor e react-number-format foram retirados
das dependências ativas. A remoção/movimentação da pasta histórica foi bloqueada
pelo ambiente, sem alteração de permissões.
