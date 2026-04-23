async function findPastEvents() {
  // Use scores/standings related URLs to find completed matches
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/scoreboard`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Events found:", data.events?.length);
    data.events.forEach(e => {
        const comp = e.competitions[0];
        console.log(`ID: ${e.id} | ${comp.status.type.state} | ${comp.status.type.detail}`);
    });
  } catch (e) {
    console.error(e.message);
  }
}

findPastEvents();
