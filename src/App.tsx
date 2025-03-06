
import Signup from "./components/LoginSignup/Signup";
import Login from "./components/LoginSignup/Login";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ApiInteractions from "./components/API/ApiInteractions"; //Testing of dummy
import MainPage from "./components/Pages/MainPage";



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/ApiInteractions" element={<ApiInteractions />} />
        <Route path="/MainPage" element={<MainPage />} />
      </Routes>
    </Router>
  );
}

export default App;