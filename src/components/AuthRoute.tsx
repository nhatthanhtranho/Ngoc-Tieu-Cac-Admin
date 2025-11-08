import { Navigate, useLocation } from "react-router-dom";

interface AuthRouteProps {
  children: React.ReactNode;
}

export default function AuthRoute({ children }: AuthRouteProps) {
  const accessToken = localStorage.getItem("accessToken");
  const location = useLocation();

  if (!accessToken) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }} // lưu trang gốc để quay lại
        replace
      />
    );
  }

  return <>{children}</>;
}
