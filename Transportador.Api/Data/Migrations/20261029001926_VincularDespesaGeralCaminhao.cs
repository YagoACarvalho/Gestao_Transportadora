using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Transportador.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class VincularDespesaGeralCaminhao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "caminhao_id",
                table: "despesas",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_despesas_caminhao_id",
                table: "despesas",
                column: "caminhao_id");

            migrationBuilder.AddForeignKey(
                name: "FK_despesas_caminhoes_caminhao_id",
                table: "despesas",
                column: "caminhao_id",
                principalTable: "caminhoes",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_despesas_caminhoes_caminhao_id",
                table: "despesas");

            migrationBuilder.DropIndex(
                name: "IX_despesas_caminhao_id",
                table: "despesas");

            migrationBuilder.DropColumn(
                name: "caminhao_id",
                table: "despesas");
        }
    }
}
