/**
 * Masjid Management Platform - Public Client Operations
 * Coordinates dynamic widgets, clocks, announcements, donation forms, 
 * search pipelines, and responsive animations.
 */

import MasjidDB from './db.js';

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Common Header/Footer Setup
  initMobileDrawer();
  initTicker();
  updateHeaderProfile();
  renderDynamicFooter();

  // Route-Specific Initializations
  const pathname = window.location.pathname;
  const pageName = pathname.substring(pathname.lastIndexOf("/") + 1);

  if (pageName === "" || pageName === "index.html") {
    initHomePage();
  } else if (pageName === "articles.html") {
    initArticlesPage();
  } else if (pageName === "gallery.html") {
    initGalleryPage();
  } else if (pageName === "donation.html") {
    initDonationPage();
  } else if (pageName === "contact.html") {
    initContactPage();
  } else if (pageName === "about.html") {
    initAboutPage();
  }

  // Global Toast Msg utility
  window.showToast = function(msg, isError = false) {
    let toast = document.getElementById("global-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "global-toast";
      toast.className = "toast-msg";
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    if (isError) {
      toast.style.borderLeftColor = "var(--danger)";
    } else {
      toast.style.borderLeftColor = "var(--secondary)";
    }
    toast.classList.add("show");
    
    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  };
});

// Mobile Drawer Trigger Handler (Glass-morphism slide)
function initMobileDrawer() {
  const toggleBtn = document.getElementById("mobile-toggle-btn");
  const drawer = document.getElementById("mobile-drawer-panel");
  const backdrop = document.getElementById("mobile-backdrop");
  const closeBtn = document.getElementById("mobile-close-btn");

  if (toggleBtn && drawer && backdrop) {
    const openDrawer = () => {
      drawer.classList.add("open");
      backdrop.classList.add("show");
    };

    const closeDrawer = () => {
      drawer.classList.remove("open");
      backdrop.classList.remove("show");
    };

    toggleBtn.addEventListener("click", openDrawer);
    backdrop.addEventListener("click", closeDrawer);
    if (closeBtn) {
      closeBtn.addEventListener("click", closeDrawer);
    }
  }
}

// Top ticker notification pull
function initTicker() {
  const tickerContainer = document.getElementById("ticker-announcement-content");
  if (tickerContainer) {
    const profile = MasjidDB.getProfile();
    if (profile && profile.announcementTicker) {
      tickerContainer.textContent = profile.announcementTicker;
    }
  }
}

