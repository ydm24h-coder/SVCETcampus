const fs = require('fs');
const path = require('path');

const hooksDir = 'd:/clg-project/frontend/src/hooks';
const files = fs.readdirSync(hooksDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(hooksDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (file === 'useAssessments.js') {
    content = content.replace(/const defaultAssessments = \{[\s\S]*?\n\n/m, 'const defaultAssessments = { code: [], mcq: [] };\n\n');
  } else {
    content = content.replace(/const default[A-Za-z0-9]+ = \[[\s\S]*?\];\n\n/m, (match) => {
      const varNameMatch = match.match(/(const default[A-Za-z0-9]+)/);
      if (varNameMatch) {
        return `${varNameMatch[1]} = [];\n\n`;
      }
      return match;
    });
  }
  
  fs.writeFileSync(filePath, content);
});
console.log('Hooks cleaned.');
