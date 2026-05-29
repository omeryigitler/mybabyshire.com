import React, { useMemo } from 'react';
import { Check, GripVertical, Palette, Plus, TextCursorInput, Trash, ListChecks, CalendarDays } from 'lucide-react';

export type FieldType = 'text' | 'color' | 'select' | 'date';

export interface PersonalizationBuilderField {
  id: string;
  fieldKey: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  helpText?: string;
  maxLength?: number | null;
  options?: string[];
  required: boolean;
}

type PersonalizationFieldBuilderProps = {
  fields?: PersonalizationBuilderField[];
  onFieldsChange?: (fields: PersonalizationBuilderField[]) => void;
};

export const DEFAULT_PRODUCT_FIELDS: PersonalizationBuilderField[] = [
  { id: 'default-name', fieldKey: 'babyName', type: 'text', label: "Baby's Name", placeholder: 'e.g. Liam', maxLength: 32, required: true },
  { id: 'default-thread', fieldKey: 'threadColor', type: 'color', label: 'Thread Color', options: ['#D4AF37', '#FFC0CB', '#ADD8E6', '#F5F5DC', '#98FF98'], required: true },
  { id: 'default-font', fieldKey: 'fontStyle', type: 'select', label: 'Font Style', options: ['Classic Script', 'Modern Serif', 'Soft Rounded'], required: false },
];

const fieldTypeLabel = (type: FieldType) => {
  if (type === 'color') return 'Color Swatches';
  if (type === 'select') return 'Dropdown Options';
  if (type === 'date') return 'Date';
  return 'Short Text';
};

const fieldTypeIcon = (type: FieldType) => {
  if (type === 'color') return Palette;
  if (type === 'select') return ListChecks;
  if (type === 'date') return CalendarDays;
  return TextCursorInput;
};

const inputClass = 'w-full rounded-2xl border border-boutique-brown/10 bg-white px-3 py-2.5 text-sm text-boutique-brown outline-none placeholder:text-boutique-brown/35 focus:ring-2 focus:ring-boutique-wood/25';

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
};

const toFieldKey = (label: string, fallback: string) => {
  const key = label
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, character: string) => character.toUpperCase())
    .replace(/^[^a-zA-Z]+/, '');

  const normalized = key ? key.charAt(0).toLowerCase() + key.slice(1) : fallback;
  return normalized || fallback;
};

const defaultFieldForType = (type: FieldType): PersonalizationBuilderField => {
  const id = makeId();
  const label = type === 'color' ? 'Thread Color' : type === 'select' ? 'Choose an option' : type === 'date' ? 'Special Date' : 'Custom Text';

  return {
    id,
    fieldKey: toFieldKey(label, `${type}${id.slice(0, 5)}`),
    type,
    label,
    placeholder: type === 'text' ? 'Enter text' : undefined,
    required: false,
    maxLength: type === 'text' ? 32 : null,
    options: type === 'color' ? ['#D4AF37', '#FFC0CB', '#ADD8E6'] : type === 'select' ? ['Option 1', 'Option 2'] : undefined,
  };
};

