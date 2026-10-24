import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

type SelectOption = {
  value: string;
  label: string;
  disabled: boolean;
  groupLabel?: string;
};

type ActiveControl =
  | {
      kind: 'select';
      element: HTMLSelectElement;
      options: SelectOption[];
      value: string;
    }
  | {
      kind: 'date';
      element: HTMLInputElement;
      value: string;
      min: string;
      max: string;
    };

type FloatingPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  openUp: boolean;
};

const CONTROL_SELECTOR = "select:not([multiple]):not([data-native-control='true']), input[type='date']:not([data-native-control='true'])";
const VIEWPORT_PADDING = 12;
const PANEL_GAP = 8;

const parseIsoDate = (value?: string | null) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
};

const toIsoDate = (date: Date) => (
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
);

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const getControlFromTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return null;
  const control = target.closest(CONTROL_SELECTOR);

  if (control instanceof HTMLSelectElement) {
    if (control.disabled || control.multiple || control.size > 1) return null;
    return control;
  }

  if (control instanceof HTMLInputElement) {
    if (control.disabled) return null;
    return control;
  }

  return null;
};

const setNativeControlValue = (element: HTMLSelectElement | HTMLInputElement, value: string) => {
  const prototype = element instanceof HTMLSelectElement
    ? window.HTMLSelectElement.prototype
    : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

  if (setter) setter.call(element, value);
  else element.value = value;

  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
};

const buildSelectControl = (element: HTMLSelectElement): ActiveControl => ({
  kind: 'select',
  element,
  value: element.value,
  options: Array.from(element.options).map((option) => ({
    value: option.value,
    label: option.label || option.textContent || option.value,
    disabled: option.disabled || Boolean(option.parentElement instanceof HTMLOptGroupElement && option.parentElement.disabled),
    groupLabel: option.parentElement instanceof HTMLOptGroupElement ? option.parentElement.label : undefined,
  })),
});

const buildDateControl = (element: HTMLInputElement): ActiveControl => ({
  kind: 'date',
  element,
  value: element.value,
  min: element.min,
  max: element.max,
});

