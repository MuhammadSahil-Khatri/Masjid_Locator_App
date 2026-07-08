import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  Language, 
  UserRole, 
  Masjid, 
  Announcement, 
  MasjidEvent, 
  Hadees, 
  PrayerTimes, 
  UserAccount,
  CalculationMethod,
  JuristicMethod
} from '../types';

import { showError, showSuccess, showInfo } from '../utils/toast';

interface AppContextProps {
  language: Language;
  setLanguage: React.Dispatch<React.SetStateAction<Language>>;
  highContrast: boolean;
  setHighContrast: React.Dispatch<React.SetStateAction<boolean>>;
  activeRole: UserRole;
  setActiveRole: React.Dispatch<React.SetStateAction<UserRole>>;
  users: UserAccount[];
  setUsers: React.Dispatch<React.SetStateAction<UserAccount[]>>;
  currentUser: UserAccount | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserAccount | null>>;
  
  masjids: Masjid[];
  setMasjids: React.Dispatch<React.SetStateAction<Masjid[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  events: MasjidEvent[];
  setEvents: React.Dispatch<React.SetStateAction<MasjidEvent[]>>;
  hadeesList: Hadees[];
  setHadeesList: React.Dispatch<React.SetStateAction<Hadees[]>>;
  
  translations: Record<string, string>;
  isRtl: boolean;
  
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  
  // Simulation Helpers
  handleRsvpToggle: (eventId: string) => void;
  handleAnnounceRead: (announceId: string) => void;
  handleApproveMasjid: (id: string) => void;
  handleUpdateTimes: (masjidId: string, times: PrayerTimes) => void;
  handleAddEvent: (evtData: Omit<MasjidEvent, 'id' | 'masjidName' | 'rsvpStatus' | 'rsvpCount'>) => void;
  handleAddAnnouncement: (annData: Omit<Announcement, 'id' | 'masjidName' | 'isRead'>) => void;
  handleAddHadees: (hadeesData: Omit<Hadees, 'id'>) => void;
  handleAddMasjidLocation: (newMasjid: Omit<Masjid, 'id' | 'distance' | 'isVerified'>) => void;
  handleRoleToggle: (role: 'worshipper' | 'admin' | 'super_admin') => void;
  handleAssignSubAdmin: (email: string, masjidId: string) => void;
  handleCreateUserByAdmin: (newUser: UserAccount) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [activeRole, setActiveRole] = useState<UserRole>('worshipper');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [users, setUsers] = useState<UserAccount[]>([
    {
      email: 'superadmin@nur.com',
      name: 'Super Admin',
      password: 'admin123',
      role: 'super_admin'
    },
    {
      email: 'alaqsa@nur.com',
      name: 'Imam Bilal (Al-Aqsa)',
      password: 'subadmin123',
      role: 'admin',
      assignedMasjidId: 'm1'
    },
    {
      email: 'fatih@nur.com',
      name: 'Sheikh Mehmet (Fatih)',
      password: 'subadmin123',
      role: 'admin',
      assignedMasjidId: 'm2'
    },
    {
      email: 'worshipper@nur.com',
      name: 'Hamza Worshipper',
      password: 'user123',
      role: 'worshipper',
      region: 'Karachi'
    }
  ]);

  const { user: supabaseUser, profile } = useAuth();
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);

