const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  from: {
    name: String,
    email: String
  },
  to: {
    name: String,
    email: String
  },
  subject: String,
  text: String,
  html: String,
  date: { type: Date, default: Date.now },
  isSpam: Boolean,
});

// const userSchema = new mongoose.Schema({
  
// });

const Email = mongoose.model('Email', emailSchema);

const extractContact = (contact) => {
  const regex = /^"([^"]+)"\s*<([^>]+)>$/;
  const matches = contact.match(regex);
  if (matches) {
    return { name: matches[1], email: matches[2] } || { name: '', email: '' };
  } else {
    return { name: '', email: contact }
  }
}


const createEmail = async(content, isSpam = false) => {
  
  try {
    const email = new Email({
      from: extractContact(content.from.text),
      to: extractContact(content.to.text),
      subject: content.subject,
      text: content.text,
      html: content.html,
      date: content.date,
      isSpam: isSpam
    });

    await email.save();
  } catch (error) {
    console.error(error);
  }
}

const getEmails = async (req, res) => {
  const { page = 0 } = req.params;
  try {
    const emails = await Email.find({}, null, { skip: page * 20, limit: 20 });
    res.json(emails);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
}

module.exports = {
  createEmail,
  getEmails
}