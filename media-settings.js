/**
 * Masjid Management Platform - Media & Social Settings Controller
 * Handles drag-and-drop file uploaders, FileReader API base64 conversions,
 * local storage preservation, and dynamic administrative social link configurations.
 */

import MasjidDB from './js/db.js';

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Auth Guard
  if (!MasjidDB.isAuthenticated()) {
    window.location.href = "/admin-login.html";
    return;
  }

  // Populate sidebar profile information
  populateSidebar();
  initLogoutTrigger();

  // Initialize Media Settings page modules
  initLogoUploader();
  initBannerUploader();
  initSocialManager();
  initMediaBank();
});

// Help Display Sidebar
function populateSidebar() {
  const session = MasjidDB.getCurrentSession();
  const avatarEl = document.getElementById("sidebar-user-avatar");
  const nameEl = document.getElementById("sidebar-user-name");
  const roleEl = document.getElementById("sidebar-user-role");

  if (session) {
    if (avatarEl) {
      const initials = session.username ? session.username.substring(0, 2).toUpperCase() : "AD";
      avatarEl.textContent = initials;
    }
    if (nameEl) nameEl.textContent = session.fullName || session.username;
    if (roleEl) roleEl.textContent = session.role || "Administrator";
  }
}

function initLogoutTrigger() {
  const logoutBtn = document.getElementById("admin-logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      MasjidDB.clearSession();
      window.location.href = "/admin-login.html";
    });
  }
}

// -----------------------------------------------------
// 1. LOGO UPLOADER SYSTEM
// -----------------------------------------------------
function initLogoUploader() {
  const dropzone = document.getElementById("logo-dropzone");
  const fileInput = document.getElementById("logo-file-input");
  const previewImg = document.getElementById("logo-preview-image");
  const placeholder = document.getElementById("logo-placeholder");
  const deleteBtn = document.getElementById("logo-delete-btn");
  const saveBtn = document.getElementById("logo-save-btn");

  let base64Data = localStorage.getItem("masjid_logo") || "";

  // Render initial logo state
  const renderLogo = () => {
    if (base64Data) {
      previewImg.src = base64Data;
      previewImg.style.opacity = "1";
      placeholder.style.display = "none";
      if (deleteBtn) deleteBtn.disabled = false;
    } else {
      previewImg.src = "";
      previewImg.style.opacity = "0";
      placeholder.style.display = "flex";
      if (deleteBtn) deleteBtn.disabled = true;
    }
  };

  renderLogo();

  // Drag & drop triggers
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });
  }

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are permitted.", true);
      return;
    }
    if (file.size > 1024 * 1024) { // 1MB
      showToast("Logo size exceeds 1MB limit. Compress or use a smaller PNG.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      base64Data = e.target.result;
      renderLogo();
      showToast("Logo loaded successfully. Click 'Save Logo' below to write live.");
    };
    reader.readAsDataURL(file);
  };

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!base64Data) {
        showToast("Please upload a logo file first.", true);
        return;
      }
      localStorage.setItem("masjid_logo", base64Data);
      
      // Sync into profile database as well
      const profile = MasjidDB.getProfile() || {};
      profile.logo = base64Data;
      MasjidDB.updateProfile(profile);

      showToast("Website Emblem Logo saved in local storage successfully.");
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      base64Data = "";
      localStorage.removeItem("masjid_logo");
      
      const profile = MasjidDB.getProfile() || {};
      delete profile.logo;
      MasjidDB.updateProfile(profile);

      renderLogo();
      showToast("Custom logo removed. Defaulting to Mosque traditional theme emblem.");
    });
  }
}

// -----------------------------------------------------
// 2. HERO BANNER BACKDROP UPLOADER
// -----------------------------------------------------
function initBannerUploader() {
  const dropzone = document.getElementById("banner-dropzone");
  const fileInput = document.getElementById("banner-file-input");
  const previewImg = document.getElementById("banner-preview-image");
  const placeholder = document.getElementById("banner-placeholder");
  const deleteBtn = document.getElementById("banner-delete-btn");
  const saveBtn = document.getElementById("banner-save-btn");

  let base64Data = localStorage.getItem("masjid_hero_banner") || "";

  const renderBanner = () => {
    if (base64Data) {
      previewImg.src = base64Data;
      previewImg.style.opacity = "1";
      placeholder.style.display = "none";
      if (deleteBtn) deleteBtn.disabled = false;
    } else {
      previewImg.src = "";
      previewImg.style.opacity = "0";
      placeholder.style.display = "flex";
      if (deleteBtn) deleteBtn.disabled = true;
    }
  };

  renderBanner();

  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });
  }

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      showToast("Only image files are permitted.", true);
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      showToast("Banner size exceeds 2MB limit. Please compress to avoid local storage exhaustion.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      base64Data = e.target.result;
      renderBanner();
      showToast("Banner wallpaper uploaded. Press 'Save Banner Backdrop' to apply.");
    };
    reader.readAsDataURL(file);
  };

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      if (!base64Data) {
        showToast("Please select a landscape image backdrop first.", true);
        return;
      }
      localStorage.setItem("masjid_hero_banner", base64Data);
      showToast("Branded Hero Banner successfully applied to public screens.");
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      base64Data = "";
      localStorage.removeItem("masjid_hero_banner");
      renderBanner();
      showToast("Custom banner backdrop reset. Loaded primary majestic emerald wallpaper.");
    });
  }
}

