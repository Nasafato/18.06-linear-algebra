import { type } from "arktype";
import fs from "fs-extra";
import path from "node:path";
import { LinearClient } from "../../linear-client";
import { match, P } from "ts-pattern";
import type { Project } from "@linear/sdk";
import { assert } from "@std/assert";
import { addDays } from "date-fns/addDays";

const Block = type({
  children: "string[]",
  complete: "boolean",
  due: "null | parse.date",
  description: "string | null",
  display_name: "string",
  id: "string",
  lms_web_url: "string",
  resume_block: "boolean",
  type: "string",
  has_scheduled_content: "boolean | null",
  hide_from_toc: "boolean | null",
});

const Response = type({
  course_blocks: type({
    blocks: type({
      "[string]": Block,
    }),
  }),
});

function parseCourseBlocks(data: unknown) {
  return Response.assert(data);
}

function offsetDate(
  date: Date,
  opts: {
    days: number;
  }
) {
  const newDate = addDays(date, opts.days);
  return newDate;
}

const DATE_OFFSET = -5;

async function main() {
  const data = await fs.readFile(
    path.join(__dirname, "./fixtures/isl-course-blocks.json"),
    "utf8"
  );
  const shouldRun = process.argv.includes("--run");
  const parsed = parseCourseBlocks(JSON.parse(data));
  const linearClient = LinearClient.default();
  let project: Project | null = null;
  if (shouldRun) {
    console.log("[run] Creating project", "ISL");
    project = await linearClient.createProject({ name: "ISL" });
  }
  let currChapter = 0;
  let currChapterName = "";
  const milestones = new Map();
  const blocks = Object.values(parsed.course_blocks.blocks);
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    for (const [pattern, regex] of Object.entries(Patterns) as [
      PatternKeys,
      RegExp
    ][]) {
      const regexMatch = block.display_name.match(regex);

      if (!regexMatch) {
        continue;
      }
      let dueDate: Date | null = block.due
        ? offsetDate(block.due, {
            days: DATE_OFFSET,
          })
        : null;
      if (!dueDate) {
        for (let j = i + 1; j < blocks.length; j++) {
          const lookaheadBlock = blocks[j];
          if (isBlockWithChapter(lookaheadBlock) && lookaheadBlock.due) {
            dueDate = offsetDate(lookaheadBlock.due, {
              days: DATE_OFFSET,
            });
            break;
          }
        }
      }
      await match([pattern, regexMatch])
        .with(["ChapterHeading", P.any], async ([_, match]) => {
          const chapterNumber = Number.parseInt(match[1], 10);
          currChapter = chapterNumber;
          currChapterName = match[2];
          const name = `Chapter ${chapterNumber}: ${currChapterName}`;
          let dueDate: Date | null = block.due;
          if (!dueDate) {
            for (let j = i + 1; j < blocks.length; j++) {
              const lookaheadBlock = blocks[j];
              if (isBlockWithChapter(lookaheadBlock) && lookaheadBlock.due) {
                dueDate = offsetDate(lookaheadBlock.due, {
                  days: DATE_OFFSET,
                });
                break;
              }
            }
          }
          if (shouldRun) {
            assert(project, "Project not found");
            console.log(
              "[run] Creating milestone",
              name,
              dueDate?.toLocaleDateString()
            );
            console.log("currChapter", currChapter);
            const chapter = await linearClient.createMilestone({
              targetProjectId: project.id,
              name: `${currChapter}: ${match[2]}`,
              dueDate,
            });
            milestones.set(currChapter, chapter);
          } else {
            console.log(
              "[dry] Creating milestone",
              name,
              dueDate?.toLocaleDateString()
            );
          }
        })
        .with(["QuizHeading", P.any], async ([_, match]) => {
          const quizNumber = Number.parseInt(match[1], 10);
          const name = `Quiz ${quizNumber}: ${currChapterName}`;
          if (shouldRun) {
            assert(project, "Project not found");
            console.log(
              "[run] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
            const issue = await linearClient.createIssue({
              projectId: project.id,
              milestoneId: milestones.get(currChapter).id,
              name: name,
              content: buildContent(block),
              dueDate,
            });
          } else {
            console.log(
              "[dry] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
          }
        })
        .with(["LabHeading", P.any], async ([_, match]) => {
          const labNumber = Number.parseInt(match[1], 10);
          const name = `Lab ${labNumber}: ${match[2]}`;
          if (shouldRun) {
            assert(project, "Project not found");
            console.log(
              "[run] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
            const issue = await linearClient.createIssue({
              projectId: project.id,
              milestoneId: milestones.get(currChapter).id,
              name: name,
              content: buildContent(block),
              dueDate,
            });
          } else {
            console.log(
              "[dry] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
          }
        })
        .with(["SectionHeading", P.any], async ([_, match]) => {
          const sectionNumber = Number.parseInt(match[1], 10);
          const name = `Section ${sectionNumber}: ${match[2]}`;
          if (shouldRun) {
            assert(project, "Project not found");
            console.log(
              "[run] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
            const issue = await linearClient.createIssue({
              projectId: project.id,
              milestoneId: milestones.get(currChapter).id,
              name: name,
              content: buildContent(block),
              dueDate,
            });
          } else {
            console.log(
              "[dry] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
          }
        })
        .with(["NoNumber", P.any], async ([_, match]) => {
          const name = `Section ${currChapter}: ${match[0]}`;
          if (shouldRun) {
            assert(project, "Project not found");
            console.log(
              "[run] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
            const issue = await linearClient.createIssue({
              projectId: project.id,
              milestoneId: milestones.get(currChapter).id,
              name: name,
              content: buildContent(block),
              dueDate,
            });
          } else {
            console.log(
              "[dry] Creating issue",
              name,
              dueDate?.toLocaleDateString()
            );
          }
        })
        .exhaustive();
      break;
    }
  }
}

function buildContent(block: BlockType) {
  return `
  [EdX link](${block.lms_web_url})
  `.trim();
}

type BlockType = type.infer<typeof Block>;

function isBlockWithChapter(block: BlockType) {
  return ChapterBlockPatterns.some((p) => block.display_name.match(p));
}

const Patterns = {
  ChapterHeading: /^Ch(\d+)\s+(.+)/,
  QuizHeading: /^Chapter\s+(\d+)\s+Quiz/,
  LabHeading: /^(\d+)\.Py\s+(.+)/,
  SectionHeading: /^(\d+\.\d+)\s+(.+)/,
  NoNumber: /^.+/,
} as const;

const ChapterBlockPatterns = [
  Patterns.ChapterHeading,
  Patterns.QuizHeading,
  Patterns.LabHeading,
  Patterns.SectionHeading,
] as const;

type PatternKeys = keyof typeof Patterns;

main();
