# Model answers (ShopKart Lab 06)

Keep answers short in the viva; expand only if the TA asks for detail.

---

## Payments

### Why must the Razorpay Order be created from the backend?

The server owns **amount, currency, and receipt**. It rebuilds the cart from MongoDB, applies current **prices and stock**, saves our ShopKart order, then calls Razorpay’s Orders API with `amount` in paise. If React created the order, a user could tamper with the amount in DevTools (Evaluation Test A). In this project: `createPaymentOrder` in `order.controller.js`.

### Why is the Razorpay Key Secret never sent to React?

The secret is used only to **sign and verify** payments (HMAC). Anyone with the secret could forge verifications or abuse the merchant account. React only gets the public **`key_id`** (and Razorpay order id / amount from our API). Secret stays in `backend/.env` and `RAZORPAY_KEY_SECRET`.

### Why does Razorpay expect INR amounts in paise?

Razorpay’s API uses the **smallest currency unit** to avoid floating-point errors. ₹1 = 100 paise, so ₹499.50 → `49950`. We use `Math.round(totalAmount * 100)` in `createPaymentOrder`.

### What are `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`?

- **`razorpay_order_id`**: ID of the order object created on Razorpay’s side when checkout starts; we store it on our Order as `razorpayOrderId`.
- **`razorpay_payment_id`**: ID of the successful payment attempt; we store it as `razorpayPaymentId` after verify.
- **`razorpay_signature`**: HMAC from Razorpay proving that `order_id|payment_id` was issued with our secret; server recomputes and compares in `isValidSignature`.

### Why is signature verification mandatory?

The success callback in the browser is **not proof** of payment—users can fake requests or manipulate the client. Only after HMAC verify do we set `paymentStatus: PAID`, `status: PLACED`, reduce stock, and clear the cart. Fake signature → 400, order stays unpaid, cart unchanged (Test B).

### Why should the cart not be cleared when Checkout merely opens?

Opening checkout or creating a **pending** payment order does not mean payment succeeded. Clearing early would lose the user’s cart on cancel, failure, or closed popup. Cart clears only in `verifyPayment` after valid signature (and `clearCart()` on the client to sync the Navbar).

### What would happen if the client simply sent `paymentSuccess: true`?

An attacker could mark orders paid without paying. We **never** trust a client boolean; we require Razorpay IDs + signature verified with the secret on `POST /orders/verify-payment`.

---

## Orders

### Why does an Order store product name and price separately from the Product document?

An order is a **historical record** (snapshot). Cart/checkout only hold references; the order copies `name`, `price`, `image`, `quantity` at purchase time (`orderItemSchema` in `order.model.js`).

### Why should order price not change when product price changes?

The customer paid a specific total at checkout. If we only referenced Product, a later admin price change would rewrite past invoices and totals—wrong for accounting and disputes.

### What is the difference between Cart data and Order data?

| Cart | Order |
|------|--------|
| Temporary, mutable | Permanent after paid placement |
| `{ product ref, quantity }` on Customer | Snapshot items + shipping + totals |
| Reflects latest catalog price when loaded | Frozen price/name at payment time |
| Cleared after successful verify | Kept for “My Orders” |

### Why should an Order reference the User?

Orders are **user-specific resources**: list/filter by `user`, enforce ownership in `getOrderById` / `verifyPayment` (`user: req.user._id`). Enables history, support, and access control.

---

## Security & business logic

### Why should the backend calculate `totalAmount`?

The client can lie about totals or items. Server recomputes from **current Product documents** and cart quantities; any `totalAmount` in the request is ignored in `createPaymentOrder`.

### Why must stock be checked again during checkout?

Stock changes between “add to cart” and “pay” (other buyers, admin updates). Re-check in `createPaymentOrder` before creating the Razorpay order; reject with 400 if insufficient.

### Why should the frontend not send the final order items as trusted data?

Malicious clients could send cheap items or wrong quantities. We only trust **shipping address** from React; items come from `req.user.cart` + DB products.

### How do you prevent a user from reading someone else's order?

JWT/`protect` middleware sets `req.user`. Queries use `{ _id, user: req.user._id }`. Another user’s ID returns **404** (same as missing) in `getOrderById` so IDs cannot be probed.

---

## State management

### Why must global cart state be cleared after order creation?

**After verified payment**, the server empties `customer.cart`. If React still held old items, Navbar would show a non-zero count and UI would disagree with MongoDB. `Checkout.jsx` calls `clearCart()` after successful `verifyPayment`.

### What happens if the backend order succeeds but frontend state is not updated?

User sees items still in cart and might pay again or think checkout failed, while DB cart is empty—**split brain**. Always sync context after verify (or `refreshCart()`).

### Why should cart remain untouched if order creation fails?

User should retry without re-adding products. Failures include validation errors, stock errors, Razorpay errors, invalid signature, or cancelled/failed payment—cart stays until successful verify.

---

## React

### Where should checkout form state live?

**Local state on the Checkout page** (`useState` for address + errors), not CartContext—shipping is not global cart data. Presentational fields in `CheckoutForm.jsx`; submit handler in `Checkout.jsx`.

### What loading states should exist while placing an order?

This app uses phases: **idle → creating** (API) → **paying** (Razorpay modal) → **verifying** (signature API). Button disabled while busy; distinct button text per phase in `Checkout.jsx`.

### What should happen if the cart is empty and a user directly opens `/checkout`?

Show empty state: message + link to **Browse Products**; do not call payment APIs. Implemented in `Checkout.jsx` when `cartItems.length === 0` (route is still protected by login).

---

## Sample 5-question viva (mixed)

1. Why create Razorpay order on the backend?  
2. Why verify signature before marking PAID?  
3. Why snapshot price on the order?  
4. Why recalculate total on the server?  
5. Why clear cart only after verify, and update React context too?
