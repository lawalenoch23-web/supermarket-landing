import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import Home from "./pages/Home";
import TrackOrder from "./pages/TrackOrder";
import ContactUs from "./pages/ContactUs";
import Manager from "./pages/Manager";
import Delivery from './pages/Delivery';
import Staff from './pages/Staff';
import Login from './pages/Login';
import ThemeProvider from './components/ThemeProvider';

const isValidSession = (sessionKey: string, timeKey: string, duration: number) => {
  const session = localStorage.getItem(sessionKey);
  const sessionTime = localStorage.getItem(timeKey);
  if (!session || !sessionTime) return false;
  return new Date().getTime() - parseInt(sessionTime) < duration;
};

const ProtectedRoute = ({
  element,
  sessionKey,
  timeKey,
  duration,
}: {
  element: JSX.Element;
  sessionKey: string;
  timeKey: string;
  duration: number;
}) => {
  return isValidSession(sessionKey, timeKey, duration)
    ? element
    : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/track" element={<ThemeProvider><TrackOrder /></ThemeProvider>} />
          <Route path="/contact" element={<ThemeProvider><ContactUs /></ThemeProvider>} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/manager"
            element={
              <ProtectedRoute
                element={<Manager />}
                sessionKey="manager_session"
                timeKey="manager_session_time"
                duration={24 * 60 * 60 * 1000}
              />
            }
          />
          <Route
            path="/staff"
            element={
              <ProtectedRoute
                element={<Staff />}
                sessionKey="staff_session"
                timeKey="staff_session_time"
                duration={12 * 60 * 60 * 1000}
              />
            }
          />
          <Route
            path="/delivery"
            element={
              <ProtectedRoute
                element={<Delivery />}
                sessionKey="delivery_session"
                timeKey="delivery_session_time"
                duration={12 * 60 * 60 * 1000}
              />
            }
          />
        </Routes>
        <a
          href="https://wa.me/+2349160137310"
          className="fixed bottom-6 right-6 bg-green-500 p-4 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
        >
          <MessageCircle size={24} className="text-white" />
        </a>
      </div>
    </Router>
  );
}