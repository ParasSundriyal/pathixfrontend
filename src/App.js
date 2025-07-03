import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MapViewer from './pages/MapViewer';
import HomePage from './components/HomePage';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('token');
  return token ? children : <Navigate to="/signin" />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/map/:id" element={<MapViewer />} />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
