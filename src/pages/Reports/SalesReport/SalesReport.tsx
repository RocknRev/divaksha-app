import React, { useState } from "react";
// import { Container, Button, Row, Col, Form, Table, Alert } from "react-bootstrap";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import "./SalesReport.css";

const SalesReport = () => {
//   const [fromDate, setFromDate] = useState("");
//   const [toDate, setToDate] = useState("");
//   const [data, setData] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const fetchData = async () => {
//     if (!fromDate || !toDate) return alert("Select both dates");

//     setLoading(true);

//     try {
//       const response = await fetch(
//         `/api/reports/sales?from=${fromDate}&to=${toDate}`
//       );
//       const result = await response.json();

//       setData(result.data || []);
//       setSummary(result.summary || { totalSales: 0, totalOrders: 0 });

//     } catch (error) {
//       console.error(error);
//     }

//     setLoading(false);
//   };

//   const exportExcel = () => {
//     const ws = XLSX.utils.json_to_sheet(data);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
//     XLSX.writeFile(wb, "sales_report.xlsx");
//   };

//   const exportPdf = () => {
//     const doc = new jsPDF();
//     doc.text("Sales Report", 14, 10);

//     autoTable(doc, {
//       startY: 20,
//       head: [["Order ID", "Amount", "User", "Date"]],
//       body: data.map((d) => [d.orderId, d.amount, d.userId, d.date])
//     });

//     doc.save("sales_report.pdf");
//   };

//   return (
//     <Container className="mt-4 mb-5">
//       <h2 className="mb-4">Sales Report</h2>

//       <Row className="mb-3">
//         <Col md={4}>
//           <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
//         </Col>
//         <Col md={4}>
//           <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
//         </Col>
//         <Col md={4}>
//           <Button onClick={fetchData}>Fetch Report</Button>
//         </Col>
//       </Row>

//       {summary && (
//         <Alert variant="info">
//           <strong>Total Sales:</strong> ₹{summary.totalSales} &nbsp; | &nbsp;
//           <strong>Total Orders:</strong> {summary.totalOrders}
//         </Alert>
//       )}

//       <div className="d-flex gap-2 mb-3">
//         <Button variant="success" onClick={exportExcel}>Export Excel</Button>
//         <Button variant="danger" onClick={exportPdf}>Export PDF</Button>
//       </div>

//       <Table striped bordered hover>
//         <thead>
//           <tr>
//             <th>Order ID</th>
//             <th>Amount</th>
//             <th>User</th>
//             <th>Date</th>
//           </tr>
//         </thead>
//         <tbody>
//           {data.map((d, i) => (
//             <tr key={i}>
//               <td>{d.orderId}</td>
//               <td>₹{d.amount}</td>
//               <td>{d.userId}</td>
//               <td>{d.date}</td>
//             </tr>
//           ))}
//         </tbody>
//       </Table>
//     </Container>
//   );
};

export default SalesReport;