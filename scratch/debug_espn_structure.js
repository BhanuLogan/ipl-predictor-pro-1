async function debugMatch(espnId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/summary?event=${espnId}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Summary Keys:", Object.keys(data));
    const comp = data.header.competitions[0];
    comp.competitors.forEach((c, i) => {
        console.log(`\n--- Team ${i+1} ---`);
        console.log("Name:", c.team.displayName);
        console.log("Score:", c.score);
        console.log("Wickets:", c.wickets);
        console.log("Linescores:", JSON.stringify(c.linescores, null, 2));
    });
  } catch (e) {
    console.error(e.message);
  }
}

debugMatch('1529276');
