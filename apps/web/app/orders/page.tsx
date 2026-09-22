"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import "./orders.css";

type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

type MenuItem = {
  id: string;
  name: string;
  price: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: string;
  menuItem: MenuItem;
};

type Order = {
  id: string;
  orderNumber: string | null;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
};

type Filter = "ALL" | OrderStatus;

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  async function loadOrders() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await api.get("/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders);
    } catch (error) {
      console.error("Failed to load orders:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(
    orderId: string,
    status: OrderStatus
  ) {
    try {
      setUpdating(orderId);

      const token = localStorage.getItem("token");

      await api.patch(
        `/orders/${orderId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await loadOrders();
    } catch (error) {
      console.error("Failed to update order:", error);
      alert("Failed to update order");
    } finally {
      setUpdating(null);
    }
  }

  function getStatusClass(status: OrderStatus) {
    return `status status-${status.toLowerCase()}`;
  }

  function getNextAction(order: Order) {
    if (order.status === "PENDING") {
      return (
        <button
          className="action-button primary"
          disabled={updating === order.id}
          onClick={() =>
            updateStatus(order.id, "PREPARING")
          }
        >
          {updating === order.id
            ? "Updating..."
            : "Start Preparing"}
        </button>
      );
    }

    if (order.status === "PREPARING") {
      return (
        <button
          className="action-button ready"
          disabled={updating === order.id}
          onClick={() =>
            updateStatus(order.id, "READY")
          }
        >
          {updating === order.id
            ? "Updating..."
            : "Mark Ready"}
        </button>
      );
    }

    if (order.status === "READY") {
      return (
        <button
          className="action-button complete"
          disabled={updating === order.id}
          onClick={() =>
            updateStatus(order.id, "COMPLETED")
          }
        >
          {updating === order.id
            ? "Updating..."
            : "Complete Order"}
        </button>
      );
    }

    if (order.status === "COMPLETED") {
      return (
        <span className="completed-label">
          ✓ Completed
        </span>
      );
    }

    return null;
  }

  const filteredOrders =
    filter === "ALL"
      ? orders
      : orders.filter(
          (order) => order.status === filter
        );

  return (
    <main className="orders-page">

      <header className="orders-header">

        <div>
          <div className="brand">
            RESTAURANTOS
          </div>

          <h1>Orders</h1>

          <p>
            Manage incoming orders and track their
            progress.
          </p>
        </div>

        <div className="header-actions">
          <Link
            href="/dashboard"
            className="dashboard-link"
          >
            Dashboard
          </Link>

          <button
            className="logout-button"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>

      </header>

      <section className="filters">

        <button
          className={
            filter === "ALL"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("ALL")}
        >
          All Orders
          <span>{orders.length}</span>
        </button>

        <button
          className={
            filter === "PENDING"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("PENDING")}
        >
          Pending
          <span>
            {
              orders.filter(
                (o) => o.status === "PENDING"
              ).length
            }
          </span>
        </button>

        <button
          className={
            filter === "PREPARING"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("PREPARING")}
        >
          Preparing
          <span>
            {
              orders.filter(
                (o) => o.status === "PREPARING"
              ).length
            }
          </span>
        </button>

        <button
          className={
            filter === "READY"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("READY")}
        >
          Ready
          <span>
            {
              orders.filter(
                (o) => o.status === "READY"
              ).length
            }
          </span>
        </button>

        <button
          className={
            filter === "COMPLETED"
              ? "filter-button active"
              : "filter-button"
          }
          onClick={() => setFilter("COMPLETED")}
        >
          Completed
          <span>
            {
              orders.filter(
                (o) => o.status === "COMPLETED"
              ).length
            }
          </span>
        </button>

      </section>

      {loading ? (
        <div className="loading">
          Loading orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧾</div>
          <h2>No orders found</h2>
          <p>
            There are no orders in this category.
          </p>
        </div>
      ) : (
        <section className="orders-grid">

          {filteredOrders.map((order) => (

            <article
              className="order-card"
              key={order.id}
            >

              <div className="order-top">

                <div>
                  <div className="order-number">
                    {order.orderNumber ||
                      `Order ${order.id.slice(-6)}`}
                  </div>

                  <div className="order-time">
                    {new Date(
                      order.createdAt
                    ).toLocaleString()}
                  </div>
                </div>

                <span
                  className={getStatusClass(
                    order.status
                  )}
                >
                  {order.status}
                </span>

              </div>

              <div className="customer">

                <div className="customer-icon">
                  👤
                </div>

                <div>
                  <strong>
                    {order.customerName}
                  </strong>

                  <span>
                    {order.customerPhone}
                  </span>
                </div>

              </div>

              <div className="items">

                <h3>Order Items</h3>

                {order.items.map((item) => (

                  <div
                    className="item"
                    key={item.id}
                  >

                    <div>
                      <span className="quantity">
                        {item.quantity} ×
                      </span>

                      <span>
                        {item.menuItem.name}
                      </span>
                    </div>

                    <strong>
                      ₹
                      {Number(item.price) *
                        item.quantity}
                    </strong>

                  </div>

                ))}

              </div>

              <div className="order-bottom">

                <div>
                  <span>Total</span>

                  <strong>
                    ₹{Number(order.totalAmount)}
                  </strong>
                </div>

                {getNextAction(order)}

              </div>

            </article>

          ))}

        </section>
      )}

    </main>
  );
}