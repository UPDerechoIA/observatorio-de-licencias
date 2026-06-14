"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createAnalysisAction, type CreateAnalysisState } from "@/app/actions";
import { CONTRACTING_MODES, MODE_LABELS } from "@/lib/contractingModes";

const TIERS = ["Free", "Plus", "Pro", "Team", "Enterprise", "API"];
const DOC_TYPES = ["Terms of Use", "EULA", "Privacy Policy", "Service Terms"];
const MODE_OPTIONS = CONTRACTING_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }));

const initialState: CreateAnalysisState = { ok: true };

/**
 * Formulario para crear un análisis pegando texto. Al enviar: valida, guarda
 * el .txt, ejecuta el parser, persiste el JSON y redirige al análisis.
 */
export function UploadOrPasteForm() {
  const [state, formAction] = useActionState(createAnalysisAction, initialState);
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {state.message && !state.ok && (
        <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Proveedor" name="providerName" error={errors.providerName} placeholder="OpenAI" required />
        <Field label="Producto" name="productName" error={errors.productName} placeholder="ChatGPT" required />

        <SelectField label="Plan / Tier" name="productTier" options={TIERS} error={errors.productTier} />
        <SelectField label="Tipo de documento" name="documentType" options={DOC_TYPES} error={errors.documentType} />

        <SelectField
          label="Modalidad de contratación"
          name="contractingMode"
          options={MODE_OPTIONS}
          error={errors.contractingMode}
        />

        <Field
          label="URL fuente (opcional)"
          name="sourceUrl"
          error={errors.sourceUrl}
          placeholder="https://ejemplo.com/terms"
          type="url"
        />
        <Field
          label="Fecha de obtención"
          name="retrievedAt"
          error={errors.retrievedAt}
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          required
        />
      </div>

      <div>
        <label htmlFor="rawText" className="block text-sm font-medium text-slate-700">
          Texto del documento <span className="text-red-600">*</span>
        </label>
        <textarea
          id="rawText"
          name="rawText"
          rows={14}
          required
          placeholder="Pegá aquí el texto completo de la licencia, EULA, términos de uso o política de privacidad…"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-slate-500 focus:outline-none"
        />
        {errors.rawText && <p className="mt-1 text-xs text-red-600">{errors.rawText}</p>}
      </div>

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
    >
      {pending ? "Parseando…" : "Parsear y guardar"}
    </button>
  );
}

function Field({
  label,
  name,
  error,
  placeholder,
  type = "text",
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  error,
}: {
  label: string;
  name: string;
  options: Array<string | { value: string; label: string }>;
  error?: string;
}) {
  const norm = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">
        {label} <span className="text-red-600">*</span>
      </label>
      <select
        id={name}
        name={name}
        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none"
      >
        {norm.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
