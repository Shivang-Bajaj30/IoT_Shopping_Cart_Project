import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { ref, onValue } from "firebase/database";
import { ITEM_PRICES } from "../constants";
import { CreditCard, Smartphone, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
import "./Payment.css";

export default function Payment() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "upi">("card");
  const navigate = useNavigate();

  useEffect(() => {
    const cartRef = ref(db, `cart`);
    const unsub = onValue(cartRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([key, val]: [string, any]) => ({
          id: key,
          name: val.product || "Unknown Item",
          quantity: val.quantity || 1,
          price: ITEM_PRICES[val.product] || 50,
        }));
        setItems(parsed);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handlePayment = () => {
    setProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      navigate("/invoice", { state: { items, totalPrice, date: new Date().toISOString() } });
    }, 2000);
  };

  if (loading) {
    return (
      <div className="payment-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Initializing Secure Payment...</p>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-bg">
        <div className="payment-bg-circle payment-bg-circle--1"></div>
        <div className="payment-bg-circle payment-bg-circle--2"></div>
      </div>

      <nav className="payment-nav">
        <button onClick={() => navigate("/")} className="back-btn">
          <ArrowLeft size={20} />
          Back to Cart
        </button>
        <span className="payment-title">Secure Checkout</span>
      </nav>

      <main className="payment-container">
        <div className="payment-grid">
          {/* Left Side: Payment Form */}
          <div className="payment-methods-card">
            <h2>Select Payment Method</h2>
            <div className="method-selector">
              <button
                className={`method-btn ${paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard size={24} />
                <span>Card</span>
              </button>
              <button
                className={`method-btn ${paymentMethod === "upi" ? "active" : ""}`}
                onClick={() => setPaymentMethod("upi")}
              >
                <Smartphone size={24} />
                <span>UPI</span>
              </button>
            </div>

            <div className="payment-form">
              {paymentMethod === "card" ? (
                <div className="card-form">
                  <div className="form-group">
                    <label>Card Number</label>
                    <input type="text" placeholder="xxxx xxxx xxxx xxxx" defaultValue="4242 4242 4242 4242" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input type="text" placeholder="MM/YY" defaultValue="12/28" />
                    </div>
                    <div className="form-group">
                      <label>CVV</label>
                      <input type="password" placeholder="***" defaultValue="123" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Card Holder Name</label>
                    <input type="text" placeholder="Full Name" defaultValue="John Doe" />
                  </div>
                </div>
              ) : (
                <div className="upi-form">
                  <p>Pay using any UPI app (Google Pay, PhonePe, Paytm)</p>
                  <div className="form-group">
                    <label>UPI ID</label>
                    <input type="text" placeholder="example@upi" defaultValue="user@okaxis" />
                  </div>
                  <div className="qr-placeholder">
                    <Smartphone size={64} className="qr-icon" />
                    <span>Scan QR Code on App</span>
                  </div>
                </div>
              )}

              <button
                className="pay-now-btn"
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Pay ₹{totalPrice.toFixed(2)}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Side: Order Summary */}
          <div className="order-summary-card">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {items.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="item-price">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="summary-total">
              <div className="total-row">
                <span>Subtotal</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Convenience Fee</span>
                <span className="free">FREE</span>
              </div>
              <div className="total-row grand-total">
                <span>Amount to Pay</span>
                <span>₹{totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="secure-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              SSL Secured Checkout
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
