import pkg from 'pg';
const { Client } = pkg;

async function getAllScores() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:5432/ipl_predictor"
  });
  try {
    await client.connect();
    const res = await client.query(`
      SELECT ms.*, m.date 
      FROM match_scores ms
      JOIN matches m ON m.id = ms.match_id
      ORDER BY m.date ASC;
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

getAllScores();
