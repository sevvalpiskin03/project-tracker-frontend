import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const USERS_API_URL = "http://localhost:5082/api/Users";
const PROJECTS_API_URL = "http://localhost:5082/api/Projects";
const TASKS_API_URL = "http://localhost:5082/api/ProjectTasks";

const extractArray = (data) => {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
};

function Home() {
  const navigate = useNavigate();

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

      const users = extractArray(usersRes.data);
      const projects = extractArray(projectsRes.data);
      const tasks = extractArray(tasksRes.data);

      setStats({
        users: users.length,
        projects: projects.length,
        tasks: tasks.length,
        completedTasks: tasks.filter(
          (task) => task.status === "Completed"
        ).length,
      });
    } catch (error) {
      console.error(
        "Dashboard data could not be loaded:",
        error
      );
    }
  };

  const cards = [
    {
      title: "Total Members",
      value: stats.users,
      path: "/users",
    },
    {
      title: "Projects",
      value: stats.projects,
      path: "/projects",
    },
    {
      title: "Tasks",
      value: stats.tasks,
      path: "/tasks",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      path: "/tasks",
      state: {
        selectedStatus: "Completed",
      },
    },
  ];

  const handleCardClick = (card) => {
    navigate(card.path, {
      state: card.state,
    });
  };

  const handleCardKeyDown = (event, card) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      handleCardClick(card);
    }
  };

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
          <div
            className="col-md-6 col-lg-3"
            key={card.title}
          >
            <div
              className="card border-0 shadow-sm h-100"
              role="button"
              tabIndex={0}
              onClick={() => handleCardClick(card)}
              onKeyDown={(event) =>
                handleCardKeyDown(event, card)
              }
              style={{
                borderRadius: "16px",
                cursor: "pointer",
                transition:
                  "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.transform =
                  "translateY(-5px)";
                event.currentTarget.style.boxShadow =
                  "0 10px 25px rgba(0, 0, 0, 0.14)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.transform =
                  "translateY(0)";
                event.currentTarget.style.boxShadow = "";
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