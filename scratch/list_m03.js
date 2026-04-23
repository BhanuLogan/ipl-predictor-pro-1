async function findMatch() {
  const date = "20260330";
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard?dates=${date}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.events && data.events.length > 0) {
        data.events.forEach(e => {
            console.log(`\nID: ${e.id} | ${e.name}`);
            const comp = e.competitions[0];
            comp.competitors.forEach(c => {
                const ls = (c.linescores || []).find(l => l.isBatting) || (c.linescores || [])[0] || {};
                console.log(`- ${c.team.abbreviation}: ${c.score} | Overs: ${ls.overs}`);
            });
        });
    }
  } catch (e) {
    console.error(e.message);
  }
}

findMatch();
