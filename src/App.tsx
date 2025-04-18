import Signup from "./components/LoginSignup/Signup";
import Login from "./components/LoginSignup/Login";
import PasswordReset from "./components/LoginSignup/PasswordReset";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ApiInteractions from "./components/API/ApiInteractions";
import MainPage from "./components/Pages/MainPage";
import ProtectedRoute from "./components/resources/AuthRoutes";
import DashboardLayout from "./components/Pages/DashBoardLayout";
import LLM from "./components/Pages/LLM";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/password-reset" element={<PasswordReset />} />
        <Route path="/ApiInteractions" element={<ApiInteractions />} />

        {/* Protected routes with JWT token with shared layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Child routes rendering from DashboardLayout */}
          <Route path="/dashboard" element={<MainPage />} />
          <Route path="/LLM" element={<LLM />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;