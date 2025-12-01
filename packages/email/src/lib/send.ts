interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({to, subject, body}: SendEmailParams) {
  const apiUrl = process.env.API_URI ?? 'http://localhost:8080';
  const res = await fetch(`${apiUrl}/v1/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PLUNK_API_KEY}`,
    },
    body: JSON.stringify({
      to,
      subject,
      body,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.log(errorText);
    throw new Error('Failed to send email');
  }
}
