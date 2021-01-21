const User = require("../models/User");
const { formatCpfCnpj, formatCep } = require("../../lib/utils");
const Product = require("../models/Product");
const { Ingest } = require("sonic-channel");

const sonicChannelIngest = new Ingest({
  host: "localhost",
  port: 1491,
  auth: "SecretPassword",
});

sonicChannelIngest.connect();

module.exports = {
  registerForm(req, res) {
    return res.render("users/register");
  },
  async show(req, res) {
    const { user } = req;

    user.cpf_cnpj = formatCpfCnpj(user.cpf_cnpj);
    user.cep = formatCep(user.cep);

    return res.render("users/index", { user });
  },
  async post(req, res) {
    const userId = await User.create(req.body);

    req.session.userId = userId;

    return res.redirect("/users");
  },
  async update(req, res) {
    try {
      const { user } = req;
      let { name, email, cpf_cnpj, cep, address } = req.body;

      cpf_cnpj = cpf_cnpj.replace(/\D/g, "");
      cep = cep.replace(/\D/g, "");

      await User.update(user.id, {
        name,
        email,
        cpf_cnpj,
        cep,
        address,
      });

      return res.render("users/index", {
        user: req.body,
        success: "Conta atualizada com sucesso!",
      });
    } catch (err) {
      console.error(err);
      return res.render("user/index", {
        error: "Algum erro aconteceu!",
      });
    }
  },
  async delete(req, res) {
    try {
      let results = await Product.findByUser(req.body.id);
      const productsUser = results.rows;

      await User.delete(req.body.id);

      const productIndexingRemoverPromise = productsUser.map(
        async (product) => {
          await sonicChannelIngest.flusho("products", "default", product.id);
        }
      );

      await Promise.all(productIndexingRemoverPromise);

      req.session.destroy();

      return res.render("session/login", {
        success: "Conta deletada com sucesso!",
      });
    } catch (err) {
      console.error(err);

      return res.render("users/index", {
        user: req.body,
        error: "Erro ao tentar deletar sua conta!",
      });
    }
  },
};
