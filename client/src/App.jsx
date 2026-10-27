import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import NewComplaintPage from './pages/NewComplaintPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminComplaintsPage from './pages/AdminComplaintsPage';
import AdminComplaintDetailPage from './pages/AdminComplaintDetailPage';
import LandingPage from './pages/LandingPage';
import NotFoundPage from './pages/NotFoundPage';

// Root Route: Public Landing Page for visitors, Dashboard for logged-in users
function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public & Authentication */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints/new"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <NewComplaintPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <MyComplaintsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['student', 'admin']}>
                    <ComplaintDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Administrator Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminComplaintsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminComplaintDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Error & Unauthorized */}
              <Route path="/unauthorized" element={<NotFoundPage isUnauthorized={true} />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
