using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Transportador.Api.Data.Migrations;

public partial class CriarFechamentos : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "fechamentos", columns: table => new
        {
            id = table.Column<Guid>(type: "uuid", nullable: false),
            titulo = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
            data_inicial = table.Column<DateOnly>(type: "date", nullable: false),
            data_final = table.Column<DateOnly>(type: "date", nullable: false),
            data_criacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
            usuario_id = table.Column<Guid>(type: "uuid", nullable: false),
            chave_requisicao = table.Column<Guid>(type: "uuid", nullable: false),
            versao_formato = table.Column<int>(type: "integer", nullable: false),
            conteudo_json = table.Column<string>(type: "text", nullable: false)
        }, constraints: table => table.PrimaryKey("PK_fechamentos", x => x.id));
        migrationBuilder.CreateIndex(name: "IX_fechamentos_data_criacao", table: "fechamentos", column: "data_criacao");
        migrationBuilder.CreateIndex(name: "IX_fechamentos_usuario_id_chave_requisicao", table: "fechamentos", columns: ["usuario_id", "chave_requisicao"], unique: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("fechamentos");
}
