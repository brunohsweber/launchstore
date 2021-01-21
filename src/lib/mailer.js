const nodemailer = require("nodemailer");

// PARA FINS DE TESTE
module.exports = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "30903a27155a06",
    pass: "796b5b1f5278d1",
  },
});

/* EM PRODUÇÃO - REAL
module.exports = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465,
  auth: {
    user: "contato@brunoweber.com.br",
    pass: "jz3ujj8f",
  },
});
*/
