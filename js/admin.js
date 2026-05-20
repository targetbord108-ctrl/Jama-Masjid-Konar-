/**
 * Masjid Management Platform - Admin portal backend script
 * Implements security sessions, role check authorization rules, financial ledgers, 
 * data editing boundaries, and live content publishers.
 */

import MasjidDB from './db.js';

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Auth Guard check
  const pathname = window.location.pathname;
  const pageName = pathname.substring(pathname.lastIndexOf("/") + 1);

  if (pageName === "admin-login.html") {
    initLoginPage();
    return;
  }

  // Guard other admin pages
  if (!MasjidDB.isAuthenticated()) {
    window.location.href = "/admin-login.html";
    return;
  }

  // Populate Sidebar active user info & menus
  populateSidebarProfile();
  initLogoutTrigger();

  // Route specific admin layouts
  if (pageName === "admin-dashboard.html") {
    initDashboardPage();
  } else if (pageName === "accounts.html") {
    initAccountsPage();
  } else if (pageName === "manage-articles.html") {
    initManageArticlesPage();
  } else if (pageName === "manage-gallery.html") {
    initManageGalleryPage();
  } else if (pageName === "manage-videos.html") {
    initManageVideosPage();
  } else if (pageName === "manage-admins.html") {
    initManageAdminsPage();
  } else if (pageName === "settings.html") {
    initSettingsPage();
  }
});

// Sidebar Profile display helper
function populateSidebarProfile() {
  const session = MasjidDB.getCurrentSession();
  const avatarEl = document.getElementById("sidebar-user-avatar");
  const nameEl = document.getElementById("sidebar-user-name");
  const roleEl = document.getElementById("sidebar-user-role");

  if (session) {
    if (avatarEl) {
      avatarEl.textContent = session.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase();
    }
    if (nameEl) nameEl.textContent = session.name;
    if (roleEl) roleEl.textContent = session.role;
  }
}

// Common Admin Logout
function initLogoutTrigger() {
  const btn = document.getElementById("admin-logout-btn");
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      MasjidDB.logout();
      window.location.href = "/index.html";
    });
  }
}

// Login verification controller
function initLoginPage() {
  const form = document.getElementById("admin-login-form");
  const errBox = document.getElementById("login-error-msg");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const user = document.getElementById("login-username").value.trim();
      const pass = document.getElementById("login-password").value.trim();

      if (!user || !pass) {
        if (errBox) {
          errBox.textContent = "Please fill in all details.";
          errBox.classList.remove("hidden");
        }
        return;
      }

      const res = MasjidDB.login(user, pass);
      if (res.success) {
        window.location.href = "/admin-dashboard.html";
      } else {
        if (errBox) {
          errBox.textContent = res.message;
          errBox.classList.remove("hidden");
        }
      }
    });
  }
}

// Global visual alerts inside dashboard
function showAdminNotification(msg, isError = false) {
  let toast = document.getElementById("admin-alert-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "admin-alert-toast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.borderLeftColor = isError ? "var(--danger)" : "var(--primary)";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 4000);
}

// PREMIUM CUSTOM DELETE ENGINE WITH SMOOTH ROW SLIDEOFFS
function animateAndDeleteElement(element, callback) {
  if (element) {
    element.style.transition = "all 0.45s cubic-bezier(0.4, 0, 0.2, 1)";
    element.style.opacity = "0";
    element.style.transform = "translateX(-40px) scale(0.96)";
    element.style.backgroundColor = "#fff5f5";
    setTimeout(() => {
      callback();
    }, 450);
  } else {
    callback();
  }
}

