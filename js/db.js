/**
 * Masjid Management Platform - Local Storage Database Module
 * Handles initialization of default data, authentication, session state, 
 * data getters, setters, and auto balance updates.
 */

// Default data constants for premium realistic experience
const DEFAULT_MASJID_PROFILE = {
  name: "Al-Noor Grand Masjid & Islamic Center",
  shortName: "Al-Noor Masjid",
  established: "1412 AH (1992 CE)",
  address: "786 Olive Branch Boulevard, Crescent District, Capital City, CC 89502",
  phone: "+1 (555) 786-1234",
  email: "office@alnoormasjid.org",
  imam: "Sheikh Muhammad Al-Azhari (Graduate of Al-Azhar University)",
  muezzin: "Qari Ibrahim Siddiq",
  coordinates: { lat: 40.7128, lng: -74.0060 },
  announcementTicker: "🌙 Ramadan 1447 AH: Special Taraweeh prayers will begin tonight after Isha. Iftars are served daily."
};

const DEFAULT_PRAYER_TIMES = {
  fajr: { athan: "04:30 AM", iqamah: "05:00 AM" },
  zuhar: { athan: "01:00 PM", iqamah: "01:15 PM" },
  asr: { athan: "04:45 PM", iqamah: "05:00 PM" },
  maghrib: { athan: "06:35 PM", iqamah: "06:40 PM" }, // Maghrib Iqamah is short
  isha: { athan: "08:15 PM", iqamah: "08:30 PM" },
  jumma1: { athan: "01:15 PM", iqamah: "01:30 PM", khateeb: "Sheikh Muhammad Al-Azhari" },
  jumma2: { athan: "02:15 PM", iqamah: "02:30 PM", khateeb: "Dr. Asim Farooq" },
  ramadan: { seharEnds: "04:20 AM", iftarBegins: "06:35 PM", taraweeh: "08:45 PM (20 Raka'ahs)" }
};

const DEFAULT_USERS = [
  { username: "superadmin", password: "super123", name: "Hajj Ahmad Khan", role: "Super Admin" },
  { username: "admin", password: "admin123", name: "Yousef Al-Masri", role: "Admin" },
  { username: "editor", password: "editor123", name: "Zayd Bilal", role: "Editor" }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    title: "Weekly Quran Halaqah",
    content: "Join us every Saturday after Asr prayer for an inspiring tafseer session of Surah Al-Kahf with Imam Al-Azhari in the main prayer hall. Refreshments will be served.",
    date: "2026-05-18",
    category: "Program",
    important: true
  },
  {
    id: "ann-2",
    title: "Youth Summer Camp Registration Open",
    content: "Registration is now open for our annual Youth Summer Camp (Ages 10-17). Activities include Islamic mentorship, archery, martial arts, coding bootcamps, and outdoor field trips. Register in the administration office or online.",
    date: "2026-05-15",
    category: "Education",
    important: false
  },
  {
    id: "ann-3",
    title: "Islamic Will and Estate Seminar",
    content: "A professional seminar on drawing up an Islamic Will in accordance with both Sharia law and local country legislation. Led by legal scholars and certified Islamic estate planners.",
    date: "2026-05-12",
    category: "Community",
    important: false
  }
];

const DEFAULT_EVENTS = [
  {
    id: "evt-1",
    title: "Grand Community Barbecue & Picnic",
    date: "2026-05-24",
    time: "11:30 AM - 04:30 PM",
    speaker: "All Community Members",
    location: "Meadowlands North Park, Pavilion B",
    description: "An open social gathering for the whole family. Bring your favorite dessert; standard Halal barbecue items and soft drinks are provided by the masjid board."
  },
  {
    id: "evt-2",
    title: "Sisters' Halaqah: Purifying the Heart",
    date: "2026-05-27",
    time: "06:00 PM - 07:30 PM",
    speaker: "Ustadha Fatima Al-Hassan",
    location: "Sisters' Gallery (Second Floor)",
    description: "An intimate and engaging discussion on the spiritual ailments of the heart and their treatment through Prophetic guidance."
  },
  {
    id: "evt-3",
    title: "Mental Health in the Muslim Community",
    date: "2026-06-02",
    time: "07:30 PM - 09:00 PM",
    speaker: "Dr. Kareem Sulaiman (Consulting Psychologist)",
    location: "Main Lecture Hall",
    description: "A vital community panel discussing stress, anxiety, and breaking social stigmas surrounding mental health services. Professional counseling resources will be distributed."
  }
];

