import chromium from 'chrome-aws-lambda';
import { execSync } from 'child_process';

try {
  const path = execSync('which chromium-browser').toString().trim();
  console.log('Chromium path:', path);
} catch {
  console.log('Chromium not found');
}

function getPuppeteer() {
  if (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL) {
    console.log('Using Puppeteer from chrome-aws-lambda');
    // В продакшне (Lambda или Vercel) берем из chrome-aws-lambda
    return import('puppeteer-core');
  } else {
    console.log('Using local Puppeteer');
    // Локально пытаемся найти хром в системе
    // Можно указать путь вручную, или использовать puppeteer из полного пакета
    return import('puppeteer');
  }
}

export default async function getDemonList() {
  const puppeteer = await getPuppeteer();
  const executablePath = await (async () => {
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL) {
      console.log('Using Puppeteer from chrome-aws-lambda');
      // В продакшне (Lambda или Vercel) берем из chrome-aws-lambda
      return await chromium.executablePath;
    } else {
      console.log('Using local Puppeteer');
      // Локально пытаемся найти хром в системе
      // Можно указать путь вручную, или использовать puppeteer из полного пакета
      const puppeteer = await import('puppeteer');
      return puppeteer.executablePath();
    }
  })();

  console.log('Using executable path:', executablePath);
  const url = 'https://demonlist.org/';
  const browser = await puppeteer.launch({
    args: [],
    executablePath: executablePath || '/usr/bin/chromium-browser',
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: 'networkidle2' });

  // Ждём, пока кнопка "Показать все" станет доступной
  await page.waitForSelector('.load-all');

  // Кликаем по кнопке "Показать все"
  await page.click('.load-all');

  // Ждем, пока загрузится 150 элемент a[href^='/classic'][150]
  await page.waitForSelector("a[href^='/classic']:nth-of-type(151)");

  const demons = await page.evaluate(() => {
    const rows = document.querySelectorAll("a[href^='/classic']");
    const results = [];

    rows.forEach((row) => {
      const paras = row.querySelectorAll('p');
      const imageUrl = row.querySelector('img')
        ? row.querySelector('img').src
        : null;
      const result = {
        top: 0,
        name: '',
        author: '',
        imageUrl: imageUrl,
      };

      paras.forEach((para) => {
        const text = para.textContent.trim(); // "#n - Name"
        const match = text.match(/^#(\d+)\s*-\s*(.+)$/);

        if (match) {
          result.top = Number(match[1]);
          result.name = match[2];
        } else {
          result.author = text;
        }
      });

      results.push(result);
    });

    return results;
  });

  console.log('Demon list:', demons);
  await browser.close();

  return demons;
}
