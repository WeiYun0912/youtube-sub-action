const { Toolkit } = require("actions-toolkit");
const puppeteer = require("puppeteer");
async function getYoutubeSubNumber() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(0);
  await page.goto("https://www.youtube.com/channel/UCy1Q33r6POsxGTtZcOF--Fw");
  await page.waitForSelector("#contents");
  const sub = await page.$eval("#subscriber-count", (el) =>
    el.textContent.trim()
  );
  browser.close();
  return sub;
}

Toolkit.run(async (tools) => {
  const sub = await getYoutubeSubNumber();
  console.log(sub);
  tools.exit.success("success");
});
