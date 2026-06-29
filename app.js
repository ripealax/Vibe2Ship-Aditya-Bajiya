// Community Hero Application Logic

// Default Preloaded Issues Database
const DEFAULT_ISSUES = [
  {
    id: "issue-1",
    title: "Dangerous Waterlogged Pothole",
    desc: "A massive pothole in the middle of the road, measuring roughly 3x3 feet. It fills with water when it rains, making it impossible for drivers to gauge the depth, causing vehicles to bottom out.",
    category: "Road Damage",
    severity: "high",
    status: "reported",
    lat: 40.7152,
    lng: -74.0091,
    address: "Intersection of Broadway & Chambers St, NYC",
    image: "assets/pothole.png",
    votes: 8,
    voters: [],
    comments: [
      { author: "Jane Cooper", text: "Blew a tire here yesterday. Be extremely careful!" },
      { author: "Robert Fox", text: "Reported this twice to the old municipal portal. Glad we have Community Hero now." }
    ],
    reportedBy: "Marcus Vance",
    date: "2026-06-25T14:30:00Z"
  },
  {
    id: "issue-2",
    title: "Unsafe Dark Streetlight Corridor",
    desc: "Two major streetlights are completely out, leaving a 150-meter stretch of the sidewalk completely dark. Very unsafe for pedestrians, especially after dark near the train station entrance.",
    category: "Infrastructure",
    severity: "medium",
    status: "scheduled",
    lat: 40.7093,
    lng: -74.0021,
    address: "15 Wall Street (opposite Subway exit)",
    image: "assets/streetlight.png",
    votes: 14,
    voters: [],
    comments: [
      { author: "Esther Howard", text: "I walk this path every night from the gym. It is genuinely terrifying." }
    ],
    reportedBy: "Elena Rostova",
    date: "2026-06-24T21:15:00Z"
  },
  {
    id: "issue-3",
    title: "Commercial Waste & Garbage Overflow",
    desc: "Piles of trash bags and commercial waste containers overflowing onto the pedestrian walkway. Attracting rodents and emitting a foul smell. Blocks access for strollers and wheelchairs.",
    category: "Waste Management",
    severity: "high",
    status: "verified",
    lat: 40.7201,
    lng: -74.0154,
    address: "128 Greenwich St (near Deli corner)",
    image: "assets/trash.png",
    votes: 21,
    voters: [],
    comments: [],
    reportedBy: "Alex Rivera",
    date: "2026-06-25T08:00:00Z"
  }
];

// Mock Leaderboard Data
const DEFAULT_LEADERBOARD = [
  { name: "Sarah Jenkins", points: 2850, level: "Civic Champion", avatar: "S" },
  { name: "Marcus Vance", points: 2100, level: "Civic Champion", avatar: "M" },
  { name: "Alex Rivera", points: 1450, level: "Community Guard", avatar: "A", isCurrentUser: true },
  { name: "Elena Rostova", points: 1200, level: "Community Guard", avatar: "E" },
  { name: "David Chen", points: 950, level: "Neighborhood Watch", avatar: "D" },
  { name: "Maya Patel", points: 720, level: "Neighborhood Watch", avatar: "M" }
];

// State variables
let state = {
  issues: [],
  leaderboard: [],
  userRole: "citizen", // "citizen" or "authority"
  currentUser: {
    name: "Alex Rivera",
    points: 1450,
    level: "Community Guard",
    avatar: "A",
    reportsCount: 3,
    verifiesCount: 14,
    resolutionsCount: 8
  },
  wizardData: {
    step: 1,
    image: "",
    desc: "",
    title: "",
    category: "Road Damage",
    severity: "low",
    tags: [],
    lat: 40.7128,
    lng: -74.0060,
    address: ""
  },
  map: null,
  pickerMap: null,
  pickerMarker: null,
  mapMarkers: {},
  monthlyChart: null,
  categoryChart: null
};

// Initialize App
window.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  initNavigation();
  initMap();
  initFeed();
  initWizard();
  initCharts();
  initGamification();
  initAuthorityConsole();
  lucide.createIcons();
});

// Database / LocalStorage Management
function initDatabase() {
  const localIssues = localStorage.getItem("ch_issues");
  if (!localIssues) {
    localStorage.setItem("ch_issues", JSON.stringify(DEFAULT_ISSUES));
    state.issues = [...DEFAULT_ISSUES];
  } else {
    state.issues = JSON.parse(localIssues);
  }

  const localLeaderboard = localStorage.getItem("ch_leaderboard");
  if (!localLeaderboard) {
    localStorage.setItem("ch_leaderboard", JSON.stringify(DEFAULT_LEADERBOARD));
    state.leaderboard = [...DEFAULT_LEADERBOARD];
  } else {
    state.leaderboard = JSON.parse(localLeaderboard);
  }

  const localUser = localStorage.getItem("ch_current_user");
  if (localUser) {
    state.currentUser = JSON.parse(localUser);
  } else {
    localStorage.setItem("ch_current_user", JSON.stringify(state.currentUser));
  }
}

function saveIssues() {
  localStorage.setItem("ch_issues", JSON.stringify(state.issues));
}

