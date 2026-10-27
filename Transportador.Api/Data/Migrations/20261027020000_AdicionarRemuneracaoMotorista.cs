using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Transportador.Api.Data.Migrations;

public partial class AdicionarRemuneracaoMotorista : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "origem", table: "despesas", type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "Manual");
        migrationBuilder.AddColumn<bool>(name: "gerar_remuneracao_automatica", table: "viagens", type: "boolean", nullable: false, defaultValue: false);
        migrationBuilder.CreateIndex(name: "IX_despesas_remuneracao_viagem", table: "despesas", columns: new[] { "viagem_id", "origem" }, unique: true,
            filter: "origem = 'RemuneracaoMotorista' AND viagem_id IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_despesas_remuneracao_viagem", table: "despesas");
        migrationBuilder.DropColumn(name: "origem", table: "despesas");
        migrationBuilder.DropColumn(name: "gerar_remuneracao_automatica", table: "viagens");
    }
}
