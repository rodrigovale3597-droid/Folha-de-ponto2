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
  Settings, X, Download, Sun, Moon, Lock, ChevronLeft, Trash2, Upload, Share2,
  Bell, BellOff, Clock as ClockIcon, Smartphone
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
  const [lastNotificationDate, setLastNotificationDate] = useState<string | null>(null);
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
  const [isLocked, setIsLocked] = useState(() => {
    const saved = localStorage.getItem('pontofacil_config');
    if (saved) {
      try {
        const config = JSON.parse(saved);
        return !!config.pin;
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [pinInput, setPinInput] = useState('');
  
  // Reset month to current when entering calendar view (PDF functionality)
  useEffect(() => {
    if (activeView === 'calendar') {
      const now = new Date();
      // Only reset if it's not already the current month to avoid unnecessary state updates
      if (format(currentMonth, 'yyyy-MM') !== format(now, 'yyyy-MM')) {
        setCurrentMonth(now);
      }
    }
  }, [activeView]);

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput === userConfig?.pin) {
      setIsLocked(false);
      setPinInput('');
      showToast('Acesso liberado', 'success');
    } else {
      setPinInput('');
      showToast('PIN incorreto', 'error');
    }
  };

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
    currentCustomRate?: number;
  }>({ isOpen: false, date: null, employeeId: null, currentType: null, currentLocation: '', currentCustomRate: undefined });

  // Form states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [empForm, setEmpForm] = useState({
    name: '', role: '', dailyRate: '', pix: '', bankName: '', bankAgency: '', bankAccount: '', project: '', paymentNote: ''
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
      userConfig,
      theme: darkMode ? 'dark' : 'light',
      exportDate: new Date().toISOString(),
      version: '1.2',
      user: {
        uid: user?.uid,
        displayName: user?.displayName
      }
    };
    const fileName = `PontoFacil_Backup_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
    const jsonString = JSON.stringify(data, null, 2);

    // Record backup date
    setUserConfig(prev => ({ ...prev!, lastBackupDate: new Date().toISOString() }));

    if (share && navigator.share) {
      try {
        const file = new File([jsonString], fileName, { type: 'application/json' });
        // Check if sharing files is supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Backup Ponto Fácil',
            text: `Backup realizado em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`
          });
          showToast('Backup compartilhado!');
          return;
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Erro ao compartilhar:', err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Fallback to download or if share failed/not requested
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup with a small delay for mobile browsers
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      showToast('Backup salvo nos Downloads');
    } catch (err) {
      console.error('Erro ao exportar:', err);
      showToast('Erro ao exportar dados', 'error');
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          // Basic validation
          if (!data.employees || !data.attendance) {
            throw new Error('Formato de arquivo inválido: dados essenciais ausentes');
          }

          if (!Array.isArray(data.employees) || !Array.isArray(data.attendance)) {
            throw new Error('Formato de arquivo inválido: estrutura de dados incorreta');
          }

          const dateLabel = data.exportDate ? format(new Date(data.exportDate), 'dd/MM/yyyy HH:mm') : 'data desconhecida';

          setConfirmModal({
            isOpen: true,
            title: 'RESTAURAR BACKUP',
            message: `Deseja restaurar o backup de ${dateLabel}? Isso substituirá todos os dados atuais (colaboradores e registros).`,
            onConfirm: () => {
              try {
                setEmployees(data.employees);
                setAttendance(data.attendance);
                if (data.userConfig) {
                  setUserConfig(data.userConfig);
                }
                if (data.theme) {
                  setDarkMode(data.theme === 'dark');
                }
                showToast('Dados restaurados com sucesso!');
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setIsSettingsOpen(false);
              } catch (err) {
                showToast('Erro ao aplicar backup', 'error');
                console.error(err);
              }
            }
          });
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Erro ao importar arquivo', 'error');
          console.error(err);
        } finally {
          if (document.body.contains(input)) {
            document.body.removeChild(input);
          }
        }
      };

      reader.onerror = () => {
        showToast('Erro ao ler o arquivo', 'error');
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      reader.readAsText(file);
    };

    input.click();
    
    // Cleanup input if user cancels (though onchange won't fire)
    // We remove it in onchange/onerror, but if they just close the picker, it stays in DOM.
    // It's hidden and small, so not a big deal, but let's be clean.
    setTimeout(() => {
      if (document.body.contains(input) && !input.files?.length) {
        // We can't easily know if they cancelled, so we just leave it or remove it after a long timeout
      }
    }, 60000);
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

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Name validation
    if (!empForm.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (empForm.name.trim().length < 3) {
      errors.name = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    // Daily rate validation
    if (!empForm.dailyRate) {
      errors.dailyRate = 'Valor da diária é obrigatório';
    } else {
      const rate = parseFloat(empForm.dailyRate.replace(',', '.'));
      if (isNaN(rate) || rate <= 0) {
        errors.dailyRate = 'Valor da diária deve ser maior que zero';
      }
    }

    // Bank details validation (if one is filled, others are recommended)
    if (empForm.bankName || empForm.bankAgency || empForm.bankAccount) {
      if (!empForm.bankName) errors.bankName = 'Informe o nome do banco';
      if (!empForm.bankAgency) errors.bankAgency = 'Informe a agência';
      if (!empForm.bankAccount) errors.bankAccount = 'Informe a conta';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    
    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

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
        paymentNote: empForm.paymentNote.trim(),
        project: empForm.project.trim(),
        ownerId: user.uid,
        createdAt: new Date().toISOString()
      };
      setEmployees(prev => [...prev, newEmployee]);
      showToast('Funcionário cadastrado!');
      setEmpForm({ name: '', role: '', dailyRate: '', pix: '', bankName: '', bankAgency: '', bankAccount: '', project: '', paymentNote: '' });
      setFormErrors({});
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
    setFormErrors({});
    setEmpForm({
      name: emp.name, role: emp.role || '', dailyRate: emp.dailyRate?.toString() || '',
      pix: emp.pixKey || '', bankName: emp.bankName || '', bankAgency: emp.bankAgency || '', bankAccount: emp.bankAccount || '',
      project: emp.project || '', paymentNote: emp.paymentNote || ''
    });
    setIsEditEmployeeOpen(true);
  };

  const updateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedEmployeeId || isSubmitting) return;

    if (!validateForm()) {
      showToast('Por favor, corrija os erros no formulário', 'error');
      return;
    }

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
            paymentNote: empForm.paymentNote.trim(),
            project: empForm.project.trim(),
          };
        }
        return emp;
      }));
      showToast('Dados atualizados!');
      setFormErrors({});
      setIsEditEmployeeOpen(false);
    } catch (err) { 
      showToast('Erro ao atualizar', 'error'); 
      console.error(err);
    }
    finally { setIsSubmitting(false); }
  };

  useEffect(() => {
    if (!userConfig?.notificationsEnabled) return;

    const checkNotifications = () => {
      const now = new Date();
      const currentTime = format(now, 'HH:mm');
      const today = format(now, 'yyyy-MM-dd');

      if (currentTime === (userConfig.notificationTime || '07:00') && lastNotificationDate !== today) {
        if (Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Ponto Fácil', {
              body: 'Bom dia! Não esqueça de registrar seu ponto hoje.',
              icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
              badge: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
              tag: 'daily-reminder',
              ...({ vibrate: [200, 100, 200] } as any)
            });
          });
          setLastNotificationDate(today);
        }
      }
    };

    const interval = setInterval(checkNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [userConfig?.notificationsEnabled, userConfig?.notificationTime, lastNotificationDate]);

  const requestNotificationPermission = async () => {
    console.log('Solicitando permissão de notificação...');
    if (!('Notification' in window)) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      console.log('Notificações não suportadas. iOS:', isIOS);
      if (isIOS) {
        showToast('No iOS, instale o app na tela de início para usar notificações.', 'error');
      } else {
        showToast('Seu navegador não suporta notificações', 'error');
      }
      return;
    }

    try {
      const permission = await new Promise<NotificationPermission>((resolve) => {
        try {
          const result = Notification.requestPermission(resolve);
          if (result && typeof (result as any).then === 'function') {
            (result as any).then(resolve);
          }
        } catch (e) {
          console.error('Erro ao chamar requestPermission:', e);
          resolve('default');
        }
      });

      console.log('Permissão de notificação:', permission);

      if (permission === 'granted') {
        setUserConfig(prev => ({ 
          ...prev!, 
          notificationsEnabled: true,
          notificationTime: prev?.notificationTime || '07:00'
        }));
        showToast('Notificações ativadas!');
      } else if (permission === 'denied') {
        showToast('Permissão negada. Verifique as configurações do navegador.', 'error');
      } else {
        showToast('Permissão não concedida', 'error');
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      showToast('Erro ao solicitar permissão', 'error');
    }
  };

  const testNotification = () => {
    if (!('serviceWorker' in navigator)) {
      showToast('Seu navegador não suporta notificações em segundo plano', 'error');
      return;
    }

    if (typeof Notification === 'undefined') {
      showToast('Seu dispositivo não suporta notificações', 'error');
      return;
    }

    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification('Ponto Fácil', {
          body: 'Esta é uma notificação de teste!',
          icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
          ...({ vibrate: [200, 100, 200] } as any)
        });
      }).catch(err => {
        console.error('Erro no Service Worker:', err);
        showToast('Erro ao acessar o sistema de notificações', 'error');
      });
    } else {
      showToast('Ative as notificações primeiro', 'error');
    }
  };

  const toggleNotifications = () => {
    if (userConfig?.notificationsEnabled) {
      setUserConfig(prev => ({ ...prev!, notificationsEnabled: false }));
      showToast('Notificações desativadas');
    } else {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        setUserConfig(prev => ({ 
          ...prev!, 
          notificationsEnabled: true,
          notificationTime: prev?.notificationTime || '07:00'
        }));
        showToast('Notificações ativadas!');
      } else {
        requestNotificationPermission();
      }
    }
  };

  // Check for automatic backup
  useEffect(() => {
    if (!userConfig?.backupInterval || userConfig.backupInterval === 'off' || !user) return;

    const lastBackup = userConfig.lastBackupDate ? new Date(userConfig.lastBackupDate) : null;
    const now = new Date();
    
    let isDue = false;
    if (!lastBackup) {
      isDue = true;
    } else {
      const diffMs = now.getTime() - lastBackup.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      if (userConfig.backupInterval === 'daily' && diffDays >= 1) isDue = true;
      if (userConfig.backupInterval === 'weekly' && diffDays >= 7) isDue = true;
    }

    if (isDue) {
      const intervalLabel = userConfig.backupInterval === 'daily' ? 'diário' : 'semanal';
      showToast(`Seu backup ${intervalLabel} está pendente!`, 'success');
      
      // If notifications are enabled, show a system notification
      if (Notification.permission === 'granted') {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('Ponto Fácil: Backup Pendente', {
            body: `Está na hora de fazer o seu backup ${intervalLabel}!`,
            icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
            tag: 'backup-reminder',
            ...({ vibrate: [200, 100, 200] } as any)
          });
        });
      }
    }
  }, [userConfig?.backupInterval, userConfig?.lastBackupDate, user?.uid]);

  const updateNotificationTime = (time: string) => {
    setUserConfig(prev => ({ ...prev!, notificationTime: time }));
    showToast(`Lembrete ajustado para ${time}`);
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
    const emp = employees.find(e => e.id === employeeId);
    const records = attendance.filter(a => 
      a.employeeId === employeeId && (!monthYear || a.monthYear === monthYear)
    );
    const defaultRate = emp?.dailyRate || 0;
    
    let totalValue = 0;
    records.forEach(r => {
      const rate = r.customRate !== undefined ? r.customRate : defaultRate;
      if (r.type === 'D') totalValue += rate;
      if (r.type === 'M') totalValue += (rate / 2);
    });

    return {
      diarias: records.filter(r => r.type === 'D').length,
      meias: records.filter(r => r.type === 'M').length,
      faltas: records.filter(r => r.type === 'F').length,
      total: records.filter(r => r.type === 'D').length + (records.filter(r => r.type === 'M').length * 0.5),
      totalValue
    };
  };

  const daysInMonth = useMemo(() => eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }), [currentMonth]);

  const generateCSV = () => {
    const emp = employees.find(e => e.id === selectedEmployeeId);
    if (!emp) return;

    const monthStr = format(currentMonth, 'yyyy-MM');
    const rate = emp.dailyRate || 0;
    
    // CSV Header
    let csvContent = "Data;Dia;Tipo de Registro;Localizacao;Valor (R$)\n";
    
    // CSV Body
    daysInMonth.forEach(d => {
      const record = attendance.find(a => a.employeeId === emp.id && a.date === format(d, 'yyyy-MM-dd'));
      if (!record) return;
      
      const currentRate = record.customRate !== undefined ? record.customRate : rate;
      let val = 0;
      let typeLabel = '';
      if (record.type === 'D') {
        val = currentRate;
        typeLabel = 'DIARIA INTEIRA';
      } else if (record.type === 'M') {
        val = currentRate / 2;
        typeLabel = 'MEIA DIARIA';
      } else {
        typeLabel = 'FALTA';
      }

      const row = [
        format(d, 'dd/MM/yyyy'),
        format(d, 'EEEE', { locale: ptBR }),
        typeLabel,
        record.location || '-',
        val.toFixed(2).replace('.', ',')
      ];
      
      csvContent += row.join(';') + "\n";
    });

    // Add Summary
    const summary = getSummary(emp.id, monthStr);
    csvContent += "\n";
    csvContent += `RESUMO MENSAL - ${emp.name.toUpperCase()}\n`;
    csvContent += `Mes de Referencia;${format(currentMonth, 'MMMM yyyy', { locale: ptBR }).toUpperCase()}\n`;
    csvContent += `Diarias Inteiras;${summary.diarias}\n`;
    csvContent += `Meias Diarias;${summary.meias}\n`;
    csvContent += `Faltas;${summary.faltas}\n`;
    csvContent += `TOTAL A PAGAR;R$ ${summary.totalValue.toFixed(2).replace('.', ',')}\n`;

    // Download
    try {
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Relatorio_Ponto_${emp.name.replace(/\s+/g, '_')}_${monthStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Relatório CSV baixado!');
    } catch (err) {
      console.error('Erro ao gerar CSV:', err);
      showToast('Erro ao gerar CSV', 'error');
    }
  };

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
    const total = summary.totalValue;
    
    const docPdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });
    
    // Helper to ensure text is handled correctly by jsPDF standard fonts
    // Normalizes text by removing accents which often cause encoding issues in jsPDF default fonts
    const t = (text: string) => {
      if (!text) return '';
      return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };
    
    // PDF Metadata
    docPdf.setProperties({
      title: `Relatorio de Ponto - ${emp.name}`,
      subject: 'Relatorio Mensal de Frequencia',
      author: 'Ponto Facil',
      keywords: 'ponto, frequencia, relatorio',
      creator: 'Ponto Facil App'
    });

    // Header Design
    docPdf.setFillColor(15, 23, 42); // Slate-900
    docPdf.rect(0, 0, 210, 40, 'F');
    
    docPdf.setTextColor(255, 255, 255);
    docPdf.setFontSize(24);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('PONTO FACIL', 105, 20, { align: 'center' });
    
    docPdf.setFontSize(10);
    docPdf.setFont('helvetica', 'normal');
    docPdf.text('RELATORIO MENSAL DE FREQUENCIA E PAGAMENTO', 105, 30, { align: 'center' });

    // Employee Info Box
    docPdf.setTextColor(15, 23, 42);
    docPdf.setFontSize(12);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text('DADOS DO COLABORADOR', 20, 55);
    
    docPdf.setDrawColor(226, 232, 240); // Slate-200
    docPdf.line(20, 57, 190, 57);

    docPdf.setFont('helvetica', 'normal');
    docPdf.setFontSize(10);
    docPdf.text(`Nome: ${t(emp.name)}`, 20, 65);
    docPdf.text(`Cargo: ${t(emp.role) || 'Nao informado'}`, 20, 72);
    docPdf.text(`Obra/Projeto: ${t(emp.project) || 'Nao informado'}`, 20, 79);
    if (emp.paymentNote) {
      docPdf.setFontSize(8);
      docPdf.text(`Obs Pagamento: ${t(emp.paymentNote)}`, 20, 84);
      docPdf.setFontSize(10);
    }
    
    docPdf.text(`Mes de Referencia: ${t(format(currentMonth, 'MMMM yyyy', { locale: ptBR }).toUpperCase())}`, 120, 65);
    docPdf.text(`Valor da Diaria: R$ ${rate.toFixed(2)}`, 120, 72);
    docPdf.setFont('helvetica', 'bold');
    docPdf.text(`TOTAL A PAGAR: R$ ${total.toFixed(2)}`, 120, 79);

    // Summary Table
    autoTable(docPdf, {
      startY: 90,
      head: [['Data', 'Dia', 'Tipo de Registro', 'Localizacao', 'Valor']],
      body: daysInMonth.map(d => {
        const record = attendance.find(a => a.employeeId === emp.id && a.date === format(d, 'yyyy-MM-dd'));
        if (!record) return null;
        
        const currentRate = record.customRate !== undefined ? record.customRate : rate;
        let val = 0;
        let typeLabel = '';
        if (record.type === 'D') {
          val = currentRate;
          typeLabel = 'DIARIA INTEIRA';
        } else if (record.type === 'M') {
          val = currentRate / 2;
          typeLabel = 'MEIA DIARIA';
        } else {
          typeLabel = 'FALTA';
        }

        return [
          format(d, 'dd/MM/yyyy'),
          t(format(d, 'EEE', { locale: ptBR }).toUpperCase()),
          typeLabel,
          t(record.location) || '-',
          `R$ ${val.toFixed(2)}`
        ];
      }).filter(r => r !== null) as any[][],
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: 'bold',
        halign: 'center',
        font: 'helvetica'
      },
      bodyStyles: {
        fontSize: 8,
        halign: 'center',
        font: 'helvetica'
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
      docPdf.text('Assinatura do Responsavel', 155, finalY + 5, { align: 'center' });
    }

    const fileName = `PontoFacil_${emp.name.replace(/\s+/g, '_')}_${monthStr}.pdf`;

    // Mobile-first approach: Try Web Share API
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && navigator.share) {
      showToast('Preparando para compartilhar...');
      try {
        const pdfBlob = docPdf.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        // Check if sharing files is supported
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Relatório de Ponto',
            text: `Relatório de Ponto - ${t(emp.name)} - ${monthStr}`,
          });
          showToast('Relatório compartilhado!');
          return;
        }
      } catch (error) {
        // If user cancelled, don't show error
        if ((error as any).name === 'AbortError') return;
        console.error('Erro ao compartilhar:', error);
      }
    }

    // Fallback for desktop or when share fails
    try {
      // Robust download for mobile: hidden link
      const pdfBlob = docPdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup URL
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
      
      showToast('Relatório salvo em Downloads');
    } catch (error) {
      console.error('Erro ao salvar PDF:', error);
      showToast('Erro ao gerar relatório', 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-100"></div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <AnimatePresence>
        {isLocked && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 overflow-hidden"
          >
            <div className="w-full max-w-sm space-y-8 text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/20">
                  <Lock size={40} className="text-white" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-black tracking-tighter italic">App Bloqueado</h2>
                  <p className="text-slate-500 font-medium">Insira seu PIN para continuar</p>
                </div>
              </div>

              <form onSubmit={handleUnlock} className="space-y-6">
                <div className="flex justify-center gap-3">
                  <input 
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoFocus
                    value={pinInput}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setPinInput(val);
                      // Auto-submit if length matches
                      if (val.length === userConfig?.pin?.length) {
                        // Small delay to let the last digit be processed
                        setTimeout(() => {
                          if (val === userConfig?.pin) {
                            setIsLocked(false);
                            setPinInput('');
                            showToast('Acesso liberado', 'success');
                          } else {
                            setPinInput('');
                            showToast('PIN incorreto', 'error');
                          }
                        }, 100);
                      }
                    }}
                    className="w-full h-16 text-center text-3xl font-black tracking-[1em] bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    maxLength={6}
                    placeholder="••••"
                  />
                </div>
                
                <Button type="submit" className="w-full h-14 rounded-2xl font-black italic text-lg">
                  Desbloquear
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
        onSelect={async (type, location, customRate) => {
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
                customRate,
                monthYear: format(attendanceModal.date, 'yyyy-MM'), 
                ownerId: user.uid,
                timestamp: new Date().toISOString()
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
        currentCustomRate={attendanceModal.currentCustomRate}
        defaultRate={employees.find(e => e.id === attendanceModal.employeeId)?.dailyRate}
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
                className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
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
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600">
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
            {activeView === 'team' && (
              <Team 
                employees={employees} 
                attendance={attendance}
                setIsAddEmployeeOpen={setIsAddEmployeeOpen} 
                setSelectedEmployeeId={setSelectedEmployeeId} 
                openEditModal={openEditModal} 
                deleteEmployee={deleteEmployee} 
                setActiveView={setActiveView} 
              />
            )}
            {activeView === 'calendar' && (
              <CalendarView 
                employees={employees} 
                attendance={attendance}
                selectedEmployeeId={selectedEmployeeId} 
                setSelectedEmployeeId={setSelectedEmployeeId} 
                currentMonth={currentMonth} 
                setCurrentMonth={setCurrentMonth} 
                daysInMonth={daysInMonth} 
                getAttendanceForDay={(id, d) => {
                  const record = attendance.find(a => a.employeeId === id && a.date === format(d, 'yyyy-MM-dd'));
                  return { type: record?.type, location: record?.location, customRate: record?.customRate };
                }} 
                toggleAttendance={(id, d, t) => {
                  const record = attendance.find(a => a.employeeId === id && a.date === format(d, 'yyyy-MM-dd'));
                  setAttendanceModal({ 
                    isOpen: true, 
                    date: d, 
                    employeeId: id, 
                    currentType: t,
                    currentLocation: record?.location,
                    currentCustomRate: record?.customRate
                  });
                }} 
                generatePDF={generatePDF} 
                generateCSV={generateCSV}
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
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSettingsOpen(false)} 
                    className="rounded-full w-10 h-10 p-0 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft size={24} />
                  </Button>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic">Configurações</h3>
                </div>
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
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", 
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
                  <div 
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={toggleNotifications}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                        {userConfig?.notificationsEnabled ? (
                          <Bell size={16} className="text-indigo-500" />
                        ) : (
                          <BellOff size={16} className="text-slate-400" />
                        )}
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Lembrete Diário</span>
                    </div>
                    <button 
                      type="button"
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", 
                        userConfig?.notificationsEnabled ? "bg-indigo-600" : "bg-slate-300"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform", 
                        userConfig?.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <ClockIcon size={14} />
                        Horário do Lembrete
                      </div>
                      <input 
                        type="time" 
                        value={userConfig?.notificationTime || '07:00'} 
                        onChange={e => updateNotificationTime(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-none rounded-lg text-xs font-black p-1 px-2 focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none"
                      />
                    </div>
                    {userConfig?.notificationsEnabled && (
                      <Button variant="ghost" onClick={testNotification} className="w-full h-9 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-slate-800 shadow-sm">
                        Testar Notificação
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <Lock size={16} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Segurança PIN</span>
                  </div>
                  
                  {userConfig?.pin ? (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => {
                          setIsLocked(true);
                          setIsSettingsOpen(false);
                        }} 
                        className="w-full h-11 rounded-xl font-bold gap-2"
                      >
                        <Lock size={16} />
                        Bloquear Agora
                      </Button>
                      <Button variant="ghost" onClick={removePin} className="w-full h-11 rounded-xl text-rose-600 font-bold bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100">
                        Desativar PIN
                      </Button>
                    </div>
                  ) : (
                    isSettingPin ? (
                      <div className="flex gap-2">
                        <input 
                          type="password" 
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newPin} 
                          onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))} 
                          className="pro-input text-center h-11 bg-white dark:bg-slate-800 border-none rounded-xl font-black tracking-[0.5em]" 
                          maxLength={6} 
                          placeholder="••••"
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

                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <ClockIcon size={14} />
                        Backup Automático
                      </div>
                      <select 
                        value={userConfig?.backupInterval || 'off'} 
                        onChange={e => {
                          const val = e.target.value as any;
                          setUserConfig(prev => ({ ...prev!, backupInterval: val }));
                          showToast(`Backup automático: ${val === 'off' ? 'Desativado' : val === 'daily' ? 'Diário' : 'Semanal'}`);
                        }}
                        className="bg-white dark:bg-slate-800 border-none rounded-lg text-xs font-black p-1 px-2 focus:ring-2 focus:ring-indigo-500 focus-visible:outline-none"
                      >
                        <option value="off">Desativado</option>
                        <option value="daily">Diário</option>
                        <option value="weekly">Semanal</option>
                      </select>
                    </div>
                    {userConfig?.lastBackupDate && (
                      <p className="text-[10px] text-slate-400 text-center">
                        Último backup: {format(new Date(userConfig.lastBackupDate), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    )}
                  </div>
                  
                  <Button variant="ghost" onClick={importData} className="w-full h-11 rounded-xl font-bold gap-2 bg-white dark:bg-slate-800 shadow-sm">
                    <Upload size={16} />
                    Restaurar Backup
                  </Button>
                  
                  <p className="text-[10px] text-slate-400 text-center">Exporte seus dados para segurança ou restaure de um arquivo anterior.</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                      <Smartphone size={16} className="text-slate-600 dark:text-slate-400" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Aplicativo Mobile</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                      Este app pode ser instalado no seu celular para funcionar como um aplicativo nativo.
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Android / Chrome</p>
                        <p className="text-[10px] text-slate-500">Clique em "Instalar Agora" no Dashboard ou use o menu do navegador.</p>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">iOS / Safari</p>
                        <p className="text-[10px] text-slate-500">Toque em "Compartilhar" e depois em "Adicionar à Tela de Início".</p>
                      </div>
                    </div>
                  </div>
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
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-widest">Nome Completo</label>
                      <input 
                        type="text" 
                        value={empForm.name} 
                        onChange={e => {
                          setEmpForm({...empForm, name: e.target.value});
                          if (formErrors.name) setFormErrors(prev => ({ ...prev, name: '' }));
                        }} 
                        className={cn(
                          "pro-input h-12 bg-slate-50 dark:bg-slate-900 rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                          formErrors.name ? "border-2 border-rose-500 bg-rose-50/30 dark:bg-rose-500/5" : "border-none"
                        )} 
                        placeholder="Ex: João da Silva" 
                      />
                    {formErrors.name && <p className="text-[10px] font-bold text-rose-500 px-1">{formErrors.name}</p>}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-widest">Obra ou Projeto</label>
                    <input type="text" value={empForm.project} onChange={e => setEmpForm({...empForm, project: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600" placeholder="Ex: Edifício Central" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-widest">Cargo / Função</label>
                    <input type="text" value={empForm.role} onChange={e => setEmpForm({...empForm, role: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600" placeholder="Ex: Pedreiro" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 px-1 uppercase tracking-widest">Valor da Diária</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        value={empForm.dailyRate} 
                        onChange={e => {
                          setEmpForm({...empForm, dailyRate: e.target.value});
                          if (formErrors.dailyRate) setFormErrors(prev => ({ ...prev, dailyRate: '' }));
                        }} 
                        className={cn(
                          "pro-input h-12 pl-10 bg-slate-50 dark:bg-slate-900 rounded-xl font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                          formErrors.dailyRate ? "border-2 border-rose-500 bg-rose-50/30 dark:bg-rose-500/5" : "border-none"
                        )} 
                        placeholder="0,00" 
                      />
                    </div>
                    {formErrors.dailyRate && <p className="text-[10px] font-bold text-rose-500 px-1">{formErrors.dailyRate}</p>}
                  </div>
                </div>

                <div className="pt-2 space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Dados Bancários / PIX</label>
                  <div className="space-y-1">
                    <input type="text" value={empForm.pix} onChange={e => setEmpForm({...empForm, pix: e.target.value})} className="pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600" placeholder="Chave PIX" />
                    <input 
                      type="text" 
                      value={empForm.paymentNote} 
                      onChange={e => setEmpForm({...empForm, paymentNote: e.target.value})} 
                      className="pro-input h-10 bg-slate-100 dark:bg-slate-800/50 border-none rounded-xl font-medium text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600" 
                      placeholder="Observação / Nome do Titular (se for de terceiros)" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <input 
                      type="text" 
                      value={empForm.bankName} 
                      onChange={e => {
                        setEmpForm({...empForm, bankName: e.target.value});
                        if (formErrors.bankName) setFormErrors(prev => ({ ...prev, bankName: '' }));
                      }} 
                      className={cn(
                        "pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                        formErrors.bankName && "ring-2 ring-rose-500"
                      )} 
                      placeholder="Nome do Banco" 
                    />
                    {formErrors.bankName && <p className="text-[10px] font-bold text-rose-500 px-1">{formErrors.bankName}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={empForm.bankAgency} 
                        onChange={e => {
                          setEmpForm({...empForm, bankAgency: e.target.value});
                          if (formErrors.bankAgency) setFormErrors(prev => ({ ...prev, bankAgency: '' }));
                        }} 
                        className={cn(
                          "pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                          formErrors.bankAgency && "ring-2 ring-rose-500"
                        )} 
                        placeholder="Agência" 
                      />
                      {formErrors.bankAgency && <p className="text-[10px] font-bold text-rose-500 px-1">{formErrors.bankAgency}</p>}
                    </div>
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={empForm.bankAccount} 
                        onChange={e => {
                          setEmpForm({...empForm, bankAccount: e.target.value});
                          if (formErrors.bankAccount) setFormErrors(prev => ({ ...prev, bankAccount: '' }));
                        }} 
                        className={cn(
                          "pro-input h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600",
                          formErrors.bankAccount && "ring-2 ring-rose-500"
                        )} 
                        placeholder="Conta" 
                      />
                      {formErrors.bankAccount && <p className="text-[10px] font-bold text-rose-500 px-1">{formErrors.bankAccount}</p>}
                    </div>
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
