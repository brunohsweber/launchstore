const Product = require("../models/Product");
const LoadProductService = require("../services/LoadProductService");
const FullTextSearchService = require("../services/FullTextSearchService");

module.exports = {
  async index(req, res) {
    try {
      let { filter, category } = req.query;

      if (!filter || filter.toLowerCase() == "toda a loja") filter = null;

      const foundProductsIds = await FullTextSearchService.search({ filter });

      let products;

      if (foundProductsIds != "") {
        products = await Product.search({
          filter: foundProductsIds,
          category,
          searchById: true,
        });

        console.log(foundProductsIds, "... Procurando por full text");
      } else {
        products = await Product.search({
          filter,
          category,
          searchById: false,
        });

        console.log(foundProductsIds, "... Procurando direto no BD");
      }

      const productsPromise = products.map(LoadProductService.format);

      products = await Promise.all(productsPromise);

      const search = {
        term: filter || "Toda a loja",
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
