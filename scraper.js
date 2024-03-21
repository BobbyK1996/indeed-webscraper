import puppeteer from 'puppeteer';

async function waitForTimeout(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function scrapeIndeed() {
  //initialise puppeteer headless browser and navigate
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://uk.indeed.com/');

  //define parameters
  const jobTitle = 'Web Developer';
  const location = 'London';

  //type job title
  await page.waitForSelector('#text-input-what');
  await page.click('#text-input-what');
  await page.keyboard.type('#text-input-what', jobTitle, { delay: 100 });

  //type and select location
  await page.waitForSelector('#text-input-where');
  await page.click('#text-input-where');
  await page.keyboard.type('#text-input-where', location, { delay: 100 });
  // await waitForTimeout(1000);
  // await page.keyboard.press('ArrowDown');
  // await waitForTimeout(1000);
  // await page.keyboard.press('Enter');

  // await browser.close();

  console.log('Working');
}

scrapeIndeed();
