import fs from 'fs';
const lines = fs.readFileSync('frontend/index.html', 'utf8').split('\n');
lines.slice(1600, 1750).forEach((line, idx) => {
    console.log(`${idx + 1601}: ${line}`);
});
