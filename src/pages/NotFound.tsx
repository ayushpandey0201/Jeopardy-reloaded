
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-jeopardy-navy to-jeopardy-dark">
      <div className="text-center">
        <h1 className="text-6xl font-jeopardy text-jeopardy-gold mb-4">404</h1>
        <p className="text-2xl text-white mb-8">Oops! Page not found</p>
        <Button onClick={() => navigate("/")} className="jeopardy-btn">
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
