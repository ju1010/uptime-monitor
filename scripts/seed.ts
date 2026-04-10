import { config } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

let initSqlJs: any;
try {
  initSqlJs = require('sql.js');
} catch (e) {
  console.error('sql.js not found, run npm install');
  process.exit(1);
}

const urls: { url: string; name: string }[] = [
  { url: 'https://github.com', name: 'GitHub' },
  { url: 'https://gitlab.com', name: 'GitLab' },
  { url: 'https://bitbucket.org', name: 'Bitbucket' },
  { url: 'https://stackoverflow.com', name: 'Stack Overflow' },
  { url: 'https://npmjs.com', name: 'NPM Registry' },
  { url: 'https://pypi.org', name: 'PyPI' },
  { url: 'https://packagist.org', name: 'Packagist (PHP)' },
  { url: 'https://hub.docker.com', name: 'Docker Hub' },
  { url: 'https://cloudflare.com', name: 'Cloudflare' },
  { url: 'https://aws.amazon.com', name: 'AWS' },
  { url: 'https://cloud.google.com', name: 'Google Cloud' },
  { url: 'https://azure.microsoft.com', name: 'Azure' },
  { url: 'https://vercel.com', name: 'Vercel' },
  { url: 'https://netlify.com', name: 'Netlify' },
  { url: 'https://digitalocean.com', name: 'DigitalOcean' },
  { url: 'https://linode.com', name: 'Linode' },
  { url: 'https://heroku.com', name: 'Heroku' },
  { url: 'https://render.com', name: 'Render' },
  { url: 'https://fly.io', name: 'Fly.io' },
  { url: 'https://supabase.com', name: 'Supabase' },
  { url: 'https://firebase.google.com', name: 'Firebase' },
  { url: 'https://stripe.com', name: 'Stripe' },
  { url: 'https://paypal.com', name: 'PayPal' },
  { url: 'https://twilio.com', name: 'Twilio' },
  { url: 'https://sendgrid.com', name: 'SendGrid' },
  { url: 'https://mailgun.com', name: 'Mailgun' },
  { url: 'https://slack.com', name: 'Slack' },
  { url: 'https://discord.com', name: 'Discord' },
  { url: 'https://zoom.us', name: 'Zoom' },
  { url: 'https://figma.com', name: 'Figma' },
  { url: 'https://notion.so', name: 'Notion' },
  { url: 'https://linear.app', name: 'Linear' },
  { url: 'https://asana.com', name: 'Asana' },
  { url: 'https://trello.com', name: 'Trello' },
  { url: 'https://jira.atlassian.com', name: 'Jira' },
  { url: 'https://githubstatus.com', name: 'GitHub Status' },
  { url: 'https://status.aws.amazon.com', name: 'AWS Status' },
  { url: 'https://status.cloudflare.com', name: 'Cloudflare Status' },
  { url: 'https://www.virustotal.com', name: 'VirusTotal' },
  { url: 'https://archive.org', name: 'Internet Archive' },
  { url: 'https://caniuse.com', name: 'Can I Use' },
  { url: 'https://developer.mozilla.org', name: 'MDN Docs' },
  { url: 'https://nodejs.org', name: 'Node.js' },
  { url: 'https://python.org', name: 'Python' },
  { url: 'https://rust-lang.org', name: 'Rust' },
  { url: 'https://go.dev', name: 'Go' },
  { url: 'https://deno.land', name: 'Deno' },
  { url: 'https://react.dev', name: 'React' },
  { url: 'https://vuejs.org', name: 'Vue.js' },
  { url: 'https://svelte.dev', name: 'Svelte' },
];

async function seed() {
  const dbPath = path.resolve(config.database.path);
  const SQL = await initSqlJs();
  
  let db: any;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log('📂 Usando DB existente');
  } else {
    db = new SQL.Database();
    console.log('🆕 Creando nueva DB');
  }

  let added = 0;
  let skipped = 0;

  for (const { url, name } of urls) {
    try {
      db.run('INSERT INTO urls (url, name) VALUES (?, ?)', [url, name]);
      console.log(`  ✅ ${name}`);
      added++;
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        console.log(`  ⏭️  ${name} (ya existe)`);
        skipped++;
      } else {
        console.error(`  ❌ ${name}: ${e.message}`);
      }
    }
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, buffer);

  console.log('\n📊 Resumen:');
  console.log(`   Agregadas: ${added}`);
  console.log(`   Omitidas (duplicadas): ${skipped}`);
  console.log(`   Total en DB ahora: ${added + skipped}`);
  
  db.close();
}

seed().catch(console.error);
