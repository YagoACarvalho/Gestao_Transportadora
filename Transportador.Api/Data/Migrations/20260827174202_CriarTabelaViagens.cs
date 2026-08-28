using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Transportador.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CriarTabelaViagens : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "viagens",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    motorista_id = table.Column<Guid>(type: "uuid", nullable: true),
                    caminhao_id = table.Column<Guid>(type: "uuid", nullable: true),
                    origem = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    destino = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    data_viagem = table.Column<DateOnly>(type: "date", nullable: true),
                    valor_frete = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    data_cadastro = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_viagens", x => x.id);
                    table.ForeignKey(
                        name: "FK_viagens_caminhoes_caminhao_id",
                        column: x => x.caminhao_id,
                        principalTable: "caminhoes",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_viagens_motoristas_motorista_id",
                        column: x => x.motorista_id,
                        principalTable: "motoristas",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_viagens_caminhao_id",
                table: "viagens",
                column: "caminhao_id");

            migrationBuilder.CreateIndex(
                name: "IX_viagens_motorista_id",
                table: "viagens",
                column: "motorista_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "viagens");
        }
    }
}
