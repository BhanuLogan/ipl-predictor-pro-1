import pkg from 'pg';
const { Client } = pkg;

async function getFirstMatch() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/ipl_predictor"
  });
  try {
    await client.connect();
    const res = await client.query("SELECT id, team1, team2, espn_event_id, date FROM matches ORDER BY date ASC, time ASC LIMIT 1;");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

getFirstMatch();
