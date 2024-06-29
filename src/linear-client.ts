import { LinearClient as LinearClientSDK } from "@linear/sdk";
import { assert } from "@std/assert/assert";
import { type } from "arktype";

const envVarsType = type({
  LINEAR_API_KEY: "string",
  LINEAR_PROJECT_ID: "string",
  LINEAR_TEAM_ID: "string",
});

let linearClient: LinearClient | null = null;

export class LinearClient {
  public client: LinearClientSDK;
  public defaultTeamId: string;

  private constructor(
    client: LinearClientSDK,
    opts: { defaultTeamId: string }
  ) {
    this.client = client;
    this.defaultTeamId = opts.defaultTeamId;
  }

  static default() {
    if (!linearClient) {
      linearClient = LinearClient.create();
    }

    return linearClient;
  }

  static create() {
    const envVars = envVarsType.assert(process.env);
    return new LinearClient(
      new LinearClientSDK({
        apiKey: envVars.LINEAR_API_KEY,
      }),
      {
        defaultTeamId: envVars.LINEAR_TEAM_ID,
      }
    );
  }

  async createProject(args: { name: string }) {
    const project = await this.client
      .createProject({
        name: args.name,
        teamIds: [this.defaultTeamId],
      })
      .then((payload) => payload.project);
    assert(project, "Failed to create project");

    return project;
  }

  async getProject(args: { id: string }) {
    const project = await this.client.project(args.id);
    return project;
  }

  async getProjects() {
    const projects = await this.client.projects();
    return projects.nodes;
  }

  async createMilestone(args: {
    name: string;
    targetProjectId: string;
    dueDate: Date | null;
  }) {
    const milestone = await this.client
      .createProjectMilestone({
        name: args.name,
        projectId: args.targetProjectId,
        targetDate: args.dueDate,
      })
      .then((payload) => payload.projectMilestone);

    assert(milestone, "Failed to create milestone");

    return milestone;
  }

  async createIssue(args: {
    projectId: string;
    milestoneId: string;
    name: string;
    content: string;
    dueDate: Date | null;
  }) {
    const payload = await this.client.createIssue({
      title: args.name,
      description: args.content,
      projectId: args.projectId,
      teamId: this.defaultTeamId,
      dueDate: args.dueDate,
    });
    let issue = await payload.issue;
    assert(issue, "Issue is required");

    issue = await this.client
      .updateIssue(issue.id, {
        projectMilestoneId: args.milestoneId,
      })
      .then((payload) => payload.issue);

    assert(issue, "Failed to get updated issue");

    return issue;
  }
}
