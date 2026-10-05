/**
 * ClaimGuard - Role-Based Functional Prototype (Activity 2)
 * Demo users, role detection, dashboards, restricted functions, protected data, logout
 */

// ========== DEMO USERS (no database needed) ==========
const DEMO_USERS = [
    {
        username: "ahmed@uni.edu",
        password: "student123",
        name: "Ahmed Khan",
        role: "student",
        rollNo: "21L-5782"
    },
    {
        username: "sara@uni.edu",
        password: "officer123",
        name: "Sara Malik",
        role: "officer",
        badgeId: "SEC-042"
    }
];

// Sample data for prototype
const SAMPLE_CLAIMS = [
    {
        id: "CLM-001",
        item: "Black Dell Laptop",
        reporter: "Ahmed Khan",
        status: "Pending Verification",
        publicDesc: "15-inch laptop, last seen in Library",
        privateEvidence: "Serial: DL-9847362 | Blue sticker under battery",
        date: "2026-09-28"
    },
    {
        id: "CLM-002",
        item: "Scientific Calculator",
        reporter: "Fatima Ali",
        status: "Pending Verification",
        publicDesc: "Casio fx-991ES, black case",
        privateEvidence: "Engraved initials F.A. on back",
        date: "2026-09-30"
    }
];

// ========== AUTH HELPERS ==========
function getCurrentUser() {
    const raw = sessionStorage.getItem("claimguard_user");
    return raw ? JSON.parse(raw) : null;
}

function setCurrentUser(user) {
    sessionStorage.setItem("claimguard_user", JSON.stringify(user));
}

function clearCurrentUser() {
    sessionStorage.removeItem("claimguard_user");
}

function requireAuth(allowedRoles) {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = "login.html";
        return null;
    }
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        alert("Access Denied: You do not have permission to view this page.");
        // Redirect to their own dashboard
        if (user.role === "student") window.location.href = "student-dashboard.html";
        else if (user.role === "officer") window.location.href = "officer-dashboard.html";
        else window.location.href = "login.html";
        return null;
    }
    return user;
}

function logout() {
    clearCurrentUser();
    window.location.href = "login.html";
}

// ========== UI HELPERS ==========
function showAlert(element, message, type) {
    if (!element) return;
    element.className = "alert alert-" + type;
    element.textContent = message;
    element.classList.remove("d-none");
}

