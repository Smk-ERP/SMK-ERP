import { Routes, Route, Link } from 'react-router-dom';
import HomePage from './components/HomePage.jsx';
import FrontLitCalculator from './calculators/FrontLitCalculator.jsx';
import BackLitCalculator from './calculators/BackLitCalculator.jsx';
import EdgeLitCalculator from './calculators/EdgeLitCalculator.jsx';
import LightboxCalculator from './calculators/LightboxCalculator.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-brand-500 text-white grid place-items-center font-bold">
              LED
            </div>
            <div>
              <div className="font-semibold leading-tight">Letter LED Sign</div>
              <div className="text-xs text-slate-500 leading-tight">
                Price Calculator
              </div>
            </div>
          </Link>
          <Link
            to="/"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-10">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/front-lit" element={<FrontLitCalculator />} />
          <Route path="/back-lit" element={<BackLitCalculator />} />
          <Route path="/edge-lit" element={<EdgeLitCalculator />} />
          <Route path="/lightbox" element={<LightboxCalculator />} />
        </Routes>
      </main>

      <footer className="text-center text-xs text-slate-400 py-6 no-print">
        Letter LED Sign Price Calculator &middot; THB
      </footer>
    </div>
  );
}
