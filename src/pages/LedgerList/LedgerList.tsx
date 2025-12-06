  import React, { useState, useEffect, useMemo } from "react";
  import { Table, Container, Pagination } from "react-bootstrap";
  import { ledgerService } from "../../api/ledgerService";
  import { CommissionLedger, PagedResponse } from "../../types";
  import Loader from "../../components/Loader/Loader";
  import Alert from "../../components/Alert/Alert";
  import "./LedgerList.css";
  import { useAuth } from "../../context/AuthContext";

  import { Input } from "../../components/UI/input";
  import { Button } from "../../components/UI/button";

  import * as XLSX from "xlsx";
  import jsPDF from "jspdf";
  import autoTable from "jspdf-autotable";

  const LedgerList: React.FC = () => {
    const { currentUser } = useAuth();
    const [ledger, setLedger] = useState<CommissionLedger[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [search, setSearch] = useState("");
    const [sortField, setSortField] = useState<keyof CommissionLedger | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const pageSize = 20;

    useEffect(() => {
      loadLedger();
    }, [currentPage]);

    const loadLedger = async () => {
      try {
        setLoading(true);
        setError(null);

        const response: PagedResponse<CommissionLedger> = await ledgerService.listLedger(
          currentPage, pageSize, currentUser?.id
        );

        setLedger(response.content || []);
        setTotalPages(response.totalPages || 0);

      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load ledger");
      } finally {
        setLoading(false);
      }
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString();
    };

    // 🔍 SEARCH + SORTING (frontend)
    const filteredLedger = useMemo(() => {
      let data = [...ledger];

      // Search
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
    }, [ledger, search, sortField, sortDirection]);

    const handleSort = (field: keyof CommissionLedger) => {
      if (sortField === field) {
        setSortDirection(sortDirection === "asc" ? "desc" : "asc");
      } else {
        setSortField(field);
        setSortDirection("asc");
      }
    };

    const getSortIcon = (field: keyof CommissionLedger) => {
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
      const ws = XLSX.utils.json_to_sheet(filteredLedger);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger");
      XLSX.writeFile(wb, "commission_ledger.xlsx");
    };

    const exportToPDF = () => {
      const doc = new jsPDF();
      doc.text("Commission Ledger", 14, 10);

      autoTable(doc, {
        startY: 20,
        head: [["Sale ID", "Beneficiary", "Seller", "Level", "%", "Amount", "Created"]],
        body: filteredLedger.map((entry) => [
          entry.saleId,
          entry.beneficiaryUserId,
          entry.sellerUserId,
          entry.level,
          entry.percentage,
          entry.amount.toFixed(2),
          formatDate(entry.createdAt),
        ]),
      });

      doc.save("commission_ledger.pdf");
    };

    return (
      <Container className="ledger-list-container">

        <div className="d-flex justify-content-between align-items-center my-3">
          <h2>Commission Ledger</h2>

          <div className="d-flex gap-2 export-buttons">
            <Button onClick={exportToExcel}>📊 Export Excel</Button>
            <Button onClick={exportToPDF}>📄 Export PDF</Button>
          </div>
        </div>

        <Input
          placeholder="Search in all fields..."
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
                  <th onClick={() => handleSort("saleId")} className={sortField === "saleId" ? "sortable active-sort" : "sortable"}>
                    Sale ID {getSortIcon("saleId")}
                  </th>

                  <th onClick={() => handleSort("beneficiaryUserId")} className={sortField === "beneficiaryUserId" ? "sortable active-sort" : "sortable"}>
                    Beneficiary {getSortIcon("beneficiaryUserId")}
                  </th>

                  <th onClick={() => handleSort("sellerUserId")} className={sortField === "sellerUserId" ? "sortable active-sort" : "sortable"}>
                    Seller {getSortIcon("sellerUserId")}
                  </th>

                  <th onClick={() => handleSort("level")} className={sortField === "level" ? "sortable active-sort" : "sortable"}>
                    Level {getSortIcon("level")}
                  </th>

                  <th onClick={() => handleSort("percentage")} className={sortField === "percentage" ? "sortable active-sort" : "sortable"}>
                    % {getSortIcon("percentage")}
                  </th>

                  <th onClick={() => handleSort("amount")} className={sortField === "amount" ? "sortable active-sort" : "sortable"}>
                    Amount {getSortIcon("amount")}
                  </th>

                  <th onClick={() => handleSort("createdAt")} className={sortField === "createdAt" ? "sortable active-sort" : "sortable"}>
                    Created {getSortIcon("createdAt")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 empty-row">No ledger entries found</td>
                  </tr>
                ) : (
                  filteredLedger.map((entry, index) => (
                    <tr key={`${entry.saleId}-${index}`} className="table-row">
                      <td className="col-id">{entry.saleId}</td>
                      <td className="col-user">{entry.beneficiaryUserId}</td>
                      <td className="col-user">{entry.sellerUserId}</td>
                      <td className="col-level">Lvl {entry.level}</td>
                      <td className="col-percent">{entry.percentage}%</td>
                      <td className="col-amount">₹{entry.amount.toFixed(2)}</td>
                      <td className="col-date">{formatDate(entry.createdAt)}</td>
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
      </Container>
    );
  };

  export default LedgerList;