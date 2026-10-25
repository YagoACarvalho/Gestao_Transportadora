# Conciliação com a main remota

Base: origin/main em 95d0aec. Referência do trabalho local: feature/frontend-react
em 03866fb. Os históricos originais não têm ancestral comum; esta branch parte da
main remota e incorpora seletivamente a implementação, sem reescrever históricos.

- Preservar DespesasController, RelatoriosController, seus DTOs/modelos e AppDbContext.
- Preservar integralmente as quatro migrations e o snapshot remoto.
- Incorporar frontend, testes isolados, harness e documentação.
- Preservar todos os caminhos HTTP de Viagens e suas respostas com relações aninhadas.
- Adaptar o cliente React ao JSON remoto e ao DELETE de cancelamento.
- Aplicar as regras de negócio aprovadas no backend; documentar validações mais
  restritivas e situação inicial determinada pelo servidor em viagens.md.
- Manter a branch feature/frontend-react intacta. Os manifests npm de ferramentas
  da raiz original permanecem nessa branch; não são dependências do frontend.

O PR é rascunho. Não executa migrations ou banco externo e não faz merge automático.
Ainda exige revisão de compatibilidade de consumidores externos não presentes no
repositório e validação real no desenvolvimento previamente confirmado. Dados
sensíveis, certificados, builds, caches e logs não são versionados.
