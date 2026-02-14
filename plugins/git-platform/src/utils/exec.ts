import { execFile } from "node:child_process";

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function exec(command: string, args: string[], cwd?: string): Promise<ExecResult> {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        cwd,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        if (error && "code" in error && error.code === "ENOENT") {
          reject(new Error(`Command not found: ${command}. Make sure it is installed and in your PATH.`));
          return;
        }

        resolve({
          stdout: stdout ?? "",
          stderr: stderr ?? "",
          exitCode: error?.code ? (typeof error.code === "number" ? error.code : 1) : 0,
        });
      },
    );
  });
}

export async function execOrThrow(command: string, args: string[], cwd?: string): Promise<ExecResult> {
  const result = await exec(command, args, cwd);
  if (result.exitCode !== 0) {
    const errorMsg = result.stderr.trim() || result.stdout.trim() || `Command failed with exit code ${result.exitCode}`;
    throw new Error(`${command} ${args.join(" ")}: ${errorMsg}`);
  }
  return result;
}
