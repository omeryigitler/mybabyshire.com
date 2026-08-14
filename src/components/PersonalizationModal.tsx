import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ChevronRight, Check } from 'lucide-react';
import { useStore, type PersonalizationField } from '../store/useStore';

const DEFAULT_PERSONALIZATION_FIELDS: PersonalizationField[] = [
  { id: 'default-name', fieldKey: 'babyName', label: "Baby's Name", type: 'text', placeholder: 'e.g. Liam', required: true, maxLength: 32 },
  { id: 'default-thread', fieldKey: 'threadColor', label: 'Thread Color', type: 'color', required: true, options: ['#D4AF37', '#FFC0CB', '#ADD8E6', '#F5F5DC', '#98FF98'] },
  { id: 'default-font', fieldKey: 'fontStyle', label: 'Font Style', type: 'select', required: false, options: ['Classic Script', 'Modern Serif', 'Soft Rounded'] },
];

export const PersonalizationModal = () => {
  const { isPersonalizationModalOpen, selectedProduct, closePersonalizationModal, addToCart } = useStore();
  const [step, setStep] = useState(1);
  const [personalizationData, setPersonalizationData] = useState<Record<string, string>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPersonalizationModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPersonalizationModalOpen]);

  useEffect(() => {
    if (!isPersonalizationModalOpen) return;
    setStep(1);
    setPersonalizationData({});
  }, [isPersonalizationModalOpen, selectedProduct?.id]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
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

    addToCart({
      product: selectedProduct,
      quantity: 1,
      personalizationData: completedData,
    });
    handleClose();
  };

  if (!selectedProduct) return null;

  const fields = getFieldsForProduct();
  const firstField = fields[0];
  const secondaryFields = fields.slice(1);
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
        <div className="flex flex-col gap-3">
          <label className="ml-2 text-xs font-bold uppercase tracking-wider text-[#5a4234]">
            {field.label}{field.required ? ' *' : ''}
          </label>
          <div className="flex flex-wrap gap-3 px-2">
            {options.map((color) => (
              <button
                type="button"
                key={color}
                onClick={() => updateFieldValue(field, color)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${value === color ? 'scale-110 border-[#3a251a]' : 'border-transparent shadow-sm hover:scale-105'}`}
                style={{ backgroundColor: color }}
                aria-label={`${field.label} ${color}`}
              >
                {value === color && <Check className="h-4 w-4 text-[#3a251a] mix-blend-difference" />}
              </button>
            ))}
          </div>
          {field.helpText && <p className="ml-2 text-xs italic text-[#d4b497]">{field.helpText}</p>}
        </div>
      );
    }

    if (field.type === 'select') {
      const useCompactGrid = options.length >= 5 && options.every((option) => option.length <= 12);

      return (
        <div className="flex flex-col gap-3">
          <label className="ml-2 text-xs font-bold uppercase tracking-wider text-[#5a4234]">
            {field.label}{field.required ? ' *' : ''}
          </label>
          <div className={useCompactGrid ? 'grid grid-cols-3 gap-2' : 'flex flex-col gap-2'}>
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => updateFieldValue(field, option)}
                className={`rounded-2xl border px-5 py-3.5 transition-all ${useCompactGrid ? 'text-center' : 'text-left'} ${value === option ? 'border-[#d4b497] bg-[#f7ede3] text-[#3a251a]' : 'border-[#d4b497]/20 bg-[#fcfaf6] text-[#5a4234] hover:bg-[#f7ede3]/50'}`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
          {field.helpText && <p className="ml-2 text-xs italic text-[#d4b497]">{field.helpText}</p>}
          {isFieldMissing(field) && <p className="ml-2 text-xs italic text-[#d4b497]">Please choose an option.</p>}
        </div>
      );
    }

    const inputType = field.type === 'date' ? 'date' : 'text';

    return (
      <div className="flex flex-col gap-2">
        <label className="ml-2 text-xs font-bold uppercase tracking-wider text-[#5a4234]">
          {field.label}{field.required ? ' *' : ''}
        </label>
        <input
          type={inputType}
          value={value}
          maxLength={field.maxLength || undefined}
          onChange={(event) => updateFieldValue(field, event.target.value)}
          className="w-full rounded-2xl border border-[#d4b497]/30 bg-[#fcfaf6] px-5 py-4 text-lg font-medium text-[#3a251a] placeholder:text-[#d4b497] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#d4b497]/50"
          placeholder={field.placeholder || 'Enter custom text'}
        />
        {field.helpText && <p className="ml-2 text-xs italic text-[#d4b497]">{field.helpText}</p>}
        {isFieldMissing(field) && <p className="ml-2 mt-1 text-xs italic text-[#d4b497]">This field is required.</p>}
      </div>
    );
  };

  const detailsSummary = (
    <div className="w-full rounded-2xl border border-[#d4b497]/20 bg-white/75 p-4 text-left shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#d4b497]">Your details</p>
      <div className="mt-3 space-y-2.5">
        {fields.map((field) => {
          const value = getFieldValue(field);
          return (
            <div key={field.fieldKey} className="flex items-start justify-between gap-4 border-b border-[#d4b497]/10 pb-2.5 last:border-0 last:pb-0">
              <span className="text-[11px] font-bold text-[#5a4234]">{field.label}</span>
              <span className={`max-w-[58%] break-words text-right text-sm font-medium ${value ? 'text-[#3a251a]' : 'text-[#b69a84]'}`}>{value || 'Not selected yet'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isPersonalizationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden p-3 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-[#3a251a]/20 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300, duration: 0.6 }}
            className="relative flex max-h-[92dvh] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-modal)] md:max-h-[90dvh] md:flex-row"
          >
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-4 top-4 z-20 rounded-full bg-white/90 p-2 text-[#5a4234] shadow-sm backdrop-blur-sm transition-colors hover:bg-[#f7ede3]"
              aria-label="Close choose details"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative hidden w-1/2 flex-shrink-0 flex-col items-center justify-center border-r border-[#d4b497]/20 bg-[#fcfaf6] p-10 md:flex">
              <img src="/cloud-watercolor-pink.png" className="absolute left-10 top-10 w-24 opacity-60 mix-blend-multiply" alt="" />
              <img src="/toy-wooden-star-solid.png" className="absolute bottom-16 right-12 w-12 rotate-12 opacity-50 mix-blend-multiply" alt="" />

              <motion.div
                key={selectedProduct.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex w-full flex-col items-center"
              >
                <img src={selectedProduct.imageUrl} className="h-60 w-60 object-contain drop-shadow-xl" alt={selectedProduct.name} />
                <div className="mt-6 text-center">
                  <h2 className="mb-2 font-serif text-2xl text-[#3a251a]">{selectedProduct.name}</h2>
                  <p className="font-medium text-[#5a4234] opacity-80">${selectedProduct.price.toFixed(2)}</p>
                </div>
                <div className="mt-6 w-full max-w-sm">{detailsSummary}</div>
              </motion.div>
            </div>

            <div className="flex min-h-0 w-full flex-1 flex-col md:w-1/2">
              <div className="flex flex-shrink-0 items-center justify-between px-6 pb-5 pt-7 sm:px-8 md:px-10 md:pt-10">
                <div className="flex gap-2">
                  {[1, 2, 3].map((itemStep) => (
                    <div
                      key={itemStep}
                      className={`h-1.5 rounded-full transition-all duration-300 ${itemStep === step ? 'w-8 bg-[#d4b497]' : itemStep < step ? 'w-4 bg-[#d4b497]/60' : 'w-4 bg-[#f7ede3]'}`}
                    />
                  ))}
                </div>
                <div className="mr-10 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#d4b497] sm:mr-8">
                  <Sparkles className="h-3 w-3" /> Step {step} of 3
                </div>
              </div>

              <div ref={contentRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 sm:px-8 md:px-10">
                <div className="mb-5 flex items-center gap-4 rounded-2xl border border-[#d4b497]/20 bg-[#fcfaf6] p-3 md:hidden">
                  <img src={selectedProduct.imageUrl} className="h-20 w-20 shrink-0 object-contain" alt={selectedProduct.name} />
                  <div className="min-w-0"><p className="line-clamp-2 font-serif text-lg text-[#3a251a]">{selectedProduct.name}</p><p className="mt-1 text-sm font-bold text-[#5a4234]">${selectedProduct.price.toFixed(2)}</p></div>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h3 className="mb-2 font-serif text-[1.4rem] text-[#3a251a]">Choose the first detail</h3>
                        <p className="text-sm text-[#5a4234] opacity-80">Your choices are stored with the order. The product photo stays true to the catalog image.</p>
                      </div>
                      {firstField && renderField(firstField)}
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-6"
                    >
                      <div>
                        <h3 className="mb-2 font-serif text-[1.4rem] text-[#3a251a]">Complete the details</h3>
                        <p className="text-sm text-[#5a4234] opacity-80">Choose the remaining options for this gift.</p>
                      </div>
                      <div className="flex flex-col gap-5">
                        {secondaryFields.length
                          ? secondaryFields.map((field) => <div key={field.id}>{renderField(field)}</div>)
                          : <p className="rounded-2xl border border-[#d4b497]/20 bg-[#fcfaf6] p-5 text-sm text-[#5a4234]">No extra details are needed for this gift.</p>}
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col gap-6"
                    >
                      <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#f7ede3]">
                          <Sparkles className="h-8 w-8 text-[#d4b497]" />
                        </div>
                        <h3 className="mb-2 font-serif text-2xl text-[#3a251a]">Review your details</h3>
                        <p className="max-w-sm text-sm text-[#5a4234] opacity-80">We will prepare the order using the choices below. No generated preview is used.</p>
                      </div>
                      {detailsSummary}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[#d4b497]/20 bg-white px-6 py-4 shadow-[0_-8px_24px_rgba(58,37,26,0.06)] sm:px-8 md:px-10 md:py-5">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((currentStep) => currentStep - 1)}
                    className="text-sm font-bold tracking-wide text-[#5a4234] hover:text-[#3a251a]"
                  >
                    Back
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  {!isStepValid && <span className="hidden max-w-32 text-right text-xs text-[#9b6f55] sm:block">Complete all required choices.</span>}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isStepValid) return;
                      if (isLastStep) handleAddToCart();
                      else setStep((currentStep) => currentStep + 1);
                    }}
                    disabled={!isStepValid}
                    className="flex items-center gap-2 rounded-full bg-[#3a251a] px-6 py-3.5 font-bold tracking-wide text-white shadow-md transition-colors hover:bg-[#4a3328] disabled:cursor-not-allowed disabled:opacity-50 sm:px-8"
                  >
                    {isLastStep ? 'Add to Gift Bag' : 'Next Step'} <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
