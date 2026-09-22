"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";

type DashboardData = {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
};

type OrderStatusData = {
  PENDING: number;
  PREPARING: number;
  READY: number;
  COMPLETED: number;
  CANCELLED: number;
};

type TopSellingItem = {
  name: string;
  quantity: number;
};

type TopSellingData = {
  topSellingItems: TopSellingItem[];
};

type SalesData = {
  todaySales: number;
  weeklySales: number;
  monthlySales: number;
};

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
  customerName: string | null;
  customerPhone: string | null;
  totalAmount: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type RecentOrdersResponse = {
  orders: Order[];
};

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusClass(status: string) {
  switch (status) {
    case "PENDING":
      return "status-pending";
    case "PREPARING":
      return "status-preparing";
    case "READY":
      return "status-ready";
    case "COMPLETED":
      return "status-completed";
    case "CANCELLED":
      return "status-cancelled";
    default:
      return "status-pending";
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<DashboardData | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderStatus, setOrderStatus] =
    useState<OrderStatusData | null>(null);
  const [topSelling, setTopSelling] =
    useState<TopSellingData | null>(null);
  const [sales, setSales] = useState<SalesData | null>(null);

  const [error, setError] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [
          summaryResponse,
          ordersResponse,
          statusResponse,
          topSellingResponse,
          salesResponse,
        ] = await Promise.all([
          api.get<DashboardData>("/dashboard/summary", {
            headers,
          }),

          api.get<RecentOrdersResponse>(
            "/dashboard/recent-orders",
            {
              headers,
            }
          ),

          api.get<OrderStatusData>(
            "/dashboard/order-status",
            {
              headers,
            }
          ),

          api.get<TopSellingData>(
            "/dashboard/top-selling",
            {
              headers,
            }
          ),

          api.get<SalesData>(
            "/dashboard/sales",
            {
              headers,
            }
          ),
        ]);

        setData(summaryResponse.data);
        setOrders(ordersResponse.data.orders);
        setOrderStatus(statusResponse.data);
        setTopSelling(topSellingResponse.data);
        setSales(salesResponse.data);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard.");
      } finally {
        setLoadingOrders(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("token");
    router.replace("/login");
  }

  if (error) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-error">
          <h2>RestaurantOS</h2>
          <p>{error}</p>

          <button
            type="button"
            onClick={() => router.replace("/login")}
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  if (!data || !orderStatus || !topSelling || !sales) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-loading">
          Loading Dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-label">
            RESTAURANTOS
          </p>

          <h1>Dashboard</h1>

          <p className="dashboard-subtitle">
            Overview of your restaurant orders and revenue.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button
            type="button"
            className="dashboard-nav-button"
            onClick={() => router.push("/orders")}
          >
            Orders
          </button>

          <button
            type="button"
            className="dashboard-nav-button"
            onClick={() => router.push("/kitchen")}
          >
            Kitchen
          </button>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {/* =========================
          MAIN STATS
         ========================= */}

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">
              Total Orders
            </span>

            <span className="stat-icon">
              {"\u{1F9FE}"}
            </span>
          </div>

          <p className="stat-value">
            {data.totalOrders}
          </p>

          <p className="stat-description">
            All orders received
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">
              Completed Orders
            </span>

            <span className="stat-icon">
              {"\u2713"}
            </span>
          </div>

          <p className="stat-value">
            {data.completedOrders}
          </p>

          <p className="stat-description">
            Successfully completed
          </p>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-title">
              Pending Orders
            </span>

            <span className="stat-icon">
              {"\u23F3"}
            </span>
          </div>

          <p className="stat-value">
            {data.pendingOrders}
          </p>

          <p className="stat-description">
            Need attention
          </p>
        </div>

        <div className="stat-card revenue-card">
          <div className="stat-card-top">
            <span className="stat-title">
              Total Revenue
            </span>

            <span className="stat-icon">
              {"\u20B9"}
            </span>
          </div>

          <p className="stat-value">
            {"\u20B9"} {data.totalRevenue}
          </p>

          <p className="stat-description">
            Revenue from completed orders
          </p>
        </div>
      </section>

      {/* =========================
          SALES ANALYTICS
         ========================= */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Sales Analytics</h2>

            <p>
              Completed-order sales performance.
            </p>
          </div>
        </div>

        <div className="sales-grid">
          <div className="sales-card">
            <span>Today</span>

            <strong>
              {"\u20B9"} {sales.todaySales}
            </strong>

            <p>Today's completed sales</p>
          </div>

          <div className="sales-card">
            <span>This Week</span>

            <strong>
              {"\u20B9"} {sales.weeklySales}
            </strong>

            <p>This week's completed sales</p>
          </div>

          <div className="sales-card">
            <span>This Month</span>

            <strong>
              {"\u20B9"} {sales.monthlySales}
            </strong>

            <p>This month's completed sales</p>
          </div>
        </div>
      </section>

      {/* =========================
          ORDER STATUS + TOP SELLING
         ========================= */}

      <section className="analytics-grid">
        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Order Status</h2>

              <p>
                Current order distribution.
              </p>
            </div>
          </div>

          <div className="status-analytics">
            <div className="status-analytics-row">
              <span className="status-label">
                Pending
              </span>

              <strong>{orderStatus.PENDING}</strong>
            </div>

            <div className="status-analytics-row">
              <span className="status-label">
                Preparing
              </span>

              <strong>{orderStatus.PREPARING}</strong>
            </div>

            <div className="status-analytics-row">
              <span className="status-label">
                Ready
              </span>

              <strong>{orderStatus.READY}</strong>
            </div>

            <div className="status-analytics-row">
              <span className="status-label">
                Completed
              </span>

              <strong>{orderStatus.COMPLETED}</strong>
            </div>

            <div className="status-analytics-row">
              <span className="status-label">
                Cancelled
              </span>

              <strong>{orderStatus.CANCELLED}</strong>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <div className="section-header">
            <div>
              <h2>Top Selling Items</h2>

              <p>
                Best-selling menu items by quantity.
              </p>
            </div>
          </div>

          {topSelling.topSellingItems.length === 0 ? (
            <div className="empty-orders">
              <h3>No sales yet</h3>

              <p>
                Completed order items will appear here.
              </p>
            </div>
          ) : (
            <div className="top-selling-list">
              {topSelling.topSellingItems.map(
                (item, index) => (
                  <div
                    className="top-selling-row"
                    key={item.name}
                  >
                    <span className="top-selling-rank">
                      {index + 1}
                    </span>

                    <div className="top-selling-name">
                      <strong>{item.name}</strong>

                      <span>
                        {item.quantity} sold
                      </span>
                    </div>

                    <strong>
                      {item.quantity}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================
          RECENT ORDERS
         ========================= */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Recent Orders</h2>

            <p>
              Latest orders received by your restaurant.
            </p>
          </div>

          <button
            type="button"
            className="view-all-button"
            onClick={() => router.push("/orders")}
          >
            View All
          </button>
        </div>

        {loadingOrders ? (
          <div className="dashboard-loading">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-orders">
            <h3>No orders yet</h3>

            <p>
              Orders placed by customers will appear here.
            </p>
          </div>
        ) : (
          <div className="orders-table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>
                        {order.orderNumber ??
                          `#${order.id.slice(-6)}`}
                      </strong>
                    </td>

                    <td>
                      <div className="customer-cell">
                        <strong>
                          {order.customerName ??
                            "Guest"}
                        </strong>

                        {order.customerPhone && (
                          <span>
                            {order.customerPhone}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="order-items">
                        {order.items.map((item) => (
                          <span key={item.id}>
                            {item.menuItem.name} ×{" "}
                            {item.quantity}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td>
                      <strong>
                        {"\u20B9"}{" "}
                        {Number(
                          order.totalAmount
                        ).toFixed(0)}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`order-status ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>

                    <td>
                      <span className="order-date">
                        {formatDate(order.createdAt)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =========================
          QUICK OVERVIEW
         ========================= */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Quick Overview</h2>

            <p>
              Keep track of your restaurant activity.
            </p>
          </div>
        </div>

        <div className="overview-grid">
          <div className="overview-card">
            <span className="overview-number">
              {data.pendingOrders}
            </span>

            <div>
              <h3>Orders waiting</h3>

              <p>
                Check the kitchen to process pending
                orders.
              </p>
            </div>
          </div>

          <div className="overview-card">
            <span className="overview-number">
              {data.completedOrders}
            </span>

            <div>
              <h3>Orders completed</h3>

              <p>
                Orders successfully delivered to
                customers.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}