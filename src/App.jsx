import { useState } from "react";
import { Link, Route, Routes } from "react-router-dom";

import Home from "./pages/Home/Home";
import Users from "./pages/Users/Users";
import Projects from "./pages/Projects/Projects";
import Tasks from "./pages/Tasks/Tasks";

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            Project Tracker
          </Link>

          <div className="navbar-nav ms-auto align-items-center">
            <Link className="nav-link" to="/">
              Dashboard
            </Link>

            <Link className="nav-link" to="/users">
              Users
            </Link>

            <Link className="nav-link" to="/projects">
              Projects
            </Link>

            <Link className="nav-link" to="/tasks">
              Tasks
            </Link>

            <div className="ms-3">
              <button
                className={`btn btn-sm me-2 ${
                  isAdminMode ? "btn-warning" : "btn-outline-warning"
                }`}
                onClick={() => setIsAdminMode(true)}
              >
                Admin
              </button>

              <button
                className={`btn btn-sm ${
                  !isAdminMode ? "btn-light" : "btn-outline-light"
                }`}
                onClick={() => setIsAdminMode(false)}
              >
                User
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container py-5">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route
            path="/users"
            element={<Users isAdminMode={isAdminMode} />}
          />

          <Route
            path="/projects"
            element={<Projects isAdminMode={isAdminMode} />}
          />

          <Route
            path="/tasks"
            element={<Tasks isAdminMode={isAdminMode} />}
          />
        </Routes>
      </main>
    </>
  );
}

export default App;