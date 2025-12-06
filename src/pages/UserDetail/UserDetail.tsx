import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Button, Badge, Container, Table, ListGroup } from 'react-bootstrap';
import { userService } from '../../api/userService';
import { User } from '../../types';
import Loader from '../../components/Loader/Loader';
import Alert from '../../components/Alert/Alert';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './UserDetail.css';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [children, setChildren] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<'activate' | 'deactivate' | null>(null);

  useEffect(() => {
    if (id) {
      loadUser();
      loadChildren();
    }
  }, [id]);

  const loadUser = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.getUserById(parseInt(id));
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const loadChildren = async () => {
    if (!id) return;
    try {
      const allUsers = await userService.getUsers();
      // Only show direct children (single-level)
      const userChildren = allUsers.filter((u) => u.parentId === parseInt(id));
      setChildren(userChildren);
    } catch (err) {
      console.error('Failed to load children:', err);
    }
  };

  const handleActivate = () => {
    setActionType('activate');
    setShowConfirmModal(true);
  };

  const handleDeactivate = () => {
    setActionType('deactivate');
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!user || !actionType) return;

    try {
      if (actionType === 'activate') {
        await userService.activateUser(user.id);
        setSuccess(`User ${user.username} activated successfully`);
      } else {
        await userService.deactivateUser(user.id);
        setSuccess(`User ${user.username} deactivated successfully`);
      }
      setShowConfirmModal(false);
      setActionType(null);
      loadUser();
      loadChildren();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status');
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <Container>
        <Alert variant="danger" message="User not found" />
        <Button onClick={() => navigate('/users')}>Back to Users</Button>
      </Container>
    );
  }

  return (
    <Container className="user-detail-container">
      <Button variant="outline-secondary" onClick={() => navigate('/users')} className="mb-3">
        ← Back to Users
      </Button>

      <h2>User Details</h2>
      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}
      {success && (
        <Alert variant="success" message={success} onClose={() => setSuccess(null)} autoHide />
      )}

      <Card className="mb-4">
        <Card.Header>
          <h4>{user.username}</h4>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            <ListGroup.Item>
              <strong>ID:</strong> {user.id}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Status:</strong>{' '}
              {user.isActive ? (
                <Badge bg="success">Active</Badge>
              ) : (
                <Badge bg="danger">Inactive</Badge>
              )}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Parent ID:</strong> {user.parentId || '-'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Effective Parent ID:</strong> {user.effectiveParentId || '-'}
            </ListGroup.Item>
            <ListGroup.Item>
              <strong>Last Sale At:</strong> {user.lastSaleAt || '-'}
            </ListGroup.Item>
            {user.inactiveSince && (
              <ListGroup.Item>
                <strong>Inactive Since:</strong> {new Date(user.inactiveSince).toLocaleString()}
              </ListGroup.Item>
            )}
            {user.createdAt && (
              <ListGroup.Item>
                <strong>Created At:</strong> {new Date(user.createdAt).toLocaleString()}
              </ListGroup.Item>
            )}
          </ListGroup>
        </Card.Body>
        <Card.Footer>
          {user.isActive ? (
            <Button variant="danger" onClick={handleDeactivate}>
              Deactivate User
            </Button>
          ) : (
            <Button variant="success" onClick={handleActivate}>
              Activate User
            </Button>
          )}
        </Card.Footer>
      </Card>

      <Card>
        <Card.Header>
          <h5>Direct Children</h5>
        </Card.Header>
        <Card.Body>
          {children.length === 0 ? (
            <p>No direct children found.</p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <tr key={child.id}>
                    <td>{child.id}</td>
                    <td>{child.username}</td>
                    <td>
                      {child.isActive ? (
                        <Badge bg="success">Active</Badge>
                      ) : (
                        <Badge bg="danger">Inactive</Badge>
                      )}
                    </td>
                    <td>
                      <Link to={`/users/${child.id}`}>
                        <Button variant="outline-primary" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <ConfirmModal
        show={showConfirmModal}
        title={actionType === 'activate' ? 'Activate User' : 'Deactivate User'}
        message={`Are you sure you want to ${actionType} user ${user.username}?`}
        confirmText={actionType === 'activate' ? 'Activate' : 'Deactivate'}
        variant={actionType === 'activate' ? 'success' : 'danger'}
        onConfirm={confirmAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setActionType(null);
        }}
      />
    </Container>
  );
};

export default UserDetail;

