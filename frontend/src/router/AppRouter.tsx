import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import AdminDashboard from '../pages/admin/AdminDashboard';
import BusinessDashboard from '../pages/business/BusinessDashboard';
import BusinessBookingPage from '../pages/business/BusinessBookingPage';
import Landing from '../pages/Landing';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import PrivateRoute from '../auth/PrivateRoute';
import Onboarding from '../pages/Onboarding';
import UserManual from '../pages/UserManual';
import PaymentSuccess from '../pages/PaymentSuccess';
import PaymentCancel from '../pages/PaymentCancel';
import GetStarted from '../pages/GetStarted';
import ActivateAccount from '../pages/ActivateAccount';

const MyBookingsRedirect = () => {
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get('businessId');
  const email = searchParams.get('email');
  if (businessId) {
    return <Navigate to={`/business/${businessId}/booking?view=dashboard${email ? `&email=${email}` : ''}`} replace />;
  }
  return <Navigate to="/" replace />;
};

const AppRouter = () => (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route path="/activate/:token" element={<ActivateAccount />} />
      <Route path="/my-bookings" element={<MyBookingsRedirect />} />
      <Route path="/manual" element={<UserManual />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/cancel" element={<PaymentCancel />} />
      <Route path="/get-started" element={<GetStarted />} />

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

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