function saveUser() {
  localStorage.setItem("ch_current_user", JSON.stringify(state.currentUser));
  
  // Also update leaderboard score
  const idx = state.leaderboard.findIndex(u => u.isCurrentUser);
  if (idx !== -1) {
    state.leaderboard[idx].points = state.currentUser.points;
    state.leaderboard[idx].level = state.currentUser.level;
    localStorage.setItem("ch_leaderboard", JSON.stringify(state.leaderboard));
  }
}

// Navigation / View Swapping
function initNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const viewSections = document.querySelectorAll(".view-section");
  const mainTitle = document.getElementById("main-view-title");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetView = item.getAttribute("data-target");
      
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      
      viewSections.forEach(section => {
        section.classList.remove("active");
        if (section.id === targetView) {
          section.classList.add("active");
        }
      });

      // Update Header title
      if (item.querySelector("span")) {
        mainTitle.textContent = item.querySelector("span").textContent + " Overview";
      }

      // Special re-draw checks for maps or charts when visible
      if (targetView === "dashboard-view") {
        setTimeout(() => {
          if (state.map) state.map.invalidateSize();
        }, 100);
      } else if (targetView === "report-view") {
        setTimeout(() => {
          if (state.pickerMap) state.pickerMap.invalidateSize();
        }, 100);
      } else if (targetView === "analytics-view") {
        updateAnalyticsData();
      } else if (targetView === "gamify-view") {
        renderLeaderboard();
      } else if (targetView === "authority-view") {
        renderWorkOrders();
      }
    });
  });

  // Role Toggles
  const citizenBtn = document.getElementById("role-citizen-btn");
  const authorityBtn = document.getElementById("role-authority-btn");
  const authNav = document.querySelector(".nav-item.authority-only");

  citizenBtn.addEventListener("click", () => {
    citizenBtn.classList.add("active");
    authorityBtn.classList.remove("active");
    authNav.style.display = "none";
    state.userRole = "citizen";
    showToast("Role Switched", "You are now in Citizen Mode. Report and verify issues.", "info");

    // If currently on authority view, bounce back to dashboard
    if (document.querySelector(".nav-item.active").getAttribute("data-target") === "authority-view") {
      document.querySelector('.nav-item[data-target="dashboard-view"]').click();
    }
  });

  authorityBtn.addEventListener("click", () => {
    authorityBtn.classList.add("active");
    citizenBtn.classList.remove("active");
    authNav.style.display = "block";
    state.userRole = "authority";
    showToast("Role Switched", "You are now in Authority Mode. Access municipal dashboard.", "success");
    
    // Auto navigate to authority view
    authNav.click();
  });
}

// Leaflet Map Initialization & Rendering
function initMap() {
  // Center in Manhattan area
  state.map = L.map("map", {
    zoomControl: false
  }).setView([40.7128, -74.0060], 14);

  // CartoDB Dark Matter tiles (premium dark mode map styling)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(state.map);

  // Custom Zoom Control positioning
  L.control.zoom({
    position: 'bottomright'
  }).addTo(state.map);

  renderMapMarkers();
}

