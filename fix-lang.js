const fs = require('fs');
const file = 'src/components/providers/language-provider.tsx';
let f = fs.readFileSync(file, 'utf8');
f = f.replace(/(\/\/ Nav\s+)navTools:/g, '$1navChat: "AI Chat",\n    navTools:');
fs.writeFileSync(file, f);
console.log('Fixed!');