// -----------------------------------------------------
// 3. SOCIAL MEDIA CHANNELS MANAGEMENT
// -----------------------------------------------------
function initSocialManager() {
  const socialGrid = document.getElementById("social-accounts-grid");
  const addBtn = document.getElementById("btn-add-social");
  
  // Modal Elements
  const socialModal = document.getElementById("social-modal");
  const modalClose = document.getElementById("social-modal-close");
  const modalCancel = document.getElementById("social-modal-cancel");
  const modalSave = document.getElementById("social-modal-save");
  const modalTitle = document.getElementById("social-modal-title");

  // Form Elements
  const formId = document.getElementById("form-social-id");
  const formPlatform = document.getElementById("form-social-platform");
  const formTitle = document.getElementById("form-social-title");
  const formUrl = document.getElementById("form-social-url");
  const formIconInput = document.getElementById("form-social-icon-input");
  const iconTrigger = document.getElementById("social-icon-trigger");
  const iconPreview = document.getElementById("form-social-icon-preview");
  const iconPlaceholder = document.getElementById("form-social-icon-placeholder");
  const iconRemove = document.getElementById("social-icon-remove");

  // Delete Modal
  const deleteModal = document.getElementById("delete-modal");
  const deleteConfirm = document.getElementById("delete-modal-confirm");
  const deleteCancel = document.getElementById("delete-modal-cancel");

  let activeSocialIdToDelete = "";
  let tempCustomIconBase64 = "";

  // Get active array
  const getSocialPlatforms = () => {
    return MasjidDB.getData("social_platforms") || [];
  };

  // Set active array
  const saveSocialPlatforms = (data) => {
    MasjidDB.setData("social_platforms", data);
  };

  // Re-render list
  const renderSocialList = () => {
    const list = getSocialPlatforms();
    if (!socialGrid) return;

    if (list.length === 0) {
      socialGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: white; border: 1px solid var(--border-color); border-radius: 8px;" class="text-muted">
          <i data-lucide="share-2" style="width: 48px; height: 48px; color: var(--border-color); margin-bottom: 12px;"></i>
          <p style="font-weight: 500;">No social connections found</p>
          <p style="font-size: 11px; max-width: 320px; margin: 6px auto 0;">Click the "Add Social Connection" button to link YouTube, WhatsApp, Facebook, Instagram, or Telegram channels.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    socialGrid.innerHTML = list.map(item => {
      const platformClass = item.platform.toLowerCase();
      // Branded Icons fallbacks
      let defaultIcon = "share-2";
      if (platformClass === "youtube") defaultIcon = "youtube";
      else if (platformClass === "instagram") defaultIcon = "instagram";
      else if (platformClass === "whatsapp") defaultIcon = "message-circle";
      else if (platformClass === "tiktok") defaultIcon = "music-4"; // Music icon since tiktok doesn't have standard lucide
      else if (platformClass === "facebook") defaultIcon = "facebook";
      else if (platformClass === "telegram") defaultIcon = "send";
      else if (platformClass === "twitter") defaultIcon = "twitter";
      else if (platformClass === "website") defaultIcon = "globe";

      const showCustomIcon = item.customIcon ? true : false;

      return `
        <div class="social-brand-card ${platformClass}">
          <div class="social-header">
            <div class="social-logo-container">
              ${showCustomIcon 
                ? `<img src="${item.customIcon}" alt="${item.title}" />` 
                : `<i data-lucide="${defaultIcon}"></i>`}
            </div>
            <div class="social-details">
              <div class="social-platform-title">${item.title || item.platform}</div>
              <div class="social-link-display">${item.url}</div>
            </div>
          </div>
          <div class="social-actions">
            <button class="btn-social-edit" data-id="${item.id}" title="Edit Link Details">
              <i data-lucide="edit-3" style="width:14px; height:14px; margin-right:4px;"></i> Edit
            </button>
            <button class="btn-social-delete" data-id="${item.id}" title="Revoke Link Access">
              <i data-lucide="trash-2" style="width:14px; height:14px; margin-right:4px;"></i> Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Bind triggers
    document.querySelectorAll(".btn-social-edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        openSocialModal(id);
      });
    });

    document.querySelectorAll(".btn-social-delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        activeSocialIdToDelete = id;
        if (deleteModal) deleteModal.classList.add("show");
      });
    });
  };

  // Modal actions
  const openSocialModal = (id = "") => {
    tempCustomIconBase64 = "";
    resetSocialForm();

    if (id) {
      modalTitle.textContent = "⚙️ Edit Social Connection Channel";
      const list = getSocialPlatforms();
      const current = list.find(x => x.id === id);
      if (current) {
        formId.value = current.id;
        formPlatform.value = current.platform;
        formTitle.value = current.title || "";
        formUrl.value = current.url || "";
        if (current.customIcon) {
          tempCustomIconBase64 = current.customIcon;
          iconPreview.src = tempCustomIconBase64;
          iconPreview.style.opacity = "1";
          iconPlaceholder.style.display = "none";
          iconRemove.disabled = false;
        }
      }
    } else {
      modalTitle.textContent = "🔗 Add Social Connection Link";
      formId.value = "";
    }

    if (socialModal) socialModal.classList.add("show");
  };

  const closeSocialModal = () => {
    if (socialModal) socialModal.classList.remove("show");
  };

  const resetSocialForm = () => {
    formId.value = "";
    formPlatform.value = "youtube";
    formTitle.value = "";
    formUrl.value = "";
    iconPreview.src = "";
    iconPreview.style.opacity = "0";
    iconPlaceholder.style.display = "flex";
    iconRemove.disabled = true;
    tempCustomIconBase64 = "";
  };

  // Add event listener to triggers
  if (addBtn) addBtn.addEventListener("click", () => openSocialModal());
  if (modalClose) modalClose.addEventListener("click", closeSocialModal);
  if (modalCancel) modalCancel.addEventListener("click", closeSocialModal);

  // Custom Icon chooser Inside Modal
  if (iconTrigger && formIconInput) {
    iconTrigger.addEventListener("click", () => formIconInput.click());
    formIconInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
          showToast("Circular logo must be an image", true);
          return;
        }
        if (file.size > 250 * 1024) { // 250kb max for tiny icons
          showToast("Logo too large. Icons should be under 250kb.", true);
          return;
        }

        const r = new FileReader();
        r.onload = (ev) => {
          tempCustomIconBase64 = ev.target.result;
          iconPreview.src = tempCustomIconBase64;
          iconPreview.style.opacity = "1";
          iconPlaceholder.style.display = "none";
          iconRemove.disabled = false;
        };
        r.readAsDataURL(file);
      }
    });
  }

  if (iconRemove) {
    iconRemove.addEventListener("click", () => {
      tempCustomIconBase64 = "";
      iconPreview.src = "";
      iconPreview.style.opacity = "0";
      iconPlaceholder.style.display = "flex";
      iconRemove.disabled = true;
    });
  }

  // Save Modal Form
  if (modalSave) {
    modalSave.addEventListener("click", () => {
      const platform = formPlatform.value;
      const title = formTitle.value.trim() || platform.charAt(0).toUpperCase() + platform.slice(1);
      const url = formUrl.value.trim();
      const id = formId.value;

      if (!url) {
        showToast("Please enter a valid link address first.", true);
        return;
      }

      let list = getSocialPlatforms();
      if (id) {
        // Edit mode
        list = list.map(item => {
          if (item.id === id) {
            return {
              ...item,
              platform,
              title,
              url,
              customIcon: tempCustomIconBase64
            };
          }
          return item;
        });
        showToast("Social connection details successfully updated.");
      } else {
        // Add mode
        const newItem = {
          id: "soc-" + Date.now(),
          platform,
          title,
          url,
          customIcon: tempCustomIconBase64
        };
        list.push(newItem);
        showToast("New social connection channel added successfully!");
      }

      saveSocialPlatforms(list);
      closeSocialModal();
      renderSocialList();
    });
  }

  // Handle deletion confirmation dialog hooks
  if (deleteCancel) {
    deleteCancel.addEventListener("click", () => {
      if (deleteModal) deleteModal.classList.remove("show");
    });
  }

  if (deleteConfirm) {
    deleteConfirm.addEventListener("click", () => {
      if (activeSocialIdToDelete) {
        let list = getSocialPlatforms();
        list = list.filter(x => x.id !== activeSocialIdToDelete);
        saveSocialPlatforms(list);

        if (deleteModal) deleteModal.classList.remove("show");
        renderSocialList();
        showToast("Connection permanently deleted. Dynamic footers updated instantly.");
      }
    });
  }

  // Draw initial social platforms
  renderSocialList();
}

// -----------------------------------------------------
// 4. GENERAL FILE ENCODER BANK (Optional / Helper library)
// -----------------------------------------------------
function initMediaBank() {
  const dropzone = document.getElementById("bank-dropzone");
  const fileInput = document.getElementById("bank-file-input");
  const mediaContainer = document.getElementById("media-bank-grid");
  const countEl = document.getElementById("bank-item-count");

  const getBankImages = () => {
    return JSON.parse(localStorage.getItem("masjid_media_bank")) || [];
  };

  const saveBankImages = (data) => {
    localStorage.setItem("masjid_media_bank", JSON.stringify(data));
  };

  const renderBankList = () => {
    const list = getBankImages();
    if (!mediaContainer) return;

    if (countEl) countEl.textContent = list.length;

    if (list.length === 0) {
      mediaContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 30px; font-size: 12px;">
          No base64 files loaded yet. Drop files above.
        </div>
      `;
      return;
    }

    mediaContainer.innerHTML = list.map((item, idx) => `
      <div style="display:flex; align-items:center; gap:10px; padding:8px; background:var(--bg-light); border:1px solid var(--border-color); border-radius:6px;">
        <img src="${item.data}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; border:1px solid #ddd;" />
        <div style="flex-grow:1; font-size:11px; overflow:hidden;">
          <div style="font-weight:700; color:var(--text-main); text-overflow:ellipsis; white-space:nowrap; max-width:180px;">${item.name}</div>
          <div style="color:var(--text-muted);">${item.size}</div>
        </div>
        <div style="display:flex; gap:5px;">
          <button class="btn btn-outline btn-sm copy-base64" data-idx="${idx}" style="padding:4px 8px; font-size:10px;" title="Copy Code to Clipboard">
            <i data-lucide="copy" style="width:11px; height:11px; float:left; margin-top:2px;"></i> Copy
          </button>
          <button class="btn btn-outline btn-sm delete-bank-img" data-idx="${idx}" style="padding:4px 8px; font-size:10px; border-color:var(--danger); color:var(---danger);" title="Prune asset">
            <i data-lucide="trash-2" style="width:11px; height:11px; color:var(--danger);"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Copy clip action
    document.querySelectorAll(".copy-base64").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        const item = getBankImages()[idx];
        if (item) {
          navigator.clipboard.writeText(item.data).then(() => {
            showToast("Base64 string copied to clipboard! Paste directly into image URL boxes.");
          }).catch(() => {
            showToast("Failed to write to clipboard. Use manually.", true);
          });
        }
      });
    });

    // Delete item action
    document.querySelectorAll(".delete-bank-img").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        let list = getBankImages();
        list.splice(idx, 1);
        saveBankImages(list);
        renderBankList();
        showToast("Asset pruned completely from local cache.");
      });
    });
  };

  // Bind drop events
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());

    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    });
  }

  const handleFile = (file) => {
    if (!file.type.startsWith("image/")) {
      showToast("Requires standard visual format", true);
      return;
    }
    if (file.size > 800 * 1024) {
      showToast("Keep photographs under 800KB for sustainable LocalStorage storage.", true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = getBankImages();
      data.push({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB",
        data: e.target.result
      });
      saveBankImages(data);
      renderBankList();
      showToast("Asset parsed and saved in local Registry.");
    };
    reader.readAsDataURL(file);
  };

  renderBankList();
}

// -----------------------------------------------------
// DYNAMIC NOTIFICATION TOAST BAR HELPER
// -----------------------------------------------------
function showToast(message, isError = false) {
  const toast = document.getElementById("admin-notification-toast");
  const msgEl = document.getElementById("admin-notification-message");

  if (toast && msgEl) {
    msgEl.textContent = message;
    toast.className = "admin-alert-banner"; // reset class
    
    if (isError) {
      toast.style.backgroundColor = "#fee2e2";
      toast.style.color = "#991b1b";
      toast.style.borderLeftColor = "#ef4444";
    } else {
      toast.style.backgroundColor = "var(--primary)";
      toast.style.color = "var(--secondary-light)";
      toast.style.borderLeftColor = "var(--secondary)";
    }
    
    toast.classList.remove("hidden");
    // Scroll list to view
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 5000);
  }
}
