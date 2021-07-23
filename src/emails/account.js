const nodemailer = require('nodemailer');

async function sendWelcomeEmail(email, name) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.SENDER_EMAIL, // sender address
    to: email, // list of receivers
    subject: 'Thanks for joining us!', // Subject line
    text: `Welcome, ${name}! Your account has been created! Let us know how you get along with the app.`, // plain text body
  });

  console.log('Message sent: %s', info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

async function sendCancellationEmail(email, name) {
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_PASS,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: process.env.SENDER_EMAIL, // sender address
    to: email, // list of receivers
    subject: "We're sorry to see you go!", // Subject line
    text: `Hi, ${name}! It seems like you're about to delete your profile!
          We'd appreciate if you tell us why you've decided to leave. You can reply to this email mentioning the reason.
          However, you can come back again whenever you want. Just create an account again!`, // plain text body
  });

  console.log('Message sent: %s', info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

// sendCancellationEmail('andreane.graham50@ethereal.email', 'Andreane Graham');

module.exports = {
  sendWelcomeEmail,
  sendCancellationEmail
}