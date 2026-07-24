import {
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import Member from "../Member/Member";

const PROJECTS_API_URL =
  "http://localhost:5082/api/Projects";

const PROJECT_MEMBERS_API_URL =
  "http://localhost:5082/api/ProjectMembers";

const TASKS_API_URL =
  "http://localhost:5082/api/ProjectTasks";

const USERS_API_URL =
  "http://localhost:5082/api/Users";

const initialForm = {
  name: "",
  description: "",
  startDate: "",
  endDate: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function Projects({ isAdminMode }) {
  const [projects, setProjects] = useState([]);
  const [projectMembers, setProjectMembers] =
    useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [showProjectModal, setShowProjectModal] =
    useState(false);

  const [showMemberModal, setShowMemberModal] =
    useState(false);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [editingProjectId, setEditingProjectId] =
    useState(null);

  const [formData, setFormData] =
    useState(initialForm);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [deletingProjectId, setDeletingProjectId] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProjects();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        projectsResponse,
        membersResponse,
        tasksResponse,
        usersResponse,
      ] = await Promise.all([
        axios.get(PROJECTS_API_URL),
        axios.get(PROJECT_MEMBERS_API_URL),
        axios.get(TASKS_API_URL),
        axios.get(USERS_API_URL),
      ]);

      setProjects(
        Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : []
      );

      setProjectMembers(
        Array.isArray(membersResponse.data)
          ? membersResponse.data
          : []
      );

      setTasks(
        Array.isArray(tasksResponse.data)
          ? tasksResponse.data
          : []
      );

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Projects, members or tasks could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(
        PROJECTS_API_URL
      );

      setProjects(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Projects could not be loaded."
      );
    }
  };

  const fetchRelatedData = async () => {
    try {
      const [
        membersResponse,
        tasksResponse,
        usersResponse,
      ] = await Promise.all([
        axios.get(PROJECT_MEMBERS_API_URL),
        axios.get(TASKS_API_URL),
        axios.get(USERS_API_URL),
      ]);

      setProjectMembers(
        Array.isArray(membersResponse.data)
          ? membersResponse.data
          : []
      );

      setTasks(
        Array.isArray(tasksResponse.data)
          ? tasksResponse.data
          : []
      );

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Project details could not be refreshed."
      );
    }
  };

  const searchProjects = async () => {
    const trimmedSearchTerm =
      searchTerm.trim();

    try {
      setLoading(true);
      setErrorMessage("");
      setCurrentPage(1);

      if (!trimmedSearchTerm) {
        const response = await axios.get(
          PROJECTS_API_URL
        );

        setProjects(
          Array.isArray(response.data)
            ? response.data
            : []
        );

        return;
      }

      const response = await axios.get(
        `${PROJECTS_API_URL}/search`,
        {
          params: {
            keyword: trimmedSearchTerm,
          },
        }
      );

      setProjects(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "An error occurred while searching projects."
      );

      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingProjectId(null);
    setFormData(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
    setShowProjectModal(true);
  };

  const openEditModal = (project) => {
    setEditingProjectId(project.id);

    setFormData({
      name: project.name ?? "",
      description: project.description ?? "",
      startDate: formatDateForInput(
        project.startDate
      ),
      endDate: formatDateForInput(
        project.endDate
      ),
    });

    setErrorMessage("");
    setSuccessMessage("");
    setShowProjectModal(true);
  };

  const closeProjectModal = () => {
    if (saving) {
      return;
    }

    setShowProjectModal(false);
    setEditingProjectId(null);
    setFormData(initialForm);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const openMemberModal = (project) => {
    setSelectedProject(project);
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    setShowMemberModal(false);
    setSelectedProject(null);
  };

  const openDetailsModal = (project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProject(null);
  };

  const validateProject = () => {
    if (!formData.name.trim()) {
      setErrorMessage(
        "Project name is required."
      );

      return false;
    }

    if (!formData.description.trim()) {
      setErrorMessage(
        "Project description is required."
      );

      return false;
    }

    if (!formData.startDate) {
      setErrorMessage(
        "Start date is required."
      );

      return false;
    }

    if (
      formData.endDate &&
      formData.endDate < formData.startDate
    ) {
      setErrorMessage(
        "End date cannot be earlier than start date."
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validateProject()) {
      return;
    }

    const projectData = {
      name: formData.name.trim(),
      description:
        formData.description.trim(),
      startDate: formData.startDate,
      endDate: formData.endDate || null,
    };

    try {
      setSaving(true);

      if (editingProjectId !== null) {
        await axios.put(
          `${PROJECTS_API_URL}/${editingProjectId}`,
          projectData
        );

        setSuccessMessage(
          "Project updated successfully."
        );
      } else {
        await axios.post(
          PROJECTS_API_URL,
          projectData
        );

        setSuccessMessage(
          "Project created successfully."
        );
      }

      setSearchTerm("");
      setCurrentPage(1);

      await fetchProjects();
      await fetchRelatedData();

      setTimeout(() => {
        setShowProjectModal(false);
        setEditingProjectId(null);
        setFormData(initialForm);
        setSuccessMessage("");
      }, 600);
    } catch (error) {
      console.error(error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "Project could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingProjectId(projectId);
      setErrorMessage("");
      setSuccessMessage("");

      await axios.delete(
        `${PROJECTS_API_URL}/${projectId}`
      );

      setSuccessMessage(
        "Project deleted successfully."
      );

      await fetchProjects();
      await fetchRelatedData();
    } catch (error) {
      console.error(error);

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "Project could not be deleted."
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  const handleMembersSaved = async () => {
    await fetchProjects();
    await fetchRelatedData();
  };

  const handlePageSizeChange = (event) => {
    setPageSize(
      Number(event.target.value)
    );

    setCurrentPage(1);
  };

  const totalPages = Math.max(
    1,
    Math.ceil(projects.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedProjects = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    const endIndex =
      startIndex + pageSize;

    return projects.slice(
      startIndex,
      endIndex
    );
  }, [projects, currentPage, pageSize]);

  const firstVisibleProject =
    projects.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleProject = Math.min(
    currentPage * pageSize,
    projects.length
  );

  const getVisiblePageNumbers = () => {
    const visiblePages = [];
    const maximumVisiblePages = 5;

    let startPage = Math.max(
      1,
      currentPage -
        Math.floor(maximumVisiblePages / 2)
    );

    let endPage =
      startPage + maximumVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;

      startPage = Math.max(
        1,
        endPage - maximumVisiblePages + 1
      );
    }

    for (
      let pageNumber = startPage;
      pageNumber <= endPage;
      pageNumber += 1
    ) {
      visiblePages.push(pageNumber);
    }

    return visiblePages;
  };

  const getProjectMembers = (projectId) => {
    return projectMembers.filter(
      (member) =>
        Number(member.projectId) ===
        Number(projectId)
    );
  };

  const getProjectTasks = (projectId) => {
    return tasks.filter(
      (task) =>
        Number(task.projectId) ===
        Number(projectId)
    );
  };

  const getTaskCountByStatus = (
    projectId,
    status
  ) => {
    return getProjectTasks(projectId).filter(
      (task) => task.status === status
    ).length;
  };

  const getUserForMember = (member) => {
    if (member.user) {
      return member.user;
    }

    return users.find(
      (user) =>
        Number(user.id) ===
        Number(member.userId)
    );
  };

  const getAssignedUserName = (task) => {
    if (task.assignedUser) {
      return `${task.assignedUser.firstName ?? ""} ${
        task.assignedUser.lastName ?? ""
      }`.trim();
    }

    const user = users.find(
      (item) =>
        Number(item.id) ===
        Number(task.assignedUserId)
    );

    if (!user) {
      return "Unknown User";
    }

    return `${user.firstName ?? ""} ${
      user.lastName ?? ""
    }`.trim();
  };

  const getProjectStatus = (project) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(
      project.startDate
    );

    startDate.setHours(0, 0, 0, 0);

    if (startDate > today) {
      return "Upcoming";
    }

    if (project.endDate) {
      const endDate = new Date(
        project.endDate
      );

      endDate.setHours(0, 0, 0, 0);

      if (endDate < today) {
        return "Completed";
      }
    }

    return "Active";
  };

  const getProjectStatusClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-success";

      case "Upcoming":
        return "bg-secondary";

      case "Completed":
        return "bg-dark";

      default:
        return "bg-secondary";
    }
  };

  const getTaskStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "bg-success";

      case "In Progress":
        return "bg-warning text-dark";

      case "To Do":
        return "bg-secondary";

      default:
        return "bg-dark";
    }
  };

  const selectedProjectMembers =
    selectedProject
      ? getProjectMembers(
          selectedProject.id
        )
      : [];

  const selectedProjectTasks =
    selectedProject
      ? getProjectTasks(
          selectedProject.id
        )
      : [];

  const selectedCompletedTasks =
    selectedProject
      ? getTaskCountByStatus(
          selectedProject.id,
          "Completed"
        )
      : 0;

  const selectedInProgressTasks =
    selectedProject
      ? getTaskCountByStatus(
          selectedProject.id,
          "In Progress"
        )
      : 0;

  const selectedToDoTasks =
    selectedProject
      ? getTaskCountByStatus(
          selectedProject.id,
          "To Do"
        )
      : 0;

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Projects
          </h2>

          <p className="text-muted mb-0">
            View and manage projects.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className={`badge ${
              isAdminMode
                ? "text-bg-dark"
                : "text-bg-secondary"
            }`}
          >
            {isAdminMode
              ? "Admin Mode"
              : "User Mode"}
          </span>

          {isAdminMode && (
            <button
              type="button"
              className="btn btn-dark"
              onClick={openCreateModal}
            >
              + Add New Project
            </button>
          )}
        </div>
      </div>

      {errorMessage && !showProjectModal && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {errorMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setErrorMessage("")
            }
            aria-label="Close"
          />
        </div>
      )}

      {successMessage && !showProjectModal && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {successMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() =>
              setSuccessMessage("")
            }
            aria-label="Close"
          />
        </div>
      )}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <label
            htmlFor="projectSearch"
            className="form-label fw-semibold"
          >
            Search Projects
          </label>

          <div className="input-group">
            <input
              id="projectSearch"
              type="text"
              className="form-control"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              placeholder="Search by project name or description"
            />

            {searchTerm && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h4 className="mb-1">
                Project List
              </h4>

              <small className="text-muted">
                {projects.length} project
                {projects.length !== 1
                  ? "s"
                  : ""}{" "}
                found
              </small>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label
                htmlFor="projectPageSize"
                className="small text-muted mb-0"
              >
                Show
              </label>

              <select
                id="projectPageSize"
                className="form-select form-select-sm"
                style={{
                  width: "80px",
                }}
                value={pageSize}
                onChange={
                  handlePageSizeChange
                }
              >
                {PAGE_SIZE_OPTIONS.map(
                  (option) => (
                    <option
                      key={option}
                      value={option}
                    >
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-secondary"
                role="status"
              />

              <p className="text-muted mt-3 mb-0">
                Projects are loading...
              </p>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center border rounded py-5">
              <h5>No projects found</h5>

              <p className="text-muted mb-0">
                There are currently no
                projects matching this search.
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Details</th>
                      <th>Project</th>
                      <th>Status</th>
                      <th>Members</th>
                      <th>Completed</th>
                      <th>Dates</th>

                      {isAdminMode && (
                        <th className="text-end">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedProjects.map(
                      (project) => {
                        const projectMemberCount =
                          getProjectMembers(
                            project.id
                          ).length;

                        const projectTaskCount =
                          getProjectTasks(
                            project.id
                          ).length;

                        const completedTaskCount =
                          getTaskCountByStatus(
                            project.id,
                            "Completed"
                          );

                        const projectStatus =
                          getProjectStatus(
                            project
                          );

                        return (
                          <tr key={project.id}>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() =>
                                  openDetailsModal(
                                    project
                                  )
                                }
                              >
                                + Details
                              </button>
                            </td>

                            <td
                              style={{
                                minWidth:
                                  "220px",
                              }}
                            >
                              <div className="fw-semibold">
                                {project.name}
                              </div>

                              <small className="text-muted">
                                {project
                                  .description
                                  ?.length > 55
                                  ? `${project.description.slice(
                                      0,
                                      55
                                    )}...`
                                  : project.description}
                              </small>
                            </td>

                            <td>
                              <span
                                className={`badge ${getProjectStatusClass(
                                  projectStatus
                                )}`}
                              >
                                {
                                  projectStatus
                                }
                              </span>
                            </td>

                            <td>
                              {
                                projectMemberCount
                              }
                            </td>

                            <td>
                              <span className="fw-semibold">
                                {
                                  completedTaskCount
                                }
                              </span>

                              <span className="text-muted">
                                {" "}
                                /{" "}
                                {
                                  projectTaskCount
                                }
                              </span>
                            </td>

                            <td
                              style={{
                                minWidth:
                                  "170px",
                              }}
                            >
                              <div>
                                {formatDateForDisplay(
                                  project.startDate
                                )}
                              </div>

                              <small className="text-muted">
                                to{" "}
                                {project.endDate
                                  ? formatDateForDisplay(
                                      project.endDate
                                    )
                                  : "Not specified"}
                              </small>
                            </td>

                            {isAdminMode && (
                              <td className="text-end">
                                <div className="d-flex justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() =>
                                      openMemberModal(
                                        project
                                      )
                                    }
                                  >
                                    Members
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-dark"
                                    onClick={() =>
                                      openEditModal(
                                        project
                                      )
                                    }
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() =>
                                      handleDelete(
                                        project.id
                                      )
                                    }
                                    disabled={
                                      deletingProjectId ===
                                      project.id
                                    }
                                  >
                                    {deletingProjectId ===
                                    project.id
                                      ? "Deleting..."
                                      : "Delete"}
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 border-top pt-3">
                <small className="text-muted">
                  Showing{" "}
                  {firstVisibleProject} to{" "}
                  {lastVisibleProject} of{" "}
                  {projects.length} projects
                </small>

                <nav aria-label="Project pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li
                      className={`page-item ${
                        currentPage === 1
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link text-dark"
                        disabled={
                          currentPage === 1
                        }
                        onClick={() =>
                          setCurrentPage(
                            (
                              previousPage
                            ) =>
                              Math.max(
                                1,
                                previousPage -
                                  1
                              )
                          )
                        }
                      >
                        Previous
                      </button>
                    </li>

                    {getVisiblePageNumbers().map(
                      (pageNumber) => (
                        <li
                          key={pageNumber}
                          className={`page-item ${
                            currentPage ===
                            pageNumber
                              ? "active"
                              : ""
                          }`}
                        >
                          <button
                            type="button"
                            className={`page-link ${
                              currentPage ===
                              pageNumber
                                ? "bg-dark border-dark text-white"
                                : "text-dark"
                            }`}
                            onClick={() =>
                              setCurrentPage(
                                pageNumber
                              )
                            }
                          >
                            {pageNumber}
                          </button>
                        </li>
                      )
                    )}

                    <li
                      className={`page-item ${
                        currentPage ===
                        totalPages
                          ? "disabled"
                          : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link text-dark"
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        onClick={() =>
                          setCurrentPage(
                            (
                              previousPage
                            ) =>
                              Math.min(
                                totalPages,
                                previousPage +
                                  1
                              )
                          )
                        }
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>

      {showProjectModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{
              overflowY: "auto",
            }}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      {editingProjectId !== null
                        ? "Edit Project"
                        : "Add New Project"}
                    </h5>

                    <small className="text-muted">
                      {editingProjectId !== null
                        ? "Update the selected project information."
                        : "Create a new project."}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={
                      closeProjectModal
                    }
                    disabled={saving}
                    aria-label="Close"
                  />
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {errorMessage && (
                      <div className="alert alert-danger">
                        {errorMessage}
                      </div>
                    )}

                    {successMessage && (
                      <div className="alert alert-success">
                        {successMessage}
                      </div>
                    )}

                    <div className="mb-3">
                      <label
                        htmlFor="name"
                        className="form-label"
                      >
                        Project Name
                      </label>

                      <input
                        id="name"
                        name="name"
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter project name"
                        disabled={saving}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor="description"
                        className="form-label"
                      >
                        Description
                      </label>

                      <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        rows="4"
                        value={
                          formData.description
                        }
                        onChange={handleChange}
                        placeholder="Enter project description"
                        disabled={saving}
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="startDate"
                          className="form-label"
                        >
                          Start Date
                        </label>

                        <input
                          id="startDate"
                          name="startDate"
                          type="date"
                          className="form-control"
                          value={
                            formData.startDate
                          }
                          onChange={handleChange}
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="endDate"
                          className="form-label"
                        >
                          End Date
                        </label>

                        <input
                          id="endDate"
                          name="endDate"
                          type="date"
                          className="form-control"
                          value={
                            formData.endDate
                          }
                          onChange={handleChange}
                          min={
                            formData.startDate ||
                            undefined
                          }
                          disabled={saving}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={
                        closeProjectModal
                      }
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-dark"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingProjectId !==
                            null
                          ? "Save Changes"
                          : "Create Project"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      {showDetailsModal &&
        selectedProject && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              role="dialog"
              aria-modal="true"
              style={{
                overflowY: "auto",
              }}
            >
              <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                  <div className="modal-header">
                    <div>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <h4 className="modal-title mb-0">
                          {
                            selectedProject.name
                          }
                        </h4>

                        <span
                          className={`badge ${getProjectStatusClass(
                            getProjectStatus(
                              selectedProject
                            )
                          )}`}
                        >
                          {getProjectStatus(
                            selectedProject
                          )}
                        </span>
                      </div>

                      <small className="text-muted">
                        Project Details
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn-close"
                      onClick={
                        closeDetailsModal
                      }
                      aria-label="Close"
                    />
                  </div>

                  <div className="modal-body">
                    <div className="border rounded bg-light p-3 mb-4">
                      <small className="text-muted d-block mb-2">
                        Description
                      </small>

                      <p className="mb-0">
                        {
                          selectedProject.description
                        }
                      </p>
                    </div>

                    <div className="row g-3 mb-4">
                      <div className="col-md-3">
                        <div className="border rounded p-3 h-100">
                          <small className="text-muted">
                            Members
                          </small>

                          <h3 className="mb-0 mt-1">
                            {
                              selectedProjectMembers.length
                            }
                          </h3>
                        </div>
                      </div>

                      <div className="col-md-3">
                        <div className="border rounded p-3 h-100">
                          <small className="text-muted">
                            Total Tasks
                          </small>

                          <h3 className="mb-0 mt-1">
                            {
                              selectedProjectTasks.length
                            }
                          </h3>
                        </div>
                      </div>

                      <div className="col-md-2">
                        <div className="border rounded p-3 h-100">
                          <small className="text-muted">
                            Completed
                          </small>

                          <h3 className="mb-0 mt-1">
                            {
                              selectedCompletedTasks
                            }
                          </h3>
                        </div>
                      </div>

                      <div className="col-md-2">
                        <div className="border rounded p-3 h-100">
                          <small className="text-muted">
                            In Progress
                          </small>

                          <h3 className="mb-0 mt-1">
                            {
                              selectedInProgressTasks
                            }
                          </h3>
                        </div>
                      </div>

                      <div className="col-md-2">
                        <div className="border rounded p-3 h-100">
                          <small className="text-muted">
                            To Do
                          </small>

                          <h3 className="mb-0 mt-1">
                            {selectedToDoTasks}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-6">
                        <small className="text-muted d-block">
                          Start Date
                        </small>

                        <strong>
                          {formatDateForDisplay(
                            selectedProject.startDate
                          )}
                        </strong>
                      </div>

                      <div className="col-md-6">
                        <small className="text-muted d-block">
                          End Date
                        </small>

                        <strong>
                          {selectedProject.endDate
                            ? formatDateForDisplay(
                                selectedProject.endDate
                              )
                            : "Not specified"}
                        </strong>
                      </div>
                    </div>

                    <hr />

                    <section className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                          Project Members
                        </h5>

                        <span className="badge text-bg-secondary">
                          {
                            selectedProjectMembers.length
                          }{" "}
                          Members
                        </span>
                      </div>

                      {selectedProjectMembers.length ===
                      0 ? (
                        <div className="alert alert-light border">
                          No members have been
                          assigned to this
                          project.
                        </div>
                      ) : (
                        <div className="row g-3">
                          {selectedProjectMembers.map(
                            (member) => {
                              const user =
                                getUserForMember(
                                  member
                                );

                              return (
                                <div
                                  key={
                                    member.id
                                  }
                                  className="col-md-6"
                                >
                                  <div className="border rounded p-3 h-100">
                                    <div className="fw-semibold">
                                      {user
                                        ? `${user.firstName} ${user.lastName}`
                                        : `User ${member.userId}`}
                                    </div>

                                    <small className="text-muted d-block">
                                      {user?.email ??
                                        ""}
                                    </small>

                                    <span className="badge text-bg-dark mt-2">
                                      {
                                        member.role
                                      }
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                    </section>

                    <hr />

                    <section>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">
                          Project Tasks
                        </h5>

                        <span className="badge text-bg-secondary">
                          {
                            selectedProjectTasks.length
                          }{" "}
                          Tasks
                        </span>
                      </div>

                      {selectedProjectTasks.length ===
                      0 ? (
                        <div className="alert alert-light border">
                          No tasks have been
                          created for this
                          project.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-hover align-middle">
                            <thead className="table-light">
                              <tr>
                                <th>Task</th>
                                <th>
                                  Assigned To
                                </th>
                                <th>Status</th>
                                <th>
                                  Due Date
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {selectedProjectTasks.map(
                                (task) => (
                                  <tr
                                    key={
                                      task.id
                                    }
                                  >
                                    <td>
                                      <div className="fw-semibold">
                                        {
                                          task.title
                                        }
                                      </div>

                                      <small className="text-muted">
                                        {
                                          task.description
                                        }
                                      </small>
                                    </td>

                                    <td>
                                      {getAssignedUserName(
                                        task
                                      )}
                                    </td>

                                    <td>
                                      <span
                                        className={`badge ${getTaskStatusClass(
                                          task.status
                                        )}`}
                                      >
                                        {
                                          task.status
                                        }
                                      </span>
                                    </td>

                                    <td>
                                      {formatDateForDisplay(
                                        task.dueDate
                                      )}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </div>

                  <div className="modal-footer">
                    {isAdminMode && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setShowDetailsModal(
                            false
                          );

                          openMemberModal(
                            selectedProject
                          );
                        }}
                      >
                        Manage Members
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-dark"
                      onClick={
                        closeDetailsModal
                      }
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-backdrop fade show" />
          </>
        )}

      <Member
        show={showMemberModal}
        project={selectedProject}
        onClose={closeMemberModal}
        onMembersSaved={
          handleMembersSaved
        }
      />
    </div>
  );
}

function formatDateForInput(dateValue) {
  if (!dateValue) {
    return "";
  }

  return dateValue.toString().split("T")[0];
}

function formatDateForDisplay(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const normalizedDate =
    formatDateForInput(dateValue);

  const [year, month, day] =
    normalizedDate.split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  return `${day}/${month}/${year}`;
}

export default Projects;