const { getEmails } = require('./middleware');

const router = require('express').Router();


// #region Email
router.get('/email', getEmails);
router.post('/email', (req, res) => {
  const mailOptions = {
    from: req.body.from,
    to: req.body.to,
    subject: req.body.subject,
    text: req.body.text,
    html: req.body.html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).send(error.toString());
    }
    res.status(200).send('Email sent: ' + info.response);
  });
});
// #endregion

// #region user
router.get('/user', (req, res) => {});
router.post('/user', (req, res) => {});
// #endregion


module.exports = router;
