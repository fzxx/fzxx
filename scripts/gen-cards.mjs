import fs from 'node:fs';
import path from 'node:path';

const USER = 'fzxx';
const OUT_DIR = path.resolve('assets/cards');
const API = 'https://api.github.com';
const TOKEN = process.env.GITHUB_TOKEN || '';

// 「代表项目」区展示的仓库，顺序即 README 中的排列顺序
const PIN_REPOS = [
  'XiangYue', 'FileImgSwap', 'FlashErase', 'NaughtyDamagePack',
  '7-Zip-zstd-crypto', 'Cloudflare-Worker-Secret-doc', '7zip-XChaCha20',
  'FlashSwirl', 'Bastion', 'YueChang',
];

const FONT = "'Segoe UI', Ubuntu, 'Microsoft YaHei', 'PingFang SC', sans-serif";
const BG = '#0B0D0F';
const ACCENT = '#C8F45A';
const TEXT = '#C9D1D9';
const MUTED = '#6B7378';

// GitHub 语言配色，用于卡片里的语言色点
const LANG_COLORS = {
  'C++': '#f34b7d', C: '#555555', Go: '#00ADD8', Rust: '#dea584',
  JavaScript: '#f1e05a', TypeScript: '#3178c6', HTML: '#e34c26',
  CSS: '#663399', Python: '#3572A5', Shell: '#89e051',
  PowerShell: '#012456', Batchfile: '#C1F12E', Dockerfile: '#384d54',
  Makefile: '#427819', Assembly: '#6E4C13', CMake: '#DA3434',
  Java: '#b07219', Kotlin: '#A97BFF', Swift: '#F05138', PHP: '#4F5D95',
  SCSS: '#c6538c', Vue: '#41b883', Lua: '#000080', TeX: '#3D6117',
};

const ICON_REPO = 'M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z';
const ICON_STAR = 'M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z';
const ICON_FORK = 'M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z';

async function api(endpoint) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'fzxx-profile-cards' };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
  const res = await fetch(`${API}${endpoint}`, { headers });
  if (!res.ok) throw new Error(`${endpoint} -> HTTP ${res.status}`);
  return res.json();
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// 按字符类型估算文字宽度，用来做单行截断和列宽对齐
function textWidth(str, size) {
  let width = 0;
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cp > 0x2e80) width += size;
    else if (/[A-Z0-9]/.test(ch)) width += size * 0.63;
    else if (/[a-z]/.test(ch)) width += size * 0.53;
    else if (ch === ' ') width += size * 0.3;
    else width += size * 0.4;
  }
  return width;
}

function truncate(str, maxWidth, size) {
  if (textWidth(str, size) <= maxWidth) return str;
  let out = '';
  for (const ch of str) {
    if (textWidth(out + ch + '...', size) > maxWidth) break;
    out += ch;
  }
  return `${out.trimEnd()}...`;
}

