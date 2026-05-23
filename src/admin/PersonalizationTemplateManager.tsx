import React from 'react';
import { Plus, Wand2 } from 'lucide-react';
import { PersonalizationFieldBuilder } from './PersonalizationFieldBuilder';

export const PersonalizationTemplateManager = () => {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personalization Templates</h1>
          <p className="text-gray-500 text-sm mt-1">Manage reusable custom field templates across products.</p>
        </div>
        <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        
        {/* Template List */}
        <div className="col-span-1 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-gray-900 shadow-sm relative cursor-pointer">
            <div className="absolute top-4 right-4"><Wand2 className="w-4 h-4 text-gray-900" /></div>
            <h3 className="font-medium text-gray-900 mb-1">Standard Embroidery</h3>
            <p className="text-xs text-gray-500 mb-3">Used on 12 products</p>
            <div className="flex gap-1 flex-wrap">
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Text</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Color Swatches</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Font Select</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer text-opacity-70">
            <h3 className="font-medium text-gray-900 mb-1 opacity-70">Engraved Wood</h3>
            <p className="text-xs text-gray-500 mb-3">Used on 5 products</p>
            <div className="flex gap-1 flex-wrap">
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Text</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">Date</span>
            </div>
          </div>
        </div>

        {/* Builder View */}
        <div className="col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div className="flex-1">
                <input type="text" value="Standard Embroidery" readOnly className="text-xl font-bold text-gray-900 focus:outline-none w-full" />
                <p className="text-sm text-gray-500">Edit the fields included in this template.</p>
              </div>
              <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg">Save Changes</button>
            </div>
            
            <PersonalizationFieldBuilder />
          </div>
        </div>

      </div>
    </div>
  );
};
