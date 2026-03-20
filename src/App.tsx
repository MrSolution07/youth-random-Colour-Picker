import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import { useAuthBootstrap } from "./lib/auth";
import FirebaseNotConfigured from "./pages/FirebaseNotConfigured";

export default function App() {
  const { ready } = useAuthBootstrap();

  if (!ready) return <FirebaseNotConfigured />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

