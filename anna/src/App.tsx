import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/Auth';
import EmailConfirmPage from './pages/Email-confirmation';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/email-confirmation" element={<EmailConfirmPage />} />
      </Routes>
    </Router>
  );
};

export default App;