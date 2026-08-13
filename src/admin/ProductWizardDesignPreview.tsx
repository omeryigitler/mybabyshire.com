import React from 'react';
import { Eye } from 'lucide-react';
import { ProductCreateWizard } from './ProductCreateWizard';

export const ProductWizardDesignPreview = () => (
  <div className="relative min-h-screen bg-boutique-bg px-4 py-6 font-sans text-boutique-brown sm:px-6 md:px-10">
    <div className="pointer-events-none fixed inset-0 bg-pattern bg-[length:420px_420px] opacity-30" />
    <div className="relative z-10 mx-auto mb-5 flex w-full max-w-[1180px] items-start gap-3 rounded-[1.4rem] border border-boutique-brown/10 bg-[#fffaf3]/95 px-4 py-3 shadow-sm backdrop-blur sm:items-center">
      <Eye className="mt-0.5 h-5 w-5 shrink-0 text-boutique-brown sm:mt-0" />
      <div>
        <p className="text-sm font-bold text-boutique-brown">Design review mode</p>
        <p className="mt-0.5 text-xs leading-relaxed text-boutique-brown-light">You can inspect all 8 steps without signing in. Real product upload, category loading and publishing still require the protected admin.</p>
      </div>
    </div>
    <div className="relative z-10 mx-auto w-full max-w-[1180px]">
      <ProductCreateWizard />
    </div>
  </div>
);
