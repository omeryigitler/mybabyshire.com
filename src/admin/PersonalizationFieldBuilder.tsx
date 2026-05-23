import React, { useState } from 'react';
import { Plus, GripVertical, Trash, Settings } from 'lucide-react';

type FieldType = 'text' | 'color' | 'select' | 'date';

interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  options?: string[]; // for color/select
  required: boolean;
}

export const PersonalizationFieldBuilder = () => {
  const [fields, setFields] = useState<Field[]>([
    { id: '1', type: 'text', label: "Baby's Name", placeholder: "e.g. Liam", required: true },
    { id: '2', type: 'color', label: "Thread Color", options: ['#D4AF37', '#FFC0CB', '#ADD8E6'], required: true },
  ]);

  const addField = (type: FieldType) => {
    setFields([...fields, { 
      id: Math.random().toString(), 
      type, 
      label: `New ${type} field`, 
      required: false,
      options: type === 'color' || type === 'select' ? ['Option 1'] : undefined
    }]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-4">
        <button onClick={() => addField('text')} className="px-3 py-1.5 bg-gray-100 rounded text-xs font-medium text-gray-700 hover:bg-gray-200">+ Text</button>
        <button onClick={() => addField('color')} className="px-3 py-1.5 bg-gray-100 rounded text-xs font-medium text-gray-700 hover:bg-gray-200">+ Colors</button>
        <button onClick={() => addField('select')} className="px-3 py-1.5 bg-gray-100 rounded text-xs font-medium text-gray-700 hover:bg-gray-200">+ Select</button>
      </div>

      <div className="space-y-3">
        {fields.map((field, idx) => (
          <div key={field.id} className="flex gap-4 items-start bg-gray-50 border border-gray-200 rounded-lg p-4 group">
            <button className="mt-1 cursor-grab opacity-30 hover:opacity-100"><GripVertical className="w-5 h-5" /></button>
            
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Field Label</label>
                  <input type="text" value={field.label} readOnly className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none" />
                </div>
                <div>
                   <label className="block text-xs font-medium text-gray-500 mb-1">Field Type</label>
                   <select value={field.type} disabled className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-100 text-gray-500 pointer-events-none appearance-none">
                     <option value="text">Short Text</option>
                     <option value="color">Color Swatches</option>
                     <option value="select">Dropdown Options</option>
                   </select>
                </div>
              </div>

              {(field.type === 'color' || field.type === 'select') && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Options (comma separated)</label>
                  <input type="text" value={field.options?.join(', ')} readOnly className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none" />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mr-2">
                <input type="checkbox" checked={field.required} readOnly className="rounded text-gray-900 border-gray-300" />
                Required
              </label>
              <button className="p-1.5 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded shadow-sm"><Settings className="w-4 h-4" /></button>
              <button onClick={() => removeField(field.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-white border border-gray-200 rounded shadow-sm"><Trash className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-400 border-2 border-dashed rounded-lg border-gray-200">
            No fields added yet. Add one above.
          </div>
        )}
      </div>
    </div>
  );
};
