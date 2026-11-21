import fs from 'fs';
import path from 'path';

function getFiles(dir, exts = ['.tsx', '.ts', '.jsx', '.js']) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (!['node_modules', '.next', '.git'].includes(file)) {
        results = results.concat(getFiles(full, exts));
      }
    } else {
      if (exts.some(ext => file.endsWith(ext))) results.push(full);
    }
  });
  return results;
}

const files = getFiles('src');
const hrefRegex = /href=["'](\/[a-zA-Z0-9_\-\/]+)["']/g;
const links = new Set();
const linkSources = {};

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  let match;
  while ((match = hrefRegex.exec(content)) !== null) {
    const link = match[1].split('?')[0].split('#')[0];
    if (link.startsWith('/') && !link.startsWith('/api') && !link.startsWith('/_next')) {
      links.add(link);
      if (!linkSources[link]) linkSources[link] = [];
      linkSources[link].push(f);
    }
  }
});

async function verifyLinks() {
  const allLinks = Array.from(links).sort();
  console.log(`Auditing ${allLinks.length} distinct internal href links against https://www.docnova.uz...`);
  const broken = [];
  const ok = [];

  for (const l of allLinks) {
    // If it has dynamic params like [id], skip or test placeholder
    if (l.includes('[') || l.includes(']')) continue;
    try {
      const res = await fetch(`https://www.docnova.uz${l}`, { redirect: 'manual' });
      if (res.status === 404 || res.status >= 500) {
        broken.push({ link: l, status: res.status, sources: linkSources[l]?.slice(0, 3) });
      } else {
        ok.push({ link: l, status: res.status });
      }
    } catch (err) {
      broken.push({ link: l, error: err.message, sources: linkSources[l]?.slice(0, 3) });
    }
  }

  console.log(`\nOK Links (${ok.length}):`);
  ok.forEach(o => console.log(`  ${o.status} ${o.link}`));

  if (broken.length > 0) {
    console.log(`\nBROKEN Links (${broken.length}):`);
    console.log(JSON.stringify(broken, null, 2));
  } else {
    console.log('\nAll checked internal links returned valid status (no 404/500)!');
  }
}

verifyLinks();
