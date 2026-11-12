import React from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import Footer from './components/layout/Footer.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

function App() {
  return (
    <div>
      <Navbar />
      <div className="app-layout">
        <Sidebar />
        <main className="app-content">
          <AppRoutes />
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default App;