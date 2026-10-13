const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

// Loads Razorpay Standard Checkout once. Resolves false if the script cannot load
// (offline, blocked by an extension), so callers never assume window.Razorpay exists.
export const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) existing.remove(); // an earlier attempt failed; try again

    const script = document.createElement("script");
    script.src = CHECKOUT_SRC;
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
