import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { ref, remove } from "firebase/database";
import { Printer, Home, CheckCircle2, QrCode } from "lucide-react";
import "./Invoice.css";

export default function Invoice() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totalPrice, date } = location.state || { items: [], totalPrice: 0, date: new Date().toISOString() };

  useEffect(() => {
    // Clear the cart in Firebase after a successful payment
    const cartRef = ref(db, `cart`);
    remove(cartRef).catch((error) => console.error("Error clearing cart:", error));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const orderId = `SC-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="invoice-page">
      <div className="invoice-controls no-print">
        <button onClick={() => navigate("/")} className="control-btn">
          <Home size={20} />
          Return Home
        </button>
        <button onClick={handlePrint} className="control-btn primary">
          <Printer size={20} />
          Print Invoice
        </button>
      </div>

      <div className="invoice-container">
        <header className="invoice-header">
          <div className="header-left">
            <div className="brand">
              <div className="brand-logo">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                  <rect width="48" height="48" rx="12" fill="#6366f1" />
                  <path d="M14 20h20M14 28h20M18 16v16M30 16v16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h1>SmartCart</h1>
            </div>
            <p className="invoice-status">
              <CheckCircle2 size={16} className="text-success" />
              Payment Successful
            </p>
          </div>
          <div className="header-right">
            <div className="meta-field">
              <span className="label">Invoice No:</span>
              <span className="value">{orderId}</span>
            </div>
            <div className="meta-field">
              <span className="label">Date:</span>
              <span className="value">{new Date(date).toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        <section className="invoice-details">
          <div className="billing-to">
            <h3>Billed To:</h3>
            <p><strong>Valued Customer</strong></p>
            <p>SmartCart IoT User</p>
            <p>contact@smartcart.io</p>
          </div>
          <div className="payment-info">
            <h3>Payment Method:</h3>
            <p>Digital Transaction</p>
            <p>Status: <span className="paid-badge">PAID</span></p>
          </div>
        </section>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>Item Description</th>
              <th className="text-center">Qty</th>
              <th className="text-right">Price</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">₹{item.price.toFixed(2)}</td>
                <td className="text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="subtotal">
              <td colSpan={3}>Subtotal</td>
              <td className="text-right">₹{totalPrice.toFixed(2)}</td>
            </tr>
            <tr className="tax">
              <td colSpan={3}>Tax (GST 0%)</td>
              <td className="text-right">₹0.00</td>
            </tr>
            <tr className="grand-total">
              <td colSpan={3}>Grand Total</td>
              <td className="text-right">₹{totalPrice.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <footer className="invoice-footer">
          <div className="footer-notes">
            <h4>Terms & Conditions</h4>
            <p>Thank you for shopping with SmartCart. This is a computer-generated invoice.</p>
            <p>Please keep this for your records.</p>
          </div>
          <div className="footer-qr">
            <QrCode size={64} opacity={0.5} />
            <span>Verify Order</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
