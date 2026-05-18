# TODO — Integração Viltrum Empire (Discord + Website + Tickets + Stats)

## Backend (Node.js + Discord.js + Express + Socket.IO + SQLite)
- [x] API endpoints criados (bot-status, server-stats, tickets)
- [x] Socket.IO server criado
- [x] Push realtime de `server-stats` via Socket.IO
- [x] Correção/consistência de contagem de tickets OPEN no SQLite
- [ ] Token/credentials do Discord configurados corretamente (evitar TokenInvalid)
- [ ] Implementar handlers completos de tickets premium:
  - [ ] ticket-panel: botões `ticket_cat:*` e select `ticket_select`
  - [ ] Criação automática de canais por categoria
  - [ ] Anti-ticket duplicado + anti-spam/cooldown
  - [ ] Logs completos + persistência no banco
  - [ ] Transcript HTML/TXT no fechamento
  - [ ] Comandos: ticket-close, ticket-delete, ticket-add/remove, ticket-rename, ticket-logs

## Front-end (Website)
- [x] Atualização realtime do bloco de `.stats-grid` via `server-stats`
- [x] Socket.IO client adicionado no HTML (CDN)
- [ ] Ajustar mapeamento se no HTML você trocar a ordem/quantidade dos cards
- [ ] Incluir status do bot (online/offline) no site (se tiver markup)

## Host (Render)
- [ ] Preparar deploy no Render:
  - [ ] `start command`: `node src/index.js`
  - [ ] Definir env vars: `BOT_TOKEN`, `guildId`, `staffRoleId`, `ticketCategoryId`, `logsChannelId`
  - [ ] Garantir que o domínio/port do backend seja igual ao `window.VILTRUM_STATS_API_BASE` no front

