import React, { useState, useEffect } from 'react';
import { Table, Container, Pagination, Badge } from 'react-bootstrap';
import { shiftHistoryService } from '../../api/shiftHistoryService';
import { ReferralShiftHistory, PagedResponse } from '../../types';
import Loader from '../../components/Loader/Loader';
import Alert from '../../components/Alert/Alert';
import './ShiftHistoryList.css';

const ShiftHistoryList: React.FC = () => {
  const [history, setHistory] = useState<ReferralShiftHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const pageSize = 20;

  useEffect(() => {
    loadHistory();
  }, [currentPage]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: PagedResponse<ReferralShiftHistory> =
        await shiftHistoryService.listShiftHistory(currentPage, pageSize);
      setHistory(response.content);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shift history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Container className="shift-history-list-container">
      <h2>Referral Shift History</h2>
      {error && <Alert variant="danger" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <Loader />
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Affected Child ID</th>
                <th>Inactive User ID</th>
                <th>Previous Effective Parent ID</th>
                <th>New Effective Parent ID</th>
                <th>Changed At</th>
                <th>Reverted</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center">
                    No shift history found
                  </td>
                </tr>
              ) : (
                history.map((entry, index) => (
                  <tr key={`${entry.affectedChildId}-${entry.changedAt}-${index}`}>
                    <td>{entry.affectedChildId}</td>
                    <td>{entry.inactiveUserId}</td>
                    <td>{entry.previousEffectiveParentId}</td>
                    <td>{entry.newEffectiveParentId}</td>
                    <td>{formatDate(entry.changedAt)}</td>
                    <td>
                      {entry.reverted ? (
                        <Badge bg="success">Yes</Badge>
                      ) : (
                        <Badge bg="secondary">No</Badge>
                      )}
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
    </Container>
  );
};

export default ShiftHistoryList;

