import React, { useState, useEffect, useMemo } from "react";
import { Table, Container, Pagination } from "react-bootstrap";
import { saleService } from "../../api/saleService";
import Loader from "../../components/Loader/Loader";
import Alert from "../../components/Alert/Alert";
import { Input } from "../../components/UI/input";
import { Button } from "../../components/UI/button";

import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import "./SalesList.css";
import { Sale } from "../../types";

const SalesList: React.FC = () => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const pageSize = 20;

  useEffect(() => {
    loadSales();
  }, [currentPage]);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await saleService.listSales(currentPage, pageSize);
      setSales(response.content || []);
      setTotalPages(response.totalPages || 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    let data = [...sales];

    if (search.trim() !== "") {
      data = data.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    if (sortField) {
      data.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [sales, search, sortField, sortDirection]);

  const handleSort = (field: keyof Sale) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Sale) => {
    if (sortField !== field) {
      return <span className="sort-icon neutral">⇅</span>;
    }
    return sortDirection === "asc" ? (
      <span className="sort-icon asc">▲</span>
    ) : (
      <span className="sort-icon desc">▼</span>
    );
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredSales);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "sales_list.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Sales List", 14, 10);

    autoTable(doc, {
      startY: 20,
      head: [["Sale ID", "User", "Amount", "Status", "Created"]],
      body: filteredSales.map((entry) => [
        entry.id,
        entry.userId,
        entry.totalAmount,
        entry.status,
        new Date(entry.createdAt).toLocaleString(),
      ]),
    });

    doc.save("sales_list.pdf");
  };

  return (
    <Container className="ledger-list-container">

      <div className="d-flex justify-content-between align-items-center my-3">
        <h2>Sales List</h2>

        <div className="d-flex gap-2 export-buttons">
          <Button onClick={exportToExcel}>📊 Export Excel</Button>
          <Button onClick={exportToPDF}>📄 Export PDF</Button>
        </div>
      </div>

      <Input
        placeholder="Search sales..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-3"
      />

      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <Loader />
      ) : (
        <>
          <Table hover bordered={false} className="modern-table" responsive>
            <thead>
              <tr>
                <th onClick={() => handleSort("id")} className={sortField === "id" ? "sortable active-sort" : "sortable"}>
                  Sale ID {getSortIcon("id")}
                </th>
                <th onClick={() => handleSort("sellerUserId")} className={sortField === "sellerUserId" ? "sortable active-sort" : "sortable"}>
                  Seller ID {getSortIcon("sellerUserId")}
                </th>
                <th onClick={() => handleSort("totalAmount")} className={sortField === "totalAmount" ? "sortable active-sort" : "sortable"}>
                  Amount (₹) {getSortIcon("totalAmount")}
                </th>
                <th onClick={() => handleSort("createdAt")} className={sortField === "createdAt" ? "sortable active-sort" : "sortable"}>
                  Created At{getSortIcon("createdAt")}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">No sales found</td>
                </tr>
              ) : (
                filteredSales.map((entry, i) => (
                  <tr key={i}>
                    <td>{entry.id}</td>
                    <td>{entry.sellerUserId}</td>
                    <td>₹{entry.totalAmount}</td>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>

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
    </Container>
  );
};

export default SalesList;