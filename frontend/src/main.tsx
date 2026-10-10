import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import BuildingsPage from './pages/BuildingsPage';
import InterventionsPage from './pages/InterventionsPage';
import ScenarioBuilder from './pages/ScenarioBuilder';
import ResultPage from './pages/ResultPage';
import ComparePage from './pages/ComparePage';
import ImportPage from './pages/ImportPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <div className="brand">
          <strong>TEPO</strong>
          <span>Trento Energy Portfolio Optimizer</span>
        </div>
        <nav>
          <Link to="/">Dashboard</Link>
          <Link to="/map">Mappa</Link>
          <Link to="/buildings">Edifici</Link>
          <Link to="/interventions">Interventi</Link>
          <Link to="/scenario">Scenario</Link>
          <Link to="/result">Risultato</Link>
          <Link to="/compare">Confronto</Link>
          <Link to="/import">Import</Link>
        </nav>
        <div className="demo-badge">DEMO — dati sintetici</div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/buildings" element={<BuildingsPage />} />
          <Route path="/interventions" element={<InterventionsPage />} />
          <Route path="/scenario" element={<ScenarioBuilder />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/import" element={<ImportPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);