  // Sync Supabase user and profile with local currentUser state
  useEffect(() => {
    if (supabaseUser) {
      if (profile) {
        const uiRole = profile.role;
        setCurrentUser({
          id: profile.id,
          email: supabaseUser.email || '',
          name: profile.name,
          role: uiRole,
          region: 'Karachi',
          phone: profile.phone,
          cnic: profile.cnic,
          is_blocked: profile.is_blocked,
        });
        setActiveRole(uiRole);
      } else {
        // Set fallback info from auth metadata first if profile is not loaded yet
        const metaName = supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User';
        const metaPhone = supabaseUser.user_metadata?.phone_number || supabaseUser.user_metadata?.phone || '';
        const metaCnic = supabaseUser.user_metadata?.cnic || '';
        setCurrentUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: metaName,
          role: 'worshipper',
          region: 'Karachi',
          phone: metaPhone,
          cnic: metaCnic,
          is_blocked: false,
        });
        setActiveRole('worshipper');
      }
    } else {
      setCurrentUser(null);
    }
  }, [supabaseUser, profile]);

  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<MasjidEvent[]>([]);
  const [hadeesList, setHadeesList] = useState<Hadees[]>([]);

  const translations = useMemo(() => {
    return {} as Record<string, string>;
  }, [language]);

  const isRtl = useMemo(() => {
    return language === 'ur';
  }, [language]);

  const triggerToast = (msg: string) => {
    const msgLower = msg.toLowerCase();
    if (
      msgLower.includes('error') || 
      msgLower.includes('failed') || 
      msgLower.includes('invalid') || 
      msgLower.includes('mandatory') || 
      msgLower.includes('required') || 
      msgLower.includes('نہیں') || 
      msgLower.includes('غلط')
    ) {
      showError(msg);
    } else if (
      msgLower.includes('success') || 
      msgLower.includes('approved') || 
      msgLower.includes('published') || 
      msgLower.includes('posted') || 
      msgLower.includes('submitted') || 
      msgLower.includes('کامیاب') || 
      msgLower.includes('محفوظ')
    ) {
      showSuccess(msg);
    } else {
      showInfo(msg);
    }
  };



  const handleRsvpToggle = (eventId: string) => {
    setEvents(prev => prev.map(evt => {
      if (evt.id === eventId) {
        const isGoing = evt.rsvpStatus === 'going';
        return {
          ...evt,
          rsvpStatus: isGoing ? 'none' : 'going',
          rsvpCount: isGoing ? evt.rsvpCount - 1 : evt.rsvpCount + 1
        };
      }
      return evt;
    }));
  };

  const handleAnnounceRead = (announceId: string) => {
    setAnnouncements(prev => prev.map(ann => {
      if (ann.id === announceId) {
        return { ...ann, isRead: true };
      }
      return ann;
    }));
  };

  const handleApproveMasjid = (id: string) => {
    setMasjids(prev => prev.map(mas => {
      if (mas.id === id) {
        return { ...mas, isVerified: true };
      }
      return mas;
    }));
    triggerToast("Masjid location approved!");
  };

  const handleUpdateTimes = (masjidId: string, times: PrayerTimes) => {
    setMasjids(prev => prev.map(mas => {
      if (mas.id === masjidId) {
        return { ...mas, prayerTimes: times };
      }
      return mas;
    }));
    triggerToast("Prayer times updated successfully!");
  };

  const handleAddEvent = (evtData: Omit<MasjidEvent, 'id' | 'masjidName' | 'rsvpStatus' | 'rsvpCount'>) => {
    const parentMasjid = masjids.find(m => m.id === evtData.masjidId);
    setEvents(prev => [
      {
        ...evtData,
        id: `e_gen_${Date.now()}`,
        masjidName: parentMasjid ? parentMasjid.nameEn : 'Masjid Profile',
        rsvpStatus: 'none',
        rsvpCount: 0
      },
      ...prev
    ]);
    triggerToast("Event published successfully!");
  };

  const handleAddAnnouncement = (annData: Omit<Announcement, 'id' | 'masjidName' | 'isRead'>) => {
    const parentMasjid = masjids.find(m => m.id === annData.masjidId);
    setAnnouncements(prev => [
      {
        ...annData,
        id: `a_gen_${Date.now()}`,
        masjidName: parentMasjid ? parentMasjid.nameEn : 'Masjid Profile',
        isRead: false
      },
      ...prev
    ]);
    triggerToast("Announcement posted successfully!");
  };

  const handleAddHadees = (hadeesData: Omit<Hadees, 'id'>) => {
    setHadeesList(prev => [
      {
        ...hadeesData,
        id: `h_gen_${Date.now()}`
      },
      ...prev
    ]);
    triggerToast("Hadees shared successfully!");
  };

  const handleAddMasjidLocation = (newMasjid: Omit<Masjid, 'id' | 'distance' | 'isVerified'>) => {
    setMasjids(prev => [
      ...prev,
      {
        ...newMasjid,
        id: `m_gen_${Date.now()}`,
        distance: parseFloat((Math.random() * 4 + 1).toFixed(1)),
        isVerified: false
      }
    ]);
    triggerToast("Suggestion submitted to Super Admin!");
  };

  const handleRoleToggle = (role: 'worshipper' | 'admin' | 'super_admin') => {
    setActiveRole(role);
    const primaryForRole = users.find(u => u.role === role);
    if (primaryForRole) {
      setCurrentUser(primaryForRole);
    } else {
      setCurrentUser(null);
    }
  };

  const handleAssignSubAdmin = (email: string, masjidId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.email.toLowerCase() === email.toLowerCase()) {
        return { ...u, assignedMasjidId: masjidId };
      }
      return u;
    }));
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      setCurrentUser(prev => prev ? { ...prev, assignedMasjidId: masjidId } : null);
    }
    triggerToast(`Assigned as Sub-Admin to Masjid ID: ${masjidId}`);
  };

  const handleCreateUserByAdmin = (newUser: UserAccount) => {
    setUsers(prev => [...prev, newUser]);
    triggerToast(`User ${newUser.name} registered successfully!`);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        highContrast,
        setHighContrast,
        activeRole,
        setActiveRole,
        users,
        setUsers,
        currentUser,
        setCurrentUser,
        masjids,
        setMasjids,
        announcements,
        setAnnouncements,
        events,
        setEvents,
        hadeesList,
        setHadeesList,
        translations,
        isRtl,
        toastMessage,
        triggerToast,
        handleRsvpToggle,
        handleAnnounceRead,
        handleApproveMasjid,
        handleUpdateTimes,
        handleAddEvent,
        handleAddAnnouncement,
        handleAddHadees,
        handleAddMasjidLocation,
        handleRoleToggle,
        handleAssignSubAdmin,
        handleCreateUserByAdmin
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
export { AppContext };
