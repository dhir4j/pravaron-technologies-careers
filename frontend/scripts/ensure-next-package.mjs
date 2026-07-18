import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const nextDir = join(process.cwd(), ".next");
await mkdir(nextDir, { recursive: true });
await writeFile(join(nextDir, "package.json"), '{"type":"commonjs"}\n');
