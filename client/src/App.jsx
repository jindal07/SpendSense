import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppHeader } from '@/components/AppHeader';
import { BottomNav } from '@/components/BottomNav';
import { ExpenseFormModal } from '@/components/ExpenseFormModal';
import Dashboard from '@/pages/Dashboard.jsx';
import Stats from '@/pages/Stats.jsx';
import History from '@/pages/History.jsx';

export default function App() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="min-h-screen text-foreground">
      <AppHeader />
      <main className="mx-auto max-w-xl px-4 pt-5 pb-28">
        <Routes>
          <Route path="/" element={<Dashboard onAdd={() => setAddOpen(true)} />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/history" element={<History onAdd={() => setAddOpen(true)} />} />
        </Routes>
      </main>

      <BottomNav onAddClick={() => setAddOpen(true)} />
      <ExpenseFormModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
