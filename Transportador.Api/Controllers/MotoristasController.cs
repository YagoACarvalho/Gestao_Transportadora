using Microsoft.AspNetCore.Mvc;
using Transportador.Api.Dtos;
using Transportador.Api.Models;

namespace Transportador.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MotoristasController : ControllerBase
{
    private static readonly List<Motorista> motoristas = [];

    [HttpGet]
    public ActionResult<IEnumerable<Motorista>> Get()
    {
        return Ok(motoristas);
    }

    [HttpGet("{id:guid}")]
    public ActionResult<Motorista> ObterPorId(Guid id)
    {
        Motorista? motorista = motoristas.FirstOrDefault(m => m.Id == id);
        if (motorista == null)
        {
            return NotFound();
        }
        return Ok(motorista);  
    }

    [HttpPost]
    public ActionResult<Motorista> Cadastrar(CriarMotoristaDto dto)
    {
        Motorista motorista = new()
        {
            Nome = dto.Nome,
            Cpf = dto.Cpf,
            NumeroCnh = dto.NumeroCnh,
            CategoriaCnh = dto.CategoriaCnh,
            DataValidadeCnh = dto.DataValidadeCnh,
            Telefone = dto.Telefone,
        };

        motoristas.Add(motorista);

        return CreatedAtAction(
            nameof(ObterPorId), 
            new { id = motorista.Id }, 
            motorista
        );
    }
}