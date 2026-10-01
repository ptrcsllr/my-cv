/**
 * Contact form handler for the portfolio site (Google Apps Script).
 * Emails each message from the site's contact form to TO, sent from your own Gmail account.
 *
 * Setup (one time):
 *  1. Go to https://script.google.com, signed in as sullerapatricia@gmail.com, and click "New project".
 *  2. Delete the sample code, paste this whole file in, and click Save.
 *  3. Click Deploy > New deployment. Click the gear next to "Select type" and choose "Web app".
 *       Description:    Portfolio contact form
 *       Execute as:     Me
 *       Who has access: Anyone
 *  4. Click Deploy, then Authorize access, and allow it to send email as you.
 *     (If Google shows "Google hasn't verified this app", click Advanced > Go to project. It's your own script.)
 *  5. Copy the "Web app" URL (ends in /exec) and set it as FORM_ENDPOINT in index.html.
 *
 * If you edit this script later: Deploy > Manage deployments > edit (pencil) > Version: New version > Deploy.
 * That keeps the same URL.
 */

const TO = 'sullerapatricia@gmail.com';
const MAX_PER_DAY = 50; // stays well under Gmail's daily sending limit

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);

    // Hidden "website" field is left empty by people; bots tend to fill it in. Pretend success.
    if (d.website) return json({ success: true });

    const name = clean(d.name, 200);
    const email = clean(d.email, 200);
    const lookingFor = clean(d.lookingFor, 100);
    const message = clean(d.message, 5000);
    if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ success: false, message: 'Missing or invalid fields' });
    }

    if (!underDailyLimit()) return json({ success: false, message: 'Daily limit reached' });

    MailApp.sendEmail({
      to: TO,
      replyTo: email,
      name: 'Portfolio contact form',
      subject: 'Portfolio inquiry from ' + name,
      body:
        'Name: ' + name + '\n' +
        'Email: ' + email + '\n' +
        'Looking for: ' + (lookingFor || '-') + '\n\n' +
        message + '\n\n' +
        '— Sent from the contact form on ptrcsllr.github.io/portfolio. Reply to this email to answer them.',
    });
    return json({ success: true });
  } catch (err) {
    return json({ success: false, message: String(err) });
  }
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

function underDailyLimit() {
  const props = PropertiesService.getScriptProperties();
  const key = 'sent-' + Utilities.formatDate(new Date(), 'Etc/UTC', 'yyyy-MM-dd');
  const count = Number(props.getProperty(key) || 0);
  if (count >= MAX_PER_DAY) return false;
  props.setProperty(key, String(count + 1));
  return true;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
