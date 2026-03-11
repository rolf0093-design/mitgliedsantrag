const { Resend } = require('resend');

exports.handler = async (event) => {
  // Only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { pdfBase64, fileName, formData } = JSON.parse(event.body);

    if (!pdfBase64 || !formData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Fehlende Daten' }) };
    }

    // Send email with PDF attachment
    const { data, error } = await resend.emails.send({
      from: 'Heimatverein Westenholz <onboarding@resend.dev>',
      to: ['h.rolf@koeckerling-frische.de', 'julia.reike@web.de'],
      subject: `Mitgliedsantrag - ${formData.vorname} ${formData.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #2c5530;">Neuer Mitgliedsantrag</h2>
          <p>Es wurde ein neuer Mitgliedsantrag über das Online-Formular eingereicht.</p>

          <table style="width:100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f0f7f1;">
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Name</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.vorname} ${formData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Adresse</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.strasse}, ${formData.plz} ${formData.wohnort}</td>
            </tr>
            <tr style="background: #f0f7f1;">
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Geburtsdatum</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.gebdatum}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Telefon</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.telefon || '-'}</td>
            </tr>
            <tr style="background: #f0f7f1;">
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">E-Mail</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.email || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">IBAN</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.iban}</td>
            </tr>
            <tr style="background: #f0f7f1;">
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">BIC</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.bic}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #ddd;">Beitrag</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.beitrag || '10'} Euro</td>
            </tr>
          </table>

          <p style="color: #666; font-size: 13px;">
            <strong>Den vollständigen, unterschriebenen Antrag finden Sie als PDF im Anhang.</strong>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #999; font-size: 11px;">
            Automatisch generiert über das Online-Mitgliedsformular des Heimatverein Westenholz e.V.
          </p>
        </div>
      `,
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
        body: JSON.stringify({ error: 'E-Mail konnte nicht gesendet werden' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
