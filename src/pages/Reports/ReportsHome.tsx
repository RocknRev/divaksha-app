import React from "react";
import { Container, Card, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "./ReportsHome.css";

const ReportsHome = () => {
  const navigate = useNavigate();

  const reportItems = [
    { title: "Sales Report", description: "Download sales summary & detailed report", path: "/reports/sales" },
    { title: "Orders Report", description: "Export all order data with filters", path: "/reports/orders" },
    { title: "Users Report", description: "User registrations, activity, buyer/seller info", path: "/reports/users" },
    { title: "Ledger Report", description: "Commission logs, wallet ledger entries", path: "/reports/ledger" }
  ];

  return (
    <Container className="mt-4 mb-5">
      <h2 className="mb-4">Reports Dashboard</h2>

      <Row>
        {reportItems.map((item, index) => (
          <Col md={6} lg={4} className="mb-4" key={index}>
            <Card className="report-card" onClick={() => navigate(item.path)}>
              <Card.Body>
                <h5 className="report-title">{item.title}</h5>
                <p className="text-muted small">{item.description}</p>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default ReportsHome;