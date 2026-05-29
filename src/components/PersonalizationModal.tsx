import React, { useState } from 'react';
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
  const [personalizationData, setPersonalizationData] = useState<Record<string, any>>({});
  
  const getFieldsForProduct = () => {
    return selectedProduct?.personalizationFields?.length ? selectedProduct.personalizationFields : DEFAULT_PERSONALIZATION_FIELDS;
  };

  const handleClose = () => {
    setStep(1);
    setPersonalizationData({});
    closePersonalizationModal();
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      addToCart({
        product: selectedProduct,
        quantity: 1,
        personalizationData
      });
      handleClose();
    }
  };

  if (!selectedProduct) return null;

  const fields = getFieldsForProduct();
  const firstField = fields[0];
  const secondaryFields = fields.slice(1);
  const fieldByKey = new Map(fields.map((field) => [field.fieldKey, field]));
  const previewTextField = fields.find((field) => field.type === 'text') || firstField;
  const previewColorField = fields.find((field) => field.type === 'color');
  const previewText = previewTextField ? personalizationData[previewTextField.fieldKey] : '';
  const previewColor = previewColorField ? personalizationData[previewColorField.fieldKey] : undefined;
  const isLastStep = step === 3;
  const isFieldMissing = (field: PersonalizationField) => field.required && !String(personalizationData[field.fieldKey] || '').trim();
  const isStepValid = step === 1
    ? !firstField || !isFieldMissing(firstField)
    : step === 2
      ? !secondaryFields.some(isFieldMissing)
      : true;

  const updateFieldValue = (field: PersonalizationField, value: string) => {
    setPersonalizationData({ ...personalizationData, [field.fieldKey]: value });
  };

  const renderField = (field: PersonalizationField) => {
    const value = String(personalizationData[field.fieldKey] || field.defaultValue || '');
    const options = field.options || [];

    if (field.type === 'color') {
      return (
        <div className="flex flex-col gap-3">
          <label className="ml-2 text-xs font-bold uppercase tracking-wider text-[#5a4234]">{field.label}{field.required ? ' *' : ''}</label>
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
      return (
        <div className="flex flex-col gap-3">
          <label className="ml-2 text-xs font-bold uppercase tracking-wider text-[#5a4234]">{field.label}{field.required ? ' *' : ''}</label>
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => updateFieldValue(field, option)}
                className={`rounded-2xl border px-5 py-4 text-left transition-all ${value === option ? 'border-[#d4b497] bg-[#f7ede3] text-[#3a251a]' : 'border-[#d4b497]/20 bg-[#fcfaf6] text-[#5a4234] hover:bg-[#f7ede3]/50'}`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
          {field.helpText && <p className="ml-2 text-xs italic text-[#d4b497]">{field.helpText}</p>}
        </div>
      );
    }

    const inputType = field.type === 'date' ? 'date' : 'text';

    return (
      <div className="flex flex-col gap-2">
        <label className="ml-2 text-xs font-bold uppercase tracking-wider text-[#5a4234]">{field.label}{field.required ? ' *' : ''}</label>
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

  return (
    <AnimatePresence>
      {isPersonalizationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-[var(--shadow-modal)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full text-[#5a4234] hover:bg-[#f7ede3] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side - Soft Product Display */}
            <div className="w-full md:w-1/2 bg-[#fcfaf6] relative flex flex-col items-center justify-center p-8 md:p-12 border-r border-[#d4b497]/20 flex-shrink-0">
               {/* Decorative background elements inside modal */}
               <img src="/cloud-watercolor-pink.png" className="absolute top-10 left-10 w-24 opacity-60 mix-blend-multiply" alt=""/>
               <img src="/toy-wooden-star-solid.png" className="absolute bottom-16 right-12 w-12 opacity-50 mix-blend-multiply rotate-12" alt=""/>

               <motion.div 
                 key={selectedProduct.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="relative z-10 w-full flex flex-col items-center mt-8 md:mt-0"
               >
	                 <img src={selectedProduct.imageUrl} className="w-64 h-64 object-contain drop-shadow-xl" alt={selectedProduct.name} />

                 {/* Live Preview Text overlay if name is typed */}
	                 {previewText && (
	                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full mt-4">
		                      <span
		                        className="text-2xl opacity-80"
		                        style={{
	                          color: previewColor || '#3a251a',
	                          fontFamily: personalizationData.fontStyle === 'Classic Script' ? 'cursive' : 'serif'
	                        }}
	                      >
	                        {previewText}
	                      </span>
	                    </div>
	                 )}

                 <div className="text-center mt-8">
                   <h2 className="font-serif text-2xl text-[#3a251a] mb-2">{selectedProduct.name}</h2>
                   <p className="text-[#5a4234] font-medium opacity-80">${selectedProduct.price.toFixed(2)}</p>
                 </div>
               </motion.div>
            </div>

            {/* Right Side - Steps */}
            <div className="w-full md:w-1/2 p-8 md:p-10 flex flex-col h-full overflow-y-auto">
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div 
                      key={s} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-[#d4b497]' : s < step ? 'w-4 bg-[#d4b497]/60' : 'w-4 bg-[#f7ede3]'}`} 
                    />
                  ))}
                </div>
                <div className="text-[#d4b497] flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" /> Step {step} of 3
                </div>
              </div>

              <div className="flex-1">
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
	                        <h3 className="font-serif text-[1.4rem] text-[#3a251a] mb-2">Who is this gift for?</h3>
	                        <p className="text-[#5a4234] text-sm opacity-80">Start with the first detail for this personalized gift.</p>
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
	                        <h3 className="font-serif text-[1.4rem] text-[#3a251a] mb-2">Choose your style</h3>
	                        <p className="text-[#5a4234] text-sm opacity-80">Complete the remaining details for {previewText || 'this gift'}.</p>
	                      </div>

	                      <div className="flex flex-col gap-5">
	                        {secondaryFields.length ? secondaryFields.map((field) => <div key={field.id}>{renderField(field)}</div>) : <p className="rounded-2xl border border-[#d4b497]/20 bg-[#fcfaf6] p-5 text-sm text-[#5a4234]">No extra details are needed for this gift.</p>}
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
                      <div className="flex flex-col items-center justify-center text-center py-6">
                        <div className="w-16 h-16 bg-[#f7ede3] rounded-full flex items-center justify-center mb-6">
                          <Sparkles className="w-8 h-8 text-[#d4b497]" />
                        </div>
                        <h3 className="font-serif text-2xl text-[#3a251a] mb-2">Beautifully crafted!</h3>
                        <p className="text-[#5a4234] text-sm opacity-80 max-w-xs">Your personalized {selectedProduct.name.toLowerCase()} is ready to be made with love.</p>
                      </div>

                      <div className="bg-[#fcfaf6] rounded-2xl p-5 border border-[#d4b497]/20 flex flex-col gap-3">
                        {Object.entries(personalizationData).map(([key, val]) => (
                          <div key={key} className="flex justify-between items-center py-2 border-b border-[#d4b497]/10 last:border-0 last:pb-0">
	                            <span className="text-xs font-bold text-[#5a4234] uppercase tracking-wider capitalize">{fieldByKey.get(key)?.label || key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className="font-serif font-medium text-[#3a251a]">{val as string}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-8 pt-6 border-t border-[#d4b497]/20 flex items-center justify-between">
                {step > 1 ? (
                  <button 
                    onClick={() => setStep(step - 1)}
                    className="text-[#5a4234] font-bold text-sm tracking-wide hover:text-[#3a251a]"
                  >
                    Back
                  </button>
                ) : <div></div>}
                
                <button
                  onClick={() => {
	                    if (!isStepValid) return;
                    if (isLastStep) {
                      handleAddToCart();
                    } else {
                      setStep(step + 1);
                    }
                  }}
	                  disabled={!isStepValid}
                  className="bg-[#3a251a] text-white px-8 py-3.5 rounded-full font-bold tracking-wide flex items-center gap-2 hover:bg-[#4a3328] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isLastStep ? 'Add to Gift Bag' : 'Next Step'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
