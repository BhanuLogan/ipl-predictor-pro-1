async function debugScoreboard(espnId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard?event=${espnId}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.events && data.events[0]) {
        const e = data.events[0];
        const comp = e.competitions[0];
        console.log("Found via Scoreboard ID:", espnId);
        comp.competitors.forEach((c, i) => {
            const activeLS = (c.linescores || []).find(ls => ls.isBatting === true) || (c.linescores || [])[0] || {};
            console.log(`${c.team.abbreviation}: ${c.score} | LS Overs: ${activeLS.overs}`);
        });
    } else {
        console.log("No events found in scoreboard for ID:", espnId);
    }
  } catch (e) {
    console.error(e.message);
  }
}

debugScoreboard('1527674');