// Synchronizes the user navigation state across desktop navbar, mobile sidebars, and footers
function updateHeaderProfile() {
  const authContainers = document.querySelectorAll("#auth-nav-indicator, .auth-nav-indicator");
  const session = MasjidDB.getCurrentSession();
  
  authContainers.forEach(container => {
    if (session) {
      container.innerHTML = `
        <a href="/admin-dashboard.html" class="nav-link text-success" id="nh-db" style="font-weight: 600;">
          <i data-lucide="layout-dashboard"></i>
          <span>Admin Portal</span>
        </a>
      `;
    } else {
      container.innerHTML = `
        <a href="/admin-login.html" class="nav-link text-warning" id="nh-login" style="font-weight: 600; color: var(--secondary-light);">
          <i data-lucide="settings"></i>
          <span>Admin Website</span>
        </a>
      `;
    }
  });

  // Dynamic injection inside Mobile slideout menu drawer
  const mobileNavLists = document.querySelectorAll(".mobile-nav-list");
  mobileNavLists.forEach(list => {
    let existingAdminItem = list.querySelector(".mobile-admin-item");
    if (!existingAdminItem) {
      existingAdminItem = document.createElement("li");
      existingAdminItem.className = "mobile-admin-item";
      
      // Inset right before the donate list item if possible
      const donateBtn = list.querySelector(".nav-btn-donate");
      if (donateBtn && donateBtn.parentElement) {
        list.insertBefore(existingAdminItem, donateBtn.parentElement);
      } else {
        list.appendChild(existingAdminItem);
      }
    }

    if (session) {
      existingAdminItem.innerHTML = `
        <a href="/admin-dashboard.html" class="nav-link text-success" style="font-weight: 600; display: flex; align-items: center; gap: 8px; padding: 10px 0;">
          <i data-lucide="layout-dashboard"></i>
          <span>Admin Portal</span>
        </a>
      `;
    } else {
      existingAdminItem.innerHTML = `
        <a href="/admin-login.html" class="nav-link text-warning" style="font-weight: 600; display: flex; align-items: center; gap: 8px; padding: 10px 0; color: var(--secondary-light);">
          <i data-lucide="settings"></i>
          <span>Admin Website</span>
        </a>
      `;
    }
  });

  // Dynamic injection in the page footers Navigation list
  const footerNavs = document.querySelectorAll(".footer-column ul");
  footerNavs.forEach(ul => {
    const hasHome = Array.from(ul.querySelectorAll("a")).some(a => {
      const href = a.getAttribute("href") || "";
      return href.includes("index.html") || a.textContent.includes("Home") || a.textContent.includes("About");
    });

    if (hasHome) {
      let existingFooterAdmin = ul.querySelector(".footer-admin-link");
      if (!existingFooterAdmin) {
        existingFooterAdmin = document.createElement("li");
        existingFooterAdmin.className = "footer-admin-link";
        ul.appendChild(existingFooterAdmin);
      }
      
      if (session) {
        existingFooterAdmin.innerHTML = `
          <a href="/admin-dashboard.html" style="color: var(--secondary-light); font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="layout-dashboard" style="width:14px; height:14px;"></i> Admin Dashboard
          </a>
        `;
      } else {
        existingFooterAdmin.innerHTML = `
          <a href="/admin-login.html" style="color: var(--secondary-light); font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <i data-lucide="settings" style="width:14px; height:14px;"></i> Admin Website
          </a>
        `;
      }
    }
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

/* ==========================================================================
   PAGE SPECIFIC CONTROLLERS
   ========================================================================== */

// 1. Home Page Dashboard Controls (Clock, Countdown active timings)
function initHomePage() {
  renderPrayerTimesWidget();
  renderPrayerTimesCards();
  renderAnnouncementsBento();
  renderUpcomingEvents();
  renderDynamicProfile();

  // Custom HomePage Articles, Gallery, and Live setup
  initHomepageArticles();
  initHomepageGallery();
  initHomepageLiveSection();

  // Update clock every minute
  setInterval(updateLiveClock, 1000);
  updateLiveClock();
}

function initHomepageArticles() {
  const container = document.getElementById("homepage-articles-container");
  const searchBar = document.getElementById("homepage-article-search");
  const categoryTabs = document.getElementById("homepage-article-category-tabs");

  let activeCategory = "All";
  let searchToken = "";

  const renderFiltered = () => {
    if (!container) return;
    const allArticles = MasjidDB.getArticles() || [];
    
    const filtered = allArticles.filter(art => {
      const matchCat = activeCategory === "All" || art.category.toLowerCase() === activeCategory.toLowerCase();
      const matchText = art.title.toLowerCase().includes(searchToken) || 
                        art.excerpt.toLowerCase().includes(searchToken) ||
                        art.content.toLowerCase().includes(searchToken);
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 40px 0; color: var(--text-muted);">
          <p style="font-size:16px;">No articles match your search parameters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(art => `
      <div class="article-card" style="display:flex; flex-direction:column; background:var(--white); border:1px solid var(--border-color); border-radius:12px; overflow:hidden; box-shadow:var(--shadow-sm); transition:var(--transition);" onmouseover="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-md)';this.style.borderColor='var(--secondary-light)';" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow-sm)';this.style.borderColor='var(--border-color)';">
        <div class="article-img-wrapper" style="position:relative; height:180px; overflow:hidden;">
          <img src="${art.imageUrl}" class="article-img" style="width:100%; height:100%; object-fit:cover; transition:var(--transition);" alt="${art.title}" loading="lazy" referrerPolicy="no-referrer">
          <span class="article-badge" style="position:absolute; top:12px; left:12px; background-color:var(--primary); color:var(--white); font-size:11px; font-weight:700; padding:4px 8px; border-radius:4px; text-transform:uppercase;">${art.category}</span>
        </div>
        <div class="article-info" style="padding:20px; flex-grow:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <div class="article-meta" style="font-size:12px; color:var(--text-muted); margin-bottom:8px; display:flex; gap:6px; flex-wrap:wrap;">
              <span>By <strong>${art.author}</strong></span>
              <span>•</span>
              <span>${new Date(art.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <h3 class="article-card-title" style="font-family:var(--font-serif); font-size:17px; color:var(--primary); font-weight:700; margin-bottom:10px; line-height:1.4;">${art.title}</h3>
            <p class="article-excerpt" style="font-size:13.5px; color:var(--text-muted); line-height:1.5; margin-bottom:16px;">${art.excerpt}</p>
          </div>
          <button class="btn btn-outline-primary btn-sm read-article-trigger" data-id="${art.id}" style="margin-top:auto; align-self:flex-start; font-size:12px;">
            Read Full Article <i data-lucide="arrow-right"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach click events for read full article modal
    document.querySelectorAll(".read-article-trigger").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openArticleModal(id);
      });
    });
  };

  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      searchToken = e.target.value.toLowerCase().trim();
      renderFiltered();
    });
  }

  if (categoryTabs) {
    categoryTabs.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        categoryTabs.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        activeCategory = e.currentTarget.getAttribute("data-category");
        renderFiltered();
      });
    });
  }

  renderFiltered();
}

function initHomepageGallery() {
  const container = document.getElementById("homepage-gallery-grid");
  const categoryTabs = document.getElementById("homepage-gallery-category-tabs");

  let activeCategory = "All";

  const renderGallery = () => {
    if (!container) return;
    const items = MasjidDB.getGallery() || [];

    const filtered = items.filter(itm => {
      return activeCategory === "All" || itm.category.toLowerCase() === activeCategory.toLowerCase();
    });

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1;">No records found.</p>`;
      return;
    }

    // Limit homepage display to top 6 items
    const slice = filtered.slice(0, 6);

    container.innerHTML = slice.map(itm => `
      <div class="gallery-item select-homepage-gallery-media" data-id="${itm.id}">
        <div class="gallery-media">
          ${itm.type === 'photo' 
            ? `<img src="${itm.url}" class="gallery-img" alt="${itm.title}">`
            : `<img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" class="gallery-img" style="filter: brightness(0.6);" alt="${itm.title}">
               <div class="gallery-play-btn"><i data-lucide="play"></i></div>`
          }
        </div>
        <h4 class="gallery-heading">${itm.title} <span style="font-size:11px; font-weight:500; color:var(--text-muted); float:right;">(${itm.type})</span></h4>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Click handler for homepage lightbox placement
    document.querySelectorAll(".select-homepage-gallery-media").forEach(el => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openLightbox(id);
      });
    });
  };

  if (categoryTabs) {
    categoryTabs.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        categoryTabs.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        activeCategory = e.currentTarget.getAttribute("data-category");
        renderGallery();
      });
    });
  }

  renderGallery();
}

function initHomepageLiveSection() {
  // 1. Render Video Lectures Grid
  const recGrid = document.getElementById("homepage-videos-grid");
  if (recGrid) {
    const list = MasjidDB.getPreviousBroadcasts() || [];
    if (list.length === 0) {
      recGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 40px 0; color: var(--text-muted);">
          <p style="font-size:16px;">No video lectures published yet. Check back soon!</p>
        </div>
      `;
    } else {
      recGrid.innerHTML = list.map(rec => {
        const thumb = rec.thumbnail || `https://img.youtube.com/vi/${rec.youtubeId}/mqdefault.jpg`;
        return `
          <div class="interactive-video-card" style="background:var(--white); border: 1px solid var(--border-color); border-radius:12px; overflow:hidden; box-shadow:var(--shadow-sm); transition: var(--transition);" onmouseover="this.style.borderColor='var(--secondary-light)';this.style.transform='translateY(-2px)';" onmouseout="this.style.borderColor='var(--border-color)';this.style.transform='none';">
            <div style="position:relative; padding-bottom:56.25%; height:0; background:#000; cursor:pointer;" class="video-play-trigger" data-ytid="${rec.youtubeId}" data-title="${rec.title}" data-speaker="${rec.speaker || 'Sheikh Al-Azhari'}" data-desc="${rec.description || ''}">
              <img src="${thumb}" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;" alt="${rec.title}" loading="lazy" referrerPolicy="no-referrer">
              <div style="position:absolute; inset:0; background:rgba(0,0,0,0.35); display:flex; align-items:center; justify-content:center;">
                <span style="width:48px; height:48px; background:rgba(255,255,255,0.9); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--primary); transition:all 0.2s;" class="play-btn-circle">
                  <i data-lucide="play" style="width:20px; height:20px; margin-left:3px; fill:var(--primary); color:var(--primary);"></i>
                </span>
              </div>
              <div style="position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,0.85); color:#fff; padding:3px 6px; border-radius:4px; font-size:11px; font-weight:700;">
                ${rec.duration || '35:00'}
              </div>
            </div>
            <div style="padding:18.5px;">
              <span style="color:var(--text-muted); font-size:11px; font-weight:700; text-transform:uppercase;">Lecture — ${rec.date}</span>
              <h4 style="font-family:var(--font-heading); font-size:16px; color:var(--primary); font-weight:700; margin:5px 0 6px;">${rec.title}</h4>
              <p style="font-size:12.5px; color:var(--text-muted); font-weight:500; margin-bottom:12px;">By <strong>${rec.speaker || 'Sheikh Al-Azhari'}</strong></p>
              <p style="font-size:13px; color:var(--text-muted); line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:0;">${rec.description || ''}</p>
            </div>
          </div>
        `;
      }).join('');
    }
    if (window.lucide) window.lucide.createIcons();

    // Attach play clicked events for lightbox modal popup
    document.querySelectorAll(".video-play-trigger").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const ytid = e.currentTarget.getAttribute("data-ytid");
        const title = e.currentTarget.getAttribute("data-title");
        const speaker = e.currentTarget.getAttribute("data-speaker");
        const desc = e.currentTarget.getAttribute("data-desc");

        const lightbox = document.getElementById("homepage-video-lightbox");
        const iframe = document.getElementById("lightbox-video-iframe");
        const ltitle = document.getElementById("lightbox-video-title");
        const lspeaker = document.getElementById("lightbox-video-speaker");
        const ldesc = document.getElementById("lightbox-video-desc");

        if (lightbox && iframe) {
          iframe.src = `https://www.youtube.com/embed/${ytid}?autoplay=1`;
          if (ltitle) ltitle.textContent = title;
          if (lspeaker) lspeaker.textContent = `Speaker: ${speaker}`;
          if (ldesc) ldesc.textContent = desc;
          lightbox.style.display = "flex";
          lightbox.classList.add("active");
        }
      });
    });

    const closeLightbox = () => {
      const lightbox = document.getElementById("homepage-video-lightbox");
      const iframe = document.getElementById("lightbox-video-iframe");
      if (lightbox && iframe) {
        iframe.src = ""; // stop playing
        lightbox.style.display = "none";
        lightbox.classList.remove("active");
      }
    };

    const closeBtn = document.getElementById("lightbox-close-btn");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);

    const lightboxOverlay = document.getElementById("homepage-video-lightbox");
    if (lightboxOverlay) {
      lightboxOverlay.addEventListener("click", (e) => {
        if (e.target === lightboxOverlay) closeLightbox();
      });
    }
  }

  // 2. Donation preset buttons & submit quick desk
  const presetBtns = document.querySelectorAll(".preset-donate-btn");
  const customInput = document.getElementById("home-donation-amount-custom");
  const donationForm = document.getElementById("home-donation-quick-form");

  presetBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      presetBtns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "none";
        b.style.color = "#fff";
      });
      e.currentTarget.classList.add("active");
      e.currentTarget.style.background = "var(--secondary-light)";
      e.currentTarget.style.color = "var(--primary)";
      
      const amt = e.currentTarget.getAttribute("data-amount");
      if (customInput) customInput.value = amt;
    });
  });

  if (customInput) {
    customInput.addEventListener("input", () => {
      presetBtns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "none";
        b.style.color = "#fff";
      });
    });
  }

  if (donationForm) {
    donationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("home-donation-name").value.trim();
      const category = document.getElementById("home-donation-category").value;
      const amount = parseFloat(customInput ? customInput.value : 0) || 0;

      if (amount <= 0) {
        window.showToast("Please enter a valid donation value greater than zero.", true);
        return;
      }

      // Log financial ledger transaction dynamically
      MasjidDB.addFinancialRecord({
        amount: amount,
        type: "income",
        category: category === "Zakat Al-Maal" ? "Zakat" : "Sadaqah",
        description: `Home Quick Donation from ${name || "Anonymous donor"} for ${category}`,
        date: new Date().toISOString().split('T')[0],
        editor: "Homepage Quick Terminal"
      });

      donationForm.reset();
      presetBtns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "none";
        b.style.color = "#fff";
      });
      // Active default $100 preset
      const defaultPreset = document.querySelector('.preset-donate-btn[data-amount="100"]');
      if (defaultPreset) {
        defaultPreset.classList.add("active");
        defaultPreset.style.background = "var(--secondary-light)";
        defaultPreset.style.color = "var(--primary)";
      }
      if (customInput) customInput.value = 100;

      showThankYouPopup(name || "Kind Donor", amount, category);
    });
  }

  // 3. Quick Message office desk
  const contactForm = document.getElementById("home-contact-quick-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("quick-contact-name").value.trim();
      const email = document.getElementById("quick-contact-email").value.trim();
      const subject = document.getElementById("quick-contact-subject").value;
      const msg = document.getElementById("quick-contact-message").value.trim();

      if (!name || !msg) {
        window.showToast("Please supply your name and message.", true);
        return;
      }

      // Save user feedback into LocalStorage queries
      const queries = JSON.parse(localStorage.getItem("masjid_user_queries") || "[]");
      queries.push({
        id: "query-" + Date.now(),
        name,
        email,
        subject,
        message: msg,
        date: new Date().toISOString()
      });
      localStorage.setItem("masjid_user_queries", JSON.stringify(queries));

      contactForm.reset();
      window.showToast("Message sent successfully! Our Mosque administrators have logged your feedback.");
    });
  }
}

