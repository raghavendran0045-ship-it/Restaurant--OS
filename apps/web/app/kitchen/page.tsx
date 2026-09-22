"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import "./kitchen.css";

type OrderItem = {
  id: string;
  quantity: number;
  price: string;
  menuItem: {
    id: string;
    name: string;
    price: string;
  };
};

type Order = {
  id: string;
  orderNumber: string | null;
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: string;
  status: "PENDING" | "PREPARING" | "READY" | "COMPLETED";
  createdAt: string;
  items: OrderItem[];
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      const response = await api.get("/kitchen/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (err: any) {
      console.error("Failed to load kitchen orders:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to load kitchen orders.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(
    orderId: string,
    status: "PREPARING" | "READY" | "COMPLETED"
  ) {
    try {
      setUpdating(orderId);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      console.log("Updating order:", {
        orderId,
        status,
      });

      await api.patch(
        `/kitchen/orders/${orderId}/status`,
        {
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Order status updated successfully:", {
        orderId,
        status,
      });

      /*
       * The PATCH request succeeded.
       * Refresh the kitchen list separately so a refresh failure
       * does not incorrectly appear as an update failure.
       */
      try {
        await loadOrders();
      } catch (refreshError) {
        console.error("Order updated but refresh failed:", refreshError);
      }
    } catch (err: any) {
      console.error("Failed to update order status:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to update order status.";

      setError(message);
    } finally {
      setUpdating(null);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function getNextAction(order: Order) {
    if (order.status === "PENDING") {
      return (
        <button
          className="kitchen-button"
          disabled={updating === order.id}
          onClick={() => updateStatus(order.id, "PREPARING")}
        >
          {updating === order.id ? "Updating..." : "Start Preparing"}
        </button>
      );
    }

    if (order.status === "PREPARING") {
      return (
        <button
          className="kitchen-button"
          disabled={updating === order.id}
          onClick={() => updateStatus(order.id, "READY")}
        >
          {updating === order.id ? "Updating..." : "Mark Ready"}
        </button>
      );
    }

    if (order.status === "READY") {
      return (
        <button
          className="kitchen-button"
          disabled={updating === order.id}
          onClick={() => updateStatus(order.id, "COMPLETED")}
        >
          {updating === order.id ? "Updating..." : "Complete Order"}
        </button>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <main className="kitchen-page">
        <div className="kitchen-container">
          <h1>Kitchen</h1>
          <p className="kitchen-muted">Loading kitchen orders...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="kitchen-page">
      <div className="kitchen-container">
        <div className="kitchen-header">
          <div>
            <p className="kitchen-label">RESTAURANTOS</p>

            <h1>Kitchen</h1>

            <p className="kitchen-subtitle">
              Manage incoming restaurant orders.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={loadOrders}
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        {error && <div className="kitchen-error">{error}</div>}

        <div className="kitchen-summary">
          <div className="summary-card">
            <span>Active Orders</span>
            <strong>{orders.length}</strong>
          </div>

          <div className="summary-card">
            <span>Pending</span>

            <strong>
              {orders.filter((order) => order.status === "PENDING").length}
            </strong>
          </div>

          <div className="summary-card">
            <span>Preparing</span>

            <strong>
              {orders.filter((order) => order.status === "PREPARING").length}
            </strong>
          </div>

          <div className="summary-card">
            <span>Ready</span>

            <strong>
              {orders.filter((order) => order.status === "READY").length}
            </strong>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="empty-kitchen">
            <h2>No active orders</h2>

            <p>
              There are currently no orders waiting in the kitchen.
            </p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  <div>
                    <p className="order-number">
                      {order.orderNumber || "Order"}
                    </p>

                    <h2>{order.customerName || "Guest"}</h2>
                  </div>

                  <span
                    className={`status-badge status-${order.status.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="customer-info">
                  {order.customerPhone && (
                    <span>{order.customerPhone}</span>
                  )}

                  <span>
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.map((item) => (
                    <div className="order-item" key={item.id}>
                      <div>
                        <strong>
                          {item.quantity} × {item.menuItem.name}
                        </strong>
                      </div>

                      <span>
                        ₹{(Number(item.price) * item.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="order-footer">
                  <div>
                    <span>Total</span>

                    <strong>
                      ₹{Number(order.totalAmount).toFixed(0)}
                    </strong>
                  </div>

                  {getNextAction(order)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}