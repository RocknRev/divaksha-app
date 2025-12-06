import React, { useState, useEffect, useMemo } from 'react';
import { Container, Table, Button, Badge, Modal, Alert, Pagination } from 'react-bootstrap';
import { Form, useNavigate } from 'react-router-dom';
import { orderService } from '../../api/orderService';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/admin';
import Loader from '../../components/Loader/Loader';
import AlertComponent from '../../components/Alert/Alert';
import './AdminOrders.css';
import { Input } from '../../components/UI/input'; // Component not found, using Form.Control instead
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const AdminOrders: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');  
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 10; 
  
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Order | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin(currentUser)) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, currentPage]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const ordersData = await orderService.listOrders(statusFilter, currentPage, pageSize);
      setOrders(ordersData.content || []);
      setTotalPages(ordersData.totalPages || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // 🔍 SEARCH + SORT + PAGINATION
  const filteredOrders = useMemo(() => {
    let data = [...orders];

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
  }, [orders, search, sortField, sortDirection]);


  const handleApprovePayment = async (order: Order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleRejectPayment = async (order: Order) => {
    setSelectedOrder(order);
    setShowRejectModal(true);
  };

  const handleSort = (field: keyof Order) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const confirmStatusUpdate = async (status: string) => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      setError(null);
      await orderService.updateOrderStatus(selectedOrder.orderId, status);
      if(status=='PAID'){
        setSuccess(`Order #${selectedOrder.orderId} marked as PAID. Commissions will be distributed automatically.`);
        setShowModal(false);
      } else if(status=='REJECTED'){
        setSuccess(`Order #${selectedOrder.orderId} marked as REJECTED.`);
        setShowRejectModal(false);
      }
      setSelectedOrder(null);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  // 📤 EXPORT TO EXCEL
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredOrders);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orders");
    XLSX.writeFile(wb, "orders_list.xlsx");
  };

  // 📄 EXPORT TO PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Orders List", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Order ID", "Seller ID", "Product ID", "Quantity", "Amount", "Delivery Name", "Delivery Phone", "Delivery Address", "Status", "Ordered Placed At"]],
      body: filteredOrders.map((u) => [
        u.orderId ?? "", u.sellerUserId ?? "", u.productId ?? "", u.quantity ?? "1", u.amount ?? "", u.deliveryName ?? "", u.deliveryPhone ?? "", u.deliveryAddress ?? "", u.status ?? "", u.createdAt ?? ""
      ]),
    });

    doc.save("orders_list.pdf");
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return <Badge bg="success">PAID</Badge>;
      case 'PENDING':
        return <Badge bg="warning">PENDING</Badge>;
      case 'REJECTED':
        return <Badge bg="danger">REJECTED</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!isAdmin(currentUser)) {
    return (
      <Container className="admin-orders-container">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>You do not have permission to access this page.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="admin-orders-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Order Management</h2>
        <div className="d-flex gap-2">
          <Button
            variant={statusFilter === 'REJECTED' ? 'danger' : 'outline-danger'}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'warning' : 'outline-warning'}
            onClick={() => {setStatusFilter('PENDING'); setCurrentPage(0);}}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'PAID' ? 'success' : 'outline-success'}
            onClick={() => {setStatusFilter('PAID'); setCurrentPage(0);}}
          >
            Paid
          </Button>
          <Button
            variant={statusFilter === '' ? 'primary' : 'outline-primary'}
            onClick={() => {setStatusFilter(''); setCurrentPage(0);}}
          >
            All Orders
          </Button>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center my-3">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(0);
          }}
          className="mb-3"
        />
        <div className="d-flex gap-2 export-buttons">
          <Button onClick={exportToExcel}>📊 Export Excel</Button>
          <Button onClick={exportToPDF}>📄 Export PDF</Button>
        </div>
      </div>
      {error && <AlertComponent variant="danger" message={error} onClose={() => setError(null)} />}
      {success && <AlertComponent variant="success" message={success} onClose={() => setSuccess(null)} autoHide />}

      {loading ? (
        <Loader />
      ) : (
        <>
          {orders.length === 0 ? (
            <Alert variant="info">
              No {statusFilter ? statusFilter.toLowerCase() : ''} orders found.
            </Alert>
          ) : (
            <>
            <Table striped hover bordered={false} className="modern-table" responsive>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Seller ID</th>
                  <th>Product ID</th>
                  <th>Quantity</th>
                  <th>Amount (₹)</th>
                  <th>Delivery Name</th>
                  <th>Delivery Phone</th>
                  <th>Delivery Address</th>
                  <th>Payment Proof</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.orderId}>
                    <td><strong>{order.orderId}</strong></td>
                    <td>{order.sellerUserId || '-'}</td>
                    <td>{order.productId}</td>
                    <td>{order.quantity || 1}</td>
                    <td><strong>₹{order.amount.toFixed(2)}</strong></td>
                    <td>{order.deliveryName || '-'}</td>
                    <td>{order.deliveryPhone || '-'}</td>
                    <td>{order.deliveryAddress || '-'}</td>
                    <td>
                      {order.paymentProofUrl ? (
                        <img
                          src={order.paymentProofUrl}
                          alt="Proof"
                          style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", cursor: "pointer" }}
                          onClick={() => setPreview(order.paymentProofUrl)}                        />
                      ) : ( '-' )}
                    </td>

                    <td>{getStatusBadge(order.status)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    {order.status === 'PENDING' && (  
                      <td className="">
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleApprovePayment(order)}
                            style={{ margin: "5px" }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRejectPayment(order)}
                            style={{ margin: "5px" }}
                          >
                            Reject
                          </Button>
                        </>
                      </td>
                    )}
                    {order.status === 'PAID' && (
                      <td>
                        <span className="text-muted small">✓ Approved</span>
                      </td>
                    )}
                    {order.status === 'REJECTED' && (
                      <td>
                        <span className="text-muted small">✗ Rejected</span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Modal show={!!preview} onHide={() => setPreview(null)}>
              <img src={preview || ''} style={{ width: "100%" }} />
            </Modal>
            {totalPages > 1 && (
              <Pagination className="mt-3">
                <Pagination.First disabled={currentPage === 0} onClick={() => setCurrentPage(0)} />
                <Pagination.Prev disabled={currentPage === 0} onClick={() => setCurrentPage(currentPage - 1)} />
  
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Item key={i} active={i === currentPage} onClick={() => setCurrentPage(i)}>
                    {i + 1}
                  </Pagination.Item>
                ))}
  
                <Pagination.Next disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(currentPage + 1)} />
                <Pagination.Last disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(totalPages - 1)} />
              </Pagination>
            )}
            </>
          )}
        </>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Approve Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <p>Are you sure you want to approve payment for this order?</p>
              <div className="mb-3 p-3 bg-light rounded">
                <p className="mb-1"><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                <p className="mb-1"><strong>Buyer ID:</strong> {selectedOrder.buyerId}</p>
                <p className="mb-1"><strong>Quantity:</strong> {selectedOrder.quantity || 1}</p>
                <p className="mb-1"><strong>Amount:</strong> ₹{selectedOrder.amount.toFixed(2)}</p>
                <p className="mb-1"><strong>Payment Proof:</strong> <code>{selectedOrder.paymentProofUrl}</code></p>
                {selectedOrder.deliveryName && (
                  <>
                    <hr className="my-2" />
                    <p className="mb-1"><strong>Delivery Name:</strong> {selectedOrder.deliveryName}</p>
                    <p className="mb-1"><strong>Delivery Phone:</strong> {selectedOrder.deliveryPhone}</p>
                    <p className="mb-0"><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}</p>
                  </>
                )}
              </div>
              <Alert variant="info" className="mb-0">
                <strong>Note:</strong> Once approved, the order will be marked as PAID and commissions will be
                distributed automatically by the backend.
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={updating}>
            Cancel
          </Button>
          <Button variant="success" onClick={()=>confirmStatusUpdate('PAID')} disabled={updating}>
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Updating...
              </>
            ) : (
              'Approve Payment'
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showRejectModal} onHide={() => setShowRejectModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reject Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <p>Are you sure you want to reject payment for this order?</p>
              <div className="mb-3 p-3 bg-light rounded">
                <p className="mb-1"><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                <p className="mb-1"><strong>Buyer ID:</strong> {selectedOrder.buyerId}</p>
                <p className="mb-1"><strong>Quantity:</strong> {selectedOrder.quantity || 1}</p>
                <p className="mb-1"><strong>Amount:</strong> ₹{selectedOrder.amount.toFixed(2)}</p>
                <p className="mb-1"><strong>Payment Proof:</strong> <code>{selectedOrder.paymentProofUrl}</code></p>
                {selectedOrder.deliveryName && (
                  <>
                    <hr className="my-2" />
                    <p className="mb-1"><strong>Delivery Name:</strong> {selectedOrder.deliveryName}</p>
                    <p className="mb-1"><strong>Delivery Phone:</strong> {selectedOrder.deliveryPhone}</p>
                    <p className="mb-0"><strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}</p>
                  </>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRejectModal(false)} disabled={updating}>
            Cancel
          </Button>
          <Button variant="danger" onClick={()=>confirmStatusUpdate('REJECTED')} disabled={updating}>
            {updating ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Updating...
              </>
            ) : (
              'Reject Payment'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminOrders;

