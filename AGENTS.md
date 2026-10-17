# Guia de trabalho dos agentes

## Projeto confirmado
- Raiz do repositório: diretório que contém `GestaoTransportadora.slnx`.
- Solução `GestaoTransportadora.slnx`, com um projeto: `Transportador.Api`.
- API C# / ASP.NET Core, .NET 10, nullable e implicit usings habilitados.
- EF Core Design e ASP.NET Core OpenAPI 10.0.11; Npgsql EF Core PostgreSQL 10.0.3.
- Controllers acessam `AppDbContext` diretamente por injeção de dependência. Não foram identificados frontend, serviços ou repositórios separados.
- PostgreSQL configurado por `DefaultConnection`, ausente nos appsettings examinados; há `UserSecretsId`. Banco efetivo e migrations aplicadas não foram verificados.

## Módulos
- `Controllers/MotoristasController.cs`: cadastro, consultas, atualização e desativação de motoristas.
- `Controllers/CaminhoesController.cs`: mesmas operações para caminhões.
- `Models/Models.cs`: entidade `Viagem`; possui mapeamento e migration, sem controller ou DTOs identificados.
- `Dtos`: entradas de cadastro e atualização. `Models`: entidades retornadas pela API.
- `Data/AppDbContext.cs`: mapeamento de motoristas, caminhões e viagens; `Data/Migrations`: três migrations e snapshot.
- `WeatherForecast`: exemplo do template ainda presente.

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
- Para mudanças significativas, apresente antes um plano com objetivo, arquivos envolvidos, impactos, riscos e validação prevista. Atualize-o se o escopo mudar.
- Obtenha aprovação explícita e específica antes de alterar migrations, esquema do banco, dependências ou contratos HTTP, incluindo rotas, entradas, respostas e códigos de status. Autorização genérica para implementar não basta.

## Segurança e escopo
- Não acesse banco de produção, exponha credenciais ou execute comandos destrutivos.
- Não leia nem imprima segredos para diagnóstico; trate configurações sensíveis sem revelar valores.
- Não altere arquivos sem relação com a tarefa nem descarte alterações existentes. Inspecione o estado disponível antes de editar e preserve o trabalho do usuário.
- Git (`.git`) inicializado na raiz deste workspace, com branch `main` e sem commits na preparação inicial. Testes automatizados ainda não foram identificados. Não presuma histórico ou cobertura; confira a branch atual antes de trabalhar.
- Há artefatos `bin/obj` com caminhos antigos em C:. Não os trate como fonte de verdade nem os remova sem autorização apropriada.

## Execução e verificação
- Na raiz: `dotnet build GestaoTransportadora.slnx` para compilação.
- Execução: `dotnet run --project Transportador.Api --launch-profile http` ou perfil `https`.
- Perfis: HTTP `localhost:5117`; HTTPS `localhost:7148`. Há redirecionamento HTTPS.
- Em Development, OpenAPI em `/openapi/v1.json`. `Transportador.Api.http` contém somente uma requisição WeatherForecast.
- Execute apenas verificações compatíveis com o escopo autorizado; build pode restaurar dependências e gerar artefatos. Antes de iniciar a API, confirme configuração e destino de desenvolvimento sem expor segredos.
- Não execute migrations ou comandos de banco como validação automática.
- Não foram identificados suíte de testes, CI, Docker ou manifesto local do `dotnet-ef`. Confirme ferramentas disponíveis antes de depender delas.
- Relate comandos realmente executados, resultados e limitações. Compilar não equivale a testar comportamento; nunca invente testes, sucesso ou conexão validada.

## Pendências de negócio — não assumir decisões
- Motorista é criado com `Ativo = false`; caminhão nasce ativo. Confirmar comportamento desejado.
- Definir obrigatoriedade, formato e unicidade de CPF, CNH e placa, além da validação dos demais campos.
- Confirmar semântica de atualização: omitir `Ativo` nos DTOs atuais resulta em `false`.
- Definir campos obrigatórios, estados e transições de viagens, regras de frete e uso de motorista/caminhão inativos.
- Definir requisitos de autenticação, autorização e tratamento de erros de persistência.
- Registrar decisões somente quando confirmadas pelo usuário; manter lacunas explicitamente como pendências.
