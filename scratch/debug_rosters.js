async function debugMatch(espnId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/summary?event=${espnId}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.rosters) {
        data.rosters.forEach((r, i) => {
            console.log(`\n--- Innings ${i+1} (${r.team.displayName}) ---`);
            const totalBalls = (r.bowlers || []).reduce((sum, b) => sum + (b.ballsCount || 0), 0);
            console.log(`Total Balls: ${totalBalls} (${(Math.floor(totalBalls/6))}.${totalBalls%6} overs)`);
        });
    }
  } catch (e) {
    console.error(e.message);
  }
}

// Try 1529276 or another valid ID
debugMatch('1529276');
