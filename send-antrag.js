const { Resend } = require('resend');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Check API key
  if (!process.env.RESEND_API_KEY) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'RESEND_API_KEY ist nicht konfiguriert. Bitte in Netlify unter Site Configuration > Environment Variables setzen.' }),
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { pdfBase64, fileName, formData } = JSON.parse(event.body);

    if (!pdfBase64 || !formData) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Fehlende Daten (PDF oder Formulardaten)' }) };
    }

    // Send email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: 'Heimatverein Westenholz <onboarding@resend.dev>',
      to: ['h.rolf@koeckerling-frische.de', 'julia.reike@web.de'],
      subject: 'Mitgliedsantrag - ' + (formData.vorname || '') + ' ' + (formData.name || ''),
      html: '<div style="font-family: Arial, sans-serif; max-width: 600px;">' +
        '<h2 style="color: #2c5530;">Neuer Mitgliedsantrag</h2>' +
        '<p>Es wurde ein neuer Mitgliedsantrag ueber das Online-Formular eingereicht.</p>' +
        '<table style="width:100%; border-collapse: collapse; margin: 20px 0;">' +
        '<tr style="background: #f0f7f1;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Name</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.vorname || '') + ' ' + (formData.name || '') + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Adresse</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.strasse || '') + ', ' + (formData.plz || '') + ' ' + (formData.wohnort || '') + '</td></tr>' +
        '<tr style="background: #f0f7f1;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Geburtsdatum</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.gebdatum || '-') + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Telefon</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.telefon || '-') + '</td></tr>' +
        '<tr style="background: #f0f7f1;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">E-Mail</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.email || '-') + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">IBAN</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.iban || '-') + '</td></tr>' +
        '<tr style="background: #f0f7f1;"><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">BIC</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.bic || '-') + '</td></tr>' +
        '<tr><td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Beitrag</td><td style="padding: 8px 12px; border: 1px solid #ddd;">' + (formData.beitrag || '10') + ' Euro</td></tr>' +
        '</table>' +
        '<p style="color: #666; font-size: 13px;"><strong>Den vollstaendigen, unterschriebenen Antrag finden Sie als PDF im Anhang.</strong></p>' +
        '<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">' +
        '<p style="color: #999; font-size: 11px;">Automatisch generiert ueber das Online-Mitgliedsformular des Heimatverein Westenholz e.V.</p>' +
        '</div>',
      attachments: [
        {
          filename: fileName || 'Mitgliedsantrag.pdf',
          content: pdfBase64,
        },
      ],
    });

    if (error) {
      console.error('Resend error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden: ' + (error.message || JSON.stringify(error)) }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server-Fehler: ' + (err.message || 'Unbekannt') }),
    };
  }
};
