import React, { useState } from 'react';
import { format, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button } from './UI';

interface MonthYearPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onChange: (date: Date) => void;
}

export const MonthYearPicker = ({ isOpen, onClose, currentDate, onChange }: MonthYearPickerProps) => {
  const [viewYear, setViewYear] = useState(getYear(currentDate));
  
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = setYear(setMonth(currentDate, monthIndex), viewYear);
    onChange(newDate);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm"
        >
          <Card className="p-6 shadow-2xl border-none overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black tracking-tighter italic">Escolher Período</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl">
              <button 
                onClick={() => setViewYear(prev => prev - 1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-lg font-black italic tracking-tighter">{viewYear}</span>
              <button 
                onClick={() => setViewYear(prev => prev + 1)}
                className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => {
                const isSelected = getMonth(currentDate) === index && getYear(currentDate) === viewYear;
                return (
                  <button
                    key={month}
                    onClick={() => handleMonthSelect(index)}
                    className={`
                      py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                      ${isSelected 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                        : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }
                    `}
                  >
                    {month.substring(0, 3)}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button 
                variant="ghost" 
                onClick={() => {
                  onChange(new Date());
                  onClose();
                }}
                className="w-full rounded-xl font-black uppercase tracking-widest text-[10px]"
              >
                Ir para o mês atual
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
