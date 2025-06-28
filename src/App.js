import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import logo from './logo.svg';
import './App.css';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MapViewer from './pages/MapViewer';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

function Landing() {
  return (
    <div style={{textAlign: 'center', marginTop: 60}}>
      <h1>Welcome to Pathix</h1>
      <p>Create, explore, and navigate property maps.</p>
      <Link to="/signup"><button>Sign Up</button></Link>
      <Link to="/signin" style={{marginLeft: 10}}><button>Sign In</button></Link>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const token = sessionStorage.getItem('token');
  return token ? children : <Navigate to="/signin" />;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
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
