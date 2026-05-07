import { useState } from 'react';
import AppRoutes from './routes';
import BottomNav from './components/layout/BottomNav';
import AddExpenseModal from './components/forms/AddExpenseModal';

export default function App() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="pb-24">
        <AppRoutes />
      </main>

      {/* Floating Add Expense Modal */}
      <AddExpenseModal open={showAddModal} onOpenChange={setShowAddModal} />

      {/* Bottom Navigation */}
      <BottomNav onAdd={() => setShowAddModal(true)} />
    </div>
  );
}
