import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
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
import ProductDetails from './pages/ProductDetails/ProductDetails';
import Cart from './pages/Cart/Cart';
import ContactUs from './pages/ContactUs/ContactUs';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import LedgerList from './pages/LedgerList/LedgerList';
import ShiftHistoryList from './pages/ShiftHistoryList/ShiftHistoryList';
import './App.css';
import ReportsHome from './pages/Reports/ReportsHome';
import { Toaster } from './components/UI/toaster';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Router>
        <div className="App min-h-screen">
          <Navbar />
          {/* Background image */}
          <div className='app-body'>
          {/* <div
            className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)]"/> */}
          <div
            className="pointer-events-none absolute inset-0 z-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/img5.jpg')",
              opacity: 0.07,
            }}
          />

          <div className="relative min-h-screen">
            
            {/* App pages */}
            <main className="relative z-10 app-content">
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
                <Route path="/products/:productId" element={<ProductDetails />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/ledger" element={<LedgerList />} />
                <Route path="/shift-history" element={<ShiftHistoryList />} />
                <Route path="/reports" element={<ReportsHome />} />
              </Routes>
            </main>
          </div>

          <Toaster />
          </div>
        </div>
      </Router>

      </CartProvider>
    </AuthProvider>
  );
}

export default App;

