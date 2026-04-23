const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the server directory
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

async function fix() {
  console.log("🛠️ Manual DB Repair: Forcing RCB vs SRH (m01) to 15.4 overs...");
  try {
    const res = await pool.query(`
      INSERT INTO match_scores (
        match_id, team1, team1_runs, team1_overs, team1_wickets,
        team2, team2_runs, team2_overs, team2_wickets
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (match_id) DO UPDATE SET
        team1_runs = EXCLUDED.team1_runs,
        team1_overs = EXCLUDED.team1_overs,
        team1_wickets = EXCLUDED.team1_wickets,
        team2_runs = EXCLUDED.team2_runs,
        team2_overs = EXCLUDED.team2_overs,
        team2_wickets = EXCLUDED.team2_wickets
    `, ['m01', 'RCB', 203, 15.4, 4, 'SRH', 201, 20.0, 9]);
    
    console.log("✅ SUCCESS: Match m01 is now correctly set to 15.4 overs.");
  } catch (e) {
    console.error("❌ ERROR: Could not update database.", e.message);
    if (e.message.includes('ECONNREFUSED')) {
        console.error("TIP: Is your database running and is DATABASE_URL correct in .env?");
    }
  } finally {
    await pool.end();
  }
}

fix();
