const core = require("@actions/core");
const axios = require("axios");
const fs = require("fs");
const { spawn } = require("child_process");
const { Toolkit } = require("actions-toolkit");

const key = core.getInput("KEY");

async function getYoutubeSubNumber() {
  const req = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&id=UCy1Q33r6POsxGTtZcOF--Fw&key=${key}`
  );
  return req.data.items[0].statistics;
}

Toolkit.run(async (tools) => {
  try {
    const { subscriberCount, videoCount } = await getYoutubeSubNumber();
    console.log(subscriberCount, videoCount);
  } catch (error) {
    tools.exit.failure(error);
  }
  tools.exit.success("success");
});