function showDeleteConfirmation(title, message, elementToAnimate, onConfirm) {
  let modal = document.getElementById("custom-confirm-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "custom-confirm-modal";
    modal.className = "dialog-overlay";
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="dialog-box" style="max-width: 440px; text-align: center; border: 1px solid rgba(220, 53, 69, 0.2); overflow: hidden; box-shadow: var(--shadow-lg);">
      <div class="dialog-header text-white" style="background: linear-gradient(135deg, #d32f2f, #ef5350); justify-content: center; padding: 22px 16px; border-bottom: none; display: flex; align-items: center; justify-content: center;">
        <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <div style="background: rgba(255,255,255,0.2); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
            <i data-lucide="alert-triangle" style="width: 22px; height: 22px; color: white;"></i>
          </div>
          <h3 style="color: white; font-family: var(--font-heading); font-size: 19px; margin: 0; font-weight: 700;">Are you sure?</h3>
        </div>
      </div>
      <div class="dialog-body" style="padding: 26px 20px; font-size: 14px; text-align: center; line-height: 1.5; background: var(--white);">
        <p style="font-weight: 700; margin-bottom: 8px; font-size: 15px; color: #d32f2f;">${title}</p>
        <p style="color: var(--text-muted); margin: 0;">${message}</p>
      </div>
      <div class="dialog-footer" style="justify-content: center; gap: 12px; padding: 16px; border-top: 1px solid var(--border-color); background: #fafafa; display: flex;">
        <button class="btn btn-secondary btn-sm" id="confirm-cancel-btn" style="min-width: 100px; padding: 8px 16px; font-weight: 600;">Cancel</button>
        <button class="btn btn-danger btn-sm" id="confirm-delete-btn" style="min-width: 100px; padding: 8px 16px; font-weight: 600; background-color: #d32f2f; color: white; border: none;">Delete</button>
      </div>
    </div>
  `;

  modal.classList.add("show");
  
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const cleanup = () => {
    modal.classList.remove("show");
  };

  const handleCancel = () => {
    cleanup();
  };

  const handleConfirm = () => {
    cleanup();
    if (elementToAnimate) {
      animateAndDeleteElement(elementToAnimate, onConfirm);
    } else {
      onConfirm();
    }
  };

  document.getElementById("confirm-cancel-btn").addEventListener("click", handleCancel);
  document.getElementById("confirm-delete-btn").addEventListener("click", handleConfirm);
}

// 1. Admin Main Dashboard Metrics Controls
function initDashboardPage() {
  updateMetricsUI();
  populateDashboardRecentTable();
}

function updateMetricsUI() {
  const metrics = MasjidDB.getFinancialSummary();
  const incVal = document.getElementById("dash-total-income");
  const expVal = document.getElementById("dash-total-expense");
  const savVal = document.getElementById("dash-total-savings");
  const donVal = document.getElementById("dash-total-donations");

  if (incVal) incVal.textContent = `$${parseFloat(metrics.totalIncome).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  if (expVal) expVal.textContent = `$${parseFloat(metrics.totalExpense).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  if (donVal) donVal.textContent = `$${parseFloat(metrics.totalDonation).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
  if (savVal) {
    savVal.textContent = `$${parseFloat(metrics.savings).toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    const cleanSaving = parseFloat(metrics.savings) || 0;
    if (cleanSaving < 0) {
      savVal.className = "metric-value text-danger";
    } else {
      savVal.className = "metric-value text-success";
    }
  }
}

function populateDashboardRecentTable() {
  const tableBody = document.getElementById("dashboard-recent-tx-table");
  if (tableBody) {
    const list = MasjidDB.getFinancials() || [];
    // Show only 6 latest transactions
    const slice = list.slice(0, 6);

    if (slice.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-muted text-center" style="padding:20px;">No transactions entered yet.</td></tr>`;
      return;
    }

    tableBody.innerHTML = slice.map(tx => `
      <tr>
        <td><strong>${tx.date}</strong></td>
        <td><span class="badge-financial-type ${tx.type}">${tx.type}</span></td>
        <td>${tx.category}</td>
        <td>${tx.description}</td>
        <td style="font-family:var(--font-heading); font-weight:700; color: var(--primary);">$${tx.amount.toFixed(2)}</td>
      </tr>
    `).join('');
  }
}

// 2. Financial Management Section (Ledger grid registers)
function initAccountsPage() {
  const tableBody = document.getElementById("accounts-ledger-table-body");
  const queryBar = document.getElementById("ledger-search-bar");
  const ledgerTabs = document.getElementById("ledger-type-tabs");
  const addBtn = document.getElementById("ledger-add-record-btn");
  const formModal = document.getElementById("record-editor-modal");
  const closeFormBtn = document.getElementById("record-editor-close");
  const cancelFormBtn = document.getElementById("record-editor-cancel");
  const submitFormBtn = document.getElementById("record-editor-save");

  let searchVal = "";
  let typeTab = "all";

  // Check role authorization details (Editors can ONLY read & add, no delete)
  const session = MasjidDB.getCurrentSession();
  const isAuthorizedToEdit = session && ["Super Admin", "Admin"].includes(session.role);

  const renderLedger = () => {
    if (!tableBody) return;
    const items = MasjidDB.getFinancials() || [];

    const filtered = items.filter(tx => {
      const matchTab = typeTab === "all" || tx.type === typeTab;
      const matchText = tx.category.toLowerCase().includes(searchVal) ||
                        tx.description.toLowerCase().includes(searchVal) ||
                        tx.editor.toLowerCase().includes(searchVal);
      return matchTab && matchText;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding:40px;">No matching records found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(tx => `
      <tr class="ledger-row" id="row-${tx.id}">
        <td><strong>${tx.date}</strong></td>
        <td><span class="badge-financial-type ${tx.type}">${tx.type}</span></td>
        <td><b>${tx.category}</b></td>
        <td>${tx.description}</td>
        <td style="font-family:var(--font-heading); font-weight:600;">$${tx.amount.toFixed(2)}</td>
        <td style="font-size:12px; color:var(--text-muted);">${tx.editor}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon-adjust edit edit-tx-trigger" data-id="${tx.id}" title="Edit Record" ${isAuthorizedToEdit ? "" : "disabled style='opacity:0.3; cursor:not-allowed;'"}>
              <i data-lucide="edit-3"></i>
            </button>
            <button class="btn-icon-adjust delete delete-tx-trigger" data-id="${tx.id}" title="Delete Record" ${isAuthorizedToEdit ? "" : "disabled style='opacity:0.3; cursor:not-allowed;'"}>
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Link triggers with event delegation
    document.querySelectorAll(".delete-tx-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.getAttribute("data-id");
        const row = document.getElementById(`row-${id}`);
        showDeleteConfirmation(
          "Delete Ledger Audit", 
          "This will permanently purge this double-entry ledger item from LocalStorage ledger. Click Delete to initiate smooth removal.", 
          row, 
          () => {
            MasjidDB.deleteFinancialRecord(id);
            showAdminNotification("Financial ledger entry purged successfully.");
            renderLedger();
          }
        );
      });
    });

    document.querySelectorAll(".edit-tx-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = b.getAttribute("data-id");
        openEditRecordDialog(id);
      });
    });
  };

  // Sync Searches
  if (queryBar) {
    queryBar.addEventListener("input", (e) => {
      searchVal = e.target.value.toLowerCase().trim();
      renderLedger();
    });
  }

  // Type Filter selection tabs
  if (ledgerTabs) {
    ledgerTabs.querySelectorAll(".filter-btn").forEach(b => {
      b.addEventListener("click", (e) => {
        ledgerTabs.querySelectorAll(".filter-btn").forEach(tab => tab.classList.remove("active"));
        e.currentTarget.classList.add("active");
        typeTab = e.currentTarget.getAttribute("data-type");
        renderLedger();
      });
    });
  }

  // Dialog Spawner Actions
  if (addBtn && formModal) {
    addBtn.addEventListener("click", () => {
      openAddRecordDialog();
    });
  }

  const closeDialog = () => {
    formModal.classList.remove("show");
  };

  if (closeFormBtn) closeFormBtn.addEventListener("click", closeDialog);
  if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeDialog);

  // Form Submission hook
  if (submitFormBtn) {
    submitFormBtn.addEventListener("click", () => {
      const mode = document.getElementById("form-record-mode").value; // 'add' or 'edit'
      const id = document.getElementById("form-record-id-ref").value;

      const dateVal = document.getElementById("form-record-date").value;
      const typeVal = document.getElementById("form-record-type").value;
      const catVal = document.getElementById("form-record-category").value;
      const descVal = document.getElementById("form-record-description").value.trim();
      const amountVal = parseFloat(document.getElementById("form-record-amount").value) || 0;

      if (amountVal <= 0 || !descVal) {
        showAdminNotification("Please input a valid amount and description.", true);
        return;
      }

      const activeUser = MasjidDB.getCurrentSession()?.name || "Admin Staff";

      if (mode === "add") {
        MasjidDB.addFinancialRecord({
          date: dateVal,
          type: typeVal,
          category: catVal,
          description: descVal,
          amount: amountVal,
          editor: activeUser
        });
        showAdminNotification("Record saved successfully.");
      } else {
        // Edit Action
        if (!isAuthorizedToEdit) {
          showAdminNotification("Unauthorized: Only Admins or Super Admins can alter logs.", true);
          return;
        }
        MasjidDB.editFinancialRecord({
          id,
          date: dateVal,
          type: typeVal,
          category: catVal,
          description: descVal,
          amount: amountVal,
          editor: activeUser
        });
        showAdminNotification("Record updated successfully.");
      }

      closeDialog();
      renderLedger();
    });
  }

  // Helper functions inside accounts module closure
  function openAddRecordDialog() {
    document.getElementById("form-record-mode").value = "add";
    document.getElementById("form-record-id-ref").value = "";
    document.getElementById("dialog-record-title").textContent = "Add Financial Record";

    // Defaults
    document.getElementById("form-record-date").value = new Date().toISOString().split('T')[0];
    document.getElementById("form-record-type").value = "income";
    populateCategoryDropdown("income");
    document.getElementById("form-record-description").value = "";
    document.getElementById("form-record-amount").value = "";

    formModal.classList.add("show");
  }

  // Dynamic dropdown sync based on selection
  const typeSelect = document.getElementById("form-record-type");
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      populateCategoryDropdown(e.target.value);
    });
  }

  function openEditRecordDialog(id) {
    if (!isAuthorizedToEdit) {
      showAdminNotification("Access Denied: Editors are restricted to read & add only.", true);
      return;
    }

    const records = MasjidDB.getFinancials() || [];
    const tx = records.find(r => r.id === id);
    if (!tx) return;

    document.getElementById("form-record-mode").value = "edit";
    document.getElementById("form-record-id-ref").value = tx.id;
    document.getElementById("dialog-record-title").textContent = "Edit Financial Record";

    document.getElementById("form-record-date").value = tx.date;
    document.getElementById("form-record-type").value = tx.type;
    populateCategoryDropdown(tx.type);
    document.getElementById("form-record-category").value = tx.category;
    document.getElementById("form-record-description").value = tx.description;
    document.getElementById("form-record-amount").value = tx.amount;

    formModal.classList.add("show");
  }

  function populateCategoryDropdown(type) {
    const dropdown = document.getElementById("form-record-category");
    if (!dropdown) return;
    if (type === "income") {
      dropdown.innerHTML = `
        <option value="Friday Donation">Friday Donation</option>
        <option value="Sadaqah">General Sadaqah</option>
        <option value="Zakat">Zakat al-Maal</option>
        <option value="Charity Box">Charity Box</option>
        <option value="Event Registration">Event Registration</option>
      `;
    } else {
      dropdown.innerHTML = `
        <option value="Utility Bill">Utility Bill</option>
        <option value="Imam Salary">Imam Salary</option>
        <option value="Masjid Maintenance">Masjid Maintenance</option>
        <option value="Ramadan Iftar Expense">Ramadan Iftar Expense</option>
        <option value="Administrative">Administrative</option>
      `;
    }
  }

  // Load ledger on startup
  renderLedger();
}