function updateLiveClock() {
  const clockEl = document.getElementById("live-time-display");
  const dateEl = document.getElementById("live-gregorian-date");
  const hijriEl = document.getElementById("live-hijri-date");

  if (clockEl) {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    if (hijriEl) {
      // Manual approx Hijri dating for authentic Islamic aesthetic representation (1447 AH)
      hijriEl.textContent = "DHUL-HIJJAH 3, 1447 AH";
    }
  }
}

function renderPrayerTimesWidget() {
  const times = MasjidDB.getPrayerTimes();
  const listRows = document.getElementById("widget-prayer-list");
  if (listRows && times) {
    listRows.innerHTML = `
      <div class="widget-row" id="wr-fajr">
        <span class="widget-name">Fajr</span>
        <span class="widget-val">${times.fajr.iqamah}<span>Athan ${times.fajr.athan}</span></span>
      </div>
      <div class="widget-row" id="wr-zohar">
        <span class="widget-name">Dhuhr</span>
        <span class="widget-val">${times.zuhar.iqamah}<span>Athan ${times.zuhar.athan}</span></span>
      </div>
      <div class="widget-row" id="wr-asr">
        <span class="widget-name">Asr</span>
        <span class="widget-val">${times.asr.iqamah}<span>Athan ${times.asr.athan}</span></span>
      </div>
      <div class="widget-row" id="wr-maghrib">
        <span class="widget-name">Maghrib</span>
        <span class="widget-val">${times.maghrib.iqamah}<span>Athan ${times.maghrib.athan}</span></span>
      </div>
      <div class="widget-row" id="wr-isha">
        <span class="widget-name">Isha</span>
        <span class="widget-val">${times.isha.iqamah}<span>Athan ${times.isha.athan}</span></span>
      </div>
      <div class="widget-row" id="wr-jumma1">
        <span class="widget-name">Friday Jumma 1</span>
        <span class="widget-val">${times.jumma1.iqamah}<span>Khitbah ${times.jumma1.athan}</span></span>
      </div>
    `;

    highlightActivePrayerRow(times);
  }
}

