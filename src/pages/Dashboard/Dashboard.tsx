import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Badge, Table, Tabs, Tab, Form } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../api/userService';
import { ledgerService } from '../../api/ledgerService';
import { User, ReferralTreeNode, CommissionLedger, PagedResponse } from '../../types';
import Loader from '../../components/Loader/Loader';
import Alert from '../../components/Alert/Alert';
import ReferralTree from '../../components/ReferralTree/ReferralTree';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [referralTree, setReferralTree] = useState<ReferralTreeNode | null>(null);
  const [commissions, setCommissions] = useState<CommissionLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCommissions, setTotalCommissions] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/users/register');
      return;
    }
    loadUserData();
  }, [currentUser, navigate]);

  const loadUserData = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const userData = await userService.getUserById(currentUser.id);
      setUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadReferralTree = async () => {
    if (!currentUser) return;
    try {
      setTreeLoading(true);
      const tree = await userService.getReferralTree(currentUser.id);
      setReferralTree(tree);
    } catch (err) {
      console.error('Failed to load referral tree:', err);
    } finally {
      setTreeLoading(false);
    }
  };

  const loadCommissions = async () => {
    if (!currentUser) return;
    try {
      setCommissionsLoading(true);
      const response: PagedResponse<CommissionLedger> = await ledgerService.getUserLedger(
        currentUser.id,
        0,
        100
      );
      setCommissions(response.content || []);
      const total = response.content.reduce((sum, entry) => sum + entry.amount, 0);
      setTotalCommissions(total);
    } catch (err) {
      console.error('Failed to load commissions:', err);
    } finally {
      setCommissionsLoading(false);
    }
  };

  const copyAffiliateLink = () => {
    if (user?.affiliateCode) {
      navigator.clipboard.writeText(`${window.location.origin}/aff/${user.affiliateCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareAffiliateLink = () => {
    if (user?.affiliateCode) {
      if (navigator.share) {
        navigator.share({
          title: 'Join Divaksha',
          text: 'Check out this amazing opportunity!',
          url: `${window.location.origin}/aff/${user.affiliateCode}`,
        });
      } else {
        copyAffiliateLink();
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return (
      <Container>
        <Alert variant="danger" message="User not found" />
      </Container>
    );
  }

  return (
    <Container className="dashboard-container">
      <div className="dashboard-header mb-4">
        <Row className="align-items-center">
          <Col>
            <h2 className="mb-0">Welcome, {user.username}!</h2>
            <p className="text-muted mb-0">Your Dashboard</p>
          </Col>
          <Col xs="auto">
            <Button variant="outline-danger" onClick={logout}>
              Logout
            </Button>
          </Col>
        </Row>
      </div>

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      <Row className="mb-4">
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="stat-icon">💰</div>
              <h3 className="stat-value">₹{totalCommissions.toFixed(2)}</h3>
              <p className="stat-label">Total Commissions</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="stat-icon">👥</div>
              <h3 className="stat-value">{referralTree ? countReferrals(referralTree) : '-'}</h3>
              <p className="stat-label">Total Referrals</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="stat-card h-100">
            <Card.Body>
              <div className="stat-icon">{user.isActive ? '✅' : '⏸️'}</div>
              <h3 className="stat-value">
                {user.isActive ? (
                  <Badge bg="success">Active</Badge>
                ) : (
                  <Badge bg="secondary">Inactive</Badge>
                )}
              </h3>
              <p className="stat-label">Account Status</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">📋 Your Referral Link</h5>
            </Card.Header>
            <Card.Body>
              {user.referralLink ? (
                <div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Share this link to earn commissions:</Form.Label>
                    <div className="input-group">
                      <Form.Control type="text" value={user.referralLink} readOnly />
                      <Button
                        variant={copied ? 'success' : 'primary'}
                        onClick={copyReferralLink}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </Button>
                      <Button variant="outline-primary" onClick={shareReferralLink}>
                        📤 Share
                      </Button>
                    </div>
                  </Form.Group>
                  <p className="text-muted small mb-0">
                    When someone registers using your link and makes a purchase, you earn commissions!
                  </p>
                </div>
              ) : (
                <p className="text-muted">Referral link will be generated after registration.</p>
              )}
            </Card.Body>
          </Card>
        </Col> */}
        <Col md={6}>
          <Card className="mb-4 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">🔗 Your Affiliate Link</h5>
            </Card.Header>
            <Card.Body>
              {user.affiliateCode ? (
                <div>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Share this link for anonymous visitors:</Form.Label>
                    <div className="input-group">
                      <Form.Control 
                        type="text" 
                        value={`${window.location.origin}/aff/${user.affiliateCode}`} 
                        readOnly 
                      />
                      <Button
                        variant={copied ? 'success' : 'success'}
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/aff/${user.affiliateCode}`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? '✓ Copied!' : '📋 Copy'}
                      </Button>
                    </div>
                  </Form.Group>
                  <p className="text-muted small mb-0">
                    Visitors who click this link will be tracked for 30 days. If they purchase, you earn commission!
                  </p>
                </div>
              ) : (
                <p className="text-muted">Affiliate code will be generated after registration.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="profile" className="mb-3">
        <Tab eventKey="profile" title="Profile">
          <Card>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>User ID:</strong> {user.id}</p>
                  <p><strong>Username:</strong> {user.username}</p>
                  {user.email && <p><strong>Email:</strong> {user.email}</p>}
                  {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
                  <p>
                    <strong>Status:</strong>{' '}
                    {user.isActive ? (
                      <Badge bg="success">Active</Badge>
                    ) : (
                      <Badge bg="secondary">Inactive</Badge>
                    )}
                  </p>
                </Col>
                <Col md={6}>
                  {user.parentId && <p><strong>Referrer ID:</strong> {user.parentId}</p>}
                  {user.effectiveParentId && (
                    <p><strong>Effective Parent ID:</strong> {user.effectiveParentId}</p>
                  )}
                  {user.lastSaleAt && (
                    <p>
                      <strong>Last Sale:</strong> {new Date(user.lastSaleAt).toLocaleString()}
                    </p>
                  )}
                  {user.createdAt && (
                    <p>
                      <strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="commissions" title="Commissions" onEnter={loadCommissions}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5>Commission History</h5>
                <Badge bg="success" className="fs-6">
                  Total: ₹{totalCommissions.toFixed(2)}
                </Badge>
              </div>
              {commissionsLoading ? (
                <Loader />
              ) : commissions.length === 0 ? (
                <p className="text-muted text-center py-4">No commissions yet. Start referring to earn!</p>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Sale ID</th>
                      <th>Level</th>
                      <th>Percentage</th>
                      <th>Amount (₹)</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((entry, index) => (
                      <tr key={`${entry.saleId}-${index}`}>
                        <td>{entry.saleId}</td>
                        <td>
                          <Badge bg="info">Level {entry.level}</Badge>
                        </td>
                        <td>{entry.percentage}%</td>
                        <td className="fw-bold text-success">₹{entry.amount.toFixed(2)}</td>
                        <td>{new Date(entry.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="tree" title="Referral Tree" onEnter={loadReferralTree}>
          <Card>
            <Card.Body>
              {treeLoading ? (
                <Loader />
              ) : referralTree ? (
                <ReferralTree tree={referralTree} />
              ) : (
                <p className="text-muted" onClick={loadReferralTree}>Click to load referral tree</p>
              )}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
};

const countReferrals = (tree: ReferralTreeNode): number => {
  let count = 0;
  const traverse = (node: ReferralTreeNode) => {
    if (node.children) {
      count += node.children.length;
      node.children.forEach(traverse);
    }
  };
  traverse(tree);
  return count;
};

export default Dashboard;