// 3. Articles Content Management Controller
function initManageArticlesPage() {
  const tableBody = document.getElementById("articles-list-table-body");
  const addBtn = document.getElementById("article-add-btn");
  const formModal = document.getElementById("article-editor-modal");
  const closeFormBtn = document.getElementById("article-editor-close");
  const cancelFormBtn = document.getElementById("article-editor-cancel");
  const submitFormBtn = document.getElementById("article-editor-save");

  const renderArticlesList = () => {
    if (!tableBody) return;
    const articles = MasjidDB.getArticles() || [];

    if (articles.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-muted text-center" style="padding:30px;">No articles drafted. Click Add to create one.</td></tr>`;
      return;
    }

    tableBody.innerHTML = articles.map(art => `
      <tr id="art-row-${art.id}">
        <td>
          <img src="${art.imageUrl}" style="width:50px; height:35px; object-fit:cover; border-radius:4px; margin-right:12px; vertical-align:middle;" alt="${art.title}">
          <strong>${art.title}</strong>
        </td>
        <td><span class="filter-btn active btn-sm" style="font-size:11px; padding:2px 6px;">${art.category}</span></td>
        <td>${art.author}</td>
        <td>${art.date}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-icon-adjust delete delete-art-trigger" data-id="${art.id}" title="Delete Article">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Link deletes with our premium confirmations
    document.querySelectorAll(".delete-art-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = b.getAttribute("data-id");
        const row = document.getElementById(`art-row-${id}`);
        showDeleteConfirmation(
          "Delete Scholastic Article", 
          "Are you sure you want to delete this scholastic article draft? Public viewers will no longer see it.", 
          row, 
          () => {
            MasjidDB.deleteArticle(id);
            showAdminNotification("Article deleted successfully.");
            renderArticlesList();
          }
        );
      });
    });
  };

  // Cover Image device chooser logic
  const artFileChooser = document.getElementById("btn-art-file-chooser");
  const artFileInput = document.getElementById("form-art-file-input");
  const artImgPreview = document.getElementById("form-art-img-preview");
  const artImgPlaceholder = document.getElementById("form-art-img-placeholder");

  if (artFileChooser && artFileInput) {
    artFileChooser.addEventListener("click", () => artFileInput.click());
    artFileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024) {
          showAdminNotification("Cover image exceeds 1MB. Use a smaller file.", true);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const b64 = ev.target.result;
          document.getElementById("form-art-image").value = b64;
          if (artImgPreview) {
            artImgPreview.src = b64;
            artImgPreview.style.display = "block";
          }
          if (artImgPlaceholder) artImgPlaceholder.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (addBtn && formModal) {
    addBtn.addEventListener("click", () => {
      document.getElementById("form-art-title").value = "";
      document.getElementById("form-art-category").value = "History";
      document.getElementById("form-art-excerpt").value = "";
      const defaultImg = "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800";
      document.getElementById("form-art-image").value = defaultImg;
      if (artImgPreview) {
        artImgPreview.src = defaultImg;
        artImgPreview.style.display = "block";
      }
      if (artImgPlaceholder) artImgPlaceholder.style.display = "none";
      document.getElementById("form-art-content").value = "";
      formModal.classList.add("show");
    });
  }

  const closeDialog = () => {
    formModal.classList.remove("show");
  };

  if (closeFormBtn) closeFormBtn.addEventListener("click", closeDialog);
  if (cancelFormBtn) cancelFormBtn.addEventListener("click", closeDialog);

  if (submitFormBtn) {
    submitFormBtn.addEventListener("click", () => {
      const title = document.getElementById("form-art-title").value.trim();
      const cat = document.getElementById("form-art-category").value;
      const excerpt = document.getElementById("form-art-excerpt").value.trim();
      const image = document.getElementById("form-art-image").value.trim();
      const rawContent = document.getElementById("form-art-content").value.trim();

      if (!title || !excerpt || !rawContent) {
        showAdminNotification("Please fill out all required fields.", true);
        return;
      }

      // Convert newlines in raw content to simple HTML paragraphs for premium public layout!
      const content = rawContent.split("\n\n").map(para => `<p>${para}</p>`).join("");
      const author = MasjidDB.getCurrentSession()?.name || "Senior Scholar";

      MasjidDB.addArticle({
        title,
        category: cat,
        imageUrl: image,
        excerpt,
        content,
        author
      });

      showAdminNotification("Article published successfully.");
      closeDialog();
      renderArticlesList();
    });
  }

  // Load default Announcements & Events controls as requested of standard dashboard features!
  initAnnouncementsTabControl();
  initEventsTabControl();

  renderArticlesList();
}

function initAnnouncementsTabControl() {
  const listBody = document.getElementById("announcements-list-table-body");
  const form = document.getElementById("add-announcement-form");

  const renderAnnList = () => {
    if (!listBody) return;
    const anns = MasjidDB.getAnnouncements() || [];
    listBody.innerHTML = anns.map(ann => `
      <tr id="ann-row-${ann.id}">
        <td><strong>${ann.title}</strong></td>
        <td><span style="font-size:11px; font-weight:700; color:var(--primary);">${ann.category}</span></td>
        <td>${ann.important ? '<span class="text-danger" style="font-weight:700;">⚠️ Important</span>' : 'Standard'}</td>
        <td>
          <button class="btn-icon-adjust delete delete-ann-trigger" data-id="${ann.id}" title="Delete notice">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    document.querySelectorAll(".delete-ann-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = b.getAttribute("data-id");
        const row = document.getElementById(`ann-row-${id}`);
        showDeleteConfirmation(
          "Delete Notice Bulletin", 
          "Remove this bulletin banner from scrolling ticker and notification lists?", 
          row, 
          () => {
            MasjidDB.deleteAnnouncement(id);
            showAdminNotification("Notice bulletin purged.");
            renderAnnList();
          }
        );
      });
    });
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("ann-title-input").value.trim();
      const category = document.getElementById("ann-category-input").value;
      const content = document.getElementById("ann-content-input").value.trim();
      const important = document.getElementById("ann-important-input").checked;

      if (!title || !content) {
        showAdminNotification("Required details missing", true);
        return;
      }

      MasjidDB.addAnnouncement({ title, category, content, important });
      showAdminNotification("New announcement posted!");
      form.reset();
      renderAnnList();
    });
  }

  renderAnnList();
}

