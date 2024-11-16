import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';
import SingleCameraPage from './pages/SingleCameraPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path='/dashboard' element={<DashboardPage />} />
          <Route path='/single-camera' element={<SingleCameraPage />} />
          <Route path='/single-camera/:id' element={<SingleCameraPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
