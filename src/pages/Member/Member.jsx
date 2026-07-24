import { useEffect, useState } from "react";
import axios from "axios";

const USERS_API_URL = "http://localhost:5082/api/Users";
const PROJECT_MEMBERS_API_URL =
  "http://localhost:5082/api/ProjectMembers";

const PROJECT_ROLES = [
  "Manager",
  "Developer",
  "Tester",
  "Designer",
  "Business Analyst",
];

const createEmptyMember = () => ({
  userId: "",
  role: "Developer",
});

function Member({
  show,
  project,
  onClose,
  onMembersSaved,
}) {
  const [users, setUsers] = useState([]);
  const [currentMembers, setCurrentMembers] = useState([]);

  const [memberRows, setMemberRows] = useState([
    createEmptyMember(),
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingMemberId, setUpdatingMemberId] =
    useState(null);
  const [deletingMemberId, setDeletingMemberId] =
    useState(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (show && project?.id) {
      loadModalData();

      setMemberRows([createEmptyMember()]);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [show, project?.id]);

  const loadModalData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [usersResponse, membersResponse] =
        await Promise.all([
          axios.get(USERS_API_URL),
          axios.get(PROJECT_MEMBERS_API_URL),
        ]);

      setUsers(usersResponse.data);

      const projectMembers = membersResponse.data.filter(
        (member) =>
          Number(member.projectId) === Number(project.id)
      );

      setCurrentMembers(projectMembers);
    } catch (error) {
      console.error(error);

      setErrorMessage(
        "Users and project members could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (index, field, value) => {
    setMemberRows((previousRows) =>
      previousRows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    );
  };

  const addMemberRow = () => {
    setMemberRows((previousRows) => [
      ...previousRows,
      createEmptyMember(),
    ]);
  };

  const removeMemberRow = (index) => {
    if (memberRows.length === 1) {
      setMemberRows([createEmptyMember()]);
      return;
    }

    setMemberRows((previousRows) =>
      previousRows.filter(
        (_, rowIndex) => rowIndex !== index
      )
    );
  };

  const isCurrentProjectMember = (userId) => {
    return currentMembers.some(
      (member) =>
        Number(member.userId) === Number(userId)
    );
  };

  const isUserSelectedInAnotherRow = (
    userId,
    currentRowIndex
  ) => {
    return memberRows.some(
      (row, rowIndex) =>
        rowIndex !== currentRowIndex &&
        Number(row.userId) === Number(userId)
    );
  };

  const validateMembers = () => {
    if (!project?.id) {
      setErrorMessage("A project must be selected.");
      return false;
    }

    const incompleteRowExists = memberRows.some(
      (row) => !row.userId || !row.role.trim()
    );

    if (incompleteRowExists) {
      setErrorMessage(
        "Please select a user and role for every member."
      );

      return false;
    }

    const selectedUserIds = memberRows.map((row) =>
      Number(row.userId)
    );

    const uniqueUserIds = new Set(selectedUserIds);

    if (selectedUserIds.length !== uniqueUserIds.size) {
      setErrorMessage(
        "The same user cannot be added more than once."
      );

      return false;
    }

    const existingMemberSelected = selectedUserIds.some(
      (userId) => isCurrentProjectMember(userId)
    );

    if (existingMemberSelected) {
      setErrorMessage(
        "One of the selected users is already a member of this project."
      );

      return false;
    }

    return true;
  };

  const handleSaveMembers = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!validateMembers()) {
      return;
    }

    const requestList = memberRows.map((member) => ({
      projectId: Number(project.id),
      userId: Number(member.userId),
      role: member.role.trim(),
    }));

    try {
      setSaving(true);

      await Promise.all(
        requestList.map((requestData) =>
          axios.post(
            PROJECT_MEMBERS_API_URL,
            requestData
          )
        )
      );

      setSuccessMessage(
        "Project members added successfully."
      );

      setMemberRows([createEmptyMember()]);

      await loadModalData();

      if (onMembersSaved) {
        await onMembersSaved();
      }
    } catch (error) {
      console.error(error);

      const backendMessage = error.response?.data;

      if (typeof backendMessage === "string") {
        setErrorMessage(backendMessage);
      } else {
        setErrorMessage(
          "Members could not be added."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = (memberId, newRole) => {
    setCurrentMembers((previousMembers) =>
      previousMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              role: newRole,
            }
          : member
      )
    );
  };

  const handleUpdateRole = async (member) => {
    try {
      setUpdatingMemberId(member.id);
      setErrorMessage("");
      setSuccessMessage("");

      await axios.put(
        `${PROJECT_MEMBERS_API_URL}/${member.id}`,
        {
          projectId: Number(member.projectId),
          userId: Number(member.userId),
          role: member.role.trim(),
        }
      );

      setSuccessMessage(
        "Member role updated successfully."
      );

      await loadModalData();

      if (onMembersSaved) {
        await onMembersSaved();
      }
    } catch (error) {
      console.error(error);

      const backendMessage = error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "Member role could not be updated."
      );
    } finally {
      setUpdatingMemberId(null);
    }
  };

  const handleDeleteMember = async (memberId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingMemberId(memberId);
      setErrorMessage("");
      setSuccessMessage("");

      await axios.delete(
        `${PROJECT_MEMBERS_API_URL}/${memberId}`
      );

      setSuccessMessage(
        "Member removed from the project successfully."
      );

      await loadModalData();

      if (onMembersSaved) {
        await onMembersSaved();
      }
    } catch (error) {
      console.error(error);

      const backendMessage = error.response?.data;

      setErrorMessage(
        typeof backendMessage === "string"
          ? backendMessage
          : "Member could not be removed."
      );
    } finally {
      setDeletingMemberId(null);
    }
  };

  const getUserFullName = (member) => {
    if (member.user) {
      return `${member.user.firstName} ${member.user.lastName}`;
    }

    const user = users.find(
      (item) =>
        Number(item.id) === Number(member.userId)
    );

    if (!user) {
      return `User ${member.userId}`;
    }

    return `${user.firstName} ${user.lastName}`;
  };

  const getUserEmail = (member) => {
    if (member.user?.email) {
      return member.user.email;
    }

    const user = users.find(
      (item) =>
        Number(item.id) === Number(member.userId)
    );

    return user?.email ?? "";
  };

  const availableUsersExist = users.some(
    (user) => !isCurrentProjectMember(user.id)
  );

  const handleClose = () => {
    if (
      saving ||
      updatingMemberId !== null ||
      deletingMemberId !== null
    ) {
      return;
    }

    setMemberRows([createEmptyMember()]);
    setCurrentMembers([]);
    setErrorMessage("");
    setSuccessMessage("");

    onClose();
  };

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title">
                  Manage Project Members
                </h5>

                <small className="text-muted">
                  Project:{" "}
                  <strong>
                    {project?.name ?? "Selected Project"}
                  </strong>
                </small>
              </div>

              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                disabled={
                  saving ||
                  updatingMemberId !== null ||
                  deletingMemberId !== null
                }
              />
            </div>

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

              {loading ? (
                <div className="text-center py-5">
                  <div
                    className="spinner-border"
                    role="status"
                  />

                  <p className="mt-3 mb-0">
                    Loading project members...
                  </p>
                </div>
              ) : (
                <>
                  <section className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h5 className="mb-1">
                          Current Members
                        </h5>

                        <p className="text-muted mb-0">
                          View, update or remove the members
                          assigned to this project.
                        </p>
                      </div>

                      <span className="badge text-bg-primary fs-6">
                        {currentMembers.length} Member
                        {currentMembers.length !== 1
                          ? "s"
                          : ""}
                      </span>
                    </div>

                    {currentMembers.length === 0 ? (
                      <div className="alert alert-light border">
                        No members have been assigned to this
                        project yet.
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover align-middle">
                          <thead className="table-light">
                            <tr>
                              <th>User</th>
                              <th>Email</th>
                              <th style={{ minWidth: "200px" }}>
                                Role
                              </th>
                              <th
                                className="text-center"
                                style={{ minWidth: "190px" }}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {currentMembers.map((member) => (
                              <tr key={member.id}>
                                <td className="fw-semibold">
                                  {getUserFullName(member)}
                                </td>

                                <td>
                                  {getUserEmail(member) || "-"}
                                </td>

                                <td>
                                  <select
                                    className="form-select"
                                    value={member.role}
                                    onChange={(event) =>
                                      handleRoleChange(
                                        member.id,
                                        event.target.value
                                      )
                                    }
                                    disabled={
                                      updatingMemberId ===
                                        member.id ||
                                      deletingMemberId ===
                                        member.id
                                    }
                                  >
                                    {PROJECT_ROLES.map(
                                      (role) => (
                                        <option
                                          key={role}
                                          value={role}
                                        >
                                          {role}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </td>

                                <td className="text-center">
                                  <div className="d-flex justify-content-center gap-2">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-primary"
                                      onClick={() =>
                                        handleUpdateRole(
                                          member
                                        )
                                      }
                                      disabled={
                                        updatingMemberId ===
                                          member.id ||
                                        deletingMemberId ===
                                          member.id
                                      }
                                    >
                                      {updatingMemberId ===
                                      member.id
                                        ? "Updating..."
                                        : "Update Role"}
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() =>
                                        handleDeleteMember(
                                          member.id
                                        )
                                      }
                                      disabled={
                                        deletingMemberId ===
                                          member.id ||
                                        updatingMemberId ===
                                          member.id
                                      }
                                    >
                                      {deletingMemberId ===
                                      member.id
                                        ? "Removing..."
                                        : "Remove"}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  <hr />

                  <section className="mt-4">
                    <div className="mb-3">
                      <h5 className="mb-1">
                        Add New Members
                      </h5>

                      <p className="text-muted mb-0">
                        Select one or more users and assign
                        their project roles.
                      </p>
                    </div>

                    {!availableUsersExist ? (
                      <div className="alert alert-info">
                        All users are already members of this
                        project.
                      </div>
                    ) : (
                      <>
                        {memberRows.map(
                          (member, index) => (
                            <div
                              key={index}
                              className="border rounded p-3 mb-3 bg-light"
                            >
                              <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="mb-0">
                                  New Member {index + 1}
                                </h6>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() =>
                                    removeMemberRow(index)
                                  }
                                  disabled={saving}
                                >
                                  Remove Row
                                </button>
                              </div>

                              <div className="row">
                                <div className="col-md-7 mb-3 mb-md-0">
                                  <label
                                    htmlFor={`user-${index}`}
                                    className="form-label"
                                  >
                                    User
                                  </label>

                                  <select
                                    id={`user-${index}`}
                                    className="form-select"
                                    value={member.userId}
                                    onChange={(event) =>
                                      handleMemberChange(
                                        index,
                                        "userId",
                                        event.target.value
                                      )
                                    }
                                    disabled={saving}
                                  >
                                    <option value="">
                                      Select a user
                                    </option>

                                    {users.map((user) => {
                                      const alreadyMember =
                                        isCurrentProjectMember(
                                          user.id
                                        );

                                      const selectedInAnotherRow =
                                        isUserSelectedInAnotherRow(
                                          user.id,
                                          index
                                        );

                                      if (
                                        alreadyMember ||
                                        selectedInAnotherRow
                                      ) {
                                        return null;
                                      }

                                      return (
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
                                      );
                                    })}
                                  </select>
                                </div>

                                <div className="col-md-5">
                                  <label
                                    htmlFor={`role-${index}`}
                                    className="form-label"
                                  >
                                    Project Role
                                  </label>

                                  <select
                                    id={`role-${index}`}
                                    className="form-select"
                                    value={member.role}
                                    onChange={(event) =>
                                      handleMemberChange(
                                        index,
                                        "role",
                                        event.target.value
                                      )
                                    }
                                    disabled={saving}
                                  >
                                    {PROJECT_ROLES.map(
                                      (role) => (
                                        <option
                                          key={role}
                                          value={role}
                                        >
                                          {role}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>
                              </div>
                            </div>
                          )
                        )}

                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={addMemberRow}
                          disabled={saving}
                        >
                          + Add Another Member
                        </button>
                      </>
                    )}
                  </section>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={
                  saving ||
                  updatingMemberId !== null ||
                  deletingMemberId !== null
                }
              >
                Close
              </button>

              {availableUsersExist && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveMembers}
                  disabled={
                    saving ||
                    loading ||
                    users.length === 0
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
                  ) : (
                    "Save New Members"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="modal-backdrop fade show" />
    </>
  );
}

export default Member;