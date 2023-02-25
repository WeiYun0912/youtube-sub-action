const core = require("@actions/core");
const axios = require("axios");
const fs = require("fs");
const { spawn } = require("child_process");
const { Toolkit } = require("actions-toolkit");

// yml input
const GITHUB_TOKEN = core.getInput("GITHUB_TOKEN");
const COMMITTER_USERNAME = core.getInput("COMMITTER_USERNAME");
const COMMITTER_EMAIL = core.getInput("COMMITTER_EMAIL");
const KEY = core.getInput("KEY");

core.setSecret(GITHUB_TOKEN);

const exec = (cmd, args = [], options = {}) =>
  new Promise((resolve, reject) => {
    let outputData = "";
    const optionsToCLI = {
      ...options,
    };
    if (!optionsToCLI.stdio) {
      Object.assign(optionsToCLI, { stdio: ["inherit", "inherit", "inherit"] });
    }
    const app = spawn(cmd, args, optionsToCLI);
    if (app.stdout) {
      // Only needed for pipes
      app.stdout.on("data", function (data) {
        outputData += data.toString();
      });
    }

    app.on("close", (code) => {
      if (code !== 0) {
        return reject({ code, outputData });
      }
      return resolve({ code, outputData });
    });
    app.on("error", () => reject({ code: 1, outputData }));
  });

const commitReadmeFile = async () => {
  await exec("git", ["config", "--global", "user.email", COMMITTER_EMAIL]);

  if (GITHUB_TOKEN) {
    await exec("git", [
      "remote",
      "set-url",
      "origin",
      `https://${GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}.git`,
    ]);
  }

  await exec("git", ["config", "--global", "user.name", COMMITTER_USERNAME]);
  await exec("git", ["add", "."]);
  await exec("git", ["commit", "-m", "commit readme"]);
  await exec("git", ["push"]);
};

async function getYoutubeSubNumber() {
  const req = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&id=UCy1Q33r6POsxGTtZcOF--Fw&key=${KEY}`
  );
  return req.data.items[0].statistics;
}

Toolkit.run(async (tools) => {
  const { subscriberCount, videoCount } = await getYoutubeSubNumber();
  const readmeContent = fs.readFileSync("./README.md", "utf-8").split("\n");
  let startIndex = readmeContent.findIndex(
    (content) => content.trim() === "<!-- UPDATE_YOUTUBE:START -->"
  );

  if (startIndex === -1) return tools.exit.failure("Not Found Tag");

  let endIndex = readmeContent.findIndex(
    (content) => content.trim() === "<!-- UPDATE_YOUTUBE:END -->"
  );

  if (startIndex !== -1 && endIndex === -1) {
    startIndex++;

    readmeContent.splice(
      startIndex + 1,
      0,
      `<div align="center"><h3>訂閱人數：${subscriberCount} | 影片總數：${videoCount}</h3></div>`
    );

    readmeContent.splice(startIndex + 2, 0, "<!-- UPDATE_YOUTUBE:END -->");
    fs.writeFileSync("./README.md", readmeContent.join("\n"));

    try {
      await commitReadmeFile();
      tools.log.success("Commit file success");
    } catch (error) {
      return tools.exit.failure(error);
    }

    tools.exit.success("Success");
  }

  const oldContent = readmeContent.slice(startIndex + 1, endIndex).join("\n");
  const newContent = `<div align="center"><h3>訂閱人數：${subscriberCount} | 影片總數：${videoCount}</h3></div>`;
  const compareOldContent = oldContent.replace(/(?:\\[rn]|[\r\n]+)+/g, "");
  const compareNewContentt = newContent.replace(/(?:\\[rn]|[\r\n]+)+/g, "");

  if (compareOldContent === compareNewContentt)
    tools.exit.success("Same result");

  startIndex++;
  let gap = endIndex - startIndex;

  readmeContent.splice(startIndex, gap);
  readmeContent.splice(
    startIndex,
    0,
    `<div align="center"><h3>訂閱人數：${subscriberCount} | 影片總數：${videoCount}</h3></div>`
  );

  tools.log.success("Updated README with the youtube details");

  fs.writeFileSync("./README.md", readmeContent.join("\n"));

  try {
    await commitReadmeFile();
    tools.log.success("Commit file success");
  } catch (err) {
    tools.log.debug("Something went wrong");
    return tools.exit.failure(err);
  }
  tools.exit.success("Success");
});
