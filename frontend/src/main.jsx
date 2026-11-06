import React from "react";
import { createRoot } from "react-dom/client";
import "../css/style.css";

function App() {
  return (
    <>
      <header className="topbar">
        <h1 className="logo">💸 SplitIt</h1>
      </header>
      <main>
        <div className="card">
          <h2>React preview</h2>
          <p>The React frontend is ready for the next migration step.</p>
        </div>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
