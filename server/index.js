const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || 'sirh.contact2023@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'gozqplkchdhiylck';
const MAIL_TO = (process.env.MAIL_TO || 'sofyen.elmnasria@gmail.com,azizbenhassine270@gmail.com')
  .split(',')
  .map((s) => s.trim());

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

function buildHtml(payload) {
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

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;">
    <tr>
      <td style="padding:40px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <span style="font-size:22px;font-weight:900;font-style:italic;color:#fff;letter-spacing:-1px;">CAFEE<span style="color:#737373;">.</span></span>
            </td>
            <td align="right">
              <span style="font-size:10px;font-weight:bold;letter-spacing:3px;color:#737373;text-transform:uppercase;">Architecture logicielle</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <table role="presentation" width="600" cellspacing="0" cellpadding="0" align="center" style="background:#ffffff;margin-top:-14px;">
    <tr>
      <td style="padding:40px 30px 10px;">
        <h1 style="margin:0;font-size:26px;line-height:1.15;text-transform:uppercase;letter-spacing:-1px;">
          Nouvel audit <span style="opacity:.35;">fonctions support</span>
        </h1>
        <p style="margin:12px 0 0;color:#888;font-size:13px;">Une demande d'audit de 30 minutes vient d'être soumise depuis ${
          payload.page || 'le site'
        }.</p>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:14px;background:#f7f7f7;width:33%;">
              <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">Effectif</div>
              <div style="font-size:20px;font-weight:bold;">${payload.effectif || '-'}</div>
            </td>
            <td style="padding:14px;background:#f7f7f7;width:33%;padding-left:6px;padding-right:6px;">
              <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">CA</div>
              <div style="font-size:20px;font-weight:bold;">${String(payload.ca).replace('.', ',')} M€</div>
            </td>
            <td style="padding:14px;background:#f7f7f7;width:34%;">
              <div style="font-size:10px;letter-spacing:2px;color:#888;text-transform:uppercase;">Secteur</div>
              <div style="font-size:13px;font-weight:bold;">${payload.secteur || '-'}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:10px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding:16px;background:#0a0a0a;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size:10px;letter-spacing:2px;color:#737373;text-transform:uppercase;margin-bottom:6px;">
                      Estimation — EBITDA par an
                    </div>
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
    </tr>

    <tr>
      <td style="padding:20px 30px 10px;">
        <h2 style="margin:0 0 14px;font-size:14px;letter-spacing:2px;text-transform:uppercase;">Répartition des choix</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 30px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td>
              <a href="${
                payload.calendly || 'https://calendly.com/moezevidenss/30min'
              }" target="_blank" style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-weight:bold;font-size:12px;letter-spacing:2px;text-transform:uppercase;padding:16px 28px;">
                Voir le créneau choisi →
              </a>
            </td>
            <td align="right">
              <span style="font-size:11px;color:#888;">${new Date(payload.timestamp).toLocaleString('fr-FR', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 30px 40px;">
        <p style="margin:0;color:#aaa;font-size:11px;">Audit de 30 min · visio · gratuit · sans engagement.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

app.post('/api/audit', async (req, res) => {
  try {
    const payload = req.body || {};

    const recipients = Array.isArray(MAIL_TO) ? MAIL_TO : [MAIL_TO];

    const info = await transporter.sendMail({
      from: `"Cafee Audit" <${SMTP_USER}>`,
      to: recipients.join(', '),
      subject: '🎯 Nouvel audit fonctions support — CAFEE.',
      html: buildHtml(payload),
      text: [
        'Nouvel audit fonctions support',
        '',
        `Effectif : ${payload.effectif}`,
        `CA : ${payload.ca} M€`,
        `Secteur : ${payload.secteur}`,
        `EBITDA estimé : +${fmtEur((payload.estimation || {}).ebitda)} € / an`,
        `Jours récupérés : ${(payload.estimation || {}).jours || 0} jours/an`,
        `Marge : +${String((payload.estimation || {}).marge || 0).replace('.', ',')} pt`,
        '',
        'Choix par fonction :',
        ...(payload.fonctions || []).map(
          (f) => `- ${f.nom} (${fmtH(f.heuresSem)} h/sem) : ${f.choix}`
        ),
        '',
        `Calendly : ${payload.calendly || 'https://calendly.com/moezevidenss/30min'}`,
      ].join('\n'),
    });

    res.json({ ok: true, accepted: info.accepted, messageId: info.messageId });
  } catch (err) {
    console.error('Erreur envoi email audit:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cafee Audit API écoute sur le port ${PORT}`);
});