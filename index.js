const core = require("@actions/core");
const axios = require("axios");
const { Toolkit } = require("actions-toolkit");

const key = core.getInput("KEY");

async function getYoutubeSubNumber() {
  const req = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/channels?part=snippet%2CcontentDetails%2Cstatistics&id=UCy1Q33r6POsxGTtZcOF--Fw&key=${key}`
  );
  console.log(req.data.items[0].statistics);
}

Toolkit.run(async (tools) => {
  try {
    console.log(key);
    await getYoutubeSubNumber();
  } catch (error) {
    tools.exit.failure(error);
  }
  tools.exit.success("success");
});
