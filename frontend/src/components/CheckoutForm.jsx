const FIELDS = [
  { name: "fullName", label: "Full Name", placeholder: "Aarav Sharma", autoComplete: "name" },
  { name: "phone", label: "Phone Number", placeholder: "9876543210", autoComplete: "tel", inputMode: "numeric" },
  { name: "addressLine1", label: "Address", placeholder: "22 MG Road", autoComplete: "address-line1" },
  { name: "city", label: "City", placeholder: "Bengaluru", autoComplete: "address-level2" },
  { name: "state", label: "State", placeholder: "Karnataka", autoComplete: "address-level1" },
  { name: "pincode", label: "Pincode", placeholder: "560001", autoComplete: "postal-code", inputMode: "numeric" },
];

export const EMPTY_ADDRESS = Object.fromEntries(FIELDS.map((f) => [f.name, ""]));

// Same rules as the server; the server still re-checks everything
export const validateAddress = (form) => {
  const errors = {};
  for (const field of FIELDS) {
    if (!form[field.name].trim()) errors[field.name] = `${field.label} is required`;
  }
  if (!errors.phone && !/^\d{10}$/.test(form.phone.trim())) {
    errors.phone = "Enter a 10-digit phone number";
  }
  if (!errors.pincode && !/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = "Pincode must contain 6 digits";
  }
  return errors;
};

// Presentational only: the form state lives in the Checkout page that submits it
function CheckoutForm({ form, errors, disabled, onChange }) {
  return (
    <div className="checkout-form">
      {FIELDS.map((field) => (
        <div key={field.name} className="form-field">
          <label htmlFor={field.name}>{field.label}</label>
          <input
            id={field.name}
            name={field.name}
            value={form[field.name]}
            onChange={onChange}
            placeholder={field.placeholder}
            autoComplete={field.autoComplete}
            inputMode={field.inputMode}
            disabled={disabled}
            aria-invalid={Boolean(errors[field.name])}
          />
          {errors[field.name] && <p className="field-error">{errors[field.name]}</p>}
        </div>
      ))}
    </div>
  );
}

export default CheckoutForm;
