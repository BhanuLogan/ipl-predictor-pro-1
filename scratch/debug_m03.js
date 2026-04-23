async function debugM03() {
  const espnId = "1527676";
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard?dates=20260330`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const e = data.events[0];
    const comp = e.competitions[0];
    comp.competitors.forEach(c => {
        const ls = (c.linescores || []).find(l => l.isBatting) || (c.linescores || [])[0] || {};
        console.log(`${c.team.abbreviation}: ${c.score} | Wkts: ${ls.wickets} | Overs: ${ls.overs}`);
    });
  } catch (e) {
    console.error(e.message);
  }
}

debugM03();
