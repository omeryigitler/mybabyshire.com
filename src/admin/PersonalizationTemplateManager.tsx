import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, Plus, Save, Trash2 } from 'lucide-react';
import { DEFAULT_PRODUCT_FIELDS, PersonalizationFieldBuilder, type FieldType, type PersonalizationBuilderField } from './PersonalizationFieldBuilder';
import { getAdminToken } from './adminAuth';
import { requestAdminConfirm } from './adminDialogs';

type Template = { id: string; name: string; used: number; fields: PersonalizationBuilderField[]; description: string };
const FIELD_TYPES: FieldType[] = ['text', 'color', 'select', 'date'];
const cloneDefaultFields = () => DEFAULT_PRODUCT_FIELDS.map((field) => ({ ...field, options: field.options ? [...field.options] : undefined }));
const normalizeFields = (fields: any[]): PersonalizationBuilderField[] => {
  if (!Array.isArray(fields) || fields.length === 0) return cloneDefaultFields();
  const normalized = fields.map((field, index) => {
    const label = String(field?.label || '').trim();
    const fieldKey = String(field?.fieldKey || field?.field_key || '').trim();
    const type = FIELD_TYPES.includes(field?.type || field?.field_type) ? (field?.type || field?.field_type) : 'text';
    if (!label || !fieldKey) return null;
    return { id: String(field?.id || `${fieldKey}-${index}`), fieldKey, type, label, placeholder: field?.placeholder || '', helpText: field?.helpText || field?.help_text || '', maxLength: field?.maxLength ?? field?.max_length ?? null, options: Array.isArray(field?.options) ? field.options.map(String).filter(Boolean) : [], required: Boolean(field?.required) };
  }).filter(Boolean) as PersonalizationBuilderField[];
  return normalized.length ? normalized : cloneDefaultFields();
};

