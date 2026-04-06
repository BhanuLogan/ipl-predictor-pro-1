import fs from 'fs';
import path from 'path';

const teams = {
  CSK: 'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172115/chennai-super-kings.jpg',
  MI:  'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172116/mumbai-indians.jpg',
  RCB: 'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172117/royal-challengers-bengaluru.jpg',
  KKR: 'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172129/kolkata-knight-riders.jpg',
  DC:  'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172126/delhi-capitals.jpg',
  PBKS:'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172127/punjab-kings.jpg',
  RR:  'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172128/rajasthan-royals.jpg',
  SRH: 'https://static.cricbuzz.com/a/img/v1/152x152/i1/c172114/sunrisers-hyderabad.jpg',
  GT:  'https://static.cricbuzz.com/a/img/v1/152x152/i1/c270559/gujarat-titans.jpg',
  LSG: 'https://static.cricbuzz.com/a/img/v1/152x152/i1/c270560/lucknow-super-giants.jpg'
};

const dir = path.join(process.cwd(), 'public', 'logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function download() {
  for (const [team, url] of Object.entries(teams)) {
    try {
      console.log(`Downloading ${team} from ${url}...`);
      const imgRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buffer = await imgRes.arrayBuffer();
      fs.writeFileSync(path.join(dir, `${team}.jpg`), Buffer.from(buffer));
      console.log(`Saved ${team}.jpg`);
    } catch (err) {
       console.error(`Error with ${team}:`, err.message);
    }
  }
}

download();
