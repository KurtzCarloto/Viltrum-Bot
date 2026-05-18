const { PermissionsBitField, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');

const config = require('./config');
const { getDb } = require('../database/init');
const { secondsToHuman, nowIso } = require('../utils/time');
const { makeTicketEmbed } = require('../utils/embed');

const panel = config.panel;

function getCooldownKey(userId) {
  return `open:${userId}`;
}

function ticketName(user, typeId) {
  const base = user.username.replace(/[^a-zA-Z0-9_\- ]/g, '').trim();
  const tag = typeId || 'ticket';
  return `ticket-${tag}-${base}`.toLowerCase().replace(/\s+/g, '-').slice(0, 90);
}

function getCategoryById(typeId) {
  return panel.categories.find(c => c.id === typeId);
}

async function userHasOpenTicket(channelIdOrUserId, userId) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = "OPEN" LIMIT 1');
  const row = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = "OPEN" LIMIT 1').get(userId);
  return !!row;
}

async function openTicket({ interaction, typeId }) {
  const db = getDb();

  const existing = db.prepare('SELECT * FROM tickets WHERE user_id = ? AND status = "OPEN" LIMIT 1').get(interaction.user.id);
  if (existing) {
    return { ok: false, reason: 'EXISTS', existing };
  }

  const category = getCategoryById(typeId) || panel.categories[0];
  if (!category) throw new Error('Categoria de ticket inválida');

  const guild = interaction.guild;
  const staffRoleId = config.staffRoleId;

  const perms = [
    {
      id: interaction.user.id,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.ReadMessageHistory]
    },
    {
      id: staffRoleId,
      allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages, PermissionsBitField.Flags.ReadMessageHistory]
    },
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    }
  ];

  const channel = await guild.channels.create({
    name: ticketName(interaction.user, typeId),
    type: ChannelType.GuildText,
    parent: config.ticketCategoryId || null,
    permissionOverwrites: perms,
    topic: `Ticket do usuário ${interaction.user.tag} • Tipo: ${typeId}`
  });

  const openedAt = nowIso();

  const insert = db.prepare(`
    INSERT INTO tickets (guild_id, channel_id, user_id, username, category_id, ticket_type, opened_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN')
  `);

  insert.run(guild.id, channel.id, interaction.user.id, interaction.user.username, config.ticketCategoryId, typeId);

  await saveLog({
    guildId: guild.id,
    ticketChannelId: channel.id,
    userId: interaction.user.id,
    action: 'TICKET_OPEN',
    payload: { typeId, typeLabel: category.label }
  });

  const embed = makeTicketEmbed({
    typeLabel: category.label,
    username: interaction.user.tag,
    openAt: new Date(openedAt).toLocaleString('pt-BR')
  });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('Fechar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    new ButtonBuilder().setCustomId('ticket_support').setLabel('Suporte').setStyle(ButtonStyle.Primary).setEmoji('🧑‍💻')
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_rename').setLabel('Renomear').setStyle(ButtonStyle.Secondary).setEmoji('✏️'),
    new ButtonBuilder().setCustomId('ticket_add').setLabel('Adicionar').setStyle(ButtonStyle.Success).setEmoji('➕')
  );

  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_remove').setLabel('Remover').setStyle(ButtonStyle.Secondary).setEmoji('➖')
  );

  const msg = await channel.send({
    embeds: [embed],
    components: [row1, row2, row3]
  });

  const openingMsg = await channel.send({
    content: `<@${interaction.user.id}> ${config.messages.ticketOpened}`
  });

  // Persist initial messages as ticket messages
  await recordMessage({ channelId: channel.id, message: msg });
  await recordMessage({ channelId: channel.id, message: openingMsg });

  await interaction.reply({ content: `✅ Ticket criado: ${channel}` , ephemeral: true });

  return { ok: true, channel };
}

