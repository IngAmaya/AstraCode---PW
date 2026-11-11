import './App.css';
import Navbar from './components/layout/Navbar.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <div className="app">
      <AppRoutes navbar={<Navbar />} sidebar={<Sidebar />} />
    </div>
  );
}
