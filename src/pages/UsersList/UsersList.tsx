import React, { useState, useEffect, useMemo } from "react";
import { Table, Container, Pagination, Badge } from "react-bootstrap";
import { userService } from "../../api/userService";
import Loader from "../../components/Loader/Loader";
import Alert from "../../components/Alert/Alert";
import { Input } from "../../components/UI/input";
// import { Button } from "../../components/UI/button";


import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./UsersList.css";
import { User } from "../../types";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import Button from "../../components/UI/button";

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 20;

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, [currentPage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.getUsers();
      setUsers(response || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 SEARCH + SORT + PAGINATION
  const filteredUsers = useMemo(() => {
    let data = [...users];

    // Search
    if (search.trim() !== "") {
      data = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Sorting
    if (sortField) {
      data.sort((a, b) => {
        const valA = a[sortField] ?? "";
        const valB = b[sortField] ?? "";

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [users, search, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginated = filteredUsers.slice(
    currentPage * pageSize,
    currentPage * pageSize + pageSize
  );

  const handleActivate = (user: User) => {
    setSelectedUser(user);
    setActionType('activate');
    setShowConfirmModal(true);
  };

  const handleDeactivate = (user: User) => {
    setSelectedUser(user);
    setActionType('deactivate');
    setShowConfirmModal(true);
  };

  const getStatusBadge = (active: boolean) =>
    active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>;


  const confirmAction = async () => {
    if (!selectedUser || !actionType) return;

    try {
      if (actionType === 'activate') {
        await userService.activateUser(selectedUser.id);
        setSuccess(`User "${selectedUser.username}" activated successfully!`);
      } else {
        await userService.deactivateUser(selectedUser.id);
        setSuccess(`User "${selectedUser.username}" deactivated.`);
      }

      setShowConfirmModal(false);
      setSelectedUser(null);
      setActionType(null);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
      setShowConfirmModal(false);
    }
  };

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof User) => {
    if (sortField !== field) return <span className="sort-icon neutral">⇅</span>;
    return sortDirection === "asc" ? (
      <span className="sort-icon asc">▲</span>
    ) : (
      <span className="sort-icon desc">▼</span>
    );
  };

  // 📤 EXPORT TO EXCEL
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredUsers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, "users_list.xlsx");
  };

  // 📄 EXPORT TO PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Users List", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["ID", "Username", "Status", "Parent", "Effective Parent"]],
      body: filteredUsers.map((u) => [
        u.id,
        u.username,
        u.isActive ? "Active" : "Inactive",
        u.parentId || "-",
        u.effectiveParentId || "-",
      ]),
    });

    doc.save("users_list.pdf");
  };

  return (
    <Container className="users-list-container">
      <div className="d-flex justify-content-between align-items-center my-3">
        <h2>User Management</h2>

        <div className="d-flex gap-2 export-buttons">
          <Button onClick={exportToExcel}>📊 Export Excel</Button>
          <Button onClick={exportToPDF}>📄 Export PDF</Button>
          <Button onClick={() => navigate("/users/register")}>+ Add User</Button>
        </div>
      </div>

      <Input
        placeholder="Search users..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setCurrentPage(0);
        }}
        className="mb-3"
      />

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}
      {success && <Alert variant="success" message={success} onClose={() => setSuccess(null)} autoHide />}

      {loading ? (
        <Loader />
      ) : (
        <>
          <Table hover bordered={false} className="modern-table" responsive>
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} className="sortable">
                  ID {getSortIcon("id")}
                </th>

                <th onClick={() => handleSort("username")} className="sortable">
                  Username {getSortIcon("username")}
                </th>

                <th onClick={() => handleSort("isActive")} className="sortable">
                  Status {getSortIcon("isActive")}
                </th>

                <th onClick={() => handleSort("parentId")} className="sortable">
                  Parent {getSortIcon("parentId")}
                </th>

                <th
                  onClick={() => handleSort("effectiveParentId")}
                  className="sortable"
                >
                  Effective Parent {getSortIcon("effectiveParentId")}
                </th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4">
                    No users found
                  </td>
                </tr>
              ) : (
                paginated.map((u) => (
                  <tr key={u.id} className="table-row">
                    <td className="fw-bold">{u.id}</td>
                    <td>{u.username}</td>
                    <td>
                      {u.isActive ? (
                        <span className="badge bg-success">Active</span>
                      ) : (
                        <span className="badge bg-secondary">Inactive</span>
                      )}
                    </td>
                    <td>{u.parentId || "-"}</td>
                    <td>{u.effectiveParentId || "-"}</td>

                    <td>
                      <div className="d-flex gap-2 export-buttons">
                        <Button
                          variant="default"
                          size="sm" onClick={() => navigate(`/users/${u.id}`)} className="btn-default" >
                          View
                        </Button>
                        {u.isActive ? (
                        <Button
                          variant="danger"
                          size="sm" onClick={() => handleDeactivate(u)} className="btn-red" >
                          Deactivate
                        </Button>):(
                        <Button
                          variant="success"
                          size="sm" onClick={() => handleActivate(u)} className="btn-success" >
                          Activate
                        </Button>)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

          {totalPages > 1 && (
            <Pagination className="mt-3">
              <Pagination.First
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(0)}
              />
              <Pagination.Prev
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
              />

              {Array.from({ length: totalPages }, (_, i) => (
                <Pagination.Item
                  key={i}
                  active={i === currentPage}
                  onClick={() => setCurrentPage(i)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}

              <Pagination.Next
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(currentPage + 1)}
              />
              <Pagination.Last
                disabled={currentPage >= totalPages - 1}
                onClick={() => setCurrentPage(totalPages - 1)}
              />
            </Pagination>
          )}
        </>
      )}

      <ConfirmModal
        show={showConfirmModal}
        title={actionType === 'activate' ? 'Activate User' : 'Deactivate User'}
        message={`Are you sure you want to ${actionType} "${selectedUser?.username}"?`}
        confirmText={actionType === 'activate' ? 'Activate' : 'Deactivate'}
        variant={actionType === 'activate' ? 'success' : 'danger'}
        onConfirm={confirmAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setSelectedUser(null);
          setActionType(null);
        }}
      />
    </Container>
  );
};

export default UsersList;
