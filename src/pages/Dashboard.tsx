import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, onValue, update, remove } from "firebase/database";
import type { CartItem } from "../types";
import type { User } from "firebase/auth";
import { ITEM_PRICES } from "../constants";
import "./Dashboard.css";

const FIXED_EMAIL = "smartcart@test.com";
const FIXED_PASSWORD = "12345678";

export default function Dashboard() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Auto-authenticate on mount
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      }
    });

    const fallbackToAnonymous = async (error: any) => {
      try {
        await signInAnonymously(auth);
      } catch (anonErr: any) {
        setAuthError(error?.message || anonErr?.message || "Auth failed");
        setLoading(false);
      }
    };

    const initAuth = async () => {
      if (auth.currentUser) return;

      try {
        await signInWithEmailAndPassword(auth, FIXED_EMAIL, FIXED_PASSWORD);
      } catch (err: any) {
        if (err.code === "auth/user-not-found") {
          try {
            await createUserWithEmailAndPassword(auth, FIXED_EMAIL, FIXED_PASSWORD);
          } catch (createErr: any) {
            await fallbackToAnonymous(createErr);
          }
        } else {
          await fallbackToAnonymous(err);
        }
      }
    };

    initAuth();

    return () => unsubAuth();
  }, []);


  // Listen to cart data once authenticated
  useEffect(() => {
    if (!user) return;

    const cartRef = ref(db, `cart`);
    const unsub = onValue(cartRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed: CartItem[] = Object.entries(data).map(
          ([key, val]: [string, any]) => ({
            id: key,
            name: val.product || "Unknown Item",
            quantity: val.quantity || 1,
            price: ITEM_PRICES[val.product] || 50,
          })
        );
        setItems(parsed);
      } else {
        setItems([]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleQuantityChange = async (item: CartItem, delta: number) => {
    const user = auth.currentUser;
    if (!user) return;
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      await remove(ref(db, `cart/${item.id}`));
    } else {
      await update(ref(db, `cart/${item.id}`), {
        quantity: newQty,
      });
    }
  };

  const handleRemoveItem = async (item: CartItem) => {
    const user = auth.currentUser;
    if (!user) return;
    await remove(ref(db, `cart/${item.id}`));
  };

  if (authError) {
    return (
      <div className="dashboard-page">
        <div className="dash-bg">
          <div className="dash-bg-circle dash-bg-circle--1"></div>
          <div className="dash-bg-circle dash-bg-circle--2"></div>
        </div>
        <div className="dash-auth-error">
          <h2>Connection Error</h2>
          <p>{authError}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Background */}
      <div className="dash-bg">
        <div className="dash-bg-circle dash-bg-circle--1"></div>
        <div className="dash-bg-circle dash-bg-circle--2"></div>
      </div>

      {/* Navbar */}
      <nav className="dash-nav">
        <div className="dash-nav-inner">
          <div className="dash-nav-brand">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#nav-grad)" />
              <path
                d="M14 20h20M14 28h20M18 16v16M30 16v16"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="24" cy="36" r="2" fill="#fff" />
              <defs>
                <linearGradient id="nav-grad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="dash-nav-title">SmartCart</span>
          </div>
          <div className="dash-nav-right">
            <span className="dash-nav-status">
              <span className="dash-status-dot"></span>
              ESP32 Connected
            </span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dash-main">
        {/* Stats Header */}
        <div className="dash-stats">
          <div className="dash-stat-card">
            <div className="dash-stat-icon dash-stat-icon--items">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 01-8 0" />
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">{items.length}</span>
              <span className="dash-stat-label">Items in Cart</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon dash-stat-icon--qty">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <path d="M16 8h4a2 2 0 012 2v9a2 2 0 01-2 2H8a2 2 0 01-2-2v-4" />
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">
                {items.reduce((s, i) => s + i.quantity, 0)}
              </span>
              <span className="dash-stat-label">Total Quantity</span>
            </div>
          </div>
          <div className="dash-stat-card">
            <div className="dash-stat-icon dash-stat-icon--total">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <div className="dash-stat-info">
              <span className="dash-stat-value">₹{totalPrice.toFixed(2)}</span>
              <span className="dash-stat-label">Total Price</span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="dash-table-card">
          <div className="dash-table-header">
            <h2>Shopping Cart</h2>
            <div className="dash-table-badge">
              <span className="dash-badge-dot"></span>
              Live — Realtime Updates
            </div>
          </div>

          {loading ? (
            <div className="dash-loading">
              <div className="dash-loading-spinner"></div>
              <p>Connecting to SmartCart…</p>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Price (₹)</th>
                    <th>Subtotal (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="dash-empty">
                        <div className="dash-empty-inner">
                          <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#4b5563" strokeWidth="1.5">
                            <rect x="8" y="12" width="48" height="40" rx="4" />
                            <line x1="8" y1="24" x2="56" y2="24" />
                            <line x1="24" y1="12" x2="24" y2="52" strokeDasharray="4 3" />
                            <line x1="40" y1="12" x2="40" y2="52" strokeDasharray="4 3" />
                            <line x1="8" y1="36" x2="56" y2="36" strokeDasharray="4 3" />
                          </svg>
                          <h3>Cart is Empty</h3>
                          <p>Scan products using RFID tags to add items here</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.id} className="dash-row">
                        <td className="dash-cell-sno">{idx + 1}</td>
                        <td className="dash-cell-item">
                          <span className="dash-item-name">{item.name}</span>
                        </td>
                        <td className="dash-cell-qty">
                          <div className="dash-qty-controls">
                            <button
                              className="dash-qty-btn dash-qty-btn--minus"
                              onClick={() => handleQuantityChange(item, -1)}
                              title="Decrease quantity"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="3" y1="7" x2="11" y2="7" />
                              </svg>
                            </button>
                            <span className="dash-qty-value">{item.quantity}</span>
                            <button
                              className="dash-qty-btn dash-qty-btn--plus"
                              onClick={() => handleQuantityChange(item, 1)}
                              title="Increase quantity"
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="7" y1="3" x2="7" y2="11" />
                                <line x1="3" y1="7" x2="11" y2="7" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="dash-cell-price">₹{item.price.toFixed(2)}</td>
                        <td className="dash-cell-subtotal">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                        <td className="dash-cell-actions">
                          <button
                            className="dash-remove-btn"
                            onClick={() => handleRemoveItem(item)}
                            title="Remove item"
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                              <path d="M2 4h12" />
                              <path d="M5.33 4V2.67a1.33 1.33 0 011.34-1.34h2.66a1.33 1.33 0 011.34 1.34V4" />
                              <path d="M12.67 4v9.33a1.33 1.33 0 01-1.34 1.34H4.67a1.33 1.33 0 01-1.34-1.34V4" />
                              <line x1="6.67" y1="7.33" x2="6.67" y2="11.33" />
                              <line x1="9.33" y1="7.33" x2="9.33" y2="11.33" />
                            </svg>
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr className="dash-total-row">
                      <td colSpan={4} className="dash-total-label">
                        Grand Total
                      </td>
                      <td className="dash-total-value">
                        ₹{totalPrice.toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
          
          {items.length > 0 && !loading && (
            <div className="dash-table-footer">
              <button 
                className="dash-checkout-btn"
                onClick={() => navigate("/payment")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  <path d="M9 14l2 2 4-4"></path>
                </svg>
                Proceed to Checkout
              </button>
            </div>
          )}
        </div>

        {/* Info banner */}
        <div className="dash-info-banner">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="10" cy="10" r="8" />
            <line x1="10" y1="6" x2="10" y2="10" />
            <circle cx="10" cy="13.5" r="0.5" fill="currentColor" />
          </svg>
          <p>
            Items are automatically added when RFID tags are scanned via the ESP32 module.
            Use the <strong>+</strong> and <strong>−</strong> buttons to adjust quantities, or <strong>Remove</strong> to delete items.
          </p>
        </div>
      </main>
    </div>
  );
}
