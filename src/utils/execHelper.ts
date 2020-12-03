import * as Exec from '@actions/exec';

export interface ExecResult {
  exitcode: number;
  stdout: string;
  stderr: string;
}

export async function exec(command: string, args: string[]): Promise<ExecResult> {
  let execOptions: Exec.ExecOptions = {
    ignoreReturnCode: true
  };

  let stdOutput: string = '';
  let stdError: string = '';

  execOptions.listeners = {
    stdout: (data: Buffer) => {
      stdOutput += data.toString();
    },
    stderr: (data: Buffer) => {
      stdError += data.toString();
    }
  };

  const exitCode = await Exec.exec(command, args, execOptions);
  const result: ExecResult = {
    exitcode: exitCode,
    stdout: stdOutput.trim(),
    stderr: stdError.trim()
  };

  return result;
}