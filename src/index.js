$(function () {
  //#region -- Model

  const ProductModel = Backbone.Model.extend({
    defaults: {
      title: "",
      image: "",
      price: "",
      id: "",
    },
  });

  const ProductCartModel = Backbone.Model.extend({
    defaults: {
      title: "",
      image: "",
      price: "",
      amount: "",
      id: "",
    },
  });

  //#endregion -- Model

  //#region -- View

  const ProductView = Backbone.View.extend({
    tagName: "article",
    template: _.template($("#product-template").html()),
    className: "product-item",
    container: $("#products-list"),
    events: {
      click: "addItemToCart",
    },

    initialize: function () {
      this.render = this.render.bind(this);
      this.shopCurrencyChange = this.shopCurrencyChange.bind(this);

      this.model.on("change", this.render);

      $(document).on("shop-currency-change", this.shopCurrencyChange);

      this.render();
    },

    render: function () {
      this.appendElementToContainerIfNecessary();

      this.$el.attr("id", "product-" + this.model.get("id"));
      this.$el.html(this.template(this.model.attributes));
      return this;
    },

    appendElementToContainerIfNecessary: function () {
      if (this.container.find(this.$el).length === 0) {
        this.container.append(this.$el);
      }
    },

    addItemToCart: function () {
      const cartItem = window.cartCollection.get(this.model.get("id"));
      if (cartItem) {
        cartItem.set("amount", cartItem.get("amount") + 1);
        return;
      }

      const newAttrs = _.clone(this.model.attributes);
      newAttrs.amount = 1;

      const cartModel = new ProductCartModel(newAttrs);
      window.cartCollection.add(cartModel);
      new CartItemView({ model: cartModel });
    },

    shopCurrencyChange: function () {
      this.render();
    },
  });

  const CartItemView = Backbone.View.extend({
    tagName: "article",
    template: _.template($("#product-cart-template").html()),
    className: "product-cart-item",
    container: $("#products-cart"),
    events: {
      "click .product-cart-remove-btn": "removeItemFromCart",
    },

    initialize: function () {
      this.render = this.render.bind(this);
      this.shopCurrencyChange = this.shopCurrencyChange.bind(this);
      this.removeItemFromCart = this.removeItemFromCart.bind(this);

      this.model.on("change", this.render);
      $(document).on("shop-currency-change", this.shopCurrencyChange);

      this.render();
    },

    render: function () {
      this.appendElementToContainerIfNecessary();

      this.$el.attr("id", "product-" + this.model.get("id"));
      this.$el.html(this.template(this.model.attributes));
      return this;
    },

    appendElementToContainerIfNecessary: function () {
      if (this.container.find(this.$el).length === 0) {
        this.container.append(this.$el);
      }
    },

    shopCurrencyChange: function () {
      this.render();
    },

    removeItemFromCart: function () {
      window.cartCollection.remove(this.model.get("id"));
      this.model.trigger("destroy", this.model);
      this.completelyDestroy();
    },

    completelyDestroy: function () {
      $(document).off("shop-currency-change", this.shopCurrencyChange);
      this.undelegateEvents();
      this.$el.removeData().unbind();

      // Remove view from DOM
      this.remove();
      // Remove View
      Backbone.View.prototype.remove.call(this);
    },
  });

  //#endregion -- View

  //#region -- Collection

  const ProductsCollection = Backbone.Collection.extend({
    model: ProductModel,
  });

  const CartCollection = Backbone.Collection.extend({
    model: ProductModel,
  });

  window.cartCollection = new CartCollection();
  window.productsCollection = new ProductsCollection();

  //#endregion -- Collection

  //#region -- Manage Price

  window.displayPrice = function (price) {
    let priceCurrency = "USD";
    if (window.currentCurrency) {
      priceCurrency = window.currentCurrency;
    }

    console.log(priceCurrency);

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: priceCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(price);
  };

  $(".select-currency-btn").on("click", function () {
    window.currentCurrency = $(this).attr("data-currency-id");
    console.log(window.currentCurrency);
    $(document).trigger("shop-currency-change");
  });

  //#endregion -- Manage Price

  fetch("https://fakestoreapi.com/products")
    .then((response) => response.json())
    .then((data) => {
      if (!Array.isArray(data)) {
        return;
      }

      data.map((item) => {
        itemModel = new ProductModel({
          id: item.id,
          title: item.title,
          image: item.image,
          price: item.price,
        });

        itemView = new ProductView({
          model: itemModel,
        });

        return itemModel;
      });

      window.productsCollection.add(data);
      console.dir(window.productsCollection);
    });
});
