import fs from 'fs';
import path from 'path';

// Exact File titles on English Wikipedia
const teams = {
  RCB: 'Royal_Challengers_Bengaluru_logo.svg',
  DC:  'Delhi_Capitals_Logo.svg',
  RR:  'Rajasthan_Royals_Logo.svg',
  SRH: 'Sunrisers_Hyderabad.svg',
  LSG: 'Lucknow_Super_Giants_logo.svg'
};

const dir = path.join(process.cwd(), 'public', 'logos');
// Ensure it exists
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const [team, file] of Object.entries(teams)) {
    try {
      const api = `https://en.wikipedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&titles=File:${file}&format=json`;
      const res = await fetch(api);
      const data = await res.json();
      
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      
      if (pageId === "-1" || !pages[pageId].imageinfo) {
        console.log(`Failed to find Wikipedia image for ${team}: ${file}`);
        continue;
      }
      
      const url = pages[pageId].imageinfo[0].url;
      console.log(`Downloading ${team} from ${url}...`);
      
      const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buffer = await imgRes.arrayBuffer();
      
      fs.writeFileSync(path.join(dir, `${team}.svg`), Buffer.from(buffer));
      console.log(`Saved ${team}.svg`);
    } catch (err) {
       console.error(`Error with ${team}:`, err.message);
    }
  }
}

download();
