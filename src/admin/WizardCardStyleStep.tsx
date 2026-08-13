import React from 'react';
import { CardDesignFrame } from '../components/CardDesignFrame';
import { CARD_CLOUD_SHAPES, CARD_COLORS, CARD_PANEL_SHAPES } from '../utils/cardDesign';
import type { ProductWizardDraft } from './productWizardDraft';
import { WizardFieldLabel, WizardSwitch } from './productWizardUi';

export const WizardCardStyleStep = ({ draft, update }: { draft: ProductWizardDraft; update: (patch: Partial<ProductWizardDraft>) => void }) => (
  <div className="space-y-7">
    <div><WizardFieldLabel>Cloud shape</WizardFieldLabel><div className="grid grid-cols-3 gap-3">{CARD_CLOUD_SHAPES.map((shape) => <button key={shape.id} type="button" onClick={() => update({ cloudShape: shape.id })} className={`rounded-2xl border p-2 ${draft.cloudShape === shape.id ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><CardDesignFrame design={{ cloud: shape.id, panel: draft.panelShape, color: draft.cardColor }} className="aspect-[1.6/1] w-full" /><span className="mt-1 block text-xs font-bold text-boutique-brown">{shape.label}</span></button>)}</div></div>
    <div><WizardFieldLabel>Inner panel</WizardFieldLabel><div className="grid grid-cols-2 gap-3">{CARD_PANEL_SHAPES.map((shape) => <button key={shape.id} type="button" onClick={() => update({ panelShape: shape.id })} className={`rounded-2xl border p-2 ${draft.panelShape === shape.id ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><CardDesignFrame design={{ cloud: draft.cloudShape, panel: shape.id, color: draft.cardColor }} className="aspect-[1.6/1] w-full" /><span className="mt-1 block text-xs font-bold text-boutique-brown">{shape.label}</span></button>)}</div></div>
    <div><WizardFieldLabel>Color</WizardFieldLabel><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{CARD_COLORS.map((color) => <button key={color.id} type="button" onClick={() => update({ cardColor: color.id })} className={`rounded-2xl border p-2 ${draft.cardColor === color.id ? 'border-boutique-brown bg-[#fff4df]' : 'border-boutique-brown/10 bg-white'}`}><CardDesignFrame design={{ cloud: draft.cloudShape, panel: draft.panelShape, color: color.id }} className="aspect-[1.6/1] w-full" /><span className="mt-1 block text-xs font-bold text-boutique-brown">{color.label}</span></button>)}</div></div>
    <div className="flex items-center justify-between rounded-[1.3rem] bg-[#fffaf3] p-4"><div><p className="text-sm font-bold text-boutique-brown">Create color set</p><p className="mt-1 text-xs text-boutique-brown-light">Create the available cloud color variants when the product is saved.</p></div><WizardSwitch checked={draft.createCloudVariants} onClick={() => update({ createCloudVariants: !draft.createCloudVariants })} /></div>
  </div>
);
