const express = require("express");
const routes = express.Router();

const HomeController = require("../app/controllers/HomeController");

const users = require("./users");
const products = require("./products");
const cart = require("./cart");
const orders = require("./orders");

routes.get("/", HomeController.index);
routes.use("/products", products);
routes.use("/users", users);
routes.use("/cart", cart);
routes.use("/orders", orders);

// Alias
routes.get("/ads/create", (req, res) => res.redirect("/products/create"));
routes.get("/accounts", (req, res) => res.redirect("/users/login"));

module.exports = routes;
