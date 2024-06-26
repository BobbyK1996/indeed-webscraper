import puppeteer from 'puppeteer';

//define parameters
const jobTitle = 'Web Developer';
// const jobTitle = 'c++ developer mobile';
// const jobTitle = 'gufhidsuiofdsuf';
const location = 'London';
const numberOfLeads = 45;

async function waitForTimeout(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

async function scrapeLinks() {
  //initialise puppeteer headless browser and navigate
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  // await page.exposeFunction('scrapePage', scrapePage);
  await page.goto('https://uk.indeed.com/');

  //type job title
  await page.waitForSelector('#text-input-what');
  await page.click('#text-input-what');
  await waitForTimeout(1000);
  await page.keyboard.type(jobTitle, { delay: 50 });

  //type and select location
  await page.waitForSelector('#text-input-where');
  await page.click('#text-input-where');
  await page.keyboard.type(location, { delay: 50 });
  await waitForTimeout(500);
  await page.keyboard.press('ArrowDown');
  await waitForTimeout(300);
  await page.keyboard.press('Enter');

  //click the search button
  await page.waitForSelector('.css-169igj0.eu4oa1w0 button');
  await page.click('.css-169igj0.eu4oa1w0 button');

  //Number of leads calc
  const numberOfPages = Math.ceil(numberOfLeads / 15);

  try {
    //loop through the number of pages
    const scrapedLinks = [];

    for (let i = 0; i < numberOfPages; i++) {
      //let navigation complete
      await page.waitForNavigation();
      await page.waitForSelector('.yosegi-InlineWhatWhere-primaryButton', {
        timeout: 60000,
      });

      const hasJobs = await page.evaluate(() => {
        return !!document.querySelector('li.css-5lfssm.eu4oa1w0');
      });
      const hasJobsValue = JSON.parse(JSON.stringify(hasJobs));
      // const hasJobsValue = false;

      if (!hasJobsValue) {
        break;
      }

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
      scrapedLinks.push(jobListings);

      await page.evaluate(() => {
        const closeButton = document.querySelector(
          'button[aria-label="close"]'
        );

        if (closeButton) {
          closeButton.click();
        }

        window.scrollTo({
          top: document.body.scrollHeight,
          left: 0,
          behavior: 'smooth',
        });
      });

      // await waitForTimeout(3000);

      const hasNextPage = await page.evaluate(() => {
        return !!document.querySelector('[aria-label="Next Page"]');
      });

      const hasNextPageValue = JSON.parse(JSON.stringify(hasNextPage));

      if (hasNextPageValue) {
        await page.click('[aria-label="Next Page"]');
      } else {
        break;
      }
    }

    // await browser.close();

    // return scrapedLinks;
    const flattenedScrapedLinks = scrapedLinks.reduce(
      (acc, curr) => acc.concat(curr),
      []
    );

    const leadObjects = [];

    // const newBrowser = await puppeteer.launch({ headless: false });

    for (const link of flattenedScrapedLinks) {
      const newPage = await browser.newPage();
      await newPage.goto(link);
      await newPage.waitForSelector('#jobDescriptionText');
      const lead = await newPage.evaluate((link) => {
        const title = document.querySelector(
          '.jobsearch-JobInfoHeader-title span'
        ).innerText;
        const jobLocation =
          document.querySelector('#jobLocationText').innerText;
        const salaryInfo = document.querySelector(
          '#salaryInfoAndJobType'
        ).innerText;
        const jobDescription = document.querySelector(
          '#jobDescriptionText'
        ).innerText;
        return { title, jobLocation, salaryInfo, jobDescription, link };
      }, link);
      leadObjects.push(lead);
      // newPage.close();
    }

    await browser.close();

    return leadObjects;
  } catch (error) {
    console.log('There were no jobs available for that query');
  }
}

const data = await scrapeLinks();

console.log(data || 'No data');

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

function writeToExcel(data, filePath) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  XLSX.writeFile(workbook, filePath, { bookType: 'xlsx', type: 'buffer' });
}

const directory = 'C:/Users/bobst/Desktop/newCode/webscrapers/excel-files';
const fileName = 'output.xlsx';
const filePath = path.join(directory, fileName);

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
}

if (data) {
  writeToExcel(data, filePath);
  console.log(`Excel file ${filePath} created successfully`);
} else {
  console.log('No data to write to Excel file');
}
