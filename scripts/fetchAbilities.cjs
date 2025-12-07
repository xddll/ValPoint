// Fetch ability icons/names from val.qq.com GraphQL endpoints and dump to JSON
// Usage: node scripts/fetchAbilities.cjs
// Output: src/data/ability_overrides.json

const fs = require('fs');
const path = require('path');
const https = require('https');

// GraphQL endpoints seen in common.js
const linkPre = 'https://api.val.qq.com/';
const AGENT_LIST_URL =
  `${linkPre}go/agame/graphql/graphiQL?query=%7B%0A%20%20agents%20%7B%0A%20%20%20%20id%0A%20%20%20%20name%0A%20%20%20%20e_name%0A%20%20%20%20icon%0A%20%20%7D%0A%7D%0A`;

const agentDetailQuery = (id) =>
  `${linkPre}go/agame/graphql/graphiQL?query=%7B%0A%20%20agent(id%3A${id})%7B%0A%20%20%20%20name%0A%20%20%20%20e_name%0A%20%20%20%20skill%20%7B%0A%20%20%20%20%20%20name%0A%20%20%20%20%20%20icon%0A%20%20%20%20%20%20keypad%0A%20%20%20%20%20%20desc%0A%20%20%20%20%20%20type%0A%20%20%20%20%20%20type_name%0A%20%20%20%20%20%20video%7B%0A%20%20%20%20%20%20%20%20vid%0A%20%20%20%20%20%20%7D%0A%20%20%20%20%7D%0A%20%20%7D%0A%7D`;

const slotMap = {
  C: 'Ability1',
  Q: 'Ability2',
  E: 'Grenade',
  X: 'Ultimate',
};

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117 Safari/537.36',
        Referer: 'https://val.qq.com/',
      },
    };
    https
      .get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('Fetching agent list...');
  const listRes = await fetchJson(AGENT_LIST_URL);
  const agents = listRes?.data?.agents || [];
  console.log(`Found ${agents.length} agents.`);

  const result = {};

  for (const agent of agents) {
    const id = agent.id;
    const displayName = agent.name;
    const enName = agent.e_name;
    if (!id) continue;
    console.log(`Fetching agent ${displayName} (${enName}) id=${id}...`);
    const detailRes = await fetchJson(agentDetailQuery(id));
    const detail = detailRes?.data?.agent;
    const skills = detail?.skill || [];
    const icons = {};
    const titles = {};
    for (const sk of skills) {
      const slot = slotMap[sk.keypad] || null;
      if (!slot) continue;
      icons[slot] = sk.icon || null;
      titles[slot] = sk.name || slot;
    }
    if (Object.keys(icons).length) {
      result[displayName] = { iconUrl: icons, titles };
      if (enName) {
        result[enName] = { iconUrl: icons, titles };
      }
    }
  }

  const outPath = path.join(__dirname, '..', 'src', 'data', 'ability_overrides.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Saved ${Object.keys(result).length} entries to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
