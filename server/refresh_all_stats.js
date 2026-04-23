const { Pool } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function query(text, params) {
  const res = await pool.query(text, params);
  return res.rows;
}

const ESPN_IPL_BASE = 'https://site.api.espn.com/apis/site/v2/sports/cricket/8048';

async function fetchHighFidelity(espnId) {
    try {
        const resp = await axios.get(`${ESPN_IPL_BASE}/summary?event=${espnId}`);
        const data = resp.data;
        const comp = data.header.competitions[0];
        
        return comp.competitors.map(c => {
            // Find the batting innings
            const activeLS = (c.linescores || []).find(ls => ls.isBatting === true)
                          || (c.linescores || []).find(ls => ls.runs > 0)
                          || (c.linescores || [])[0] || {};
            
            return {
                short: c.team.abbreviation,
                runs: activeLS.runs || 0,
                wickets: activeLS.wickets || 0,
                overs: activeLS.overs || 0
            };
        });
    } catch (e) {
        return null;
    }
}

async function refreshAll() {
    console.log("📈 Starting Bulk Score Refresh...");
    const matches = await query("SELECT id, espn_event_id, team1 as t1_local FROM matches WHERE espn_event_id IS NOT NULL");
    
    for (const m of matches) {
        const teams = await fetchHighFidelity(m.espn_event_id);
        if (!teams || teams.length < 2) continue;

        let t1 = teams[0], t2 = teams[1];
        if (t1.short !== m.t1_local && t2.short === m.t1_local) {
            [t1, t2] = [t2, t1]; // Align with local schedule order
        }

        await query(`
            INSERT INTO match_scores (
                match_id, team1, team1_runs, team1_overs, team1_wickets,
                team2, team2_runs, team2_overs, team2_wickets
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (match_id) DO UPDATE SET
                team1_runs = EXCLUDED.team1_runs, team1_overs = EXCLUDED.team1_overs, team1_wickets = EXCLUDED.team1_wickets,
                team2_runs = EXCLUDED.team2_runs, team2_overs = EXCLUDED.team2_overs, team2_wickets = EXCLUDED.team2_wickets
        `, [m.id, t1.short, t1.runs, t1.overs, t1.wickets, t2.short, t2.runs, t2.overs, t2.wickets]);

        console.log(`✅ Refreshed ${m.id}: ${t1.short} (${t1.overs} ov), ${t2.short} (${t2.overs} ov)`);
        await new Promise(r => setTimeout(r, 100));
    }
    console.log("🏁 Bulk Refresh Complete! Your leaderboard is now accurate.");
    process.exit(0);
}

refreshAll();
