const User = require("../models/User");
const { hash } = require("bcryptjs");
const crypto = require("crypto");
const mailer = require("../../lib/mailer");

module.exports = {
  loginForm(req, res) {
    return res.render("session/login");
  },
  login(req, res) {
    req.session.userId = req.user.id;

    return res.redirect("/users");
  },
  logout(req, res) {
    req.session.destroy();
    return res.redirect("/");
  },
  forgotForm(req, res) {
    return res.render("session/forgot-password");
  },
  async forgot(req, res) {
    const user = req.user;

    try {
      // um token para esse usuário
      const token = crypto.randomBytes(20).toString("hex");

      // criar um expiração
      let now = new Date();

      now = now.setHours(now.getHours() + 1);

      await User.update(user.id, {
        reset_token: token,
        reset_token_expires: now,
      });

      // enviar um email com um link de recuperação de senha
      await mailer.sendMail({
        to: user.email,
        from: "Launchstore <no-reply@launchstore>",
        subject: "Recuperação de senha",
        html: `<h2>Esqueceu a senha?</h2>
      <p>Não se preocupe, clique no link abaixo para criar uma nova senha</p>
      <p> 
        <a href="http://localhost:3000/users/password-reset?token=${token}" target="_blank">CRIAR NOVA SENHA</a>
      </p>`,
      });

      // avisar o usuário que enviamos um email
      return res.render("session/forgot-password", {
        success: "Verifique seu email para resetar a senha",
      });
    } catch (err) {
      console.error(err);

      return res.render("session/forgot-password", {
        error: "Erro inesperado. Tente novamente!",
      });
    }
  },
  resetForm(req, res) {
    return res.render("session/password-reset", { token: req.query.token });
  },
  async reset(req, res) {
    const user = req.user;
    const { password, token } = req.body;

    try {
      // criar um novo hash de senha
      const newPassword = await hash(password, 8);

      // atualiza o usuário
      await User.update(user.id, {
        password: newPassword,
        reset_token: "",
        reset_token_expires: "",
      });

      // avisa o usuário que ele tem uma nova senha
      return res.render("session/login", {
        user: req.body,
        success: "Sua senha foi atualizada com sucesso! Faça o seu login.",
      });
    } catch (err) {
      console.error(err);

      return res.render("session/password-reset", {
        user: req.body,
        token,
        error: "Erro inesperado. Tente novamente!",
      });
    }
  },
};