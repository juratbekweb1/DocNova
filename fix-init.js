const fs = require('fs');
let f = fs.readFileSync('scripts/init-pglite.ts', 'utf8');
f = f.replace(/const sqlContentBuffer = execSync[\s\S]*?\n  sqlContent = sqlContent.replace.*?;\n/m, "const sqlContent = fs.readFileSync('./prisma/init.sql', 'utf8');\n");
fs.writeFileSync('scripts/init-pglite.ts', f);
