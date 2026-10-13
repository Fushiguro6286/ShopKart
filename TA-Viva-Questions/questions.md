# Question bank (TA may ask 5–7)

## Payments

1. Why must the Razorpay Order be created from the backend?
2. Why is the Razorpay Key Secret never sent to React?
3. Why does Razorpay expect INR amounts in paise?
4. What are `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`?
5. Why is signature verification mandatory?
6. Why should the cart not be cleared when Checkout merely opens?
7. What would happen if the client simply sent `paymentSuccess: true`?

## Orders

8. Why does an Order store product name and price separately from the Product document?
9. Why should order price not change when product price changes?
10. What is the difference between Cart data and Order data?
11. Why should an Order reference the User?

## Security & business logic

12. Why should the backend calculate `totalAmount`?
13. Why must stock be checked again during checkout?
14. Why should the frontend not send the final order items as trusted data?
15. How do you prevent a user from reading someone else's order?

## State management

16. Why must global cart state be cleared after order creation?
17. What happens if the backend order succeeds but frontend state is not updated?
18. Why should cart remain untouched if order creation fails?

## React

19. Where should checkout form state live?
20. What loading states should exist while placing an order?
21. What should happen if the cart is empty and a user directly opens `/checkout`?
