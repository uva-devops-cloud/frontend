

import Signup from "./components/LoginSignup/Signup";
import Login from "./components/LoginSignup/Login";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );

}

export default App;