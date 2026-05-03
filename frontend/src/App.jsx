import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import LoadList from './pages/LoadList';
import LoadDetail from './pages/LoadDetail';
import PostLoad from './pages/PostLoad';
import Profile from './pages/Profile';
import OperationsHistory from './pages/OperationsHistory';
import Tracking from './pages/Tracking';
import AdminDashboard from './pages/AdminDashboard';
import './App.css';

const PrivateRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('userToken');
  const userRole = localStorage.getItem('userRole');
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (allowedRoles && !allowedRoles.includes(userRole)) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* General Protected */}
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/operations-history" element={<PrivateRoute><OperationsHistory /></PrivateRoute>} />
        <Route path="/tracking" element={<PrivateRoute><Tracking /></PrivateRoute>} />

        {/* Truck Owner Only */}
        <Route path="/loads" element={<PrivateRoute allowedRoles={['truck_owner']}><LoadList /></PrivateRoute>} />
        <Route path="/loads/:id" element={<PrivateRoute allowedRoles={['truck_owner']}><LoadDetail /></PrivateRoute>} />

        {/* Company Only */}
        <Route path="/post-load" element={<PrivateRoute allowedRoles={['company']}><PostLoad /></PrivateRoute>} />

        {/* Admin Only */}
        <Route path="/admin" element={<PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;
