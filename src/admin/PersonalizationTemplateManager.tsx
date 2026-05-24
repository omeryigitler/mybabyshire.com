import React, { useMemo, useState } from 'react';
import { Layers3, Plus, Save, Sparkles, Wand2 } from 'lucide-react';
import { PersonalizationFieldBuilder } from './PersonalizationFieldBuilder';

type Template = {
  id: string;
  name: string;
  used: number;
  fields: string[];
  description: string;
};

const initialTemplates: Template[] = [
  { id: 'embroidery', name: 'Standard Embroidery', used: 12, fields: ['Text', 'Colors', 'Select'], description: 'Names, thread colors and optional style choices.' },
  { id: 'engraved', name: 'Engraved Wood', used: 5, fields: ['Text', 'Date'], description: 'Short messages and special dates for keepsakes.' },
];

export const PersonalizationTemplateManager = () => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState(initialTemplates[0].id);
  const [templateName, setTemplateName] = useState(initialTemplates[0].name);
  const [templateDescription, setTemplateDescription] = useState(initialTemplates[0].description);
  const [lastSaved, setLastSaved] = useState('');

  const selectedTemplate = useMemo(() => templates.find((template) => template.id === selectedTemplateId) || templates[0], [templates, selectedTemplateId]);

  const selectTemplate = (template: Template) => {
    setSelectedTemplateId(template.id);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setLastSaved('');
  };

  const createTemplate = () => {
    const newTemplate: Template = {
      id: `template-${Date.now()}`,
      name: 'New Personalization Template',
      used: 0,
      fields: ['Text'],
      description: 'Describe where this template should be used.',
    };

    setTemplates((current) => [newTemplate, ...current]);
    setSelectedTemplateId(newTemplate.id);
    setTemplateName(newTemplate.name);
    setTemplateDescription(newTemplate.description);
    setLastSaved('New template created. Add fields and save when ready.');
  };

  const saveTemplate = () => {
    const cleanName = templateName.trim() || 'Untitled Template';
    const cleanDescription = templateDescription.trim() || 'No description added yet.';

    setTemplates((current) => current.map((template) => template.id === selectedTemplateId ? { ...template, name: cleanName, description: cleanDescription } : template));
    setTemplateName(cleanName);
    setTemplateDescription(cleanDescription);
    setLastSaved('Template saved locally for this admin session.');
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
          <button onClick={createTemplate} className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm transition-transform hover:-translate-y-0.5 hover:bg-boutique-wood"><Plus className="h-4 w-4" /> New Template</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <aside className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-4 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3 px-1"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-boutique-brown shadow-sm"><Layers3 className="h-5 w-5" /></div><div><h2 className="font-bold text-boutique-brown">Template Library</h2><p className="text-xs text-boutique-brown-light">{templates.length} reusable groups</p></div></div>
          <div className="space-y-2">
            {templates.map((template) => {
              const isActive = selectedTemplateId === template.id;
              return (
                <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`w-full rounded-[1.3rem] border p-4 text-left transition-all ${isActive ? 'border-boutique-brown bg-[#fff4df] shadow-sm' : 'border-boutique-brown/10 bg-white hover:bg-[#fffaf3]'}`}>
                  <div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-boutique-brown">{template.name}</h3><p className="mt-1 text-xs text-boutique-brown-light">Used on {template.used} products</p></div>{isActive && <Wand2 className="h-4 w-4 text-boutique-brown" />}</div>
                  <p className="mt-2 text-xs leading-relaxed text-boutique-brown-light">{template.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">{template.fields.map((field) => <span key={field} className="rounded-full border border-boutique-brown/10 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-boutique-brown-light shadow-sm">{field}</span>)}</div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="rounded-[2rem] border border-boutique-brown/10 bg-white/82 p-5 shadow-[0_20px_55px_rgba(58,37,26,0.08)] backdrop-blur-sm">
          <div className="mb-5 rounded-[1.5rem] border border-boutique-brown/10 bg-[#fffaf3] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-4">
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Template name</label><input type="text" value={templateName} onChange={(event) => setTemplateName(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 font-serif text-2xl text-boutique-brown outline-none focus:ring-2 focus:ring-boutique-wood/25" /></div>
                <div><label className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-boutique-brown/55">Description</label><textarea rows={2} value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} className="w-full rounded-2xl border border-boutique-brown/10 bg-white px-4 py-3 text-sm text-boutique-brown outline-none focus:ring-2 focus:ring-boutique-wood/25" /></div>
              </div>
              <button onClick={saveTemplate} className="inline-flex items-center justify-center gap-2 rounded-full bg-boutique-brown px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-boutique-wood"><Save className="h-4 w-4" /> Save Changes</button>
            </div>
            {lastSaved && <p className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-bold text-boutique-brown-light">{lastSaved}</p>}
          </div>

          <div className="mb-4 flex items-center justify-between gap-4"><div><h2 className="font-serif text-3xl text-boutique-brown">Fields</h2><p className="mt-1 text-sm text-boutique-brown-light">Editing: {selectedTemplate?.name}</p></div></div>
          <PersonalizationFieldBuilder />
        </section>
      </div>
    </div>
  );
};
