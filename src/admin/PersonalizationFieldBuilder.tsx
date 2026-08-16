import React, { useMemo } from 'react';
import { CalendarDays, Check, GripVertical, ListChecks, Palette, Plus, TextCursorInput, Trash } from 'lucide-react';

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
type PersonalizationFieldBuilderProps = { fields?: PersonalizationBuilderField[]; onFieldsChange?: (fields: PersonalizationBuilderField[]) => void };

export const DEFAULT_PRODUCT_FIELDS: PersonalizationBuilderField[] = [
  { id: 'default-text', fieldKey: 'customText', type: 'text', label: 'Custom Text', placeholder: 'Enter text', maxLength: 32, required: true },
  { id: 'default-color', fieldKey: 'detailColor', type: 'color', label: 'Detail Color', options: ['#202020', '#F1DADF', '#DCEAF0'], required: false },
  { id: 'default-option', fieldKey: 'styleOption', type: 'select', label: 'Style Option', options: ['Option 1', 'Option 2'], required: false },
];

const fieldTypeLabel = (type: FieldType) => type === 'color' ? 'Color swatches' : type === 'select' ? 'Dropdown options' : type === 'date' ? 'Date' : 'Short text';
const fieldTypeIcon = (type: FieldType) => type === 'color' ? Palette : type === 'select' ? ListChecks : type === 'date' ? CalendarDays : TextCursorInput;
const inputClass = 'commerce-focus h-10 w-full rounded-[8px] border border-[#dedede] bg-white px-3 text-sm outline-none placeholder:text-[#aaa] focus:border-[#202020]';
const labelClass = 'mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]';
const makeId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const toFieldKey = (label: string, fallback: string) => {
  const key = label.trim().replace(/['"]/g, '').replace(/[^a-zA-Z0-9]+(.)/g, (_, character: string) => character.toUpperCase()).replace(/^[^a-zA-Z]+/, '');
  return key ? key.charAt(0).toLowerCase() + key.slice(1) : fallback;
};
const defaultFieldForType = (type: FieldType): PersonalizationBuilderField => {
  const id = makeId();
  const label = type === 'color' ? 'Detail Color' : type === 'select' ? 'Choose an option' : type === 'date' ? 'Date' : 'Custom Text';
  return { id, fieldKey: toFieldKey(label, `${type}${id.slice(0, 5)}`), type, label, placeholder: type === 'text' ? 'Enter text' : undefined, required: false, maxLength: type === 'text' ? 32 : null, options: type === 'color' ? ['#202020', '#F1DADF', '#DCEAF0'] : type === 'select' ? ['Option 1', 'Option 2'] : undefined };
};

export const PersonalizationFieldBuilder = ({ fields, onFieldsChange }: PersonalizationFieldBuilderProps) => {
  const currentFields = useMemo(() => fields || DEFAULT_PRODUCT_FIELDS, [fields]);
  const editable = Boolean(onFieldsChange);
  const setFields = (nextFields: PersonalizationBuilderField[]) => onFieldsChange?.(nextFields);
  const addField = (type: FieldType) => setFields([...currentFields, defaultFieldForType(type)]);
  const updateField = (id: string, updates: Partial<PersonalizationBuilderField>) => setFields(currentFields.map((field) => {
    if (field.id !== id) return field;
    const nextField = { ...field, ...updates };
    if (updates.label && (!field.fieldKey || field.fieldKey.startsWith(field.type))) nextField.fieldKey = toFieldKey(updates.label, field.fieldKey || field.id);
    return nextField;
  }));
  const removeField = (id: string) => setFields(currentFields.filter((field) => field.id !== id));
  const moveField = (id: string, direction: -1 | 1) => {
    const index = currentFields.findIndex((field) => field.id === id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= currentFields.length) return;
    const nextFields = [...currentFields];
    const [field] = nextFields.splice(index, 1);
    nextFields.splice(nextIndex, 0, field);
    setFields(nextFields);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-4">
        {([['text', 'Text'], ['color', 'Colors'], ['select', 'Select'], ['date', 'Date']] as [FieldType, string][]).map(([type, label]) => <button key={type} type="button" disabled={!editable} onClick={() => addField(type)} className="commerce-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-[#dedede] bg-white px-3 text-xs font-semibold hover:bg-[#f7f7f7] disabled:opacity-50"><Plus className="h-3.5 w-3.5" /> {label}</button>)}
      </div>

      <div className={`space-y-3 ${editable ? '' : 'pointer-events-none opacity-75'}`}>
        {currentFields.map((field, index) => {
          const Icon = fieldTypeIcon(field.type);
          return <section key={field.id} className="rounded-[10px] border border-[#e3e3e3] bg-[#fafafa] p-4">
            <div className="flex gap-3">
              <div className="flex shrink-0 flex-col items-center gap-1 pt-9 text-[#999]"><button type="button" disabled={!editable || index === 0} onClick={() => moveField(field.id, -1)} className="commerce-focus rounded px-1 text-[10px] font-semibold disabled:opacity-25">Up</button><GripVertical className="h-4 w-4" /><button type="button" disabled={!editable || index === currentFields.length - 1} onClick={() => moveField(field.id, 1)} className="commerce-focus rounded px-1 text-[10px] font-semibold disabled:opacity-25">Down</button></div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white"><Icon className="h-4 w-4" /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Field {index + 1}</p><p className="text-sm font-semibold">{fieldTypeLabel(field.type)}</p></div></div><button type="button" disabled={!editable} onClick={() => updateField(field.id, { required: !field.required })} className={`commerce-focus inline-flex items-center gap-2 rounded-[8px] border px-3 py-2 text-xs font-semibold ${field.required ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#dedede] bg-white'}`}><Check className="h-3.5 w-3.5" /> Required</button></div>

                <div className="mt-4 grid gap-3 md:grid-cols-2"><div><label className={labelClass}>Field label</label><input value={field.label} disabled={!editable} onChange={(event) => updateField(field.id, { label: event.target.value })} className={inputClass} /></div><div><label className={labelClass}>Field key</label><input value={field.fieldKey} disabled={!editable} onChange={(event) => updateField(field.id, { fieldKey: event.target.value })} className={inputClass} placeholder="customText" /></div>{field.type === 'text' && <><div><label className={labelClass}>Placeholder</label><input value={field.placeholder || ''} disabled={!editable} onChange={(event) => updateField(field.id, { placeholder: event.target.value })} className={inputClass} /></div><div><label className={labelClass}>Max length</label><input type="number" min="1" max="120" value={field.maxLength || ''} disabled={!editable} onChange={(event) => updateField(field.id, { maxLength: event.target.value ? Number(event.target.value) : null })} className={inputClass} /></div></>}<div className="md:col-span-2"><label className={labelClass}>Help text</label><input value={field.helpText || ''} disabled={!editable} onChange={(event) => updateField(field.id, { helpText: event.target.value })} className={inputClass} placeholder="Optional customer guidance" /></div></div>

                {(field.type === 'color' || field.type === 'select') && <div className="mt-3"><label className={labelClass}>Options</label><input value={field.options?.join(', ') || ''} disabled={!editable} onChange={(event) => updateField(field.id, { options: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} className={inputClass} placeholder="Comma separated options" />{field.type === 'color' && <div className="mt-2 flex flex-wrap gap-2">{field.options?.map((color) => <span key={color} className="h-7 w-7 rounded-full border border-[#d8d8d8]" style={{ backgroundColor: color }} title={color} />)}</div>}</div>}
              </div>
              <button type="button" disabled={!editable || currentFields.length <= 1} onClick={() => removeField(field.id)} className="commerce-focus h-9 w-9 shrink-0 rounded-[8px] border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-35" aria-label="Remove field"><Trash className="mx-auto h-4 w-4" /></button>
            </div>
          </section>;
        })}
        {currentFields.length === 0 && <div className="rounded-[10px] border border-dashed border-[#d7d7d7] bg-[#fafafa] py-10 text-center text-sm text-[#777]">No fields added.</div>}
      </div>
    </div>
  );
};
