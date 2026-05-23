import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ChevronRight, Check } from 'lucide-react';
import { useStore } from '../store/useStore';

export const PersonalizationModal = () => {
  const { isPersonalizationModalOpen, selectedProduct, closePersonalizationModal, addToCart } = useStore();
  
  const [step, setStep] = useState(1);
  const [personalizationData, setPersonalizationData] = useState<Record<string, any>>({});
  
  // Dummy fields for demonstration based on product types
  const getFieldsForProduct = () => {
    return [
      { key: 'babyName', label: 'Baby\'s Name', type: 'text', placeholder: 'e.g. Liam' },
      { key: 'threadColor', label: 'Thread Color', type: 'color', options: ['#D4AF37', '#FFC0CB', '#ADD8E6', '#F5F5DC', '#98FF98'] },
      { key: 'fontStyle', label: 'Font Style', type: 'select', options: ['Classic Script', 'Modern Serif', 'Soft Rounded'] }
    ];
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
  const isLastStep = step === 3;

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
                 {personalizationData.babyName && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full mt-4">
                      <span 
                        className="text-2xl opacity-80"
                        style={{ 
                          color: personalizationData.threadColor || '#3a251a',
                          fontFamily: personalizationData.fontStyle === 'Classic Script' ? 'cursive' : 'serif'
                        }}
                      >
                        {personalizationData.babyName}
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
                        <p className="text-[#5a4234] text-sm opacity-80">Let's start by adding their beautiful name to make it truly theirs.</p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#5a4234] uppercase tracking-wider ml-2">Baby's Name</label>
                        <input 
                          type="text" 
                          value={personalizationData.babyName || ''}
                          onChange={(e) => setPersonalizationData({...personalizationData, babyName: e.target.value})}
                          className="w-full bg-[#fcfaf6] border border-[#d4b497]/30 rounded-2xl px-5 py-4 text-[#3a251a] placeholder:text-[#d4b497] focus:outline-none focus:ring-2 focus:ring-[#d4b497]/50 focus:border-transparent transition-all font-medium text-lg"
                          placeholder="e.g. Noah or Emma"
                        />
                        {!personalizationData.babyName && (
                          <p className="text-xs text-[#d4b497] ml-2 mt-1 italic">Please add the baby's name so we can personalize this piece.</p>
                        )}
                      </div>
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
                        <p className="text-[#5a4234] text-sm opacity-80">Select the perfect colors and fonts for {personalizationData.babyName || 'them'}.</p>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3">
                          <label className="text-xs font-bold text-[#5a4234] uppercase tracking-wider ml-2">Thread Color</label>
                          <div className="flex gap-3 px-2">
                            {fields.find(f => f.key === 'threadColor')?.options?.map(color => (
                              <button
                                key={color}
                                onClick={() => setPersonalizationData({...personalizationData, threadColor: color})}
                                className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center ${personalizationData.threadColor === color ? 'border-[#3a251a] scale-110' : 'border-transparent hover:scale-105 shadow-sm'}`}
                                style={{ backgroundColor: color }}
                              >
                                {personalizationData.threadColor === color && <Check className="w-4 h-4 text-[#3a251a] mix-blend-difference" />}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-col gap-3 mt-4">
                          <label className="text-xs font-bold text-[#5a4234] uppercase tracking-wider ml-2">Font Style</label>
                          <div className="flex flex-col gap-2">
                            {fields.find(f => f.key === 'fontStyle')?.options?.map(font => (
                              <button
                                key={font}
                                onClick={() => setPersonalizationData({...personalizationData, fontStyle: font})}
                                className={`px-5 py-4 rounded-2xl border text-left transition-all ${personalizationData.fontStyle === font ? 'bg-[#f7ede3] border-[#d4b497] text-[#3a251a]' : 'bg-[#fcfaf6] border-[#d4b497]/20 text-[#5a4234] hover:bg-[#f7ede3]/50'}`}
                              >
                                <span className="font-medium">{font}</span>
                              </button>
                            ))}
                          </div>
                        </div>
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
                            <span className="text-xs font-bold text-[#5a4234] uppercase tracking-wider capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
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
                    if (step === 1 && !personalizationData.babyName) return; // simple validation
                    if (isLastStep) {
                      handleAddToCart();
                    } else {
                      setStep(step + 1);
                    }
                  }}
                  disabled={step === 1 && !personalizationData.babyName}
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
