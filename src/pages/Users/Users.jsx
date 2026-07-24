import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
};

const PAGE_SIZE_OPTIONS = [5, 10, 20];

function Users({ isAdminMode }) {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);

  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingUserId, setEditingUserId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [showMemberModal, setShowMemberModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchRelatedData = async () => {
    try {
      setDetailsLoading(true);

      const [projectsResponse, tasksResponse, membersResponse] =
        await Promise.all([
          api.get("/projects"),
          api.get("/projecttasks"),
          api.get("/projectmembers"),
        ]);

      setProjects(
        Array.isArray(projectsResponse.data)
          ? projectsResponse.data
          : []
      );

      setTasks(
        Array.isArray(tasksResponse.data)
          ? tasksResponse.data
          : []
      );

      setProjectMembers(
        Array.isArray(membersResponse.data)
          ? membersResponse.data
          : []
      );
    } catch (error) {
      console.error("Member details could not be loaded:", error);
      setProjects([]);
      setTasks([]);
      setProjectMembers([]);
      setErrorMessage("Member project and task details could not be loaded.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchUsers = async (keyword = "") => {
    try {
      setLoading(true);
      setErrorMessage("");

      let response;

      if (keyword.trim() === "") {
        response = await api.get("/users");
      } else {
        response = await api.get("/users/search", {
          params: {
            keyword: keyword.trim(),
          },
        });
      }

      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Team members could not be fetched:", error);

      setUsers([]);
      setErrorMessage("Team members could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelatedData();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditingUserId(null);
  };

  const openAddModal = () => {
    resetForm();
    setErrorMessage("");
    setSuccessMessage("");
    setShowMemberModal(true);
  };

  const openEditModal = (user) => {
    setEditingUserId(user.id);

    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
    });

    setErrorMessage("");
    setSuccessMessage("");
    setShowMemberModal(true);
  };

  const closeMemberModal = () => {
    if (saving) {
      return;
    }

    setShowMemberModal(false);
    setErrorMessage("");
    resetForm();
  };

  const validateForm = () => {
    if (formData.firstName.trim() === "") {
      setErrorMessage("First name is required.");
      return false;
    }

    if (formData.lastName.trim() === "") {
      setErrorMessage("Last name is required.");
      return false;
    }

    if (formData.email.trim() === "") {
      setErrorMessage("Email is required.");
      return false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(formData.email.trim())) {
      setErrorMessage("Please enter a valid email address.");
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
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
    };

    try {
      setSaving(true);

      if (editingUserId !== null) {
        await api.put(`/users/${editingUserId}`, requestData);

        setSuccessMessage("Team member updated successfully.");
      } else {
        await api.post("/users", requestData);

        setSuccessMessage("Team member added successfully.");
      }

      setSearchTerm("");
      setCurrentPage(1);

      await fetchUsers("");

      setShowMemberModal(false);
      resetForm();
    } catch (error) {
      console.error("Team member operation failed:", error);

      const backendMessage =
        error.response?.data?.message || error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "The team member could not be saved."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this team member?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(userId);
      setErrorMessage("");
      setSuccessMessage("");

      await api.delete(`/users/${userId}`);

      setSuccessMessage("Team member deleted successfully.");

      await fetchUsers(searchTerm);
    } catch (error) {
      console.error("Team member could not be deleted:", error);

      const backendMessage =
        error.response?.data?.message || error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "The team member could not be deleted."
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const openDetailsModal = async (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);

    if (
      projects.length === 0 &&
      tasks.length === 0 &&
      projectMembers.length === 0
    ) {
      await fetchRelatedData();
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedUser(null);
  };

  const normalizeDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    return dateValue.toString().split("T")[0];
  };

  const formatDate = (dateValue) => {
    const normalizedDate = normalizeDate(dateValue);

    if (!normalizedDate) {
      return "-";
    }

    const [year, month, day] = normalizedDate.split("-");

    if (!year || !month || !day) {
      return dateValue;
    }

    return `${day}/${month}/${year}`;
  };

  const getProjectStatus = (project) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = project.startDate
      ? new Date(project.startDate)
      : null;

    const endDate = project.endDate
      ? new Date(project.endDate)
      : null;

    if (startDate) {
      startDate.setHours(0, 0, 0, 0);
    }

    if (endDate) {
      endDate.setHours(0, 0, 0, 0);
    }

    if (endDate && endDate < today) {
      return "Completed";
    }

    if (startDate && startDate > today) {
      return "Upcoming";
    }

    return "Active";
  };

  const getSelectedUserProjectIds = () => {
    if (!selectedUser) {
      return [];
    }

    return projectMembers
      .filter(
        (member) =>
          Number(member.userId) === Number(selectedUser.id)
      )
      .map((member) => Number(member.projectId));
  };

  const getSelectedUserProjects = () => {
    const projectIds = getSelectedUserProjectIds();

    return projects.filter((project) =>
      projectIds.includes(Number(project.id))
    );
  };

  const getSelectedUserTasks = () => {
    if (!selectedUser) {
      return [];
    }

    return tasks.filter(
      (task) =>
        Number(task.assignedUserId) === Number(selectedUser.id)
    );
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(users.length / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return users.slice(startIndex, endIndex);
  }, [users, currentPage, pageSize]);

  const firstVisibleMember =
    users.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;

  const lastVisibleMember = Math.min(
    currentPage * pageSize,
    users.length
  );

  const pageNumbers = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1">Team Members</h2>

          <p className="text-muted mb-0">
            View and manage the people working on projects.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className={`badge ${
              isAdminMode ? "text-bg-dark" : "text-bg-secondary"
            }`}
          >
            {isAdminMode ? "Admin Mode" : "User Mode"}
          </span>

          {isAdminMode && (
            <button
              type="button"
              className="btn btn-dark"
              onClick={openAddModal}
            >
              + Add New Member
            </button>
          )}
        </div>
      </div>

      {errorMessage && !showMemberModal && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          {errorMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() => setErrorMessage("")}
            aria-label="Close"
          />
        </div>
      )}

      {successMessage && !showMemberModal && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          {successMessage}

          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
            aria-label="Close"
          />
        </div>
      )}

      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <label
            htmlFor="memberSearch"
            className="form-label fw-semibold"
          >
            Search Team Members
          </label>

          <div className="input-group">
            <input
              id="memberSearch"
              type="text"
              className="form-control"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {searchTerm !== "" && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClearSearch}
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
              <h4 className="mb-1">Member List</h4>

              <small className="text-muted">
                {users.length} member
                {users.length !== 1 ? "s" : ""} found
              </small>
            </div>

            <div className="d-flex align-items-center gap-2">
              <label
                htmlFor="pageSize"
                className="small text-muted mb-0"
              >
                Show
              </label>

              <select
                id="pageSize"
                className="form-select form-select-sm"
                style={{ width: "80px" }}
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
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
                Team members are loading...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center border rounded py-5">
              <h5>No team members found</h5>

              <p className="text-muted mb-0">
                There are no team members matching this search.
              </p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>

                      {isAdminMode && (
                        <th className="text-end">Actions</th>
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => openDetailsModal(user)}
                        style={{ cursor: "pointer" }}
                      >
                        <td className="fw-semibold">
                          {user.firstName} {user.lastName}
                        </td>

                        <td>{user.email}</td>

                        {isAdminMode && (
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-dark"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openEditModal(user);
                                }}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDelete(user.id);
                                }}
                                disabled={deletingUserId === user.id}
                              >
                                {deletingUserId === user.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 border-top pt-3">
                <small className="text-muted">
                  Showing {firstVisibleMember} to {lastVisibleMember} of{" "}
                  {users.length} members
                </small>

                <nav aria-label="Member pagination">
                  <ul className="pagination pagination-sm mb-0">
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link text-dark"
                        onClick={() =>
                          setCurrentPage((previousPage) =>
                            Math.max(1, previousPage - 1)
                          )
                        }
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>

                    {pageNumbers.map((pageNumber) => (
                      <li
                        key={pageNumber}
                        className={`page-item ${
                          currentPage === pageNumber ? "active" : ""
                        }`}
                      >
                        <button
                          type="button"
                          className={`page-link ${
                            currentPage === pageNumber
                              ? "bg-dark border-dark text-white"
                              : "text-dark"
                          }`}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </button>
                      </li>
                    ))}

                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="page-link text-dark"
                        onClick={() =>
                          setCurrentPage((previousPage) =>
                            Math.min(totalPages, previousPage + 1)
                          )
                        }
                        disabled={currentPage === totalPages}
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

      {showDetailsModal && selectedUser && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            style={{ overflowY: "auto" }}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h4 className="modal-title mb-1">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h4>

                    <small className="text-muted">
                      {selectedUser.email}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeDetailsModal}
                    aria-label="Close"
                  />
                </div>

                <div className="modal-body">
                  {detailsLoading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-secondary"
                        role="status"
                      />

                      <p className="text-muted mt-3 mb-0">
                        Member details are loading...
                      </p>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const memberProjects = getSelectedUserProjects();
                        const memberTasks = getSelectedUserTasks();

                        const activeProjects = memberProjects.filter(
                          (project) => getProjectStatus(project) === "Active"
                        );

                        const completedProjects = memberProjects.filter(
                          (project) => getProjectStatus(project) === "Completed"
                        );

                        const completedTasks = memberTasks.filter(
                          (task) => task.status === "Completed"
                        );

                        const inProgressTasks = memberTasks.filter(
                          (task) => task.status === "In Progress"
                        );

                        const toDoTasks = memberTasks.filter(
                          (task) => task.status === "To Do"
                        );

                        return (
                          <>
                            <div className="row g-3 mb-4">
                              <div className="col-md-3">
                                <div className="border rounded p-3 h-100">
                                  <small className="text-muted">
                                    Active Projects
                                  </small>

                                  <h3 className="mb-0 mt-1">
                                    {activeProjects.length}
                                  </h3>
                                </div>
                              </div>

                              <div className="col-md-3">
                                <div className="border rounded p-3 h-100">
                                  <small className="text-muted">
                                    Completed Projects
                                  </small>

                                  <h3 className="mb-0 mt-1">
                                    {completedProjects.length}
                                  </h3>
                                </div>
                              </div>

                              <div className="col-md-3">
                                <div className="border rounded p-3 h-100">
                                  <small className="text-muted">
                                    Assigned Tasks
                                  </small>

                                  <h3 className="mb-0 mt-1">
                                    {memberTasks.length}
                                  </h3>
                                </div>
                              </div>

                              <div className="col-md-3">
                                <div className="border rounded p-3 h-100">
                                  <small className="text-muted">
                                    Completed Tasks
                                  </small>

                                  <h3 className="mb-0 mt-1">
                                    {completedTasks.length}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            <div className="row g-3 mb-4">
                              <div className="col-md-6">
                                <div className="card border-0 bg-light h-100">
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h5 className="mb-0">Active Projects</h5>

                                      <span className="badge text-bg-success">
                                        {activeProjects.length}
                                      </span>
                                    </div>

                                    {activeProjects.length === 0 ? (
                                      <p className="text-muted mb-0">
                                        This member is not currently working on an active project.
                                      </p>
                                    ) : (
                                      <div className="list-group list-group-flush">
                                        {activeProjects.map((project) => (
                                          <div
                                            key={project.id}
                                            className="list-group-item bg-transparent px-0"
                                          >
                                            <div className="fw-semibold">
                                              {project.name}
                                            </div>

                                            <small className="text-muted">
                                              {formatDate(project.startDate)} -{" "}
                                              {project.endDate
                                                ? formatDate(project.endDate)
                                                : "No end date"}
                                            </small>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="col-md-6">
                                <div className="card border-0 bg-light h-100">
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h5 className="mb-0">
                                        Completed Projects
                                      </h5>

                                      <span className="badge text-bg-dark">
                                        {completedProjects.length}
                                      </span>
                                    </div>

                                    {completedProjects.length === 0 ? (
                                      <p className="text-muted mb-0">
                                        This member does not have a completed project yet.
                                      </p>
                                    ) : (
                                      <div className="list-group list-group-flush">
                                        {completedProjects.map((project) => (
                                          <div
                                            key={project.id}
                                            className="list-group-item bg-transparent px-0"
                                          >
                                            <div className="fw-semibold">
                                              {project.name}
                                            </div>

                                            <small className="text-muted">
                                              Completed on{" "}
                                              {formatDate(project.endDate)}
                                            </small>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border rounded p-3">
                              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                <h5 className="mb-0">Assigned Tasks</h5>

                                <div className="d-flex gap-2">
                                  <span className="badge text-bg-secondary">
                                    To Do: {toDoTasks.length}
                                  </span>

                                  <span className="badge bg-warning text-dark">
                                    In Progress: {inProgressTasks.length}
                                  </span>

                                  <span className="badge text-bg-success">
                                    Completed: {completedTasks.length}
                                  </span>
                                </div>
                              </div>

                              {memberTasks.length === 0 ? (
                                <p className="text-muted mb-0">
                                  No tasks have been assigned to this member.
                                </p>
                              ) : (
                                <div className="table-responsive">
                                  <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Task</th>
                                        <th>Project</th>
                                        <th>Status</th>
                                        <th>Due Date</th>
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {memberTasks.map((task) => {
                                        const taskProject = projects.find(
                                          (project) =>
                                            Number(project.id) ===
                                            Number(task.projectId)
                                        );

                                        return (
                                          <tr key={task.id}>
                                            <td>
                                              <div className="fw-semibold">
                                                {task.title}
                                              </div>

                                              <small className="text-muted">
                                                {task.description}
                                              </small>
                                            </td>

                                            <td>
                                              {taskProject?.name ??
                                                "Unknown Project"}
                                            </td>

                                            <td>
                                              <span
                                                className={`badge ${
                                                  task.status === "Completed"
                                                    ? "text-bg-success"
                                                    : task.status ===
                                                        "In Progress"
                                                      ? "bg-warning text-dark"
                                                      : "text-bg-secondary"
                                                }`}
                                              >
                                                {task.status}
                                              </span>
                                            </td>

                                            <td>{formatDate(task.dueDate)}</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-dark"
                    onClick={closeDetailsModal}
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

      {showMemberModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h5 className="modal-title">
                      {editingUserId !== null
                        ? "Edit Team Member"
                        : "Add New Team Member"}
                    </h5>

                    <small className="text-muted">
                      {editingUserId !== null
                        ? "Update the selected member's information."
                        : "Add a new person to the system."}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeMemberModal}
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

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="firstName"
                          className="form-label"
                        >
                          First Name
                        </label>

                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          className="form-control"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="Enter first name"
                          disabled={saving}
                          required
                        />
                      </div>

                      <div className="col-md-6 mb-3">
                        <label
                          htmlFor="lastName"
                          className="form-label"
                        >
                          Last Name
                        </label>

                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          className="form-control"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Enter last name"
                          disabled={saving}
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>

                      <input
                        id="email"
                        name="email"
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        disabled={saving}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeMemberModal}
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
                        : editingUserId !== null
                          ? "Save Changes"
                          : "Add Member"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  );
}

export default Users;