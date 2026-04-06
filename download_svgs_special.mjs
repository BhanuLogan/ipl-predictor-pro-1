import fs from 'fs';
import path from 'path';

const teams = {
  RCB: 'Royal_Challengers_Bengaluru_logo.svg',
  DC:  'Delhi_Capitals_Logo.svg',
  RR:  'Rajasthan_Royals_Logo.svg',
  SRH: 'Sunrisers_Hyderabad.svg', // from earlier search
  LSG: 'Lucknow_Super_Giants_logo.svg' // from earlier search
};

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const [team, file] of Object.entries(teams)) {
    try {
      // Special:FilePath magically redirects to the highest res CDN object!
      const url = `https://en.wikipedia.org/wiki/Special:FilePath/${file}`;
      console.log(`Downloading ${team} from ${url}...`);
      
      const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' });
      const buffer = await imgRes.arrayBuffer();
      
      fs.writeFileSync(path.join(dir, `${team}.svg`), Buffer.from(buffer));
      console.log(`Saved ${team}.svg`);
    } catch (err) {
       console.error(`Error with ${team}:`, err.message);
    }
  }
}

download();
