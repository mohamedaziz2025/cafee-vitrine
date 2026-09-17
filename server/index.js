const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || 'sirh.contact2023@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'gozqplkchdhiylck';
const MAIL_TO = (
  process.env.MAIL_TO || 'sofyen.elmnasria@gmail.com,azizbenhassine270@gmail.com'
)
  .split(',')
  .map((s) => s.trim());

const CALENDLY = 'https://calendly.com/azizbenhassine270/audit-ia-gratuit';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

function fmtEur(n) {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
}

function fmtH(n) {
  return String(n).replace('.', ',');
}

function block(label, inner, opts = {}) {
  return `
    <tr>
      <td style="padding:${opts.top || 22}px 30px 6px;">
        <h2 style="margin:0 0 10px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#737373;">${label}</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${inner}</table>
      </td>
    </tr>`;
}

function kvRows(pairs) {
  return pairs
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 0;color:#888;font-size:12px;">${k}</td><td style="padding:4px 0;text-align:right;font-weight:bold;font-size:13px;">${v}</td></tr>`
    )
    .join('');
}

function checkList(items) {
  return (items || [])
    .map((i) => `<tr><td style="padding:3px 0;font-size:12px;">✓ ${i}</td></tr>`)
    .join('');
}

function buildShell(subject, email, reqPage) {
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
    <tr>
      <td style="padding:40px 30px;">
        <span style="font-size:22px;font-weight:900;font-style:italic;color:#fff;letter-spacing:-1px;">CAFEE<span style="color:#737373;">.</span></span>
        <span style="font-size:10px;font-weight:bold;letter-spacing:3px;color:#737373;text-transform:uppercase;float:right;line-height:24px;">Architecture logicielle</span>
      </td>
    </tr>
  </table>

  <table role="presentation" width="600" cellspacing="0" cellpadding="0" align="center" style="background:#ffffff;margin-top:-14px;">
    <tr>
      <td style="padding:40px 30px 14px;">
        <h1 style="margin:0;font-size:26px;line-height:1.15;text-transform:uppercase;letter-spacing:-1px;">${email.title}</h1>
        <p style="margin:12px 0 0;color:#888;font-size:13px;">Reçue depuis ${reqPage}</p>
      </td>
    </tr>
    ${email.bodyHtml}
    <tr>
      <td style="padding:14px 30px 40px;color:#aaa;font-size:11px;">
        Demande reçue depuis ${reqPage}
        &nbsp;·&nbsp; ${new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `CAFEE.\n${email.title.toUpperCase()}\n\n${email.bodyText}\n\n${'─'.repeat(24)}\nDemande reçue depuis ${reqPage}`;

  return { subject, html, text };
}

function buildFormEmail(payload) {
  const e = payload.entreprise || {};
  const c = payload.contact || {};
  const o = payload.operations || {};
  const t = payload.outils || {};
  const g = payload.objectif || {};

  const bodyHtml = [
    block('Entreprise', kvRows([
      ['Nom', e.nom],
      ['Site', e.site],
      ['Secteur', e.secteur],
      ['Effectif', e.effectif],
      ['CA', e.caAnnuel],
    ])),
    block('Contact', kvRows([
      ['Nom', c.nom],
      ['Fonction', c.fonction],
      ['Email', c.email ? `<a href="mailto:${c.email}" style="color:#0a0a0a;">${c.email}</a>` : ''],
      ['Téléphone', c.telephone],
    ])),
    block(
      'Fonctions concernées',
      checkList(o.fonctions) || '<tr><td style="padding:3px 0;font-size:12px;color:#888;">Non précisées</td></tr>'
    ),
    block('Outils', [
      t.liste ? `<tr><td style="padding:4px 0;font-size:13px;font-weight:bold;">${t.liste}</td></tr>` : '',
      `<tr><td style="padding:4px 0;color:#888;font-size:12px;">Automatisation existante : ${t.automatisation || 'Non précisée'}</td></tr>`,
    ].join('')),
    block('Objectif', [
      g.description ? `<tr><td style="padding:4px 0;font-size:13px;font-style:italic;">« ${g.description} »</td></tr>` : '',
      checkList(g.priorites),
    ].join('')),
  ].join('');

  const bodyText = [
    'ENTREPRISE',
    ...(e.nom ? [`Nom : ${e.nom}`] : []),
    ...(e.site ? [`Site : ${e.site}`] : []),
    ...(e.secteur ? [`Secteur : ${e.secteur}`] : []),
    ...(e.effectif ? [`Effectif : ${e.effectif}`] : []),
    ...(e.caAnnuel ? [`CA : ${e.caAnnuel}`] : []),
    '',
    'CONTACT',
    ...(c.nom ? [`Nom : ${c.nom}`] : []),
    ...(c.fonction ? [`Fonction : ${c.fonction}`] : []),
    ...(c.email ? [`Email : ${c.email}`] : []),
    ...(c.telephone ? [`Téléphone : ${c.telephone}`] : []),
    '',
    'FONCTIONS CONCERNÉES',
    ...(o.fonctions || []).map((f) => `✓ ${f}`),
    '',
    'OUTILS',
    ...(t.liste ? [t.liste] : []),
    `Automatisation existante : ${t.automatisation || 'Non précisée'}`,
    '',
    'OBJECTIF',
    ...(g.description ? [`« ${g.description} »`] : []),
    ...(g.priorites || []).map((p) => `✓ ${p}`),
    '',
    'CONTACT POUR SUITE',
    `Calendly : ${CALENDLY}`,
  ].join('\n');

  return {
    title: "Nouvelle demande d'audit",
    subject: `Nouvelle demande d'audit — ${e.nom || 'CAFEE'}`,
    bodyHtml,
    bodyText,
  };
}

function buildCalendlyEmail(payload) {
  const timestamp = new Date(payload.timestamp || Date.now()).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const bodyHtml = `
    <tr>
      <td style="padding:20px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <p style="margin:0;color:#888;font-size:13px;">Un créneau d'audit (30 min) va être réservé sur Calendly.</p>
              <p style="margin:14px 0 0;font-size:13px;color:#0a0a0a;"><strong>Page :</strong> ${payload.page || '/audit'}</p>
              <p style="margin:4px 0 0;font-size:13px;color:#0a0a0a;"><strong>Date/heure de réservation :</strong> ${timestamp}</p>
            </td>
          </tr>
          <tr>
            <td style="padding-top:24px;">
              <a href="${payload.calendly || CALENDLY}" target="_blank" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:16px 28px;">
                Réserver le créneau →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  return {
    title: 'Réservation d’audit via Calendly',
    subject: 'Réservation d’audit via Calendly — CAFEE.',
    bodyHtml,
    bodyText: `Un créneau d'audit (30 min) va être réservé sur Calendly.\nPage : ${payload.page || '/audit'}\nDate/heure de réservation : ${timestamp}\nCalendly : ${payload.calendly || CALENDLY}`,
  };
}

