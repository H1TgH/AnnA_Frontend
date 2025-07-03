import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/Auth';
import EmailConfirmPage from './pages/Email-confirmation';
import ProfilePage from './pages/Profile';
import ResetPasswordPage from './pages/Password-reset';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/email-confirmation" element={<EmailConfirmPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/password-reset" element={<ResetPasswordPage />} />
      </Routes>
    </Router>
  );
};

export default App;