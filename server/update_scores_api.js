const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update last-poll-summary query
const queryTarget = /SELECT r.match_id, r.winner, r.score_summary, r.created_at\s+FROM results r\s+ORDER BY r.created_at DESC\s+LIMIT 1/g;
const queryReplacement = `SELECT r.match_id, r.winner, r.score_summary, r.created_at,
           ms.team1_runs, ms.team1_wickets, ms.team1_overs,
           ms.team2_runs, ms.team2_wickets, ms.team2_overs
    FROM results r
    LEFT JOIN match_scores ms ON r.match_id = ms.match_id
    ORDER BY r.created_at DESC
    LIMIT 1`;

// 2. Update response JSON with scores and restore deleted logic if needed
// This part is trickier because we need to rebuild the block
const responseTarget = /res\.json\(\{\s+matchId,\s+team1: match\.team1,\s+team2: match\.team2,\s+winner: lastResult\.winner,\s+scoreSummary: lastResult\.score_summary,\s+userVote: userVote \? userVote\.prediction : null,\s+userStatus,\s+pointsGained,\s+currentRank,\s+prevRank,\s+rankChange: prevRank - currentRank,\s+userOutcomes,\s+totalVoters: votes\.length\s+\}\);/g;

const responseReplacement = `const prevRank = getRank(prevBoard, req.user.id);
  const pointsGained = (userVote && (lastResult.winner === 'nr' || lastResult.winner === 'draw'))
    ? 1
    : (userVote && userVote.prediction === lastResult.winner ? 2 : 0);

  const userOutcomes = votes.map(v => {
    const cRank = getRank(currentBoard, v.user_id);
    const pRank = getRank(prevBoard, v.user_id);
    const correct = v.prediction === lastResult.winner || ['nr', 'draw'].includes(lastResult.winner);
    return {
      username: v.username,
      prediction: v.prediction,
      status: correct ? 'won' : 'lost',
      currentRank: cRank,
      prevRank: pRank,
      rankChange: pRank - cRank
    };
  });

  res.json({
    matchId,
    team1: match.team1,
    team2: match.team2,
    winner: lastResult.winner,
    scoreSummary: lastResult.score_summary,
    team1Score: { runs: lastResult.team1_runs, wickets: lastResult.team1_wickets, overs: lastResult.team1_overs },
    team2Score: { runs: lastResult.team2_runs, wickets: lastResult.team2_wickets, overs: lastResult.team2_overs },
    userVote: userVote ? userVote.prediction : null,
    userStatus,
    pointsGained,
    currentRank,
    prevRank,
    rankChange: prevRank - currentRank,
    userOutcomes,
    totalVoters: votes.length
  });`;

let newContent = content.replace(queryTarget, queryReplacement);

// If the responseTarget doesn't match exactly because of previous half-failed edit, try a looser match
if (!responseTarget.test(newContent)) {
    console.log('Using fallback response replacement...');
    const fallbackTarget = /res\.json\(\{\s+matchId,\s+team1: match\.team1,[\s\S]+?totalVoters: votes\.length\s+\}\);/;
    newContent = newContent.replace(fallbackTarget, responseReplacement);
} else {
    newContent = newContent.replace(responseTarget, responseReplacement);
}

fs.writeFileSync(filePath, newContent);
console.log('✅ Success! Server APIs updated with structured match scores.');
