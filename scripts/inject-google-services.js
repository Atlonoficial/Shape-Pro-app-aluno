const fs = require('fs');

const outPath = 'android/app/google-services.json';
const b64 = process.env.GOOGLE_SERVICES_JSON_BASE64 || '';

if (!b64) {
  console.log('[inject-google-services] GOOGLE_SERVICES_JSON_BASE64 não está setado; pulando...');
  process.exit(0);
}

try {
  fs.mkdirSync('android/app', { recursive: true });
  const buf = Buffer.from(b64, 'base64');
  fs.writeFileSync(outPath, buf);
  console.log(`[inject-google-services] gravado ${outPath} (${buf.length} bytes)`);
} catch (err) {
  console.error('[inject-google-services] falhou:', err);
  process.exit(1);
}
