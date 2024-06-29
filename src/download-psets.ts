import path from "node:path";
import { type } from "arktype";
import fs from "fs-extra";

const FileType = type({
  name: "string",
});

const FileResponseType = FileType.array();

const GITHUB_API_URL =
  "https://api.github.com/repos/mitmath/1806/contents/psets";

const RAW_BASE_URL =
  "https://raw.githubusercontent.com/mitmath/1806/master/psets";

async function fetchFileList(): Promise<string[]> {
  const response = await fetch(GITHUB_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch file list: ${response.statusText}`);
  }
  const files = FileResponseType.assert(await response.json());
  return files
    .filter((file) => file.name.endsWith(".pdf"))
    .map((file) => file.name);
}

async function fetchPdf(filePath: string): Promise<ArrayBuffer> {
  const response = await fetch(`${RAW_BASE_URL}/${filePath}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  }
  return await response.arrayBuffer();
}

export async function main(args: { rootPath: string }) {
  const fileList = await fetchFileList();
  await fs.mkdir(path.join(args.rootPath, "./files/psets"), {
    recursive: true,
  });
  await Promise.all(
    fileList.map(async (file) => {
      const buffer = await fetchPdf(file);
      console.log("fetched", file);
      const match = PSET_FILENAME_PATTERN.exec(file);
      if (!match) {
        throw new Error(`Invalid pset filename: ${file}`);
      }
      const psetNumber = match[1];
      await fs.writeFile(
        path.join(args.rootPath, `./files/psets/18.06-pset-${psetNumber}.pdf`),
        Buffer.from(buffer)
      );
    })
  );
}

const PSET_FILENAME_PATTERN = /^hw(\d+)\w?\.pdf$/;
