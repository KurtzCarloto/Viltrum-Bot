const fs = require('fs');
const path = require('path');

function htmlEscape(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#39;');
}

function formatDate(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('pt-BR');
}

function buildTranscriptHTML({ channelName, guildName, messages }) {
  const rows = messages
    .map(m => {
      const attachments = m.attachments_json ? `<div><b>Anexos:</b> ${htmlEscape(JSON.stringify(JSON.parse(m.attachments_json)))}</div>` : '';
      return `
        <div class="msg">
          <div class="meta">
            <span class="author">${htmlEscape(m.author_username)}</span>
            <span class="time">${formatDate(m.created_at)}</span>
          </div>
          <div class="content">${htmlEscape(m.content || '')}</div>
          ${attachments}
        </div>
      `;
    })
    .join('\n');

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Transcript - ${htmlEscape(channelName || '')}</title>
<style>
  :root { color-scheme: dark; }
  body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial, sans-serif; background: #0b0f19; color: #e6e8ef; margin: 0; padding: 24px; }
  .wrap { max-width: 980px; margin: 0 auto; }
  .header { background: #111827; border: 1px solid #1f2937; padding: 16px 18px; border-radius: 14px; }
  .header h1 { margin: 0 0 6px 0; font-size: 18px; }
  .header p { margin: 0; opacity: 0.8; }
  .msg { margin-top: 14px; padding: 14px 16px; border: 1px solid #1f2937; background: #0f172a; border-radius: 14px; }
  .meta { display: flex; gap: 10px; align-items: baseline; justify-content: space-between; flex-wrap: wrap; }
  .author { font-weight: 700; color: #93c5fd; }
  .time { opacity: 0.7; font-size: 12px; }
  .content { margin-top: 10px; white-space: pre-wrap; word-break: break-word; line-height: 1.45; }
  .footer { margin-top: 22px; opacity: 0.7; font-size: 12px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>Transcript do ticket</h1>
      <p>${htmlEscape(guildName || '')} • ${htmlEscape(channelName || '')}</p>
    </div>
    ${rows || '<p style="opacity:.7;margin-top:16px;">Sem mensagens.</p>'}
    <div class="footer">Gerado automaticamente pelo Ticket Bot Premium</div>
  </div>
</body>
</html>`;
}

function buildTranscriptTXT({ messages }) {
  const lines = [];
  for (const m of messages) {
    lines.push(`[${formatDate(m.created_at)}] ${m.author_username}:`);
    lines.push(m.content || '');
    if (m.attachments_json) {
      try {
        lines.push(`Anexos: ${JSON.stringify(JSON.parse(m.attachments_json))}`);
      } catch {
        lines.push(`Anexos: ${m.attachments_json}`);
      }
    }
    lines.push('');
    lines.push('—'.repeat(50));
    lines.push('');
  }
  return lines.join('\n');
}

async function saveToDisk({ baseDir, channelId, html, txt }) {
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  const htmlPath = path.join(baseDir, `${channelId}.html`);
  const txtPath = path.join(baseDir, `${channelId}.txt`);
  fs.writeFileSync(htmlPath, html, 'utf8');
  fs.writeFileSync(txtPath, txt, 'utf8');
  return { htmlPath, txtPath };
}

module.exports = { buildTranscriptHTML, buildTranscriptTXT, saveToDisk };

