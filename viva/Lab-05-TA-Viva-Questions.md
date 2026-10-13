# Lab 05 — Shopping Cart: TA Viva Questions & Answers

Answers are grounded in this project's actual implementation
(`frontend/src/context/CartContext.jsx`, `frontend/src/components/Navbar.jsx`,
`frontend/src/components/CartItem.jsx`, `frontend/src/pages/Cart.jsx`,
`backend/controllers/cart.controller.js`, `backend/models/customer.model.js`,
`backend/middlewares/auth.middleware.js`).

---

## State Management

### 1. Why does cart state need to be shared globally?

Because the cart is shown in **many places at once** — the Navbar count, the
"Add to Cart" button on every `ProductCard`, and the Cart page. If each kept its
own copy they would drift out of sync (e.g. Navbar says 2 while the Cart page
shows 3). We keep **one** copy in `CartContext` and every component reads it via
`useCart()`, so they always agree.

### 2. Why should the Navbar not independently fetch the cart?

If the Navbar called `GET /cart` on its own, we would have **two sources of
truth**: the Navbar's copy and the context's copy. After adding an item, the
context updates but the Navbar would still show the old count until it refetched.
Instead the Navbar just reads `totalUnits` from the shared context
(`const { totalUnits } = useCart()`), so it re-renders automatically whenever the
cart changes — no extra request, no stale count.

### 3. What is the difference between server state and frontend state?

- **Server state** is the authoritative data stored in MongoDB — the `cart` array
  on the `Customer` document. It survives refreshes and is shared across devices.
- **Frontend state** is the in-memory copy in `CartContext` (`cartItems`,
  `loading`, `error`, `pending`). It is a cache for rendering.

The server is the source of truth: after every mutation the API returns the full
cart and we **replace** `cartItems` with it (`setCartItems(res.data.cart)`), so
the frontend never invents its own version of the truth.

### 4. What is derived state?

Derived state is a value **computed from other state** rather than stored
separately. In `CartContext`:

```js
const totalUnits = cartItems.reduce((sum, item) => sum + item.quantity, 0);
const subtotal   = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
```

Both are recalculated from `cartItems` inside `useMemo`, so they can never become
inconsistent with the cart.

### 5. Why should subtotal not be stored separately?

If we stored `subtotal` as its own state, every mutation (add, remove, change
quantity) would have to remember to update it too. Miss one path and the total is
wrong. Deriving it from `cartItems` means there is **one source of truth** and the
subtotal is always correct by construction. The backend follows the same rule —
it never stores subtotal or item counts, only `{ product, quantity }` rows.

---

## Backend

### 1. Why does cart need quantity while wishlist does not?

A wishlist is a **set** — a product is either saved or not, so an array of
`ObjectId` references is enough. A cart is a **multiset with amounts** — you can
buy 3 of the same item. So `Customer.cart` stores rows of
`{ product: ObjectId, quantity: Number }`, while `Customer.wishlist` stores plain
`ObjectId`s.

### 2. Why should product price not be copied into the cart object?

Price is **owned by the Product**, not the cart. If we copied it into the cart,
a price change would leave stale prices in every cart. Instead the cart stores
only the reference, and `sendCart()` uses `populate()` to attach the **latest**
`name`, `price`, `image` and `stock` on every response. (Note: orders *do* copy
price — but that is intentional, so past orders keep their purchase-time price.)

### 3. How do you prevent quantity from exceeding stock?

The server re-checks against the **latest** stock on every write:

```js
const newQuantity = existing ? existing.quantity + 1 : 1;
if (newQuantity > product.stock) {
  return res.status(400).json({ success: false, message: stockMessage(product) });
}
```

`updateCartQuantity` does the same check before saving. The frontend also
disables the "+" button at `quantity >= product.stock` and blocks checkout when
any row is over stock — but the **server check is the real guard**, since the
client can be bypassed.

### 4. What happens when the same product is added twice?

It does **not** create a duplicate row. `findCartItem()` looks for an existing
row; if found, `existing.quantity` is incremented instead of pushing a new entry:

```js
if (existing) existing.quantity = newQuantity;
else customer.cart.push({ product: productId, quantity: 1 });
```

### 5. Why does the server identify the user from JWT?

Because the client cannot be trusted to say who it is. The `protect` middleware
reads the HttpOnly cookie, verifies the JWT, loads the `Customer`, and sets
`req.user`. Every cart controller uses `req.user` — never a user id from the
request body or URL. This means a user can only ever read or modify **their own**
cart; there is no way to pass someone else's id and touch their data.

---

## React

### 1. How does the cart count update without refreshing the page?

`CartContext` holds `cartItems` in React state. When `addToCart` runs, the API
returns the new cart and we call `setCartItems(res.data.cart)`. That state change
re-renders every component subscribed via `useCart()` — including the Navbar,
which renders `{totalUnits}`. No page reload and no manual refetch is needed.

### 2. How do you update only one cart item's loading state?

`pending` is a **map keyed by product id** (`{ [productId]: true }`). `mutate()`
sets only that key before the request and deletes it after. Each `CartItem` calls
`isPending(product._id)`, so only the row being changed shows "Updating..." and
disables its buttons — other rows stay interactive.

### 3. What happens if an API mutation fails?

`mutate()` catches the error, throws a friendly `Error`, and the calling
component (`CartItem` / `ProductCard`) catches it and shows the message inline
via `setError(err.message)`. The cart state is **not** changed on failure, so the
UI stays consistent with the server. Special case: a `404` means the server and
UI disagree (e.g. the item was removed in another tab), so we call `refreshCart()`
to resync.

### 4. Why is one shared cart state better than separate local copies?

With separate copies, each component would need its own fetch, its own loading
and error state, and manual syncing after every change — easy to get wrong and
prone to showing different numbers in different places. One shared context gives
a **single source of truth**: one fetch, one set of actions, and every consumer
(Navbar, cards, Cart page) automatically stays in sync.
