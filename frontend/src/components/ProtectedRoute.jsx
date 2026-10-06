import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getMe } from "../services/api.js";

// Renders children only if the auth cookie is valid, otherwise redirects to /login
function ProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    getMe()
      .then(() => setStatus("ok"))
      .catch(() => setStatus("denied"));
  }, []);

  if (status === "checking") return <p className="state-msg">Loading...</p>;
  if (status === "denied") return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;
