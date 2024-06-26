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

    await page.waitForSelector('.css-5lfssm.eu4oa1w0', { timeout: 60000 });

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

      for (const job of jobs) {
        //click on the job
        const firstAnchor = job.querySelector('a');
        firstAnchor.click();

        //wait for job info to load
        page.waitForSelector('.jobsearch-JobInfoHeader-title span');

        //extract info
        const title = job.querySelector(
          '.jobsearch-JobInfoHeader-title span'
        ).innerText;
        const company = job.querySelector('.css-1cxc9zk.e1wnkr790 a').innerText;
        const location = job.querySelector(
          '.css-17cdm7w.eu4oa1w0 div'
        ).innerText;

        listings.push({ title, company, location });
      }

      return listings;
    });
    console.log(jobListings);
  } catch (error) {
    console.log(`error: ${error}`);
  } finally {
    await browser.close();
  }
}

scrapeIndeed();
