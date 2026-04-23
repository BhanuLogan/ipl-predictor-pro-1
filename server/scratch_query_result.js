import pkg from 'pg';
const { Client } = pkg;

async function getFirstResult() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/ipl_predictor"
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT r.match_id, m.espn_event_id, r.score_summary
      FROM results r
      JOIN matches m ON m.id = r.match_id
      WHERE m.espn_event_id IS NOT NULL
      ORDER BY m.date ASC LIMIT 1;
    `);
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

getFirstResult();