export const PersonalizationFieldBuilder = ({ fields, onFieldsChange }: PersonalizationFieldBuilderProps) => {
  const currentFields = useMemo(() => fields || DEFAULT_PRODUCT_FIELDS, [fields]);
  const editable = Boolean(onFieldsChange);

  const setFields = (nextFields: PersonalizationBuilderField[]) => {
    onFieldsChange?.(nextFields);
  };

  const addField = (type: FieldType) => {
    setFields([...currentFields, defaultFieldForType(type)]);
  };

  const updateField = (id: string, updates: Partial<PersonalizationBuilderField>) => {
    setFields(currentFields.map((field) => {
      if (field.id !== id) return field;
      const nextField = { ...field, ...updates };
      if (updates.label && (!field.fieldKey || field.fieldKey.startsWith(field.type))) {
        nextField.fieldKey = toFieldKey(updates.label, field.fieldKey || field.id);
      }
      return nextField;
    }));
  };

  const removeField = (id: string) => {
    setFields(currentFields.filter((field) => field.id !== id));
  };

  const moveField = (id: string, direction: -1 | 1) => {
    const index = currentFields.findIndex((field) => field.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentFields.length) return;
    const nextFields = [...currentFields];
    const [field] = nextFields.splice(index, 1);
    nextFields.splice(nextIndex, 0, field);
    setFields(nextFields);
  };

  const disabledClass = editable ? '' : 'pointer-events-none opacity-75';

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-4">
        <button type="button" disabled={!editable} onClick={() => addField('text')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><Plus className="h-4 w-4" /> Text</button>
        <button type="button" disabled={!editable} onClick={() => addField('color')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><Plus className="h-4 w-4" /> Colors</button>
        <button type="button" disabled={!editable} onClick={() => addField('select')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><Plus className="h-4 w-4" /> Select</button>
        <button type="button" disabled={!editable} onClick={() => addField('date')} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 text-sm font-bold text-boutique-brown shadow-sm hover:bg-[#fff4df] disabled:opacity-50"><Plus className="h-4 w-4" /> Date</button>
      </div>

      <div className={`space-y-4 ${disabledClass}`}>
        {currentFields.map((field, index) => {
          const Icon = fieldTypeIcon(field.type);
          return (
            <div key={field.id} className="relative overflow-hidden rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-4 shadow-sm">
              <img src="/cloud-watercolor-blue-light.png" className="pointer-events-none absolute -right-10 -top-12 w-40 opacity-20 mix-blend-multiply" alt="" />
              <div className="relative z-10 flex gap-4">
                <div className="mt-11 flex flex-col gap-1 text-boutique-brown/25">
                  <button type="button" disabled={!editable || index === 0} onClick={() => moveField(field.id, -1)} className="rounded-lg px-1 hover:bg-white hover:text-boutique-brown disabled:opacity-25">Up</button>
                  <GripVertical className="mx-auto h-5 w-5" />
                  <button type="button" disabled={!editable || index === currentFields.length - 1} onClick={() => moveField(field.id, 1)} className="rounded-lg px-1 hover:bg-white hover:text-boutique-brown disabled:opacity-25">Down</button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-boutique-brown shadow-sm"><Icon className="h-4.5 w-4.5" /></div>
                      <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Field {index + 1}</p><p className="text-sm font-bold text-boutique-brown">{fieldTypeLabel(field.type)}</p></div>
                    </div>
                    <label className="inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-white px-3 py-2 text-xs font-bold text-boutique-brown shadow-sm">
                      <button type="button" disabled={!editable} onClick={() => updateField(field.id, { required: !field.required })} className={`flex h-5 w-5 items-center justify-center rounded-md border ${field.required ? 'border-boutique-brown bg-boutique-brown text-white' : 'border-boutique-brown/20 bg-white text-transparent'}`}><Check className="h-3.5 w-3.5" /></button>
                      Required
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Field label</label><input type="text" value={field.label} disabled={!editable} onChange={(event) => updateField(field.id, { label: event.target.value })} className={inputClass} /></div>
                    <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Field key</label><input type="text" value={field.fieldKey} disabled={!editable} onChange={(event) => updateField(field.id, { fieldKey: event.target.value })} className={inputClass} placeholder="babyName" /></div>
                    {field.type === 'text' && <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Placeholder</label><input type="text" value={field.placeholder || ''} disabled={!editable} onChange={(event) => updateField(field.id, { placeholder: event.target.value })} className={inputClass} placeholder="Example shown to customer" /></div>}
                    {field.type === 'text' && <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Max length</label><input type="number" min="1" max="120" value={field.maxLength || ''} disabled={!editable} onChange={(event) => updateField(field.id, { maxLength: event.target.value ? Number(event.target.value) : null })} className={inputClass} placeholder="32" /></div>}
                    <div className="md:col-span-2"><label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Help text</label><input type="text" value={field.helpText || ''} disabled={!editable} onChange={(event) => updateField(field.id, { helpText: event.target.value })} className={inputClass} placeholder="Optional guidance for customers" /></div>
                  </div>

                  {(field.type === 'color' || field.type === 'select') && (
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-boutique-brown/55">Options</label>
                      <input type="text" value={field.options?.join(', ') || ''} disabled={!editable} onChange={(event) => updateField(field.id, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className={inputClass} placeholder="Comma separated options" />
                      {field.type === 'color' && <div className="mt-3 flex flex-wrap gap-2">{field.options?.map((color) => <span key={color} className="h-8 w-8 rounded-full border border-boutique-brown/10 shadow-sm" style={{ backgroundColor: color }} title={color} />)}</div>}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button type="button" disabled={!editable || currentFields.length <= 1} onClick={() => removeField(field.id)} className="rounded-2xl border border-red-100 bg-white p-2.5 text-red-500 shadow-sm hover:bg-red-50 disabled:opacity-35"><Trash className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
        {currentFields.length === 0 && <div className="rounded-[1.5rem] border-2 border-dashed border-boutique-brown/10 bg-[#fffaf3] py-10 text-center text-sm text-boutique-brown-light">No fields added yet. Add one above.</div>}
      </div>
    </div>
  );
};
