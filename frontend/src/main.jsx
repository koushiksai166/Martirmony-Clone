import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import AuthProvider from "./context/AuthContext";
import ProfileProvider from "./context/ProfileContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ProfileProvider>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </ProfileProvider>
    </AuthProvider>
  </React.StrictMode>
);