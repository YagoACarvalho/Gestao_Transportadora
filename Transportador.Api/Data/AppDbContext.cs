using Microsoft.EntityFrameworkCore;
using Transportador.Api.Models;

namespace Transportador.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Motorista> Motoristas => Set<Motorista>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        var motorista = modelBuilder.Entity<Motorista>();

        motorista.ToTable("motoristas");

        motorista.HasKey(m => m.Id);

        motorista.Property(m => m.Id)
            .HasColumnName("id");

        motorista.Property(m => m.Nome)
            .HasColumnName("nome")
            .HasMaxLength(150)
            .IsRequired();

        motorista.Property(m => m.Cpf)
            .HasColumnName("cpf")
            .HasMaxLength(11);

        motorista.Property(m => m.NumeroCnh)
            .HasColumnName("numero_cnh")
            .HasMaxLength(20);

        motorista.Property(m => m.CategoriaCnh)
            .HasColumnName("categoria_cnh")
            .HasMaxLength(5);

        motorista.Property(m => m.DataValidadeCnh)
            .HasColumnName("data_validade_cnh");

        motorista.Property(m => m.Telefone)
            .HasColumnName("telefone")
            .HasMaxLength(20);

        motorista.Property(m => m.Ativo)
            .HasColumnName("ativo")
            .IsRequired();

        motorista.Property(m => m.DataCadastro)
            .HasColumnName("data_cadastro")
            .HasColumnType("timestamp with time zone")
            .IsRequired();
    }
}