function renderPrayerTimesCards() {
  const times = MasjidDB.getPrayerTimes();
  const container = document.getElementById("prayer-cards-section-grid");
  if (container && times) {
    container.innerHTML = `
      <div class="prayer-card" id="card-fajr">
        <div class="prayer-card-icon"><i data-lucide="sunrise"></i></div>
        <h3 class="prayer-label">Fajr</h3>
        <p class="prayer-time-val">${times.fajr.athan}</p>
        <div class="prayer-time-iqamah">Iqamah: ${times.fajr.iqamah}</div>
      </div>
      <div class="prayer-card" id="card-dhuhr">
        <div class="prayer-card-icon"><i data-lucide="sun"></i></div>
        <h3 class="prayer-label">Dhuhr</h3>
        <p class="prayer-time-val">${times.zuhar.athan}</p>
        <div class="prayer-time-iqamah">Iqamah: ${times.zuhar.iqamah}</div>
      </div>
      <div class="prayer-card" id="card-asr">
        <div class="prayer-card-icon"><i data-lucide="sun-dim"></i></div>
        <h3 class="prayer-label">Asr</h3>
        <p class="prayer-time-val">${times.asr.athan}</p>
        <div class="prayer-time-iqamah">Iqamah: ${times.asr.iqamah}</div>
      </div>
      <div class="prayer-card" id="card-maghrib">
        <div class="prayer-card-icon"><i data-lucide="sunset"></i></div>
        <h3 class="prayer-label">Maghrib</h3>
        <p class="prayer-time-val">${times.maghrib.athan}</p>
        <div class="prayer-time-iqamah">Iqamah: ${times.maghrib.iqamah}</div>
      </div>
      <div class="prayer-card" id="card-isha">
        <div class="prayer-card-icon"><i data-lucide="moon"></i></div>
        <h3 class="prayer-label">Isha</h3>
        <p class="prayer-time-val">${times.isha.athan}</p>
        <div class="prayer-time-iqamah">Iqamah: ${times.isha.iqamah}</div>
      </div>
    `;

    // Highlighting current/incoming cards
    highlightActivePrayerCard(times);
    if (window.lucide) window.lucide.createIcons();
  }
}

function parseTimeToDate(timeString) {
  const parts = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!parts) return new Date();
  let hours = parseInt(parts[1], 10);
  const minutes = parseInt(parts[2], 10);
  const ampm = parts[3].toUpperCase();

  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function highlightActivePrayerRow(times) {
  const current = new Date();
  const fajr = parseTimeToDate(times.fajr.iqamah);
  const zuhar = parseTimeToDate(times.zuhar.iqamah);
  const asr = parseTimeToDate(times.asr.iqamah);
  const maghrib = parseTimeToDate(times.maghrib.iqamah);
  const isha = parseTimeToDate(times.isha.iqamah);

  let activeId = "wr-isha"; // Default to Isha if it's late at night

  if (current >= fajr && current < zuhar) {
    activeId = "wr-fajr";
  } else if (current >= zuhar && current < asr) {
    activeId = "wr-zohar";
  } else if (current >= asr && current < maghrib) {
    activeId = "wr-asr";
  } else if (current >= maghrib && current < isha) {
    activeId = "wr-maghrib";
  } else if (current >= isha || current < fajr) {
    activeId = "wr-isha";
  }

  const activeRow = document.getElementById(activeId);
  if (activeRow) {
    activeRow.classList.add("active");
  }
}

function highlightActivePrayerCard(times) {
  const current = new Date();
  const fajr = parseTimeToDate(times.fajr.athan);
  const zuhar = parseTimeToDate(times.zuhar.athan);
  const asr = parseTimeToDate(times.asr.athan);
  const maghrib = parseTimeToDate(times.maghrib.athan);
  const isha = parseTimeToDate(times.isha.athan);

  let activeCardId = "card-isha";

  if (current >= fajr && current < zuhar) {
    activeCardId = "card-fajr";
  } else if (current >= zuhar && current < asr) {
    activeCardId = "card-dhuhr";
  } else if (current >= asr && current < maghrib) {
    activeCardId = "card-asr";
  } else if (current >= maghrib && current < isha) {
    activeCardId = "card-maghrib";
  } else if (current >= isha || current < fajr) {
    activeCardId = "card-isha";
  }

  const activeCard = document.getElementById(activeCardId);
  if (activeCard) {
    activeCard.classList.add("active");
  }
}

