import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
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
import { 
  INITIAL_MASJID_DATA, 
  INITIAL_AHADEES, 
  INITIAL_EVENTS, 
  INITIAL_ANNOUNCEMENTS, 
  i18n 
} from '../data/mockData';

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
  
  translations: typeof i18n['en'];
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
  handleRoleToggle: (role: 'worshipper' | 'sub_admin' | 'super_admin') => void;
  handleAssignSubAdmin: (email: string, masjidId: string) => void;
  handleCreateUserByAdmin: (newUser: UserAccount) => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [highContrast, setHighContrast] = useState<boolean>(true);
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
      role: 'sub_admin',
      assignedMasjidId: 'm1'
    },
    {
      email: 'fatih@nur.com',
      name: 'Sheikh Mehmet (Fatih)',
      password: 'subadmin123',
      role: 'sub_admin',
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

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [masjids, setMasjids] = useState<Masjid[]>(INITIAL_MASJID_DATA);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [events, setEvents] = useState<MasjidEvent[]>(INITIAL_EVENTS);
  const [hadeesList, setHadeesList] = useState<Hadees[]>(INITIAL_AHADEES);

  const translations = useMemo(() => {
    return i18n[language];
  }, [language]);

  const isRtl = useMemo(() => {
    return language === 'ur';
  }, [language]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 3000);
  };

  useEffect(() => {
    if (currentUser?.region) {
      const reg = currentUser.region;
      triggerToast(`📍 Switched to calculations for ${reg}!`);
    }
  }, [currentUser]);

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

  const handleRoleToggle = (role: 'worshipper' | 'sub_admin' | 'super_admin') => {
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
