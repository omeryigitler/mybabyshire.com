import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useStore, type PersonalizationField } from '../store/useStore';

const DEFAULT_PERSONALIZATION_FIELDS: PersonalizationField[] = [
  { id: 'default-name', fieldKey: 'babyName', label: "Baby's Name", type: 'text', placeholder: 'e.g. Liam', required: true, maxLength: 32 },
  { id: 'default-thread', fieldKey: 'threadColor', label: 'Thread Color', type: 'color', required: true, options: ['#D4AF37', '#FFC0CB', '#ADD8E6', '#F5F5DC', '#98FF98'] },
  { id: 'default-font', fieldKey: 'fontStyle', label: 'Font Style', type: 'select', required: false, options: ['Classic Script', 'Modern Serif', 'Soft Rounded'] },
];

export const PersonalizationModal = () => {
  const { isPersonalizationModalOpen, selectedProduct, selectedVariant, closePersonalizationModal, addToCart } = useStore();
  const [step, setStep] = useState(1);
  const [personalizationData, setPersonalizationData] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPersonalizationModalOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior = previousHtmlOverscroll;
    };
  }, [isPersonalizationModalOpen]);

  useEffect(() => {
    if (!isPersonalizationModalOpen) return;
    setStep(1);
    setPersonalizationData({});
  }, [isPersonalizationModalOpen, selectedProduct?.id, selectedVariant?.id]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [step, selectedProduct?.id]);

  const getFieldsForProduct = () => (
    selectedProduct?.personalizationFields?.length
      ? selectedProduct.personalizationFields
      : DEFAULT_PERSONALIZATION_FIELDS
  );

  const handleClose = () => {
    setStep(1);
    setPersonalizationData({});
    closePersonalizationModal();
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    const completedData = getFieldsForProduct().reduce<Record<string, string>>((result, field) => {
      const value = personalizationData[field.fieldKey] ?? field.defaultValue ?? '';
      if (value) result[field.fieldKey] = value;
      return result;
    }, {});

    addToCart({ product: selectedProduct, variant: selectedVariant, quantity: 1, personalizationData: completedData });
    handleClose();
  };

  if (!selectedProduct) return null;

  const fields = getFieldsForProduct();
  const firstField = fields[0];
  const secondaryFields = fields.slice(1);
  const unitPrice = selectedVariant?.price ?? selectedProduct.price;
  const variantLabel = selectedVariant ? [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' / ') : '';
  const getFieldValue = (field: PersonalizationField) => String(personalizationData[field.fieldKey] ?? field.defaultValue ?? '');
  const isLastStep = step === 3;
  const isFieldMissing = (field: PersonalizationField) => field.required && !getFieldValue(field).trim();
  const isStepValid = step === 1
    ? !firstField || !isFieldMissing(firstField)
    : step === 2
      ? !secondaryFields.some(isFieldMissing)
      : true;

  const updateFieldValue = (field: PersonalizationField, value: string) => {
    setPersonalizationData((current) => ({ ...current, [field.fieldKey]: value }));
  };

  const renderField = (field: PersonalizationField) => {
    const value = getFieldValue(field);
    const options = field.options || [];

    if (field.type === 'color') {
      return (
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[#555550]">
            {field.label}{field.required ? ' *' : ''}
          </label>
          <div className="flex flex-wrap gap-3">
            {options.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => updateFieldValue(field, color)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-transform ${value === color ? 'scale-110 border-[#202020] ring-2 ring-white ring-offset-1 ring-offset-[#202020]' : 'border-[#d8d8d2] hover:scale-105'}`}
                style={{ backgroundColor: color }}
                aria-label={`${field.label} ${color}`}
              >
                {value === color && <Check className="h-4 w-4 text-[#202020] mix-blend-difference" />}
              </button>
            ))}
          </div>
          {field.helpText && <p className="mt-3 text-xs leading-5 text-[#777770]">{field.helpText}</p>}
          {isFieldMissing(field) && <p className="mt-2 text-xs font-medium text-[#a25b5b]">Please choose an option.</p>}
        </div>
      );
    }

    if (field.type === 'select') {
      const useCompactGrid = options.length >= 5 && options.every((option) => option.length <= 12);
      return (
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-[#555550]">
            {field.label}{field.required ? ' *' : ''}
          </label>
          <div className={useCompactGrid ? 'grid grid-cols-2 gap-2 sm:grid-cols-3' : 'grid gap-2'}>
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => updateFieldValue(field, option)}
                className={`min-h-12 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${useCompactGrid ? 'text-center' : 'text-left'} ${value === option ? 'border-[#202020] bg-[#202020] text-white' : 'border-[#deded9] bg-white text-[#3e3e39] hover:border-[#a9a9a2] hover:bg-[#fafaf8]'}`}
              >
                {option}
              </button>
            ))}
          </div>
          {field.helpText && <p className="mt-3 text-xs leading-5 text-[#777770]">{field.helpText}</p>}
          {isFieldMissing(field) && <p className="mt-2 text-xs font-medium text-[#a25b5b]">Please choose an option.</p>}
        </div>
      );
    }

    const inputType = field.type === 'date' ? 'date' : 'text';
    return (
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[#555550]">
          {field.label}{field.required ? ' *' : ''}
        </label>
        <input
          type={inputType}
          value={value}
          maxLength={field.maxLength || undefined}
          onChange={(event) => updateFieldValue(field, event.target.value)}
          className="h-12 w-full rounded-xl border border-[#deded9] bg-white px-4 text-base text-[#202020] outline-none placeholder:text-[#a2a29b] focus:border-[#202020] focus:ring-1 focus:ring-[#202020] sm:text-sm"
          placeholder={field.placeholder || 'Enter custom text'}
        />
        {field.helpText && <p className="mt-2 text-xs leading-5 text-[#777770]">{field.helpText}</p>}
        {isFieldMissing(field) && <p className="mt-2 text-xs font-medium text-[#a25b5b]">This field is required.</p>}
      </div>
    );
  };

  const detailsSummary = (
    <div className="rounded-xl border border-[#e3e3de] bg-white">
      {variantLabel && (
        <div className="flex items-start justify-between gap-5 border-b border-[#ecece8] px-4 py-3">
          <span className="text-xs font-medium text-[#777770]">Variant</span>
          <span className="max-w-[60%] text-right text-sm font-semibold text-[#202020]">{variantLabel}</span>
        </div>
      )}
      {fields.map((field, index) => {
        const value = getFieldValue(field);
        return (
          <div key={field.fieldKey} className={`flex items-start justify-between gap-5 px-4 py-3 ${index < fields.length - 1 ? 'border-b border-[#ecece8]' : ''}`}>
            <span className="text-xs font-medium text-[#777770]">{field.label}</span>
            <span className={`max-w-[60%] break-words text-right text-sm font-semibold ${value ? 'text-[#202020]' : 'text-[#9a9a93]'}`}>{value || 'Not selected'}</span>
          </div>
        );
      })}
    </div>
  );

  const stepTitle = step === 1 ? 'Choose the first detail' : step === 2 ? 'Complete your options' : 'Review your details';
  const stepDescription = step === 1
    ? 'Select the first required option for this item.'
    : step === 2
      ? 'Choose any remaining details before adding the item to your cart.'
      : 'Confirm the selections below. These details will be saved with your order.';

  return (
    <AnimatePresence>
      {isPersonalizationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-stretch justify-center sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/40 sm:backdrop-blur-sm"
          />

          <motion.section
            role="dialog"
            aria-modal="true"
            aria-label={`Personalize ${selectedProduct.name}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative z-10 flex h-[100dvh] min-h-0 w-full max-w-4xl flex-col overflow-hidden bg-white shadow-[0_30px_90px_rgba(0,0,0,0.2)] sm:h-[min(92dvh,820px)] sm:max-h-[92dvh] sm:rounded-2xl sm:border sm:border-[#deded9] md:grid md:grid-cols-[300px_minmax(0,1fr)]"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#65655f] shadow-sm ring-1 ring-[#e5e5df] hover:bg-[#f5f5f2] hover:text-[#202020] sm:right-4 sm:top-4"
              aria-label="Close personalization"
            >
              <X className="h-5 w-5" />
            </button>

            <aside className="hidden min-h-0 overflow-y-auto border-r border-[#e6e6e1] bg-[#f7f7f5] p-7 md:flex md:flex-col">
              <div className="flex min-h-64 shrink-0 items-center justify-center rounded-xl bg-white p-5 ring-1 ring-[#e8e8e3]">
                <img src={selectedProduct.imageUrl} className="max-h-56 w-full object-contain" alt={selectedProduct.name} />
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a8a82]">Your item</p>
                <h2 className="mt-2 text-xl font-semibold leading-snug text-[#202020]">{selectedProduct.name}</h2>
                {variantLabel && <p className="mt-1 text-xs font-medium text-[#777770]">{variantLabel}</p>}
                <p className="mt-2 text-sm font-semibold text-[#202020]">${unitPrice.toFixed(2)}</p>
              </div>
              <div className="mt-6 pb-2">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#8a8a82]">Selections</p>
                {detailsSummary}
              </div>
            </aside>

            <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
              <div className="shrink-0 border-b border-[#ecece8] px-5 pb-4 pt-5 sm:px-7 sm:pb-5 sm:pt-7 md:px-9">
                <div className="pr-12">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a8a82]">Step {step} of 3</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((itemStep) => (
                      <div key={itemStep} className={`h-1 rounded-full ${itemStep <= step ? 'bg-[#202020]' : 'bg-[#e9e9e4]'}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div
                ref={contentRef}
                className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 py-5 sm:px-7 sm:py-6 md:px-9 md:py-8"
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
              >
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#f7f7f5] p-3 md:hidden">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white p-2 ring-1 ring-[#e5e5df] sm:h-20 sm:w-20">
                    <img src={selectedProduct.imageUrl} className="h-full w-full object-contain" alt={selectedProduct.name} />
                  </div>
                  <div className="min-w-0 pr-10">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[#202020]">{selectedProduct.name}</p>
                    {variantLabel && <p className="mt-1 text-xs text-[#777770]">{variantLabel}</p>}
                    <p className="mt-1 text-sm font-semibold text-[#202020]">${unitPrice.toFixed(2)}</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                    className="pb-4"
                  >
                    <h3 className="text-2xl font-semibold tracking-[-0.025em] text-[#202020]">{stepTitle}</h3>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-[#6b6b64]">{stepDescription}</p>

                    <div className="mt-7">
                      {step === 1 && firstField && renderField(firstField)}
                      {step === 2 && (
                        <div className="grid gap-6">
                          {secondaryFields.length
                            ? secondaryFields.map((field) => <div key={field.id}>{renderField(field)}</div>)
                            : <p className="rounded-xl bg-[#f7f7f5] p-4 text-sm leading-6 text-[#66665f]">No extra details are needed for this item.</p>}
                        </div>
                      )}
                      {step === 3 && detailsSummary}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#ecece8] bg-white px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 sm:px-7 sm:py-4 md:px-9">
                <div className="min-w-0">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep((currentStep) => currentStep - 1)}
                      className="inline-flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-[#555550] hover:bg-[#f5f5f2] hover:text-[#202020] sm:gap-2 sm:px-3"
                    >
                      <ChevronLeft className="h-4 w-4" /> Back
                    </button>
                  )}
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  {!isStepValid && <span className="hidden max-w-36 text-right text-xs leading-4 text-[#8a5d5d] sm:block">Complete the required choice.</span>}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isStepValid) return;
                      if (isLastStep) handleAddToCart();
                      else setStep((currentStep) => currentStep + 1);
                    }}
                    disabled={!isStepValid}
                    className="inline-flex h-11 min-w-24 items-center justify-center gap-2 rounded-xl bg-[#202020] px-4 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:bg-[#b7b7b1] sm:min-w-36 sm:px-5"
                  >
                    {isLastStep ? 'Add to Cart' : 'Next'}
                    {!isLastStep && <ChevronRight className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>
  );
};
