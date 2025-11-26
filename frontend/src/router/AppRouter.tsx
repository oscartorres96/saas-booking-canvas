import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Admin from '../pages/Admin';
import BookingPage from '../pages/BookingPage';
import BusinessDashboard from '../pages/BusinessDashboard';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import PrivateRoute from '../auth/PrivateRoute';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/:businessSlug" element={<BookingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <BusinessDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/business/:businessId/dashboard"
        element={
          <PrivateRoute roles={['owner', 'business']}>
            <BusinessDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/business/:businessId/booking"
        element={
          <PrivateRoute roles={['owner', 'business', 'client']}>
            <BookingPage />
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
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['owner']}>
            <Admin />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