function updateNavbar() {
    const user = getCurrentUser();
    const navContainer = document.getElementById("dynamicNav");
    if (!navContainer) return;

    if (user) {
        navContainer.innerHTML = `
            <li class="nav-item"><span class="nav-link text-white-50">Hi, ${user.name} (${user.role})</span></li>
            <li class="nav-item">
                <a class="nav-link" href="${user.role === 'student' ? 'student-dashboard.html' : 'officer-dashboard.html'}">Dashboard</a>
            </li>
            <li class="nav-item"><a class="nav-link" href="#" id="navLogout">Logout</a></li>
        `;
        document.getElementById("navLogout")?.addEventListener("click", function (e) {
            e.preventDefault();
            logout();
        });
    } else {
        navContainer.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link" href="login.html">Login</a></li>
        `;
    }
}

// ========== PAGE INITIALIZATION ==========
document.addEventListener("DOMContentLoaded", function () {

    // Show/Hide Password
    const togglePasswordBtn = document.getElementById("togglePassword");
    const passwordInput = document.getElementById("password");
    const eyeIcon = document.getElementById("eyeIcon");
    if (togglePasswordBtn && passwordInput && eyeIcon) {
        togglePasswordBtn.addEventListener("click", function () {
            const isPassword = passwordInput.type === "password";
            passwordInput.type = isPassword ? "text" : "password";
            eyeIcon.classList.toggle("bi-eye", !isPassword);
            eyeIcon.classList.toggle("bi-eye-slash", isPassword);
        });
    }

    // ========== LOGIN PAGE ==========
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        // Pre-fill hint
        const hint = document.getElementById("demoHint");
        if (hint) {
            hint.innerHTML = `
                <strong>Demo Accounts:</strong><br>
                Student: <code>ahmed@uni.edu</code> / <code>student123</code><br>
                Officer: <code>sara@uni.edu</code> / <code>officer123</code>
            `;
        }

        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            e.stopPropagation();

            const username = document.getElementById("email").value.trim().toLowerCase();
            const password = document.getElementById("password").value;
            const alertBox = document.getElementById("loginAlert");

            loginForm.classList.add("was-validated");

            const user = DEMO_USERS.find(u => u.username === username && u.password === password);

            if (!user) {
                showAlert(alertBox, "Invalid credentials. Use the demo accounts shown below.", "danger");
                return;
            }

            // Store session
            setCurrentUser({
                name: user.name,
                role: user.role,
                username: user.username,
                rollNo: user.rollNo || null,
                badgeId: user.badgeId || null
            });

            showAlert(alertBox, `Welcome ${user.name}! Redirecting to your dashboard...`, "success");

            setTimeout(function () {
                if (user.role === "student") {
                    window.location.href = "student-dashboard.html";
                } else if (user.role === "officer") {
                    window.location.href = "officer-dashboard.html";
                }
            }, 800);
        });
    }

    // ========== STUDENT DASHBOARD ==========
    if (document.getElementById("studentDashboard")) {
        const user = requireAuth(["student"]);
        if (!user) return;

        document.getElementById("welcomeName").textContent = user.name;
        document.getElementById("userRoll").textContent = user.rollNo || "N/A";

        // Logout button
        document.getElementById("btnLogout")?.addEventListener("click", logout);

        // Character counters if present
        setupCharCounters();
    }

    // ========== OFFICER DASHBOARD ==========
    if (document.getElementById("officerDashboard")) {
        const user = requireAuth(["officer"]);
        if (!user) return;

        document.getElementById("welcomeName").textContent = user.name;
        document.getElementById("userBadge").textContent = user.badgeId || "N/A";

        // Render claims list
        renderClaimsList();

        // Logout
        document.getElementById("btnLogout")?.addEventListener("click", logout);
    }

    // ========== REPORT LOST PAGE (Student only) ==========
    if (document.getElementById("reportForm")) {
        const user = requireAuth(["student"]);
        if (!user) return;

        setupCharCounters();

        const reportForm = document.getElementById("reportForm");
        reportForm.addEventListener("submit", function (e) {
            e.preventDefault();
            e.stopPropagation();
            reportForm.classList.add("was-validated");

            const category = document.getElementById("itemCategory");
            const itemName = document.getElementById("itemName");
            const publicDesc = document.getElementById("publicDesc");

            if (!category.value || !itemName.value.trim() || !publicDesc.value.trim()) {
                showAlert(document.getElementById("formAlert"), "Please fill all required public fields.", "danger");
                return;
            }

            // Success modal
            const modal = new bootstrap.Modal(document.getElementById("successModal"));
            modal.show();
        });

        reportForm.addEventListener("reset", function () {
            reportForm.classList.remove("was-validated");
            document.getElementById("charCount").textContent = "0";
            document.getElementById("evidenceCharCount").textContent = "0";
        });
    }

    // ========== RESTRICTED FUNCTION: Approve/Reject Claim ==========
    // Only officers can call this
    window.handleClaimAction = function (claimId, action) {
        const user = getCurrentUser();
        if (!user || user.role !== "officer") {
            alert("Access Denied: Only Security Officers can approve or reject claims.");
            return;
        }

        // Perform action (prototype)
        const msg = action === "approve"
            ? `Claim ${claimId} has been APPROVED. Handover can now be recorded.`
            : `Claim ${claimId} has been REJECTED.`;
        alert(msg);

        // Update UI status
        const statusEl = document.getElementById("status-" + claimId);
        if (statusEl) {
            statusEl.textContent = action === "approve" ? "Approved" : "Rejected";
            statusEl.className = "badge " + (action === "approve" ? "bg-success" : "bg-danger");
        }
    };

    // ========== PROTECTED DATA: Show private evidence only to officer ==========
    window.toggleEvidence = function (claimId) {
        const user = getCurrentUser();
        const evidenceEl = document.getElementById("evidence-" + claimId);

        if (!user || user.role !== "officer") {
            alert("Access Denied: Private ownership evidence is only visible to Security Officers.");
            return;
        }

        if (evidenceEl) {
            evidenceEl.classList.toggle("d-none");
        }
    };

    // Update navbar if present
    updateNavbar();
});

// ========== HELPER FUNCTIONS ==========
function setupCharCounters() {
    const publicDesc = document.getElementById("publicDesc");
    const charCount = document.getElementById("charCount");
    if (publicDesc && charCount) {
        publicDesc.addEventListener("input", function () {
            charCount.textContent = this.value.length;
        });
    }
    const evidenceNotes = document.getElementById("evidenceNotes");
    const evidenceCharCount = document.getElementById("evidenceCharCount");
    if (evidenceNotes && evidenceCharCount) {
        evidenceNotes.addEventListener("input", function () {
            evidenceCharCount.textContent = this.value.length;
        });
    }
}

function renderClaimsList() {
    const container = document.getElementById("claimsList");
    if (!container) return;

    container.innerHTML = SAMPLE_CLAIMS.map(claim => `
        <div class="card mb-3 shadow-sm">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${claim.item} <span class="badge bg-secondary">${claim.id}</span></h6>
                        <p class="small text-muted mb-1">Reporter: ${claim.reporter} | Date: ${claim.date}</p>
                        <p class="small mb-2">${claim.publicDesc}</p>
                        <span id="status-${claim.id}" class="badge bg-warning text-dark">${claim.status}</span>
                    </div>
                </div>
                <div class="mt-3 d-flex flex-wrap gap-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="toggleEvidence('${claim.id}')">
                        <i class="bi bi-eye"></i> View Private Evidence
                    </button>
                    <button class="btn btn-sm btn-success" onclick="handleClaimAction('${claim.id}', 'approve')">
                        <i class="bi bi-check-lg"></i> Approve
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="handleClaimAction('${claim.id}', 'reject')">
                        <i class="bi bi-x-lg"></i> Reject
                    </button>
                </div>
                <div id="evidence-${claim.id}" class="alert alert-info mt-2 d-none small">
                    <strong>Private Ownership Evidence (Officer only):</strong><br>
                    ${claim.privateEvidence}
                </div>
            </div>
        </div>
    `).join("");
}
