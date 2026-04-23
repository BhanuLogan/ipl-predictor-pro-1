async function debugMatch(espnId) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/summary?event=${espnId}`;
  try {
    const resp = await fetch(url);
    const text = await resp.text();
    console.log("Response starts with:", text.slice(0, 200));
    const data = JSON.parse(text);
    if (data.header) {
        console.log("Found header. Competitors:", data.header.competitions[0].competitors.length);
    }
  } catch (e) {
    console.error(e.message);
  }
}

debugMatch('1410320');