const DEFAULT_ARTICLES = [
  {
    id: "art-1",
    title: "The Golden Era of Islamic Science & Ethics",
    category: "History",
    author: "Sheikh Muhammad Al-Azhari",
    date: "2026-05-10",
    excerpt: "How faith in God fueled the greatest scientific advancement in human history, backed by rigorous moral guidelines.",
    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
    content: `<p>During the Islamic Golden Age (8th to 14th centuries), intellectual pursuits across disciplines flourished. Far from opposing scientific discovery, early Muslim scholars were deeply inspired by the Holy Quran and Hadith commands to seek knowledge and reflect upon the cosmos.</p>
              <h4>The Motivation of Faith</h4>
              <p>For a Muslim scientist, exploring astronomy helped determine prayer directions and prayer timings, while mathematics (Al-Jabr, pioneered by Al-Khwarizmi) solved complex estate regulations under Islamic jurisprudence. There was no artificial wall built between natural sciences and spiritual ethics.</p>
              <h4>Ethical Governance of Sciences</h4>
              <p>Crucially, Islamic civilization placed stringent ethical standards on research. Medicine, practiced in pioneering institutions like the Mansuri Hospital in Cairo, was completely free of charge to all citizens regardless of wealth, religion, or race, embodying the Prophetic ethic: <i>'He who has no mercy on people, Allah has no mercy on him.'</i></p>`
  },
  {
    id: "art-2",
    title: "Understanding Khushu' (Devotion) in Namaz",
    category: "Spirituality",
    author: "Ustadha Fatima Al-Hassan",
    date: "2026-05-08",
    excerpt: "Practical steps to calm the racing mind and cultivate a transformative, peaceful conversation with the Divine.",
    imageUrl: "https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&q=80&w=800",
    content: `<p>Many of us struggle with focus during our prayers. We stand with our bodies face-to-face with the Qiblah, but our minds are sprinting through unfinished emails, tasks, and conversations. This state often leaves us spiritually unfulfilled.</p>
              <h4>1. Physical Preparation First</h4>
              <p>Khushu starts during wudu (ablution). Do not rush. Feel the water washes away physical and spiritual impurities. Walk calmly towards the praying spot. The hasty arrival produces a hasty mind.</p>
              <h4>2. Comprehend the Words</h4>
              <p>Take the time to learn the meaning of Surah Al-Fatihah and the short chapters you recite. When reciting <i>'Alhamdulillah'</i> (All praise belongs to Allah), pause for a heartbeat to genuinely feel gratitude for one specific blessing in your life.</p>
              <h4>3. The Universe Fades Away</h4>
              <p>Remember that you are standing directly in front of the Lord of all creation. There is no intermediary, no filter. View this as your secure, designated refuge from a heavy world.</p>`
  },
  {
    id: "art-3",
    title: "Fostering Brotherhood in a Digital Era",
    category: "Community",
    author: "Imam Dr. Asim Farooq",
    date: "2026-05-02",
    excerpt: "In a world of hyperlinks and screen-bound socialization, the physical congregational binding is more vital than ever.",
    imageUrl: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&q=80&w=800",
    content: `<p>Modern digital tools claim to connect us, but statistics reveal unprecedented levels of acute loneliness and social polarization. Within Islamic teachings, regular congregation is a powerful antidote to social decay.</p>
              <h4>The Blessing of Standing Shoulder to Shoulder</h4>
              <p>When we stand in prayer rows, there is no hierarchy. The executive stands next to the janitor, the scholar beside the student. This physical alignment melts away pride and establishes mutual recognition and compassion.</p>
              <h4>Prophetic Care</h4>
              <p>The Prophet Muhammad (peace be upon him) instructed us that greeting our brother with a sincere smile is charity, and that inquiry into our neighbor's hunger is an index of real faith. Let us put our phones face down when entering the masjid and focus on our physical brothers and sisters.</p>`
  }
];

