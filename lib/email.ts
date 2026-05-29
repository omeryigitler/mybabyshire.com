type OrderEmailItem = {
  productName: string;
  quantity: number;
  price: number;
};

type OrderEmailPayload = {
  to: string;
  customerName: string;
  orderNumber: string;
  total: number;
  paymentProvider?: string | null;
  trackingReference?: string | null;
  items?: OrderEmailItem[];
};

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || 'MY BABY SHIRE <orders@mybabyshire.com>';
const siteUrl = (process.env.PUBLIC_SITE_URL || 'https://mybabyshire.com').replace(/\/$/, '');

const money = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const baseEmailHtml = ({ title, intro, orderNumber, customerName, total, paymentProvider, trackingReference, items }: OrderEmailPayload & { title: string; intro: string }) => {
  const trackUrl = `${siteUrl}/track-order`;
  const itemRows = items?.length ? items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #eee3d8;color:#3b2418;font-weight:600;">${escapeHtml(item.productName)}</td>
      <td style="padding:12px 0;border-bottom:1px solid #eee3d8;color:#7b6254;text-align:center;">${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #eee3d8;color:#3b2418;text-align:right;font-weight:700;">${money(item.quantity * item.price)}</td>
    </tr>
  `).join('') : '';

  return `
  <div style="margin:0;padding:0;background:#fff8ef;font-family:Arial,Helvetica,sans-serif;color:#3b2418;">
    <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
      <div style="background:#ffffff;border:1px solid #eadfd4;border-radius:28px;padding:34px;box-shadow:0 18px 50px rgba(58,37,26,0.10);">
        <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#9b8070;font-weight:700;margin-bottom:14px;">MY BABY SHIRE</div>
        <h1 style="margin:0;font-family:Georgia,serif;font-size:38px;line-height:1.1;color:#3b2418;">${escapeHtml(title)}</h1>
        <p style="margin:16px 0 0;color:#6f594c;line-height:1.7;font-size:15px;">Hi ${escapeHtml(customerName)}, ${escapeHtml(intro)}</p>
        <div style="margin-top:26px;background:#fff8ef;border:1px solid #eadfd4;border-radius:22px;padding:20px;">
          <div style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9b8070;font-weight:700;">Order reference</div>
          <div style="margin-top:8px;font-size:20px;letter-spacing:0.08em;font-weight:800;color:#3b2418;">${escapeHtml(orderNumber)}</div>
        </div>
        ${items?.length ? `<table style="width:100%;border-collapse:collapse;margin-top:24px;">
          <thead><tr><th style="text-align:left;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9b8070;padding-bottom:8px;">Item</th><th style="text-align:center;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9b8070;padding-bottom:8px;">Qty</th><th style="text-align:right;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#9b8070;padding-bottom:8px;">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>` : ''}
        <div style="margin-top:22px;line-height:1.8;color:#6f594c;font-size:14px;">
          ${paymentProvider ? `<div><strong style="color:#3b2418;">Payment:</strong> ${escapeHtml(paymentProvider)}</div>` : ''}
          ${trackingReference ? `<div><strong style="color:#3b2418;">Tracking:</strong> ${escapeHtml(trackingReference)}</div>` : ''}
          <div><strong style="color:#3b2418;">Total:</strong> ${money(total)}</div>
        </div>
        <a href="${escapeHtml(trackUrl)}" style="display:inline-block;margin-top:26px;background:#3b2418;color:#ffffff;text-decoration:none;border-radius:999px;padding:14px 22px;font-size:14px;font-weight:700;">Track your order</a>
        <p style="margin-top:28px;color:#9b8070;font-size:12px;line-height:1.6;">Thank you for choosing MY BABY SHIRE. Keep this email for your records.</p>
      </div>
    </div>
  </div>`;
};

const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  if (!resendApiKey) {
    console.log(`[email skipped] Missing RESEND_API_KEY. Subject: ${subject}. To: ${to}`);
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[email failed]', data);
    return { skipped: false, error: data };
  }

  return { skipped: false, data };
};

export const sendPaymentConfirmedEmail = async (payload: OrderEmailPayload) => {
  return sendEmail({
    to: payload.to,
    subject: `Payment confirmed — ${payload.orderNumber}`,
    html: baseEmailHtml({ ...payload, title: 'Payment Confirmed', intro: 'your payment was confirmed and your gift order is now being prepared.' }),
  });
};

export const sendOrderShippedEmail = async (payload: OrderEmailPayload) => {
  return sendEmail({
    to: payload.to,
    subject: `Your order has shipped — ${payload.orderNumber}`,
    html: baseEmailHtml({ ...payload, title: 'Your Gift Has Shipped', intro: 'your MY BABY SHIRE gift is now on the way.' }),
  });
};

export const sendOrderDeliveredEmail = async (payload: OrderEmailPayload) => {
  return sendEmail({
    to: payload.to,
    subject: `Delivered — ${payload.orderNumber}`,
    html: baseEmailHtml({ ...payload, title: 'Delivered', intro: 'your MY BABY SHIRE gift has been marked as delivered.' }),
  });
};
