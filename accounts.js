/**
 * Masjid Financial Management System - Accounts Operations Handler
 * Core controller managing authentication state, double-entry bookkeeping ledgers,
 * monthly/yearly reports generation, search, print layouts, and data persistence.
 */

import MasjidDB from './js/db.js';

document.addEventListener("DOMContentLoaded", () => {
  // 1. AUTHENTICATED ADMIN GUARD CHECK
  if (!MasjidDB.isAuthenticated()) {
    window.location.href = "/admin-login.html";
    return;
  }

  const session = MasjidDB.getCurrentSession();
  const isAdmin = session && (session.role === "Super Admin" || session.role === "Admin");

  if (!isAdmin) {
    // If authenticated but role is Editor or other, redirect to login as well based on requirements
    window.location.href = "/admin-login.html";
    return;
  }

  // 2. INITIALIZE INTERFACE ELEMENTS
  initSidebarDisplay(session);
  initFinancialLedgerSystem(session);

  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

/**
 * Populates sidebar profile information with authenticated admin session metadata
 */
function initSidebarDisplay(session) {
  const avatarEl = document.getElementById("sidebar-user-avatar");
  const nameEl = document.getElementById("sidebar-user-name");
  const roleEl = document.getElementById("sidebar-user-role");

  if (session) {
    if (avatarEl) {
      avatarEl.textContent = session.name
        .split(" ")
        .map(w => w[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
    }
    if (nameEl) nameEl.textContent = session.name;
    if (roleEl) roleEl.textContent = session.role;
  }

  // Bind logout trigger
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      MasjidDB.logout();
      window.location.href = "/admin-login.html";
    });
  }
}

/**
 * Core Account Ledger implementation
 */
function initFinancialLedgerSystem(session) {
  // DOM selectors
  const tableBody = document.getElementById("financial-ledger-table-data");
  const searchBar = document.getElementById("ledger-live-search");
  
  // Filters
  const filterMonth = document.getElementById("filter-month");
  const filterYear = document.getElementById("filter-year");
  const filterCategory = document.getElementById("filter-category");
  const filterType = document.getElementById("filter-type");
  const btnReset = document.getElementById("btn-reset-filters");

  // Chart
  const chartContainer = document.getElementById("bar-chart-visualization-rows");
  const chartHeadline = document.getElementById("analytics-chart-headline");

  // Action Buttons
  const btnAddRecord = document.getElementById("ledger-add-record-btn");
  const btnDownloadMonthly = document.getElementById("btn-download-monthly");
  const btnDownloadYearly = document.getElementById("btn-download-yearly");
  const btnPrintReport = document.getElementById("btn-print-report");

  // Modals
  const modalEditor = document.getElementById("record-editor-modal");
  const modalClose = document.getElementById("record-editor-close");
  const modalCancel = document.getElementById("record-editor-cancel");
  const modalSave = document.getElementById("record-editor-save");

  const modalViewer = document.getElementById("record-viewer-modal");
  const viewerCloseBtn = document.getElementById("record-viewer-close");
  const viewerOkBtn = document.getElementById("btn-viewer-close");

  // Notification close
  const notificationBox = document.getElementById("accounts-notification-box");
  const notificationClose = document.getElementById("notification-close-btn");

  if (notificationClose && notificationBox) {
    notificationClose.addEventListener("click", () => {
      notificationBox.style.display = "none";
    });
  }

  // Set Default Value Date
  const formDate = document.getElementById("form-record-date");
  if (formDate) {
    formDate.value = new Date().toISOString().split('T')[0];
  }

  // Dynamic dropdown synchronization for entry types
  const formType = document.getElementById("form-record-type");
  if (formType) {
    formType.addEventListener("change", (e) => {
      syncFormCategories(e.target.value);
    });
  }

  // Trigger categories drop on start
  syncFormCategories("income");

  // State Management
  let searchVal = "";
  let monthFilterVal = "all"; // all, 01, 02... 12
  let yearFilterVal = "2026"; // 2025, 2026, 2027...
  let categoryFilterVal = "all";
  let typeFilterVal = "all"; // all, income, expense

  /**
   * Syncs custom categories inside modal dialog form
   */
  function syncFormCategories(type) {
    const categorySelect = document.getElementById("form-record-category");
    if (!categorySelect) return;

    if (type === "income") {
      categorySelect.innerHTML = `
        <option value="Donation">Donation</option>
        <option value="Zakat">Zakat</option>
        <option value="Sadqa">Sadqa</option>
        <option value="Masjid fund">Masjid fund</option>
        <option value="Event collection">Event collection</option>
        <option value="Friday Donation">Friday Donation</option>
        <option value="General Sadaqah">General Sadaqah</option>
        <option value="Charity Box">Charity Box</option>
        <option value="Other Inflow">Other Inflow</option>
      `;
    } else {
      categorySelect.innerHTML = `
        <option value="Electricity">Electricity</option>
        <option value="Water bill">Water bill</option>
        <option value="Salary">Salary</option>
        <option value="Cleaning">Cleaning</option>
        <option value="Construction">Construction</option>
        <option value="Maintenance">Maintenance</option>
        <option value="Utility Bill">Utility Bill</option>
        <option value="Imam Salary">Imam Salary</option>
        <option value="Ramadan Iftar Expense">Ramadan Iftar Expense</option>
        <option value="Administrative">Administrative</option>
        <option value="Other Outflow">Other Outflow</option>
      `;
    }
  }

  /**
   * Core execution routine: computes accounting figures, renders visual bars and updates table rows
   */
  function refreshAccountsLedger() {
    const list = MasjidDB.getFinancials() || [];

    // Prior period calculations:
    const prevPeriodBalance = getPreviousPeriodBalance(yearFilterVal, monthFilterVal);

    // Filter current dataset
    let filteredList = list.filter(item => {
      const parts = item.date.split('-');
      const itemYear = parts[0];
      const itemMonth = parts[1]; // "01"-"12"

      const matchYear = (yearFilterVal === "all") || (itemYear === yearFilterVal);
      const matchMonth = (monthFilterVal === "all") || (itemMonth === monthFilterVal);
      
      const matchCategory = (categoryFilterVal === "all") || 
        (item.category.toLowerCase() === categoryFilterVal.toLowerCase());
      
      const matchType = (typeFilterVal === "all") || (item.type === typeFilterVal);

      // Search indices हिसाब
      const matchSearch = !searchVal || 
        item.description.toLowerCase().includes(searchVal) ||
        item.category.toLowerCase().includes(searchVal) ||
        item.amount.toString().includes(searchVal) ||
        item.date.includes(searchVal) ||
        item.editor.toLowerCase().includes(searchVal);

      return matchYear && matchMonth && matchCategory && matchType && matchSearch;
    });

    // Compute Metrics for current filtered subset
    let periodIncome = 0;
    let periodExpense = 0;

    filteredList.forEach(item => {
      const val = parseFloat(item.amount) || 0;
      if (item.type === 'income') {
        periodIncome += val;
      } else if (item.type === 'expense') {
        periodExpense += val;
      }
    });

    const periodSavings = periodIncome - periodExpense;
    
    // Overall ledger numbers for sidebar status sync
    const allTimeSummary = MasjidDB.getFinancialSummary();

    // Populate Dashboard counter widgets
    const valTotalIn = document.getElementById("card-total-income");
    const valTotalExp = document.getElementById("card-total-expense");
    const valTotalSav = document.getElementById("card-total-savings");
    const valPrevSav = document.getElementById("card-prev-month-savings");
    const valMonthBal = document.getElementById("card-current-month-balance");

    const labelPrevSav = document.getElementById("prev-savings-title");
    const labelMonthBal = document.getElementById("current-month-bal-title");

    if (valTotalIn) valTotalIn.textContent = `$${periodIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (valTotalExp) valTotalExp.textContent = `$${periodExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (valTotalSav) {
      const netSavings = parseFloat(allTimeSummary.savings) || 0;
      valTotalSav.textContent = `$${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      
      const trendEl = document.getElementById("savings-trend-indicator");
      if (trendEl) {
        if (netSavings < 0) {
          trendEl.textContent = "▼ Net Deficit";
          trendEl.style.color = "var(--color-expense)";
        } else {
          trendEl.textContent = "▲ Net Growth";
          trendEl.style.color = "var(--color-income)";
        }
      }
    }

    // Set bringing forward titles & figures
    if (labelPrevSav) {
      if (monthFilterVal === 'all') {
        labelPrevSav.textContent = `Brought Forward Balance`;
      } else {
        const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const priorMonthIdx = parseInt(monthFilterVal) - 2;
        const name = priorMonthIdx >= 0 ? mNames[priorMonthIdx] : "Prior Year";
        labelPrevSav.textContent = `Balance Pre-${name}`;
      }
    }
    if (valPrevSav) valPrevSav.textContent = `$${prevPeriodBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    if (labelMonthBal) {
      if (monthFilterVal === 'all') {
        labelMonthBal.textContent = `Total Year Reserves (${yearFilterVal})`;
      } else {
        labelMonthBal.textContent = `Total Period Reserves`;
      }
    }
    const finalBalance = prevPeriodBalance + periodSavings;
    if (valMonthBal) valMonthBal.textContent = `$${finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    // Populate data table rows
    renderLedgerTable(filteredList);

    // Render monthly visualization comparison bars
    renderMonthlyBreakdownChart();
  }

  /**
   * Evaluates aggregate financial calculations prior to specific selected calendar bounds
   */
  function getPreviousPeriodBalance(yearVal, monthVal) {
    const list = MasjidDB.getFinancials() || [];
    let balance = 0;

    list.forEach(r => {
      const parts = r.date.split('-');
      const rYear = parseInt(parts[0]);
      const rMonth = parseInt(parts[1]); // 1-12

      if (monthVal === 'all') {
        if (rYear < parseInt(yearVal)) {
          if (r.type === 'income') balance += r.amount;
          else if (r.type === 'expense') balance -= r.amount;
        }
      } else {
        const selYear = parseInt(yearVal);
        const selMonth = parseInt(monthVal);
        if (rYear < selYear || (rYear === selYear && rMonth < selMonth)) {
          if (r.type === 'income') balance += r.amount;
          else if (r.type === 'expense') balance -= r.amount;
        }
      }
    });

    return balance;
  }

  /**
   * Generates beautiful tables in the ledger log component
   */
  function renderLedgerTable(data) {
    if (!tableBody) return;

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-muted text-center" style="padding:50px; text-align:center;">
            <i data-lucide="info" style="margin:0 auto 12px; width:36px; height:36px; color:var(--text-muted); opacity:0.6;"></i>
            <p style="font-weight:600; color:var(--text-main);">No matching postings stored inside ledger</p>
            <p style="font-size:12.5px; color:var(--text-muted); margin-top:4px;">Adjust month/year select filters or register a new record.</p>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    tableBody.innerHTML = data.map((item, index) => {
      const isIncome = item.type === 'income';
      const indicatorClass = isIncome ? 'badge-financial-type income' : 'badge-financial-type expense';

      return `
        <tr class="ledger-row" id="posting-row-${item.id}" style="animation: fadeIn 0.3s ease forwards; animation-delay: ${index * 0.02}s;">
          <td style="font-weight: 700; color:var(--text-main); font-family:var(--font-heading);">${item.date}</td>
          <td>
            <span class="${indicatorClass}">${item.type}</span>
          </td>
          <td>
            <strong style="color:var(--primary);">${item.category}</strong>
          </td>
          <td style="max-width:240px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; font-size:13px;" title="${item.description}">${item.description}</td>
          <td style="text-align: right; font-family:var(--font-heading); font-weight:700; font-size:14px; color: ${isIncome ? 'var(--color-income)' : 'var(--color-expense)'}">
            ${isIncome ? '+' : '-'}$${item.amount.toFixed(2)}
          </td>
          <td style="font-size:12px; color:var(--text-muted);"><i data-lucide="user-check" style="width:12px; height:12px; display:inline; margin-right:4px;"></i>${item.editor}</td>
          <td>
            <div style="display:flex; gap:8px; justify-content:center;">
              <button class="btn-icon-custom action-view" data-id="${item.id}" title="View Details">
                <i data-lucide="zoom-in"></i>
              </button>
              <button class="btn-icon-custom action-edit" style="color:var(--primary);" data-id="${item.id}" title="Edit Transaction">
                <i data-lucide="edit-2"></i>
              </button>
              <button class="btn-icon-custom delete-action" style="color:var(--danger);" data-id="${item.id}" title="Purge Record">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Event delegation attachments
    document.querySelectorAll(".action-view").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        openViewerModal(id);
      });
    });

    document.querySelectorAll(".action-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        openEditorModal(id);
      });
    });

    document.querySelectorAll(".delete-action").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        triggerDeleteConfirmation(id);
      });
    });
  }

  /**
   * Generates micro HTML horizontal bar graphs representing monthly comparison statistics
   */
  function renderMonthlyBreakdownChart() {
    if (!chartContainer) return;

    if (yearFilterVal === "all") {
      chartContainer.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-muted); font-size:13px;">Graphical breakdown comparisons require selecting a specific year filter bounds.</p>`;
      return;
    }

    if (chartHeadline) {
      chartHeadline.textContent = `Monthly Comparative Cash Flow Breakdown Chart (${yearFilterVal})`;
    }

    const monthsList = [
      { num: "01", name: "January" },
      { num: "02", name: "February" },
      { num: "03", name: "March" },
      { num: "04", name: "April" },
      { num: "05", name: "May" },
      { num: "06", name: "June" },
      { num: "07", name: "July" },
      { num: "08", name: "August" },
      { num: "09", name: "September" },
      { num: "10", name: "October" },
      { num: "11", name: "November" },
      { num: "12", name: "December" }
    ];

    const stats = monthsList.map(m => {
      let mInc = 0;
      let mExp = 0;
      const allTx = MasjidDB.getFinancials() || [];

      allTx.forEach(tx => {
        const parts = tx.date.split('-');
        const itemYear = parts[0];
        const itemMonth = parts[1];

        if (itemYear === yearFilterVal && itemMonth === m.num) {
          if (tx.type === 'income') mInc += tx.amount;
          else if (tx.type === 'expense') mExp += tx.amount;
        }
      });

      return {
        num: m.num,
        name: m.name,
        income: mInc,
        expense: mExp,
        savings: mInc - mExp
      };
    });

    // Find layout scale denominator
    let maxMonthVal = 0;
    stats.forEach(s => {
      if (s.income > maxMonthVal) maxMonthVal = s.income;
      if (s.expense > maxMonthVal) maxMonthVal = s.expense;
    });

    if (maxMonthVal === 0) maxMonthVal = 1000; // default boundary

    chartContainer.innerHTML = stats.map(s => {
      const incPct = (s.income / maxMonthVal) * 100;
      const expPct = (s.expense / maxMonthVal) * 100;
      const isSavingPositive = s.savings >= 0;

      return `
        <div class="chart-bar-item">
          <div class="chart-month-name">${s.name}</div>
          <div style="display:flex; flex-direction:column; gap:6px;">
            <!-- Income Bar Column -->
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="chart-track" style="flex-grow: 1; height: 7px; background-color: var(--bg-light);">
                <div class="chart-fill-inc" style="width: ${incPct}%;"></div>
              </div>
              <span style="font-family:var(--font-mono); font-size:10px; font-weight:700; color:var(--color-income); min-width: 55px; text-align:right;">
                $${s.income.toFixed(0)}
              </span>
            </div>
            <!-- Expense Bar Column -->
            <div style="display:flex; align-items:center; gap:10px;">
              <div class="chart-track" style="flex-grow: 1; height: 7px; background-color: var(--bg-light);">
                <div class="chart-fill-exp" style="width: ${expPct}%;"></div>
              </div>
              <span style="font-family:var(--font-mono); font-size:10px; font-weight:700; color:var(--color-expense); min-width: 55px; text-align:right;">
                $${s.expense.toFixed(0)}
              </span>
            </div>
          </div>
          <div class="chart-amount-labels" style="min-width:70px;">
            <span style="font-weight:700; font-size:12px; color: ${isSavingPositive ? 'var(--color-income)' : 'var(--color-expense)'}">
              ${isSavingPositive ? '+' : ''}$${s.savings.toFixed(0)}
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Action trigger: Launches detailed transaction details memo
   */
  function openViewerModal(id) {
    const list = MasjidDB.getFinancials() || [];
    const item = list.find(tx => tx.id === id);
    if (!item) return;

    const badge = document.getElementById("viewer-badge");
    const amount = document.getElementById("viewer-amount");
    const desc = document.getElementById("viewer-desc");
    const date = document.getElementById("viewer-date");
    const cat = document.getElementById("viewer-category");
    const editor = document.getElementById("viewer-editor");

    if (badge) {
      badge.textContent = item.type.toUpperCase();
      badge.className = item.type === "income" ? "badge-financial-type income" : "badge-financial-type expense";
    }
    if (amount) {
      amount.textContent = `$${item.amount.toFixed(2)}`;
      amount.style.color = item.type === "income" ? "var(--color-income)" : "var(--color-expense)";
    }
    if (desc) desc.textContent = item.description;
    if (date) date.textContent = item.date;
    if (cat) cat.textContent = item.category;
    if (editor) editor.textContent = item.editor;

    if (modalViewer) modalViewer.classList.add("show");
  }

  // Close viewer
  if (viewerCloseBtn) viewerCloseBtn.addEventListener("click", () => modalViewer.classList.remove("show"));
  if (viewerOkBtn) viewerOkBtn.addEventListener("click", () => modalViewer.classList.remove("show"));

  /**
   * Action trigger: Spawns Editor dialog popup preloaded in correct transactional state
   */
  function openEditorModal(id = null) {
    if (!modalEditor) return;

    const formMode = document.getElementById("form-record-mode");
    const formRefId = document.getElementById("form-record-id-ref");
    const dialogTitle = document.getElementById("dialog-record-title");
    
    const formDateInput = document.getElementById("form-record-date");
    const formTypeSelect = document.getElementById("form-record-type");
    const formDescInput = document.getElementById("form-record-description");
    const formAmountInput = document.getElementById("form-record-amount");

    if (id === null) {
      // Adding State
      if (formMode) formMode.value = "add";
      if (formRefId) formRefId.value = "";
      if (dialogTitle) dialogTitle.innerHTML = `<i data-lucide='plus' style='color:var(--secondary)'></i> <span>Add Financial Post</span>`;
      
      if (formDateInput) formDateInput.value = new Date().toISOString().split('T')[0];
      if (formTypeSelect) formTypeSelect.value = "income";
      syncFormCategories("income");
      if (formDescInput) formDescInput.value = "";
      if (formAmountInput) formAmountInput.value = "";
    } else {
      // Editing State
      const list = MasjidDB.getFinancials() || [];
      const item = list.find(tx => tx.id === id);
      if (!item) return;

      if (formMode) formMode.value = "edit";
      if (formRefId) formRefId.value = item.id;
      if (dialogTitle) dialogTitle.innerHTML = `<i data-lucide='edit-3' style='color:var(--secondary)'></i> <span>Edit Valuation Entry</span>`;

      if (formDateInput) formDateInput.value = item.date;
      if (formTypeSelect) formTypeSelect.value = item.type;
      syncFormCategories(item.type);
      
      const formCatSelect = document.getElementById("form-record-category");
      if (formCatSelect) formCatSelect.value = item.category;

      if (formDescInput) formDescInput.value = item.description;
      if (formAmountInput) formAmountInput.value = item.amount;
    }

    if (window.lucide) window.lucide.createIcons();
    modalEditor.classList.add("show");
  }

  // Close editor dialog
  const closeEditorFn = () => modalEditor.classList.remove("show");
  if (modalClose) modalClose.addEventListener("click", closeEditorFn);
  if (modalCancel) modalCancel.addEventListener("click", closeEditorFn);

  // Save changes handler
  if (modalSave) {
    modalSave.addEventListener("click", () => {
      const mode = document.getElementById("form-record-mode").value;
      const refId = document.getElementById("form-record-id-ref").value;

      const dateStr = document.getElementById("form-record-date").value;
      const typeStr = document.getElementById("form-record-type").value;
      const catStr = document.getElementById("form-record-category").value;
      const descStr = document.getElementById("form-record-description").value.trim();
      const amountVal = parseFloat(document.getElementById("form-record-amount").value);

      // Simple Validation Guard
      if (!dateStr || !descStr || isNaN(amountVal) || amountVal <= 0) {
        triggerNotificationToast("Ensure date, description memo, and a valid amount ($ USD) are fully completed.", true);
        return;
      }

      const activeUser = session.name || "Finance Trustee";

      if (mode === "add") {
        MasjidDB.addFinancialRecord({
          date: dateStr,
          type: typeStr,
          category: catStr,
          description: descStr,
          amount: amountVal,
          editor: activeUser
        });
        triggerNotificationToast(`Transaction successfully logged to active ledger under category: ${catStr}.`);
      } else {
        MasjidDB.editFinancialRecord({
          id: refId,
          date: dateStr,
          type: typeStr,
          category: catStr,
          description: descStr,
          amount: amountVal,
          editor: activeUser
        });
        triggerNotificationToast(`Audit entry ${refId} modernized in administrative registers.`);
      }

      closeEditorFn();
      refreshAccountsLedger();
    });
  }

  if (btnAddRecord) {
    btnAddRecord.addEventListener("click", () => openEditorModal(null));
  }

  /**
   * Triggers a visual, non-blocking custom modal notification
   */
  function triggerNotificationToast(text, isError = false) {
    if (!notificationBox) return;

    const textEl = document.getElementById("notification-text");
    if (textEl) textEl.textContent = text;

    notificationBox.style.display = "flex";
    notificationBox.style.backgroundColor = isError ? "rgba(153, 27, 27, 0.08)" : "var(--primary-glow)";
    notificationBox.style.borderLeftColor = isError ? "var(--danger)" : "var(--primary)";
    
    // Auto collapse
    setTimeout(() => {
      notificationBox.style.display = "none";
    }, 4500);
  }

  /**
   * Action trigger: Handles custom structural de-listing with animations and modal confirmations
   */
  function triggerDeleteConfirmation(id) {
    // Check if custom confirmation element exists
    let modal = document.getElementById("custom-confirm-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "custom-confirm-modal";
      modal.className = "dialog-overlay";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="dialog-box" style="max-width: 440px; text-align: center; border: 1px solid rgba(153, 27, 27, 0.2); overflow: hidden; box-shadow: var(--shadow-lg);">
        <div class="dialog-header text-white" style="background: linear-gradient(135deg, #991b1b, #ef4444); justify-content: center; padding: 22px 16px; border-bottom: none; display: flex; align-items: center;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
            <div style="background: rgba(255,255,255,0.2); width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
              <i data-lucide="alert-triangle" style="width: 22px; height: 22px; color: white;"></i>
            </div>
            <h3 style="color: white; font-family: var(--font-heading); font-size: 19px; margin: 0; font-weight: 700;">Are you sure?</h3>
          </div>
        </div>
        <div class="dialog-body" style="padding: 26px 20px; font-size: 14px; text-align: center; line-height: 1.5; background: var(--white);">
          <p style="font-weight: 700; margin-bottom: 8px; font-size: 15px; color: #991b1b;">Deprecate Ledger Posting</p>
          <p style="color: var(--text-muted); margin: 0;">This will permanently delete this posting record from the local storage registry. Dashboard metrics will collapse instantly.</p>
        </div>
        <div class="dialog-footer" style="justify-content: center; gap: 12px; padding: 16px; border-top: 1px solid var(--border-color); background: #fafafa; display: flex;">
          <button class="btn btn-secondary btn-sm" id="confirm-cancel-btn" style="min-width: 100px; padding: 8px 16px; font-weight: 600;">Cancel</button>
          <button class="btn btn-danger btn-sm" id="confirm-delete-btn" style="min-width: 100px; padding: 8px 16px; font-weight: 600; background-color: #991b1b; color: white; border: none;">Delete</button>
        </div>
      </div>
    `;

    modal.classList.add("show");
    
    if (window.lucide) {
      window.lucide.createIcons();
    }

    const cleanup = () => modal.classList.remove("show");

    document.getElementById("confirm-cancel-btn").addEventListener("click", cleanup);
    document.getElementById("confirm-delete-btn").addEventListener("click", () => {
      cleanup();
      
      // Animate Row Collapse on Screen
      const row = document.getElementById(`posting-row-${id}`);
      if (row) {
        row.style.transition = "all 0.4s ease";
        row.style.opacity = "0";
        row.style.transform = "translateX(-20px)";
        setTimeout(() => {
          MasjidDB.deleteFinancialRecord(id);
          triggerNotificationToast("Transaction entry successfully purged from archive list.");
          refreshAccountsLedger();
        }, 400);
      } else {
        MasjidDB.deleteFinancialRecord(id);
        triggerNotificationToast("Transaction entry successfully purged from archive list.");
        refreshAccountsLedger();
      }
    });
  }

  // Bind change reactive listeners for filter dropdown control boxes
  if (filterMonth) filterMonth.addEventListener("change", (e) => { monthFilterVal = e.target.value; refreshAccountsLedger(); });
  if (filterYear) filterYear.addEventListener("change", (e) => { yearFilterVal = e.target.value; refreshAccountsLedger(); });
  if (filterCategory) filterCategory.addEventListener("change", (e) => { categoryFilterVal = e.target.value; refreshAccountsLedger(); });
  if (filterType) filterType.addEventListener("change", (e) => { typeFilterVal = e.target.value; refreshAccountsLedger(); });
  
  // Instant search input binding
  if (searchBar) {
    searchBar.addEventListener("input", (e) => {
      searchVal = e.target.value.toLowerCase().trim();
      refreshAccountsLedger();
    });
  }

  // Filter Resets
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (filterMonth) filterMonth.value = "all";
      if (filterYear) filterYear.value = "2026";
      if (filterCategory) filterCategory.value = "all";
      if (filterType) filterType.value = "all";
      if (searchBar) searchBar.value = "";

      searchVal = "";
      monthFilterVal = "all";
      yearFilterVal = "2026";
      categoryFilterVal = "all";
      typeFilterVal = "all";

      triggerNotificationToast("All selection filters reset to standard active configurations.");
      refreshAccountsLedger();
    });
  }

  /**
   * Action trigger: Populates printable card template frames and triggers window.print() flow
   */
  if (btnPrintReport) {
    btnPrintReport.addEventListener("click", () => {
      // Prior period calculations:
      const prevPeriodBalance = getPreviousPeriodBalance(yearFilterVal, monthFilterVal);

      const items = MasjidDB.getFinancials() || [];
      const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      const filtered = items.filter(tx => {
        const parts = tx.date.split('-');
        const itemYear = parts[0];
        const itemMonth = parts[1];

        const matchYear = (yearFilterVal === "all") || (itemYear === yearFilterVal);
        const matchMonth = (monthFilterVal === "all") || (itemMonth === monthFilterVal);
        const matchCategory = (categoryFilterVal === "all") || (tx.category.toLowerCase() === categoryFilterVal.toLowerCase());
        const matchType = (typeFilterVal === "all") || (tx.type === typeFilterVal);

        return matchYear && matchMonth && matchCategory && matchType;
      });

      // Construct print dataset fields
      const pInterval = document.getElementById("print-filtered-interval");
      const pTimestamp = document.getElementById("print-date-timestamp");
      const pTotalInc = document.getElementById("print-total-income");
      const pTotalExp = document.getElementById("print-total-expense");
      const pTotalSav = document.getElementById("print-total-savings");
      const pTableBody = document.getElementById("print-table-ledger-body");

      if (pInterval) {
        pInterval.textContent = monthFilterVal === 'all' 
          ? `Entire Year of ${yearFilterVal}` 
          : `${mNames[parseInt(monthFilterVal) - 1]} / ${yearFilterVal}`;
      }

      if (pTimestamp) {
        pTimestamp.textContent = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      }

      // Values
      let incTotal = 0;
      let expTotal = 0;
      filtered.forEach(it => {
        if (it.type === 'income') incTotal += it.amount;
        else expTotal += it.amount;
      });

      if (pTotalInc) pTotalInc.textContent = `$${incTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (pTotalExp) pTotalExp.textContent = `$${expTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      if (pTotalSav) pTotalSav.textContent = `$${(prevPeriodBalance + (incTotal - expTotal)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

      if (pTableBody) {
        if (filtered.length === 0) {
          pTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No transaction events are registered in this report range.</td></tr>`;
        } else {
          pTableBody.innerHTML = filtered.map(it => `
            <tr>
              <td><strong>${it.date}</strong></td>
              <td style="text-transform:uppercase; font-weight:bold; color: ${it.type === 'income' ? '#15803d' : '#991b1b'}">${it.type}</td>
              <td><strong>${it.category}</strong></td>
              <td>${it.description}</td>
              <td style="text-align: right; font-weight:bold;">$${it.amount.toFixed(2)}</td>
              <td>${it.editor}</td>
            </tr>
          `).join('');
        }
      }

      // Invoke Print Dialog Box
      window.print();
    });
  }

  /**
   * DOCX Download mechanism using fully-styled, word-compatible rich XML structure
   */
  function downloadLedgerReportDocx(timeLabel, dataset, summary) {
    const reportTitle = `Masjid_Al_Noor_Ledger_Report_${timeLabel.replace(/[^a-zA-Z0-9]/g, "_")}`;

    const rowsHtml = dataset.map(item => `
      <tr>
        <td style="border: 1px solid #ccd6d1; padding: 8px;">${item.date}</td>
        <td style="border: 1px solid #ccd6d1; padding: 8px; font-weight: bold; text-transform: uppercase; color: ${item.type === 'income' ? '#15803d' : '#991b1b'};">${item.type}</td>
        <td style="border: 1px solid #ccd6d1; padding: 8px; font-weight: bold;">${item.category}</td>
        <td style="border: 1px solid #ccd6d1; padding: 8px;">${item.description}</td>
        <td style="border: 1px solid #ccd6d1; padding: 8px; text-align: right; font-weight: bold;">$${item.amount.toFixed(2)}</td>
        <td style="border: 1px solid #ccd6d1; padding: 8px;">${item.editor}</td>
      </tr>
    `).join('');

    const documentContent = `
      <div style="background-color: #ffffff; padding: 15px; border: 8px double #0a4d34; font-family: 'Times New Roman', serif;">
        <div style="text-align: center; border-bottom: 2px solid #b8860b; padding-bottom: 12px; margin-bottom: 20px;">
          <h1 style="color: #0a4d34; font-size: 26px; font-weight: bold; text-transform: uppercase; margin: 0;">Al-Noor Grand Masjid</h1>
          <p style="color: #b8860b; font-size: 13px; font-weight: bold; letter-spacing: 1.5px; text-transform: uppercase; margin: 4px 0 0 0;">Islamic Council Trustees Fiduciary Accounts Report</p>
          <p style="font-size: 10px; font-style: italic; margin-top: 5px; color:#576f62;">"And establish weight in justice and do not make deficient the balance." [55:9]</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px;">
          <tr>
            <td style="padding: 5px 0;"><strong>Report Schedule Range:</strong> ${timeLabel}</td>
            <td style="text-align: right; padding: 5px 0;"><strong>Statement Issued Date:</strong> ${new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0;"><strong>Source Database System:</strong> Certified Local Registry Key</td>
            <td style="text-align: right; padding: 5px 0;"><strong>Fiduciary Reference ID:</strong> ALNOOR-TXM-2026</td>
          </tr>
        </table>

        <div style="margin-bottom: 25px;">
          <div style="background-color: #f7f9f8; border: 1px solid #e2e9e5; padding: 15px;">
            <table style="width: 100%; text-align: center; font-size: 14px;">
              <tr>
                <td>
                  <span style="font-size: 10px; text-transform: uppercase; color: #576f62; font-weight: bold;">Cumulative Period Income</span>
                  <div style="font-size: 20px; font-weight: bold; color: #15803d; margin-top: 5px;">$${summary.income.toFixed(2)}</div>
                </td>
                <td style="border-left: 2px solid #e2e9e5;">
                  <span style="font-size: 10px; text-transform: uppercase; color: #576f62; font-weight: bold;">Cumulative Period Expense</span>
                  <div style="font-size: 20px; font-weight: bold; color: #991b1b; margin-top: 5px;">$${summary.expense.toFixed(2)}</div>
                </td>
                <td style="border-left: 2px solid #e2e9e5;">
                  <span style="font-size: 10px; text-transform: uppercase; color: #576f62; font-weight: bold;">Net Reserves (Savings)</span>
                  <div style="font-size: 20px; font-weight: bold; color: #0a4d34; margin-top: 5px;">$${summary.savings.toFixed(2)}</div>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <h3 style="color: #0a4d34; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid #e2e9e5; padding-bottom: 6px; margin-bottom: 12px;">Audited Register Transaction Lines</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 11px;">
          <thead>
            <tr style="background-color: #0a4d34; color: #ffffff;">
              <th style="padding: 8px; border: 1px solid #ccd6d1; text-align: left;">Date</th>
              <th style="padding: 8px; border: 1px solid #ccd6d1; text-align: left;">Side</th>
              <th style="padding: 8px; border: 1px solid #ccd6d1; text-align: left;">Category</th>
              <th style="padding: 8px; border: 1px solid #ccd6d1; text-align: left;">Detailed Memo</th>
              <th style="padding: 8px; border: 1px solid #ccd6d1; text-align: right;">Amount</th>
              <th style="padding: 8px; border: 1px solid #ccd6d1; text-align: left;">Clerk Action</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <table style="width: 100%; margin-top: 50px; font-size: 11px; text-align: center;">
          <tr>
            <td style="width: 30%; border-top: 1px solid #576f62; padding-top: 8px;">
              <strong>Hazrat Imam</strong><br>Imam & Spiritual Advisory Audit
            </td>
            <td style="width: 5%;"></td>
            <td style="width: 30%; border-top: 1px solid #576f62; padding-top: 8px;">
              <strong>Board Finance Chairman</strong><br>Fiduciary Trustee Seal
            </td>
            <td style="width: 5%;"></td>
            <td style="width: 30%; border-top: 1px solid #576f62; padding-top: 8px;">
              <strong>General Secretary Board</strong><br>Secretariat Authorized Custodian
            </td>
          </tr>
        </table>
      </div>
    `;

    const htmlWrapper = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Masjid Administrative Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
      </head>
      <body>
        ${documentContent}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlWrapper], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTitle}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    triggerNotificationToast(`Islamic financial report downloaded successfully as ${reportTitle}.doc`);
  }

  // Bind Downloads Button clicks
  if (btnDownloadMonthly) {
    btnDownloadMonthly.addEventListener("click", () => {
      if (monthFilterVal === "all") {
        triggerNotificationToast("Please select a specific month to generate a Monthly Report sheet.", true);
        return;
      }

      const items = MasjidDB.getFinancials() || [];
      const mNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const displayLabel = `${mNames[parseInt(monthFilterVal) - 1]} ${yearFilterVal}`;

      const filtered = items.filter(tx => {
        const parts = tx.date.split('-');
        return parts[0] === yearFilterVal && parts[1] === monthFilterVal;
      });

      let incTotal = 0;
      let expTotal = 0;
      filtered.forEach(it => {
        if (it.type === 'income') incTotal += it.amount;
        else expTotal += it.amount;
      });

      downloadLedgerReportDocx(displayLabel, filtered, {
        income: incTotal,
        expense: expTotal,
        savings: incTotal - expTotal
      });
    });
  }

  if (btnDownloadYearly) {
    btnDownloadYearly.addEventListener("click", () => {
      if (yearFilterVal === "all") {
        triggerNotificationToast("Please select a specific year to generate a Yearly Report.", true);
        return;
      }

      const items = MasjidDB.getFinancials() || [];
      const displayLabel = `Full Year - ${yearFilterVal}`;

      const filtered = items.filter(tx => {
        const parts = tx.date.split('-');
        return parts[0] === yearFilterVal;
      });

      let incTotal = 0;
      let expTotal = 0;
      filtered.forEach(it => {
        if (it.type === 'income') incTotal += it.amount;
        else expTotal += it.amount;
      });

      downloadLedgerReportDocx(displayLabel, filtered, {
        income: incTotal,
        expense: expTotal,
        savings: incTotal - expTotal
      });
    });
  }

  // Bootstrap startup execution
  refreshAccountsLedger();
}