function renderAnnouncementsBento() {
  const container = document.getElementById("homepage-announcements-list");
  if (container) {
    const list = MasjidDB.getAnnouncements() || [];
    if (list.length === 0) {
      container.innerHTML = `<p class="text-muted">No announcements listed at this time.</p>`;
      return;
    }

    container.innerHTML = list.map(item => `
      <div style="background-color: var(--bg-light); border: 1px solid var(--border-color); border-radius:8px; padding: 20px; transition: var(--transition);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
          <span style="background-color: var(--primary-glow); color: var(--primary); font-size:11px; font-weight:700; padding:4px 8px; border-radius:4px; text-transform:uppercase;">${item.category}</span>
          <span style="font-size:12px; color: var(--text-muted); font-weight:500;">${new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <h4 style="font-family: var(--font-heading); color: var(--primary); font-weight:700; font-size:16px; margin-bottom: 8px;">
          ${item.important ? '<span style="color: var(--danger); margin-right: 4px;">⚠️</span>' : ''}${item.title}
        </h4>
        <p style="font-size: 14px; color: var(--text-muted); line-height:1.5;">${item.content}</p>
      </div>
    `).join('<div style="height: 15px;"></div>');
  }
}

function renderUpcomingEvents() {
  const container = document.getElementById("homepage-upcoming-events-grid");
  if (container) {
    const events = MasjidDB.getEvents() || [];
    if (events.length === 0) {
      container.innerHTML = `<p class="text-muted text-center" style="grid-column: 1/-1;">No community events scheduled at the moment.</p>`;
      return;
    }

    container.innerHTML = events.slice(0, 3).map(evt => `
      <div style="background:var(--white); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; box-shadow: var(--shadow-sm); display:flex; flex-direction:column; justify-content:space-between; transition:var(--transition);" onmouseover="this.style.borderColor='var(--primary-light)'" onmouseout="this.style.borderColor='var(--border-color)'">
        <div>
          <div style="background-color: var(--secondary-glow); border: 1px dashed var(--secondary-light); border-radius: 8px; padding: 8px 12px; text-align:center; font-family:var(--font-heading); font-weight:700; font-size:14px; color: var(--primary); margin-bottom:16px;">
            📅 ${new Date(evt.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <h4 style="font-family:var(--font-serif); font-size:18px; color: var(--primary); font-weight:700; margin-bottom:8px; line-height:1.3;">${evt.title}</h4>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px; display:flex; gap:6px; align-items:center;">
             <span>📍 ${evt.location}</span>
          </p>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:12px; display:flex; gap:6px; align-items:center;">
             <span>🗣️ Guest: <strong>${evt.speaker}</strong></span>
          </p>
          <p style="font-size:14px; color:var(--text-muted); line-height:1.5; margin-bottom:20px;">${evt.description}</p>
        </div>
        <div style="font-size: 13px; font-weight: 600; color:var(--secondary); text-align:right;">
          ⏰ ${evt.time}
        </div>
      </div>
    `).join('');
  }
}

function renderDynamicProfile() {
  const titleEl = document.getElementById("homepage-masjid-title");
  const subEl = document.getElementById("homepage-masjid-sub");
  const bannerName = document.getElementById("banner-masjid-name");

  const profile = MasjidDB.getProfile();
  if (profile) {
    if (titleEl) titleEl.textContent = profile.name;
    if (subEl) subEl.textContent = `Serving the community since ${profile.established}`;
    if (bannerName) bannerName.textContent = profile.shortName;
  }
}

// 2. About Page Controls
function initAboutPage() {
  const profile = MasjidDB.getProfile();
  if (profile) {
    const listDetails = document.getElementById("about-masjid-details-card");
    if (listDetails) {
      listDetails.innerHTML = `
        <div class="bank-row">
          <span class="bank-label">Address</span>
          <span class="bank-value" style="color: var(--white);">${profile.address}</span>
        </div>
        <div class="bank-row">
          <span class="bank-label">Contact Phone</span>
          <span class="bank-value" style="color: var(--white);">${profile.phone}</span>
        </div>
        <div class="bank-row">
          <span class="bank-label">Official Email</span>
          <span class="bank-value" style="color: var(--white);">${profile.email}</span>
        </div>
        <div class="bank-row">
          <span class="bank-label">Resident Imam</span>
          <span class="bank-value" style="color: var(--white);">${profile.imam}</span>
        </div>
        <div class="bank-row">
          <span class="bank-label">Official Muezzin</span>
          <span class="bank-value" style="color: var(--white);">${profile.muezzin}</span>
        </div>
      `;
    }
  }
}


