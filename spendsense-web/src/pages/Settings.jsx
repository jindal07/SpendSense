import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Loader2, User, Shield } from 'lucide-react';
import PageContainer from '@/components/layout/PageContainer';
import { PasswordInput } from '@/components/ui/password-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { fetchAiKey, saveAiKey, deleteAiKey, fetchAiUsage, patchSettings } from '@/api/ai';
import { fetchMe } from '@/api/client';
import { toast } from 'sonner';

export default function Settings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [income, setIncome] = useState('');
  const [goal, setGoal] = useState('');
  const [currency, setCurrency] = useState('INR');

  const { data: keyData, refetch: refetchKey } = useQuery({
    queryKey: ['ai-key'],
    queryFn: fetchAiKey,
  });

  const { data: usage } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: fetchAiUsage,
    enabled: keyData?.hasKey,
  });

  const { data: meData } = useQuery({
    queryKey: ['me-profile'],
    queryFn: fetchMe,
  });

  useEffect(() => {
    if (meData?.user) {
      setIncome(meData.user.monthlyIncome != null ? String(meData.user.monthlyIncome) : '');
      setGoal(meData.user.savingsGoalPct != null ? String(meData.user.savingsGoalPct) : '');
      setCurrency(meData.user.currency ?? 'INR');
    }
  }, [meData]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    try {
      const r = await saveAiKey(apiKey.trim());
      setApiKey('');
      await refetchKey();
      qc.invalidateQueries({ queryKey: ['ai-key'] });
      toast.success(`Key saved (…${r.fingerprint})`);
    } catch (e) {
      toast.error(e.message || 'Invalid key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    try {
      await deleteAiKey();
      await refetchKey();
      qc.invalidateQueries({ queryKey: ['ai-key'] });
      toast.success('API key removed');
    } catch (e) {
      toast.error(e.message || 'Failed to remove key');
    }
  };

  const handleSaveProfile = async () => {
    try {
      await patchSettings({
        monthlyIncome: income === '' ? null : Number(income),
        savingsGoalPct: goal === '' ? null : Number(goal),
        currency,
      });
      qc.invalidateQueries({ queryKey: ['me-profile'] });
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const todayPct = usage?.usage
    ? Math.min(100, (usage.usage.today_calls / (usage.dailyCap || 200)) * 100)
    : 0;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 sm:px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
            <p className="text-xs text-muted-foreground">AI & profile</p>
          </div>
        </div>
      </header>

      <PageContainer className="space-y-5 pt-6">
        {/* AI Key Section */}
        <section className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Gemini API Key</h2>
              <p className="text-xs text-muted-foreground">Encrypted & secure</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Get a free key at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline underline-offset-2"
            >
              Google AI Studio
            </a>
            . Your key is encrypted on our servers and never shown again.
          </p>

          {keyData?.hasKey && (
            <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-3 py-2">
              <Shield className="h-3.5 w-3.5 text-accent" />
              <p className="text-xs text-accent">
                Active key: <code className="font-medium">…{keyData.fingerprint}</code>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="gemini-key">{keyData?.hasKey ? 'Replace key' : 'API key'}</Label>
            <PasswordInput
              id="gemini-key"
              placeholder="AIza..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveKey} disabled={savingKey || !apiKey.trim()} size="sm">
              {savingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save key'}
            </Button>
            {keyData?.hasKey && (
              <Button variant="outline" onClick={handleDeleteKey} size="sm">
                Remove
              </Button>
            )}
          </div>

          {usage && (
            <div className="pt-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Today's usage</span>
                <span className="tabular-nums">{usage.usage.today_calls} / {usage.dailyCap}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/70 transition-all duration-500"
                  style={{ width: `${todayPct}%` }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Profile Section */}
        <section className="glass-card p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
              <User className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">Financial Profile</h2>
              <p className="text-xs text-muted-foreground">For personalized AI tips</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="space-y-2">
              <Label htmlFor="income">Monthly income (₹)</Label>
              <Input
                id="income"
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 50000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Savings goal (%)</Label>
              <Input
                id="goal"
                type="number"
                min={0}
                max={100}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. 20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="e.g. INR"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} size="sm">
            Save profile
          </Button>
        </section>
      </PageContainer>
    </>
  );
}
