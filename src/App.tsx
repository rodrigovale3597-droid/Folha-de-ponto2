/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Settings, X, Download, Sun, Moon, Lock, ChevronLeft, Trash2, Upload, Share2
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import { ErrorBoundary } from './components/ErrorBoundary';
import { Button, Card, cn } from './components/UI';
import { Toast } from './components/Toast';
import { Sidebar } from './components/Sidebar';
import { AttendanceModal } from './components/AttendanceModal';
import { Dashboard } from './components/Dashboard';
import { Team } from './components/Team';
import { CalendarView } from './components/CalendarView';
import { ConfirmModal } from './components/ConfirmModal';
import { BottomNav } from './components/BottomNav';
import { Employee, UserConfig, AttendanceRecord } from './types';

function AppContent() {
  // Login removed - Using a fixed ID for the application
  const [user] = useState({ uid: 'public-user', displayName: 'Administrador' });
  const [loading] = useState(false);

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('pontofacil_employees');
    return saved ? JSON.parse(saved) : [];
  });
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('pontofacil_attendance');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoragePermissionOpen, setIsStoragePermissionOpen] = useState(false);
  const [hasStoragePermission, setHasStoragePermission] = useState(() => {
    return localStorage.getItem('pontofacil_storage_permission') === 'true';
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [userConfig, setUserConfig] = useState<UserConfig | null>(() => {
    const saved = localStorage.getItem('pontofacil_config');
    return saved ? JSON.parse(saved) : { ownerId: 'public-user' };
  });
  const [newPin, setNewPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'team' | 'calendar'>('dashboard');
  const [toast, setToast] = useState<{ id: number; message: string; type: 'success' | 'error' } | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      showToast('App instalado com sucesso!');
    }
  };

  useEffect(() => {
    (window as any).openSettings = () => setIsSettingsOpen(true);
  }, []);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const [attendanceModal, setAttendanceModal] = useState<{
    isOpen: boolean;
    date: Date | null;
    employeeId: string | null;
    currentType: 'D' | 'M' | 'F' | null;
    currentLocation?: string;
  }>({ isOpen: false, date: null, employeeId: null, currentType: null, currentLocation: '' });

  // Form states
  const [empForm, setEmpForm] = useState({
    name: '', role: '', dailyRate: '', pix: '', bankName: '', bankAgency: '', bankAccount: '', project: ''
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('pontofacil_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('pontofacil_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    if (userConfig) {
      localStorage.setItem('pontofacil_config', JSON.stringify(userConfig));
    }
  }, [userConfig]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ id: Date.now(), message, type });

  const exportData = async (share = false) => {
    const data = {
      employees,
      attendance,
      exportDate: new Date().toISOString(),
      user: {
        uid: user?.uid,
        displayName: user?.displayName
      }
    };
    const fileName = `PontoFacil_Backup_${format(new Date(), 'yyyy-MM-dd')}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    if (share && navigator.share) {
      try {
        const file = new File([jsonString], fileName, { type: 'application/json' });
        await navigator.share({
          files: [file],
          title: 'Backup Ponto Fácil',
          text: 'Arquivo de backup dos dados do Ponto Fácil'
        });
        showToast('Backup compartilhado!');
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        }
      }
    }

    // Fallback to download
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exportado com sucesso!');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          if (!data.employees || !data.attendance) {
            throw new Error('Formato de arquivo inválido');
          }

          setConfirmModal({
            isOpen: true,
            title: 'RESTAURAR BACKUP',
            message: `Deseja restaurar o backup de ${format(new Date(data.exportDate), 'dd/MM/yyyy HH:mm')}? Isso substituirá todos os dados atuais.`,
            onConfirm: () => {
              setEmployees(data.employees);
              setAttendance(data.attendance);
              showToast('Dados restaurados com sucesso!');
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
              setIsSettingsOpen(false);
            }
          });
        } catch (err) {
          showToast('Erro ao importar arquivo', 'error');
          console.error(err);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const clearAllData = async () => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: 'LIMPAR TODOS OS DADOS',
      message: 'ATENÇÃO: Isso apagará permanentEMENTE todos os funcionários e registros de ponto. Esta ação não pode ser desfeita. Deseja continuar?',
      onConfirm: async () => {
        try {
          setEmployees([]);
          setAttendance([]);
          localStorage.removeItem('pontofacil_employees');
          localStorage.removeItem('pontofacil_attendance');
          showToast('Todos os dados foram apagados.');
          setSelectedEmployeeId(null);
        } catch (err) {
          console.error(err);
          showToast('Erro ao limpar dados', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !empForm.name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const rate = parseFloat(empForm.dailyRate.replace(',', '.'));
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: empForm.name.trim(),
        role: empForm.role.trim(),
        dailyRate: isNaN(rate) ? 0 : rate,
        pixKey: empForm.pix.trim(),
        bankName: empForm.bankName.trim(),
        bankAgency: empForm.bankAgency.trim(),
        bankAccount: empForm.bankAccount.trim(),
        project: empForm.project.trim(),
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      };
      setEmployees(prev => [...prev, newEmployee]);
      showToast('Funcionário cadastrado!');
      setEmpForm({ name: '', role: '', dailyRate: '', pix: '', bankName: '', bankAgency: '', bankAccount: '', project: '' });
      setIsAddEmployeeOpen(false);
    } catch (err) { 
      showToast('Erro ao cadastrar', 'error'); 
      console.error(err);
    }
    finally { setIsSubmitting(false); }
  };

  const openEditModal = () => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;
    setEmpForm({
      name: emp.name, role: emp.role || '', dailyRate: emp.dailyRate?.toString() || '',
      pix: emp.pixKey || '', bankName: emp.bankName || '', bankAgency: emp.bankAgency || '', bankAccount: emp.bankAccount || '',
      project: emp.project || ''
    });
    setIsEditEmployeeOpen(true);
  };

  const updateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEmployeeId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const rate = parseFloat(empForm.dailyRate.replace(',', '.'));
      setEmployees(prev => prev.map(emp => {
        if (emp.id === selectedEmployeeId) {
          return {
            ...emp,
            name: empForm.name.trim(),
            role: empForm.role.trim(),
            dailyRate: isNaN(rate) ? 0 : rate,
            pixKey: empForm.pix.trim(),
            bankName: empForm.bankName.trim(),
            bankAgency: empForm.bankAgency.trim(),
            bankAccount: empForm.bankAccount.trim(),
            project: empForm.project.trim(),
          };
        }
        return emp;
      }));
      showToast('Dados atualizados!');
      setIsEditEmployeeOpen(false);
    } catch (err) { 
      showToast('Erro ao atualizar', 'error'); 
      console.error(err);
    }
    finally { setIsSubmitting(false); }
  };

  const deleteEmployee = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Excluir Funcionário',
      message: 'Tem certeza que deseja excluir este funcionário? Todos os registros de ponto associados serão perdidos.',
      onConfirm: async () => {
        try { 
          setEmployees(prev => prev.filter(emp => emp.id !== id));
          setAttendance(prev => prev.filter(att => att.employeeId !== id));
          if (selectedEmployeeId === id) setSelectedEmployeeId(null); 
          showToast('Funcionário excluído com sucesso', 'success');
        } catch (err) { 
          console.error(err);
          showToast('Erro ao excluir funcionário', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const savePin = async () => {
    if (!user) return;
    if (!newPin.match(/^\d{4,6}$/)) {
      showToast('PIN deve ter entre 4 e 6 dígitos', 'error');
      return;
    }
    try { 
      setUserConfig(prev => ({ ...prev!, pin: newPin }));
      setIsSettingPin(false); 
      setNewPin(''); 
      showToast('PIN configurado com sucesso!');
    } catch (err) { 
      console.error(err);
      showToast('Erro ao salvar PIN', 'error');
    }
  };

  const removePin = async () => {
    if (!user) return;
    setConfirmModal({
      isOpen: true,
      title: 'Remover PIN',
      message: 'Tem certeza que deseja remover o PIN de segurança? Seu dashboard ficará acessível imediatamente após o login.',
      onConfirm: async () => {
        try { 
          setUserConfig(prev => ({ ...prev!, pin: undefined }));
          showToast('PIN removido com sucesso', 'success');
        } catch (err) { 
          console.error(err); 
          showToast('Erro ao remover PIN', 'error');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const getSummary = (employeeId: string, monthYear?: string) => {
    const records = attendance.filter(a => 
      a.employeeId === employeeId && (!monthYear || a.monthYear === monthYear)
    );
    return {
      diarias: records.filter(r => r.type === 'D').length,
      meias: records.filter(r => r.type === 'M').length,
      faltas: records.filter(r => r.type === 'F').length,
      total: records.filter(r => r.type === 'D').length + (records.filter(r => r.type === 'M').length * 0.5)
    };
  };

  const daysInMonth = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }), [currentMonth]);

  const generatePDF = async () => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    if (!hasStoragePermission) {
      setIsStoragePermissionOpen(true);
      return;
    }

    const monthStr = format(currentMonth, 'yyyy-MM');
    const summary = getSummary(emp.id, monthStr);
    const rate = emp.dailyRate || 0;
    const total = (summary.diarias * rate) + (summary.meias * (rate / 2));
    
    const docPdf = new jsPDF();
    
    // PDF Metadata
    docPdf.setProperties({
      title: `Relatório de Ponto - ${emp.name}`,
      subject: 'Relatório Mensal de Frequência',
      author: 'Ponto Fácil',
      keywords: 'ponto, frequência, relatório',
      creator: 'Ponto Fácil App'
    });

    // Header Design
    docPdf.setFillColor(15, 23, 42); // Slate-900
    docPdf.rect(0, 0, 210, 40, 'F');
    
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(24);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('PONTO FÁCIL', 105, 20, { align: 'center' });
    
    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('RELATÓRIO MENSAL DE FREQUÊNCIA E PAGAMENTO', 105, 30, { align: 'center' });

    // Employee Info Box
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(12);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('DADOS DO COLABORADOR', 20, 55);
    
    docPdf.setDrawColor(226, 232, 240); // Slate-200
    docPdf.line(20, 57, 190, 57);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.text(`Nome: ${emp.name}`, 20, 65);
    docPdf.text(`Cargo: ${emp.role || 'Não informado'}`, 20, 72);
    docPdf.text(`Obra/Projeto: ${emp.project || 'Não informado'}`, 20, 79);
    
    docPdf.text(`Mês de Referência: ${format(currentMonth, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}`, 120, 65);
    docPdf.text(`Valor da Diária: R$ ${rate.toFixed(2)}`, 120, 72);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`TOTAL A PAGAR: R$ ${total.toFixed(2)}`, 120, 79);

    // Summary Table
    autoTable(docPdf, {
      startY: 90,
      head: [['Data', 'Dia', 'Tipo de Registro', 'Localização', 'Valor']],
      body: daysInMonth.map(d => {
        const record = attendance.find(a => a.employeeId === emp.id && a.date === format(d, 'yyyy-MM-dd'));
        if (!record) return null;
        
        let val = 0;
        let typeLabel = '';
        if (record.type === 'D') {
          val = rate;
          typeLabel = 'DIÁRIA INTEIRA';
        } else if (record.type === 'M') {
          val = rate / 2;
          typeLabel = 'MEIA DIÁRIA';
        } else {
          typeLabel = 'FALTA';
        }

        return [
          format(d, 'dd/MM/yyyy'),
          format(d, 'EEE', { locale: ptBR }).toUpperCase(),
          typeLabel,
          record.location || '-',
          `R$ ${val.toFixed(2)}`
        ];
      }).filter(r => r !== null) as any[][],
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 90 }
    });

    // Signature Area
    const finalY = (docPdf as any).lastAutoTable.finalY + 30;
    if (finalY < 250) {
      docPdf.line(20, finalY, 90, finalY);
      docPdf.text('Assinatura do Colaborador', 55, finalY + 5, { align: 'center' });
      
      docPdf.line(120, finalY, 190, finalY);
      docPdf.text('Assinatura do Responsável', 155, finalY + 5, { align: 'center' });
    }

    const fileName = `PontoFacil_${emp.name.replace(/\s+/g, '_')}_${monthStr}.pdf`;

    // Mobile-first approach: Try Web Share API
    if (navigator.share && navigator.canShare) {
      const pdfBlob = docPdf.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Relatório de Ponto',
            text: `Relatório de Ponto - ${emp.name} - ${monthStr}`,
          });
          showToast('Relatório compartilhado!');
          return;
        } catch (error) {
          if ((error as any).name !== 'AbortError') {
            console.error('Erro ao compartilhar:', error);
          } else {
            return;
          }
        }
      }
    }

    docPdf.save(fileName);
    showToast('Relatório salvo em Downloads');
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-100"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
      <AnimatePresence mode="wait">
        {toast && (
          <Toast 
            key={toast.id}
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
      <AttendanceModal 
        isOpen={attendanceModal.isOpen} 
        onClose={() => setAttendanceModal(p => ({ ...p, isOpen: false }))} 
        onSelect={async (type, location) => {
          if (!user || !attendanceModal.employeeId || !attendanceModal.date) return;
          const dateStr = format(attendanceModal.date, 'yyyy-MM-dd');
          const recordId = `${attendanceModal.employeeId}_${dateStr}`;
          try {
            if (type === null) {
              setAttendance(prev => prev.filter(att => att.id !== recordId));
              showToast('Registro removido');
            } else {
              const newRecord: AttendanceRecord = { 
                id: recordId,
                employeeId: attendanceModal.employeeId, 
                date: dateStr, 
                type, 
                location: location?.trim() || undefined,
                monthYear: format(attendanceModal.date, 'yyyy-MM'), 
                ownerId: user.uid 
              };
              setAttendance(prev => {
                const filtered = prev.filter(att => att.id !== recordId);
                return [...filtered, newRecord];
              });
              showToast('Ponto registrado!');
            }
          } catch (err) {
            showToast('Erro ao salvar registro', 'error');
            console.error(err);
          }
          setAttendanceModal(p => ({ ...p, isOpen: false }));
        }} 
        date={attendanceModal.date || new Date()} 
        currentType={attendanceModal.currentType}
        currentLocation={attendanceModal.currentLocation}
      />

      <div className="hidden lg:block">
        <Sidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          onOpenSettings={() => setIsSettingsOpen(true)} 
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden pb-16 lg:pb-0">
        <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0 z-30">
          <div className="flex items-center gap-3">
            {activeView !== 'dashboard' && (
              <button 
                onClick={() => setActiveView('dashboard')} 
                className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h2 className="text-xl font-black tracking-tighter italic">
              {activeView === 'dashboard' ? 'PontoFácil' : 
               activeView === 'team' ? 'Equipe' : 'Calendário'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <Settings size={22} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeView === 'dashboard' && (
              <Dashboard 
                employees={employees} 
                attendance={attendance} 
                currentMonth={currentMonth} 
                setCurrentMonth={setCurrentMonth} 
                getSummary={getSummary} 
                setActiveView={setActiveView} 
                onInstallPWA={installPWA}
                isInstallable={!!deferredPrompt}
              />
            )}
            {activeView === 'team' && <Team employees={employees} setIsAddEmployeeOpen={setIsAddEmployeeOpen} setSelectedEmployeeId={setSelectedEmployeeId} openEditModal={openEditModal} deleteEmployee={deleteEmployee} setActiveView={setActiveView} />}
            {activeView === 'calendar' && (
              <CalendarView 
                employees={employees} 
                selectedEmployeeId={selectedEmployeeId} 
                setSelectedEmployeeId={setSelectedEmployeeId} 
                currentMonth={currentMonth} 
                setCurrentMonth={setCurrentMonth} 
                daysInMonth={daysInMonth} 
                getAttendanceForDay={(id, d) => {
                  const record = attendance.find(a => a.employeeId === id && a.date === format(d, 'yyyy-MM-dd'));
                  return { type: record?.type, location: record?.location };
                }} 
                toggleAttendance={(id, d, t) => {
                  const record = attendance.find(a => a.employeeId === id && a.date === format(d, 'yyyy-MM-dd'));
                  setAttendanceModal({ 
                    isOpen: true, 
                    date: d, 
                    employeeId: id, 
                    currentType: t,
                    currentLocation: record?.location
                  });
                }} 
                generatePDF={generatePDF} 
              />
            )}
          </div>
        </main>
      </div>

      <BottomNav 
        activeView={activeView} 
        setActiveView={setActiveView} 
        onOpenAddEmployee={() => setIsAddEmployeeOpen(true)} 
      />

      {isStoragePermissionOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <Card className="w-full max-w-sm p-8 rounded-[2.5rem] border-none shadow-2xl bg-white dark:bg-slate-900 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
              <Download size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black tracking-tight italic text-slate-900 dark:text-white">Permissão de Acesso</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Para salvar o relatório no seu celular, o app precisa de permissão para baixar arquivos. 
                O arquivo será salvo na sua pasta de <span className="font-bold text-indigo-600 dark:text-indigo-400">Downloads</span> com o nome <span className="font-bold">Ponto Fácil</span>.
              </p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button 
                onClick={() => {
                  setHasStoragePermission(true);
                  localStorage.setItem('pontofacil_storage_permission', 'true');
                  setIsStoragePermissionOpen(false);
                  generatePDF();
                }}
                className="h-14 rounded-2xl font-black italic text-lg shadow-lg shadow-indigo-500/20"
              >
                Permitir e Baixar
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsStoragePermissionOpen(false)}
                className="h-12 rounded-2xl font-bold text-slate-400"
              >
                Agora não
              </Button>
            </div>
          </Card>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-0 overflow-hidden rounded-3xl border-none">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic">Perfil</h3>
                <Button variant="ghost" onClick={() => setIsSettingsOpen(false)} className="rounded-full w-10 h-10 p-0"><X size={20} /></Button>
              </div>
              
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-950 flex items-center justify-center border-4 border-white dark:border-slate-950 overflow-hidden">
                    <div className="text-3xl font-black italic text-slate-900 dark:text-slate-100">A</div>
                  </div>
                </div>
                <div className="text-center">
                  <h4 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">Administrador</h4>
                  <p className="text-xs text-slate-500 font-medium">Acesso Direto Habilitado</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      {darkMode ? <Moon size={16} className="text-indigo-500" /> : <Sun size={16} className="text-amber-500" />}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Modo Escuro</span>
                  </div>
                  <button 
                    onClick={() => setDarkMode(!darkMode)} 
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors", 
                      darkMode ? "bg-indigo-600" : "bg-slate-300"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform", 
                      darkMode ? "translate-x-6" : "translate-x-1"
                    )} />
                  </button>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <Lock size={16} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Segurança PIN</span>
                  </div>
                  
                  {userConfig?.pin ? (
                    <Button variant="ghost" onClick={removePin} className="w-full h-11 rounded-xl text-rose-600 font-bold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100">
                      Desativar PIN
                    </Button>
                  ) : (
                    isSettingPin ? (
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          value={newPin} 
                          onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                          className="pro-input text-center h-11 bg-white dark:bg-slate-800 border-none rounded-xl font-black tracking-[0.5em]" 
                          maxLength={4} 
                          placeholder="0000"
                        />
                        <Button onClick={savePin} className="h-11 px-6 rounded-xl">Salvar</Button>
                      </div>
                    ) : (
                      <Button variant="secondary" onClick={() => setIsSettingPin(true)} className="w-full h-11 rounded-xl font-bold">
                        Configurar PIN
                      </Button>
                    )
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <Download size={16} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Backup de Dados</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => exportData(false)} className="h-11 rounded-xl font-bold gap-2">
                      <Download size={16} />
                      Baixar
                    </Button>
                    <Button variant="secondary" onClick={() => exportData(true)} className="h-11 rounded-xl font-bold gap-2">
                      <Share2 size={16} />
                      Enviar
                    </Button>
                  </div>
                  
                  <Button variant="ghost" onClick={importData} className="w-full h-11 rounded-xl font-bold gap-2 bg-white dark:bg-slate-800 shadow-sm">
                    <Upload size={16} />
                    Restaurar Backup
                  </Button>
                  
                  <p className="text-[10px] text-slate-400 text-center">Exporte seus dados para segurança ou restaure de um arquivo anterior.</p>
                </div>

                <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <Trash2 size={16} className="text-rose-600" />
                    </div>
                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Zona de Perigo</span>
                  </div>
                  <Button variant="ghost" onClick={clearAllData} className="w-full h-11 rounded-xl font-bold text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/30">
                    Limpar Todos os Dados
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {(isAddEmployeeOpen || isEditEmployeeOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-md p-0 my-auto overflow-hidden rounded-3xl border-none shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-6 shrink-0">
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic">
                  {isAddEmployeeOpen ? 'Novo Colaborador' : 'Editar Perfil'}
                </h3>
                <Button variant="ghost" onClick={() => { setIsAddEmployeeOpen(false); setIsEditEmployeeOpen(false); }} className="rounded-full w-10 h-10 p-0">
                  <X size={20} />
                </Button>
              </div>
              
              <form onSubmit={isAddEmployeeOpen ? addEmployee : updateEmployee} className="space-y-4 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Informações Básicas</label>
                  <input type="text" value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Nome Completo" required />
                  <input type="text" value={empForm.project} onChange={e => setEmpForm({...empForm, project: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Nome da Obra" />
                  <input type="text" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Cargo / Função" />
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                    <input type="number" step="0.01" value={empForm.dailyRate} onChange={e => setEmpForm({...empForm, dailyRate: e.target.value})} className="pro-input h-12 pl-10 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Valor da Diária" />
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Dados Bancários / PIX</label>
                  <input type="text" value={empForm.pix} onChange={e => setEmpForm({...empForm, pix: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Chave PIX" />
                  <input type="text" value={empForm.bankName} onChange={e => setEmpForm({...empForm, bankName: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Nome do Banco" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={empForm.bankAgency} onChange={e => setEmpForm({...empForm, bankAgency: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Agência" />
                    <input type="text" value={empForm.bankAccount} onChange={e => setEmpForm({...empForm, bankAccount: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold" placeholder="Conta" />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 sticky bottom-0 bg-white dark:bg-slate-950">
                  <Button type="submit" className="flex-1 h-12 rounded-xl font-black italic tracking-tight text-lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Processando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function App() { return <ErrorBoundary><AppContent /></ErrorBoundary>; }