// 4. Islamic Articles Controller (Search framework)
function initArticlesPage() {
  const container = document.getElementById("articles-main-cards-grid");
  const searchBar = document.getElementById("article-search-bar");
  const categoryTabs = document.getElementById("article-category-tabs");

  let activeCategory = "All";
  let searchToken = "";

  const renderFiltered = () => {
    if (!container) return;
    const allArticles = MasjidDB.getArticles() || [];
    
    const filtered = allArticles.filter(art => {
      const matchCat = activeCategory === "All" || art.category.toLowerCase() === activeCategory.toLowerCase();
      const matchText = art.title.toLowerCase().includes(searchToken) || 
                        art.excerpt.toLowerCase().includes(searchToken) ||
                        art.content.toLowerCase().includes(searchToken);
      return matchCat && matchText;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 40px 0; color: var(--text-muted);">
          <p style="font-size:16px;">No articles match your search parameters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(art => `
      <div class="article-card">
        <div class="article-img-wrapper">
          <img src="${art.imageUrl}" class="article-img" alt="${art.title}" loading="lazy" referrerPolicy="no-referrer">
          <span class="article-badge">${art.category}</span>
        </div>
        <div class="article-info">
          <div class="article-meta">
            <span>By <strong>${art.author}</strong></span>
            <span>•</span>
            <span>${new Date(art.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <h3 class="article-card-title">${art.title}</h3>
          <p class="article-excerpt">${art.excerpt}</p>
          <button class="btn btn-outline-primary btn-sm read-article-trigger" data-id="${art.id}" style="margin-top:auto; align-self:flex-start;">
            Read Full Article <i data-lucide="arrow-right"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach click events for read full article modal
    document.querySelectorAll(".read-article-trigger").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openArticleModal(id);
      });
    });
  };

  // Setup Search Listeners
  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      searchToken = e.target.value.toLowerCase().trim();
      renderFiltered();
    });
  }

  // Setup Category clickers
  if (categoryTabs) {
    categoryTabs.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        categoryTabs.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        activeCategory = e.currentTarget.getAttribute("data-category");
        renderFiltered();
      });
    });
  }

  // First seed
  renderFiltered();
}

function openArticleModal(id) {
  const articles = MasjidDB.getArticles() || [];
  const art = articles.find(a => a.id === id);
  if (!art) return;

  let modal = document.getElementById("article-viewer-dialog");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "article-viewer-dialog";
    modal.className = "dialog-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="dialog-box" style="max-width: 720px; overflow-y: auto; max-height:90vh;">
      <div class="dialog-header">
        <h3 style="font-family:var(--font-serif); font-size:18px;">${art.title}</h3>
        <button class="dialog-close" id="article-viewer-close"><i data-lucide="x"></i></button>
      </div>
      <div style="position:relative; height: 260px; background-color:#112;">
        <img src="${art.imageUrl}" style="width:100%; height:100%; object-fit:cover;" alt="${art.title}">
        <span class="article-badge" style="bottom: 16px; top:auto;">${art.category}</span>
      </div>
      <div class="dialog-body" style="padding:30px;">
        <div class="article-meta" style="margin-bottom:20px;">
          <span>By <strong>${art.author}</strong></span>
          <span>•</span>
          <span>${new Date(art.date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
        <div class="markdown-body" style="font-size:15px; color-contrast:4.5; line-height:1.7;">
          ${art.content}
        </div>
      </div>
      <div class="dialog-footer">
        <button class="btn btn-secondary btn-sm" id="article-viewer-btn-ok">Close</button>
      </div>
    </div>
  `;

  modal.classList.add("show");
  modal.style.display = "flex";
  if (window.lucide) window.lucide.createIcons();

  const closeModal = () => {
    modal.classList.remove("show");
    modal.style.display = "none";
  };

  document.getElementById("article-viewer-close").addEventListener("click", closeModal);
  document.getElementById("article-viewer-btn-ok").addEventListener("click", closeModal);
}

// 5. Gallery Lightbox Engine (Photos and Videos filters)
function initGalleryPage() {
  const container = document.getElementById("gallery-main-cards-grid");
  const categoryTabs = document.getElementById("gallery-category-tabs");

  let activeCategory = "All";

  const renderGallery = () => {
    if (!container) return;
    const items = MasjidDB.getGallery() || [];

    const filtered = items.filter(itm => {
      return activeCategory === "All" || itm.category.toLowerCase() === activeCategory.toLowerCase();
    });

    if (filtered.length === 0) {
      container.innerHTML = `<p class="text-muted text-center" style="grid-column:1/-1;">No records found.</p>`;
      return;
    }

    container.innerHTML = filtered.map(itm => `
      <div class="gallery-item select-gallery-media" data-id="${itm.id}">
        <div class="gallery-media">
          ${itm.type === 'photo' 
            ? `<img src="${itm.url}" class="gallery-img" alt="${itm.title}">`
            : `<img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800" class="gallery-img" style="filter: brightness(0.6);" alt="${itm.title}">
               <div class="gallery-play-btn"><i data-lucide="play"></i></div>`
          }
        </div>
        <h4 class="gallery-heading">${itm.title} <span style="font-size:11px; font-weight:500; color:var(--text-muted); float:right;">(${itm.type})</span></h4>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Click handler for lightbox placement
    document.querySelectorAll(".select-gallery-media").forEach(el => {
      el.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openLightbox(id);
      });
    });
  };

  if (categoryTabs) {
    categoryTabs.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        categoryTabs.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        activeCategory = e.currentTarget.getAttribute("data-category");
        renderGallery();
      });
    });
  }

  // Initial render
  renderGallery();
}

function openLightbox(id) {
  const items = MasjidDB.getGallery() || [];
  const item = items.find(i => i.id === id);
  if (!item) return;

  let lightbox = document.getElementById("gallery-lightbox");
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.id = "gallery-lightbox";
    lightbox.className = "lightbox";
    document.body.appendChild(lightbox);
  }

  lightbox.innerHTML = `
    <div class="lightbox-content">
      <button class="lightbox-close" id="lightbox-close-trigger">&times;</button>
      ${item.type === 'photo'
        ? `<img src="${item.url}" class="lightbox-img" alt="${item.title}">`
        : `<div class="lightbox-video-wrapper">
             <iframe src="${item.url}" allowfullscreen></iframe>
           </div>`
      }
      <p class="lightbox-caption">${item.title}</p>
    </div>
  `;

  lightbox.classList.add("active");

  const closeLightbox = () => {
    lightbox.classList.remove("active");
  };

  document.getElementById("lightbox-close-trigger").addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
}

// 6. Donation Forms Controller
function initDonationPage() {
  const presetBtns = document.querySelectorAll(".preset-btn");
  const customInput = document.getElementById("donation-amount-custom");
  const donationForm = document.getElementById("checkout-donation-form");
  const selectFund = document.getElementById("donation-fund-select");

  if (presetBtns) {
    presetBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        presetBtns.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        if (customInput) {
          customInput.value = e.currentTarget.value;
        }
      });
    });
  }

  if (customInput) {
    customInput.addEventListener("input", () => {
      presetBtns.forEach(b => b.classList.remove("active"));
    });
  }

  if (donationForm) {
    donationForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("donate-name").value.trim();
      const email = document.getElementById("donate-email").value.trim();
      const amount = parseFloat(customInput ? customInput.value : 0) || 0;
      const fund = selectFund ? selectFund.value : "General Sadaqah";

      if (amount <= 0) {
        window.showToast("Please enter a valid donation value greater than zero.", true);
        return;
      }

      // Log financial ledger transaction in local database dynamically!
      MasjidDB.addFinancialRecord({
        amount: amount,
        type: "income",
        category: fund === "Zakat Al-Maal" ? "Zakat" : "Sadaqah",
        description: `Direct Online Donation from ${name || "Anonymous"} (${email || "no-email"})`,
        date: new Date().toISOString().split('T')[0],
        editor: "Online Kiosk Gate"
      });

      // Clear Form Details
      donationForm.reset();
      presetBtns.forEach(b => b.classList.remove("active"));

      // Show Majestic Visual Thank You Modal
      showThankYouPopup(name || "Kind Donor", amount, fund);
    });
  }
}

function showThankYouPopup(donorName, amount, fund) {
  let popupOverlay = document.getElementById("thankyou-popup");
  if (!popupOverlay) {
    popupOverlay = document.createElement("div");
    popupOverlay.id = "thankyou-popup";
    popupOverlay.className = "popup-overlay";
    document.body.appendChild(popupOverlay);
  }

  popupOverlay.innerHTML = `
    <div class="popup-box">
      <button class="popup-close" id="popup-thankyou-close"><i data-lucide="x"></i></button>
      <div class="popup-icon">
        <i data-lucide="heart" style="width:32px; height:32px; fill:var(--success);"></i>
      </div>
      <h2 class="popup-title">Jazak'Allah Khair</h2>
      <p style="font-size:15px; color:var(--text-muted); line-height:1.6; margin-bottom:20px;">
        Dear <b>${donorName}</b>, thank you immensely for your generous contribution of <b>$${amount.toFixed(2)}</b> towards the <b>${fund}</b> fund.
      </p>
      <p style="font-size:13px; color:var(--primary); font-style:italic; line-height:1.6; margin-bottom:24px; background-color:var(--primary-glow); padding:10px 14px; border-radius:6px;">
        "The example of those who spend their wealth in the way of Allah is like a seed [of grain] which grows seven spikes; in each spike is a hundred grains." <br>— Surah Al-Baqarah [2:261]
      </p>
      <button class="btn btn-primary" id="popup-thankyou-btn-close">Close</button>
    </div>
  `;

  popupOverlay.classList.add("active");
  if (window.lucide) window.lucide.createIcons();

  const closePopup = () => {
    popupOverlay.classList.remove("active");
  };

  document.getElementById("popup-thankyou-close").addEventListener("click", closePopup);
  document.getElementById("popup-thankyou-btn-close").addEventListener("click", closePopup);
}

// 7. Contact Forms & Map Integration
function initContactPage() {
  const form = document.getElementById("contact-feedback-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = document.getElementById("contact-name").value.trim();
      const msg = document.getElementById("contact-message").value.trim();

      if (!name || !msg) {
        window.showToast("Please complete required contact details.", true);
        return;
      }

      // Save user feedback into LocalStorage queries
      const queries = JSON.parse(localStorage.getItem("masjid_user_queries") || "[]");
      queries.push({
        id: "query-" + Date.now(),
        name,
        email: document.getElementById("contact-email").value.trim(),
        subject: document.getElementById("contact-subject").value.trim(),
        message: msg,
        date: new Date().toISOString()
      });
      localStorage.setItem("masjid_user_queries", JSON.stringify(queries));

      form.reset();
      window.showToast("Thank you for contacting us. Our administration will get back to you shortly.");
    });
  }
}

// Global dynamic footer renderer with 8 core support connections matching admin settings
function renderDynamicFooter() {
  const footerEl = document.querySelector("footer.footer");
  if (!footerEl) return;

  const profile = MasjidDB.getProfile() || {};
  const times = MasjidDB.getPrayerTimes() || {};
  const links = MasjidDB.getFooterLinks() || {};

  footerEl.innerHTML = `
    <div class="container footer-top" style="display: grid; grid-template-columns: 1.5fr repeat(3, 1fr); gap: 40px; margin-bottom: 40px;">
      <!-- Column 1: Masjid Logo & About -->
      <div class="footer-column" id="footer-about-col">
        <h4 style="font-family: var(--font-serif); color: var(--secondary-light); margin-bottom: 12px; font-size:22px;">${profile.name || 'Al-Noor Masjid'}</h4>
        <p style="margin-bottom: 15px; color: rgba(255,255,255,0.75); line-height:1.7;">A cornerstone of spiritual education, congregational worship, and benevolent community charity. Dedicated to fostering mutual trust, knowledge, and service.</p>
        <span style="font-size:11px; color: var(--secondary-light); font-weight:600; display:block; margin-bottom:8px;">${profile.established || 'Established 1412 AH (1992 CE)'}</span>
      </div>
      
      <!-- Column 2: Quick Links -->
      <div class="footer-column" id="footer-links-col">
        <h4>Navigation</h4>
        <ul style="list-style: none; padding: 0;">
          <li><a href="/index.html">Home</a></li>
          <li><a href="/about.html">About Masjid</a></li>
          <li><a href="/articles.html">Islamic Library</a></li>
          <li><a href="/gallery.html">Photo Gallery</a></li>
          <li><a href="/donation.html">Help Donation</a></li>
          <li><a href="/contact.html">Contact Us</a></li>
          <li class="footer-admin-link"></li>
        </ul>
      </div>

      <!-- Column 3: Prayer Timing Short Info -->
      <div class="footer-column" id="footer-timings-col">
        <h4>Prayer Schedule</h4>
        <p style="font-size:12px; color: rgba(255,255,255,0.6); margin-bottom:12px; line-height: 1.4;">Daily Iqamah times currently observed at the Masjid:</p>
        <ul style="list-style: none; padding: 0; font-size: 13px;">
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 5px 0;">
            <span style="color: rgba(255,255,255,0.7);">🌅 Fajr</span>
            <strong style="color: var(--secondary-light); font-family: var(--font-mono);">${times.fajr ? times.fajr.iqamah : '05:00 AM'}</strong>
          </li>
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 5px 0;">
            <span style="color: rgba(255,255,255,0.7);">☀️ Dhuhr</span>
            <strong style="color: var(--secondary-light); font-family: var(--font-mono);">${times.zuhar ? times.zuhar.iqamah : '01:15 PM'}</strong>
          </li>
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 5px 0;">
            <span style="color: rgba(255,255,255,0.7);">⛅ Asr</span>
            <strong style="color: var(--secondary-light); font-family: var(--font-mono);">${times.asr ? times.asr.iqamah : '05:00 PM'}</strong>
          </li>
          <li style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.08); padding: 5px 0;">
            <span style="color: rgba(255,255,255,0.7);">🌙 Maghrib</span>
            <strong style="color: var(--secondary-light); font-family: var(--font-mono);">${times.maghrib ? times.maghrib.iqamah : '06:40 PM'}</strong>
          </li>
          <li style="display: flex; justify-content: space-between; padding: 5px 0;">
            <span style="color: rgba(255,255,255,0.7);">🌃 Isha</span>
            <strong style="color: var(--secondary-light); font-family: var(--font-mono);">${times.isha ? times.isha.iqamah : '08:30 PM'}</strong>
          </li>
        </ul>
      </div>

      <!-- Column 4: Support & Connect -->
      <div class="footer-column" id="footer-support-col">
        <h4>Support & Connect</h4>
        <div class="support-connect-container" style="display: flex; flex-direction: column; gap: 12px;">
          <div id="footer-social-links-grid-mount">
            <!-- Dynamically populated below -->
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 5px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 10px;">
            <!-- Email -->
            <a href="mailto:${links.email}" class="support-item-contact" style="display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.75); text-decoration: none; font-size: 13px; font-weight: 500;">
              <span style="background: rgba(255,255,255,0.08); color: var(--secondary-light); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease;"><i data-lucide="mail" style="width:12px; height:12px;"></i></span>
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${links.email}</span>
            </a>
            
            <!-- Phone -->
            <a href="tel:${links.phone ? links.phone.replace(/[^+\d]/g, '') : ''}" class="support-item-contact" style="display: flex; align-items: center; gap: 10px; color: rgba(255,255,255,0.75); text-decoration: none; font-size: 13px; font-weight: 500;">
              <span style="background: rgba(255,255,255,0.08); color: var(--secondary-light); width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all 0.2s ease;"><i data-lucide="phone" style="width:12px; height:12px;"></i></span>
              <span>${links.phone}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom" style="text-align: center; padding-top: 30px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 12px; color: rgba(255, 255, 255, 0.45); margin-top: 20px;">
      <p>&copy; 2026 ${profile.name || 'Al-Noor Grand Masjid & Islamic Center'}. All rights reserved. Managed with balanced Quran and Sunnah principles.</p>
    </div>
  `;

  // Apply footer-admin-link dynamically inside footer
  const ul = footerEl.querySelector("#footer-links-col ul");
  if (ul) {
    const session = MasjidDB.getCurrentSession();
    let existingFooterAdmin = ul.querySelector(".footer-admin-link");
    if (!existingFooterAdmin) {
      existingFooterAdmin = document.createElement("li");
      existingFooterAdmin.className = "footer-admin-link";
      ul.appendChild(existingFooterAdmin);
    }
    if (session) {
      existingFooterAdmin.innerHTML = `
        <a href="/admin-dashboard.html" style="color: var(--secondary-light); font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="layout-dashboard" style="width:14px; height:14px;"></i> Admin Dashboard
        </a>
      `;
    } else {
      existingFooterAdmin.innerHTML = `
        <a href="/admin-login.html" style="color: var(--secondary-light); font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="settings" style="width:14px; height:14px;"></i> Admin Website
        </a>
      `;
    }
  }

  // Mount Dynamic Social Platforms loop configured in Admin Media Panel
  const dynamicMount = footerEl.querySelector("#footer-social-links-grid-mount");
  if (dynamicMount) {
    const list = MasjidDB.getData("social_platforms") || [];
    if (list.length > 0) {
      dynamicMount.outerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;" class="support-links-grid">
          ${list.map(item => {
            const platformClass = item.platform.toLowerCase();
            let brandColor = "#b8860b";
            let defaultIcon = "share-2";
            if (platformClass === "youtube") { brandColor = "#ef4444"; defaultIcon = "youtube"; }
            else if (platformClass === "instagram") { brandColor = "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)"; defaultIcon = "instagram"; }
            else if (platformClass === "whatsapp") { brandColor = "#22c55e"; defaultIcon = "message-circle"; }
            else if (platformClass === "tiktok") { brandColor = "#000000"; defaultIcon = "music-4"; }
            else if (platformClass === "facebook") { brandColor = "#1877f2"; defaultIcon = "facebook"; }
            else if (platformClass === "telegram") { brandColor = "#0ea5e9"; defaultIcon = "send"; }
            else if (platformClass === "twitter") { brandColor = "#1da1f2"; defaultIcon = "twitter"; }
            else if (platformClass === "website") { brandColor = "var(--secondary)"; defaultIcon = "globe"; }

            const iconMarkup = item.customIcon 
              ? `<img src="${item.customIcon}" alt="${item.title}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex-shrink: 0;" />`
              : `<span style="background: ${brandColor}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="${defaultIcon}" style="width:12px; height:12px;"></i></span>`;

            return `
              <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="support-item" title="${item.title}" style="display: flex; align-items: center; gap: 8px; padding: 6px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 30px; text-decoration: none;">
                ${iconMarkup}
                <span style="font-size: 11px; color: rgba(255,255,255,0.85); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${item.title || item.platform}</span>
              </a>
            `;
          }).join('')}
        </div>
      `;
    } else {
      dynamicMount.outerHTML = `<p style="font-size: 12px; color: rgba(255,255,255,0.5); line-height: 1.4;">Connecting our community through benevolent Islamic education, mutual learning, and cooperative services.</p>`;
    }
  }

  // Inject Branding Overrides Globally
  applyDynamicBrandingOverrides();

  // Re-run lucide icons creation for newly injected elements in the footer
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Global visual branding asset loader (replaces static background styles and mosque placeholder icons with custom upload)
function applyDynamicBrandingOverrides() {
  const customLogo = localStorage.getItem("masjid_logo");
  if (customLogo) {
    // Top Nav Bar Logo Replacement
    const logoLink = document.getElementById("nav-logo");
    if (logoLink) {
      const existingIcon = logoLink.querySelector(".logo-icon");
      if (existingIcon) {
        existingIcon.outerHTML = `<img src="${customLogo}" alt="Branded Logo" style="width: 40px; height: 40px; object-fit: cover; border-radius: 50%; margin-right: 12px; border: 1px solid rgba(255,255,255,0.35);" />`;
      }
    }
    // Hero Banner Logo replacement
    const heroContent = document.querySelector(".hero-content");
    if (heroContent) {
      const heroEmblemContainer = heroContent.querySelector("div[style*='background-color: rgba(255, 255, 255, 0.08)']");
      if (heroEmblemContainer) {
        heroEmblemContainer.innerHTML = `<img src="${customLogo}" alt="Branded Logo" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" />`;
        heroEmblemContainer.style.background = "none";
        heroEmblemContainer.style.border = "none";
        heroEmblemContainer.style.width = "80px";
        heroEmblemContainer.style.height = "80px";
      }
    }
  }

  // Hero Backdrop Background Replacement
  const customHeroBanner = localStorage.getItem("masjid_hero_banner");
  if (customHeroBanner) {
    const heroEl = document.querySelector(".hero");
    if (heroEl) {
      heroEl.style.backgroundImage = `linear-gradient(rgba(10, 77, 52, 0.88), rgba(6, 44, 30, 0.95)), url('${customHeroBanner}')`;
      heroEl.style.backgroundSize = "cover";
      heroEl.style.backgroundPosition = "center";
    }
  }
}