const DEFAULT_GALLERY = [
  { id: "gal-1", type: "photo", url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800", title: "Main Prayer Hall Dome", category: "Arch" },
  { id: "gal-2", type: "photo", url: "https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&q=80&w=800", title: "Evening Serenity View", category: "Exterior" },
  { id: "gal-3", type: "photo", url: "https://images.unsplash.com/photo-1519751138087-5bf79df62d5b?auto=format&fit=crop&q=80&w=800", title: "Taraweeh Prayers Congregation", category: "Community" },
  { id: "gal-4", type: "photo", url: "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&q=80&w=800", title: "Ornate Mihrab Handcrafted Details", category: "Arch" },
  { id: "gal-5", type: "photo", url: "https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&q=80&w=800", title: "Ramadan dates serving prep", category: "Community" },
  { id: "gal-6", type: "video", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Eid Celebration Highlights Video", category: "Events" }
];

const DEFAULT_FINANCIALS = [
  { id: "tx-1", date: "2026-05-19", type: "income", category: "Friday Donation", description: "Jumma Prayer General Donation Boxes", amount: 4850.00, editor: "Yousef Al-Masri" },
  { id: "tx-2", date: "2026-05-18", type: "income", category: "Zakat", description: "Zakat al-Maal Digital Transfers", amount: 3500.00, editor: "Hajj Ahmad Khan" },
  { id: "tx-3", date: "2026-05-16", type: "expense", category: "Utility Bill", description: "Grand Hall Air Conditioning Electricity Bill", amount: 1200.00, editor: "Yousef Al-Masri" },
  { id: "tx-4", date: "2026-05-15", type: "expense", category: "Masjid Maintenance", description: "Plumbing repair in south wudu facility", amount: 350.00, editor: "Yousef Al-Masri" },
  { id: "tx-5", date: "2026-05-14", type: "income", category: "Sadaqah", description: "General Sadaqah kiosk swipe machines", amount: 1100.00, editor: "Zayd Bilal" },
  { id: "tx-6", date: "2026-05-12", type: "expense", category: "Imam Salary", description: "Monthly stipend for Sheikh Al-Azhari", amount: 3000.00, editor: "Hajj Ahmad Khan" },
  { id: "tx-7", date: "2026-05-10", type: "income", category: "Event Registration", description: "Youth Camp sign-up phase 1 deposits", amount: 1510.00, editor: "Zayd Bilal" },
  { id: "tx-8", date: "2026-05-08", type: "expense", category: "Ramadan Iftar Expense", description: "Purchase of bulk dates, rice, and halal meat", amount: 2150.00, editor: "Zayd Bilal" }
];

const DEFAULT_PREVIOUS_BROADCASTS = [
  {
    id: "prev-1",
    title: "Spiritual Architecture of a Unified Ummah",
    speaker: "Sheikh Muhammad Al-Azhari",
    description: "Weekly sermon on the spiritual building blocks of a cohesive community.",
    date: "2026-05-15",
    youtubeId: "S_C_bS0nK_Y",
    duration: "42:15",
    thumbnail: "https://images.unsplash.com/photo-1597935258735-e254c1839512?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prev-2",
    title: "The Golden Legacy: Islamic Contributions to Science",
    speaker: "Dr. Kareem Sulaiman",
    description: "Dr. Kareem Sulaiman outlines historical scientific advances.",
    date: "2026-05-08",
    youtubeId: "dQw4w9WgXcQ",
    duration: "58:30",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "prev-3",
    title: "Purifying the Heart: Devotion & Khushu' in Namaz",
    speaker: "Ustadha Fatima Al-Hassan",
    description: "Ustadha Fatima Al-Hassan discusses mindfulness during the prayer.",
    date: "2026-05-01",
    youtubeId: "S_C_bS0nK_Y",
    duration: "35:10",
    thumbnail: "https://images.unsplash.com/photo-1584551246679-0dac3d275107?auto=format&fit=crop&q=80&w=400"
  }
];

const DEFAULT_FOOTER_LINKS = {
  youtube: "https://www.youtube.com/c/AlNoorGrandMasjid",
  whatsapp: "https://chat.whatsapp.com/invite/AlNoorGrandMasjid",
  map: "https://maps.google.com/?q=Al-Noor+Grand+Masjid+Islamic+Center+Capital+City",
  facebook: "https://www.facebook.com/AlNoorGrandMasjid",
  instagram: "https://www.instagram.com/AlNoorGrandMasjid",
  telegram: "https://t.me/AlNoorGrandMasjid",
  email: "support@alnoormasjid.org",
  phone: "+1 (555) 786-1234"
};

// Database Class definition
class MasjidDatabase {
  constructor() {
    this.init();
  }

  init() {
    try {
      this.ensureKey("masjid_profile", DEFAULT_MASJID_PROFILE);
      this.ensureKey("prayer_times", DEFAULT_PRAYER_TIMES);
      this.ensureKey("users", DEFAULT_USERS);
      this.ensureKey("announcements", DEFAULT_ANNOUNCEMENTS);
      this.ensureKey("events", DEFAULT_EVENTS);
      this.ensureKey("articles", DEFAULT_ARTICLES);
      this.ensureKey("gallery", DEFAULT_GALLERY);
      this.ensureKey("financials", DEFAULT_FINANCIALS);
      this.ensureKey("live_broadcast", { isLive: false, youtubeId: "S_C_bS0nK_Y", title: "Resident Al-Noor Live Stream" });
      this.ensureKey("previous_broadcasts", DEFAULT_PREVIOUS_BROADCASTS);
      this.ensureKey("footer_links", DEFAULT_FOOTER_LINKS);
    } catch (e) {
      console.error("Failed to initializeLocalStorage DB", e);
    }
  }

  ensureKey(key, defaultValue) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
    }
  }

  // Get data
  getData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  // Set data
  setData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // Helper getters
  getProfile() { return this.getData("masjid_profile"); }
  getPrayerTimes() { return this.getData("prayer_times"); }
  getAnnouncements() { return this.getData("announcements"); }
  getEvents() { return this.getData("events"); }
  getArticles() { return this.getData("articles"); }
  getGallery() { return this.getData("gallery"); }
  getFinancials() { return this.getData("financials"); }
  getUsers() { return this.getData("users"); }
  getLiveStatus() { return this.getData("live_broadcast") || { isLive: false, youtubeId: "S_C_bS0nK_Y", title: "Resident Al-Noor Live Stream" }; }
  setLiveStatus(status) { this.setData("live_broadcast", status); }
  getPreviousBroadcasts() { return this.getData("previous_broadcasts") || []; }
  addPreviousBroadcast(broadcast) {
    const list = this.getPreviousBroadcasts();
    list.unshift(broadcast);
    this.setData("previous_broadcasts", list);
  }
  deletePreviousBroadcast(id) {
    let list = this.getPreviousBroadcasts();
    list = list.filter(item => item.id !== id);
    this.setData("previous_broadcasts", list);
  }

  // Balance & Financial Metrics calculation
  getFinancialSummary() {
    const records = this.getFinancials() || [];
    let totalIncome = 0;
    let totalExpense = 0;

    records.forEach(r => {
      const amount = parseFloat(r.amount) || 0;
      if (r.type === "income") {
        totalIncome += amount;
      } else if (r.type === "expense") {
        totalExpense += amount;
      }
    });

    const savings = totalIncome - totalExpense;
    // Let's assume total donation is a subset of income (or in our schema we treat total donation as equivalent to total income)
    const totalDonation = records
      .filter(r => r.type === "income" && ["Friday Donation", "Sadaqah", "Zakat", "Charity Box"].includes(r.category))
      .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    return {
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      savings: savings.toFixed(2),
      totalDonation: totalDonation.toFixed(2)
    };
  }

  // Add a new financial record
  addFinancialRecord(record) {
    const records = this.getFinancials() || [];
    const newRecord = {
      id: "tx-" + Date.now(),
      date: record.date || new Date().toISOString().split('T')[0],
      type: record.type, // 'income' or 'expense'
      category: record.category,
      description: record.description,
      amount: parseFloat(record.amount) || 0,
      editor: record.editor || "Unknown Admin"
    };
    records.unshift(newRecord); // Add to the top
    this.setData("financials", records);
    return newRecord;
  }

  // Edit a financial record
  editFinancialRecord(updated) {
    const records = this.getFinancials() || [];
    const index = records.findIndex(r => r.id === updated.id);
    if (index !== -1) {
      records[index] = {
        ...records[index],
        date: updated.date,
        type: updated.type,
        category: updated.category,
        description: updated.description,
        amount: parseFloat(updated.amount) || 0,
        editor: updated.editor || records[index].editor
      };
      this.setData("financials", records);
      return true;
    }
    return false;
  }

  // Delete a financial record
  deleteFinancialRecord(id) {
    let records = this.getFinancials() || [];
    records = records.filter(r => r.id !== id);
    this.setData("financials", records);
    return true;
  }

  // Add Article
  addArticle(article) {
    const list = this.getArticles() || [];
    const newItem = {
      id: "art-" + Date.now(),
      title: article.title,
      category: article.category,
      author: article.author || "Masjid Admin",
      date: new Date().toISOString().split('T')[0],
      excerpt: article.excerpt,
      imageUrl: article.imageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
      content: article.content
    };
    list.unshift(newItem);
    this.setData("articles", list);
    return newItem;
  }

  // Delete Article
  deleteArticle(id) {
    let list = this.getArticles() || [];
    list = list.filter(item => item.id !== id);
    this.setData("articles", list);
    return true;
  }

  // Add Gallery Element
  addGalleryItem(item) {
    const list = this.getGallery() || [];
    const newItem = {
      id: "gal-" + Date.now(),
      type: item.type, // 'photo' or 'video'
      url: item.url,
      title: item.title,
      category: item.category
    };
    list.unshift(newItem);
    this.setData("gallery", list);
    return newItem;
  }

  // Delete Gallery Element
  deleteGalleryItem(id) {
    let list = this.getGallery() || [];
    list = list.filter(item => item.id !== id);
    this.setData("gallery", list);
    return true;
  }

  // Update homepage details (dynamic sections)
  updateProfile(profile) {
    this.setData("masjid_profile", profile);
  }

  // Update Prayer timings
  updatePrayerTimes(times) {
    this.setData("prayer_times", times);
  }

  // Footer links Management
  getFooterLinks() {
    return this.getData("footer_links") || DEFAULT_FOOTER_LINKS;
  }
  updateFooterLinks(links) {
    this.setData("footer_links", links);
  }

  // Add announcement
  addAnnouncement(ann) {
    const list = this.getAnnouncements() || [];
    const newItem = {
      id: "ann-" + Date.now(),
      title: ann.title,
      content: ann.content,
      date: new Date().toISOString().split('T')[0],
      category: ann.category,
      important: ann.important || false
    };
    list.unshift(newItem);
    this.setData("announcements", list);
    return newItem;
  }

  // Delete Announcement
  deleteAnnouncement(id) {
    let list = this.getAnnouncements() || [];
    list = list.filter(item => item.id !== id);
    this.setData("announcements", list);
    return true;
  }

  // Add Event
  addEvent(event) {
    const list = this.getEvents() || [];
    const newItem = {
      id: "evt-" + Date.now(),
      title: event.title,
      date: event.date,
      time: event.time,
      speaker: event.speaker,
      location: event.location,
      description: event.description
    };
    list.unshift(newItem);
    this.setData("events", list);
    return newItem;
  }

  // Delete Event
  deleteEvent(id) {
    let list = this.getEvents() || [];
    list = list.filter(item => item.id !== id);
    this.setData("events", list);
    return true;
  }

  // Manage Admins list in LocalStorage
  addUser(user) {
    const list = this.getUsers() || [];
    const newUser = {
      username: user.username.toLowerCase().trim(),
      password: user.password,
      name: user.name,
      role: user.role // 'Super Admin', 'Admin', 'Editor'
    };
    list.push(newUser);
    this.setData("users", list);
    return newUser;
  }

  deleteUser(username) {
    let list = this.getUsers() || [];
    list = list.filter(u => u.username.toLowerCase() !== username.toLowerCase().trim());
    this.setData("users", list);
    return true;
  }

  changeUserPassword(username, newPassword) {
    const list = this.getUsers() || [];
    const index = list.findIndex(u => u.username.toLowerCase() === username.toLowerCase().trim());
    if (index !== -1) {
      list[index].password = newPassword;
      this.setData("users", list);
      return true;
    }
    return false;
  }

  // Authentication & Simple Session System
  login(username, password) {
    const users = this.getUsers() || [];
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    if (user) {
      const session = {
        username: user.username,
        name: user.name,
        role: user.role,
        token: "session-" + Math.random().toString(36).substr(2) + "-" + Date.now()
      };
      sessionStorage.setItem("masjid_session", JSON.stringify(session));
      return { success: true, session };
    }
    return { success: false, message: "Invalid username or password" };
  }

  logout() {
    sessionStorage.removeItem("masjid_session");
  }

  getCurrentSession() {
    const session = sessionStorage.getItem("masjid_session");
    return session ? JSON.parse(session) : null;
  }

  isAuthenticated() {
    return this.getCurrentSession() !== null;
  }
}

// Instantiate and bind to global/module scope
const MasjidDB = new MasjidDatabase();

export default MasjidDB;
// Attach to window so non-module HTML scripts can access it easily if necessary
if (typeof window !== "undefined") {
  window.MasjidDB = MasjidDB;
}
