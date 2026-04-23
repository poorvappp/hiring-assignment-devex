using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DeploymentRegistry.Api.Models;

public class Deployment
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string? Id { get; set; }

    [BsonElement("serviceName")]
    public string ServiceName { get; set; } = string.Empty;

    [BsonElement("version")]
    public string Version { get; set; } = string.Empty;

    [BsonElement("environment")]
    public string Environment { get; set; } = string.Empty;

    [BsonElement("deploymentType")]
    public string DeploymentType { get; set; } = string.Empty;

    [BsonElement("status")]
    public string Status { get; set; } = string.Empty;

    [BsonElement("deployedBy")]
    public string DeployedBy { get; set; } = string.Empty;

    [BsonElement("startedAt")]
    public DateTime StartedAt { get; set; }

    [BsonElement("finishedAt")]
    public DateTime? FinishedAt { get; set; }

    [BsonElement("commitSha")]
    public string CommitSha { get; set; } = string.Empty;

    [BsonElement("pullRequestNumber")]
    public int? PullRequestNumber { get; set; }
}
