import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function AiUnavailable({ compact = false }) {
  if (compact) {
    return (
      <Link
        to="/settings"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
      >
        <Sparkles className="h-3 w-3" />
        Add Gemini key
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm font-medium">AI features need your Gemini API key</p>
      <p className="mt-1.5 text-xs text-muted-foreground max-w-[240px] leading-relaxed">
        Your key is encrypted and never shown again after saving.
      </p>
      <Link
        to="/settings"
        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        Set up in Settings
      </Link>
    </div>
  );
}
