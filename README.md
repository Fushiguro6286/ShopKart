# ShopKart

A MERN e-commerce app built across Engineering Labs 01–04.

- **Lab 01–02:** customer registration, login and logout with JWT (HttpOnly cookie)
- **Lab 03:** product listing with search, category filter and product details
- **Lab 04:** persistent wishlist using MongoDB references and `populate()`

## Tech
React + Vite + React Router · Node.js + Express · MongoDB + Mongoose · JWT

## Run locally

```bash
# Backend
cd backend
cp .env.example .env   # then fill in MONGO_URI and JWT_SECRET
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
