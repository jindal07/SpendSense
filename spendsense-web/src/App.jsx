import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import BottomNav from './components/layout/BottomNav';
import AddExpenseModal from './components/forms/AddExpenseModal';

const AUTH_PATHS = ['/login', '/signup'];

export default function App() {
  const [showAddModal, setShowAddModal] = useState(false);
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={isAuthPage ? '' : 'pb-24'}>
        <AppRoutes />
      </main>

      {!isAuthPage && (
        <>
          <AddExpenseModal open={showAddModal} onOpenChange={setShowAddModal} />
          <BottomNav onAdd={() => setShowAddModal(true)} />
        </>
      )}
    </div>
  );
}
