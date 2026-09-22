"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "../../lib/api";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  imageUrl?: string | null;
};

type Category = {
  id: string;
  name: string;
  menuItems: MenuItem[];
};

type RestaurantMenu = {
  restaurant: {
    id: string;
    name: string;
  };
  categories: Category[];
};

type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

export default function CustomerMenuPage() {
  const params = useParams();

  const restaurantId = params.restaurantId as string;

  const [menu, setMenu] = useState<RestaurantMenu | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/public/restaurants/${restaurantId}/menu`
        );

        setMenu(response.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load restaurant menu.");
      } finally {
        setLoading(false);
      }
    }

    if (restaurantId) {
      loadMenu();
    }
  }, [restaurantId]);

  const visibleCategories = useMemo(() => {
    if (!menu) {
      return [];
    }

    if (selectedCategory === "all") {
      return menu.categories;
    }

    return menu.categories.filter(
      (category) => category.id === selectedCategory
    );
  }, [menu, selectedCategory]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      return total + Number(item.menuItem.price) * item.quantity;
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  function addToCart(menuItem: MenuItem) {
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.menuItem.id === menuItem.id
      );

      if (existing) {
        return currentCart.map((item) =>
          item.menuItem.id === menuItem.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          menuItem,
          quantity: 1,
        },
      ];
    });
  }

  function decreaseQuantity(menuItemId: string) {
    setCart((currentCart) => {
      return currentCart
        .map((item) =>
          item.menuItem.id === menuItemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0);
    });
  }

  function increaseQuantity(menuItemId: string) {
    setCart((currentCart) => {
      return currentCart.map((item) =>
        item.menuItem.id === menuItemId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    });
  }

  async function placeOrder() {
    if (cart.length === 0) {
      setError("Please add at least one item to your cart.");
      return;
    }

    if (customerName.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }

    if (customerPhone.trim().length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    try {
      setPlacingOrder(true);
      setError("");
      setSuccess("");

      const response = await api.post("/public/orders", {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map((item) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
        })),
      });

      const orderNumber = response.data.orderNumber;

      setSuccess(
        `Order placed successfully! Your order number is ${orderNumber}.`
      );

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error(err);
      setError("Unable to place order. Please try again.");
    } finally {
      setPlacingOrder(false);
    }
  }

  if (loading) {
    return (
      <main className="customer-menu-page">
        <div className="customer-menu-loading">
          Loading menu...
        </div>
      </main>
    );
  }

  if (error && !menu) {
    return (
      <main className="customer-menu-page">
        <div className="customer-menu-error">
          <h1>RestaurantOS</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!menu) {
    return null;
  }

  return (
    <main className="customer-menu-page">
      <header className="customer-menu-header">
        <div>
          <p className="customer-menu-label">RESTAURANTOS</p>

          <h1>{menu.restaurant.name}</h1>

          <p>
            Browse our menu and place your order.
          </p>
        </div>

        <div className="customer-cart-badge">
          🛒 {cartCount}
        </div>
      </header>

      {success && (
        <div className="customer-success">
          <strong>Order Confirmed</strong>
          <p>{success}</p>
        </div>
      )}

      {error && (
        <div className="customer-error">
          {error}
        </div>
      )}

      <section className="customer-category-bar">
        <button
          type="button"
          className={
            selectedCategory === "all"
              ? "customer-category active"
              : "customer-category"
          }
          onClick={() => setSelectedCategory("all")}
        >
          All
        </button>

        {menu.categories.map((category) => (
          <button
            type="button"
            key={category.id}
            className={
              selectedCategory === category.id
                ? "customer-category active"
                : "customer-category"
            }
            onClick={() =>
              setSelectedCategory(category.id)
            }
          >
            {category.name}
          </button>
        ))}
      </section>

      <section className="customer-menu-layout">
        <div className="customer-food-area">
          {visibleCategories.map((category) => (
            <div
              key={category.id}
              className="customer-category-section"
            >
              <div className="customer-section-title">
                <h2>{category.name}</h2>

                <span>
                  {category.menuItems.length} items
                </span>
              </div>

              <div className="customer-food-grid">
                {category.menuItems.map((item) => {
                  const cartItem = cart.find(
                    (cartEntry) =>
                      cartEntry.menuItem.id === item.id
                  );

                  return (
                    <article
                      className="customer-food-card"
                      key={item.id}
                    >
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="customer-food-image"
                        />
                      ) : (
                        <div className="customer-food-placeholder">
                          🍽️
                        </div>
                      )}

                      <div className="customer-food-content">
                        <div className="customer-food-heading">
                          <h3>{item.name}</h3>

                          <strong>
                            ₹{Number(item.price).toFixed(0)}
                          </strong>
                        </div>

                        {item.description && (
                          <p>{item.description}</p>
                        )}

                        {!cartItem ? (
                          <button
                            type="button"
                            className="customer-add-button"
                            onClick={() => addToCart(item)}
                          >
                            + Add
                          </button>
                        ) : (
                          <div className="customer-quantity">
                            <button
                              type="button"
                              onClick={() =>
                                decreaseQuantity(item.id)
                              }
                            >
                              −
                            </button>

                            <span>
                              {cartItem.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                increaseQuantity(item.id)
                              }
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <aside className="customer-cart">
          <div className="customer-cart-header">
            <div>
              <h2>Your Order</h2>
              <p>{cartCount} items</p>
            </div>

            <span>₹{cartTotal.toFixed(0)}</span>
          </div>

          {cart.length === 0 ? (
            <div className="customer-empty-cart">
              <div>🛒</div>
              <h3>Your cart is empty</h3>
              <p>
                Add delicious items from the menu.
              </p>
            </div>
          ) : (
            <>
              <div className="customer-cart-items">
                {cart.map((item) => (
                  <div
                    className="customer-cart-item"
                    key={item.menuItem.id}
                  >
                    <div>
                      <strong>
                        {item.menuItem.name}
                      </strong>

                      <p>
                        ₹
                        {(
                          Number(item.menuItem.price) *
                          item.quantity
                        ).toFixed(0)}
                      </p>
                    </div>

                    <div className="customer-cart-controls">
                      <button
                        type="button"
                        onClick={() =>
                          decreaseQuantity(
                            item.menuItem.id
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        onClick={() =>
                          increaseQuantity(
                            item.menuItem.id
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="customer-checkout">
                <h3>Customer Details</h3>

                <input
                  type="text"
                  placeholder="Your name"
                  value={customerName}
                  onChange={(event) =>
                    setCustomerName(event.target.value)
                  }
                />

                <input
                  type="tel"
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={(event) =>
                    setCustomerPhone(event.target.value)
                  }
                />

                <div className="customer-total">
                  <span>Total</span>
                  <strong>
                    ₹{cartTotal.toFixed(0)}
                  </strong>
                </div>

                <button
                  type="button"
                  className="customer-place-order"
                  onClick={placeOrder}
                  disabled={placingOrder}
                >
                  {placingOrder
                    ? "Placing Order..."
                    : `Place Order • ₹${cartTotal.toFixed(0)}`}
                </button>
              </div>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}