export function GlobalCustomFormControls() {
  const [activeControl, setActiveControl] = useState<ActiveControl | null>(null);
  const [position, setPosition] = useState<FloatingPosition | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());
  const panelRef = useRef<HTMLDivElement>(null);
  const activeControlRef = useRef<ActiveControl | null>(null);

  useEffect(() => {
    activeControlRef.current = activeControl;
  }, [activeControl]);

  const closePanel = useCallback(() => {
    setActiveControl(null);
    setPosition(null);
  }, []);

  const openControl = useCallback((element: HTMLSelectElement | HTMLInputElement) => {
    if (element instanceof HTMLSelectElement) {
      setActiveControl(buildSelectControl(element));
      return;
    }

    const selectedDate = parseIsoDate(element.value) || new Date();
    setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
    setActiveControl(buildDateControl(element));
  }, []);

  const updatePosition = useCallback(() => {
    const control = activeControlRef.current;
    if (!control || !document.body.contains(control.element)) {
      closePanel();
      return;
    }

    const rect = control.element.getBoundingClientRect();
    const desiredHeight = control.kind === 'date'
      ? 372
      : Math.min(360, Math.max(112, control.options.length * 46 + 12));
    const spaceBelow = window.innerHeight - rect.bottom - PANEL_GAP - VIEWPORT_PADDING;
    const spaceAbove = rect.top - PANEL_GAP - VIEWPORT_PADDING;
    const openUp = spaceBelow < Math.min(desiredHeight, 220) && spaceAbove > spaceBelow;
    const availableHeight = openUp ? spaceAbove : spaceBelow;
    const width = Math.min(rect.width, window.innerWidth - VIEWPORT_PADDING * 2);
    const left = Math.min(
      Math.max(VIEWPORT_PADDING, rect.left),
      Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING),
    );

    setPosition({
      top: openUp ? rect.top - PANEL_GAP : rect.bottom + PANEL_GAP,
      left,
      width,
      maxHeight: Math.max(120, availableHeight),
      openUp,
    });
  }, [closePanel]);

  useEffect(() => {
    if (!activeControl) return;

    activeControl.element.setAttribute('aria-expanded', 'true');
    updatePosition();

    const handleViewportChange = () => updatePosition();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);

    return () => {
      activeControl.element.removeAttribute('aria-expanded');
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [activeControl, updatePosition]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const targetNode = event.target as Node | null;
      if (targetNode && panelRef.current?.contains(targetNode)) return;

      const control = getControlFromTarget(event.target);
      if (!control) {
        if (activeControlRef.current) closePanel();
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      control.focus({ preventScroll: true });

      if (activeControlRef.current?.element === control) closePanel();
      else openControl(control);
    };

    const handleClick = (event: MouseEvent) => {
      const control = getControlFromTarget(event.target);
      if (!control) return;

      event.preventDefault();
      event.stopPropagation();

      if (activeControlRef.current?.element !== control) openControl(control);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeControlRef.current) {
        event.preventDefault();
        activeControlRef.current.element.focus({ preventScroll: true });
        closePanel();
        return;
      }

      if (event.key === 'Tab' && activeControlRef.current) {
        closePanel();
        return;
      }

      const control = getControlFromTarget(event.target);
      if (!control || !['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;

      event.preventDefault();
      event.stopPropagation();
      if (activeControlRef.current?.element !== control) openControl(control);
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [closePanel, openControl]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
    const days: Array<Date | null> = Array.from({ length: firstDay.getDay() }, () => null);

    for (let day = 1; day <= daysInMonth; day += 1) {
      days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    }

    return days;
  }, [viewDate]);

  const selectValue = activeControl?.kind === 'select' ? activeControl.value : '';
  const selectedDate = activeControl?.kind === 'date' ? parseIsoDate(activeControl.value) : null;
  const minDate = activeControl?.kind === 'date' ? parseIsoDate(activeControl.min) : null;
  const maxDate = activeControl?.kind === 'date' ? parseIsoDate(activeControl.max) : null;
  const today = startOfDay(new Date());
  const todayIsDisabled = Boolean(
    (minDate && today < startOfDay(minDate)) ||
    (maxDate && today > startOfDay(maxDate)),
  );

  const chooseValue = (value: string) => {
    const control = activeControlRef.current;
    if (!control) return;
    setNativeControlValue(control.element, value);
    closePanel();
  };

  const panel = activeControl && position ? (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        width: position.width,
        maxHeight: position.maxHeight,
        transform: position.openUp ? 'translateY(-100%)' : undefined,
        zIndex: 10000,
      }}
      className="overflow-y-auto overscroll-contain rounded-[1.35rem] border border-[#e3e3e3] bg-white p-1.5 font-sans shadow-[0_22px_55px_rgba(0,0,0,0.15)]"
    >
      {activeControl.kind === 'select' ? (
        <div role="listbox" aria-label={activeControl.element.getAttribute('aria-label') || 'Choose an option'}>
          {activeControl.options.map((option, index) => {
            const isSelected = option.value === selectValue;
            const previousGroup = index > 0 ? activeControl.options[index - 1].groupLabel : undefined;
            const showGroup = option.groupLabel && option.groupLabel !== previousGroup;

            return (
              <React.Fragment key={`${option.value}-${index}`}>
                {showGroup && (
                  <div className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[#888] first:pt-1">
                    {option.groupLabel}
                  </div>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => chooseValue(option.value)}
                  className={`flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isSelected
                      ? 'bg-[#202020] font-bold text-white'
                      : 'font-medium text-[#666] hover:bg-[#f4f4f4] hover:text-[#202020]'
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected && <Check className="h-4 w-4 flex-shrink-0 text-[#202020]" strokeWidth={2.4} />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div role="dialog" aria-label="Choose a date" className="p-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[#666] transition-colors hover:bg-[#f4f4f4] hover:text-[#202020]"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="min-w-0 truncate text-center text-sm font-bold text-[#202020]">
              {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <button
              type="button"
              onClick={() => setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[#666] transition-colors hover:bg-[#f4f4f4] hover:text-[#202020]"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-[#888]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <span key={`${day}-${index}`} className="py-1">{day}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (!day) return <span key={`empty-${index}`} className="aspect-square" />;

              const normalizedDay = startOfDay(day);
              const isDisabled = Boolean(
                (minDate && normalizedDay < startOfDay(minDate)) ||
                (maxDate && normalizedDay > startOfDay(maxDate)),
              );
              const isSelected = Boolean(selectedDate && toIsoDate(day) === toIsoDate(selectedDate));
              const isToday = toIsoDate(day) === toIsoDate(today);

              return (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => chooseValue(toIsoDate(day))}
                  className={`aspect-square min-w-0 rounded-xl text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-25 ${
                    isSelected
                      ? 'bg-[#202020] text-white shadow-sm'
                      : isToday
                        ? 'bg-[#202020] text-white'
                        : 'text-[#666] hover:bg-[#f4f4f4] hover:text-[#202020]'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[#e3e3e3] px-1 pt-3">
            <button
              type="button"
              onClick={() => chooseValue('')}
              className="rounded-full px-3 py-2 text-xs font-bold text-[#666] hover:bg-[#f4f4f4] hover:text-[#202020]"
            >
              Clear
            </button>
            <button
              type="button"
              disabled={todayIsDisabled}
              onClick={() => chooseValue(toIsoDate(today))}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#202020] px-3 py-2 text-xs font-bold text-white hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CalendarDays className="h-3.5 w-3.5" /> Today
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;

  return (
    <>
      <style>{`
        select:not([multiple]):not([data-native-control='true']) {
          -webkit-appearance: none !important;
          appearance: none !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235a4234' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.9rem center !important;
          background-size: 1rem !important;
          padding-right: 2.65rem !important;
          cursor: pointer;
        }

        select:not([multiple]):not([data-native-control='true']):disabled {
          cursor: not-allowed;
        }

        input[type='date']:not([data-native-control='true']) {
          -webkit-appearance: none;
          appearance: none;
          color-scheme: light;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%235a4234' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M8 2v4M16 2v4M3 10h18'/%3E%3Crect width='18' height='18' x='3' y='4' rx='2'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 0.9rem center !important;
          background-size: 1rem !important;
          padding-right: 2.65rem !important;
          cursor: pointer;
        }

        input[type='date']:not([data-native-control='true'])::-webkit-calendar-picker-indicator {
          opacity: 0;
          cursor: pointer;
        }

        input[type='date']:not([data-native-control='true'])::-webkit-inner-spin-button {
          display: none;
        }
      `}</style>
      {typeof document !== 'undefined' && panel ? createPortal(panel, document.body) : null}
    </>
  );
}
