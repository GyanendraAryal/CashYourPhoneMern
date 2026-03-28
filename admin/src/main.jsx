import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App.jsx";
import "./styles.css";
import {Toaster} from 'react-hot-toast'


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
      <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          borderRadius: "12px",
          background: "#111827",
          color: "#fff",
          fontWeight: 500,
        },
      }}
    />
    </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