async function recordMessage({ channelId, message }) {
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ? LIMIT 1').get(channelId);
  if (!ticket) return;

  // Only store messages inside tickets
  const attachments = message.attachments?.size
    ? Array.from(message.attachments.values()).map(a => ({ url: a.url, name: a.name, size: a.size, contentType: a.contentType }))
    : [];

  const embeds = message.embeds?.length
    ? message.embeds.map(e => ({ title: e.title, description: e.description, url: e.url, color: e.color }))
    : [];

  db.prepare(`
    INSERT INTO ticket_messages (ticket_channel_id, message_id, author_id, author_username, content, created_at, attachments_json, embeds_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    channelId,
    message.id,
    message.author?.id || 'unknown',
    message.author?.username || 'unknown',
    sanitizeHtml(message.content || '', { allowedTags: [], allowedAttributes: {} }),
    nowIso(),
    JSON.stringify(attachments),
    JSON.stringify(embeds)
  );
}

async function saveLog({ guildId, ticketChannelId, userId, action, payload }) {
  const db = getDb();
  db.prepare(`
    INSERT INTO ticket_logs (guild_id, ticket_channel_id, user_id, action, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(guildId, ticketChannelId || null, userId || null, action, JSON.stringify(payload || {}), nowIso());
}

async function closeTicket({ interaction }) {
  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ? AND status = "OPEN" LIMIT 1').get(interaction.channel.id);
  if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket aberto.', ephemeral: true });

  // Permission: staff role or ticket owner
  const isStaff = interaction.member.roles.cache.has(config.staffRoleId);
  const isOwner = ticket.user_id === interaction.user.id;
  if (!isStaff && !isOwner) return interaction.reply({ content: '❌ Sem permissão para fechar este ticket.', ephemeral: true });

  const closedAt = nowIso();
  const openedAt = new Date(ticket.opened_at);
  const totalSeconds = Math.max(0, Math.floor((new Date(closedAt).getTime() - openedAt.getTime()) / 1000));

  // Generate transcript
  const transcript = await buildTranscriptTxt(interaction.channel.id);
  const transcriptHtml = await buildTranscriptHtml(interaction.channel.id);

  db.prepare(`UPDATE tickets SET closed_at = ?, closed_by = ?, total_seconds = ?, transcript_txt = ?, transcript_html = ?, status = 'CLOSED' WHERE channel_id = ?`).run(
    closedAt,
    interaction.user.id,
    totalSeconds,
    transcript.txt,
    transcriptHtml.html,
    interaction.channel.id
  );

  await saveLog({
    guildId: interaction.guild.id,
    ticketChannelId: interaction.channel.id,
    userId: interaction.user.id,
    action: 'TICKET_CLOSE',
    payload: { totalSeconds, closedAt }
  });

  // Lock channel
  await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone.id, { SendMessages: false });

  await interaction.reply({ content: config.messages.ticketClosed, ephemeral: true });

  // Send transcript to transcripts channel + logs
  const logsChannel = interaction.guild.channels.cache.get(config.logsChannelId) || await interaction.guild.channels.fetch(config.logsChannelId).catch(() => null);
  const transcriptsChannel = interaction.guild.channels.cache.get(config.transcriptsChannelId) || await interaction.guild.channels.fetch(config.transcriptsChannelId).catch(() => null);

  const att = transcript.txt.length
    ? new AttachmentBuilder(Buffer.from(transcript.txt, 'utf8'), { name: `transcript-${interaction.channel.name}.txt` })
    : null;

  if (transcriptsChannel && att) {
    await transcriptsChannel.send({
      content: `🧾 Transcript de ${interaction.channel.name} (ticket fechado)` ,
      files: [att]
    });
  }

  if (logsChannel) {
    await logsChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle('🔒 Ticket Fechado')
          .addFields(
            { name: 'Usuário', value: `<@${ticket.user_id}> (${ticket.username})`, inline: false },
            { name: 'Categoria', value: ticket.ticket_type, inline: true },
            { name: 'Abertura', value: new Date(ticket.opened_at).toLocaleString('pt-BR'), inline: true },
            { name: 'Fechamento', value: new Date(closedAt).toLocaleString('pt-BR'), inline: true },
            { name: 'Tempo total', value: secondsToHuman(totalSeconds), inline: false }
          )
      ]
    });
  }
}

async function buildTranscriptTxt(channelId) {
  const db = getDb();
  const msgs = db.prepare('SELECT * FROM ticket_messages WHERE ticket_channel_id = ? ORDER BY created_at ASC').all(channelId);
  let lines = [];
  lines.push(`Transcript - Ticket: ${channelId}`);
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);
  lines.push('='.repeat(60));

  for (const m of msgs) {
    const content = (m.content || '').trim();
    lines.push(`[${new Date(m.created_at).toLocaleString('pt-BR')}] ${m.author_username} (${m.author_id})`);
    if (content) lines.push(content);
    if (m.attachments_json && m.attachments_json !== '[]') lines.push(`- Anexos: ${m.attachments_json}`);
    lines.push('-'.repeat(40));
  }

  return { txt: lines.join('\n') };
}

async function buildTranscriptHtml(channelId) {
  const db = getDb();
  const msgs = db.prepare('SELECT * FROM ticket_messages WHERE ticket_channel_id = ? ORDER BY created_at ASC').all(channelId);
  const escape = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '<').replace(/>/g, '>');

  let html = `<!doctype html><html><head><meta charset="utf-8"/><title>Ticket Transcript</title>
  <style>
    body{font-family:system-ui,Arial; background:#0b0f17; color:#e6e6e6; padding:24px;}
    .header{padding:18px; border:1px solid rgba(255,255,255,.08); border-radius:14px; background:#121a2a;}
    .msg{margin-top:14px; padding:14px; border-radius:12px; border:1px solid rgba(255,255,255,.07); background:#0f1626;}
    .meta{opacity:.8; font-size:12px;}
    .content{margin-top:6px; white-space:pre-wrap;}
    .divider{height:1px; background:rgba(255,255,255,.08); margin:18px 0;}
  </style></head><body>`;

  html += `<div class="header"><h1>🧾 Transcript de Ticket</h1><div class="meta">Canal: ${escape(channelId)}</div><div class="meta">Gerado em: ${escape(new Date().toLocaleString('pt-BR'))}</div></div><div class="divider"></div>`;

  for (const m of msgs) {
    html += `<div class="msg">`;
    html += `<div class="meta">[${escape(new Date(m.created_at).toLocaleString('pt-BR'))}] ${escape(m.author_username)} (${escape(m.author_id)})</div>`;
    html += `<div class="content">${escape(m.content || '')}</div>`;
    html += `</div>`;
  }

  html += `</body></html>`;
  return { html };
}

module.exports = {
  openTicket,
  closeTicket,
  recordMessage,
};

