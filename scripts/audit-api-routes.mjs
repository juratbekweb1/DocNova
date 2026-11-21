import fs from 'fs';
import path from 'path';

function getFiles(dir, exts = ['.ts', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full, exts));
    } else {
      if (exts.some(ext => file.endsWith(ext))) results.push(full);
    }
  });
  return results;
}

const apiRoutes = getFiles('src/app/api')
  .filter(f => f.endsWith('route.ts'))
  .map(f => {
    let rel = f.replace(/\\/g, '/');
    rel = rel.substring(rel.indexOf('src/app/api'));
    rel = rel.replace('/route.ts', '').replace('src/app', '');
    return rel;
  });

console.log(`Found ${apiRoutes.length} API routes.`);

async function auditApiRoutes() {
  const crashes = [];
  const ok = [];

  for (const r of apiRoutes) {
    if (r.includes('[') || r.includes(']')) continue;
    try {
      // Test GET
      const getRes = await fetch(`https://www.docnova.uz${r}`);
      if (getRes.status === 500) {
        crashes.push({ route: r, method: 'GET', status: getRes.status });
      } else {
        ok.push({ route: r, method: 'GET', status: getRes.status });
      }

      // Test empty POST
      const postRes = await fetch(`https://www.docnova.uz${r}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (postRes.status === 500) {
        crashes.push({ route: r, method: 'POST', status: postRes.status });
      } else {
        ok.push({ route: r, method: 'POST', status: postRes.status });
      }
    } catch (err) {
      crashes.push({ route: r, error: err.message });
    }
  }

  console.log(`API Audit complete: ${ok.length} tests responded normally (400, 401, 404, 405, 200).`);
  if (crashes.length > 0) {
    console.log(`\nCRASHING API ROUTES (500) (${crashes.length}):`);
    console.log(JSON.stringify(crashes, null, 2));
  } else {
    console.log('No API routes crashed with unhandled 500!');
  }
}

auditApiRoutes();
