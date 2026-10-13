# ShopKart Lab 06 — TA Viva Questions

Use this folder to prepare for the teaching assistant viva on **Checkout, Razorpay (Test Mode), and Orders**.

The TA typically asks **5–7 questions**, chosen from your actual implementation. Know both the **why** (security / business rules) and **where in code** it happens in this project.

## Files

| File | Purpose |
|------|---------|
| [questions.md](./questions.md) | Full question bank by topic |
| [model-answers.md](./model-answers.md) | Short answers aligned with this repo’s backend + frontend |

## Quick map to this codebase

| Topic | Where to look |
|-------|----------------|
| Create Razorpay order + server total | `backend/controllers/order.controller.js` → `createPaymentOrder` |
| Signature verify + clear cart | `backend/controllers/order.controller.js` → `verifyPayment` |
| Order snapshot schema | `backend/models/order.model.js` |
| Checkout UI + Razorpay popup | `frontend/src/pages/Checkout.jsx` |
| Cart global state | `frontend/src/context/CartContext.jsx` |
| Protected order APIs | `backend/routes/order.routes.js` + `protect` middleware |
