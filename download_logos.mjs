import fs from 'fs';
import path from 'path';

const teams = {
  CSK: 'Chennai_Super_Kings_Logo.svg',
  MI:  'Mumbai_Indians_Logo.svg',
  RCB: 'Royal_Challengers_Bengaluru_logo.svg',
  KKR: 'Kolkata_Knight_Riders_Logo.svg',
  DC:  'Delhi_Capitals_Logo.svg',
  PBKS:'Punjab_Kings_Logo.svg',
  RR:  'Rajasthan_Royals_Logo.svg',
  SRH: 'Sunrisers_Hyderabad.svg',
  GT:  'Gujarat_Titans_Logo.svg',
  LSG: 'Lucknow_Super_Giants_IPL_Logo.svg'
};

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const [team, file] of Object.entries(teams)) {
    try {
      // Get the image info from Wikipedia API
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
      
      const imgRes = await fetch(url);
      const buffer = await imgRes.arrayBuffer();
      
      fs.writeFileSync(path.join(dir, `${team}.svg`), Buffer.from(buffer));
      console.log(`Saved ${team}.svg`);
    } catch (err) {
       console.error(`Error with ${team}:`, err.message);
    }
  }
}

download();
