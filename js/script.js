/* 

   IPSS - Intelligent Product Scheduling System
  
*/

// --- Helper Functions for LocalStorage ---
function getData(key) {
    let ipssKey = key.replace('itps_', 'ipss_');
    let legacyKey = key.replace('ipss_', 'itps_');
    let data = localStorage.getItem(ipssKey) || localStorage.getItem(legacyKey) || localStorage.getItem(key);
    return JSON.parse(data) || [];
}

function saveData(key, data) {
    let ipssKey = key.replace('itps_', 'ipss_');
    let legacyKey = key.replace('ipss_', 'itps_');
    localStorage.setItem(ipssKey, JSON.stringify(data));
    localStorage.setItem(legacyKey, JSON.stringify(data));
}

// --- Theme (Dark Mode) Manager ---
function initTheme() {
    const savedTheme = localStorage.getItem('ipss_theme') || localStorage.getItem('itps_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeToggleButton(true);
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('ipss_theme', isDark ? 'dark' : 'light');
    localStorage.setItem('itps_theme', isDark ? 'dark' : 'light');
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

// --- Initialize Default Storage Data ---
function initDefaultData() {
    if (!localStorage.getItem('ipss_products') && !localStorage.getItem('itps_products')) {
        const defaultProducts = [
            { id: 1, productName: 'Laptop Assembly', category: 'Electronics', processingTime: 2.0, preferredLine: 'M-01' },
            { id: 2, productName: 'Mouse Housing', category: 'Peripherals', processingTime: 1.5, preferredLine: 'M-02' },
            { id: 3, productName: 'Motor Shaft', category: 'Mechanical', processingTime: 3.0, preferredLine: 'M-03' },
            { id: 4, productName: 'Control Panel Unit', category: 'Control Units', processingTime: 4.0, preferredLine: 'M-04' }
        ];
        saveData('ipss_products', defaultProducts);
    }

    if (!localStorage.getItem('ipss_machines') && !localStorage.getItem('itps_machines')) {
        const defaultMachines = [
            { id: 1, machineName: 'M-01', capacity: 120, status: 'Available' },
            { id: 2, machineName: 'M-02', capacity: 80, status: 'Working' },
            { id: 3, machineName: 'M-03', capacity: 200, status: 'Available' },
            { id: 4, machineName: 'M-04', capacity: 60, status: 'Maintenance' }
        ];
        saveData('ipss_machines', defaultMachines);
    }

    if (!localStorage.getItem('ipss_orders') && !localStorage.getItem('itps_orders')) {
        const defaultOrders = [
            { id: 1, orderId: 'ORD-101', productName: 'Laptop Assembly', quantity: 50, priority: 'High', deadline: '2026-08-20', status: 'Pending' },
            { id: 2, orderId: 'ORD-102', productName: 'Mouse Housing', quantity: 100, priority: 'Medium', deadline: '2026-08-22', status: 'Pending' },
            { id: 3, orderId: 'ORD-103', productName: 'Motor Shaft', quantity: 30, priority: 'Low', deadline: '2026-08-25', status: 'Completed' },
            { id: 4, orderId: 'ORD-104', productName: 'Control Panel Unit', quantity: 20, priority: 'High', deadline: '2026-08-18', status: 'Pending' }
        ];
        saveData('ipss_orders', defaultOrders);
    }

    if (!localStorage.getItem('ipss_schedule') && !localStorage.getItem('itps_schedule')) {
        const defaultSchedule = [
            { id: 1, machineName: 'M-01', orderId: 'ORD-101', productName: 'Laptop Assembly', startTime: '09:00', endTime: '11:00', priority: 'High', status: 'Scheduled' },
            { id: 2, machineName: 'M-02', orderId: 'ORD-102', productName: 'Mouse Housing', startTime: '09:00', endTime: '10:30', priority: 'Medium', status: 'Scheduled' }
        ];
        saveData('ipss_schedule', defaultSchedule);
    }

    if (!localStorage.getItem('ipss_activities') && !localStorage.getItem('itps_activities')) {
        const defaultActivities = [
            { text: 'Order #ORD-104 created', time: '10 mins ago', type: 'info' },
            { text: 'Machine M-02 changed to Working', time: '25 mins ago', type: 'warning' },
            { text: 'Schedule generated successfully', time: '1 hour ago', type: 'success' }
        ];
        saveData('ipss_activities', defaultActivities);
    }

    initDefaultProfile();
}

function initDefaultProfile() {
    let stored = localStorage.getItem('ipss_profile') || localStorage.getItem('itps_profile');
    let profile = stored ? JSON.parse(stored) : {};

    if (!profile.phone || profile.phone === '+1 (555) 234-5678') profile.phone = '+91 **********';
    if (!profile.dob || profile.dob === '1990-05-15') profile.dob = '2006-06-12';
    if (!profile.address || profile.address === '123 Industrial Parkway, Suite 400' || profile.address === '123 Lucknow') profile.address = 'Lucknow';
    if (!profile.fullName) profile.fullName = 'Admin User';
    if (!profile.username) profile.username = 'admin';
    if (!profile.email) profile.email = 'admin@ipss.com';
    if (!profile.employeeId) profile.employeeId = 'IPSS-001';
    if (!profile.department) profile.department = 'Production & Planning';
    if (!profile.designation) profile.designation = 'Production Manager';

    saveData('ipss_profile', profile);
}

function getProfile() {
    initDefaultProfile();
    let data = localStorage.getItem('ipss_profile') || localStorage.getItem('itps_profile');
    return JSON.parse(data);
}

function saveProfileData(profile) {
    saveData('ipss_profile', profile);
}

function addRecentActivity(text, type = 'info') {
    let activities = getData('ipss_activities');
    activities.unshift({ text: text, time: 'Just now', type: type });
    if (activities.length > 8) activities = activities.slice(0, 8);
    saveData('ipss_activities', activities);
}

// --- Logout Action ---
function logout() {
    localStorage.removeItem('ipss_user');
    localStorage.removeItem('itps_user');
    window.location.href = 'index.html';
}

// --- Login Protection Check ---
function checkAuth(currentPage) {
    const publicPages = ['index.html', 'login.html', ''];
    const isPublic = publicPages.includes(currentPage);
    const isLoggedIn = (localStorage.getItem('ipss_user') || localStorage.getItem('itps_user')) !== null;

    if (!isPublic && !isLoggedIn) {
        window.location.href = 'index.html';
    }
}

// --- DOM Content Loaded Initialization ---
document.addEventListener('DOMContentLoaded', function () {
    initDefaultData();
    initTheme();
    highlightActiveNavLink();

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    checkAuth(currentPage);
    updateHeaderProfileInfo();

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

// --- Header Profile Avatar & Name Sync ---
function updateHeaderProfileInfo() {
    const profile = getProfile();
    const avatarEl = document.getElementById('headerUserAvatar');
    const nameEl = document.getElementById('headerUserName');

    if (profile) {
        const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        if (avatarEl) avatarEl.textContent = initials;
        if (nameEl) nameEl.textContent = profile.fullName;
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

// --- LOGIN PAGE ---
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const usernameInput = document.getElementById('username') || document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const username = usernameInput ? usernameInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';
        const errorMsgDiv = document.getElementById('loginErrorMessage');

        if ((username === 'admin' || username === 'admin@ipss.com' || username === 'admin@itps.com') && password === 'admin123') {
            localStorage.setItem('ipss_user', JSON.stringify({ username: username, role: 'Production Manager' }));
            localStorage.setItem('itps_user', JSON.stringify({ username: username, role: 'Production Manager' }));
            window.location.href = 'dashboard.html';
        } else if (username !== '' && password !== '') {
            localStorage.setItem('ipss_user', JSON.stringify({ username: username, role: 'Production Manager' }));
            localStorage.setItem('itps_user', JSON.stringify({ username: username, role: 'Production Manager' }));
            window.location.href = 'dashboard.html';
        } else {
            if (errorMsgDiv) {
                errorMsgDiv.textContent = 'Invalid credentials! Try: admin / admin123';
                errorMsgDiv.style.display = 'block';
            } else {
                alert('Invalid credentials! Try: admin / admin123');
            }
        }
    });
}

// --- PROFILE PAGE LOGIC ---
function loadProfile() {
    const profile = getProfile();
    if (!profile) return;

    const initials = profile.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Header Banner
    if (document.getElementById('profileAvatarLarge')) document.getElementById('profileAvatarLarge').textContent = initials;
    if (document.getElementById('profileHeaderFullName')) document.getElementById('profileHeaderFullName').textContent = profile.fullName;
    if (document.getElementById('profileHeaderUsername')) document.getElementById('profileHeaderUsername').textContent = profile.username;
    if (document.getElementById('profileHeaderRole')) document.getElementById('profileHeaderRole').textContent = profile.designation;

    // Personal Info Cards
    if (document.getElementById('infoFullName')) document.getElementById('infoFullName').textContent = profile.fullName;
    if (document.getElementById('infoUsername')) document.getElementById('infoUsername').textContent = profile.username;
    if (document.getElementById('infoEmail')) document.getElementById('infoEmail').textContent = profile.email;
    if (document.getElementById('infoPhone')) document.getElementById('infoPhone').textContent = profile.phone;
    if (document.getElementById('infoDob')) document.getElementById('infoDob').textContent = profile.dob;
    if (document.getElementById('infoGender')) document.getElementById('infoGender').textContent = profile.gender;
    if (document.getElementById('infoAddress')) document.getElementById('infoAddress').textContent = profile.address;

    // Populate Edit Form Inputs
    if (document.getElementById('editFullName')) document.getElementById('editFullName').value = profile.fullName;
    if (document.getElementById('editEmail')) document.getElementById('editEmail').value = profile.email;
    if (document.getElementById('editPhone')) document.getElementById('editPhone').value = profile.phone;
    if (document.getElementById('editDob')) document.getElementById('editDob').value = profile.dob;
    if (document.getElementById('editGender')) document.getElementById('editGender').value = profile.gender;
    if (document.getElementById('editAddress')) document.getElementById('editAddress').value = profile.address;
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

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        let profile = getProfile();
        profile.fullName = document.getElementById('editFullName').value.trim();
        profile.email = document.getElementById('editEmail').value.trim();
        profile.phone = document.getElementById('editPhone').value.trim();
        profile.dob = document.getElementById('editDob').value;
        profile.gender = document.getElementById('editGender').value;
        profile.address = document.getElementById('editAddress').value.trim();

        saveProfileData(profile);
        loadProfile();
        updateHeaderProfileInfo();

        const alertBox = document.getElementById('profileAlertMsg');
        if (alertBox) {
            alertBox.textContent = '✅ Profile updated successfully.';
            alertBox.style.display = 'flex';
            setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
        } else {
            alert('Profile updated successfully.');
        }

        toggleEditProfileForm();
        addRecentActivity('Updated user profile details', 'info');
    });
}



// --- DASHBOARD PAGE ---
function updateDashboard() {
    const products = getData('itps_products');
    const machines = getData('itps_machines');
    const orders = getData('itps_orders');
    const activities = getData('itps_activities');

    const totalProducts = products.length;
    const totalMachines = machines.length;
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;

    const today = new Date().toISOString().split('T')[0];
    const delayedOrders = orders.filter(o => o.deadline < today && o.status !== 'Completed').length;

    // Stats Cards
    if (document.getElementById('dashTotalProducts')) document.getElementById('dashTotalProducts').textContent = totalProducts;
    if (document.getElementById('dashTotalMachines')) document.getElementById('dashTotalMachines').textContent = totalMachines;
    if (document.getElementById('dashTotalOrders')) document.getElementById('dashTotalOrders').textContent = totalOrders;
    if (document.getElementById('dashPendingOrders')) document.getElementById('dashPendingOrders').textContent = pendingOrders;
    if (document.getElementById('dashCompletedOrders')) document.getElementById('dashCompletedOrders').textContent = completedOrders;
    if (document.getElementById('dashDelayedOrders')) document.getElementById('dashDelayedOrders').textContent = delayedOrders;

    // Production Progress
    const completionPercentage = totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;
    if (document.getElementById('dashProgressVal')) document.getElementById('dashProgressVal').textContent = completionPercentage + '%';
    if (document.getElementById('dashProgressBarFill')) document.getElementById('dashProgressBarFill').style.width = completionPercentage + '%';

    // Dashboard Notifications / Alerts
    const notifArea = document.getElementById('dashboardNotifications');
    if (notifArea) {
        notifArea.innerHTML = '';
        if (delayedOrders > 0) {
            notifArea.innerHTML += `
                <div class="alert-box alert-danger">
                    <span>⚠️ <strong>Alert:</strong> ${delayedOrders} production order(s) are past deadline!</span>
                    <a href="orders.html" class="btn btn-sm btn-danger">View Orders</a>
                </div>`;
        }
        const maintenanceCount = machines.filter(m => m.status === 'Maintenance').length;
        if (maintenanceCount > 0) {
            notifArea.innerHTML += `
                <div class="alert-box alert-warning">
                    <span>🔧 <strong>Notice:</strong> ${maintenanceCount} machine(s) are currently under maintenance.</span>
                    <a href="machines.html" class="btn btn-sm btn-secondary">Check Status</a>
                </div>`;
        }
    }

    // Machine Status List & Utilization
    const machineBody = document.getElementById('dashMachineStatusBody');
    if (machineBody) {
        machineBody.innerHTML = '';
        machines.forEach(m => {
            let badgeClass = 'badge-success';
            let util = '85%';
            if (m.status === 'Working') { badgeClass = 'badge-warning'; util = '70%'; }
            if (m.status === 'Maintenance') { badgeClass = 'badge-danger'; util = '0%'; }

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${m.machineName}</strong></td>
                <td>${m.capacity} units/day</td>
                <td><span class="badge ${badgeClass}">${m.status}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="progress-track" style="flex: 1; height: 8px;">
                            <div class="progress-fill" style="width: ${util};"></div>
                        </div>
                        <span style="font-size: 12px; font-weight: 600;">${util}</span>
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
        const pendingList = orders.filter(o => o.status === 'Pending').slice(0, 4);
        if (pendingList.length === 0) {
            upcomingBody.innerHTML = `<tr><td colspan="4" class="empty-placeholder">No upcoming pending deadlines.</td></tr>`;
        } else {
            pendingList.forEach(o => {
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

    // Recent Activity Feed
    const activityList = document.getElementById('dashActivityList');
    if (activityList) {
        activityList.innerHTML = '';
        activities.forEach(act => {
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
}

// --- PRODUCTS PAGE ---
function renderProductsTable(filterText = '') {
    let products = getData('itps_products');
    const orders = getData('itps_orders');
    const tableBody = document.getElementById('productsTableBody');
    if (!tableBody) return;

    // Filter products
    let filteredProducts = products;
    if (filterText) {
        filteredProducts = products.filter(p => 
            p.productName.toLowerCase().includes(filterText.toLowerCase()) || 
            (p.category && p.category.toLowerCase().includes(filterText.toLowerCase()))
        );
    }

    // Compute Product Analytics
    const totalCount = products.length;
    let sumProcTime = 0;
    let totalLinkedOrdersCount = 0;
    let totalScheduledUnitsVolume = 0;

    products.forEach(p => {
        sumProcTime += parseFloat(p.processingTime) || 0;
        const matchingOrders = orders.filter(o => o.productName === p.productName);
        totalLinkedOrdersCount += matchingOrders.length;
        matchingOrders.forEach(o => {
            totalScheduledUnitsVolume += parseInt(o.quantity) || 0;
        });
    });

    const avgProcTime = totalCount > 0 ? (sumProcTime / totalCount).toFixed(1) : '0.0';

    // Update KPI Cards
    if (document.getElementById('prdTotalCount')) document.getElementById('prdTotalCount').textContent = totalCount;
    if (document.getElementById('prdAvgProcTime')) document.getElementById('prdAvgProcTime').textContent = avgProcTime + ' hrs';
    if (document.getElementById('prdTotalOrdersLinked')) document.getElementById('prdTotalOrdersLinked').textContent = totalLinkedOrdersCount;
    if (document.getElementById('prdTotalVolume')) document.getElementById('prdTotalVolume').textContent = totalScheduledUnitsVolume + ' units';

    tableBody.innerHTML = '';

    if (filteredProducts.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="empty-placeholder">No master products found.</td></tr>`;
        return;
    }

    filteredProducts.forEach((product, index) => {
        const matchingOrders = orders.filter(o => o.productName === product.productName);
        const linkedOrdersCount = matchingOrders.length;
        let productVolume = 0;
        matchingOrders.forEach(o => { productVolume += parseInt(o.quantity) || 0; });

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${index + 1}</td>
            <td><strong>${product.productName}</strong></td>
            <td><span class="badge badge-info">${product.category || 'General'}</span></td>
            <td>${product.processingTime} hrs/unit</td>
            <td><span class="badge badge-warning">🏭 ${product.preferredLine || 'All Machines'}</span></td>
            <td><strong>${linkedOrdersCount}</strong> active order(s)</td>
            <td><strong>${productVolume}</strong> units scheduled</td>
            <td class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="editProduct(${product.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
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

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const productId = document.getElementById('productId').value;
        const productName = document.getElementById('productName').value.trim();
        const category = document.getElementById('productCategory').value;
        const processingTime = parseFloat(document.getElementById('processingTime').value);
        const preferredLine = document.getElementById('assignedMachineSelect') ? document.getElementById('assignedMachineSelect').value : 'All Machines';

        if (!productName) { alert('Please enter a product name.'); return; }
        if (isNaN(processingTime) || processingTime <= 0) { alert('Please enter a valid processing time greater than 0.'); return; }

        let products = getData('itps_products');

        if (productId) {
            products = products.map(p => p.id == productId ? { id: parseInt(productId), productName, category, processingTime, preferredLine } : p);
            addRecentActivity(`Updated Product Master "${productName}"`, 'info');
            alert('Product master updated successfully!');
        } else {
            const newProduct = { 
                id: Date.now(), 
                productName: productName, 
                category: category, 
                processingTime: processingTime, 
                preferredLine: preferredLine 
            };
            products.push(newProduct);
            addRecentActivity(`Created Product Master "${productName}"`, 'success');
            alert('Product master added successfully!');
        }

        saveData('itps_products', products);
        resetProductForm();
        renderProductsTable();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetProductForm);
}

function editProduct(id) {
    const products = getData('itps_products');
    const product = products.find(p => p.id == id);
    if (product) {
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.productName;
        if (document.getElementById('productCategory')) document.getElementById('productCategory').value = product.category || 'General Assembly';
        document.getElementById('processingTime').value = product.processingTime;
        if (document.getElementById('assignedMachineSelect')) document.getElementById('assignedMachineSelect').value = product.preferredLine || 'All Machines';

        document.getElementById('formSubmitBtn').textContent = 'Update Product Master';
        if (document.getElementById('productFormTitle')) document.getElementById('productFormTitle').textContent = 'Edit Product Master';
        if (document.getElementById('cancelProductEditBtn')) document.getElementById('cancelProductEditBtn').style.display = 'inline-block';
    }
}

function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this master product?')) {
        let products = getData('itps_products');
        const prodObj = products.find(p => p.id == id);
        products = products.filter(p => p.id != id);
        saveData('itps_products', products);
        if (prodObj) addRecentActivity(`Deleted Product Master "${prodObj.productName}"`, 'danger');
        renderProductsTable();
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

// --- MACHINES PAGE ---
function renderMachinesTable(filterText = '') {
    let machines = getData('itps_machines');
    const tableBody = document.getElementById('machinesTableBody');
    if (!tableBody) return;

    if (filterText) {
        machines = machines.filter(m => m.machineName.toLowerCase().includes(filterText.toLowerCase()));
    }

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
            <td><strong>${machine.machineName}</strong></td>
            <td>${machine.capacity} units/day</td>
            <td><span class="badge ${badgeClass}">${machine.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="editMachine(${machine.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteMachine(${machine.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
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

    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const machineId = document.getElementById('machineId').value;
        const machineName = document.getElementById('machineName').value.trim();
        const capacity = parseInt(document.getElementById('machineCapacity').value);
        const status = document.getElementById('machineStatus').value;

        if (!machineName) { alert('Please enter machine name.'); return; }
        if (isNaN(capacity) || capacity <= 0) { alert('Please enter a valid capacity greater than 0.'); return; }

        let machines = getData('itps_machines');

        if (machineId) {
            machines = machines.map(m => m.id == machineId ? { id: parseInt(machineId), machineName, capacity, status } : m);
            addRecentActivity(`Updated machine "${machineName}" (${status})`, 'warning');
            alert('Machine updated successfully!');
        } else {
            const newMachine = { id: Date.now(), machineName: machineName, capacity: capacity, status: status };
            machines.push(newMachine);
            addRecentActivity(`Added machine "${machineName}"`, 'success');
            alert('Machine added successfully!');
        }

        saveData('itps_machines', machines);
        resetMachineForm();
        renderMachinesTable();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', resetMachineForm);
}

function editMachine(id) {
    const machines = getData('itps_machines');
    const machine = machines.find(m => m.id == id);
    if (machine) {
        document.getElementById('machineId').value = machine.id;
        document.getElementById('machineName').value = machine.machineName;
        document.getElementById('machineCapacity').value = machine.capacity;
        document.getElementById('machineStatus').value = machine.status;

        document.getElementById('machineFormBtn').textContent = 'Update Machine';
        if (document.getElementById('machineFormTitle')) document.getElementById('machineFormTitle').textContent = 'Edit Machine';
        if (document.getElementById('cancelMachineEditBtn')) document.getElementById('cancelMachineEditBtn').style.display = 'inline-block';
    }
}

function deleteMachine(id) {
    if (confirm('Are you sure you want to delete this machine?')) {
        let machines = getData('itps_machines');
        const mObj = machines.find(m => m.id == id);
        machines = machines.filter(m => m.id != id);
        saveData('itps_machines', machines);
        if (mObj) addRecentActivity(`Deleted machine "${mObj.machineName}"`, 'danger');
        renderMachinesTable();
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

// --- ORDERS PAGE ---
function switchOrderTab(tabName) {
    const manualBtn = document.getElementById('tabBtnManual');
    const bulkBtn = document.getElementById('tabBtnBulk');
    const manualContent = document.getElementById('tabContentManual');
    const bulkContent = document.getElementById('tabContentBulk');

    if (!manualBtn || !bulkBtn) return;

    if (tabName === 'manual') {
        manualBtn.classList.add('active');
        bulkBtn.classList.remove('active');
        manualContent.style.display = 'block';
        bulkContent.style.display = 'none';
    } else {
        bulkBtn.classList.add('active');
        manualBtn.classList.remove('active');
        bulkContent.style.display = 'block';
        manualContent.style.display = 'none';
    }
}

function populateOrderProductSelect() {
    const productSelect = document.getElementById('orderProductSelect');
    const procTimeInput = document.getElementById('orderProcessingTime');
    if (!productSelect) return;

    const products = getData('itps_products');
    productSelect.innerHTML = '<option value="">-- Select Product --</option>';

    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.productName;
        option.textContent = p.productName;
        productSelect.appendChild(option);
    });

    productSelect.addEventListener('change', function () {
        const selected = products.find(p => p.productName === this.value);
        if (selected && procTimeInput) {
            procTimeInput.value = selected.processingTime || 0.05;
        }
    });
}

// --- Sample CSV Generator ---
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

// --- Bulk CSV Drag & Drop Upload Engine ---
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
            const product = item.product || item.productName || '';
            const qty = parseInt(item.quantity || item.qty);
            const rawP = item.priority || 'Medium';
            const priority = rawP.charAt(0).toUpperCase() + rawP.slice(1).toLowerCase();
            const deadline = item.deadline || '';
            const procTime = parseFloat(item.processingTime) || 0.05;

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
        alert('Could not parse JSON file. Please check file format.');
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

    // Auto-detect header row
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

// --- Pre-Scheduling Live Analysis Engine ---
let currentAnalysisOrders = [];

function analyzePreSchedule(ordersToAnalyze) {
    if (!ordersToAnalyze || ordersToAnalyze.length === 0) {
        alert('No valid orders to analyze!');
        return;
    }

    const machines = getData('itps_machines');
    const availableMachines = machines.filter(m => m.status === 'Available' || m.status === 'Working');

    if (availableMachines.length === 0) {
        alert('Warning: No operational machines currently available in system!');
        return;
    }

    // Sort orders: Priority High -> Medium -> Low, then Earliest Deadline
    const priorityWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
    const sortedOrders = [...ordersToAnalyze].sort((a, b) => {
        const pA = priorityWeight[a.priority] || 1;
        const pB = priorityWeight[b.priority] || 1;
        if (pA !== pB) return pB - pA;
        return new Date(a.deadline) - new Date(b.deadline);
    });

    let totalUnits = 0;
    let totalEstDurationHours = 0;

    // Track machine finish times starting from current timestamp
    const now = new Date();
    const machineScheduleTrack = availableMachines.map(m => ({
        machineName: m.machineName,
        status: m.status,
        availableAt: new Date(now),
        assignedOrdersCount: 0,
        totalWorkloadHours: 0
    }));

    const allocatedOrders = [];

    sortedOrders.forEach((order, idx) => {
        const qty = parseInt(order.quantity) || 1;
        const procTimePerUnit = parseFloat(order.processingTime) || 0.05;
        const durationHours = qty * procTimePerUnit;

        totalUnits += qty;
        totalEstDurationHours += durationHours;

        // Assign to machine with earliest available slot
        machineScheduleTrack.sort((a, b) => a.availableAt - b.availableAt);
        const assignedM = machineScheduleTrack[0];

        const startTime = new Date(assignedM.availableAt);
        const endTime = new Date(startTime.getTime() + durationHours * 3600 * 1000);

        assignedM.availableAt = new Date(endTime);
        assignedM.assignedOrdersCount += 1;
        assignedM.totalWorkloadHours += durationHours;

        // Deadline risk calculation
        const deadlineDate = new Date(order.deadline);
        const isDelayed = endTime > deadlineDate;

        allocatedOrders.push({
            ...order,
            orderId: order.orderId || ('ORD-' + Math.floor(100 + Math.random() * 900)),
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
}

function formatDateTime(d) {
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function openAnalysisModal(data) {
    const modal = document.getElementById('analysisModal');
    if (!modal) return;

    // Fill KPI Metrics
    document.getElementById('kpiTotalOrders').textContent = data.totalOrders;
    document.getElementById('kpiTotalUnits').textContent = data.totalUnits;
    document.getElementById('kpiEstDuration').textContent = data.totalEstDurationHours + ' hrs';
    document.getElementById('kpiAvailableMachines').textContent = `${data.availableMachinesCount} / ${data.allMachines.length}`;

    // Fill Machine Chips
    const chipsContainer = document.getElementById('machineStatusChips');
    if (chipsContainer) {
        chipsContainer.innerHTML = '';
        data.allMachines.forEach(m => {
            const trackObj = data.machineScheduleTrack.find(t => t.machineName === m.machineName);
            const statusLower = m.status ? m.status.toLowerCase() : 'available';
            const workloadText = trackObj ? ` (${trackObj.totalWorkloadHours.toFixed(1)} hrs allocated)` : ' (0 hrs)';

            const chip = document.createElement('div');
            chip.className = 'machine-chip';
            chip.innerHTML = `
                <span class="chip-status-dot ${statusLower}"></span>
                <strong>${m.machineName}</strong>: ${m.status}${workloadText}
            `;
            chipsContainer.appendChild(chip);
        });
    }

    // Fill Analysis Table
    const tbody = document.getElementById('analysisTableBody');
    if (tbody) {
        tbody.innerHTML = '';
        data.allocatedOrders.forEach(o => {
            const tr = document.createElement('tr');
            const isDelay = o.riskStatus === 'Delay Alert';

            tr.innerHTML = `
                <td><strong>${o.orderId}</strong></td>
                <td>${o.productName}</td>
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

function confirmAndSaveAnalysisOrders() {
    if (!currentAnalysisOrders || currentAnalysisOrders.length === 0) return;

    let orders = getData('itps_orders');

    currentAnalysisOrders.forEach(o => {
        orders.push({
            id: o.id || Date.now(),
            orderId: o.orderId,
            productName: o.productName,
            quantity: o.quantity,
            priority: o.priority,
            deadline: o.deadline.split('T')[0] || o.deadline,
            status: 'Pending'
        });
    });

    saveData('itps_orders', orders);
    addRecentActivity(`Analyzed & Added ${currentAnalysisOrders.length} order(s) to system`, 'success');

    closeAnalysisModal();
    resetOrderForm();
    resetBulkCSV();
    renderOrdersTable();
    alert(`Successfully saved ${currentAnalysisOrders.length} order(s) to production list!`);
}

function analyzeBulkCSVOrders() {
    const validOrders = parsedBulkOrders.filter(o => o.isValid);
    if (validOrders.length === 0) {
        alert('No valid orders found in CSV to analyze!');
        return;
    }
    analyzePreSchedule(validOrders);
}

function renderOrdersTable() {
    let orders = getData('itps_orders');
    const tableBody = document.getElementById('ordersTableBody');
    if (!tableBody) return;

    const searchVal = document.getElementById('orderSearchInput') ? document.getElementById('orderSearchInput').value.toLowerCase().trim() : '';
    const priorityVal = document.getElementById('orderPriorityFilter') ? document.getElementById('orderPriorityFilter').value : 'All';
    const statusVal = document.getElementById('orderStatusFilter') ? document.getElementById('orderStatusFilter').value : 'All';

    if (searchVal) {
        orders = orders.filter(o => o.orderId.toLowerCase().includes(searchVal) || o.productName.toLowerCase().includes(searchVal));
    }

    if (priorityVal !== 'All') {
        orders = orders.filter(o => o.priority === priorityVal);
    }

    if (statusVal !== 'All') {
        orders = orders.filter(o => o.status === statusVal);
    }

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
            <td><strong>${order.orderId}</strong></td>
            <td>${order.productName}</td>
            <td>${order.quantity} units</td>
            <td><span class="badge ${priorityBadge}">${order.priority}</span></td>
            <td>${order.deadline}</td>
            <td><span class="badge ${statusBadge}">${order.status}</span></td>
            <td class="action-buttons">
                <button class="btn btn-secondary btn-sm" onclick="editOrder(${order.id})">Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deleteOrder(${order.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
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

    form.addEventListener('submit', function (event) {
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

        let orders = getData('itps_orders');

        if (editId) {
            orders = orders.map(o => o.id == editId ? { ...o, productName, quantity, priority, deadline } : o);
            addRecentActivity(`Updated Order #${editId}`, 'info');
            saveData('itps_orders', orders);
            resetOrderForm();
            renderOrdersTable();
            alert('Order updated successfully!');
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

function editOrder(id) {
    const orders = getData('itps_orders');
    const order = orders.find(o => o.id == id);
    if (order) {
        document.getElementById('orderEditId').value = order.id;
        document.getElementById('orderProductSelect').value = order.productName;
        document.getElementById('orderQuantity').value = order.quantity;
        document.getElementById('orderPriority').value = order.priority;
        document.getElementById('orderDeadline').value = order.deadline;

        document.getElementById('orderFormBtn').textContent = 'Update Order';
        if (document.getElementById('orderFormTitle')) document.getElementById('orderFormTitle').textContent = 'Edit Production Order';
        if (document.getElementById('cancelOrderEditBtn')) document.getElementById('cancelOrderEditBtn').style.display = 'inline-block';
        
        switchOrderTab('manual');
    }
}

function deleteOrder(id) {
    if (confirm('Are you sure you want to delete this order?')) {
        let orders = getData('itps_orders');
        const oObj = orders.find(o => o.id == id);
        orders = orders.filter(o => o.id != id);
        saveData('itps_orders', orders);
        if (oObj) addRecentActivity(`Deleted Order #${oObj.orderId}`, 'danger');
        renderOrdersTable();
    }
}

function resetOrderForm() {
    const form = document.getElementById('orderForm');
    if (form) form.reset();
    document.getElementById('orderEditId').value = '';
    document.getElementById('orderFormBtn').textContent = 'Add Order';
    if (document.getElementById('orderFormTitle')) document.getElementById('orderFormTitle').textContent = 'Dual Order Entry & Pre-Scheduling';
    if (document.getElementById('cancelOrderEditBtn')) document.getElementById('cancelOrderEditBtn').style.display = 'none';
}


// --- SCHEDULE PAGE ---
function renderScheduleTable() {
    const schedule = getData('itps_schedule');
    const tableBody = document.getElementById('scheduleTableBody');
    if (!tableBody) return;

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
            <td><strong>${item.machineName}</strong></td>
            <td><span class="badge badge-info">${item.orderId}</span></td>
            <td>${item.productName}</td>
            <td>${item.startTime}</td>
            <td>${item.endTime}</td>
            <td><span class="badge ${priorityBadge}">${item.priority}</span></td>
            <td><span class="badge ${statusBadge}">${item.status}</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderGanttTimeline() {
    const schedule = getData('itps_schedule');
    const machines = getData('itps_machines');
    const ganttContainer = document.getElementById('ganttTimelineBody');
    if (!ganttContainer) return;

    ganttContainer.innerHTML = '';

    if (schedule.length === 0) {
        ganttContainer.innerHTML = `<div class="empty-placeholder">Generate schedule to view visual Gantt timeline.</div>`;
        return;
    }

    machines.forEach(m => {
        const mSchedule = schedule.filter(s => s.machineName === m.machineName);

        const row = document.createElement('div');
        row.className = 'gantt-row';

        let slotContent = '';
        if (mSchedule.length > 0) {
            mSchedule.forEach(item => {
                const priorityClass = item.priority ? item.priority.toLowerCase() : 'low';
                slotContent += `<div class="gantt-bar ${priorityClass}">${item.productName} (${item.orderId})</div>`;
            });
        } else {
            slotContent = `<span style="color: var(--text-muted); font-size: 12px; padding: 6px;">Idle</span>`;
        }

        row.innerHTML = `
            <div class="gantt-machine-label">${m.machineName}</div>
            <div class="gantt-slot" style="grid-column: span 6;">
                ${slotContent}
            </div>
        `;
        ganttContainer.appendChild(row);
    });
}

function setupScheduleGenerator() {
    const generateBtn = document.getElementById('generateScheduleBtn');
    if (!generateBtn) return;

    generateBtn.addEventListener('click', function () {
        const statusBox = document.getElementById('scheduleLoadingStatus');
        if (statusBox) statusBox.style.display = 'block';
        generateBtn.disabled = true;

        if (statusBox) statusBox.textContent = '⏳ Analyzing orders...';

        setTimeout(() => {
            if (statusBox) statusBox.textContent = '🔍 Checking machine availability...';
            setTimeout(() => {
                if (statusBox) statusBox.textContent = '⚙️ Generating optimal schedule...';
                setTimeout(() => {
                    generateSimpleSchedule();
                    if (statusBox) {
                        statusBox.textContent = '✅ Schedule generated successfully!';
                        statusBox.style.color = '#16a34a';
                    }
                    generateBtn.disabled = false;
                }, 600);
            }, 600);
        }, 600);
    });
}

function generateSimpleSchedule() {
    const orders = getData('itps_orders');
    const machines = getData('itps_machines');
    const products = getData('itps_products');

    const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'In Progress');
    const availableMachines = machines.filter(m => m.status === 'Available' || m.status === 'Working');

    if (pendingOrders.length === 0) {
        alert('No pending orders available to schedule!');
        return;
    }

    if (availableMachines.length === 0) {
        alert('No available machines found to assign orders!');
        return;
    }

    const priorityMap = { 'High': 3, 'Medium': 2, 'Low': 1 };

    pendingOrders.sort((a, b) => {
        const weightA = priorityMap[a.priority] || 1;
        const weightB = priorityMap[b.priority] || 1;

        if (weightA !== weightB) {
            return weightB - weightA;
        }
        return new Date(a.deadline) - new Date(b.deadline);
    });

    const newSchedule = [];
    let startHour = 9;

    pendingOrders.forEach((order, index) => {
        const assignedMachine = availableMachines[index % availableMachines.length];
        const productObj = products.find(p => p.productName === order.productName);

        const durationHours = productObj ? Math.ceil(productObj.processingTime * (order.quantity / 50)) : 2;

        const startTimeStr = (startHour < 10 ? '0' + startHour : startHour) + ':00';
        const endHour = startHour + durationHours;
        const endTimeStr = (endHour < 10 ? '0' + endHour : endHour) + ':00';

        newSchedule.push({
            id: Date.now() + index,
            machineName: assignedMachine.machineName,
            orderId: order.orderId,
            productName: order.productName,
            startTime: startTimeStr,
            endTime: endTimeStr,
            priority: order.priority,
            status: 'Scheduled'
        });

        startHour += durationHours;
    });

    saveData('itps_schedule', newSchedule);
    addRecentActivity('Generated production schedule', 'success');
    renderScheduleTable();
    renderGanttTimeline();
}

// --- REPORTS PAGE ---
function renderReports() {
    const orders = getData('itps_orders');
    const machines = getData('itps_machines');

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const pendingOrders = orders.filter(o => o.status === 'Pending').length;

    const today = new Date().toISOString().split('T')[0];
    const delayedOrders = orders.filter(o => o.deadline < today && o.status !== 'Completed').length;

    const totalMachines = machines.length;
    const availableMachines = machines.filter(m => m.status === 'Available').length;
    const workingMachines = machines.filter(m => m.status === 'Working').length;

    const utilization = totalMachines > 0 ? Math.round((workingMachines / totalMachines) * 100) : 0;

    if (document.getElementById('rptTotalOrders')) document.getElementById('rptTotalOrders').textContent = totalOrders;
    if (document.getElementById('rptCompletedOrders')) document.getElementById('rptCompletedOrders').textContent = completedOrders;
    if (document.getElementById('rptPendingOrders')) document.getElementById('rptPendingOrders').textContent = pendingOrders;
    if (document.getElementById('rptDelayedOrders')) document.getElementById('rptDelayedOrders').textContent = delayedOrders;
    if (document.getElementById('rptTotalMachines')) document.getElementById('rptTotalMachines').textContent = totalMachines;
    if (document.getElementById('rptAvailableMachines')) document.getElementById('rptAvailableMachines').textContent = availableMachines;
    if (document.getElementById('rptMachineUtilization')) document.getElementById('rptMachineUtilization').textContent = utilization + '%';

    if (totalOrders > 0) {
        const compPct = Math.round((completedOrders / totalOrders) * 100);
        const pendPct = Math.round((pendingOrders / totalOrders) * 100);
        const delPct = Math.round((delayedOrders / totalOrders) * 100);

        if (document.getElementById('barCompleted')) document.getElementById('barCompleted').style.width = compPct + '%';
        if (document.getElementById('barCompletedTxt')) document.getElementById('barCompletedTxt').textContent = compPct + '%';

        if (document.getElementById('barPending')) document.getElementById('barPending').style.width = pendPct + '%';
        if (document.getElementById('barPendingTxt')) document.getElementById('barPendingTxt').textContent = pendPct + '%';

        if (document.getElementById('barDelayed')) document.getElementById('barDelayed').style.width = delPct + '%';
        if (document.getElementById('barDelayedTxt')) document.getElementById('barDelayedTxt').textContent = delPct + '%';
    }

    const machineUsageBody = document.getElementById('rptMachineUsageBars');
    if (machineUsageBody) {
        machineUsageBody.innerHTML = '';
        machines.forEach(m => {
            let usagePct = '80%';
            if (m.status === 'Working') usagePct = '95%';
            if (m.status === 'Maintenance') usagePct = '0%';

            const div = document.createElement('div');
            div.style.marginBottom = '12px';
            div.innerHTML = `
                <div class="progress-label">
                    <span>${m.machineName} (${m.status})</span>
                    <span>${usagePct}</span>
                </div>
                <div class="progress-track">
                    <div class="progress-fill" style="width: ${usagePct};"></div>
                </div>
            `;
            machineUsageBody.appendChild(div);
        });
    }
}
