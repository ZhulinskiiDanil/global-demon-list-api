import fs from 'fs';
import puppeteer from 'puppeteer';

const chromePath = fs
  .readdirSync('/tmp/puppeteer-cache/chrome/')
  .map((dir) => `/tmp/puppeteer-cache/chrome/${dir}/chrome`)
  .find(fs.existsSync);

export default async function getDemonList() {
  const url = 'https://demonlist.org/';
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: chromePath,
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
