import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  Platform 
} from 'react-native';
import { 
  Shield, 
  Plus, 
  Check, 
  CheckCircle, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  BookOpen, 
  Send, 
  UserCheck, 
  Activity, 
  Users 
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useNavigation } from '../../navigation/NavigationContext';

export const SettingsScreen: React.FC = () => {
  const { 
    currentUser, 
    masjids, 
    users, 
    handleApproveMasjid, 
    handleUpdateTimes, 
    handleAddEvent, 
    handleAddAnnouncement, 
    handleAddHadees, 
    handleAssignSubAdmin, 
    handleCreateUserByAdmin,
    highContrast: isDark, 
    isRtl, 
    translations, 
    triggerToast 
  } = useApp();

  const currentTheme = isDark ? colors.dark : colors.light;
  const { navigate } = useNavigation();

  // If user is not logged in or is a worshipper, show unauthorized screen
  const isAdmin = currentUser && (currentUser.role === 'sub_admin' || currentUser.role === 'super_admin');

  // Tab state within admin panel
  const [adminTab, setAdminTab] = useState<'publish' | 'analytics' | 'queue' | 'subadmins'>('publish');

  // Sync tab selection with role changes
  useEffect(() => {
    if (currentUser?.role === 'super_admin') {
      setAdminTab('subadmins');
    } else {
      setAdminTab('publish');
    }
  }, [currentUser]);

  // Focus targets
  const [selectedMasjidId, setSelectedMasjidId] = useState<string>('');
  
  // Pickers Visibility
  const [masjidPickerVisible, setMasjidPickerVisible] = useState(false);
  const [assignPickerVisible, setAssignPickerVisible] = useState(false);
  const [activeAssignEmail, setActiveAssignEmail] = useState<string | null>(null);

  // Setup selectedMasjidId based on role & assignedMasjidId
  useEffect(() => {
    if (currentUser?.role === 'sub_admin' && currentUser?.assignedMasjidId) {
      setSelectedMasjidId(currentUser.assignedMasjidId);
    } else if (masjids.length > 0 && !selectedMasjidId) {
      const firstVerified = masjids.find(m => m.isVerified);
      setSelectedMasjidId(firstVerified ? firstVerified.id : masjids[0].id);
    }
  }, [currentUser, masjids]);

  // Sub-admin creation tool states
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [newSubAdminName, setNewSubAdminName] = useState('');
  const [newSubAdminPassword, setNewSubAdminPassword] = useState('subadmin123');
  const [newSubAdminMasjidId, setNewSubAdminMasjidId] = useState(masjids[0]?.id || '');
  const [newSubAdminMasjidPicker, setNewSubAdminMasjidPicker] = useState(false);
  
  // Sub-admin live forms for times
  const [formFajr, setFormFajr] = useState('04:18');
  const [formDhuhr, setFormDhuhr] = useState('12:35');
  const [formAsr, setFormAsr] = useState('17:05');
  const [formMaghrib, setFormMaghrib] = useState('19:20');
  const [formIsha, setFormIsha] = useState('20:45');
  const [formJummah, setFormJummah] = useState('13:30');

  // Event creation form
  const [eventTitle, setEventTitle] = useState('');
  const [eventTitleUr, setEventTitleUr] = useState('');
  const [eventCategory, setEventCategory] = useState<'iftar' | 'lecture' | 'janaza' | 'general'>('lecture');
  const [eventCategoryPicker, setEventCategoryPicker] = useState(false);
  const [eventDesc, setEventDesc] = useState('');
  const [eventDescUr, setEventDescUr] = useState('');
  const [eventTime, setEventTime] = useState('07:30 PM');
  const [eventDate, setEventDate] = useState('Saturday, June 20');

  // Announcement creation form
  const [announceTitle, setAnnounceTitle] = useState('');
  const [announceTitleUr, setAnnounceTitleUr] = useState('');
  const [announceContent, setAnnounceContent] = useState('');
  const [announceContentUr, setAnnounceContentUr] = useState('');
  const [announcePriority, setAnnouncePriority] = useState<'normal' | 'high'>('normal');

  // Hadees formulation
  const [hadeesAr, setHadeesAr] = useState('');
  const [hadeesEn, setHadeesEn] = useState('');
  const [hadeesUr, setHadeesUr] = useState('');
  const [hadeesRefEn, setHadeesRefEn] = useState('');
  const [hadeesRefUr, setHadeesRefUr] = useState('');
  const [hadeesSource, setHadeesSource] = useState('Bukhari');

  // Pre-load timing values for selected masjid automatically
  useEffect(() => {
    if (!selectedMasjidId) return;
    const targetMasjid = masjids.find(m => m.id === selectedMasjidId);
    if (targetMasjid) {
      setFormFajr(targetMasjid.prayerTimes.fajr);
      setFormDhuhr(targetMasjid.prayerTimes.dhuhr);
      setFormAsr(targetMasjid.prayerTimes.asr);
      setFormMaghrib(targetMasjid.prayerTimes.maghrib);
      setFormIsha(targetMasjid.prayerTimes.isha);
      setFormJummah(targetMasjid.prayerTimes.jummah);
    }
  }, [selectedMasjidId, masjids]);

  const activeMasjidObj = useMemo(() => {
    return masjids.find(m => m.id === selectedMasjidId);
  }, [masjids, selectedMasjidId]);

  const pendingMasjids = useMemo(() => {
    return masjids.filter(m => !m.isVerified);
  }, [masjids]);

  const subAdmins = useMemo(() => {
    return users.filter(u => u.role === 'sub_admin');
  }, [users]);

  // Form Submissions
  const handleTimeSubmit = () => {
    if (!selectedMasjidId) return;
    handleUpdateTimes(selectedMasjidId, {
      fajr: formFajr,
      dhuhr: formDhuhr,
      asr: formAsr,
      maghrib: formMaghrib,
      isha: formIsha,
      jummah: formJummah,
    });
    triggerToast(translations.adminPublishSuccess);
  };

  const handleEventSubmit = () => {
    if (!selectedMasjidId || !eventTitle || !eventDesc) {
      triggerToast('Please fill out English title & description!');
      return;
    }
    handleAddEvent({
      masjidId: selectedMasjidId,
      titleEn: eventTitle,
      titleUr: eventTitleUr || eventTitle,
      descriptionEn: eventDesc,
      descriptionUr: eventDescUr || eventDesc,
      date: eventDate,
      time: eventTime,
      category: eventCategory,
    });
    setEventTitle('');
    setEventTitleUr('');
    setEventDesc('');
    setEventDescUr('');
    triggerToast(translations.adminPublishSuccess);
  };

  const handleAnnouncementSubmit = () => {
    if (!selectedMasjidId || !announceTitle || !announceContent) {
      triggerToast('Please fill out English title & content!');
      return;
    }
    handleAddAnnouncement({
      masjidId: selectedMasjidId,
      titleEn: announceTitle,
      titleUr: announceTitleUr || announceTitle,
      contentEn: announceContent,
      contentUr: announceContentUr || announceContent,
      date: 'Today',
      priority: announcePriority,
    });
    setAnnounceTitle('');
    setAnnounceTitleUr('');
    setAnnounceContent('');
    setAnnounceContentUr('');
    triggerToast(translations.adminPublishSuccess);
  };

  const handleHadeesSubmit = () => {
    if (!hadeesAr || !hadeesEn || !hadeesUr) {
      triggerToast('All Arabic, English, and Urdu texts are mandatory!');
      return;
    }
    handleAddHadees({
      textAr: hadeesAr,
      textEn: hadeesEn,
      textUr: hadeesUr,
      referenceEn: hadeesRefEn || 'Hadith Book Reference',
      referenceUr: hadeesRefUr || 'ماخذ کتاب',
      source: hadeesSource,
    });
    setHadeesAr('');
    setHadeesEn('');
    setHadeesUr('');
    setHadeesRefEn('');
    setHadeesRefUr('');
    triggerToast(translations.adminPublishSuccess);
  };

  const handleCreateSubAdmin = () => {
    if (!newSubAdminEmail || !newSubAdminName) {
      triggerToast('All fields required!');
      return;
    }
    handleCreateUserByAdmin({
      email: newSubAdminEmail,
      name: newSubAdminName,
      password: newSubAdminPassword,
      role: 'sub_admin',
      assignedMasjidId: newSubAdminMasjidId,
    });
    setNewSubAdminEmail('');
    setNewSubAdminName('');
    triggerToast('Sub-Admin registered successfully!');
  };

  if (!isAdmin) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }, styles.unauthContainer]}>
        <AlertTriangle size={48} color={colors.warning} style={{ marginBottom: spacing.md }} />
        <Text style={[styles.unauthTitle, { color: currentTheme.text }]}>Admin Privileges Required</Text>
        <Text style={[styles.unauthText, { color: currentTheme.textMuted }]}>
          You must log in with an administrator account to view dashboard controls. Go to Profile to log in.
        </Text>
        <Button
          title="Go to Login Screen"
          onPress={() => navigate('Auth')}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {/* Admin Panel Header */}
      <View style={[styles.adminHeader, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        <View style={styles.headerTitleRow}>
          <Shield size={18} color={colors.primary} />
          <Text style={[styles.adminHeaderTitle, { color: currentTheme.text }]}>
            {currentUser.role === 'super_admin' ? translations.activeSuperAdmin : translations.activeSubAdmin}
          </Text>
        </View>
        <Text style={[styles.adminHeaderEmail, { color: currentTheme.textMuted }]}>
          Logged in: {currentUser.name} ({currentUser.email})
        </Text>
      </View>

      {/* Tabs segment for Super Admins / Sub Admins */}
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={false} style={[styles.adminNavTabs, { backgroundColor: currentTheme.card, borderBottomColor: currentTheme.border }]}>
        {currentUser.role === 'super_admin' && (
          <>
            <TouchableOpacity 
              style={[styles.navTabBtn, adminTab === 'subadmins' && styles.navTabBtnActive]} 
              onPress={() => setAdminTab('subadmins')}
            >
              <Users size={12} color={adminTab === 'subadmins' ? colors.primary : currentTheme.textMuted} />
              <Text style={[styles.navTabText, adminTab === 'subadmins' ? styles.textActive : { color: currentTheme.textMuted }]}>Sub-Admins</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.navTabBtn, adminTab === 'queue' && styles.navTabBtnActive]} 
              onPress={() => setAdminTab('queue')}
            >
              <Shield size={12} color={adminTab === 'queue' ? colors.primary : currentTheme.textMuted} />
              <Text style={[styles.navTabText, adminTab === 'queue' ? styles.textActive : { color: currentTheme.textMuted }]}>Approvals</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity 
          style={[styles.navTabBtn, adminTab === 'publish' && styles.navTabBtnActive]} 
          onPress={() => setAdminTab('publish')}
        >
          <Clock size={12} color={adminTab === 'publish' ? colors.primary : currentTheme.textMuted} />
          <Text style={[styles.navTabText, adminTab === 'publish' ? styles.textActive : { color: currentTheme.textMuted }]}>Publish Details</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navTabBtn, adminTab === 'analytics' && styles.navTabBtnActive]} 
          onPress={() => setAdminTab('analytics')}
        >
          <BarChart3 size={12} color={adminTab === 'analytics' ? colors.primary : currentTheme.textMuted} />
          <Text style={[styles.navTabText, adminTab === 'analytics' ? styles.textActive : { color: currentTheme.textMuted }]}>Analytics</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Dynamic Screen Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {adminTab === 'subadmins' && currentUser.role === 'super_admin' && (
          <View style={styles.tabContent}>
            {/* Create new Sub Admin Account Form */}
            <View style={[styles.adminFormCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>🔑 Register New Mosque Administrator</Text>
              
              <Input
                label="Administrator Full Name"
                placeholder="e.g. Imam Bilal"
                value={newSubAdminName}
                onChangeText={setNewSubAdminName}
                isDark={isDark}
              />

              <Input
                label="Administrator Email Address"
                placeholder="e.g. alaqsa@nur.com"
                value={newSubAdminEmail}
                onChangeText={setNewSubAdminEmail}
                isDark={isDark}
              />

              <Input
                label="Secure Password"
                placeholder="subadmin123"
                value={newSubAdminPassword}
                onChangeText={setNewSubAdminPassword}
                secureTextEntry={true}
                isDark={isDark}
              />

              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: currentTheme.textMuted }]}>Assign Mosque Jurisdiction</Text>
                <TouchableOpacity 
                  style={[styles.pickerTrigger, { borderColor: currentTheme.border }]} 
                  onPress={() => setNewSubAdminMasjidPicker(true)}
                >
                  <Text style={{ color: currentTheme.text }}>
                    {masjids.find(m => m.id === newSubAdminMasjidId)?.nameEn || 'Select Masjid'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Create Sub-Admin"
                onPress={handleCreateSubAdmin}
                style={{ marginTop: spacing.md }}
              />
            </View>

            {/* List Active Sub Admins */}
            <View style={[styles.adminFormCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border, marginTop: spacing.lg }]}>
              <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>📋 Mosque Administrators Directory</Text>
              <View style={styles.divider} />
              
              {subAdmins.map((sub, idx) => (
                <View key={idx} style={[styles.subAdminRow, { borderBottomColor: currentTheme.border }]}>
                  <View style={styles.flexOne}>
                    <Text style={[styles.subAdminName, { color: currentTheme.text }]}>{sub.name}</Text>
                    <Text style={[styles.subAdminEmail, { color: currentTheme.textMuted }]}>{sub.email}</Text>
                    <Text style={[styles.subAdminJurisdiction, { color: colors.primary }]}>
                      Jurisdiction: {masjids.find(m => m.id === sub.assignedMasjidId)?.nameEn || 'None Assigned'}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.assignBtn, { backgroundColor: colors.primaryLight }]}
                    onPress={() => {
                      setActiveAssignEmail(sub.email);
                      setAssignPickerVisible(true);
                    }}
                  >
                    <UserCheck size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {adminTab === 'queue' && currentUser.role === 'super_admin' && (
          <View style={styles.tabContent}>
            <Text style={[styles.formSectionTitle, { color: currentTheme.text }, isRtl && typography.alignRtl]}>
              {translations.adminApprovalQueue}
            </Text>

            {pendingMasjids.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CheckCircle size={36} color={colors.primary} />
                <Text style={[styles.emptyText, { color: currentTheme.textMuted }]}>
                  No pending approvals. All submitted locations verified!
                </Text>
              </View>
            ) : (
              pendingMasjids.map(item => (
                <View key={item.id} style={[styles.approvalCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                  <View style={styles.flexOne}>
                    <Text style={[styles.approvalTitle, { color: currentTheme.text }]}>{item.nameEn}</Text>
                    <Text style={[styles.approvalAddress, { color: currentTheme.textMuted }]}>{item.addressEn}</Text>
                    <Text style={[styles.approvalCoordinates, { color: colors.primary }]}>
                      Coordinates: {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.approveActionBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleApproveMasjid(item.id)}
                  >
                    <Check size={16} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {adminTab === 'publish' && (
          <View style={styles.tabContent}>
            {/* Focus Masjid Selection */}
            {currentUser.role === 'super_admin' && (
              <View style={styles.focusSelectionCard}>
                <Text style={[styles.label, { color: currentTheme.textMuted }]}>Focus Masjid Profile:</Text>
                <TouchableOpacity 
                  style={[styles.pickerTrigger, { borderColor: currentTheme.border }]} 
                  onPress={() => setMasjidPickerVisible(true)}
                >
                  <Text style={{ color: currentTheme.text, fontWeight: 'bold' }}>
                    {activeMasjidObj ? activeMasjidObj.nameEn : 'Select Masjid'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {activeMasjidObj ? (
              <>
                {/* 1. Update timings form */}
                <View style={[styles.adminFormCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                  <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>🕒 {translations.submitNewTime}</Text>
                  
                  <View style={styles.timingsRow}>
                    <View style={styles.timingsCol}>
                      <Input label={translations.fajr} value={formFajr} onChangeText={setFormFajr} isDark={isDark} />
                    </View>
                    <View style={styles.timingsCol}>
                      <Input label={translations.dhuhr} value={formDhuhr} onChangeText={setFormDhuhr} isDark={isDark} />
                    </View>
                  </View>

                  <View style={styles.timingsRow}>
                    <View style={styles.timingsCol}>
                      <Input label={translations.asr} value={formAsr} onChangeText={setFormAsr} isDark={isDark} />
                    </View>
                    <View style={styles.timingsCol}>
                      <Input label={translations.maghrib} value={formMaghrib} onChangeText={setFormMaghrib} isDark={isDark} />
                    </View>
                  </View>

                  <View style={styles.timingsRow}>
                    <View style={styles.timingsCol}>
                      <Input label={translations.isha} value={formIsha} onChangeText={setFormIsha} isDark={isDark} />
                    </View>
                    <View style={styles.timingsCol}>
                      <Input label={translations.jummah} value={formJummah} onChangeText={setFormJummah} isDark={isDark} />
                    </View>
                  </View>

                  <Button title="Update Prayer Times" onPress={handleTimeSubmit} />
                </View>

                {/* 2. Publish announcements */}
                <View style={[styles.adminFormCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border, marginTop: spacing.lg }]}>
                  <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>📢 Publish Official Announcement</Text>
                  
                  <Input label="Title (English)" placeholder="Congregation change notice" value={announceTitle} onChangeText={setAnnounceTitle} isDark={isDark} />
                  <Input label="ٹائٹل (اردو)" placeholder="تبدیلی وقتِ نماز اطلاع" value={announceTitleUr} onChangeText={setAnnounceTitleUr} isDark={isDark} isRtl={true} />
                  
                  <Input label="Content (English)" placeholder="Detail announcement info" value={announceContent} onChangeText={setAnnounceContent} isDark={isDark} />
                  <Input label="تفصیلات (اردو)" placeholder="تفصیلی اعلان" value={announceContentUr} onChangeText={setAnnounceContentUr} isDark={isDark} isRtl={true} />

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: currentTheme.textMuted }]}>Priority Alert</Text>
                    <View style={styles.buttonGroup}>
                      <TouchableOpacity 
                        style={[styles.btnGroupOption, announcePriority === 'normal' && styles.btnGroupOptionActive]}
                        onPress={() => setAnnouncePriority('normal')}
                      >
                        <Text style={[styles.btnGroupText, announcePriority === 'normal' && styles.btnGroupTextActive]}>Normal Notice</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.btnGroupOption, announcePriority === 'high' && styles.btnGroupOptionActive]}
                        onPress={() => setAnnouncePriority('high')}
                      >
                        <Text style={[styles.btnGroupText, announcePriority === 'high' && styles.btnGroupTextActive]}>Urgent Announcement</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Button title="Post Announcement" onPress={handleAnnouncementSubmit} />
                </View>

                {/* 3. Publish Event */}
                <View style={[styles.adminFormCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border, marginTop: spacing.lg }]}>
                  <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>📅 Publish Community Event</Text>
                  
                  <Input label="Event Title (English)" placeholder="Quran Tafseer Session" value={eventTitle} onChangeText={setEventTitle} isDark={isDark} />
                  <Input label="عنوان (اردو)" placeholder="درسِ قرآن تقریب" value={eventTitleUr} onChangeText={setEventTitleUr} isDark={isDark} isRtl={true} />
                  
                  <Input label="Description (English)" placeholder="Join us..." value={eventDesc} onChangeText={setEventDesc} isDark={isDark} />
                  <Input label="تفصیل (اردو)" placeholder="پروگرام کے کوائف" value={eventDescUr} onChangeText={setEventDescUr} isDark={isDark} isRtl={true} />
                  
                  <Input label="Event Date" placeholder="e.g. Saturday, June 20" value={eventDate} onChangeText={setEventDate} isDark={isDark} />
                  <Input label="Event Time" placeholder="e.g. 07:30 PM" value={eventTime} onChangeText={setEventTime} isDark={isDark} />

                  <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: currentTheme.textMuted }]}>Category</Text>
                    <TouchableOpacity 
                      style={[styles.pickerTrigger, { borderColor: currentTheme.border }]} 
                      onPress={() => setEventCategoryPicker(true)}
                    >
                      <Text style={{ color: currentTheme.text }}>
                        {eventCategory.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Button title="Publish Event" onPress={handleEventSubmit} />
                </View>
              </>
            ) : (
              <Text style={{ color: currentTheme.text, textAlign: 'center' }}>No active verified masjid profile found.</Text>
            )}

            {/* 4. Publish Hadees */}
            <View style={[styles.adminFormCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border, marginTop: spacing.lg }]}>
              <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>📖 Publish Global Hadees</Text>
              
              <Input label="Arabic Text (متن عربى)" placeholder="عربى عبارت درج کریں" value={hadeesAr} onChangeText={setHadeesAr} isDark={isDark} isRtl={true} />
              <Input label="Urdu Translation (اردو ترجمہ)" placeholder="حدیثِ مبارکہ کا ترجمہ" value={hadeesUr} onChangeText={setHadeesUr} isDark={isDark} isRtl={true} />
              <Input label="English Translation" placeholder="Hadees Translation" value={hadeesEn} onChangeText={setHadeesEn} isDark={isDark} />
              
              <Input label="Reference (English)" placeholder="e.g. Sahih al-Bukhari 450" value={hadeesRefEn} onChangeText={setHadeesRefEn} isDark={isDark} />
              <Input label="حوالہ (اردو)" placeholder="مثال: صحیح البخاری: 450" value={hadeesRefUr} onChangeText={setHadeesRefUr} isDark={isDark} isRtl={true} />
              
              <Input label="Reference Source Label" placeholder="Bukhari & Muslim" value={hadeesSource} onChangeText={setHadeesSource} isDark={isDark} />

              <Button title="Post Hadees of Day" onPress={handleHadeesSubmit} />
            </View>
          </View>
        )}

        {adminTab === 'analytics' && (
          <View style={styles.tabContent}>
            <Text style={[styles.formSectionTitle, { color: currentTheme.text }]}>📊 Platform Analytics</Text>
            
            {/* Platform Stats Grid */}
            <View style={styles.statsGrid}>
              {[
                { label: 'Total Verified Masjids', val: masjids.filter(m => m.isVerified).length, icon: Shield },
                { label: 'Registered Worshippers', val: '4,850 users', icon: Users },
                { label: 'Active Events Tracked', val: '12 active', icon: Calendar },
                { label: 'App Engagement Level', val: '99.8% live', icon: Activity }
              ].map((item, idx) => (
                <View key={idx} style={[styles.statCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
                  <item.icon size={20} color={colors.primary} />
                  <Text style={[styles.statVal, { color: currentTheme.text }]}>{item.val}</Text>
                  <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* Custom Graph Vector representation */}
            <View style={[styles.graphCard, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
              <Text style={[styles.graphTitle, { color: currentTheme.text }]}>Weekly Worshipper Check-In Trends</Text>
              
              <View style={styles.chartContainer}>
                {[45, 60, 85, 30, 95, 75, 110].map((height, idx) => (
                  <View key={idx} style={styles.chartCol}>
                    <View style={[styles.chartBar, { height, backgroundColor: colors.primary }]} />
                    <Text style={[styles.chartLabel, { color: currentTheme.textMuted }]}>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Picker modales */}
      <Modal visible={masjidPickerVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMasjidPickerVisible(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Select Focus Masjid</Text>
            <FlatList
              data={masjids.filter(m => m.isVerified)}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem}
                  onPress={() => {
                    setSelectedMasjidId(item.id);
                    setMasjidPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedMasjidId === item.id ? { color: colors.primary, fontWeight: 'bold' } : { color: currentTheme.text }]}>
                    {item.nameEn}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={newSubAdminMasjidPicker} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setNewSubAdminMasjidPicker(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Select Mosque Jurisdiction</Text>
            <FlatList
              data={masjids}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem}
                  onPress={() => {
                    setNewSubAdminMasjidId(item.id);
                    setNewSubAdminMasjidPicker(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, newSubAdminMasjidId === item.id ? { color: colors.primary, fontWeight: 'bold' } : { color: currentTheme.text }]}>
                    {item.nameEn}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={assignPickerVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAssignPickerVisible(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Change Jurisdiction Assignment</Text>
            <FlatList
              data={masjids}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.pickerItem}
                  onPress={() => {
                    if (activeAssignEmail) {
                      handleAssignSubAdmin(activeAssignEmail, item.id);
                    }
                    setAssignPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, { color: currentTheme.text }]}>
                    {item.nameEn}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={eventCategoryPicker} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEventCategoryPicker(false)}>
          <View style={[styles.pickerModalContent, { backgroundColor: currentTheme.card }]}>
            <Text style={[styles.pickerTitle, { color: currentTheme.text }]}>Select Category</Text>
            {['iftar', 'lecture', 'janaza', 'general'].map((cat) => (
              <TouchableOpacity 
                key={cat} 
                style={styles.pickerItem}
                onPress={() => {
                  setEventCategory(cat as any);
                  setEventCategoryPicker(false);
                }}
              >
                <Text style={[styles.pickerItemText, eventCategory === cat ? { color: colors.primary, fontWeight: 'bold' } : { color: currentTheme.text }]}>
                  {cat.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.bottomSpacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unauthContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  unauthTitle: {
    fontSize: typography.sizes.md + 2,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  unauthText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  adminHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  adminHeaderTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  adminHeaderEmail: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  adminNavTabs: {
    height: 44,
    borderBottomWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  navTabBtn: {
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    height: '100%',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabBtnActive: {
    borderBottomColor: colors.primary,
  },
  navTabText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  textActive: {
    color: colors.primary,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  tabContent: {
    padding: spacing.md,
  },
  focusSelectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  pickerTrigger: {
    borderWidth: 1,
    height: 36,
    borderRadius: spacing.borderRadiusSm,
    paddingHorizontal: spacing.sm,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minWidth: 120,
  },
  adminFormCard: {
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
    padding: spacing.md,
  },
  formSectionTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  timingsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timingsCol: {
    flex: 1,
  },
  formGroup: {
    marginBottom: spacing.md,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  btnGroupOption: {
    flex: 1,
    height: 38,
    borderRadius: spacing.borderRadiusSm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGroupOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  btnGroupText: {
    fontSize: typography.sizes.xs,
    color: '#64748b',
    fontWeight: '600',
  },
  btnGroupTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  subAdminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  subAdminName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  subAdminEmail: {
    fontSize: typography.sizes.xs,
  },
  subAdminJurisdiction: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: '600',
    marginTop: 2,
  },
  assignBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    marginVertical: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.xs + 1,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  approvalCard: {
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  approvalTitle: {
    fontSize: typography.sizes.sm + 1,
    fontWeight: typography.weights.bold,
  },
  approvalAddress: {
    fontSize: typography.sizes.xs,
    marginVertical: 2,
  },
  approvalCoordinates: {
    fontSize: typography.sizes.xs - 1,
    fontWeight: '600',
  },
  approveActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '47%',
    borderRadius: spacing.borderRadiusMd,
    borderWidth: 1,
    padding: spacing.md,
    alignItems: 'center',
  },
  statVal: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginVertical: spacing.xs,
  },
  statLabel: {
    fontSize: typography.sizes.xs - 2,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  graphCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.borderRadiusLg,
    borderWidth: 1,
  },
  graphTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: spacing.md,
  },
  chartCol: {
    alignItems: 'center',
  },
  chartBar: {
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabel: {
    fontSize: 9,
    marginTop: spacing.xs,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  pickerModalContent: {
    borderRadius: spacing.borderRadiusLg,
    width: '100%',
    padding: spacing.lg,
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  pickerItem: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: typography.sizes.sm,
  },
  flexOne: {
    flex: 1,
  },
  rowReverse: {
    flexDirection: 'row-reverse',
  },
  bottomSpacer: {
    height: 80,
  },
});
export default SettingsScreen;
