import { Link, Route, Routes } from "react-router-dom";

import Home from "./pages/Home/Home";
import Users from "./pages/Users/Users";
import Projects from "./pages/Projects/Projects";
import Tasks from "./pages/Tasks/Tasks";

function App() {
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">
            🚀 Project Tracker
          </Link>

          <div className="navbar-nav ms-auto">
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
          </div>
        </div>
      </nav>

      <main className="container py-5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/users" element={<Users />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/tasks" element={<Tasks />} />
        </Routes>
      </main>
    </>
  );
}

export default App;