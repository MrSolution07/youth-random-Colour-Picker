import { useMemo, useState, type FormEvent } from "react";

type Props = {
  disabled?: boolean;
  onConfirm: (args: { name: string; whatsapp: string }) => Promise<void>;
};

function normalizeWhatsApp(input: string) {
  // Keep '+' and digits only.
  const cleaned = input.replace(/[^\d+]/g, "").trim();
  return cleaned;
}

export default function ConfirmForm({ disabled, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    const nOk = name.trim().length >= 2;
    const w = normalizeWhatsApp(whatsapp);
    const wOk = w.replace(/[^\d]/g, "").length >= 9;
    return nOk && wOk && !submitting && !disabled;
  }, [disabled, name, submitting, whatsapp]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await onConfirm({ name: name.trim(), whatsapp: normalizeWhatsApp(whatsapp) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not save.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%" }}>
      <div className="formField">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sarah"
          disabled={disabled || submitting}
          autoComplete="name"
        />
      </div>
      <div className="formField">
        <label htmlFor="whatsapp">WhatsApp number</label>
        <input
          id="whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="e.g. +1 555 123 4567"
          disabled={disabled || submitting}
          inputMode="tel"
          autoComplete="tel"
        />
      </div>
      {error ? (
        <div className="toast" style={{ marginBottom: 12, borderColor: "rgba(255,92,92,0.35)" }}>
          {error}
        </div>
      ) : null}
      <button className="btn btnPrimary" type="submit" disabled={!canSubmit}>
        {submitting ? "Saving..." : "Confirm my tribe"}
      </button>
    </form>
  );
}

