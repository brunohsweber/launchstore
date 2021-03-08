const LoadProductService = require("../services/LoadProductService");
const LoadOrderService = require("../services/LoadOrderService");

const User = require("../models/User");
const Order = require("../models/Order");

const Cart = require("../../lib/cart");
const mailer = require("../../lib/mailer");

const { formatPrice, date } = require("../../lib/utils");
const { update } = require("../models/Order");

const email = (seller, product, buyer) => `
<h2>Olá, ${seller.name}</h2>
<p>Você tem um novo pedido de compra do seu produto</p>
<p>Produto: ${product.name}</p>
<p>Qtd.: ${product.quantity}</p>
<p>Unit.: ${product.formattedPrice}</p>
<p>Total: ${product.formattedPriceTotal}</p>
<p></br></br></p>
<h3>Dados do comprador</h3>
<p>Nome: ${buyer.name}</p>
<p>Email: ${buyer.email}</p>
<p>Endereço: ${buyer.address}</p>
<p>${buyer.cep}</p>
<p></br></br></p>
<p><strong>Entre em contato com o comprador para finalizar a venda!</strong></p>
<p></br></br></p>
<p>Atenciosamente, Equipe Launchstore.</p>
`;

module.exports = {
  async index(req, res) {
    // Pegar os pedidos do usuário
    let orders = await LoadOrderService.load("orders", {
      where: { buyer_id: req.session.userId },
    });

    const getOrdersPromise = orders.map(async (order) => {
      // detalhes do produto
      order.product = await LoadProductService.load("product", {
        where: { id: order.product_id },
      });

      // detalhes do comprador
      order.buyer = await User.findOne({ where: { id: order.buyer_id } });

      // detalhes do vendedor
      order.seller = await User.findOne({ where: { id: order.seller_id } });

      // formatação de preço
      order.formattedPrice = formatPrice(order.price);
      order.formattedTotal = formatPrice(order.total);

      // formatação do status
      const statuses = {
        open: "Aberto",
        sold: "Vendido",
        canceled: "Cancelado",
      };

      order.formattedStatus = statuses[order.status];

      // formatação de atualizado em
      const updatedAt = date(order.updated_at);

      order.formattedUpdatedAt = `${order.formattedStatus} em ${updatedAt.day}/${updatedAt.month}/${updatedAt.year} às ${updatedAt.hour}h${updatedAt.minutes}`;

      return order;
    });

    orders = await Promise.all(getOrdersPromise);

    return res.render("orders/index", { orders });
  },
  async sales(req, res) {
    // Pegar as vendas do usuário
    let sales = await LoadOrderService.load("orders", {
      where: { seller_id: req.session.userId },
    });

    return res.render("orders/sales", { sales });
  },
  async show(req, res) {
    let order = await LoadOrderService.load("order", {
      where: { id: req.params.id },
    });

    return res.render("orders/details", { order });
  },
  async post(req, res) {
    try {
      // pegar os produtos do carrinho
      const cart = Cart.init(req.session.cart);

      const buyer_id = req.session.userId;

      const filteredItems = cart.items.filter(
        (item) => item.product.user_id != req.session.userId
      );

      // criar o pedido
      const createOrdersPromise = filteredItems.map(async (item) => {
        let { product, price: total, quantity } = item;
        const { price, id: product_id, user_id: seller_id } = product;
        const status = "open";

        const order = await Order.create({
          seller_id,
          buyer_id,
          product_id,
          price,
          total,
          quantity,
          status,
        });

        // Pegar os dados do produto
        product = await LoadProductService.load("product", {
          where: { id: product_id },
        });

        product = {
          ...product,
          formattedPriceTotal: formatPrice(product.price * product.quantity),
        };

        // os dados do vendedor
        const seller = await User.findOne({ where: { id: seller_id } });

        // os dados do comprador
        const buyer = await User.findOne({ where: { id: buyer_id } });

        // enviar email com dados da compra para o vendedor
        await mailer.sendMail({
          to: seller.email,
          from: "no-reply@launchstore.com.br",
          subject: `Novo pedido de compra #${order}`,
          html: email(seller, product, buyer),
        });

        return order;
      });

      await Promise.all(createOrdersPromise);

      // Clean Cart
      delete req.session.cart;
      Cart.init();

      // notificar o usuário com alguma mensagem de sucesso
      return res.render("orders/success");
    } catch (error) {
      console.error(error);
      return res.render("orders/error");
    }
  },
  async update(req, res) {
    try {
      const { id, action } = req.params;

      const acceptedActions = ["close", "cancel"];

      if (!acceptedActions.includes(action))
        return res.send("Can't do this action");

      // pegar o pedido
      const order = await Order.findOne({
        where: { id },
      });

      if (!order) return res.send("Order not found");

      // verificar se ele está aberto
      if (order.status != "open") return res.send("Can't do this action");

      // atualizar o pedido
      const statuses = {
        close: "sold",
        cancel: "canceled",
      };

      order.status = statuses[action];

      await Order.update(id, {
        status: order.status,
      });

      // redirecionar
      return res.redirect("/orders/sales");
    } catch (error) {
      console.error(error);
    }
  },
};
