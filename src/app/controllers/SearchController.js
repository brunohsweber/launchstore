const Product = require("../models/Product");
const { formatPrice } = require("../../lib/utils");
const { Search } = require("sonic-channel");

const sonicChannelSearch = new Search({
  host: "localhost",
  port: 1491,
  auth: "SecretPassword",
});

sonicChannelSearch.connect();

module.exports = {
  async index(req, res) {
    try {
      let results,
        params = {};

      let { filter, category } = req.query;

      if (!filter) return res.redirect("/");

      results = await sonicChannelSearch.query("products", "default", filter, {
        lang: "por",
      });

      resultsSonicSearch = results.map(Number);

      resultsSonicSearch == ""
        ? (params.filter = null)
        : (params.filter = resultsSonicSearch);

      if (category) {
        params.category = category;
      }

      results = await Product.search(params);

      async function getImage(productId) {
        results = await Product.files(productId);
        const files = results.rows.map(
          (file) =>
            `${req.protocol}://${req.headers.host}${file.path.replace(
              "public",
              ""
            )}`
        );

        return files[0];
      }

      const productsPromise = results.rows.map(async (product) => {
        product.img = await getImage(product.id);
        product.oldPrice = formatPrice(product.old_price);
        product.price = formatPrice(product.price);

        return product;
      });

      const products = await Promise.all(productsPromise);

      const search = {
        term: req.query.filter,
        total: products.length,
      };

      let categories = products
        .map((product) => ({
          id: product.category_id,
          name: product.category_name,
        }))
        .reduce((categoriesFiltered, category) => {
          const found = categoriesFiltered.some((cat) => cat.id == category.id);

          if (!found) {
            categoriesFiltered.push(category);
          }

          return categoriesFiltered;
        }, []);

      return res.render("search/index", { products, search, categories });
    } catch (err) {
      console.error(err);
    }
  },
};
