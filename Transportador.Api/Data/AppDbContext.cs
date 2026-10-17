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
    public DbSet<Caminhao> Caminhoes => Set<Caminhao>();
    public DbSet<Viagem> Viagens => Set<Viagem>();

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

        var caminhao = modelBuilder.Entity<Caminhao>();

        caminhao.ToTable("caminhoes");

        caminhao.HasKey(c => c.Id);

        caminhao.Property(c => c.Id)
            .HasColumnName("id");

        caminhao.Property(c => c.Placa)
            .HasColumnName("placa")
            .HasMaxLength(10)
            .IsRequired();

        caminhao.Property(c => c.Modelo)
            .HasColumnName("modelo")
            .HasMaxLength(100)
            .IsRequired();

        caminhao.Property(c => c.Ativo)
            .HasColumnName("ativo")
            .IsRequired();

        caminhao.Property(c => c.DataCadastro)
            .HasColumnName("data_cadastro")
            .HasColumnType("timestamp with time zone")
            .IsRequired();


        var viagem = modelBuilder.Entity<Viagem>();

        viagem.ToTable("viagens");

        viagem.HasKey(v => v.Id);

        viagem.Property(v => v.Id)
            .HasColumnName("id");

        viagem.Property(v => v.MotoristaId)
            .HasColumnName("motorista_id");

        viagem.Property(v => v.CaminhaoId)
            .HasColumnName("caminhao_id");

        viagem.Property(v => v.Origem)
            .HasColumnName("origem")
            .HasMaxLength(150);

        viagem.Property(v => v.Destino)
            .HasColumnName("destino")
            .HasMaxLength(150);

        viagem.Property(v => v.DataViagem)
            .HasColumnName("data_viagem");

        viagem.Property(v => v.ValorFrete)
            .HasColumnName("valor_frete")
            .HasPrecision(12, 2);

        viagem.Property(v => v.Status)
            .HasColumnName("status")
            .HasMaxLength(50);

        viagem.Property(v => v.DataCadastro)
            .HasColumnName("data_cadastro")
            .HasColumnType("timestamp with time zone")
            .IsRequired();

        viagem.HasOne(v => v.Motorista)
            .WithMany()
            .HasForeignKey(v => v.MotoristaId)
            .OnDelete(DeleteBehavior.SetNull);

        viagem.HasOne(v => v.Caminhao)
            .WithMany()
            .HasForeignKey(v => v.CaminhaoId)
            .OnDelete(DeleteBehavior.SetNull);
    } 
}