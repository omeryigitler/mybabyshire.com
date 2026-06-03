import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, Plus, Save, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { DEFAULT_PRODUCT_FIELDS, PersonalizationFieldBuilder, type FieldType, type PersonalizationBuilderField } from './PersonalizationFieldBuilder';
import { getAdminToken } from './adminAuth';

type Template = {
  id: string;
  name: string;
  used: number;
  fields: PersonalizationBuilderField[];
  description: string;
};

const FIELD_TYPES: FieldType[] = ['text', 'color', 'select', 'date'];

const cloneDefaultFields = () =>
  DEFAULT_PRODUCT_FIELDS.map((field) => ({
    ...field,
    options: field.options ? [...field.options] : undefined,
  }));

const normalizeFields = (fields: any[]): PersonalizationBuilderField[] => {
  if (!Array.isArray(fields) || fields.length === 0) return cloneDefaultFields();

  const normalized = fields
    .map((field, index) => {
      const label = String(field?.label || '').trim();
      const fieldKey = String(field?.fieldKey || field?.field_key || '').trim();
      const type = FIELD_TYPES.includes(field?.type || field?.field_type) ? (field?.type || field?.field_type) : 'text';
      if (!label || !fieldKey) return null;

      return {
        id: String(field?.id || `${fieldKey}-${index}`),
        fieldKey,
        type,
        label,
        placeholder: field?.placeholder || '',
        helpText: field?.helpText || field?.help_text || '',
        maxLength: field?.maxLength ?? field?.max_length ?? null,
        options: Array.isArray(field?.options) ? field.options.map(String).filter(Boolean) : [],
        required: Boolean(field?.required),
      };
    })
    .filter(Boolean) as PersonalizationBuilderField[];

  return normalized.length ? normalized : cloneDefaultFields();
};

const fieldLabels = (fields: PersonalizationBuilderField[]) =>
  fields
    .map((field) => {
      if (field.type === 'color') return 'Colors';
      if (field.type === 'select') return 'Select';
      if (field.type === 'date') return 'Date';
      return 'Text';
    })
    .filter((value, index, list) => list.indexOf(value) === index);

