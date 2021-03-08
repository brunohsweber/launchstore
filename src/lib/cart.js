const { formatPrice } = require("./utils");

const Cart = {
  init(oldCart) {
    if (oldCart) {
      this.items = oldCart.items;
      this.total = oldCart.total;
    } else {
      this.items = [];
      this.total = {
        quantity: 0,
        price: 0,
        formattedPrice: formatPrice(0),
      };
    }

    return this;
  },
  addOne(product) {
    //ver se o produto já existe no carrinho
    let inCart = this.getCartItem(product.id);

    // se não existe no carrinho...
    if (!inCart) {
      inCart = {
        product: {
          ...product,
          formattedPrice: formatPrice(product.price),
        },
        quantity: 0,
        price: 0,
        formattedPrice: formatPrice(0),
      };

      // adiciona no carrinho
      this.items.push(inCart);
    }

    // se existe e quantidade excede o estoque disponível
    if (inCart.quantity >= product.quantity) return this;

    // atualiza o item do carrinho
    inCart.quantity++;
    inCart.price = inCart.product.price * inCart.quantity;
    inCart.formattedPriceTotal = formatPrice(inCart.price);

    // atualiza o carrinho
    this.total.quantity++;
    this.total.price += inCart.product.price;
    this.total.formattedPrice = formatPrice(this.total.price);

    // retorna a função
    return this;
  },
  removeOne(productId) {
    // pegar o item do carrinho
    const inCart = this.getCartItem(productId);

    // se não existe no carrinho, retorna a função
    if (!inCart) return this;

    // atualizar o item
    inCart.quantity--;
    inCart.price = inCart.product.price * inCart.quantity;
    inCart.formattedPriceTotal = formatPrice(inCart.price);

    // atualizar o carrinho
    this.total.quantity--;
    this.total.price -= inCart.product.price;
    this.total.formattedPrice = formatPrice(this.total.price);

    // se a quantidade for menor que 1, remove do carrinho
    if (inCart.quantity < 1) {
      // Método 1 para deletar
      /*
      const itemIndex = this.items.indexOf(inCart);
      this.items.splice(itemIndex, 1);
      return this;
      */

      // Método 2 para deletar
      this.items = this.items.filter(
        (item) => item.product.id != inCart.product.id
      );

      return this;
    }

    // retorna a função
    return this;
  },
  delete(productId) {
    const inCart = this.getCartItem(productId);

    if (!inCart) return this;

    if (this.items.length > 0) {
      this.total.quantity -= inCart.quantity;
      this.total.price -= inCart.product.price * inCart.quantity;
      this.total.formattedPrice = formatPrice(this.total.price);
    }

    this.items = this.items.filter(
      (item) => inCart.product.id != item.product.id
    );

    return this;
  },
  getCartItem(productId) {
    return this.items.find((item) => item.product.id == productId);
  },
};

module.exports = Cart;
