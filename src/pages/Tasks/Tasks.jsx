import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const TASKS_API_URL =
  "http://localhost:5082/api/ProjectTasks";

const PROJECTS_API_URL =
  "http://localhost:5082/api/Projects";

const USERS_API_URL =
  "http://localhost:5082/api/Users";

const PROJECT_MEMBERS_API_URL =
  "http://localhost:5082/api/ProjectMembers";

const INITIAL_FORM = {
  title: "",
  description: "",
  status: "To Do",
  dueDate: "",
  projectId: "",
  assignedUserId: "",
};

const TASK_STATUSES = [
  "To Do",
  "In Progress",
  "Completed",
];

const STATUS_FILTERS = [
  "All",
  "To Do",
  "In Progress",
  "Completed",
];

const PAGE_SIZE_OPTIONS = [5, 10, 20];

const extractArrayFromResponse = (responseData) => {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.items)) {
    return responseData.items;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (Array.isArray(responseData?.results)) {
    return responseData.results;
  }

  if (Array.isArray(responseData?.value)) {
    return responseData.value;
  }

  if (Array.isArray(responseData?.$values)) {
    return responseData.$values;
  }

  if (Array.isArray(responseData?.data?.items)) {
    return responseData.data.items;
  }

  return [];
};

function Tasks({ isAdminMode }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);

  const [selectedStatus, setSelectedStatus] =
    useState("All");

  const [showTaskModal, setShowTaskModal] =
    useState(false);

  const [showDetailModal, setShowDetailModal] =
    useState(false);

  const [selectedTask, setSelectedTask] =
    useState(null);

  const [editingTaskId, setEditingTaskId] =
    useState(null);

  const [formData, setFormData] =
    useState(INITIAL_FORM);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [pageSize, setPageSize] =
    useState(10);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deletingTaskId, setDeletingTaskId] =
    useState(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  const normalizeDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    return dateValue.toString().split("T")[0];
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const normalizedDate = normalizeDate(dateValue);
    const [year, month, day] = normalizedDate.split("-");

    if (!year || !month || !day) {
      return dateValue;
    }

    return `${day}/${month}/${year}`;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        tasksResponse,
        projectsResponse,
        usersResponse,
        membersResponse,
      ] = await Promise.all([
        axios.get(TASKS_API_URL),
        axios.get(PROJECTS_API_URL),
        axios.get(USERS_API_URL),
        axios.get(PROJECT_MEMBERS_API_URL),
      ]);

      console.log(
        "ProjectTasks response:",
        tasksResponse.data
      );

      setTasks(
        extractArrayFromResponse(
          tasksResponse.data
        )
      );

      setProjects(
        Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : []
      );

      setUsers(
        Array.isArray(usersResponse.data)
          ? usersResponse.data
          : []
      );

      setProjectMembers(
        Array.isArray(membersResponse.data)
          ? membersResponse.data
          : []
      );
    } catch (error) {
      console.error(
        "Initial data could not be loaded:",
        error
      );

      setErrorMessage(
        "Tasks, projects, team members or project members could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async (
    status = selectedStatus
  ) => {
    try {
      setLoading(true);
      setErrorMessage("");

      let response;

      if (status === "All") {
        response = await axios.get(
          TASKS_API_URL
        );
      } else {
        response = await axios.get(
          `${TASKS_API_URL}/status`,
          {
            params: {
              status,
            },
          }
        );
      }

      console.log(
        "Filtered ProjectTasks response:",
        response.data
      );

      setTasks(
        extractArrayFromResponse(
          response.data
        )
      );
    } catch (error) {
      console.error(
        "Tasks could not be loaded:",
        error
      );

      setErrorMessage(
        "Tasks could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  const filterTasksByStatus = async (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);

    await loadTasks(status);
  };

  const selectedProject = useMemo(() => {
    if (!formData.projectId) {
      return null;
    }

    return (
      projects.find(
        (project) =>
          Number(project.id) ===
          Number(formData.projectId)
      ) ?? null
    );
  }, [projects, formData.projectId]);

  const selectedProjectMembers = useMemo(() => {
    if (!formData.projectId) {
      return [];
    }

    return projectMembers.filter(
      (member) =>
        Number(member.projectId) ===
        Number(formData.projectId)
    );
  }, [projectMembers, formData.projectId]);

  const assignableUsers = useMemo(() => {
    const memberUsers = selectedProjectMembers
      .map((member) => {
        if (member.user) {
          return member.user;
        }

        return users.find(
          (user) =>
            Number(user.id) ===
            Number(member.userId)
        );
      })
      .filter(Boolean);

    return memberUsers.filter(
      (user, index, userList) =>
        index ===
        userList.findIndex(
          (item) =>
            Number(item.id) ===
            Number(user.id)
        )
    );
  }, [selectedProjectMembers, users]);

  const totalPages = Math.max(
    1,
    Math.ceil(tasks.length / pageSize)
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedTasks = useMemo(() => {
    const startIndex =
      (currentPage - 1) * pageSize;

    const endIndex =
      startIndex + pageSize;

    return tasks.slice(startIndex, endIndex);
  }, [tasks, currentPage, pageSize]);

  const firstVisibleTask =
    tasks.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1;

  const lastVisibleTask = Math.min(
    currentPage * pageSize,
    tasks.length
  );

  const getVisiblePageNumbers = () => {
    const visiblePageNumbers = [];
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
      visiblePageNumbers.push(pageNumber);
    }

    return visiblePageNumbers;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setEditingTaskId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setErrorMessage("");
    setSuccessMessage("");
    setShowTaskModal(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task.id);

    setFormData({
      title: task.title ?? "",
      description: task.description ?? "",
      status: task.status ?? "To Do",
      dueDate: normalizeDate(task.dueDate),
      projectId:
        task.projectId?.toString() ?? "",
      assignedUserId:
        task.assignedUserId?.toString() ?? "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setShowTaskModal(true);
  };

  const closeTaskModal = () => {
    if (saving) {
      return;
    }

    setShowTaskModal(false);
    setErrorMessage("");
    setSuccessMessage("");
    resetForm();
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const closeTaskDetails = () => {
    setSelectedTask(null);
    setShowDetailModal(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name === "projectId") {
      setFormData((previousFormData) => ({
        ...previousFormData,
        projectId: value,
        assignedUserId: "",
        dueDate: "",
      }));

      setErrorMessage("");
      return;
    }

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: value,
    }));

    if (name === "dueDate") {
      setErrorMessage("");
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setErrorMessage(
        "Task title cannot be empty."
      );

      return false;
    }

    if (!formData.description.trim()) {
      setErrorMessage(
        "Description cannot be empty."
      );

      return false;
    }

    if (!formData.projectId) {
      setErrorMessage(
        "Please select a project."
      );

      return false;
    }

    if (!selectedProject) {
      setErrorMessage(
        "The selected project could not be found."
      );

      return false;
    }

    if (!formData.assignedUserId) {
      setErrorMessage(
        "Please select a project member."
      );

      return false;
    }

    if (!formData.dueDate) {
      setErrorMessage(
        "Please select a due date."
      );

      return false;
    }

    const projectStartDate = normalizeDate(
      selectedProject.startDate
    );

    const projectEndDate = normalizeDate(
      selectedProject.endDate
    );

    const taskDueDate = normalizeDate(
      formData.dueDate
    );

    if (
      projectStartDate &&
      taskDueDate < projectStartDate
    ) {
      setErrorMessage(
        `The task due date cannot be earlier than the project start date. The project starts on ${formatDate(
          projectStartDate
        )}.`
      );

      return false;
    }

    if (
      projectEndDate &&
      taskDueDate > projectEndDate
    ) {
      setErrorMessage(
        `The task due date cannot be later than the project delivery date. The project must be completed by ${formatDate(
          projectEndDate
        )}.`
      );

      return false;
    }

    const selectedUserIsProjectMember =
      assignableUsers.some(
        (user) =>
          Number(user.id) ===
          Number(formData.assignedUserId)
      );

    if (!selectedUserIsProjectMember) {
      setErrorMessage(
        "The selected person is not a member of this project."
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    const requestData = {
      title: formData.title.trim(),
      description:
        formData.description.trim(),
      status: formData.status,
      dueDate: formData.dueDate,
      projectId: Number(
        formData.projectId
      ),
      assignedUserId: Number(
        formData.assignedUserId
      ),
    };

    try {
      setSaving(true);

      if (editingTaskId !== null) {
        await axios.put(
          `${TASKS_API_URL}/${editingTaskId}`,
          requestData
        );

        setSuccessMessage(
          "Task updated successfully."
        );
      } else {
        await axios.post(
          TASKS_API_URL,
          requestData
        );

        setSuccessMessage(
          "Task created successfully."
        );
      }

      await loadTasks(selectedStatus);

      setTimeout(() => {
        setShowTaskModal(false);
        setSuccessMessage("");
        resetForm();
      }, 500);
    } catch (error) {
      console.error(
        "Task operation failed:",
        error
      );

      const backendMessage =
        error.response?.data?.message ??
        error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "The task could not be saved. Make sure the selected person is a member of the project."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTaskId(taskId);
      setErrorMessage("");
      setSuccessMessage("");

      await axios.delete(
        `${TASKS_API_URL}/${taskId}`
      );

      setSuccessMessage(
        "Task deleted successfully."
      );

      await loadTasks(selectedStatus);
    } catch (error) {
      console.error(
        "Task could not be deleted:",
        error
      );

      const backendMessage =
        error.response?.data?.message ??
        error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "The task could not be deleted."
      );
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handlePageSizeChange = (event) => {
    setPageSize(
      Number(event.target.value)
    );

    setCurrentPage(1);
  };

  const getProjectName = (task) => {
    if (task.project?.name) {
      return task.project.name;
    }

    const project = projects.find(
      (item) =>
        Number(item.id) ===
        Number(task.projectId)
    );

    return (
      project?.name ?? "Unknown Project"
    );
  };

  const getAssignedUser = (task) => {
    if (task.assignedUser) {
      return task.assignedUser;
    }

    return users.find(
      (user) =>
        Number(user.id) ===
        Number(task.assignedUserId)
    );
  };

  const getAssignedUserName = (task) => {
    const assignedUser =
      getAssignedUser(task);

    if (!assignedUser) {
      return "Unknown Member";
    }

    return `${assignedUser.firstName ?? ""} ${
      assignedUser.lastName ?? ""
    }`.trim();
  };

  const getAssignedUserEmail = (task) => {
    const assignedUser =
      getAssignedUser(task);

    return assignedUser?.email ?? "";
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "To Do":
        return "bg-secondary";

      case "In Progress":
        return "bg-warning text-dark";

      case "Completed":
        return "bg-success";

      default:
        return "bg-dark";
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            Project Tasks
          </h2>

          <p className="text-muted mb-0">
            View and manage project tasks.
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
              + Add New Task
            </button>
          )}
        </div>
      </div>

      {errorMessage && !showTaskModal && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {errorMessage}

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() =>
              setErrorMessage("")
            }
          />
        </div>
      )}

      {successMessage && !showTaskModal && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {successMessage}

          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() =>
              setSuccessMessage("")
            }
          />
        </div>
      )}

      <div className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h4 className="mb-1">
                Task List
              </h4>

              <small className="text-muted">
                {tasks.length} task
                {tasks.length !== 1 ? "s" : ""}{" "}
                found
              </small>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <label
                  htmlFor="taskPageSize"
                  className="small text-muted mb-0"
                >
                  Show
                </label>

                <select
                  id="taskPageSize"
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

              <div className="btn-group">
                {STATUS_FILTERS.map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      className={`btn ${
                        selectedStatus ===
                        status
                          ? "btn-dark"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() =>
                        filterTasksByStatus(
                          status
                        )
                      }
                    >
                      {status}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-secondary"
                role="status"
              />

              <p className="mt-3 mb-0 text-muted">
                Loading tasks...
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center border rounded py-5">
              <h5>No tasks found</h5>

              <p className="text-muted mb-0">
                There are currently no tasks
                matching this filter.
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Task</th>
                      <th>Project</th>
                      <th>Assigned To</th>
                      <th>Status</th>
                      <th>Due Date</th>

                      {isAdminMode && (
                        <th className="text-end">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedTasks.map(
                      (task) => (
                        <tr
                          key={task.id}
                          onClick={() => {
                            if (!isAdminMode) {
                              openTaskDetails(
                                task
                              );
                            }
                          }}
                          style={{
                            cursor:
                              !isAdminMode
                                ? "pointer"
                                : "default",
                          }}
                        >
                          <td>
                            <div className="fw-semibold">
                              {task.title}
                            </div>

                            <small className="text-muted">
                              {task.description
                                ?.length > 60
                                ? `${task.description.slice(
                                    0,
                                    60
                                  )}...`
                                : task.description}
                            </small>
                          </td>

                          <td>
                            {getProjectName(
                              task
                            )}
                          </td>

                          <td>
                            {getAssignedUserName(
                              task
                            )}
                          </td>

                          <td>
                            <span
                              className={`badge ${getStatusBadgeClass(
                                task.status
                              )}`}
                            >
                              {task.status}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              task.dueDate
                            )}
                          </td>

                          {isAdminMode && (
                            <td className="text-end">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-dark"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    openEditModal(
                                      task
                                    );
                                  }}
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={(
                                    event
                                  ) => {
                                    event.stopPropagation();

                                    handleDelete(
                                      task.id
                                    );
                                  }}
                                  disabled={
                                    deletingTaskId ===
                                    task.id
                                  }
                                >
                                  {deletingTaskId ===
                                  task.id
                                    ? "Deleting..."
                                    : "Delete"}
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 border-top pt-3">
                <small className="text-muted">
                  Showing {firstVisibleTask} to{" "}
                  {lastVisibleTask} of{" "}
                  {tasks.length} tasks
                </small>

                <nav aria-label="Task pagination">
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
                            (previousPage) =>
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
                            (previousPage) =>
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

      {showTaskModal && (
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
              <div
                className="modal-content"
                style={{
                  maxHeight: "90vh",
                }}
              >
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      {editingTaskId !== null
                        ? "Edit Task"
                        : "Add New Task"}
                    </h5>

                    <small className="text-muted">
                      {editingTaskId !== null
                        ? "Update the selected task information."
                        : "Create a task and assign it to a project member."}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeTaskModal}
                    disabled={saving}
                  />
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="d-flex flex-column overflow-hidden"
                >
                  <div
                    className="modal-body"
                    style={{
                      overflowY: "auto",
                    }}
                  >
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

                    <div className="row">
                      <div className="col-md-8 mb-3">
                        <label
                          htmlFor="title"
                          className="form-label"
                        >
                          Task Title
                        </label>

                        <input
                          id="title"
                          name="title"
                          type="text"
                          className="form-control"
                          value={formData.title}
                          onChange={
                            handleInputChange
                          }
                          placeholder="Enter task title"
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="col-md-4 mb-3">
                        <label
                          htmlFor="status"
                          className="form-label"
                        >
                          Status
                        </label>

                        <select
                          id="status"
                          name="status"
                          className="form-select"
                          value={formData.status}
                          onChange={
                            handleInputChange
                          }
                          disabled={saving}
                        >
                          {TASK_STATUSES.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </div>
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
                        onChange={
                          handleInputChange
                        }
                        placeholder="Enter task description"
                        disabled={saving}
                        required
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="projectId"
                          className="form-label"
                        >
                          Project
                        </label>

                        <select
                          id="projectId"
                          name="projectId"
                          className="form-select"
                          value={
                            formData.projectId
                          }
                          onChange={
                            handleInputChange
                          }
                          disabled={saving}
                          required
                        >
                          <option value="">
                            Select a project
                          </option>

                          {projects.map(
                            (project) => (
                              <option
                                key={project.id}
                                value={project.id}
                              >
                                {project.name}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="assignedUserId"
                          className="form-label"
                        >
                          Assigned Member
                        </label>

                        <select
                          id="assignedUserId"
                          name="assignedUserId"
                          className="form-select"
                          value={
                            formData.assignedUserId
                          }
                          onChange={
                            handleInputChange
                          }
                          disabled={
                            saving ||
                            !formData.projectId ||
                            assignableUsers.length ===
                              0
                          }
                          required
                        >
                          <option value="">
                            {!formData.projectId
                              ? "Select a project first"
                              : assignableUsers.length ===
                                  0
                                ? "No members available"
                                : "Select a project member"}
                          </option>

                          {assignableUsers.map(
                            (user) => (
                              <option
                                key={user.id}
                                value={user.id}
                              >
                                {user.firstName}{" "}
                                {user.lastName}
                                {user.email
                                  ? ` - ${user.email}`
                                  : ""}
                              </option>
                            )
                          )}
                        </select>

                        {formData.projectId &&
                          assignableUsers.length ===
                            0 && (
                            <small className="text-danger d-block mt-1">
                              This project does not
                              have any members. Add a
                              project member before
                              creating a task.
                            </small>
                          )}
                      </div>
                    </div>

                    {selectedProject && (
                      <div className="alert alert-secondary py-2">
                        <div className="fw-semibold mb-1">
                          Project schedule
                        </div>

                        <small>
                          The project starts on{" "}
                          <strong>
                            {formatDate(
                              selectedProject.startDate
                            )}
                          </strong>{" "}
                          and must be completed by{" "}
                          <strong>
                            {formatDate(
                              selectedProject.endDate
                            )}
                          </strong>
                          .
                        </small>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="dueDate"
                          className="form-label"
                        >
                          Due Date
                        </label>

                        <input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          className="form-control"
                          value={
                            formData.dueDate
                          }
                          onChange={
                            handleInputChange
                          }
                          min={
                            selectedProject
                              ? normalizeDate(
                                  selectedProject.startDate
                                )
                              : undefined
                          }
                          max={
                            selectedProject
                              ? normalizeDate(
                                  selectedProject.endDate
                                )
                              : undefined
                          }
                          disabled={
                            saving ||
                            !selectedProject
                          }
                          required
                        />

                        {!selectedProject && (
                          <small className="text-muted">
                            Select a project before
                            choosing a due date.
                          </small>
                        )}

                        {selectedProject && (
                          <small className="text-muted d-block mt-1">
                            Select a date between{" "}
                            {formatDate(
                              selectedProject.startDate
                            )}{" "}
                            and{" "}
                            {formatDate(
                              selectedProject.endDate
                            )}
                            .
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeTaskModal}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="btn btn-dark"
                      disabled={
                        saving ||
                        !formData.projectId ||
                        assignableUsers.length ===
                          0
                      }
                    >
                      {saving ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          />

                          Saving...
                        </>
                      ) : editingTaskId !==
                        null ? (
                        "Save Changes"
                      ) : (
                        "Create Task"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}

      {showDetailModal && selectedTask && (
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
                      Task Details
                    </h5>

                    <small className="text-muted">
                      View task information
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeTaskDetails}
                  />
                </div>

                <div className="modal-body">
                  <div className="d-flex justify-content-between align-items-start gap-3 mb-4">
                    <div>
                      <h3 className="mb-2">
                        {selectedTask.title}
                      </h3>

                      <span
                        className={`badge ${getStatusBadgeClass(
                          selectedTask.status
                        )}`}
                      >
                        {selectedTask.status}
                      </span>
                    </div>

                    <div className="text-end">
                      <small className="text-muted d-block">
                        Due Date
                      </small>

                      <strong>
                        {formatDate(
                          selectedTask.dueDate
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="border rounded p-3 mb-4 bg-light">
                    <small className="text-muted d-block mb-2">
                      Description
                    </small>

                    <p className="mb-0">
                      {selectedTask.description}
                    </p>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <small className="text-muted d-block">
                        Project
                      </small>

                      <strong>
                        {getProjectName(
                          selectedTask
                        )}
                      </strong>
                    </div>

                    <div className="col-md-6 mb-3">
                      <small className="text-muted d-block">
                        Assigned Member
                      </small>

                      <strong>
                        {getAssignedUserName(
                          selectedTask
                        )}
                      </strong>

                      {getAssignedUserEmail(
                        selectedTask
                      ) && (
                        <div className="text-muted">
                          {getAssignedUserEmail(
                            selectedTask
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={closeTaskDetails}
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
    </div>
  );
}

export default Tasks;