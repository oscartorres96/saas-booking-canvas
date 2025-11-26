import { Navigate } from 'react-router-dom';
import useAuth from './useAuth';

type PrivateRouteProps = {
  children: JSX.Element;
  roles?: string[];
};

const PrivateRoute = ({ children, roles }: PrivateRouteProps) => {
  const { accessToken, loading, user } = useAuth();

  if (loading) {
    return null;
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user.role && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
