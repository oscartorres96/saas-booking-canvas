import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from '../pages/admin/AdminDashboard';
import BookingPage from '../pages/BookingPage';
import BusinessDashboard from '../pages/business/BusinessDashboard';
import BusinessBookingPage from '../pages/business/BusinessBookingPage';
import Landing from '../pages/Landing';
import MyBookings from '../pages/MyBookings';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import PrivateRoute from '../auth/PrivateRoute';
import Onboarding from '../pages/Onboarding';
import UserManual from '../pages/UserManual';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentCancel from '../pages/PaymentCancel';

const AppRouter = () => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/:businessSlug" element={<BookingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/my-bookings" element={<MyBookings />} />
      <Route path="/manual" element={<UserManual />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />

      <Route
        path="/onboarding"
        element={
          <PrivateRoute roles={['owner', 'business']}>
            <Onboarding />
          </PrivateRoute>
        }
      />

      {/* Admin Dashboard - Owner only */}
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['owner']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      {/* Business Dashboard - Owner or matching Business */}
      <Route
        path="/business/:businessId/dashboard"
        element={
          <PrivateRoute roles={['owner', 'business']} requireBusinessMatch={true}>
            <BusinessDashboard />
          </PrivateRoute>
        }
      />

      {/* Business Booking Page - Any authenticated user */}
      <Route path="/business/:businessId/booking" element={<BusinessBookingPage />} />

      {/* Legacy routes for backward compatibility */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <BusinessDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/services"
        element={
          <PrivateRoute roles={['owner', 'business']}>
            <BusinessDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <PrivateRoute>
            <BookingPage />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
