const { unlinkSync } = require("fs");

const Category = require("../models/Category");
const Product = require("../models/Product");
const File = require("../models/File");

const LoadProductService = require("../services/LoadProductService");
const FullTextSearchService = require("../services/FullTextSearchService");

module.exports = {
  async create(req, res) {
    try {
      const categories = await Category.findAll();

      return res.render("products/create.njk", { categories });
    } catch (error) {
      console.error(error);
    }
  },
  async post(req, res) {
    try {
      let {
        category_id,
        name,
        description,
        old_price,
        price,
        quantity,
        status,
      } = req.body;

      price = price.replace(/\D/g, "");

      const product_id = await Product.create({
        category_id,
        user_id: req.session.userId,
        name,
        description,
        old_price: old_price || price,
        price,
        quantity,
        status: status || 1,
      });

      const fullText = `${name} ${description}`;

      await FullTextSearchService.createIndex(product_id, fullText);

      const filesPromise = req.files.map((file) =>
        File.create({ name: file.filename, path: file.path, product_id })
      );

      await Promise.all(filesPromise);

      return res.redirect(`/products/${product_id}`);
    } catch (error) {
      console.error(error);
    }
  },
  async show(req, res) {
    try {
      const product = await LoadProductService.load("product", {
        where: { id: req.params.id },
      });

      return res.render("products/show", { product });
    } catch (error) {
      console.error(error);
    }
  },
  async edit(req, res) {
    try {
      const product = await LoadProductService.load("product", {
        where: { id: req.params.id },
      });

      // get categories
      const categories = await Category.findAll();

      return res.render("products/edit", { product, categories });
    } catch (error) {
      console.error(error);
    }
  },
  async put(req, res) {
    try {
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

        req.body.old_price = oldProduct.price;
      }

      await Product.update(productId, {
        category_id: req.body.category_id,
        name: req.body.name,
        description: req.body.description,
        old_price: req.body.old_price,
        price: req.body.price,
        quantity: req.body.quantity,
        status: req.body.status,
      });

      const fullText = `${req.body.name} ${req.body.description}`;

      await FullTextSearchService.updateIndex(productId, fullText);

      return res.redirect(`/products/${productId}/edit`);
    } catch (error) {
      console.error(error);
    }
  },
  async delete(req, res) {
    try {
      const productId = req.body.id;

      let files = await Product.files(productId);

      const removeFilesProductPromise = files.map(async (file) => {
        unlinkSync(file.path);

        await File.delete(file.id);
      });

      await Promise.all(removeFilesProductPromise);

      await Product.delete(productId);

      await FullTextSearchService.deleteIndex(productId);

      return res.redirect("/products/create");
    } catch (err) {
      console.error(err);
    }
  },
};
