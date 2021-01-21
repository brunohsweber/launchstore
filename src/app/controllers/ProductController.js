const Category = require("../models/Category");
const Product = require("../models/Product");
const File = require("../models/File");
const { formatPrice, date } = require("../../lib/utils");
const { Ingest } = require("sonic-channel");

const sonicChannelIngest = new Ingest({
  host: "localhost",
  port: 1491,
  auth: "SecretPassword",
});

sonicChannelIngest.connect();

module.exports = {
  create(req, res) {
    Category.all()
      .then(function (results) {
        const categories = results.rows;
        return res.render("products/create.njk", { categories });
      })
      .catch(function (err) {
        throw new Error(err);
      });
  },
  async post(req, res) {
    const keys = Object.keys(req.body);

    for (key of keys) {
      if (req.body[key] == "") {
        return res.send("Por favor, preencha todos os campos");
      }
    }

    if (req.files.length == 0) {
      return res.send("Por favor, envie pelo menos uma imagem");
    }

    req.body.user_id = req.session.userId;

    let results = await Product.create(req.body);

    const product = results.rows[0];

    const indexedText = `${product.name} ${product.description}`;

    // Indexação no Sonic
    await sonicChannelIngest.push(
      "products", //colection - "tabela"
      "default", // bucket - "categorização"
      product.id, // o que deve ser retornado nas buscas
      indexedText, // texto a ser indexado
      {
        lang: "por",
      }
    );

    const filesPromise = req.files.map((file) =>
      File.create({ ...file, product_id: product.id })
    );

    await Promise.all(filesPromise);

    return res.redirect(`/products/${product.id}`);
  },
  async show(req, res) {
    let results = await Product.find(req.params.id);
    const product = results.rows[0];

    if (!product) return res.send("Product not found!");

    const { day, hour, minutes, month } = date(product.updated_at);

    product.published = {
      day: `${day}/${month}`,
      hour: `${hour}h${minutes}`,
    };

    product.oldPrice = formatPrice(product.old_price);
    product.price = formatPrice(product.price);

    results = await Product.files(product.id);
    const files = results.rows.map((file) => ({
      ...file,
      src: `${req.protocol}://${req.headers.host}${file.path.replace(
        "public",
        ""
      )}`,
    }));

    return res.render("products/show", { product, files });
  },
  async edit(req, res) {
    let results = await Product.find(req.params.id);
    const product = results.rows[0];

    if (!product) return res.send("Product not found!");

    // get categories
    results = await Category.all();
    const categories = results.rows;

    product.price = formatPrice(product.price);

    // get images
    results = await Product.files(product.id);
    let files = results.rows;
    files = files.map((file) => ({
      ...file,
      src: `${req.protocol}://${req.headers.host}${file.path.replace(
        "public",
        ""
      )}`,
    }));

    return res.render("products/edit.njk", { product, categories, files });
  },
  async put(req, res) {
    const keys = Object.keys(req.body);

    for (key of keys) {
      if (req.body[key] == "" && key != "removed_files") {
        return res.send("Please, fill all fields");
      }
    }

    const productId = req.body.id;

    if (req.files.length != 0) {
      const newFilesPromise = req.files.map((file) =>
        File.create({ ...file, product_id: productId })
      );

      await Promise.all(newFilesPromise);
    }

    if (req.body.removed_files) {
      // 1,2,3,
      const removedFiles = req.body.removed_files.split(","); // [1,2,3,]
      const lastIndex = removedFiles.length - 1;
      removedFiles.splice(lastIndex, 1); // [1,2,3]

      const removedFilesPromise = removedFiles.map((id) => File.delete(id));

      await Promise.all(removedFilesPromise);
    }

    req.body.price = req.body.price.replace(/\D/g, "");

    if (req.body.old_price != req.body.price) {
      const oldProduct = await Product.find(productId);

      req.body.old_price = oldProduct.rows[0].price;
    }

    let results = await Product.update(req.body);
    const newName = results.rows[0].name;
    const newDescription = results.rows[0].description;
    const indexedText = `${newName} ${newDescription}`;

    await sonicChannelIngest.flusho("products", "default", productId);

    // Indexação no Sonic
    await sonicChannelIngest.push(
      "products", //colection - "tabela"
      "default", // bucket - "categorização"
      productId, // o que deve ser retornado nas buscas
      indexedText, // texto a ser indexado
      {
        lang: "por",
      }
    );

    return res.redirect(`/products/${productId}/edit`);
  },
  async delete(req, res) {
    try {
      const productId = req.body.id;

      let results = await Product.files(productId);
      const filesProduct = results.rows;

      const removeFilesProductPromise = filesProduct.map(async (file) => {
        await File.delete(file.id);
      });

      await Promise.all(removeFilesProductPromise);

      await Product.delete(productId);

      // Limpa todos os índices da collection "products"
      // await sonicChannelIngest.flushc("products");

      // Limpa todos os índices da "default" da collection "products"
      // await sonicChannelIngest.flushb("products", "default");

      // Limpa todos os índices da "default" da collection "products" com Id tal
      await sonicChannelIngest.flusho("products", "default", productId);

      return res.redirect("/products/create");
    } catch (err) {
      console.error(err);
    }
  },
};