export const PersonalizationTemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateFields, setTemplateFields] = useState<PersonalizationBuilderField[]>(cloneDefaultFields);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('');

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId) || null, [templates, selectedTemplateId]);

  const selectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description || '');
    setTemplateFields(normalizeFields(template.fields));
    setLastSaved('');
  };

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/templates', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Could not load templates.');
      const nextTemplates = Array.isArray(data)
        ? data.map((template) => ({ ...template, fields: normalizeFields(template.fields) }))
        : [];
      setTemplates(nextTemplates);
      if (nextTemplates.length) selectTemplate(nextTemplates[0]);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, []);

  const createTemplate = async () => {
    setIsSaving(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'New Personalization Template',
          description: 'Describe where this template should be used.',
          fields: cloneDefaultFields(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Template could not be created.');
      const nextTemplate = { ...data, fields: normalizeFields(data.fields) };
      setTemplates((current) => [nextTemplate, ...current]);
      selectTemplate(nextTemplate);
      setLastSaved('New template created. Add fields and save when ready.');
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveTemplate = async () => {
    const cleanName = templateName.trim() || 'Untitled Template';
    const cleanDescription = templateDescription.trim();

    if (!selectedTemplateId) {
      alert('Create a template first.');
      return;
    }

    setIsSaving(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/templates/${selectedTemplateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cleanName,
          description: cleanDescription,
          fields: templateFields,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Template could not be saved.');
      const savedTemplate = { ...data, fields: normalizeFields(data.fields) };
      setTemplates((current) => current.map((template) => (template.id === savedTemplate.id ? savedTemplate : template)));
      selectTemplate(savedTemplate);
      setLastSaved('Template saved to the database.');
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async () => {
    if (!selectedTemplate) return;
    const confirmed = window.confirm(`Delete "${selectedTemplate.name}"?`);
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/templates/${selectedTemplate.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error || 'Template could not be deleted.');
      const nextTemplates = templates.filter((template) => template.id !== selectedTemplate.id);
      setTemplates(nextTemplates);
      if (nextTemplates.length) selectTemplate(nextTemplates[0]);
      else {
        setSelectedTemplateId('');
        setTemplateName('');
        setTemplateDescription('');
        setTemplateFields(cloneDefaultFields());
      }
      setLastSaved('Template deleted.');
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="relative overflow-hidden rounded-[2rem] border border-boutique-brown/10 bg-white/78 p-6 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
        <img src="/cloud-watercolor-pink.png" className="pointer-events-none absolute -right-10 -top-16 w-56 opacity-25 mix-blend-multiply" alt="" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-boutique-brown/10 bg-[#fffaf3] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown-light"><Sparkles className="h-4 w-4" /> Custom gift setup</div>
            <h1 className="font-serif text-4xl leading-none text-boutique-brown lg:text-5xl">Personalization Templates</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-boutique-brown-light">Create reusable fields for names, colors, dates and special gift details.</p>
          </div>
          <button onClick={createTemplate} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood disabled:opacity-50"><Plus className="h-4 w-4" /> New Template</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-4 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3 px-1"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Layers3 className="h-5 w-5" /></div><div><h2 className="font-bold text-boutique-brown">Template Library</h2><p className="text-xs text-boutique-brown-light">{templates.length} reusable groups</p></div></div>
          <div className="space-y-2">
            {isLoading && <div className="rounded-[1.3rem] border border-boutique-brown/10 bg-[#fffaf3] p-4 text-sm text-boutique-brown-light">Loading templates...</div>}
            {!isLoading && templates.length === 0 && <div className="rounded-[1.3rem] border border-boutique-brown/10 bg-[#fffaf3] p-4 text-sm text-boutique-brown-light">No templates yet. Create one to begin.</div>}
            {templates.map((template) => {
              const isActive = selectedTemplateId === template.id;
              return (
                <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`w-full rounded-[1.3rem] border p-4 text-left transition-all ${isActive ? 'border-boutique-brown bg-[#fff4df] shadow-sm' : 'border-boutique-brown/10 bg-white hover:bg-[#fffaf3]'}`}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-boutique-brown">{template.name}</h3><p className="mt-1 text-xs text-boutique-brown-light">Used on {template.used || 0} products</p></div>{isActive && <Wand2 className="h-4 w-4 text-boutique-brown" />}</div>
                  <p className="mt-2 text-xs leading-relaxed text-boutique-brown-light">{template.description || 'No description yet.'}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{fieldLabels(template.fields).map((field) => <span key={field} className="rounded-full border border-boutique-brown/10 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-boutique-brown-light shadow-sm">{field}</span>)}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="mb-5 rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Template name</label><input type="text" value={templateName} disabled={!selectedTemplateId} onChange={(event) => setTemplateName(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 font-serif text-2xl text-boutique-brown outline-none focus:ring-2 focus:ring-boutique-wood/25 disabled:opacity-50" /></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Description</label><textarea rows={2} value={templateDescription} disabled={!selectedTemplateId} onChange={(event) => setTemplateDescription(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 text-sm text-boutique-brown outline-none focus:ring-2 focus:ring-boutique-wood/25 disabled:opacity-50" /></div>
              </div>
              <div className="flex gap-2">
                {selectedTemplateId && <button onClick={deleteTemplate} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-100 bg-white px-5 py-3 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button>}
                <button onClick={saveTemplate} disabled={isSaving || !selectedTemplateId} className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-wood disabled:opacity-50"><Save className="h-4 w-4" /> {isSaving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
            {lastSaved && <p className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-bold text-boutique-brown-light">{lastSaved}</p>}
          </div>

          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-serif text-3xl text-boutique-brown">Fields</h2><p className="mt-1 text-sm text-boutique-brown-light">Editing: {selectedTemplate?.name || 'No template selected'}</p></div></div>
          <PersonalizationFieldBuilder fields={templateFields} onFieldsChange={selectedTemplateId ? setTemplateFields : undefined} />
        </section>
      </div>
    </div>
  );
};
