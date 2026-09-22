"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import FloatingFood from "./components/FloatingFood";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.accessToken);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="restaurant-login">

      <FloatingFood />

      <div className="login-background-glow glow-one" />
      <div className="login-background-glow glow-two" />
      <div className="login-background-glow glow-three" />

      <div className="login-overlay" />

      {/* TOP BAR */}

      <header className="restaurant-header">

        <div className="restaurant-brand">

          <div className="brand-logo">
            <span>R</span>
          </div>

          <div>
            <div className="brand-title">
              Restaurant<span>OS</span>
            </div>

            <div className="brand-subtitle">
              Restaurant Management System
            </div>
          </div>

        </div>

        <div className="system-status">
          <span className="status-dot" />

          <div>
            <span>System Status</span>
            <strong>All Systems Operational</strong>
          </div>
        </div>

      </header>

      {/* MAIN CONTENT */}

      <section className="login-content">

        {/* LEFT HERO */}

        <div className="marketing-content">

          <div className="marketing-badge">
            <span>✦</span>
            ALL-IN-ONE PLATFORM
          </div>

          <h1>
            Run Your Restaurant
            <br />
            Like a <span>Pro.</span>
          </h1>

          <p className="marketing-description">
            Manage orders, boost kitchen efficiency, and grow
            your business with real-time insights.
          </p>

          <div className="feature-cards">

            <div className="feature-card feature-orange">
              <div className="feature-icon">
                ◈
              </div>

              <div>
                <h3>Real-time Orders</h3>
                <p>Never miss an order again.</p>
              </div>
            </div>

            <div className="feature-card feature-purple">
              <div className="feature-icon">
                ♨
              </div>

              <div>
                <h3>Smart Kitchen Display</h3>
                <p>Keep your kitchen organized.</p>
              </div>
            </div>

            <div className="feature-card feature-green">
              <div className="feature-icon">
                ▣
              </div>

              <div>
                <h3>Business Analytics</h3>
                <p>Data-driven decisions that grow profits.</p>
              </div>
            </div>

            <div className="feature-card feature-blue">
              <div className="feature-icon">
                ♙
              </div>

              <div>
                <h3>Staff Management</h3>
                <p>Manage your team with ease.</p>
              </div>
            </div>

          </div>

          <div className="hero-security">
            <span>♙</span>
            Secure. Reliable. Built for Restaurants.
          </div>

        </div>

        {/* LOGIN PANEL */}

        <div className="login-panel-wrapper">

          <div className="login-panel">

            <div className="login-panel-border" />

            <div className="login-panel-glow" />

            <div className="login-logo">
              <span>R</span>
            </div>

            <div className="login-heading">
              <h2>
                Welcome Back! <span>👋</span>
              </h2>

              <p>
                Sign in to continue to your dashboard
              </p>
            </div>

            <form onSubmit={handleLogin}>

              <div className="field">

                <label htmlFor="email">
                  Email Address
                </label>

                <div className="field-input">

                  <span className="field-icon">
                    ✉
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@restaurant.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                  />

                </div>

              </div>

              <div className="field">

                <label htmlFor="password">
                  Password
                </label>

                <div className="field-input">

                  <span className="field-icon">
                    ♙
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

              </div>

              <div className="login-options">

                <label className="remember">

                  <input
                    type="checkbox"
                    defaultChecked
                  />

                  <span className="custom-checkbox" />

                  Remember me

                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Forgot password?
                </button>

              </div>

              {error && (
                <div className="login-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="sign-in-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="login-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <strong>→</strong>
                  </>
                )}

              </button>

            </form>

            <div className="login-divider">
              <span />
              <p>or continue with</p>
              <span />
            </div>

            <button
              type="button"
              className="social-button"
            >
              <span className="google-icon">
                G
              </span>

              Continue with Google
            </button>

            <div className="security-message">
              <span>♙</span>
              Your data is secure and encrypted
            </div>

          </div>

        </div>

      </section>

      {/* BOTTOM NAVIGATION */}

      <nav className="bottom-navigation">

        <div>
          <span>♧</span>
          <section>
            <strong>Online Orders</strong>
            <small>Grow your revenue</small>
          </section>
        </div>

        <i />

        <div>
          <span>▣</span>
          <section>
            <strong>Menu Management</strong>
            <small>Update in real-time</small>
          </section>
        </div>

        <i />

        <div>
          <span>♨</span>
          <section>
            <strong>Kitchen Display</strong>
            <small>Smart order routing</small>
          </section>
        </div>

        <i />

        <div>
          <span>♙</span>
          <section>
            <strong>Staff Management</strong>
            <small>Team & permissions</small>
          </section>
        </div>

        <i />

        <div>
          <span>▥</span>
          <section>
            <strong>Sales Reports</strong>
            <small>Insights & analytics</small>
          </section>
        </div>

        <i />

        <div>
          <span>☆</span>
          <section>
            <strong>Customer Feedback</strong>
            <small>Improve experience</small>
          </section>
        </div>

      </nav>

    </main>
  );
}
