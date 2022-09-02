import * as process from "process";
import * as fs from "fs";
import {expect, describe, it, beforeEach, jest} from "@jest/globals";
import {createNamespace} from "../src/main";

describe("Branches are found or created", () => {
  process.env.GITHUB_TOKEN = "token";

  let branch = "acceptance/feature";
  let sha = "ffac537e6cbbf934b08745a378932722df287a53";
  let contextMock = JSON.parse(
    fs.readFileSync("__tests__/context.json", "utf8")
  );

  contextMock.repo = {repo: "here", owner: "you"};
  contextMock.sha = sha;

  let githubMock = jest.fn();
  let octokitMock = {
    rest: {
      git: {
        createRef: jest.fn()
      },
      repos: {
        getBranch: jest.fn()
      }
    }
  };

  beforeEach(() => {
    jest.resetAllMocks();
    githubMock.mockImplementation(() => octokitMock);
  });

  it("gets a branch", async () => {
    process.env.GITHUB_REPOSITORY = "samdnz/pipeline-actions";
    octokitMock.rest.repos.getBranch.mockImplementation(() =>
      Promise.resolve({
        data: {
          commit: {
            sha
          }
        }
      })
    );
    await createNamespace(githubMock, contextMock, branch);
    expect(octokitMock.rest.repos.getBranch).toHaveBeenCalledTimes(1);
  });

  it("Creates a new branch if not already there", async () => {
    octokitMock.rest.repos.getBranch.mockRejectedValueOnce(new HttpError());
    octokitMock.rest.repos.getBranch.mockImplementation(() =>
      Promise.resolve({
        data: {
          commit: {
            sha
          }
        }
      })
    );
    await createNamespace(githubMock, contextMock, branch);
    expect(octokitMock.rest.git.createRef).toHaveBeenCalledTimes(1);
  });
});

class HttpError extends Error {
  name = "HttpError";
  status = 404;
}
