const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendContactNotification(contact) {
  if (!process.env.EMAIL_USER) return;
  const info = await transporter.sendMail({
    from: `AI Hub <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New inquiry from ${contact.fullName || contact.firstName}`,
    text: `New inquiry for ${contact.businessName} (${contact.businessType})` ,
    html: `<h3>New Inquiry</h3><p><b>Name:</b> ${contact.firstName} ${contact.lastName}</p><p><b>Email:</b> ${contact.email}</p><p><b>Business:</b> ${contact.businessName} (${contact.businessType})</p><p><b>Type:</b> ${contact.inquiryType}</p><p><b>Message:</b> ${contact.message || '-'} </p>`
  });
  return info;
}

async function sendDemoConfirmation(contact, isReschedule = false) {
  if (!process.env.EMAIL_USER) return;
  const subject = isReschedule ? 'Your AI Hub demo has been rescheduled' : 'Your AI Hub demo is booked';
  const info = await transporter.sendMail({
    from: `AI Hub <${process.env.EMAIL_USER}>`,
    to: contact.email,
    subject,
    html: `<h3>${subject}</h3><p>Hi ${contact.firstName},</p><p>Your demo details:</p><ul><li>Date: ${new Date(contact.demoDetails.preferredDate).toDateString()}</li><li>Time: ${contact.demoDetails.preferredTime}</li><li>Type: ${contact.demoDetails.demoType}</li></ul><p>We look forward to speaking with you!</p>`
  });
  return info;
}

module.exports = { sendContactNotification, sendDemoConfirmation };
