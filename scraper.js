import puppeteer from 'puppeteer';

async function waitForTimeout(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function scrapeLinks() {
  //initialise puppeteer headless browser and navigate
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // await page.exposeFunction('scrapePage', scrapePage);
  await page.goto('https://uk.indeed.com/');

  //define parameters
  const jobTitle = 'Web Developer';
  const location = 'London';

  //type job title
  await page.waitForSelector('#text-input-what');
  await page.click('#text-input-what');
  await waitForTimeout(1000);
  await page.keyboard.type(jobTitle, { delay: 100 });

  //type and select location
  await page.waitForSelector('#text-input-where');
  await page.click('#text-input-where');
  await page.keyboard.type(location, { delay: 100 });
  await waitForTimeout(500);
  await page.keyboard.press('ArrowDown');
  await waitForTimeout(500);
  await page.keyboard.press('Enter');

  //click the search button
  await page.waitForSelector('.css-169igj0.eu4oa1w0 button');
  await page.click('.css-169igj0.eu4oa1w0 button');

  try {
    //let the navigation complete
    await page.waitForNavigation();

    await page.waitForSelector('.css-5lfssm.eu4oa1w0 a', { timeout: 60000 });

    //extract job listings
    const jobListings = await page.evaluate(() => {
      const listings = [];
      const jobs =
        document.querySelectorAll('li.css-5lfssm.eu4oa1w0').length > 1
          ? [...document.querySelectorAll('li.css-5lfssm.eu4oa1w0')].slice(
              0,
              -1
            )
          : [];

      //iterate over jobs
      const regex = /data-jk="([^"]+)"/;

      jobs.forEach((job) => {
        const htmlString = job.innerHTML;

        const match = htmlString.match(regex);

        const extractedString = match ? match[1] : null;

        if (extractedString) {
          const urlLink = `https://uk.indeed.com/viewjob?jk=${extractedString}`;
          listings.push(urlLink);
        }
      });
      return listings;
    });

    // console.log(jobListings);

    const leadObjects = [];

    for (const link of jobListings) {
      const newPage = await browser.newPage();
      await newPage.goto(link);

      await newPage.waitForSelector('#jobDescriptionText');

      const lead = await newPage.evaluate((link) => {
        const title = document.querySelector(
          '.jobsearch-JobInfoHeader-title span'
        ).innerText;

        return { title, link };
      }, link);

      leadObjects.push(lead);
    }

    console.log(leadObjects);
  } catch (error) {
    console.log(`error: ${error}`);
  } finally {
    await browser.close();
  }
}

scrapeLinks();
