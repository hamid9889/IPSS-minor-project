/* 
   IPSS - Intelligent Product Scheduling System
   Full-Stack Client-to-Backend Integration
*/

// --- API Configuration ---
const API_BASE = window.location.origin.includes(':8000') ? '' : 'http://localhost:8000';

function getAuthToken() {
    return localStorage.getItem('ipss_token') || '';
}

function getCurrentUser() {
    const raw = localStorage.getItem('ipss_user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (e) {
        return null;
    }
}

async function apiFetch(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            if (currentPage !== 'login.html' && currentPage !== 'index.html') {
                localStorage.removeItem('ipss_token');
                localStorage.removeItem('ipss_user');
                window.location.href = 'login.html';
            }
            throw new Error('Unauthorized');
        }

        if (response.status === 403) {
            showToast('Permission Denied', 'You do not have administrative privileges for this operation.', 'error');
            throw new Error('Forbidden');
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Request failed with status ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error on ${endpoint}:`, error.message);
        throw error;
    }
}

// --- Theme (Dark Mode) Manager ---
function initTheme() {
    const savedTheme = localStorage.getItem('ipss_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeToggleButton(true);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('ipss_theme', isDark ? 'dark' : 'light');
    updateThemeToggleButton(isDark);
}

function updateThemeToggleButton(isDark) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
    }
}

// --- Mobile Navigation Drawer Toggle ---
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('open');
    }
}

// --- Toast Notification Helper ---
function showToast(title, desc, type = 'info', duration = 4500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const toastClass = type === 'error' ? 'toast-error' : (type === 'success' ? 'toast-success' : 'toast-info');
    const icon = type === 'error' ? '🚫' : (type === 'success' ? '✅' : 'ℹ️');

    toast.className = `custom-toast ${toastClass}`;
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${desc}</div>
        </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.transition = 'all 0.4s ease';
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 400);
    }, duration);
}

// --- Logout Action ---
function logout() {
    localStorage.removeItem('ipss_token');
    localStorage.removeItem('ipss_user');
    window.location.href = 'index.html';
}

// --- Dynamic Role-Based Access Control (RBAC) Route Guard ---
function checkAuth(currentPage) {
    const publicPages = ['index.html', 'login.html', ''];
    const isPublic = publicPages.includes(currentPage);
    const currentUser = getCurrentUser();
    const token = getAuthToken();
    const isLoggedIn = currentUser !== null && token !== '';

    if (!isPublic && !isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }

    // Role Permission Route Protection for Operator
    if (isLoggedIn && currentUser.role.toUpperCase() === 'OPERATOR') {
        const restrictedForOperator = ['machines.html', 'orders.html', 'schedule.html'];
        if (restrictedForOperator.includes(currentPage)) {
            sessionStorage.setItem('ipss_access_denied', 'true');
            window.location.href = 'dashboard.html';
        }
    }
}

// --- Dynamic Sidebar Navigation Filter by Role ---
function updateSidebarForRole() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const isOperator = currentUser.role.toUpperCase() === 'OPERATOR';
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    // Filter restricted links for standard operators
    const restrictedLinks = ['machines.html', 'orders.html', 'schedule.html'];
    const navItems = sidebar.querySelectorAll('.sidebar-menu li');

    navItems.forEach(li => {
        const link = li.querySelector('a');
        if (!link) return;
        const href = link.getAttribute('href');
        if (restrictedLinks.includes(href)) {
            li.style.display = isOperator ? 'none' : '';
        }
    });

    // Add role badge in sidebar header
    const sidebarHeader = sidebar.querySelector('.sidebar-header');
    if (sidebarHeader && !sidebarHeader.querySelector('.sidebar-role-tag')) {
        const roleTag = document.createElement('div');
        roleTag.className = 'sidebar-role-tag';
        roleTag.style.cssText = 'margin-top: 10px; font-size: 11px; padding: 3px 8px; border-radius: 6px; font-weight: 700; width: fit-content;';
        if (isOperator) {
            roleTag.style.backgroundColor = 'rgba(5, 150, 105, 0.25)';
            roleTag.style.color = '#34d399';
            roleTag.style.border = '1px solid rgba(52, 211, 153, 0.4)';
            roleTag.textContent = '👤 OPERATOR PORTAL';
        } else {
            roleTag.style.backgroundColor = 'rgba(37, 99, 235, 0.25)';
            roleTag.style.color = '#60a5fa';
            roleTag.style.border = '1px solid rgba(96, 165, 250, 0.4)';
            roleTag.textContent = '🛡️ ADMIN PORTAL';
        }
        sidebarHeader.appendChild(roleTag);
    }
}

// --- Header Profile Avatar & Name Sync ---
function updateHeaderProfileInfo() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    const isOperator = currentUser.role.toUpperCase() === 'OPERATOR';
    const avatarEl = document.getElementById('headerUserAvatar') || document.querySelector('.user-avatar');
    const nameEl = document.getElementById('headerUserName') || document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');

    if (currentUser.fullName || currentUser.full_name) {
        const name = currentUser.fullName || currentUser.full_name;
        const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = name;
    }

    if (roleEl) {
        if (isOperator) {
            roleEl.innerHTML = `<span class="user-role-badge role-badge-user">👤 Operator</span>`;
        } else {
            roleEl.innerHTML = `<span class="user-role-badge role-badge-admin">🛡️ Admin</span>`;
        }
    }
}

// --- Sidebar Active Navigation Highlight ---
function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.sidebar-menu a');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// --- DOM Content Loaded Initialization ---
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    highlightActiveNavLink();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    checkAuth(currentPage);
    updateSidebarForRole();
    updateHeaderProfileInfo();

    if (sessionStorage.getItem('ipss_access_denied') === 'true') {
        sessionStorage.removeItem('ipss_access_denied');
        showToast('Access Restricted', 'As an Operator, you only have access to Dashboard, Products, Reports, and Profile.', 'error', 5500);
    }

    if (currentPage === 'dashboard.html') {
        updateDashboard();
    } else if (currentPage === 'products.html') {
        renderProductsTable();
        setupProductForm();
        setupProductSearch();
    } else if (currentPage === 'machines.html') {
        renderMachinesTable();
        setupMachineForm();
        setupMachineSearch();
    } else if (currentPage === 'orders.html') {
        populateOrderProductSelect();
        renderOrdersTable();
        setupOrderForm();
        setupOrderFilters();
        initBulkCSVUpload();
    } else if (currentPage === 'schedule.html') {
        renderScheduleTable();
        renderGanttTimeline();
        setupScheduleGenerator();
    } else if (currentPage === 'reports.html') {
        renderReports();
    } else if (currentPage === 'profile.html') {
        loadProfile();
        setupEditProfileForm();
    } else if (currentPage === 'login.html') {
        setupLoginForm();
    }
});


// ==========================================
// LOGIN PAGE LOGIC
// ==========================================
let activeLoginRole = 'admin';

function switchLoginRole(role) {
    activeLoginRole = role;
    const btnAdmin = document.getElementById('btnRoleAdmin');
    const btnUser = document.getElementById('btnRoleUser');
    const hiddenRole = document.getElementById('selectedRole');
    const loginTitle = document.getElementById('loginTitle');
    const loginSubtitle = document.getElementById('loginSubtitle');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const demoText = document.getElementById('demoCredText');
    const submitBtn = document.getElementById('loginSubmitBtn');
    const permDetails = document.getElementById('permDetailsText');
    const errorBanner = document.getElementById('loginErrorMessage');

    if (errorBanner) errorBanner.style.display = 'none';
    if (hiddenRole) hiddenRole.value = role;

    if (role === 'admin') {
        if (btnAdmin) btnAdmin.className = 'role-tab active';
        if (btnUser) btnUser.className = 'role-tab';
        if (loginTitle) loginTitle.textContent = 'Admin Sign In';
        if (loginSubtitle) loginSubtitle.textContent = 'Full access to all modules';
        if (usernameInput) { usernameInput.value = 'admin'; usernameInput.classList.remove('user-mode'); }
        if (passwordInput) { passwordInput.value = 'admin123'; passwordInput.classList.remove('user-mode'); }
        if (demoText) demoText.innerHTML = '⚡ Demo: <strong>admin</strong> / <strong>admin123</strong> — click to fill';
        if (submitBtn) { submitBtn.className = 'btn-sign-in'; submitBtn.textContent = 'Sign In →'; }
        if (permDetails) permDetails.textContent = 'Dashboard • Products • Machines • Orders • Schedule • Reports • Profile';
    } else {
        if (btnAdmin) btnAdmin.className = 'role-tab';
        if (btnUser) btnUser.className = 'role-tab active user-active';
        if (loginTitle) loginTitle.textContent = 'Operator Sign In';
        if (loginSubtitle) loginSubtitle.textContent = 'Access Dashboard, Products & Reports';
        if (usernameInput) { usernameInput.value = 'user'; usernameInput.classList.add('user-mode'); }
        if (passwordInput) { passwordInput.value = 'user123'; passwordInput.classList.add('user-mode'); }
        if (demoText) demoText.innerHTML = '⚡ Demo: <strong>user</strong> / <strong>user123</strong> — click to fill';
        if (submitBtn) { submitBtn.className = 'btn-sign-in user-mode'; submitBtn.textContent = 'Sign In →'; }
        if (permDetails) permDetails.textContent = 'Dashboard • Products (View Only) • Reports • Profile';
    }
}

function fillDemoCredentials() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (activeLoginRole === 'admin') {
        if (usernameInput) usernameInput.value = 'admin';
        if (passwordInput) passwordInput.value = 'admin123';
    } else {
        if (usernameInput) usernameInput.value = 'user';
        if (passwordInput) passwordInput.value = 'user123';
    }

    const errorBanner = document.getElementById('loginErrorMessage');
    if (errorBanner) errorBanner.style.display = 'none';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('pwdToggleBtn');
    if (!passwordInput) return;

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (toggleBtn) toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        if (toggleBtn) toggleBtn.textContent = '👁️';
    }
}

function handleForgotPassword(event) {
    if (event) event.preventDefault();
    alert(`🔑 Demo Account Credentials:\n\n• Admin: admin / admin123\n• Operator: user / user123\n\nUse the role switcher tabs above to autofill credentials.`);
}

async function handleFormSubmit(event) {
    if (event) event.preventDefault();

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMsgDiv = document.getElementById('loginErrorMessage');
    const submitBtn = document.getElementById('loginSubmitBtn');

    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!username || !password) {
        if (errorMsgDiv) {
            errorMsgDiv.textContent = 'Please enter both username and password.';
            errorMsgDiv.style.display = 'block';
        }
        return false;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';
    }

    try {
        const data = await apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        localStorage.setItem('ipss_token', data.access_token);
        localStorage.setItem('ipss_user', JSON.stringify(data.user));

        window.location.href = 'dashboard.html';
        return false;
    } catch (err) {
        if (errorMsgDiv) {
            const hint = activeLoginRole === 'admin' ? 'admin / admin123' : 'user / user123';
            errorMsgDiv.textContent = `❌ ${err.message || 'Invalid credentials'}. Try: ${hint}`;
            errorMsgDiv.style.display = 'block';
        } else {
            alert('Invalid credentials!');
        }
        return false;
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign In →';
        }
    }
}

function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (event) {
        handleFormSubmit(event);
    });
}


// ==========================================
// PROFILE PAGE LOGIC
// ==========================================
async function loadProfile() {
    try {
        const profile = await apiFetch('/api/auth/me');
        if (!profile) return;

        // Update stored user
        localStorage.setItem('ipss_user', JSON.stringify(profile));

        const initials = (profile.full_name || profile.fullName || 'User')
            .split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

        if (document.getElementById('profileAvatarLarge')) document.getElementById('profileAvatarLarge').textContent = initials;
        if (document.getElementById('profileHeaderFullName')) document.getElementById('profileHeaderFullName').textContent = profile.full_name || profile.fullName;
        if (document.getElementById('profileHeaderUsername')) document.getElementById('profileHeaderUsername').textContent = profile.username;
        if (document.getElementById('profileHeaderRole')) document.getElementById('profileHeaderRole').textContent = profile.designation;

        if (document.getElementById('infoFullName')) document.getElementById('infoFullName').textContent = profile.full_name || profile.fullName;
        if (document.getElementById('infoUsername')) document.getElementById('infoUsername').textContent = profile.username;
        if (document.getElementById('infoEmail')) document.getElementById('infoEmail').textContent = profile.email;
        if (document.getElementById('infoPhone')) document.getElementById('infoPhone').textContent = profile.phone || 'N/A';
        if (document.getElementById('infoDob')) document.getElementById('infoDob').textContent = profile.dob || 'N/A';
        if (document.getElementById('infoGender')) document.getElementById('infoGender').textContent = profile.gender || 'N/A';
        if (document.getElementById('infoAddress')) document.getElementById('infoAddress').textContent = profile.address || 'N/A';

        if (document.getElementById('infoEmpId')) document.getElementById('infoEmpId').textContent = profile.employee_id || profile.employeeId || 'IPSS-001';
        if (document.getElementById('infoDepartment')) document.getElementById('infoDepartment').textContent = profile.department || 'Operations';
        if (document.getElementById('infoDesignation')) document.getElementById('infoDesignation').textContent = profile.designation || 'Staff';

        // Populate Edit Form
        if (document.getElementById('editFullName')) document.getElementById('editFullName').value = profile.full_name || profile.fullName || '';
        if (document.getElementById('editEmail')) document.getElementById('editEmail').value = profile.email || '';
        if (document.getElementById('editPhone')) document.getElementById('editPhone').value = profile.phone || '';
        if (document.getElementById('editDob')) document.getElementById('editDob').value = profile.dob || '';
        if (document.getElementById('editGender')) document.getElementById('editGender').value = profile.gender || 'Male';
        if (document.getElementById('editAddress')) document.getElementById('editAddress').value = profile.address || '';
    } catch (err) {
        console.error('Failed to load profile from backend:', err);
    }
}

function toggleEditProfileForm() {
    const editCard = document.getElementById('editProfileCard');
    if (editCard) {
        const isHidden = editCard.style.display === 'none';
        editCard.style.display = isHidden ? 'block' : 'none';
        if (isHidden) {
            editCard.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

function setupEditProfileForm() {
    const form = document.getElementById('editProfileForm');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const payload = {
            full_name: document.getElementById('editFullName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            phone: document.getElementById('editPhone').value.trim(),
            dob: document.getElementById('editDob').value,
            gender: document.getElementById('editGender').value,
            address: document.getElementById('editAddress').value.trim()
        };

        try {
            const updatedUser = await apiFetch('/api/auth/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            localStorage.setItem('ipss_user', JSON.stringify(updatedUser));
            await loadProfile();
            updateHeaderProfileInfo();

            const alertBox = document.getElementById('profileAlertMsg');
            if (alertBox) {
                alertBox.textContent = '✅ Profile updated successfully in database.';
                alertBox.style.display = 'flex';
                setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
            } else {
                showToast('Success', 'Profile updated successfully.', 'success');
            }

            toggleEditProfileForm();
        } catch (err) {
            alert('Failed to update profile: ' + err.message);
        }
    });
}


// ==========================================
// DASHBOARD PAGE LOGIC
// ==========================================
async function updateDashboard() {
    try {
        const stats = await apiFetch('/api/dashboard/stats');

        if (document.getElementById('dashTotalProducts')) document.getElementById('dashTotalProducts').textContent = stats.totalProducts;
        if (document.getElementById('dashTotalMachines')) document.getElementById('dashTotalMachines').textContent = stats.totalMachines;
        if (document.getElementById('dashTotalOrders')) document.getElementById('dashTotalOrders').textContent = stats.totalOrders;
        if (document.getElementById('dashPendingOrders')) document.getElementById('dashPendingOrders').textContent = stats.pendingOrders;
        if (document.getElementById('dashCompletedOrders')) document.getElementById('dashCompletedOrders').textContent = stats.completedOrders;
        if (document.getElementById('dashDelayedOrders')) document.getElementById('dashDelayedOrders').textContent = stats.delayedOrders;

        if (document.getElementById('dashProgressVal')) document.getElementById('dashProgressVal').textContent = stats.completionPercentage + '%';
        if (document.getElementById('dashProgressBarFill')) document.getElementById('dashProgressBarFill').style.width = stats.completionPercentage + '%';

        // Notifications
        const notifArea = document.getElementById('dashboardNotifications');
        if (notifArea) {
            notifArea.innerHTML = '';
            if (stats.delayedOrders > 0) {
                notifArea.innerHTML += `
                    <div class="alert-box alert-danger">
                        <span>⚠️ <strong>Alert:</strong> ${stats.delayedOrders} production order(s) are past deadline!</span>
                        <a href="orders.html" class="btn btn-sm btn-danger">View Orders</a>
                    </div>`;
            }
            if (stats.maintenanceCount > 0) {
                notifArea.innerHTML += `
                    <div class="alert-box alert-warning">
                        <span>🔧 <strong>Notice:</strong> ${stats.maintenanceCount} machine(s) are currently under maintenance.</span>
                        <a href="machines.html" class="btn btn-sm btn-secondary">Check Status</a>
                    </div>`;
            }
        }

        // Machine Status
        const machineBody = document.getElementById('dashMachineStatusBody');
        if (machineBody) {
            machineBody.innerHTML = '';
            stats.machineStatuses.forEach(m => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${m.machineName}</strong></td>
                    <td>${m.capacity} units/day</td>
                    <td><span class="badge ${m.badgeClass}">${m.status}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div class="progress-track" style="flex: 1; height: 8px;">
                                <div class="progress-fill" style="width: ${m.utilization};"></div>
                            </div>
                            <span style="font-size: 12px; font-weight: 600;">${m.utilization}</span>
                        </div>
                    </td>
                `;
                machineBody.appendChild(tr);
            });
        }

        // Upcoming Deadlines
        const upcomingBody = document.getElementById('dashUpcomingDeadlinesBody');
        if (upcomingBody) {
            upcomingBody.innerHTML = '';
            if (stats.upcomingDeadlines.length === 0) {
                upcomingBody.innerHTML = `<tr><td colspan="4" class="empty-placeholder">No upcoming pending deadlines.</td></tr>`;
            } else {
                stats.upcomingDeadlines.forEach(o => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${o.orderId}</strong></td>
                        <td>${o.productName}</td>
                        <td>${o.deadline}</td>
                        <td><span class="badge badge-warning">Approaching</span></td>
                    `;
                    upcomingBody.appendChild(tr);
                });
            }
        }

        // Recent Activity List
        const activityList = document.getElementById('dashActivityList');
        if (activityList) {
            activityList.innerHTML = '';
            stats.recentActivities.forEach(act => {
                const div = document.createElement('div');
                div.className = 'activity-item';
                div.innerHTML = `
                    <div class="activity-icon">📌</div>
                    <div>${act.text}</div>
                    <div class="activity-time">${act.time}</div>
                `;
                activityList.appendChild(div);
            });
        }
    } catch (err) {
        console.error('Failed to load dashboard stats:', err);
    }
}


// ==========================================
// PRODUCTS PAGE LOGIC
// ==========================================
async function renderProductsTable(filterText = '') {
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;

    try {
        const url = filterText ? `/api/products?search=${encodeURIComponent(filterText)}` : '/api/products';
        const products = await apiFetch(url);
        const orders = await apiFetch('/api/orders').catch(() => []);

        // Compute Product Analytics
        const totalCount = products.length;
        let sumProcTime = 0;
        let totalLinkedOrdersCount = 0;
        let totalScheduledUnitsVolume = 0;

        products.forEach(p => {
            sumProcTime += parseFloat(p.processing_time) || 0;
            const matchingOrders = orders.filter(o => o.product_name === p.product_name);
            totalLinkedOrdersCount += matchingOrders.length;
            matchingOrders.forEach(o => {
                totalScheduledUnitsVolume += parseInt(o.quantity) || 0;
            });
        });

        const avgProcTime = totalCount > 0 ? (sumProcTime / totalCount).toFixed(1) : '0.0';

        if (document.getElementById('prdTotalCount')) document.getElementById('prdTotalCount').textContent = totalCount;
        if (document.getElementById('prdAvgProcTime')) document.getElementById('prdAvgProcTime').textContent = avgProcTime + ' hrs';
        if (document.getElementById('prdTotalOrdersLinked')) document.getElementById('prdTotalOrdersLinked').textContent = totalLinkedOrdersCount;
        if (document.getElementById('prdTotalVolume')) document.getElementById('prdTotalVolume').textContent = totalScheduledUnitsVolume + ' units';

        tableBody.innerHTML = '';

        if (products.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="empty-placeholder">No master products found.</td></tr>`;
            return;
        }

        const currentUser = getCurrentUser();
        const isOperator = currentUser && currentUser.role.toUpperCase() === 'OPERATOR';

        products.forEach((product, index) => {
            const matchingOrders = orders.filter(o => o.product_name === product.product_name);
            const linkedOrdersCount = matchingOrders.length;
            let productVolume = 0;
            matchingOrders.forEach(o => { productVolume += parseInt(o.quantity) || 0; });

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${index + 1}</td>
                <td><strong>${product.product_name}</strong></td>
                <td><span class="badge badge-info">${product.category || 'General'}</span></td>
                <td>${product.processing_time} hrs/unit</td>
                <td><span class="badge badge-warning">🏭 ${product.preferred_line || 'All Machines'}</span></td>
                <td><strong>${linkedOrdersCount}</strong> active order(s)</td>
                <td><strong>${productVolume}</strong> units scheduled</td>
                <td class="action-buttons">
                    ${isOperator ? 
                        '<span class="view-only-tag">👁️ View Only</span>' : 
                        `<button class="btn btn-secondary btn-sm" onclick="editProduct(${product.id})">Edit</button>
                         <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>`
                    }
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to render products table:', err);
    }
}

function setupProductSearch() {
    const searchInput = document.getElementById('productSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderProductsTable(this.value.trim());
        });
    }
}