function shell(width, height, title, desc, body, extraCss = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
  <title id="title">${esc(title)}</title>
  <desc id="desc">${esc(desc)}</desc>
  <style>
    .header { font: 600 18px ${FONT}; fill: ${ACCENT}; }
    .description { font: 400 13px ${FONT}; fill: ${TEXT}; }
    .gray { font: 400 12px ${FONT}; fill: ${TEXT}; }
    .badge { font: 600 11px ${FONT}; fill: ${TEXT}; }
${extraCss}  </style>

  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="4.5" fill="${BG}"/>

${body}</svg>
`;
}

// 数据概览两张卡额外用到的大号数值与字段名样式
const STATS_CSS = `    .value { font: 700 24px ${FONT}; fill: #E7EAE4; }
    .label { font: 400 11px ${FONT}; fill: ${MUTED}; letter-spacing: 2px; }
`;

function renderPin(data) {
  const desc = truncate(data.description || '', 350, 13);
  const lang = data.language || '';

  let parts = '';
  let x = 0;
  if (lang) {
    parts += `    <circle cx="${x}" cy="-5" r="6" fill="${LANG_COLORS[lang] || TEXT}"/>\n`;
    parts += `    <text x="${x + 15}" y="0" class="gray">${esc(lang)}</text>\n`;
    x += 15 + textWidth(lang, 12) + 30;
  }
  parts += `    <g transform="translate(${x.toFixed(2)},0)">\n`;
  parts += `      <g transform="translate(0,-12)"><path d="${ICON_STAR}" fill="${ACCENT}"/></g>\n`;
  parts += `      <text x="20" y="0" class="gray">${data.stargazers_count}</text>\n`;
  parts += `    </g>\n`;
  x += 20 + textWidth(String(data.stargazers_count), 12) + 36;
  parts += `    <g transform="translate(${x.toFixed(2)},0)">\n`;
  parts += `      <g transform="translate(0,-12)"><path d="${ICON_FORK}" fill="${ACCENT}"/></g>\n`;
  parts += `      <text x="20" y="0" class="gray">${data.forks_count}</text>\n`;
  parts += `    </g>\n`;

  // 已归档的仓库在右下角标注
  let archive = '';
  if (data.archived) {
    const label = 'Public archive';
    const w = textWidth(label, 11) + 22;
    archive = `  <g transform="translate(${(375 - w).toFixed(1)},87)">\n`
      + `    <rect width="${w.toFixed(1)}" height="20" rx="10" fill="${TEXT}" fill-opacity="0.1" stroke="${TEXT}" stroke-opacity="0.35"/>\n`
      + `    <text x="${(w / 2).toFixed(1)}" y="14" text-anchor="middle" class="badge">${label}</text>\n`
      + `  </g>\n`;
  }

  const body = `  <g transform="translate(25,35)">
    <g transform="translate(0,-13)"><path d="${ICON_REPO}" fill="${ACCENT}"/></g>
    <text x="25" y="0" class="header">${esc(truncate(data.name, 300, 18))}</text>
  </g>

  <text x="25" y="50" class="description">${esc(desc)}</text>

  <g transform="translate(30,100)">
${parts}  </g>
${archive}`;

  return shell(400, 120, data.name, data.description || data.name, body);
}

function renderStats(user, totalStars, totalForks, languageCount) {
  const blocks = [
    ['TOTAL STARS', totalStars, 25, 100],
    ['PUBLIC REPOS', user.public_repos, 260, 100],
    ['TOTAL FORKS', totalForks, 25, 160],
    ['LANGUAGES', languageCount, 260, 160],
  ];
  const body = `  <text x="25" y="35" class="header">GITHUB STATS</text>
  <line x1="25" y1="52" x2="470" y2="52" stroke="#ffffff" stroke-opacity="0.06"/>

${blocks.map(([label, value, x, y]) => `  <text x="${x}" y="${y}" class="value">${value}</text>
  <text x="${x}" y="${y + 20}" class="label">${label}</text>`).join('\n')}
`;
  return shell(495, 195, 'GitHub 统计', `总星数 ${totalStars}，公开仓库 ${user.public_repos}，总 fork 数 ${totalForks}，语言 ${languageCount} 种`, body, STATS_CSS);
}

function renderLangs(langs) {
  const columnWidth = 205;
  const rows = langs.map((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 25 + col * 240;
    const y = 82 + row * 30;
    const pct = `${item.percent.toFixed(1)}%`;
    return `  <circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${LANG_COLORS[item.name] || MUTED}"/>
  <text x="${x + 20}" y="${y}" class="gray">${esc(truncate(item.name, columnWidth - 80, 12))}</text>
  <text x="${x + columnWidth}" y="${y}" class="gray" text-anchor="end">${pct}</text>`;
  }).join('\n');

  const summary = langs.map((l) => `${l.name} ${l.percent.toFixed(1)}%`).join('，');
  const body = `  <text x="25" y="35" class="header">LANGUAGE PROFILE</text>
  <line x1="25" y1="52" x2="470" y2="52" stroke="#ffffff" stroke-opacity="0.06"/>

${rows}
`;
  return shell(495, 195, '语言构成', summary, body, STATS_CSS);
}

// 汇总公开仓库的语言字节数，取占比最高的前 8 种
async function collectLanguages(repos) {
  const totals = new Map();
  for (const repo of repos) {
    if (repo.fork) continue;
    const langs = await api(`/repos/${USER}/${repo.name}/languages`);
    for (const [name, bytes] of Object.entries(langs)) {
      totals.set(name, (totals.get(name) || 0) + bytes);
    }
  }
  const sum = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  const list = [...totals.entries()]
    .map(([name, bytes]) => ({ name, percent: (bytes / sum) * 100 }))
    .sort((a, b) => b.percent - a.percent);
  return { top: list.slice(0, 8), total: list.length };
}

async function writeCard(fileName, svg) {
  fs.writeFileSync(path.join(OUT_DIR, fileName), svg, 'utf8');
  console.log(`写入 ${fileName}`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const repo of PIN_REPOS) {
    await writeCard(`${repo.toLowerCase()}.svg`, renderPin(await api(`/repos/${USER}/${repo}`)));
  }

  const user = await api(`/users/${USER}`);
  const repos = await api(`/users/${USER}/repos?per_page=100&type=owner`);
  const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
  const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
  const languages = await collectLanguages(repos);

  await writeCard('stats.svg', renderStats(user, totalStars, totalForks, languages.total));
  await writeCard('top-langs.svg', renderLangs(languages.top));
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