function initEventsTabControl() {
  const listBody = document.getElementById("events-list-table-body");
  const form = document.getElementById("add-event-form");

  const renderEventsList = () => {
    if (!listBody) return;
    const evts = MasjidDB.getEvents() || [];
    listBody.innerHTML = evts.map(evt => `
      <tr id="evt-row-${evt.id}">
        <td><strong>${evt.title}</strong></td>
        <td>${evt.date}</td>
        <td>${evt.speaker}</td>
        <td>${evt.location}</td>
        <td>
          <button class="btn-icon-adjust delete delete-evt-trigger" data-id="${evt.id}" title="Remove Event">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    document.querySelectorAll(".delete-evt-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = b.getAttribute("data-id");
        const row = document.getElementById(`evt-row-${id}`);
        showDeleteConfirmation(
          "Cancel Community Event", 
          "This action will remove this seminar schedule entirely. Proceed?", 
          row, 
          () => {
            MasjidDB.deleteEvent(id);
            showAdminNotification("Community event canceled successfully.");
            renderEventsList();
          }
        );
      });
    });
  };

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = document.getElementById("evt-title-input").value.trim();
      const date = document.getElementById("evt-date-input").value;
      const time = document.getElementById("evt-time-input").value.trim();
      const speaker = document.getElementById("evt-speaker-input").value.trim();
      const location = document.getElementById("evt-location-input").value.trim();
      const description = document.getElementById("evt-desc-input").value.trim();

      if (!title || !date || !time) {
        showAdminNotification("Event requires title, date, and hour timings", true);
        return;
      }

      MasjidDB.addEvent({ title, date, time, speaker, location, description });
      showAdminNotification("Community event scheduled!");
      form.reset();
      renderEventsList();
    });
  }

  renderEventsList();
}


// 4. Manage Gallery Content Section
function initManageGalleryPage() {
  const tableBody = document.getElementById("gallery-list-table-body");
  const searchInput = document.getElementById("gallery-search-bar");
  const typeFilter = document.getElementById("gallery-type-filter");
  const addBtn = document.getElementById("gallery-add-item-btn");
  const formModal = document.getElementById("gallery-editor-modal");
  const closeBtn = document.getElementById("gallery-modal-close");
  const cancelBtn = document.getElementById("gallery-modal-cancel");
  const saveBtn = document.getElementById("gallery-modal-save");

  let searchText = "";
  let typeVal = "all";

  const renderGalleryList = () => {
    if (!tableBody) return;
    const items = MasjidDB.getGallery() || [];

    const filtered = items.filter(itm => {
      const matchType = typeVal === "all" || itm.type === typeVal;
      const matchSearch = itm.title.toLowerCase().includes(searchText);
      return matchType && matchSearch;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="text-muted text-center" style="padding:30px;">No gallery postings found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(itm => `
      <tr id="gal-row-${itm.id}">
        <td>
          <img src="${itm.type === 'photo' ? itm.url : 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'}" 
               style="width:70px; height:45px; object-fit:cover; border-radius:6px; background-color:#eaeaea; border: 1px solid var(--border-color); vertical-align:middle;" />
        </td>
        <td><strong>${itm.title}</strong></td>
        <td><span class="badge-financial-type income" style="background-color: var(--primary-glow); color:var(--primary); font-size:11px; padding:2px 8px;">${itm.category}</span></td>
        <td><span style="font-weight: 700; text-transform: uppercase; font-size:11px; color:var(--text-muted);">${itm.type}</span></td>
        <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--text-muted);">${itm.url}</td>
        <td>
          <button class="btn-icon-adjust delete delete-gal-trigger" data-id="${itm.id}" title="Remove Media">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Custom deletes
    document.querySelectorAll(".delete-gal-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = b.getAttribute("data-id");
        const row = document.getElementById(`gal-row-${id}`);
        showDeleteConfirmation(
          "Delete Media Asset", 
          "Remove this asset from the community's public photos and clips slider? The visual thumbnail will collapse instantly.", 
          row, 
          () => {
            MasjidDB.deleteGalleryItem(id);
            showAdminNotification("Media asset successfully deleted.");
            renderGalleryList();
          }
        );
      });
    });
  };

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchText = e.target.value.toLowerCase().trim();
      renderGalleryList();
    });
  }

  if (typeFilter) {
    typeFilter.addEventListener("change", (e) => {
      typeVal = e.target.value;
      renderGalleryList();
    });
  }

  // Interactive Form Elements
  const typeSelect = document.getElementById("form-gal-type");
  const uploadWrapper = document.getElementById("gallery-image-upload-wrapper");
  const urlWrapper = document.getElementById("gallery-url-input-wrapper");
  const fileInput = document.getElementById("form-gal-file-input");
  const chooserBtn = document.getElementById("btn-gal-file-chooser");
  const imgPreview = document.getElementById("form-gal-img-preview");
  const imgPlaceholder = document.getElementById("form-gal-img-placeholder");

  const toggleGalleryFields = () => {
    if (!typeSelect) return;
    if (typeSelect.value === "photo") {
      if (uploadWrapper) uploadWrapper.style.display = "block";
      if (urlWrapper) urlWrapper.style.display = "none";
    } else {
      if (uploadWrapper) uploadWrapper.style.display = "none";
      if (urlWrapper) urlWrapper.style.display = "block";
    }
  };

  if (typeSelect) {
    typeSelect.addEventListener("change", toggleGalleryFields);
  }

  // Choose file logic
  if (chooserBtn && fileInput) {
    chooserBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024) {
          showAdminNotification("Image size is too large. Please upload an image under 1MB.", true);
          return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
          const b64 = ev.target.result;
          document.getElementById("form-gal-url").value = b64;
          if (imgPreview) {
            imgPreview.src = b64;
            imgPreview.style.display = "block";
          }
          if (imgPlaceholder) imgPlaceholder.style.display = "none";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Open & Close
  if (addBtn && formModal) {
    addBtn.addEventListener("click", () => {
      document.getElementById("form-gal-title").value = "";
      if (typeSelect) typeSelect.value = "photo";
      document.getElementById("form-gal-category").value = "Community";
      document.getElementById("form-gal-url").value = "";
      if (imgPreview) {
        imgPreview.src = "";
        imgPreview.style.display = "none";
      }
      if (imgPlaceholder) imgPlaceholder.style.display = "block";
      toggleGalleryFields();
      formModal.classList.add("show");
    });
  }

  const hideModal = () => { formModal.classList.remove("show"); };
  if (closeBtn) closeBtn.addEventListener("click", hideModal);
  if (cancelBtn) cancelBtn.addEventListener("click", hideModal);

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const title = document.getElementById("form-gal-title").value.trim();
      const type = document.getElementById("form-gal-type").value;
      const category = document.getElementById("form-gal-category").value;
      const url = document.getElementById("form-gal-url").value.trim();

      if (!title || !url) {
        showAdminNotification("Please supply an asset title and resource url.", true);
        return;
      }

      MasjidDB.addGalleryItem({ title, type, category, url });
      showAdminNotification("Media file uploaded directly to LocalStorage.");
      hideModal();
      renderGalleryList();
    });
  }

  renderGalleryList();
}