function setupProductForm() {
    const form = document.getElementById('productForm');
    const cancelBtn = document.getElementById('cancelProductEditBtn');
    if (!form) return;

    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role.toUpperCase() === 'OPERATOR') {
        const formCard = form.closest('.card');
        if (formCard) formCard.style.display = 'none';
        return;
    }

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const productId = document.getElementById('productId').value;
        const productName = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategory').value;
        const processingTime = parseFloat(document.getElementById('processingTime').value);
        const preferredLine = document.getElementById('assignedMachineSelect') ? document.getElementById('assignedMachineSelect').value : 'All Machines';

        if (!productName) { alert('Please enter a product name.'); return; }
        if (isNaN(processingTime) || processingTime <= 0) { alert('Please enter a valid processing time greater than 0.'); return; }

        try {
            if (productId) {
                await apiFetch(`/api/products/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        product_name: productName,
                        category,
                        processing_time: processingTime,
                        preferred_line: preferredLine
                    })
                });
                showToast('Product Updated', `Updated product master "${productName}"`, 'success');
            } else {
                await apiFetch('/api/products', {
                    method: 'POST',
                    body: JSON.stringify({
                        product_name: productName,
                        category,
                        processing_time: processingTime,
                        preferred_line: preferredLine
                    })
                });
                showToast('Product Created', `Added product master "${productName}"`, 'success');
            }

            resetProductForm();
            await renderProductsTable();
        } catch (err) {
            alert('Failed to save product: ' + err.message);
        }
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetProductForm);
}

async function editProduct(id) {
    try {
        const product = await apiFetch(`/api/products/${id}`);
        if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productName').value = product.product_name;
            if (document.getElementById('productCategory')) document.getElementById('productCategory').value = product.category || 'General Assembly';
            document.getElementById('processingTime').value = product.processing_time;
            if (document.getElementById('assignedMachineSelect')) document.getElementById('assignedMachineSelect').value = product.preferred_line || 'All Machines';

            document.getElementById('formSubmitBtn').textContent = 'Update Product Master';
            if (document.getElementById('productFormTitle')) document.getElementById('productFormTitle').textContent = 'Edit Product Master';
            if (document.getElementById('cancelProductEditBtn')) document.getElementById('cancelProductEditBtn').style.display = 'inline-block';

            const formCard = document.getElementById('productForm') ? document.getElementById('productForm').closest('.card') : null;
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                formCard.style.boxShadow = '0 0 0 3px var(--primary-color, #2563eb)';
                setTimeout(() => { formCard.style.boxShadow = ''; }, 2000);
            }
        }
    } catch (err) {
        alert('Could not fetch product details: ' + err.message);
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this master product?')) {
        try {
            await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
            showToast('Product Deleted', 'Master product deleted successfully', 'success');
            await renderProductsTable();
        } catch (err) {
            alert('Failed to delete product: ' + err.message);
        }
    }
}

function resetProductForm() {
    const form = document.getElementById('productForm');
    if (form) form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('formSubmitBtn').textContent = 'Save Product Master';
    if (document.getElementById('productFormTitle')) document.getElementById('productFormTitle').textContent = 'Add New Product Master';
    if (document.getElementById('cancelProductEditBtn')) document.getElementById('cancelProductEditBtn').style.display = 'none';
}


// ==========================================
// MACHINES PAGE LOGIC
// ==========================================
async function renderMachinesTable(filterText = '') {
    const tableBody = document.getElementById('machinesTableBody');
    if (!tableBody) return;

    try {
        const url = filterText ? `/api/machines?search=${encodeURIComponent(filterText)}` : '/api/machines';
        const machines = await apiFetch(url);

        tableBody.innerHTML = '';

        if (machines.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="empty-placeholder">No machines found.</td></tr>`;
            return;
        }

        machines.forEach((machine, index) => {
            let badgeClass = 'badge-success';
            if (machine.status === 'Working') badgeClass = 'badge-warning';
            if (machine.status === 'Maintenance') badgeClass = 'badge-danger';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>#${index + 1}</td>
                <td><strong>${machine.machine_name}</strong></td>
                <td>${machine.capacity} units/day</td>
                <td><span class="badge ${badgeClass}">${machine.status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editMachine(${machine.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteMachine(${machine.id})">Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to render machines table:', err);
    }
}

function setupMachineSearch() {
    const searchInput = document.getElementById('machineSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            renderMachinesTable(this.value.trim());
        });
    }
}

function setupMachineForm() {
    const form = document.getElementById('machineForm');
    const cancelBtn = document.getElementById('cancelMachineEditBtn');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const machineId = document.getElementById('machineId').value;
        const machineName = document.getElementById('machineName').value.trim();
        const capacity = parseInt(document.getElementById('machineCapacity').value);
        const status = document.getElementById('machineStatus').value;

        if (!machineName) { alert('Please enter machine name.'); return; }
        if (isNaN(capacity) || capacity <= 0) { alert('Please enter a valid capacity greater than 0.'); return; }

        try {
            if (machineId) {
                await apiFetch(`/api/machines/${machineId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ machine_name: machineName, capacity, status })
                });
                showToast('Machine Updated', `Updated machine "${machineName}"`, 'success');
            } else {
                await apiFetch('/api/machines', {
                    method: 'POST',
                    body: JSON.stringify({ machine_name: machineName, capacity, status })
                });
                showToast('Machine Added', `Added machine "${machineName}"`, 'success');
            }

            resetMachineForm();
            await renderMachinesTable();
        } catch (err) {
            alert('Failed to save machine: ' + err.message);
        }
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetMachineForm);
}

async function editMachine(id) {
    try {
        const machine = await apiFetch(`/api/machines/${id}`);
        if (machine) {
            document.getElementById('machineId').value = machine.id;
            document.getElementById('machineName').value = machine.machine_name;
            document.getElementById('machineCapacity').value = machine.capacity;
            document.getElementById('machineStatus').value = machine.status;

            document.getElementById('machineFormBtn').textContent = 'Update Machine';
            if (document.getElementById('machineFormTitle')) document.getElementById('machineFormTitle').textContent = 'Edit Machine';
            if (document.getElementById('cancelMachineEditBtn')) document.getElementById('cancelMachineEditBtn').style.display = 'inline-block';

            const formCard = document.getElementById('machineForm') ? document.getElementById('machineForm').closest('.card') : null;
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                formCard.style.boxShadow = '0 0 0 3px var(--primary-color, #2563eb)';
                setTimeout(() => { formCard.style.boxShadow = ''; }, 2000);
            }
        }
    } catch (err) {
        alert('Could not fetch machine details: ' + err.message);
    }
}

async function deleteMachine(id) {
    if (confirm('Are you sure you want to delete this machine?')) {
        try {
            await apiFetch(`/api/machines/${id}`, { method: 'DELETE' });
            showToast('Machine Deleted', 'Machine deleted successfully', 'success');
            await renderMachinesTable();
        } catch (err) {
            alert('Failed to delete machine: ' + err.message);
        }
    }
}

function resetMachineForm() {
    const form = document.getElementById('machineForm');
    if (form) form.reset();
    document.getElementById('machineId').value = '';
    document.getElementById('machineFormBtn').textContent = 'Add Machine';
    if (document.getElementById('machineFormTitle')) document.getElementById('machineFormTitle').textContent = 'Add New Machine';
    if (document.getElementById('cancelMachineEditBtn')) document.getElementById('cancelMachineEditBtn').style.display = 'none';
}


// ==========================================
// ORDERS PAGE LOGIC
// ==========================================
function switchOrderTab(tabName) {
    const manualBtn = document.getElementById('tabBtnManual');
    const bulkBtn = document.getElementById('tabBtnBulk');
    const manualContent = document.getElementById('tabContentManual');
    const bulkContent = document.getElementById('tabContentBulk');

    if (!manualBtn || !bulkBtn) return;

    if (tabName === 'manual') {
        manualBtn.classList.add('active');
        bulkBtn.classList.remove('active');
        if (manualContent) manualContent.style.display = 'block';
        if (bulkContent) bulkContent.style.display = 'none';
    } else {
        bulkBtn.classList.add('active');
        manualBtn.classList.remove('active');
        if (bulkContent) bulkContent.style.display = 'block';
        if (manualContent) manualContent.style.display = 'none';
    }
}

async function populateOrderProductSelect() {
    const productSelect = document.getElementById('orderProductSelect');
    const procTimeInput = document.getElementById('orderProcessingTime');
    if (!productSelect) return;

    try {
        const products = await apiFetch('/api/products');
        productSelect.innerHTML = '<option value="">-- Select Product --</option>';

        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.product_name;
            option.textContent = p.product_name;
            productSelect.appendChild(option);
        });

        productSelect.addEventListener('change', function () {
            const selected = products.find(p => p.product_name === this.value);
            if (selected && procTimeInput) {
                procTimeInput.value = selected.processing_time || 0.05;
            }
        });
    } catch (err) {
        console.error('Failed to populate product select:', err);
    }
}

function downloadSampleCSV() {
    const csvHeader = "Product,Quantity,Priority,Deadline,ProcessingTime\n";
    const sampleRows = [
        "Laptop Assembly,60,High,2026-08-25T17:00,0.05",
        "Mouse Housing,150,Medium,2026-08-26T14:00,0.02",
        "Motor Shaft,80,High,2026-08-24T12:00,0.08",
        "Control Panel Unit,40,Low,2026-08-28T18:00,0.10"
    ].join("\n");

    const blob = new Blob([csvHeader + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_production_orders.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Bulk File Upload
let parsedBulkOrders = [];

function initBulkCSVUpload() {
    const dropZone = document.getElementById('csvDropZone');
    const fileInput = document.getElementById('csvFileInput');
    if (!dropZone || !fileInput) return;

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drop-zone--over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drop-zone--over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) handleCSVFile(files[0]);
    });

    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length) handleCSVFile(fileInput.files[0]);
    });
}

function handleCSVFile(file) {
    const fileName = file.name.toLowerCase();
    const reader = new FileReader();

    reader.onload = function (e) {
        const text = e.target.result;
        if (fileName.endsWith('.json')) {
            parseJSONText(text);
        } else {
            parseCSVText(text);
        }
    };
    reader.readAsText(file);
}

function parseJSONText(text) {
    try {
        const data = JSON.parse(text);
        const list = Array.isArray(data) ? data : [data];

        parsedBulkOrders = [];
        let validCount = 0;
        let invalidCount = 0;

        list.forEach((item, idx) => {
            const product = item.product || item.productName || item.product_name || '';
            const qty = parseInt(item.quantity || item.qty);
            const rawP = item.priority || 'Medium';
            const priority = rawP.charAt(0).toUpperCase() + rawP.slice(1).toLowerCase();
            const deadline = item.deadline || '';
            const procTime = parseFloat(item.processingTime || item.processing_time) || 0.05;

            let isValid = true;
            let errors = [];

            if (!product) { isValid = false; errors.push('Product missing'); }
            if (isNaN(qty) || qty <= 0) { isValid = false; errors.push('Invalid Quantity'); }
            if (!['High', 'Medium', 'Low'].includes(priority)) { isValid = false; errors.push('Priority invalid'); }
            if (!deadline) { isValid = false; errors.push('Deadline missing'); }

            if (isValid) validCount++; else invalidCount++;

            parsedBulkOrders.push({
                id: Date.now() + idx,
                orderId: 'ORD-FILE' + (100 + idx),
                productName: product,
                quantity: qty || 0,
                priority: priority,
                deadline: deadline,
                processingTime: procTime,
                status: 'Pending',
                isValid: isValid,
                errors: errors
            });
        });

        renderCSVPreviewTable();
        const summaryBadge = document.getElementById('csvValidationSummary');
        if (summaryBadge) {
            summaryBadge.textContent = `${validCount} Valid, ${invalidCount} Invalid`;
            summaryBadge.className = invalidCount > 0 ? 'badge badge-warning' : 'badge badge-success';
        }

        const previewContainer = document.getElementById('csvPreviewContainer');
        if (previewContainer) previewContainer.style.display = 'block';
    } catch (err) {
        alert('Could not parse JSON file. Please check format.');
    }
}

function parseCSVText(text) {
    const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
    if (lines.length < 1) {
        alert('File is empty or missing data!');
        return;
    }

    parsedBulkOrders = [];
    let validCount = 0;
    let invalidCount = 0;

    const startIdx = lines[0].toLowerCase().includes('product') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/,|\t/).map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;

        const product = cols[0] || '';
        const qty = parseInt(cols[1]);
        const rawPriority = cols[2] ? cols[2].charAt(0).toUpperCase() + cols[2].slice(1).toLowerCase() : 'Medium';
        const deadline = cols[3] || new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16);
        const procTime = parseFloat(cols[4]) || 0.05;

        let isValid = true;
        let errors = [];

        if (!product) { isValid = false; errors.push('Product missing'); }
        if (isNaN(qty) || qty <= 0) { isValid = false; errors.push('Invalid Quantity'); }
        if (!['High', 'Medium', 'Low'].includes(rawPriority)) { isValid = false; errors.push('Priority must be High/Medium/Low'); }

        if (isValid) validCount++; else invalidCount++;

        parsedBulkOrders.push({
            id: Date.now() + i,
            orderId: 'ORD-FILE' + (100 + i),
            productName: product,
            quantity: qty || 0,
            priority: rawPriority,
            deadline: deadline,
            processingTime: procTime,
            status: 'Pending',
            isValid: isValid,
            errors: errors
        });
    }

    renderCSVPreviewTable();
    const summaryBadge = document.getElementById('csvValidationSummary');
    if (summaryBadge) {
        summaryBadge.textContent = `${validCount} Valid, ${invalidCount} Invalid`;
        summaryBadge.className = invalidCount > 0 ? 'badge badge-warning' : 'badge badge-success';
    }

    const previewContainer = document.getElementById('csvPreviewContainer');
    if (previewContainer) previewContainer.style.display = 'block';
}

function renderCSVPreviewTable() {
    const tbody = document.getElementById('csvPreviewTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    parsedBulkOrders.forEach((row, idx) => {
        const tr = document.createElement('tr');
        tr.className = row.isValid ? 'tr-valid' : 'tr-invalid';

        tr.innerHTML = `
            <td>#${idx + 1}</td>
            <td><strong>${row.productName || '<em>Empty</em>'}</strong></td>
            <td>${row.quantity}</td>
            <td><span class="badge ${row.priority === 'High' ? 'badge-danger' : row.priority === 'Medium' ? 'badge-warning' : 'badge-info'}">${row.priority}</span></td>
            <td>${row.deadline || '<em>N/A</em>'}</td>
            <td>${row.processingTime} hrs/unit</td>
            <td>
                ${row.isValid 
                    ? '<span class="badge badge-success">✓ Valid</span>' 
                    : `<span class="badge badge-danger" title="${row.errors.join(', ')}">❌ ${row.errors[0]}</span>`}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function resetBulkCSV() {
    parsedBulkOrders = [];
    const previewContainer = document.getElementById('csvPreviewContainer');
    const fileInput = document.getElementById('csvFileInput');
    if (previewContainer) previewContainer.style.display = 'none';
    if (fileInput) fileInput.value = '';
}

// Pre-Scheduling Simulation Modal
let currentAnalysisOrders = [];

async function analyzePreSchedule(ordersToAnalyze) {
    if (!ordersToAnalyze || ordersToAnalyze.length === 0) {
        alert('No valid orders to analyze!');
        return;
    }

    try {
        const machines = await apiFetch('/api/machines');
        const availableMachines = machines.filter(m => m.status === 'Available' || m.status === 'Working');

        if (availableMachines.length === 0) {
            alert('Warning: No operational machines currently available in system!');
            return;
        }

        const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
        const sortedOrders = [...ordersToAnalyze].sort((a, b) => {
            const pA = priorityWeight[a.priority] || 1;
            const pB = priorityWeight[b.priority] || 1;
            if (pA !== pB) return pB - pA;
            return new Date(a.deadline) - new Date(b.deadline);
        });

        let totalUnits = 0;
        let totalEstDurationHours = 0;

        const now = new Date();
        const machineScheduleTrack = availableMachines.map(m => ({
            machineName: m.machine_name || m.machineName,
            status: m.status,
            availableAt: new Date(now),
            assignedOrdersCount: 0,
            totalWorkloadHours: 0
        }));

        const allocatedOrders = [];

        sortedOrders.forEach((order) => {
            const qty = parseInt(order.quantity) || 1;
            const procTimePerUnit = parseFloat(order.processingTime || order.processing_time) || 0.05;
            const durationHours = qty * procTimePerUnit;

            totalUnits += qty;
            totalEstDurationHours += durationHours;

            machineScheduleTrack.sort((a, b) => a.availableAt - b.availableAt);
            const assignedM = machineScheduleTrack[0];

            const startTime = new Date(assignedM.availableAt);
            const endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);

            assignedM.availableAt = new Date(endTime);
            assignedM.assignedOrdersCount += 1;
            assignedM.totalWorkloadHours += durationHours;

            const deadlineDate = new Date(order.deadline);
            const isDelayed = endTime > deadlineDate;

            allocatedOrders.push({
                ...order,
                orderId: order.orderId || order.order_id || ('ORD-' + Math.floor(100 + Math.random() * 900)),
                assignedMachine: assignedM.machineName,
                startTimeFormatted: formatDateTime(startTime),
                endTimeFormatted: formatDateTime(endTime),
                deadlineFormatted: formatDateTime(deadlineDate),
                durationHours: durationHours.toFixed(2),
                riskStatus: isDelayed ? 'Delay Alert' : 'On Track'
            });
        });

        currentAnalysisOrders = allocatedOrders;

        openAnalysisModal({
            totalOrders: ordersToAnalyze.length,
            totalUnits: totalUnits,
            totalEstDurationHours: totalEstDurationHours.toFixed(1),
            allMachines: machines,
            availableMachinesCount: availableMachines.length,
            machineScheduleTrack: machineScheduleTrack,
            allocatedOrders: allocatedOrders
        });
    } catch (err) {
        alert('Simulation error: ' + err.message);
    }
}

function formatDateTime(d) {
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function openAnalysisModal(data) {
    const modal = document.getElementById('analysisModal');
    if (!modal) return;

    document.getElementById('kpiTotalOrders').textContent = data.totalOrders;
    document.getElementById('kpiTotalUnits').textContent = data.totalUnits;
    document.getElementById('kpiEstDuration').textContent = data.totalEstDurationHours + ' hrs';
    document.getElementById('kpiAvailableMachines').textContent = `${data.availableMachinesCount} / ${data.allMachines.length}`;

    const chipsContainer = document.getElementById('machineStatusChips');
    if (chipsContainer) {
        chipsContainer.innerHTML = '';
        data.allMachines.forEach(m => {
            const mName = m.machine_name || m.machineName;
            const trackObj = data.machineScheduleTrack.find(t => t.machineName === mName);
            const statusLower = m.status ? m.status.toLowerCase() : 'available';
            const workloadText = trackObj ? ` (${trackObj.totalWorkloadHours.toFixed(1)} hrs allocated)` : ' (0 hrs)';

            const chip = document.createElement('div');
            chip.className = 'machine-chip';
            chip.innerHTML = `
                <span class="chip-status-dot ${statusLower}"></span>
                <strong>${mName}</strong>: ${m.status}${workloadText}
            `;
            chipsContainer.appendChild(chip);
        });
    }

    const tbody = document.getElementById('analysisTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        data.allocatedOrders.forEach(o => {
            const tr = document.createElement('tr');
            const isDelay = o.riskStatus === 'Delay Alert';

            tr.innerHTML = `
                <td><strong>${o.orderId}</strong></td>
                <td>${o.productName || o.product_name}</td>
                <td>${o.quantity} units</td>
                <td><span class="badge ${o.priority === 'High' ? 'badge-danger' : o.priority === 'Medium' ? 'badge-warning' : 'badge-info'}">${o.priority}</span></td>
                <td><span class="badge badge-info">🏭 ${o.assignedMachine}</span></td>
                <td>${o.startTimeFormatted}</td>
                <td>${o.endTimeFormatted}</td>
                <td>${o.deadlineFormatted}</td>
                <td>
                    <span class="badge ${isDelay ? 'badge-delay-alert' : 'badge-on-track'}">
                        ${isDelay ? '🔴 Delay Alert' : '🟢 On Track'}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    modal.style.display = 'flex';
}

function closeAnalysisModal() {
    const modal = document.getElementById('analysisModal');
    if (modal) modal.style.display = 'none';
}

async function confirmAndSaveAnalysisOrders() {
    if (!currentAnalysisOrders || currentAnalysisOrders.length === 0) return;

    try {
        const payloadList = currentAnalysisOrders.map(o => ({
            order_id: o.orderId,
            product_name: o.productName || o.product_name,
            quantity: o.quantity,
            priority: o.priority,
            deadline: (o.deadline || '').split('T')[0] || o.deadline,
            processing_time: parseFloat(o.processingTime || o.processing_time) || 0.05,
            status: 'Pending'
        }));

        if (payloadList.length === 1) {
            await apiFetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify(payloadList[0])
            });
        } else {
            await apiFetch('/api/orders/bulk', {
                method: 'POST',
                body: JSON.stringify(payloadList)
            });
        }

        closeAnalysisModal();
        resetOrderForm();
        resetBulkCSV();
        await renderOrdersTable();
        showToast('Orders Saved', `Successfully saved ${payloadList.length} order(s) to MySQL!`, 'success');
    } catch (err) {
        alert('Failed to save orders: ' + err.message);
    }
}

function analyzeBulkCSVOrders() {
    const validOrders = parsedBulkOrders.filter(o => o.isValid);
    if (validOrders.length === 0) {
        alert('No valid orders found in file to analyze!');
        return;
    }
    analyzePreSchedule(validOrders);
}

async function renderOrdersTable() {
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    const searchVal = document.getElementById('orderSearchInput') ? document.getElementById('orderSearchInput').value.trim() : '';
    const priorityVal = document.getElementById('orderPriorityFilter') ? document.getElementById('orderPriorityFilter').value : 'All';
    const statusVal = document.getElementById('orderStatusFilter') ? document.getElementById('orderStatusFilter').value : 'All';

    let url = '/api/orders?';
    if (searchVal) url += `search=${encodeURIComponent(searchVal)}&`;
    if (priorityVal && priorityVal !== 'All') url += `priority=${encodeURIComponent(priorityVal)}&`;
    if (statusVal && statusVal !== 'All') url += `status_filter=${encodeURIComponent(statusVal)}&`;

    try {
        const orders = await apiFetch(url);
        tableBody.innerHTML = '';

        if (orders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="empty-placeholder">No orders match the selected search/filter criteria.</td></tr>`;
            return;
        }

        orders.forEach((order) => {
            let priorityBadge = 'badge-info';
            if (order.priority === 'High') priorityBadge = 'badge-danger';
            if (order.priority === 'Medium') priorityBadge = 'badge-warning';

            let statusBadge = 'badge-warning';
            if (order.status === 'Completed') statusBadge = 'badge-success';
            if (order.status === 'In Progress') statusBadge = 'badge-info';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${order.order_id}</strong></td>
                <td>${order.product_name}</td>
                <td>${order.quantity} units</td>
                <td><span class="badge ${priorityBadge}">${order.priority}</span></td>
                <td>${order.deadline}</td>
                <td><span class="badge ${statusBadge}">${order.status}</span></td>
                <td class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editOrder('${order.id}')" title="Edit Order">✏️ Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="openDeleteOrderModal('${order.id}', '${order.order_id}')" title="Delete Order">🗑️ Delete</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to render orders table:', err);
    }
}

function setupOrderFilters() {
    const searchInput = document.getElementById('orderSearchInput');
    const priorityFilter = document.getElementById('orderPriorityFilter');
    const statusFilter = document.getElementById('orderStatusFilter');

    if (searchInput) searchInput.addEventListener('input', renderOrdersTable);
    if (priorityFilter) priorityFilter.addEventListener('change', renderOrdersTable);
    if (statusFilter) statusFilter.addEventListener('change', renderOrdersTable);
}

function setupOrderForm() {
    const form = document.getElementById('orderForm');
    const cancelBtn = document.getElementById('cancelOrderEditBtn');
    if (!form) return;

    form.addEventListener('submit', async function (event) {
        event.preventDefault();

        const editId = document.getElementById('orderEditId').value;
        const productName = document.getElementById('orderProductSelect').value;
        const quantity = parseInt(document.getElementById('orderQuantity').value);
        const priority = document.getElementById('orderPriority').value;
        const deadline = document.getElementById('orderDeadline').value;
        const procTime = parseFloat(document.getElementById('orderProcessingTime').value) || 0.05;

        if (!productName) { alert('Please select a product.'); return; }
        if (isNaN(quantity) || quantity <= 0) { alert('Please enter a valid quantity.'); return; }
        if (!deadline) { alert('Please select a deadline.'); return; }

        if (editId) {
            try {
                const statusSelect = document.getElementById('orderStatus');
                const statusVal = statusSelect ? statusSelect.value : 'Pending';
                const formattedDeadline = deadline.split('T')[0] || deadline;

                await apiFetch(`/api/orders/${editId}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        product_name: productName,
                        quantity,
                        priority,
                        deadline: formattedDeadline,
                        status: statusVal
                    })
                });

                showToast('Order Updated', `Successfully updated Order #${editId}`, 'success');
                resetOrderForm();
                await renderOrdersTable();
            } catch (err) {
                showToast('Update Failed', err.message, 'error');
                alert('Failed to update order: ' + err.message);
            }
        } else {
            const singleOrder = [{
                id: Date.now(),
                orderId: 'ORD-' + Math.floor(100 + Math.random() * 900),
                productName: productName,
                quantity: quantity,
                priority: priority,
                deadline: deadline,
                processingTime: procTime,
                status: 'Pending'
            }];
            analyzePreSchedule(singleOrder);
        }
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetOrderForm);
}

async function editOrder(id) {
    try {
        const order = await apiFetch(`/api/orders/${id}`);
        if (order) {
            document.getElementById('orderEditId').value = order.id;
            document.getElementById('orderProductSelect').value = order.product_name;
            document.getElementById('orderQuantity').value = order.quantity;
            document.getElementById('orderPriority').value = order.priority;

            const deadlineInput = document.getElementById('orderDeadline');
            if (deadlineInput) {
                const rawDate = (order.deadline || '').split('T')[0];
                if (deadlineInput.type === 'date') {
                    deadlineInput.value = rawDate;
                } else {
                    deadlineInput.value = rawDate ? `${rawDate}T09:00` : '';
                }
            }

            const statusGroup = document.getElementById('orderStatusGroup');
            const statusSelect = document.getElementById('orderStatus');
            if (statusGroup && statusSelect) {
                statusGroup.style.display = 'block';
                statusSelect.value = order.status || 'Pending';
            }

            document.getElementById('orderFormBtn').textContent = '💾 Update Order';
            if (document.getElementById('orderFormTitle')) {
                document.getElementById('orderFormTitle').textContent = `✏️ Edit Production Order: #${order.order_id}`;
            }
            if (document.getElementById('cancelOrderEditBtn')) {
                document.getElementById('cancelOrderEditBtn').style.display = 'inline-block';
            }

            // Smoothly scroll to the form card and highlight it
            const formCard = document.getElementById('orderForm') ? document.getElementById('orderForm').closest('.card') : null;
            if (formCard) {
                formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                formCard.style.boxShadow = '0 0 0 3px var(--primary-color, #2563eb)';
                setTimeout(() => { formCard.style.boxShadow = ''; }, 2000);
            }

            showToast('Editing Order', `Loaded Order #${order.order_id} into form`, 'info');
        }
    } catch (err) {
        showToast('Error', 'Could not fetch order: ' + err.message, 'error');
    }
}

let pendingDeleteOrderId = null;

function openDeleteOrderModal(id, orderCode) {
    pendingDeleteOrderId = id;
    const modal = document.getElementById('deleteOrderModal');
    const codeEl = document.getElementById('deleteOrderCode');
    if (codeEl) codeEl.textContent = orderCode || `#${id}`;
    if (modal) {
        modal.style.display = 'flex';
    } else {
        if (confirm(`Are you sure you want to delete order ${orderCode || '#' + id}?`)) {
            executeDeleteOrder(id);
        }
    }
}

function closeDeleteOrderModal() {
    pendingDeleteOrderId = null;
    const modal = document.getElementById('deleteOrderModal');
    if (modal) modal.style.display = 'none';
}

async function confirmDeleteOrder() {
    if (!pendingDeleteOrderId) return;
    const idToDelete = pendingDeleteOrderId;
    closeDeleteOrderModal();
    await executeDeleteOrder(idToDelete);
}

async function executeDeleteOrder(id) {
    try {
        await apiFetch(`/api/orders/${id}`, { method: 'DELETE' });
        showToast('Order Deleted', `Order was deleted successfully from database.`, 'success');
        await renderOrdersTable();
    } catch (err) {
        showToast('Delete Failed', err.message, 'error');
        alert('Failed to delete order: ' + err.message);
    }
}

async function deleteOrder(id) {
    openDeleteOrderModal(id, `#${id}`);
}

function resetOrderForm() {
    const form = document.getElementById('orderForm');
    if (form) form.reset();
    document.getElementById('orderEditId').value = '';
    document.getElementById('orderFormBtn').textContent = '⚡ Add & Analyze';
    if (document.getElementById('orderFormTitle')) {
        document.getElementById('orderFormTitle').textContent = 'Create New Order & Live Analysis';
    }
    if (document.getElementById('cancelOrderEditBtn')) {
        document.getElementById('cancelOrderEditBtn').style.display = 'none';
    }
    const statusGroup = document.getElementById('orderStatusGroup');
    if (statusGroup) statusGroup.style.display = 'none';
}


// ==========================================
// SCHEDULE PAGE LOGIC
// ==========================================
async function renderScheduleTable() {
    const tableBody = document.getElementById('scheduleTableBody');
    if (!tableBody) return;

    try {
        const schedule = await apiFetch('/api/schedule');
        tableBody.innerHTML = '';

        if (schedule.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="empty-placeholder">No schedule generated yet. Click "Generate Best Schedule".</td></tr>`;
            return;
        }

        schedule.forEach(item => {
            let priorityBadge = 'badge-info';
            if (item.priority === 'High') priorityBadge = 'badge-danger';
            if (item.priority === 'Medium') priorityBadge = 'badge-warning';

            let statusBadge = 'badge-success';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${item.machine_name}</strong></td>
                <td><span class="badge badge-info">${item.order_code || item.order_id}</span></td>
                <td>${item.product_name}</td>
                <td>${item.start_time}</td>
                <td>${item.end_time}</td>
                <td><span class="badge ${priorityBadge}">${item.priority}</span></td>
                <td><span class="badge ${statusBadge}">${item.status}</span></td>
            `;
            tableBody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to render schedule table:', err);
    }
}

async function renderGanttTimeline() {
    const ganttContainer = document.getElementById('ganttTimelineBody');
    if (!ganttContainer) return;

    try {
        const [schedule, machines] = await Promise.all([
            apiFetch('/api/schedule'),
            apiFetch('/api/machines')
        ]);

        ganttContainer.innerHTML = '';

        if (schedule.length === 0) {
            ganttContainer.innerHTML = `<div class="empty-placeholder">Generate schedule to view visual Gantt timeline.</div>`;
            return;
        }

        machines.forEach(m => {
            const mName = m.machine_name || m.machineName;
            const mSchedule = schedule.filter(s => s.machine_name === mName);

            const row = document.createElement('div');
            row.className = 'gantt-row';

            let slotContent = '';
            if (mSchedule.length > 0) {
                mSchedule.forEach(item => {
                    const priorityClass = item.priority ? item.priority.toLowerCase() : 'low';
                    const orderDisplay = item.order_code || item.order_id;
                    slotContent += `<div class="gantt-bar ${priorityClass}">${item.product_name} (${orderDisplay})</div>`;
                });
            } else {
                slotContent = `<span style="color: var(--text-muted); font-size: 12px; padding: 6px;">Idle</span>`;
            }

            row.innerHTML = `
                <div class="gantt-machine-label">${mName}</div>
                <div class="gantt-slot" style="grid-column: span 6;">
                    ${slotContent}
                </div>
            `;
            ganttContainer.appendChild(row);
        });
    } catch (err) {
        console.error('Failed to render Gantt timeline:', err);
    }
}

function setupScheduleGenerator() {
    const generateBtn = document.getElementById('generateScheduleBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', async function () {
        const statusBox = document.getElementById('scheduleLoadingStatus');
        if (statusBox) {
            statusBox.style.display = 'block';
            statusBox.style.color = 'var(--primary-color)';
            statusBox.textContent = '⏳ Analyzing orders & machine capacity in database...';
        }
        generateBtn.disabled = true;

        try {
            await apiFetch('/api/schedule/generate', { method: 'POST' });

            if (statusBox) {
                statusBox.textContent = '✅ Optimal schedule generated and saved to MySQL!';
                statusBox.style.color = '#16a34a';
            }

            await renderScheduleTable();
            await renderGanttTimeline();
            showToast('Schedule Generated', 'Production schedule generated and saved to database.', 'success');
        } catch (err) {
            if (statusBox) {
                statusBox.textContent = `❌ ${err.message}`;
                statusBox.style.color = '#dc2626';
            }
            alert('Scheduling failed: ' + err.message);
        } finally {
            generateBtn.disabled = false;
        }
    });
}


// ==========================================
// REPORTS PAGE LOGIC
// ==========================================
async function renderReports() {
    try {
        const reports = await apiFetch('/api/reports/summary');

        if (document.getElementById('rptTotalOrders')) document.getElementById('rptTotalOrders').textContent = reports.totalOrders;
        if (document.getElementById('rptCompletedOrders')) document.getElementById('rptCompletedOrders').textContent = reports.completedOrders;
        if (document.getElementById('rptPendingOrders')) document.getElementById('rptPendingOrders').textContent = reports.pendingOrders;
        if (document.getElementById('rptDelayedOrders')) document.getElementById('rptDelayedOrders').textContent = reports.delayedOrders;
        if (document.getElementById('rptTotalMachines')) document.getElementById('rptTotalMachines').textContent = reports.totalMachines;
        if (document.getElementById('rptAvailableMachines')) document.getElementById('rptAvailableMachines').textContent = reports.availableMachines;
        if (document.getElementById('rptMachineUtilization')) document.getElementById('rptMachineUtilization').textContent = reports.machineUtilization + '%';

        const dist = reports.distribution;
        if (document.getElementById('barCompleted')) document.getElementById('barCompleted').style.width = dist.completedPct + '%';
        if (document.getElementById('barCompletedTxt')) document.getElementById('barCompletedTxt').textContent = dist.completedPct + '%';

        if (document.getElementById('barPending')) document.getElementById('barPending').style.width = dist.pendingPct + '%';
        if (document.getElementById('barPendingTxt')) document.getElementById('barPendingTxt').textContent = dist.pendingPct + '%';

        if (document.getElementById('barDelayed')) document.getElementById('barDelayed').style.width = dist.delayedPct + '%';
        if (document.getElementById('barDelayedTxt')) document.getElementById('barDelayedTxt').textContent = dist.delayedPct + '%';

        if (document.getElementById('completionRateVal')) document.getElementById('completionRateVal').textContent = reports.completionRate;

        // Machine Usage Bars
        const machineUsageBody = document.getElementById('rptMachineUsageBars');
        if (machineUsageBody) {
            machineUsageBody.innerHTML = '';
            reports.machineUsage.forEach(m => {
                const div = document.createElement('div');
                div.style.marginBottom = '12px';
                div.innerHTML = `
                    <div class="progress-label">
                        <span>${m.machineName} (${m.status})</span>
                        <span>${m.usagePct}</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${m.usagePct};"></div>
                    </div>
                `;
                machineUsageBody.appendChild(div);
            });
        }
    } catch (err) {
        console.error('Failed to render reports:', err);
    }
}
