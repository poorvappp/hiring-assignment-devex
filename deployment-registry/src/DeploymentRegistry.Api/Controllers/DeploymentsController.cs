using DeploymentRegistry.Api.Models;
using DeploymentRegistry.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DeploymentRegistry.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DeploymentsController : ControllerBase
{
    private readonly IDeploymentService _deploymentService;

    public DeploymentsController(IDeploymentService deploymentService)
    {
        _deploymentService = deploymentService;
    }

    [HttpGet]
    public async Task<ActionResult<List<Deployment>>> GetAll(
        [FromQuery] string? serviceName,
        [FromQuery] string? environment,
        [FromQuery] string? status)
    {
        var deployments = await _deploymentService.GetAsync(serviceName, environment, status);
        return Ok(deployments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Deployment>> GetById(string id)
    {
        var deployment = await _deploymentService.GetByIdAsync(id);
        if (deployment is null)
            return NotFound();

        return Ok(deployment);
    }

    [HttpPost]
    public async Task<ActionResult<Deployment>> Create([FromBody] Deployment deployment)
    {
        deployment.Id = null;
        deployment.StartedAt = DateTime.UtcNow;
        var created = await _deploymentService.CreateAsync(deployment);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Deployment>> Update(string id, [FromBody] Deployment deployment)
    {
        deployment.Id = id;
        var updated = await _deploymentService.UpdateAsync(id, deployment);
        if (updated is null)
            return NotFound();

        return Ok(updated);
    }
}
