import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicOnlyRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return null; // or a loader

  if (user) {
    return <Navigate to="/account" replace />;
  }

  return children;
}
