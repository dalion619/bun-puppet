import * as Util from './util';
import puppeteer from 'puppeteer';

const server = Bun.serve({
    port: 49903,
    development:true,
    async fetch(req) {
        const path = new URL(req.url).pathname;

        // handle double URL encoding
        const url = new URL(req.url.replaceAll('&', '%26'))
        // get value of ?url=
        let urlQueries = Util.parseQueryParams(url);
        let linkUrl = '';
        if (urlQueries.url !== undefined) {
            linkUrl = decodeURIComponent(urlQueries.url);
            console.log(`\n${linkUrl}`);

            const browser = await puppeteer.launch({ headless: 'shell' });
            console.log(`${new Date()} | browser launched`);
            try {
                const page = await browser.newPage();
                await page.setJavaScriptEnabled(false);
                console.log(`${new Date()} | goto begin`);
                await page.goto(linkUrl, {
                    waitUntil: 'networkidle0',
                });
                console.log(`${new Date()} | pdf begin`);
                let pdf = await page.pdf({
                    format: 'letter',
                    margin: {
                        top: "10px",
                        right: "10px",
                        bottom: "10px",
                        left: "10px"
                    },
                    printBackground: true
                });
                await browser.close();
                console.log(`${new Date()} | browser closed`);
                if (pdf) {
                    const filename = `${linkUrl.substring(linkUrl.lastIndexOf('/') + 1)}.pdf`;
                    return new Response(pdf, {
                        headers: {
                            "content-type": "application/pdf",
                            "content-disposition": `attachment; filename="${filename}"`
                        }
                    });
                }
            }
            catch (err) {
                console.log(err);
                await browser.close();
            }
        }

        if (path === "/") return new Response("Welcome to Bun!");
        // 404s
        return new Response("Not Found", { status: 404 });
    }
});
console.log(`Development mode: ${server.development}`);
console.log(`Listening on ${server.url}`);