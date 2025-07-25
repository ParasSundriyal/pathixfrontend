import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MapViewer from './pages/MapViewer';
import HomePage from './pages/ProfileEdit';
import Home2 from './pages/Home2';
import DrawMap from './pages/DrawMap';
import { ThemeProvider } from './components/ThemeContext';
import ProfileEdit from './pages/ProfileEdit';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function ProtectedRoute({ children, allowStarterMap = false, allowPro = false }) {
  const token = sessionStorage.getItem('token');
  if (!token) return <Navigate to="/signin" />;

  return children;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home2 />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/home" element={<Home2 />} />
          <Route path="/ProfileEdit" element={<ProfileEdit/>} />
          <Route path="/maps/:id" element={<MapViewer />} />
          
          <Route path="/drawMap" element={<ProtectedRoute ><DrawMap /></ProtectedRoute>} />
        </Routes>
      </Router>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