// 5. Manage Staff Accounts (Only accessible by Super Admin)
function initManageAdminsPage() {
  const tableBody = document.getElementById("admins-list-table-body");
  const authGuardPanel = document.getElementById("admins-unauthorized-guard");
  const layoutPanel = document.getElementById("admins-main-interface-layout");
  const addBtn = document.getElementById("admins-add-user-btn");
  
  const formModal = document.getElementById("admins-editor-modal");
  const closeModalBtn = document.getElementById("admins-modal-close");
  const cancelModalBtn = document.getElementById("admins-modal-cancel");
  const saveModalBtn = document.getElementById("admins-modal-save");

  const passModal = document.getElementById("admins-password-modal");
  const closePassBtn = document.getElementById("password-modal-close");
  const cancelPassBtn = document.getElementById("password-modal-cancel");
  const savePassBtn = document.getElementById("password-modal-save");

  const activeSession = MasjidDB.getCurrentSession();
  const isSuperAdmin = activeSession && activeSession.role === "Super Admin";

  if (!isSuperAdmin) {
    if (authGuardPanel) authGuardPanel.classList.remove("hidden");
    if (layoutPanel) layoutPanel.style.opacity = "0.45";
    if (addBtn) {
      addBtn.disabled = true;
      addBtn.style.opacity = "0.4";
      addBtn.style.cursor = "not-allowed";
    }
  }

  const renderAdmins = () => {
    if (!tableBody) return;
    const users = MasjidDB.getUsers() || [];

    tableBody.innerHTML = users.map(u => {
      const usernameLower = u.username.toLowerCase();
      const currentUserNameLower = activeSession?.username?.toLowerCase();
      const cannotDeleteOnSelf = usernameLower === currentUserNameLower;

      return `
        <tr id="adm-row-${usernameLower}">
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="background-color: var(--primary-glow); color: var(--primary); font-weight:700; border-radius:50%; width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:12px;">
                ${u.name.split(" ").map(w => w[0]).join("").substring(0,2).toUpperCase()}
              </div>
              <div>
                <strong>@${u.username}</strong>
                ${cannotDeleteOnSelf ? ' <span class="badge-financial-type income" style="font-size:10px; padding:2px 6px;">You</span>' : ''}
              </div>
            </div>
          </td>
          <td>${u.name}</td>
          <td>
            <span class="badge-financial-type ${u.role === 'Super Admin' ? 'expense' : u.role === 'Admin' ? 'income' : 'saving'}" style="font-size:11px;">
              ${u.role}
            </span>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon-adjust edit change-pass-trigger" data-username="${u.username}" title="Change staff password" ${isSuperAdmin ? "" : "disabled style='opacity:0.3; cursor:not-allowed;'"}>
                <i data-lucide="key"></i>
              </button>
              <button class="btn-icon-adjust delete delete-staff-trigger" data-username="${u.username}" title="Delist User Account" ${isSuperAdmin && !cannotDeleteOnSelf ? "" : "disabled style='opacity:0.3; cursor:not-allowed;'"}>
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Click hooks for change pass
    document.querySelectorAll(".change-pass-trigger").forEach(b => {
      b.addEventListener("click", () => {
        if (!isSuperAdmin) return;
        const username = b.getAttribute("data-username");
        document.getElementById("password-target-username").value = username;
        document.getElementById("form-change-password").value = "";
        passModal.classList.add("show");
      });
    });

    // Click hooks for deprovision
    document.querySelectorAll(".delete-staff-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        if (!isSuperAdmin) return;
        const username = b.getAttribute("data-username");
        const row = document.getElementById(`adm-row-${username.toLowerCase()}`);
        showDeleteConfirmation(
          "Revoke Employee Access", 
          `Deprovision board access for administrative account @${username}? They will be logged out immediately.`, 
          row, 
          () => {
            MasjidDB.deleteUser(username);
            showAdminNotification(`Access credentials revoked for @${username}.`);
            renderAdmins();
          }
        );
      });
    });
  };

  // Dialog Add Form Setup
  if (addBtn && formModal && isSuperAdmin) {
    addBtn.addEventListener("click", () => {
      document.getElementById("form-adm-username").value = "";
      document.getElementById("form-adm-name").value = "";
      document.getElementById("form-adm-password").value = "";
      document.getElementById("form-adm-role").value = "Editor";
      formModal.classList.add("show");
    });
  }

  const hideForm = () => { if (formModal) formModal.classList.remove("show"); };
  if (closeModalBtn) closeModalBtn.addEventListener("click", hideForm);
  if (cancelModalBtn) cancelModalBtn.addEventListener("click", hideForm);

  if (saveModalBtn && isSuperAdmin) {
    saveModalBtn.addEventListener("click", () => {
      const username = document.getElementById("form-adm-username").value.trim().toLowerCase();
      const name = document.getElementById("form-adm-name").value.trim();
      const password = document.getElementById("form-adm-password").value.trim();
      const role = document.getElementById("form-adm-role").value;

      if (!username || !name || password.length < 5) {
        showAdminNotification("Ensure username, full name, and minimum 5 password characters are filled.", true);
        return;
      }

      const users = MasjidDB.getUsers() || [];
      const duplicate = users.find(u => u.username.toLowerCase() === username);
      if (duplicate) {
        showAdminNotification("Username already exists in the registry.", true);
        return;
      }

      MasjidDB.addUser({ username, name, password, role });
      showAdminNotification(`Successfully authorized @${username} as ${role}!`);
      hideForm();
      renderAdmins();
    });
  }

  // Password alteration dialogs
  const hidePassForm = () => { if (passModal) passModal.classList.remove("show"); };
  if (closePassBtn) closePassBtn.addEventListener("click", hidePassForm);
  if (cancelPassBtn) cancelPassBtn.addEventListener("click", hidePassForm);

  if (savePassBtn && isSuperAdmin) {
    savePassBtn.addEventListener("click", () => {
      const username = document.getElementById("password-target-username").value;
      const newPassword = document.getElementById("form-change-password").value.trim();

      if (newPassword.length < 5) {
        showAdminNotification("Password requires at least 5 character length.", true);
        return;
      }

      MasjidDB.changeUserPassword(username, newPassword);
      showAdminNotification(`Security passkey modernized for @${username}.`);
      hidePassForm();
      renderAdmins();
    });
  }

  renderAdmins();
}


// 6. System & Profile Settings Controller (Prayer times alteration)
function initSettingsPage() {
  const settingsNavs = document.querySelectorAll(".settings-nav-btn");
  const settingsPanels = document.querySelectorAll(".settings-panel-form");

  if (settingsNavs) {
    settingsNavs.forEach(btn => {
      btn.addEventListener("click", (e) => {
        settingsNavs.forEach(b => b.classList.remove("active"));
        e.currentTarget.classList.add("active");
        const target = e.currentTarget.getAttribute("data-target");

        settingsPanels.forEach(panel => {
          if (panel.id === target) {
            panel.classList.remove("hidden");
          } else {
            panel.classList.add("hidden");
          }
        });
      });
    });
  }

  // Bind settings load values
  loadProfileSettings();
  loadPrayerTimingsSettings();

  // Settings modification submissions
  const profileForm = document.getElementById("settings-profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("sp-name").value.trim();
      const shortName = document.getElementById("sp-short").value.trim();
      const established = document.getElementById("sp-est").value.trim();
      const address = document.getElementById("sp-adr").value.trim();
      const phone = document.getElementById("sp-phone").value.trim();
      const email = document.getElementById("sp-email").value.trim();
      const imam = document.getElementById("sp-imam").value.trim();
      const muezzin = document.getElementById("sp-muezzin").value.trim();
      const ticker = document.getElementById("sp-ticker").value.trim();

      MasjidDB.updateProfile({
        name, shortName, established, address, phone, email, imam, muezzin, announcementTicker: ticker
      });

      showAdminNotification("Masjid Profile Details updated.");
    });
  }

  const timesForm = document.getElementById("settings-prayer-form");
  if (timesForm) {
    timesForm.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const newTimes = {
        fajr: {
          athan: document.getElementById("s-fajr-ath").value.trim(),
          iqamah: document.getElementById("s-fajr-iq").value.trim()
        },
        zuhar: {
          athan: document.getElementById("s-dh-ath").value.trim(),
          iqamah: document.getElementById("s-dh-iq").value.trim()
        },
        asr: {
          athan: document.getElementById("s-asr-ath").value.trim(),
          iqamah: document.getElementById("s-asr-iq").value.trim()
        },
        maghrib: {
          athan: document.getElementById("s-mag-ath").value.trim(),
          iqamah: document.getElementById("s-mag-iq").value.trim()
        },
        isha: {
          athan: document.getElementById("s-ish-ath").value.trim(),
          iqamah: document.getElementById("s-ish-iq").value.trim()
        },
        jumma1: {
          athan: document.getElementById("s-jum1-ath").value.trim(),
          iqamah: document.getElementById("s-jum1-iq").value.trim(),
          khateeb: document.getElementById("s-jum1-khat").value.trim()
        },
        jumma2: {
          athan: document.getElementById("s-jum2-ath").value.trim(),
          iqamah: document.getElementById("s-jum2-iq").value.trim(),
          khateeb: document.getElementById("s-jum2-khat").value.trim()
        },
        ramadan: {
          seharEnds: document.getElementById("s-sehar").value.trim(),
          iftarBegins: document.getElementById("s-iftar").value.trim(),
          taraweeh: document.getElementById("s-tar").value.trim()
        }
      };

      MasjidDB.updatePrayerTimes(newTimes);
      showAdminNotification("Prayer & Iqamah timings adjusted! Changes live.");
    });
  }

  // Load Footer connection links initial state
  loadFooterSettings();

  // Footer links submit form handler
  const footerForm = document.getElementById("settings-footer-form");
  if (footerForm) {
    footerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const updatedLinks = {
        youtube: document.getElementById("sf-youtube").value.trim(),
        whatsapp: document.getElementById("sf-whatsapp").value.trim(),
        map: document.getElementById("sf-map").value.trim(),
        facebook: document.getElementById("sf-facebook").value.trim(),
        instagram: document.getElementById("sf-instagram").value.trim(),
        telegram: document.getElementById("sf-telegram").value.trim(),
        email: document.getElementById("sf-email").value.trim(),
        phone: document.getElementById("sf-phone").value.trim()
      };

      MasjidDB.updateFooterLinks(updatedLinks);
      showAdminNotification("Support & Connection links successfully updated.");
    });
  }
}

function loadProfileSettings() {
  const profile = MasjidDB.getProfile();
  if (profile) {
    document.getElementById("sp-name").value = profile.name;
    document.getElementById("sp-short").value = profile.shortName;
    document.getElementById("sp-est").value = profile.established;
    document.getElementById("sp-adr").value = profile.address;
    document.getElementById("sp-phone").value = profile.phone;
    document.getElementById("sp-email").value = profile.email;
    document.getElementById("sp-imam").value = profile.imam;
    document.getElementById("sp-muezzin").value = profile.muezzin;
    document.getElementById("sp-ticker").value = profile.announcementTicker || "";
  }
}

function loadPrayerTimingsSettings() {
  const times = MasjidDB.getPrayerTimes();
  if (times) {
    document.getElementById("s-fajr-ath").value = times.fajr.athan;
    document.getElementById("s-fajr-iq").value = times.fajr.iqamah;

    document.getElementById("s-dh-ath").value = times.zuhar.athan;
    document.getElementById("s-dh-iq").value = times.zuhar.iqamah;

    document.getElementById("s-asr-ath").value = times.asr.athan;
    document.getElementById("s-asr-iq").value = times.asr.iqamah;

    document.getElementById("s-mag-ath").value = times.maghrib.athan;
    document.getElementById("s-mag-iq").value = times.maghrib.iqamah;

    document.getElementById("s-ish-ath").value = times.isha.athan;
    document.getElementById("s-ish-iq").value = times.isha.iqamah;

    document.getElementById("s-jum1-ath").value = times.jumma1.athan;
    document.getElementById("s-jum1-iq").value = times.jumma1.iqamah;
    document.getElementById("s-jum1-khat").value = times.jumma1.khateeb;

    document.getElementById("s-jum2-ath").value = times.jumma2.athan;
    document.getElementById("s-jum2-iq").value = times.jumma2.iqamah;
    document.getElementById("s-jum2-khat").value = times.jumma2.khateeb || "";

    document.getElementById("s-sehar").value = times.ramadan.seharEnds || "04:20 AM";
    document.getElementById("s-iftar").value = times.ramadan.iftarBegins || "06:35 PM";
    document.getElementById("s-tar").value = times.ramadan.taraweeh || "";
  }
}

function loadFooterSettings() {
  const links = MasjidDB.getFooterLinks();
  if (links) {
    const ytInput = document.getElementById("sf-youtube");
    const waInput = document.getElementById("sf-whatsapp");
    const mapInput = document.getElementById("sf-map");
    const fbInput = document.getElementById("sf-facebook");
    const igInput = document.getElementById("sf-instagram");
    const tgInput = document.getElementById("sf-telegram");
    const emailInput = document.getElementById("sf-email");
    const phoneInput = document.getElementById("sf-phone");

    if (ytInput) ytInput.value = links.youtube || "";
    if (waInput) waInput.value = links.whatsapp || "";
    if (mapInput) mapInput.value = links.map || "";
    if (fbInput) fbInput.value = links.facebook || "";
    if (igInput) igInput.value = links.instagram || "";
    if (tgInput) tgInput.value = links.telegram || "";
    if (emailInput) emailInput.value = links.email || "";
    if (phoneInput) phoneInput.value = links.phone || "";
  }
}

// 7. Manage Uploaded Videos Controller
function initManageVideosPage() {
  const tableBody = document.getElementById("video-list-table-body");
  const searchInput = document.getElementById("video-search-bar");
  const addBtn = document.getElementById("video-add-item-btn");
  const formModal = document.getElementById("video-editor-modal");
  const closeBtn = document.getElementById("video-modal-close");
  const cancelBtn = document.getElementById("video-modal-cancel");
  const saveBtn = document.getElementById("video-modal-save");

  let searchText = "";

  const renderVideosList = () => {
    if (!tableBody) return;
    const items = MasjidDB.getPreviousBroadcasts() || [];

    const filtered = items.filter(itm => {
      const matchTitle = itm.title.toLowerCase().includes(searchText);
      const matchSpeaker = itm.speaker ? itm.speaker.toLowerCase().includes(searchText) : false;
      return matchTitle || matchSpeaker;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-muted text-center" style="padding:30px;">No video lectures found in the archive.</td></tr>`;
      return;
    }

    tableBody.innerHTML = filtered.map(itm => `
      <tr id="video-row-${itm.id}">
        <td>
          <img src="${itm.thumbnail || `https://img.youtube.com/vi/${itm.youtubeId}/mqdefault.jpg`}" 
               style="width:70px; height:45px; object-fit:cover; border-radius:6px; background-color:#eaeaea; border: 1px solid var(--border-color); vertical-align:middle;" referrerPolicy="no-referrer" />
        </td>
        <td><strong>${itm.title}</strong></td>
        <td><span class="badge-financial-type income" style="background-color: var(--secondary-glow); color:var(--primary); font-size:11px; padding:2px 8px; font-weight:700;">${itm.speaker || 'Sheikh Al-Azhari'}</span></td>
        <td><span style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted); font-weight:500;">${itm.duration || '35:00'}</span></td>
        <td><span style="font-size:12px; color:var(--text-muted);">${itm.date}</span></td>
        <td style="max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">${itm.youtubeId}</td>
        <td>
          <button class="btn-icon-adjust delete delete-video-trigger" data-id="${itm.id}" title="Remove Video">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach deletes
    document.querySelectorAll(".delete-video-trigger").forEach(b => {
      b.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        const row = document.getElementById(`video-row-${id}`);
        showDeleteConfirmation(
          "Delete Video Lecture", 
          "Remove this video lecture from the public homepage gallery archive? This action cannot be undone.", 
          row, 
          () => {
            MasjidDB.deletePreviousBroadcast(id);
            showAdminNotification("Video lecture successfully deleted.");
            renderVideosList();
          }
        );
      });
    });
  };

  // Search filter
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchText = e.target.value.toLowerCase().trim();
      renderVideosList();
    });
  }

  // Extract YouTube ID from links or IDs
  const extractYouTubeId = (urlOrId) => {
    const trimmed = urlOrId.trim();
    if (trimmed.length === 11) {
      return trimmed;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    return (match && match[2].length === 11) ? match[2] : trimmed;
  };

  // Open & Close Modal
  if (addBtn && formModal) {
    addBtn.addEventListener("click", () => {
      document.getElementById("form-video-title").value = "";
      document.getElementById("form-video-speaker").value = "Sheikh Muhammad Al-Azhari";
      document.getElementById("form-video-desc").value = "";
      document.getElementById("form-video-yt-input").value = "";
      document.getElementById("form-video-thumbnail").value = "";
      document.getElementById("form-video-duration").value = "45:00";
      document.getElementById("form-video-date").value = new Date().toISOString().split('T')[0];
      formModal.classList.add("show");
    });
  }

  const hideModal = () => { formModal.classList.remove("show"); };
  if (closeBtn) closeBtn.addEventListener("click", hideModal);
  if (cancelBtn) cancelBtn.addEventListener("click", hideModal);

  // Save new video
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const title = document.getElementById("form-video-title").value.trim();
      const speaker = document.getElementById("form-video-speaker").value.trim();
      const desc = document.getElementById("form-video-desc").value.trim();
      const rawYt = document.getElementById("form-video-yt-input").value.trim();
      const thumbnailInput = document.getElementById("form-video-thumbnail").value.trim();
      const duration = document.getElementById("form-video-duration").value.trim();
      const date = document.getElementById("form-video-date").value;

      if (!title || !rawYt) {
        showAdminNotification("Please supply at least a video title and YouTube URL or ID.", true);
        return;
      }

      const youtubeId = extractYouTubeId(rawYt);
      if (youtubeId.length !== 11) {
        showAdminNotification("Invalid YouTube Video ID extracted. Must be 11 characters.", true);
        return;
      }

      // Default thumbnails in case custom is not specified
      const thumbnail = thumbnailInput || `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

      MasjidDB.addPreviousBroadcast({
        id: "video-" + Date.now(),
        title,
        speaker,
        description: desc,
        youtubeId,
        thumbnail,
        duration: duration || "35:00",
        date: date || new Date().toISOString().split('T')[0]
      });

      showAdminNotification("New video lecture published directly to public schedule gallery.");
      hideModal();
      renderVideosList();
    });
  }

  renderVideosList();
}
