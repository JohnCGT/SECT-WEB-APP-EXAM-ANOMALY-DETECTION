// Import tools
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Import pages
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import Homepage from "./pages/instructor/Homepage";

// Import css
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Routes
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/instructor" element={<Homepage />} /> {/* new route */}
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
