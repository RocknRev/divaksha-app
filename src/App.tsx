import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import Home from './pages/Home/Home';
import Dashboard from './pages/Dashboard/Dashboard';
import Login from './pages/Login/Login';
import UsersList from './pages/UsersList/UsersList';
import UserDetail from './pages/UserDetail/UserDetail';
import RegisterUser from './pages/RegisterUser/RegisterUser';
import AffiliateLanding from './pages/AffiliateLanding/AffiliateLanding';
import SalesList from './pages/SalesList/SalesList';
import OrdersPage from './pages/OrdersPage/OrdersPage';
import AdminOrders from './pages/AdminOrders/AdminOrders';
import ProductsList from './pages/ProductsList/ProductsList';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LedgerList from './pages/LedgerList/LedgerList';
import ShiftHistoryList from './pages/ShiftHistoryList/ShiftHistoryList';
import './App.css';
import ReportsHome from './pages/Reports/ReportsHome';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterUser />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/aff/:code" element={<AffiliateLanding />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/users/register" element={<RegisterUser />} />
            <Route path="/users/:id" element={<UserDetail />} />
            <Route path="/sales" element={<SalesList />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:productId" element={<OrdersPage />} />
            <Route
              path="/admin/orders"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminOrders />
                </ProtectedRoute>
              }
            />
            <Route path="/products" element={<ProductsList />} />
            <Route path="/aff/:code" element={<AffiliateLanding />} />
            <Route path="/ledger" element={<LedgerList />} />
            <Route path="/shift-history" element={<ShiftHistoryList />} />
            <Route path="/reports" element={<ReportsHome />} />
            {/* <Route path="/reports/sales" element={<SalesReport />} />
            <Route path="/reports/orders" element={<OrdersReport />} />
            <Route path="/reports/users" element={<UsersReport />} />
            <Route path="/reports/ledger" element={<LedgerReport />} /> */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