function renderMapMarkers() {
  // Clear existing markers
  for (let key in state.mapMarkers) {
    state.map.removeLayer(state.mapMarkers[key]);
  }
  state.mapMarkers = {};

  // Redraw
  state.issues.forEach(issue => {
    let pinColor = '#ef4444'; // default reported red
    if (issue.status === 'verified') pinColor = '#f59e0b'; // yellow
    if (issue.status === 'scheduled') pinColor = '#3b82f6'; // blue
    if (issue.status === 'resolved') pinColor = '#10b981'; // green

    // Elegant glowing HTML/CSS Marker Pin
    const customMarkerIcon = L.divIcon({
      html: `<div style="background-color: ${pinColor}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 10px ${pinColor}; cursor: pointer;"></div>`,
      className: 'custom-leaflet-marker',
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    const marker = L.marker([issue.lat, issue.lng], { icon: customMarkerIcon }).addTo(state.map);
    
    // Popup construction
    const popupContent = `
      <div class="map-card-popup">
        <h4>${issue.title}</h4>
        <img src="${issue.image || 'assets/pothole.png'}" onerror="this.src='assets/pothole.png'">
        <div class="popup-meta">
          <span>${issue.category}</span>
          <span style="color: ${pinColor};" class="popup-status">${issue.status}</span>
        </div>
        <button onclick="zoomToIssueFeed('${issue.id}')" style="width: 100%; border: none; background: linear-gradient(135deg, #00f2fe, #8b5cf6); color: black; font-weight:600; padding: 0.35rem 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem;">View Details</button>
      </div>
    `;

    marker.bindPopup(popupContent);
    state.mapMarkers[issue.id] = marker;
  });
}

// Redirect and highlight issue card from map click
window.zoomToIssueFeed = function(issueId) {
  // Navigate to feed
  document.querySelector('.nav-item[data-target="feed-view"]').click();
  
  // Apply filter 'all' to show the highlighted item
  document.getElementById("filter-category").value = "all";
  document.getElementById("filter-status").value = "all";
  renderFeedIssues();
  
  // Find card and scroll
  setTimeout(() => {
    const targetCard = document.getElementById(`feed-card-${issueId}`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetCard.style.borderColor = 'var(--primary)';
      targetCard.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.4)';
      setTimeout(() => {
        targetCard.style.borderColor = 'var(--border-glass)';
        targetCard.style.boxShadow = 'none';
      }, 3000);
    }
  }, 200);
};

// Feed Operations
function initFeed() {
  const searchInput = document.getElementById("feed-search-input");
  const filterCat = document.getElementById("filter-category");
  const filterStat = document.getElementById("filter-status");

  searchInput.addEventListener("input", renderFeedIssues);
  filterCat.addEventListener("change", renderFeedIssues);
  filterStat.addEventListener("change", renderFeedIssues);

  renderFeedIssues();
  renderDashboardActivity();
}

function renderFeedIssues() {
  const container = document.getElementById("feed-issues-grid");
  const searchVal = document.getElementById("feed-search-input").value.toLowerCase();
  const catVal = document.getElementById("filter-category").value;
  const statVal = document.getElementById("filter-status").value;

  container.innerHTML = "";

  const filtered = state.issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(searchVal) || 
                          issue.desc.toLowerCase().includes(searchVal) ||
                          issue.category.toLowerCase().includes(searchVal);
    const matchesCat = catVal === "all" || issue.category === catVal;
    const matchesStat = statVal === "all" || issue.status === statVal;

    return matchesSearch && matchesCat && matchesStat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: span 3;">
        <i data-lucide="inbox"></i>
        <p>No community reports match your filter criteria.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Render cards sorted by date (newest first)
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(issue => {
    const hasVoted = issue.voters.includes(state.currentUser.name);
    
    // Status colors mapping
    let statusText = issue.status;
    let statusColor = "var(--status-reported)";
    let statusBg = "var(--status-reported-bg)";
    if (issue.status === 'verified') { statusColor = "var(--status-verified)"; statusBg = "var(--status-verified-bg)"; }
    if (issue.status === 'scheduled') { statusColor = "var(--status-scheduled)"; statusBg = "var(--status-scheduled-bg)"; }
    if (issue.status === 'resolved') { statusColor = "var(--status-resolved)"; statusBg = "var(--status-resolved-bg)"; }

    const card = document.createElement("div");
    card.className = "issue-card";
    card.id = `feed-card-${issue.id}`;
    
    card.innerHTML = `
      <div class="card-media">
        <span class="status-indicator-badge" style="color: ${statusColor}; background: ${statusBg};">${statusText}</span>
        <span class="severity-badge severity-${issue.severity}">${issue.severity}</span>
        <img src="${issue.image || 'assets/pothole.png'}" alt="Issue visual content" onerror="this.src='assets/pothole.png'">
      </div>
      
      <div class="card-details">
        <div class="card-meta">
          <span>By ${issue.reportedBy}</span>
          <span>${formatDate(issue.date)}</span>
        </div>
        <h4 class="card-title">${issue.title}</h4>
        <p class="card-desc">${issue.desc}</p>
        
        <div class="card-tags">
          <span class="tag">${issue.category}</span>
          <span class="tag"><i data-lucide="map-pin" style="width:10px; height:10px; display:inline-block; margin-right:2px;"></i> ${issue.address.split(",")[0]}</span>
        </div>

        <div class="card-footer">
          <div class="action-buttons">
            <button class="btn-verify ${hasVoted ? 'verified-active' : ''}" onclick="voteIssue('${issue.id}')">
              <i data-lucide="shield-check" style="width: 14px; height: 14px;"></i>
              <span id="vote-count-${issue.id}">${issue.votes} Verifications</span>
            </button>
            <button class="btn-comment-icon" onclick="toggleCommentsSection('${issue.id}')">
              <i data-lucide="message-square" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </div>

        <!-- Inline Comments panel -->
        <div class="comments-panel" id="comments-section-${issue.id}" style="display: none;">
          <div class="comments-list-inline" id="comments-list-${issue.id}">
            ${renderCommentsHTML(issue.comments)}
          </div>
          <div class="comment-input-row">
            <input type="text" placeholder="Add verification details..." id="comment-field-${issue.id}">
            <button onclick="submitComment('${issue.id}')">Post</button>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
  lucide.createIcons();
}

function renderCommentsHTML(comments) {
  if (comments.length === 0) return `<span class="empty-state" style="padding:0.25rem; font-size:0.7rem;">No comments yet. Be first to add verification.</span>`;
  return comments.map(c => `
    <div class="comment-item-inline">
      <span class="comment-author">${c.author}:</span>
      <span>${c.text}</span>
    </div>
  `).join("");
}

window.toggleCommentsSection = function(issueId) {
  const panel = document.getElementById(`comments-section-${issueId}`);
  panel.style.display = panel.style.display === "none" ? "flex" : "none";
};

window.submitComment = function(issueId) {
  const input = document.getElementById(`comment-field-${issueId}`);
  const text = input.value.trim();
  if (!text) return;

  const issue = state.issues.find(i => i.id === issueId);
  if (issue) {
    issue.comments.push({
      author: state.currentUser.name,
      text: text
    });
    saveIssues();
    
    // Update comments UI inline
    const list = document.getElementById(`comments-list-${issueId}`);
    list.innerHTML = renderCommentsHTML(issue.comments);
    input.value = "";
    
    // Add XP for comment verification helper
    awardPoints(10, "Added validation detail comment");
    showToast("Comment Posted", "+10 XP Awarded for verification details.", "success");
    renderDashboardActivity();
  }
};

window.voteIssue = function(issueId) {
  const issue = state.issues.find(i => i.id === issueId);
  if (!issue) return;

  const userIdx = issue.voters.indexOf(state.currentUser.name);
  if (userIdx !== -1) {
    // Unvote
    issue.votes--;
    issue.voters.splice(userIdx, 1);
    showToast("Verification Revoked", "You retracted verification for this issue.", "info");
  } else {
    // Vote
    issue.votes++;
    issue.voters.push(state.currentUser.name);
    
    // If it reaches a threshold of 10 votes, auto verify status!
    if (issue.status === 'reported' && issue.votes >= 10) {
      issue.status = 'verified';
      showToast("Issue Verified!", `"${issue.title}" has reached 10 community validations and is now verified.`, "success");
      renderMapMarkers();
      renderWorkOrders();
    }
    
    awardPoints(15, "Verified local community report");
    showToast("Report Verified", "+15 XP Added to your profile.", "success");
  }

  saveIssues();
  renderFeedIssues();
  renderMapMarkers();
};

function renderDashboardActivity() {
  const list = document.getElementById("dashboard-activity-list");
  list.innerHTML = "";

  // Combine actions to simulate a dynamic neighborhood feed
  const feedEvents = [];
  
  state.issues.forEach(issue => {
    // Report event
    feedEvents.push({
      type: "report",
      title: "New Report Filed",
      desc: `"${issue.title}" reported by ${issue.reportedBy}`,
      time: issue.date,
      color: "var(--status-reported)"
    });
    
    // Verify event (if has votes)
    if (issue.votes > 0) {
      feedEvents.push({
        type: "verify",
        title: "Community Validations",
        desc: `"${issue.title}" received community verifications (Total: ${issue.votes})`,
        time: new Date(new Date(issue.date).getTime() + 3600000).toISOString(),
        color: "var(--status-verified)"
      });
    }

    // Resolve event
    if (issue.status === "resolved") {
      feedEvents.push({
        type: "resolve",
        title: "Issue Resolved",
        desc: `"${issue.title}" resolved by Municipal Services`,
        time: new Date(new Date(issue.date).getTime() + 86400000).toISOString(),
        color: "var(--status-resolved)"
      });
    }
  });

  // Sort and display top 6 recent
  feedEvents
    .sort((a,b) => new Date(b.time) - new Date(a.time))
    .slice(0, 6)
    .forEach(e => {
      const li = document.createElement("li");
      li.className = "activity-item";
      li.innerHTML = `
        <div class="activity-dot" style="color: ${e.color};"></div>
        <div class="activity-info">
          <span class="activity-title">${e.title}</span>
          <span class="activity-desc">${e.desc}</span>
          <span class="activity-time">${formatDate(e.time)}</span>
        </div>
      `;
      list.appendChild(li);
    });

  // Update overall Dashboard count stats
  document.getElementById("stat-active-issues").textContent = state.issues.filter(i => i.status !== "resolved").length;
  document.getElementById("stat-resolved-issues").textContent = state.issues.filter(i => i.status === "resolved").length;
  document.getElementById("stat-citizens").textContent = state.leaderboard.length + 338;
}

// Wizard / Report Issue Form Wizard
function initWizard() {
  const wizardFile = document.getElementById("wizard-file-input");
  const uploadZone = document.getElementById("media-upload-zone");
  const previewContainer = document.getElementById("upload-preview-container");
  const previewImg = document.getElementById("upload-preview-img");
  const clearPreviewBtn = document.getElementById("btn-clear-preview");

  const btnPrev = document.getElementById("btn-wizard-prev");
  const btnNext = document.getElementById("btn-wizard-next");
  const stepIndicators = document.querySelectorAll(".step-indicator");
  const stepContents = document.querySelectorAll(".wizard-step-content");

  // Handle Drag & Drop / File triggers
  uploadZone.addEventListener("click", () => wizardFile.click());
  wizardFile.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = function(evt) {
        setWizardPreview(evt.target.result);
      };
      reader.readAsDataURL(file);
    }
  });

  clearPreviewBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    state.wizardData.image = "";
    previewContainer.style.display = "none";
    uploadZone.style.display = "block";
    wizardFile.value = "";
  });

  // Sample quick pictures buttons
  document.getElementById("quick-pic-pothole").addEventListener("click", () => setWizardPreview("assets/pothole.png"));
  document.getElementById("quick-pic-light").addEventListener("click", () => setWizardPreview("assets/streetlight.png"));
  document.getElementById("quick-pic-trash").addEventListener("click", () => setWizardPreview("assets/trash.png"));

  function setWizardPreview(src) {
    state.wizardData.image = src;
    previewImg.src = src;
    uploadZone.style.display = "none";
    previewContainer.style.display = "block";
  }

  // AI Assist button click
  const btnAi = document.getElementById("btn-ai-trigger");
  const aiScanner = document.getElementById("ai-scanner-box");
  const aiOutput = document.getElementById("ai-scanner-output");

  btnAi.addEventListener("click", () => {
    const desc = document.getElementById("wizard-desc").value.trim();
    if (!desc) {
      showToast("Invalid Description", "Please enter an issue description first so AI can analyze it.", "warning");
      return;
    }

    aiScanner.classList.add("scanning");
    btnAi.disabled = true;
    btnAi.textContent = "AI Scanning Description...";

    setTimeout(() => {
      aiScanner.classList.remove("scanning");
      btnAi.disabled = false;
      btnAi.innerHTML = `<i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> Analyze Description`;
      lucide.createIcons();

      // Simple keyword parser
      const descLower = desc.toLowerCase();
      let category = "Utilities";
      let severity = "low";
      let tags = ["Maintenance", "General"];
      let title = "General Maintenance Issue";

      if (descLower.includes("pothole") || descLower.includes("road") || descLower.includes("pavement") || descLower.includes("asphalt")) {
        category = "Road Damage";
        severity = "high";
        tags = ["Pothole", "Road Hazard", "Urgent Repairs"];
        title = "Pothole Damaging Vehicles";
      } else if (descLower.includes("light") || descLower.includes("dark") || descLower.includes("bulb") || descLower.includes("lamp")) {
        category = "Infrastructure";
        severity = "medium";
        tags = ["Streetlight", "Dark Zone", "Public Safety"];
        title = "Damaged Streetlight Bulbs";
      } else if (descLower.includes("trash") || descLower.includes("garbage") || descLower.includes("waste") || descLower.includes("smell") || descLower.includes("dump")) {
        category = "Waste Management";
        severity = "high";
        tags = ["Sanitation", "Health Risk", "Littering"];
        title = "Illegal Garbage Dump";
      }

      state.wizardData.category = category;
      state.wizardData.severity = severity;
      state.wizardData.tags = tags;
      state.wizardData.title = title;

      // Update confirmed fields in DOM
      document.getElementById("wizard-title").value = title;
      document.getElementById("wizard-category").value = category;

      // Update AI results card
      document.getElementById("ai-res-category").textContent = category;
      document.getElementById("ai-res-severity").textContent = severity.toUpperCase();
      document.getElementById("ai-res-tags").innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join(" ");
      aiOutput.style.display = "block";

      showToast("AI Scanning Complete", "Optimal category and tags suggested successfully.", "success");
    }, 1500);
  });

  // GPS Location Pin triggers
  document.getElementById("btn-detect-gps").addEventListener("click", () => {
    // Simulate GPS locate
    state.wizardData.lat = 40.7185;
    state.wizardData.lng = -74.0122;
    state.wizardData.address = "182 Greenwich St, Manhattan, NYC";
    
    document.getElementById("wizard-address").value = state.wizardData.address;

    if (state.pickerMarker) {
      state.pickerMarker.setLatLng([40.7185, -74.0122]);
    } else {
      state.pickerMarker = L.marker([40.7185, -74.0122]).addTo(state.pickerMap);
    }
    state.pickerMap.setView([40.7185, -74.0122], 16);
    showToast("GPS Location Acquired", "Auto-detected coordinate near Greenwich St.", "info");
  });

  // Next & Prev steps navigations
  btnNext.addEventListener("click", () => {
    let curStep = state.wizardData.step;

    if (curStep === 1) {
      if (!state.wizardData.image) {
        showToast("Media Required", "Please upload a photo or select a sample image before proceeding.", "warning");
        return;
      }
      goToWizardStep(2);
    } else if (curStep === 2) {
      const descVal = document.getElementById("wizard-desc").value.trim();
      const titleVal = document.getElementById("wizard-title").value.trim();
      
      if (!descVal || !titleVal) {
        showToast("Missing Fields", "Please complete the title and description.", "warning");
        return;
      }
      
      state.wizardData.desc = descVal;
      state.wizardData.title = titleVal;
      state.wizardData.category = document.getElementById("wizard-category").value;
      
      goToWizardStep(3);
      // Initialize map once step 3 loads
      setTimeout(initPickerMap, 150);
    } else if (curStep === 3) {
      const addrVal = document.getElementById("wizard-address").value.trim();
      if (!addrVal) {
        showToast("Location Details Needed", "Please provide a descriptive address or landmark.", "warning");
        return;
      }
      state.wizardData.address = addrVal;
      
      // Submit issue & update local storage
      submitWizardReport();
      goToWizardStep(4);
    } else if (curStep === 4) {
      // Done - navigate back to dashboard overview
      resetWizard();
      document.querySelector('.nav-item[data-target="dashboard-view"]').click();
    }
  });

  btnPrev.addEventListener("click", () => {
    if (state.wizardData.step > 1 && state.wizardData.step < 4) {
      goToWizardStep(state.wizardData.step - 1);
    }
  });

  function goToWizardStep(stepNum) {
    state.wizardData.step = stepNum;

    // Update footer buttons
    if (stepNum === 1) {
      btnPrev.style.visibility = "hidden";
      btnNext.innerHTML = `Next <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>`;
    } else if (stepNum === 4) {
      btnPrev.style.visibility = "hidden";
      btnNext.innerHTML = `Go To Dashboard <i data-lucide="check" style="width: 16px; height: 16px;"></i>`;
      document.getElementById("wizard-footer-nav").style.justifyContent = "center";
    } else {
      btnPrev.style.visibility = "visible";
      btnNext.innerHTML = `Next <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>`;
      document.getElementById("wizard-footer-nav").style.justifyContent = "space-between";
    }

    // Toggle Content Views
    stepContents.forEach(content => {
      content.classList.remove("active");
      if (content.id === `step-content-${stepNum}`) {
        content.classList.add("active");
      }
    });

    // Toggle dots active states
    stepIndicators.forEach(ind => {
      const indStep = parseInt(ind.getAttribute("data-step"));
      ind.classList.remove("active", "completed");
      if (indStep === stepNum) {
        ind.classList.add("active");
      } else if (indStep < stepNum) {
        ind.classList.add("completed");
      }
    });
    lucide.createIcons();
  }

  function initPickerMap() {
    if (state.pickerMap) return;

    state.pickerMap = L.map("picker-map", {
      zoomControl: false
    }).setView([40.7128, -74.0060], 14);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB'
    }).addTo(state.pickerMap);

    state.pickerMarker = L.marker([40.7128, -74.0060], { draggable: true }).addTo(state.pickerMap);
    
    // Drag/Click updates state coordinates
    state.pickerMarker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      state.wizardData.lat = pos.lat;
      state.wizardData.lng = pos.lng;
    });

    state.pickerMap.on("click", (e) => {
      state.pickerMarker.setLatLng(e.latlng);
      state.wizardData.lat = e.latlng.lat;
      state.wizardData.lng = e.latlng.lng;
    });
  }

  function submitWizardReport() {
    const newIssue = {
      id: "issue-" + Date.now(),
      title: state.wizardData.title,
      desc: state.wizardData.desc,
      category: state.wizardData.category,
      severity: state.wizardData.severity,
      status: "reported",
      lat: state.wizardData.lat,
      lng: state.wizardData.lng,
      address: state.wizardData.address,
      image: state.wizardData.image,
      votes: 1,
      voters: [state.currentUser.name],
      comments: [],
      reportedBy: state.currentUser.name,
      date: new Date().toISOString()
    };

    state.issues.push(newIssue);
    saveIssues();

    // Reward points
    awardPoints(50, "Reported local community issue");
    state.currentUser.reportsCount++;
    saveUser();

    // Refresh dashboard feeds & maps
    renderFeedIssues();
    renderMapMarkers();
    renderDashboardActivity();
    renderWorkOrders();
  }

  function resetWizard() {
    state.wizardData = {
      step: 1,
      image: "",
      desc: "",
      title: "",
      category: "Road Damage",
      severity: "low",
      tags: [],
      lat: 40.7128,
      lng: 40.7128,
      address: ""
    };

    document.getElementById("wizard-file-input").value = "";
    document.getElementById("wizard-desc").value = "";
    document.getElementById("wizard-title").value = "";
    document.getElementById("wizard-address").value = "";
    document.getElementById("upload-preview-container").style.display = "none";
    document.getElementById("media-upload-zone").style.display = "block";
    document.getElementById("ai-scanner-output").style.display = "none";

    if (state.pickerMarker) {
      state.pickerMap.removeLayer(state.pickerMarker);
      state.pickerMarker = null;
    }
    if (state.pickerMap) {
      state.pickerMap.remove();
      state.pickerMap = null;
    }

    goToWizardStep(1);
  }
}

// ChartJS Renderings
function initCharts() {
  const monthlyCtx = document.getElementById("monthlyChart").getContext("2d");
  const categoryCtx = document.getElementById("categoryChart").getContext("2d");

  // Chart configuration
  state.monthlyChart = new Chart(monthlyCtx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Reported Issues',
          data: [12, 19, 15, 22, 28, 38],
          backgroundColor: 'rgba(139, 92, 246, 0.45)',
          borderColor: 'var(--secondary)',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'Resolved Issues',
          data: [8, 14, 11, 19, 21, 31],
          backgroundColor: 'rgba(0, 242, 254, 0.45)',
          borderColor: 'var(--primary)',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#94a3b8' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8' }
        }
      },
      plugins: {
        legend: { labels: { color: '#f8fafc', font: { family: 'Inter' } } }
      }
    }
  });

  state.categoryChart = new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
      labels: ['Road Damage', 'Infrastructure', 'Waste Management', 'Utilities'],
      datasets: [{
        data: [0, 0, 0, 0], // loaded dynamically
        backgroundColor: [
          '#ef4444',
          '#8b5cf6',
          '#f59e0b',
          '#3b82f6'
        ],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#f8fafc', font: { family: 'Inter' } }
        }
      }
    }
  });

  updateAnalyticsData();
}

function updateAnalyticsData() {
  if (!state.categoryChart) return;

  const counts = {
    "Road Damage": 0,
    "Infrastructure": 0,
    "Waste Management": 0,
    "Utilities": 0
  };

  state.issues.forEach(i => {
    if (counts[i.category] !== undefined) {
      counts[i.category]++;
    } else {
      counts["Utilities"]++;
    }
  });

  state.categoryChart.data.datasets[0].data = [
    counts["Road Damage"],
    counts["Infrastructure"],
    counts["Waste Management"],
    counts["Utilities"]
  ];
  state.categoryChart.update();
}

// Gamification Profiles & Leaderboards
function initGamification() {
  updateGamificationUI();
  renderLeaderboard();
}

function awardPoints(pts, reason) {
  state.currentUser.points += pts;
  
  // Check level up (Level boundaries: Lvl 3 = 1000XP, Lvl 4 = 2000XP)
  let level = "Neighborhood Watch";
  if (state.currentUser.points >= 2000) {
    level = "Civic Champion";
  } else if (state.currentUser.points >= 1000) {
    level = "Community Guard";
  }
  
  if (level !== state.currentUser.level) {
    state.currentUser.level = level;
    setTimeout(() => {
      showToast("RANK UP!", `Congratulations! You leveled up to ${level}!`, "success");
    }, 1000);
  }

  saveUser();
  updateGamificationUI();
  renderLeaderboard();
}

function updateGamificationUI() {
  // Nav profile
  document.getElementById("nav-avatar").textContent = state.currentUser.avatar;
  document.getElementById("nav-username").textContent = state.currentUser.name;
  document.getElementById("nav-points").innerHTML = `<i data-lucide="sparkles" style="display:inline; width:12px; height:12px; margin-right:2px; vertical-align:middle; color:var(--primary)"></i> ${state.currentUser.points.toLocaleString()} XP`;

  // Hero page profile
  document.getElementById("badge-avatar-large").textContent = state.currentUser.avatar;
  document.getElementById("badge-username-large").textContent = state.currentUser.name;
  document.getElementById("badge-level-tag").textContent = `Level 3 • ${state.currentUser.level}`;
  
  // Progress XP calculations
  let currentBase = 1000;
  let targetBase = 2000;
  if (state.currentUser.points >= 2000) {
    currentBase = 2000;
    targetBase = 3500;
  }
  
  const pct = Math.min(100, Math.max(0, ((state.currentUser.points - currentBase) / (targetBase - currentBase)) * 100));
  document.getElementById("badge-progress-text").textContent = `${state.currentUser.points} / ${targetBase} XP`;
  document.getElementById("badge-progress-fill").style.width = pct + "%";

  document.getElementById("badge-stat-reports").textContent = state.currentUser.reportsCount;
  document.getElementById("badge-stat-verifies").textContent = state.currentUser.verifiesCount;
  document.getElementById("badge-stat-resolutions").textContent = state.currentUser.resolutionsCount;

  // Locks / unlocks grand hero badge
  const lockedBadge = document.querySelector(".badge-item.locked");
  if (state.currentUser.points >= 2000 && lockedBadge) {
    lockedBadge.classList.remove("locked");
  }

  lucide.createIcons();
}

function renderLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = "";

  // Sort scores
  state.leaderboard.sort((a, b) => b.points - a.points).forEach((u, index) => {
    const li = document.createElement("li");
    li.className = `leaderboard-item ${u.isCurrentUser ? 'highlight-user' : ''}`;
    
    li.innerHTML = `
      <span class="leaderboard-rank">${index + 1}</span>
      <div class="leaderboard-avatar" style="${u.isCurrentUser ? 'border: 2px solid var(--primary); color:var(--primary);' : ''}">${u.avatar}</div>
      <span class="leaderboard-name">${u.name} ${u.isCurrentUser ? '(You)' : ''}</span>
      <span class="leaderboard-score">${u.points.toLocaleString()} XP</span>
    `;
    list.appendChild(li);
  });
}

// Authority Actions & Console
function initAuthorityConsole() {
  renderWorkOrders();
}

function renderWorkOrders() {
  const list = document.getElementById("authority-workorders-list");
  const detailPane = document.getElementById("authority-details-pane");
  
  if (!list) return;
  list.innerHTML = "";

  // Filter issues suitable for work tickets (all verified, scheduled, or resolved)
  const tickets = state.issues.filter(i => i.status !== 'reported');

  if (tickets.length === 0) {
    list.innerHTML = `<span class="empty-state">No active work tickets available.</span>`;
    detailPane.innerHTML = `
      <div class="empty-state" style="margin: auto;">
        <i data-lucide="shield-alert"></i>
        <h4>No Ticket Selected</h4>
        <p>Select a verification ticket from the list to manage and resolve.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  tickets.forEach(ticket => {
    let statColor = "var(--status-verified)";
    if (ticket.status === 'scheduled') statColor = "var(--status-scheduled)";
    if (ticket.status === 'resolved') statColor = "var(--status-resolved)";

    const li = document.createElement("li");
    li.className = "workorder-item";
    li.innerHTML = `
      <div class="workorder-meta">
        <span style="font-size:0.75rem; color:var(--text-muted); font-weight:600;">#${ticket.id.split("-")[1].slice(-5)}</span>
        <span class="workorder-status-dot" style="color: ${statColor};"></span>
      </div>
      <h5 style="font-family:var(--font-display); font-size:0.85rem; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${ticket.title}</h5>
      <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">${ticket.category} • ${ticket.votes} validations</p>
    `;

    li.addEventListener("click", () => {
      document.querySelectorAll(".workorder-item").forEach(item => item.classList.remove("active-selection"));
      li.classList.add("active-selection");
      loadTicketDetails(ticket.id);
    });

    list.appendChild(li);
  });
}

function loadTicketDetails(ticketId) {
  const pane = document.getElementById("authority-details-pane");
  const ticket = state.issues.find(i => i.id === ticketId);

  if (!ticket) return;

  // Build status flow buttons
  let actionHtml = "";
  if (ticket.status === "verified") {
    actionHtml = `
      <div class="action-form-authority">
        <h4 style="font-family: var(--font-display);">Schedule Action</h4>
        <div class="form-group">
          <label>Assign Maintenance Team & Date</label>
          <input type="date" id="auth-schedule-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <button class="btn-authority-submit" onclick="scheduleMaintenanceTicket('${ticket.id}')" style="background: var(--status-scheduled); color: white;">Dispatch & Schedule</button>
      </div>
    `;
  } else if (ticket.status === "scheduled") {
    actionHtml = `
      <div class="action-form-authority">
        <h4 style="font-family: var(--font-display);">Mark as Resolved</h4>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">To resolve, municipal workers must upload a verified "after" repair photo.</p>
        <button class="btn-authority-submit" onclick="resolveTicket('${ticket.id}')">Resolve Ticket</button>
      </div>
    `;
  } else if (ticket.status === "resolved") {
    actionHtml = `
      <div class="action-form-authority" style="border: 1px dashed var(--status-resolved); border-radius: 12px; padding:1rem; text-align:center;">
        <span style="color:var(--status-resolved); font-weight:700;"><i data-lucide="check-circle" style="display:inline-block; width:16px; height:16px; margin-right:4px; vertical-align:middle;"></i> WORK COMPLETED</span>
        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">This ticket has been successfully resolved and archived.</p>
      </div>
    `;
  }

  pane.innerHTML = `
    <div class="workorder-header">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
        <span class="tag" style="text-transform:uppercase; font-weight:700; color:var(--primary);">${ticket.status}</span>
        <span style="font-size:0.8rem; color:var(--text-muted);">${formatDate(ticket.date)}</span>
      </div>
      <h3 class="workorder-title">${ticket.title}</h3>
      <p style="font-size:0.8rem; color:var(--text-muted);"><i data-lucide="map-pin" style="display:inline-block; width:12px; height:12px; vertical-align:middle;"></i> ${ticket.address}</p>
    </div>

    <div class="workorder-info-grid">
      <div>
        <div class="info-label">Category</div>
        <div class="info-val">${ticket.category}</div>
      </div>
      <div>
        <div class="info-label">Severity</div>
        <div class="info-val" style="color:var(--status-reported); font-weight:700;">${ticket.severity.toUpperCase()}</div>
      </div>
      <div>
        <div class="info-label">Validations</div>
        <div class="info-val">${ticket.votes} Citizens</div>
      </div>
    </div>

    <p class="workorder-desc">${ticket.desc}</p>

    <!-- Before / After comparison slider -->
    <div class="before-after-slider">
      <div class="slider-img img-before" style="background-image: url('${ticket.image || 'assets/pothole.png'}');"></div>
      <div class="slider-img img-after" id="slider-resolved-img" style="background-image: url('${ticket.status === 'resolved' ? 'assets/pothole.png' : ticket.image}'); width: ${ticket.status === 'resolved' ? '0%' : '100%'};"></div>
      <div class="slider-handle" id="slider-handle-div"></div>
      <input type="range" min="0" max="100" value="${ticket.status === 'resolved' ? '0' : '100'}" class="slider-input-range" id="slider-bar-range" oninput="adjustBeforeAfterSlider(this.value)">
    </div>

    ${actionHtml}
  `;

  // Adjust Leaflet Map view to focus on the ticket
  state.map.setView([ticket.lat, ticket.lng], 16);
  if (state.mapMarkers[ticket.id]) {
    state.mapMarkers[ticket.id].openPopup();
  }

  lucide.createIcons();
}

window.adjustBeforeAfterSlider = function(val) {
  const afterImg = document.getElementById("slider-resolved-img");
  const handle = document.getElementById("slider-handle-div");
  if (afterImg && handle) {
    afterImg.style.width = val + "%";
    handle.style.left = val + "%";
  }
};

window.scheduleMaintenanceTicket = function(ticketId) {
  const dateVal = document.getElementById("auth-schedule-date").value;
  const ticket = state.issues.find(i => i.id === ticketId);
  if (ticket) {
    ticket.status = "scheduled";
    saveIssues();
    
    showToast("Ticket Scheduled", `Maintenance team dispatched for date ${dateVal}.`, "success");
    renderWorkOrders();
    loadTicketDetails(ticketId);
    renderMapMarkers();
    renderDashboardActivity();
  }
};

window.resolveTicket = function(ticketId) {
  const ticket = state.issues.find(i => i.id === ticketId);
  if (ticket) {
    ticket.status = "resolved";
    saveIssues();

    // Reward points for citizens who helped verify it
    awardPoints(100, "Citizen reward for resolved ticket verification");
    state.currentUser.resolutionsCount++;
    saveUser();

    showToast("Ticket Resolved!", "Repair work successfully completed. Notification sent to local community.", "success");
    
    renderWorkOrders();
    loadTicketDetails(ticketId);
    renderMapMarkers();
    renderDashboardActivity();
    updateAnalyticsData();
  }
};

// Toast Notifications Helper
function showToast(title, message, type = "primary") {
  const wrapper = document.getElementById("toast-wrapper");
  const toast = document.createElement("div");
  toast.className = "toast";
  
  let borderColor = "var(--primary)";
  let iconName = "bell";
  if (type === "success") { borderColor = "var(--status-resolved)"; iconName = "check-circle"; }
  if (type === "warning") { borderColor = "var(--status-reported)"; iconName = "alert-triangle"; }
  if (type === "info") { borderColor = "var(--secondary)"; iconName = "info"; }

  toast.style.borderLeftColor = borderColor;
  toast.innerHTML = `
    <i data-lucide="${iconName}" style="color: ${borderColor}; width: 20px; height: 20px; flex-shrink:0;"></i>
    <div class="toast-info">
      <span class="toast-title">${title}</span>
      <span class="toast-message">${message}</span>
    </div>
  `;
  wrapper.appendChild(toast);
  lucide.createIcons();

  // Slide out and remove
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) reverse forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Utility Helpers
function formatDate(isoString) {
  const date = new Date(isoString);
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return date.toLocaleDateString('en-US', options);
}
