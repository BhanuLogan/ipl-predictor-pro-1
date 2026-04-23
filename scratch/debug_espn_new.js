async function debugMatch(espnId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/summary?event=${espnId}`;
  console.log(`Fetching ${url}...`);
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const competition = data.header.competitions[0];
    const competitors = competition.competitors;
    
    console.log(`\nStatus Detail: ${competition.status.type.detail}`);
    console.log(`Status Summary: ${competition.status.summary}`);
    
    competitors.forEach((c, i) => {
      console.log(`\nTeam ${i+1}: ${c.team.displayName} (${c.team.abbreviation})`);
      console.log(`Score: ${c.score}`);
      console.log(`Wickets: ${c.wickets}`);
      console.log(`Linescores:`, JSON.stringify(c.linescores, null, 2));
    });
  } catch (e) {
    console.error(e.message);
  }
}

// First match of 2024 (CSK vs RCB): 1410320
debugMatch('1410320');
