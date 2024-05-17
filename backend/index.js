require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Imap = require('imap');
const cors = require('cors');
const { simpleParser } = require('mailparser');
const { exec } = require('child_process');
const { createEmail } = require('./middleware');
const _ = require('lodash');
const routes = require('./routes');
const USERMAIL = process.env.USERMAIL;
const PASSWORD = process.env.PASSWORD;
const pyPath = process.env.PYTHON_PATH;
const app = express();
app.use(cors())
app.use(bodyParser.json());

app.use('/api', routes);
mongoose.connect('mongodb://localhost:27017/mailserver', {
  useNewUrlParser: true
});

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: USERMAIL,
    pass: PASSWORD
  },
});

const imap = new Imap({
  user: USERMAIL,
  password: PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
});

function openInbox(cb) {
  try {
    imap.openBox('INBOX', false, cb);
  } catch (error) {
    console.error(error);
  }
}

function processMessage(msg, isNew = false) {
  msg.on('body', (stream, info) => {
    simpleParser(stream, async (err, parsed) => {

      if (isNew) {
        if (err) throw err;
        const emailText = parsed.text || '';
        const pythonProcess = exec(`${pyPath} detection/spam_detection.py "${emailText.replace(/"/g, '\\"')}"`);

        pythonProcess.stdout.on('data', async (data) => {
          console.log(data);
          const isSpam = (data.trim() === 'spam') ? true : false;
          createEmail(parsed, isSpam);
        });

        pythonProcess.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
          console.log(`child process exited with code ${code}`);
          pythonProcess.kill();
        });
        // console.log(parsed);
      } else {
        createEmail(parsed);
      }

      if (err) throw err;
    });

  });
}

imap.once('ready', () => {
  console.log('🟢 Connection ready');
  openInbox((err, box) => {
    console.log('🟢 Connection established');
    if (err) throw err;
    // fetch mails from gmail inbox
    imap.search(['ALL'], (err, results) => {
      if (err) throw err;
      const f = imap.fetch(results, { bodies: '', markSeen: true });
      f.on('message', (msg, seqno) => {
        processMessage(msg);
      });
      f.once('end', () => {
        console.log('Done fetching all messages!');
      });
    });

    // wait for new mail
    imap.on('mail', (numNewMsgs) => {
      console.log(`🟢 New message received: ${numNewMsgs}`);
      imap.search(['UNSEEN'], (err, results) => {
        if (err) throw err;
        const f = imap.fetch(results, { bodies: '', markSeen: true });
        
        f.on('message', (msg) => {
          processMessage(msg, true);
        });
        f.once('end', () => {
          console.log('🟢 Done fetching new messages!');
        });
      });
    });
  });
});
imap.once('error', (err) => {
  console.error(err);
});

imap.once('end', () => {
  console.log('🟢 Connection ended');
});

imap.connect();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🟢 Server is running on port ${PORT}`);
});