export const PersonalizationTemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateFields, setTemplateFields] = useState<PersonalizationBuilderField[]>(cloneDefaultFields);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId) || null, [templates, selectedTemplateId]);

  const selectTemplate = (template: Template) => { setSelectedTemplateId(template.id); setTemplateName(template.name); setTemplateDescription(template.description || ''); setTemplateFields(normalizeFields(template.fields)); setFeedback(''); };

  const loadTemplates = async () => {
    setIsLoading(true); setFeedback('');
    try {
      const response = await fetch('/api/admin/templates', { headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load templates.');
      const nextTemplates = Array.isArray(data) ? data.map((template) => ({ ...template, fields: normalizeFields(template.fields) })) : [];
      setTemplates(nextTemplates);
      if (nextTemplates.length) selectTemplate(nextTemplates[0]);
      else { setSelectedTemplateId(''); setTemplateName(''); setTemplateDescription(''); setTemplateFields(cloneDefaultFields()); }
    } catch (error) { setFeedback((error as Error).message); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void loadTemplates(); }, []);

  const createTemplate = async () => {
    setIsSaving(true); setFeedback('');
    try {
      const response = await fetch('/api/admin/templates', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` }, body: JSON.stringify({ name: 'New Customization Template', description: 'Reusable customer-input fields for selected products.', fields: cloneDefaultFields() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Template could not be created.');
      const nextTemplate = { ...data, fields: normalizeFields(data.fields) };
      setTemplates((current) => [nextTemplate, ...current]); selectTemplate(nextTemplate); setFeedback('Template created.');
    } catch (error) { setFeedback((error as Error).message); }
    finally { setIsSaving(false); }
  };

  const saveTemplate = async () => {
    if (!selectedTemplateId) return setFeedback('Create or select a template first.');
    setIsSaving(true); setFeedback('');
    try {
      const response = await fetch(`/api/admin/templates?id=${encodeURIComponent(selectedTemplateId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAdminToken()}` }, body: JSON.stringify({ name: templateName.trim() || 'Untitled Template', description: templateDescription.trim(), fields: templateFields }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Template could not be saved.');
      const saved = { ...data, fields: normalizeFields(data.fields) };
      setTemplates((current) => current.map((template) => template.id === saved.id ? saved : template)); selectTemplate(saved); setFeedback('Template saved.');
    } catch (error) { setFeedback((error as Error).message); }
    finally { setIsSaving(false); }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplate) return;
    const confirmed = await requestAdminConfirm({ title: `Delete ${selectedTemplate.name}?`, message: 'The reusable template will be removed. Existing product fields are not changed.' });
    if (!confirmed) return;
    setIsSaving(true); setFeedback('');
    try {
      const response = await fetch(`/api/admin/templates?id=${encodeURIComponent(selectedTemplate.id)}`, { method: 'DELETE', headers: { Authorization: `Bearer ${getAdminToken()}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Template could not be deleted.');
      await loadTemplates(); setFeedback('Template deleted.');
    } catch (error) { setFeedback((error as Error).message); }
    finally { setIsSaving(false); }
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#999]">Advanced</p><h1 className="mt-1 text-3xl font-semibold tracking-[-0.025em]">Customization templates</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#707070]">Reusable customer-input fields for products that genuinely require names, dates or other custom details. Standard Color × Size options belong in Inventory.</p></div><button type="button" onClick={() => void createTemplate()} disabled={isSaving} className="commerce-focus inline-flex min-h-11 items-center gap-2 rounded-[9px] bg-[#202020] px-4 text-sm font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Plus className="h-4 w-4" /> New template</button></div>
      {feedback && <div className="rounded-[9px] border border-[#e5e5e5] bg-white px-4 py-3 text-sm text-[#666]">{feedback}</div>}

      <div className="grid gap-5 xl:grid-cols-[300px_1fr]">
        <aside className="h-fit rounded-[12px] border border-[#e3e3e3] bg-white p-4"><div className="flex items-center gap-3 border-b border-[#eeeeee] pb-4"><Layers3 className="h-4 w-4 text-[#777]" /><div><h2 className="text-sm font-semibold">Templates</h2><p className="mt-1 text-xs text-[#888]">{templates.length} saved</p></div></div><div className="mt-3 space-y-2">{isLoading && <div className="rounded-[9px] bg-[#fafafa] p-4 text-sm text-[#777]">Loading templates...</div>}{!isLoading && templates.length === 0 && <div className="rounded-[9px] bg-[#fafafa] p-4 text-sm text-[#777]">No templates yet.</div>}{templates.map((template) => <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`commerce-focus w-full rounded-[9px] border p-3 text-left ${selectedTemplateId === template.id ? 'border-[#202020] bg-[#f7f7f7]' : 'border-[#e5e5e5] bg-white hover:bg-[#fafafa]'}`}><p className="text-sm font-semibold">{template.name}</p><p className="mt-1 text-xs text-[#888]">{template.fields.length} fields · used on {template.used || 0} products</p></button>)}</div></aside>

        <section className="rounded-[12px] border border-[#e3e3e3] bg-white p-5 sm:p-6">
          {!selectedTemplateId ? <div className="py-14 text-center text-sm text-[#777]">Create a template to configure reusable customization fields.</div> : <>
            <div className="grid gap-4 border-b border-[#eeeeee] pb-5"><div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Template name</label><input value={templateName} onChange={(event) => setTemplateName(event.target.value)} className="commerce-focus h-11 w-full rounded-[9px] border border-[#dedede] px-3.5 text-sm outline-none focus:border-[#202020]" /></div><div><label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#999]">Description</label><textarea rows={3} value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} className="commerce-focus w-full rounded-[9px] border border-[#dedede] px-3.5 py-3 text-sm outline-none focus:border-[#202020]" /></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void saveTemplate()} disabled={isSaving} className="commerce-focus inline-flex items-center gap-2 rounded-[8px] bg-[#202020] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#383838] disabled:opacity-50"><Save className="h-4 w-4" /> Save template</button><button type="button" onClick={() => void deleteTemplate()} disabled={isSaving} className="commerce-focus inline-flex items-center gap-2 rounded-[8px] border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button></div></div>
            <div className="mt-6"><div className="mb-4"><h2 className="text-lg font-semibold">Fields</h2><p className="mt-1 text-sm text-[#777]">Customer inputs included when this template is applied to a customized product.</p></div><PersonalizationFieldBuilder fields={templateFields} onFieldsChange={setTemplateFields} /></div>
          </>}
        </section>
      </div>
    </div>
  );
};