function buildSimulatorEmail(payload) {
  const choixLabel = (c) => ({ garder: 'Garder', externaliser: 'Externaliser', automatiser: 'Automatiser ✦' }[c] || c);
  const est = payload.estimation || {};
  const ebitda = est.ebitda || 0;
  const jours = est.jours || 0;
  const marge = est.marge || 0;

  const rows = (payload.fonctions || [])
    .map(
      (f, i) => `
      <tr style="border-bottom:1px solid #eee;">
        <td style="padding:10px 0;vertical-align:top;">
          <strong>${i + 1}. ${f.nom || ''}</strong><br/>
          <span style="color:#888;font-size:12px;">${f.desc || ''}</span>
        </td>
        <td style="padding:10px 0;white-space:nowrap;color:#888;font-size:12px;">≈ ${fmtH(f.heuresSem)} h/sem</td>
        <td style="padding:10px 0;white-space:nowrap;text-align:right;"><strong>${choixLabel(f.choix)}</strong></td>
      </tr>`
    )
    .join('');

  const bodyHtml = [
    `<tr>
      <td style="padding:20px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:14px;background:#f7f7f7;width:33%;">
              <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">Effectif</div>
              <div style="font-size:20px;font-weight:bold;">${payload.effectif || '-'}</div>
            </td>
            <td style="padding:14px;background:#f7f7f7;width:33%;">
              <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">CA</div>
              <div style="font-size:20px;font-weight:bold;">${String(payload.ca || 0).replace('.', ',')} M€</div>
            </td>
            <td style="padding:14px;background:#f7f7f7;width:34%;">
              <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">Secteur</div>
              <div style="font-size:13px;font-weight:bold;">${payload.secteur || '-'}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    `<tr>
      <td style="padding:10px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:16px;background:#0a0a0a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:10px;letter-spacing:2px;color:#737373;text-transform:uppercase;margin-bottom:6px;">Estimation — EBITDA par an</div>
                    <div style="font-size:34px;font-weight:900;color:#fff;">+${fmtEur(ebitda)} €</div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <div style="font-size:10px;letter-spacing:1px;color:#737373;text-transform:uppercase;margin-bottom:6px;">Capacité récupérée</div>
                    <div style="font-size:18px;font-weight:bold;color:#fff;">${jours} jours/an</div>
                    <div style="font-size:18px;font-weight:bold;color:#fff;">+${String(marge).replace('.', ',')} pt de marge</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    `<tr>
      <td style="padding:20px 30px;">
        <h2 style="margin:0 0 14px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Répartition des choix</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </td>
    </tr>`,
  ].join('');

  return {
    title: 'Nouvel audit fonctions support',
    subject: '🎯 Nouvel audit fonctions support — CAFEE.',
    bodyHtml,
    bodyText: [
      'Nouvel audit fonctions support',
      '',
      `Effectif : ${payload.effectif}`,
      `CA : ${payload.ca} M€`,
      `Secteur : ${payload.secteur}`,
      `EBITDA estimé : +${fmtEur(ebitda)} € / an`,
      `Jours récupérés : ${jours} jours/an`,
      `Marge : +${String(marge).replace('.', ',')} pt`,
      '',
      'Choix par fonction :',
      ...(payload.fonctions || []).map((f) => `- ${f.nom} (${fmtH(f.heuresSem)} h/sem) : ${f.choix}`),
    ].join('\n'),
  };
}

app.post('/api/audit', async (req, res) => {
  try {
    const payload = req.body || {};
    const reqPage = payload.page || 'cafeeagency.com/audit';

    let email;
    if (payload.type === 'formulaire') email = buildFormEmail(payload);
    else if (payload.type === 'calendly') email = buildCalendlyEmail(payload);
    else email = buildSimulatorEmail(payload);

    const mail = buildShell(email.subject, email, reqPage);

    const info = await transporter.sendMail({
      from: `"Cafee Audit" <${SMTP_USER}>`,
      to: MAIL_TO.join(', '),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });

    res.json({ ok: true, accepted: info.accepted, messageId: info.messageId });
  } catch (err) {
    console.error('Erreur envoi email audit:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Cafee Audit API écoute sur le port ${PORT}`);
  });
}

module.exports = { buildFormEmail, buildCalendlyEmail, buildSimulatorEmail, buildShell };