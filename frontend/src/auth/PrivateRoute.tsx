import { Navigate, useParams } from 'react-router-dom';
import useAuth from './useAuth';

type PrivateRouteProps = {
  children: JSX.Element;
  roles?: string[];
  requireBusinessMatch?: boolean;
};

const PrivateRoute = ({ children, roles, requireBusinessMatch = false }: PrivateRouteProps) => {
  const { accessToken, loading, user } = useAuth();
  const { businessId } = useParams<{ businessId?: string }>();

  if (loading) {
    return null;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check role authorization
  if (roles && user.role && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // Check businessId match for business role
  if (requireBusinessMatch && businessId) {
    // Owner can access any business
    if (user.role === 'owner') {
      return children;
    }

    // Business role must match the businessId in the route
    if (user.role === 'business' && user.businessId !== businessId) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
