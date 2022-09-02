import * as core from "@actions/core";

import {context, getOctokit} from "@actions/github";
import {Context} from "@actions/github/lib/context";

async function run(): Promise<void> {
  try {
    const branch = core.getInput("branch");

    core.info(`pipeline running on ${branch}`);
    await createNamespace(getOctokit, context, branch);
    core.setOutput("namespace", branch);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

/* eslint-disable  @typescript-eslint/no-explicit-any */
export async function createNamespace(
  client: any,
  ctx: Context,
  branch: string
): Promise<void> {
  const github = client(getToken(), {
    log: {
      debug: core.debug,
      info: core.info,
      warn: core.warning,
      error: core.error
    }
  });
  const ref = `refs/heads/${branch}`;

  try {
    const existingBranch = await github.rest.repos.getBranch({
      ...ctx.repo,
      branch
    });
    core.info(`${ref} found at sha ${existingBranch.data.commit.sha}`);
  } catch (error: any) {
    /* eslint-enable  @typescript-eslint/no-explicit-any */
    if (error.name === "HttpError" && error.status === 404) {
      core.info(
        `creating ${ref} from ${ctx.sha}, ${ctx.repo.repo} ${ctx.repo.owner}`
      );

      const main = await github.rest.repos.getBranch({
        ...ctx.repo,
        branch: "refs/heads/main"
      });

      await github.rest.git.createRef({
        ref,
        sha: !main ? ctx.sha : main.data.commit.sha,
        repo: ctx.repo.repo,
        owner: ctx.repo.owner
      });
    } else {
      throw Error(error);
    }
  }
}

function getToken(): string {
  const token = process.env.GITHUB_TOKEN;
  return !token ? "" : token;
}

run();
