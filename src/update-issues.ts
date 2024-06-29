import { LinearClient } from "@linear/sdk";
import { assert } from "@std/assert/assert";
import { type } from "arktype";

const envVarsType = type({
  LINEAR_API_KEY: "string",
  LINEAR_PROJECT_ID: "string",
});

interface Lecture {
  number: number;
  date: string;
  content: string;
}

interface IssueUpdate {
  id: string;
  title: string;
  currentDescription: string;
  newDescription: string;
}

const envVars = envVarsType.assert(process.env);
const linAlgProject = {
  id: "d55aa553-9278-4583-93d5-b310bc9939de",
  name: "18.06: Linear Algebra",
};

const client = new LinearClient({
  apiKey: envVars.LINEAR_API_KEY,
});

async function fetchReadme(): Promise<string> {
  return await fetch(
    "https://raw.githubusercontent.com/mitmath/1806/master/README.md"
  ).then((res) => res.text());
}

function parseLectures(readme: string): Lecture[] {
  //   const lectureRegex =
  //     /^(?:##|###)\s*Lecture (\d+)\s*\((.*?)\)\s*([\s\S]*?)(?=^(?:##|###)\s*Lecture|\n## |\n### |$)/gm;
  const lectureRegex = /^(#{2,3} Lecture.*(?:\n(?!#{2,3} Lecture).*)*)\n?/gm;

  const lectures: Lecture[] = [];
  let match: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  while ((match = lectureRegex.exec(readme)) !== null) {
    if (match[0].includes("Lecture Material and Summaries")) {
      continue;
    }

    const header = match[0].split("\n")[0];
    const content = match[0].split("\n").slice(1).join("\n");
    const lectureNumber = header.match(/Lecture (\d+)/)?.[1];
    const lectureDate = header.match(/\((.*?)\)/)?.[1];

    assert(lectureNumber, "Lecture number not found");
    assert(lectureDate, "Lecture date not found");

    lectures.push({
      number: Number.parseInt(lectureNumber),
      date: lectureDate,
      content: content.trim(),
    });
  }

  return lectures;
}
function formatLectureContent(lecture: Lecture): string {
  const dateSlug = lecture.date
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/ /g, "-");
  return `
https://github.com/mitmath/1806?tab=readme-ov-file#lecture-${lecture.number}-${dateSlug}

${lecture.content}
  `.trim();
}

async function getLinearIssues() {
  return await client.issues({
    filter: {
      project: {
        id: {
          eq: linAlgProject.id,
        },
      },
    },
  });
}

async function updateLinearIssue(issueId: string, description: string) {
  await client.updateIssue(issueId, { description });
}

async function generateIssueUpdates(): Promise<IssueUpdate[]> {
  const readme = await fetchReadme();
  const lectures = parseLectures(readme);
  const issues = await getLinearIssues();

  return lectures
    .map((lecture) => {
      const issueTitle = `Lecture ${lecture.number}`;
      const issue = issues.nodes.find((i) => i.title === issueTitle);

      if (issue) {
        return {
          id: issue.id,
          title: issueTitle,
          currentDescription: issue.description || "No current description",
          newDescription: formatLectureContent(lecture),
        };
      }
      console.log(`Issue not found: ${issueTitle}`);
      return null;
    })
    .filter((update): update is IssueUpdate => update !== null);
}

async function previewUpdates(updates: IssueUpdate[]) {
  for (const update of updates) {
    console.log(`\nUpdating: ${update.title}`);
    console.log("Current description:");
    console.log(update.currentDescription);
    console.log("\nNew description:");
    console.log(update.newDescription);
    console.log("-".repeat(50));
  }
}

async function applyUpdates(updates: IssueUpdate[]) {
  for (const update of updates) {
    await updateLinearIssue(update.id, update.newDescription);
    console.log(`Updated issue: ${update.title}`);
  }
}

export async function main() {
  const runFlag = process.argv.includes("--run");

  try {
    const updates = await generateIssueUpdates();

    if (runFlag) {
      console.log("Applying updates to Linear issues...");
      await applyUpdates(updates);
      console.log("Updates completed successfully.");
    } else {
      console.log("Preview mode: Showing updates without applying them.");
      await previewUpdates(updates);
      console.log(
        "\nTo apply these updates, run the command with the --run flag."
      );
    }
  } catch (error) {
    console.error("An error occurred:", error);
  }
}
