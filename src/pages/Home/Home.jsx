import { useEffect, useState } from "react";
import axios from "axios";

const USERS_API_URL = "http://localhost:5082/api/Users";
const PROJECTS_API_URL = "http://localhost:5082/api/Projects";
const TASKS_API_URL = "http://localhost:5082/api/ProjectTasks";

function Home() {
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    tasks: 0,
    completedTasks: 0,
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [usersRes, projectsRes, tasksRes] =
        await Promise.all([
          axios.get(USERS_API_URL),
          axios.get(PROJECTS_API_URL),
          axios.get(TASKS_API_URL),
        ]);

      const tasks = tasksRes.data;

      setStats({
        users: usersRes.data.length,
        projects: projectsRes.data.length,
        tasks: tasks.length,
        completedTasks: tasks.filter(
          (task) => task.status === "Completed"
        ).length,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const cards = [
    {
      title: "Total Members",
      value: stats.users,
    },
    {
      title: "Projects",
      value: stats.projects,
    },
    {
      title: "Tasks",
      value: stats.tasks,
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
    },
  ];

  return (
    <div className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-3 fw-bold">
          Project Tracker
        </h1>

        <p className="lead text-muted mt-3">
          Manage your projects, members and tasks from one
          place.
        </p>
      </div>

      <div className="row g-4">
        {cards.map((card) => (
          <div className="col-md-6 col-lg-3" key={card.title}>
            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "16px",
              }}
            >
              <div className="card-body text-center py-4">
                <h6 className="text-muted mb-3">
                  {card.title}
                </h6>

                <h1 className="fw-bold mb-0">
                  {card.value}
                </h1>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;