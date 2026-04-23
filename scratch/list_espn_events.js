async function findEvents() {
  const url = `https://site.api.espn.com/apis/site/v2/sports/cricket/8048/events?limit=10`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Events array length:", data.events?.length);
    if (data.events && data.events.length > 0) {
        const e = data.events[0];
        console.log("Event keys:", Object.keys(e));
        console.log("Event ID:", e.id);
        if (e.competitions) {
             const comp = e.competitions[0];
             console.log("Comp keys:", Object.keys(comp));
             console.log("Short Name:", comp.shortName);
        } else {
             console.log("No competitions array found in event object");
        }
    } else {
        console.log("No events found in response");
    }
  } catch (e) {
    console.error(e.message);
  }
}

findEvents();
