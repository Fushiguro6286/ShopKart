# ShopKart

A MERN e-commerce app built across Engineering Labs 01–06.

- **Lab 01–02:** customer registration, login and logout with JWT (HttpOnly cookie)
- **Lab 03:** product listing with search, category filter and product details
- **Lab 04:** persistent wishlist using MongoDB references and `populate()`
- **Lab 05:** shopping cart with quantities, stock validation and global cart state (React Context)
- **Lab 06:** checkout, Razorpay Test Mode payment with server-side signature verification, and order history

## Tech
React + Vite + React Router · Node.js + Express · MongoDB + Mongoose · JWT

## Run locally

```bash
# Backend
cd backend
cp .env.example .env   # then fill in MONGO_URI, JWT_SECRET and Razorpay TEST keys
npm install
npm run seed           # optional: insert sample products
npm run dev            # http://localhost:5000

# Frontend
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The Vite dev server proxies `/api/*` to the backend so the auth cookie stays same-origin.

## Wishlist API

All endpoints require login. The user is taken from the auth cookie, never from the request.

| Method | Endpoint | Purpose | Errors |
|---|---|---|---|
| POST | `/wishlist/:productId` | Add product | 400 invalid ID, 404 product not found, 409 already saved |
| GET | `/wishlist` | Current user's wishlist (populated) | — |
| DELETE | `/wishlist/:productId` | Remove product | 400 invalid ID, 404 not in wishlist |

Unauthenticated requests return 401.

The `Customer` model stores only Product `ObjectId` references (`ref: "Product"`), so the Product collection stays the source of truth for price, stock and images.

## Cart API

All endpoints require login (401 otherwise). Every successful response returns the full cart with each product populated, so the client always gets the latest price and stock.

| Method | Endpoint | Purpose | Errors |
|---|---|---|---|
| POST | `/cart/:productId` | Add product (quantity 1), or +1 if already in cart | 400 invalid ID, 404 product not found, 400 over stock |
| GET | `/cart` | Current user's cart (populated) | — |
| PATCH | `/cart/:productId` | Set quantity, body `{ "quantity": 3 }` | 400 invalid ID / not a whole number / below 1 / over stock, 404 product not found or not in cart |
| DELETE | `/cart/:productId` | Remove product | 400 invalid ID, 404 not in cart |

`Customer.cart` stores `{ product: ObjectId ref, quantity }` rows only. Subtotal and item counts are never stored; the frontend derives them from the cart.

### Frontend cart state

`src/context/CartContext.jsx` holds the single shared copy of the cart (`cartItems`, `loading`, `error`, per-product pending flags) and the actions `addToCart`, `updateQuantity`, `removeFromCart`, `refreshCart`. After each API call it replaces `cartItems` with the cart the server returns, so the Navbar count, product cards and the Cart page always agree. `totalUnits` and `subtotal` are computed from `cartItems`.

## Orders & payment API

All endpoints require login (401 otherwise).

| Method | Endpoint | Purpose | Errors |
|---|---|---|---|
| POST | `/orders/create-payment-order` | Body `{ shippingAddress }`. Re-checks the cart against the latest products, calculates the total, saves a `PENDING_PAYMENT` order with a price snapshot, creates the Razorpay order | 400 invalid address / empty cart / insufficient stock / product no longer available, 502 Razorpay error, 503 keys missing |
| POST | `/orders/verify-payment` | Body `{ shopKartOrderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }`. Verifies the HMAC signature, marks the order `PAID` / `PLACED`, reduces stock, clears the cart | 400 invalid signature or mismatched order, 404 not your order |
| GET | `/orders` | Current user's placed orders, newest first (unpaid attempts are hidden) | — |
| GET | `/orders/:id` | One order; another user's order returns 404 | 400 invalid ID, 404 |

### Payment flow

1. React validates the shipping form, then calls `create-payment-order` with **only** the address. Any `totalAmount` sent by the client is ignored.
2. The server sends back `razorpayOrderId`, `amount` (paise), `currency` and the public `key` ID. `RAZORPAY_KEY_SECRET` never leaves the server.
3. React opens Razorpay Checkout. Its success handler only forwards the response to `verify-payment`.
4. The server computes `HMAC_SHA256(storedRazorpayOrderId + "|" + paymentId, keySecret)` and compares it to the signature. Only then is the order marked paid and the cart cleared. A failed, cancelled or unverifiable payment leaves the cart untouched and the order `PENDING_PAYMENT`.
5. The frontend clears its cart state (Navbar shows Cart 0) and opens `/orders/:id` as the confirmation screen.

Use Razorpay **Test Mode** keys only. In Test Mode, pay with Razorpay's test cards or test UPI ID shown in the Checkout popup; no real money moves.

Order items store `name`, `price` and `image` copied at purchase time, so later product price changes never alter past orders.
