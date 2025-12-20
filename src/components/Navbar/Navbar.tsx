import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown, Badge } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { isAdmin } from '../../utils/admin';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, logout } = useAuth();
  const { getCartItemCount } = useCart();
  const cartItemCount = getCartItemCount();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <BootstrapNavbar bg='dark' variant='dark' fixed="top" expand="lg" className="navbar-custom navbar-light">
      <Container>
        <BootstrapNavbar.Brand
          as={Link}
          to="/"
          className="navbar-brand d-flex align-items-center gap-2"
        >
          <img
            src="/navimg.png"
            alt="Divaksha logo"
            className="navbar-logo"
          />
          <span className="navbar-title">Divaksha</span>
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" className={isActive('/') ? 'active' : ''}>
              Home
            </Nav.Link>
            <Nav.Link as={Link} to="/products" className={isActive('/products') ? 'active' : ''}>
              Products
            </Nav.Link>
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                  Dashboard
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className={isActive('/register') ? 'active' : ''}>
                  Register
                </Nav.Link>
                
                <Nav.Link as={Link} to="/sales" className={isActive('/sales') ? 'active' : ''}>
                  Sales
                </Nav.Link>
                <Nav.Link as={Link} to="/ledger" className={isActive('/ledger') ? 'active' : ''}>
                  Ledger
                </Nav.Link>
              </>
            ) : (
              <>
                {/* <Nav.Link as={Link} to="/login" className={isActive('/login') ? 'active' : ''}>
                  Login
                </Nav.Link> */}
              </>
            )}
            {isAuthenticated && isAdmin(currentUser) && (
              <>
                <Nav.Link as={Link} to="/admin/orders" className={isActive('/admin/orders') ? 'active' : ''}>
                  Admin Orders
                </Nav.Link>
                <Nav.Link as={Link} to="/users" className={isActive('/users') ? 'active' : ''}>
                  User Managerment
                </Nav.Link>
                <Nav.Link as={Link} to="/reports" className={isActive('/reports') ? 'active' : ''}>
                  Reports
                </Nav.Link>
              </>
            )}
          </Nav>
          <Nav>
            <Nav.Link as={Link} to="/cart" className={isActive('/cart') ? 'active' : ''}>
              🛒 Cart
              {cartItemCount > 0 && (
                <Badge bg="success" className="ms-1" pill>
                  {cartItemCount}
                </Badge>
              )}
            </Nav.Link>
            <Nav.Link as={Link} to="/contact" className={isActive('/contact') ? 'active' : ''}>
              Contact Us
            </Nav.Link>
            {isAuthenticated && currentUser ? (
              <NavDropdown title={`👤 ${currentUser.username}`} id="user-dropdown" align="end">
                <NavDropdown.Item as={Link} to="/dashboard">
                  Dashboard
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to={`/users/${currentUser.id}`}>
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  Login
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  Register
                </Nav.Link>
              </>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;

