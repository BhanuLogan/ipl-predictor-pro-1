const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'index.js');
let content = fs.readFileSync(filePath, 'utf8');

// The target pattern we want to replace
const target = /\s+return enriched;\s+}/g;
const replacement = '\n\n  return enriched.map((row, i) => ({ ...row, rank: i + 1 }));\n}';

if (content.includes('return enriched;')) {
    const newContent = content.replace(target, replacement);
    fs.writeFileSync(filePath, newContent);
    console.log('✅ Success! Leaderboard ranking logic updated to ordinal (1, 2, 3...).');
} else {
    console.log('❌ Error: Could not find leaderboard return locations.');
}
