import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes';
import BottomNav from './components/layout/BottomNav';
import AddExpenseModal from './components/forms/AddExpenseModal';
import ScanReceiptSheet from './components/ai/ScanReceiptSheet';
import VoiceEntrySheet from './components/ai/VoiceEntrySheet';
import ChatPanel from './components/ai/ChatPanel';

const AUTH_PATHS = ['/login', '/signup'];

export default function App() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [prefill, setPrefill] = useState(null);
  const location = useLocation();
  const isAuthPage = AUTH_PATHS.includes(location.pathname);

  const openAddWithPrefill = (data, source) => {
    setPrefill({
      amount: data.amount ?? '',
      category: data.category ?? '',
      date: data.date?.slice?.(0, 10) ?? data.date ?? new Date().toISOString().split('T')[0],
      note: data.note ?? '',
      source: source ?? 'manual',
    });
    setShowAddModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className={isAuthPage ? '' : 'pb-28'}>
        <AppRoutes />
      </main>

      {!isAuthPage && (
        <>
          <AddExpenseModal
            open={showAddModal}
            onOpenChange={(v) => {
              if (!v) setPrefill(null);
              setShowAddModal(v);
            }}
            prefill={prefill}
          />
          <ScanReceiptSheet open={showScan} onOpenChange={setShowScan} />
          <VoiceEntrySheet
            open={showVoice}
            onOpenChange={setShowVoice}
            onParsed={(data) => openAddWithPrefill(data, 'ai_voice')}
          />
          <ChatPanel open={showChat} onOpenChange={setShowChat} />
          <BottomNav
            onAdd={() => {
              setPrefill(null);
              setShowAddModal(true);
            }}
            onScan={() => setShowScan(true)}
            onVoice={() => setShowVoice(true)}
            onChat={() => setShowChat(true)}
          />
        </>
      )}
    </div>
  );
}
