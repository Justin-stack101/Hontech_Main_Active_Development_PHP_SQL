        let allJobs = [];
        let staffAccounts = [];
        let currentUserRole = '';
        let currentUserName = '';
        let currentUserEmail = '';
        let bays = [null, null, null, null];

        let tvSlideIndex = 0;
        let tvInterval = null;
        let presencePingInterval = null;

        let devEmails = [];
        let selectedEmailId = null;
        let mailboxPollInterval = null;

        // Analytics dashboard globals
        let currentDashboardTab = 'monitor';
        let saIntakeFilter = 'All';
        let intakeSearchQuery = '';
        let intakeSourceFilter = 'all';
        let intakeTimeFilter = 'all';
        let intakeSortBy = 'claimStub';

        function updateIntakeFilter(type, value) {
            if (type === 'search') intakeSearchQuery = value;
            if (type === 'source') intakeSourceFilter = value;
            if (type === 'time') intakeTimeFilter = value;
            if (type === 'sort') intakeSortBy = value;
            renderStaffTables();
        }
        let analyticsJobs = [];
        let idleLogoutTimer = null;
        let chartInstances = {
            volTrend: null,
            category: null,
            channel: null,
            branchShare: null,
            laneShare: null,
            partsStatus: null
        };

        // Base fetch helper to deal with absolute URL resolutions and JSON conversions
        async function apiRequest(url, options = {}) {
            try {
                // Dynamically build the absolute path to target index.php directly (bypasses mod_rewrite issues)
                const path = window.location.pathname;
                const basePath = path.includes('/frontend') 
                    ? path.substring(0, path.lastIndexOf('/frontend')) + '/backend/index.php/api' 
                    : path.replace(/\/$/, '') + '/backend/index.php/api';

                const finalUrl = url.replace(/^\/api/, basePath);

                const defaultOptions = {
                    headers: { 'Content-Type': 'application/json' },
                    ...options
                };
                if (defaultOptions.body && typeof defaultOptions.body === 'object') {
                    defaultOptions.body = JSON.stringify(defaultOptions.body);
                }
                const response = await fetch(finalUrl, defaultOptions);
                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401 && !url.includes('/login')) {
                        console.warn("Session expired. Redirecting to login...");
                        alert("Your session has expired. Please log in again.");
                        if (typeof handleLogout === 'function') {
                            handleLogout();
                        } else {
                            localStorage.removeItem('token');
                            window.location.reload();
                        }
                    }
                    throw new Error(data.message || 'Server request failed.');
                }
                return data;
            } catch (err) {
                console.error(`API Error on ${url}:`, err);
                throw err;
            }
        }

        document.addEventListener('DOMContentLoaded', async () => {
            initSystemSettings();
            initLayout();
            const urlParams = new URLSearchParams(window.location.search);
            const isTVMode = urlParams.get('mode') === 'tv';

            if (isTVMode) {
                setupTVMode();
                return;
            }

            // Attempt auto-login if token cookie is already present
            try {
                const user = await apiRequest('/api/auth/me');
                if (user) {
                    currentUserName = user.name;
                    currentUserEmail = user.email || 'user@hontech.com';
                    handleLogin(user.role);
                }
            } catch (e) {
                // Not logged in, stay on auth view
            }

            // Initialize time format setting
            initTimeFormatSetting();

            setInterval(updateClock, 1000);
            updateClock();
            updateStubPreview();

            // Start Dev Mailbox polling
            fetchSimulatedEmails();
            mailboxPollInterval = setInterval(fetchSimulatedEmails, 4000);

            lucide.createIcons();
        });

        function toggleDevCredentials() {
            const grid = document.getElementById('dev-credentials-grid');
            const icon = document.getElementById('dev-credentials-toggle-icon');
            if (grid.classList.contains('hidden')) {
                grid.classList.remove('hidden');
                icon.setAttribute('data-lucide', 'chevron-up');
            } else {
                grid.classList.add('hidden');
                icon.setAttribute('data-lucide', 'chevron-down');
            }
            lucide.createIcons();
        }

        // --- AUTH & ROLE LOGIC ---
        async function processLogin() {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            try {
                const res = await apiRequest('/api/auth/login', {
                    method: 'POST',
                    body: { email, password: pass }
                });

                if (res.requiresMfa) {
                    document.getElementById('login-form-container').classList.add('hidden');
                    document.getElementById('forgot-form-container').classList.add('hidden');
                    document.getElementById('mfa-form-container').classList.remove('hidden');
                    document.getElementById('mfa-user-id').value = res.userId;
                    document.getElementById('mfa-email-display').innerText = res.email;
                    document.getElementById('mfa-code-input').value = '';
                    lucide.createIcons();
                    showSystemToast('Two-Factor verification required.', 'info', 'MFA Check');
                    return;
                }

                currentUserName = res.name;
                currentUserEmail = res.email || 'user@hontech.com';
                handleLogin(res.role);
                showSystemToast('Logged in successfully.', 'success', 'Access Granted');
            } catch (err) {
                showSystemToast(err.message || 'Invalid credentials.', 'error', 'Authentication Failed');
            }
        }

        function toggleForgotForm(show) {
            const loginForm = document.getElementById('login-form-container');
            const forgotForm = document.getElementById('forgot-form-container');
            const step1 = document.getElementById('forgot-step-1');
            const step2 = document.getElementById('forgot-step-2');

            if (show) {
                loginForm.classList.add('hidden');
                forgotForm.classList.remove('hidden');
                step1.classList.remove('hidden');
                step2.classList.add('hidden');
                document.getElementById('forgot-email').value = '';
                document.getElementById('reset-token').value = '';
                document.getElementById('reset-new-pass').value = '';
            } else {
                loginForm.classList.remove('hidden');
                forgotForm.classList.add('hidden');
            }
            lucide.createIcons();
        }

        async function requestResetCode() {
            const email = document.getElementById('forgot-email').value;
            if (!email) return showSystemToast('Email is required.', 'error', 'Validation Failed');

            try {
                const res = await apiRequest('/api/auth/forgot-password', {
                    method: 'POST',
                    body: { email }
                });

                showSystemToast(res.message, 'success', 'Reset Code Generated');

                // Dev auto-fill convenience
                if (res.token) {
                    document.getElementById('reset-token').value = res.token;
                }

                document.getElementById('forgot-step-1').classList.add('hidden');
                document.getElementById('forgot-step-2').classList.remove('hidden');
                lucide.createIcons();
            } catch (err) {
                showSystemToast(err.message || 'Error generating reset code.', 'error', 'Request Failed');
            }
        }

        async function submitNewPassword() {
            const email = document.getElementById('forgot-email').value;
            const token = document.getElementById('reset-token').value;
            const newPassword = document.getElementById('reset-new-pass').value;

            if (!email || !token || !newPassword) {
                return showSystemToast('All fields are required.', 'error', 'Validation Failed');
            }

            try {
                const res = await apiRequest('/api/auth/reset-password', {
                    method: 'POST',
                    body: { email, token, newPassword }
                });

                showSystemToast(res.message, 'success', 'Password Updated');
                toggleForgotForm(false);
                document.getElementById('login-email').value = email;
                document.getElementById('login-pass').value = newPassword;
            } catch (err) {
                showSystemToast(err.message || 'Failed to reset password.', 'error', 'Reset Failed');
            }
        }

        async function handleLogin(role) {
            currentUserRole = role;
            document.getElementById('auth-view').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');

            await loadData();
            if (role === 'owner' || role === 'admin') {
                await loadBranches();
            }
            buildNavbar(role);

            // Pre-load all sections immediately so navigation is instantaneous
            if (role === 'owner' || role === 'admin') renderReports();
            // All roles need their specific tables rendered (the function internally handles role visibility)
            renderStaffTables();
            
            if (role === 'owner' || role === 'admin') {
                renderStaffManagement();
            }
            loadUserProfile();
            resetIdleTimer();

            // Start sending presence heartbeat every 30 seconds
            if (presencePingInterval) clearInterval(presencePingInterval);
            presencePingInterval = setInterval(async () => {
                try {
                    await apiRequest('/api/auth/ping', { method: 'POST' });
                } catch (err) {
                    console.error('Failed to send presence ping:', err);
                }
            }, 30000);
        }

        function buildNavbar(role) {
            const nav = document.getElementById('dynamic-nav');
            const sidebarNav = document.getElementById('sidebar-dynamic-nav');
            let navHTML = '';
            let sidebarNavHTML = '';
            let defaultView = 'queue';

            const userDisplayName = currentUserName || 'System User';
            const userRoleLabel = getRoleLabel(role);

            if (document.getElementById('sidebar-user-name')) {
                document.getElementById('sidebar-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('sidebar-menu-user-name')) {
                document.getElementById('sidebar-menu-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('sidebar-menu-user-role')) {
                document.getElementById('sidebar-menu-user-role').innerText = userRoleLabel;
            }

            if (document.getElementById('dropdown-user-name')) {
                document.getElementById('dropdown-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('dropdown-user-email')) {
                document.getElementById('dropdown-user-email').innerText = currentUserEmail || 'user@hontech.com';
            }
            if (document.getElementById('dropdown-user-role')) {
                document.getElementById('dropdown-user-role').innerText = userRoleLabel;
            }

            // --- RBAC for Security Settings ---
            const isOwnerOrAdmin = (role === 'owner' || role === 'admin');
            if (document.getElementById('profile-change-password-container')) {
                document.getElementById('profile-change-password-container').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }
            if (document.getElementById('settings-security-container')) {
                document.getElementById('settings-security-container').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }

            if (role === 'owner') {
                document.getElementById('sidebar-user-role').innerText = 'Owner';
                document.getElementById('header-actions').classList.remove('hidden');

                navHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="pie-chart" class="w-4 h-4"></i> Analytics</button>`;
                navHTML += `<button onclick="showSection('staff', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Staff Access</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="database" class="w-4 h-4"></i> Records</button>`;

                sidebarNavHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="pie-chart" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Analytics</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('staff', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="users" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Staff Access</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="database" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Records</span></button>`;

                defaultView = 'dashboard';
            }
            else if (role === 'admin') {
                document.getElementById('sidebar-user-role').innerText = 'Administrator';
                document.getElementById('header-actions').classList.remove('hidden');

                navHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="pie-chart" class="w-4 h-4"></i> Analytics</button>`;
                navHTML += `<button onclick="showSection('staff', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Staff Access</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="database" class="w-4 h-4"></i> Records</button>`;

                sidebarNavHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="pie-chart" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Analytics</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('staff', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="users" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Staff Access</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="database" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Records</span></button>`;

                defaultView = 'dashboard';
            }
            else if (role === 'assistant') {
                document.getElementById('sidebar-user-role').innerText = 'Assistant Staff';
                document.getElementById('header-actions').classList.add('hidden');

                navHTML += `<button onclick="showSection('intake', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="calendar-plus" class="w-4 h-4"></i> Online Booking Form</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="list-todo" class="w-4 h-4"></i> Master Queue</button>`;
                navHTML += `<button onclick="launchTVMode()" class="px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 text-gray-500 flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4"></i> TV Monitor</button>`;

                sidebarNavHTML += `<button onclick="showSection('intake', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="calendar-plus" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Online Booking Form</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="list-todo" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Master Queue</span></button>`;
                sidebarNavHTML += `<button onclick="launchTVMode()" class="w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-500"><i data-lucide="monitor" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">TV Monitor</span></button>`;

                setupIntakeForm('assistant');
                defaultView = 'intake';
            }
            else if (role === 'sa') {
                document.getElementById('sidebar-user-role').innerText = 'Service Advisor';
                document.getElementById('header-actions').classList.add('hidden');

                navHTML += `<button onclick="showSection('intake', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="user-plus" class="w-4 h-4"></i> Walk-In Form</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="clipboard-list" class="w-4 h-4"></i> Daily Intakes</button>`;
                navHTML += `<button onclick="launchTVMode()" class="px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 text-gray-500 flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4"></i> TV Monitor</button>`;

                sidebarNavHTML += `<button onclick="showSection('intake', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="user-plus" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Walk-In Form</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="clipboard-list" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Daily Intakes</span></button>`;
                sidebarNavHTML += `<button onclick="launchTVMode()" class="w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-500"><i data-lucide="monitor" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">TV Monitor</span></button>`;

                setupIntakeForm('sa');
                defaultView = 'intake';
            }

            // Append Profile button for all roles
            navHTML += `<button onclick="showSection('profile', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="user-cog" class="w-4 h-4"></i> My Profile</button>`;


            if (nav) nav.innerHTML = navHTML;
            if (sidebarNav) sidebarNav.innerHTML = sidebarNavHTML;

            initLayout();

            setTimeout(() => {
                const savedLayout = localStorage.getItem('hontech-layout') || 'sidebar';
                const activeNav = (savedLayout === 'sidebar') ? sidebarNav : nav;
                
                let targetView = localStorage.getItem('hontech-active-section');
                
                // Verify if the target section is valid and exists in the DOM. Do not auto-load TV on startup.
                if (!targetView || !document.getElementById(`section-${targetView}`) || targetView === 'tv') {
                    targetView = defaultView;
                }
                
                let targetBtn = null;
                if (activeNav) {
                    targetBtn = activeNav.querySelector(`.nav-btn[onclick*="showSection('${targetView}'"]`);
                    if (!targetBtn) targetBtn = activeNav.querySelector('.nav-btn');
                }
                
                if (targetBtn) showSection(targetView, targetBtn);
                else showSection(targetView);
            }, 50);
        }

        async function handleLogout() {
            if (presencePingInterval) {
                clearInterval(presencePingInterval);
                presencePingInterval = null;
            }
            if (idleLogoutTimer) {
                clearTimeout(idleLogoutTimer);
                idleLogoutTimer = null;
            }
            try {
                await apiRequest('/api/auth/logout', { method: 'POST' });
            } catch (e) { }

            document.getElementById('app-shell').classList.add('hidden');
            document.getElementById('auth-view').classList.remove('hidden');
            currentUserRole = '';
            currentUserName = '';
            currentUserEmail = '';
            document.getElementById('login-pass').value = '';
            localStorage.removeItem('hontech-active-section');

            const dropdown = document.getElementById('user-dropdown');
            if (dropdown) dropdown.classList.add('hidden');
            const sDropdown = document.getElementById('sidebar-user-dropdown');
            if (sDropdown) sDropdown.classList.add('hidden');
        }

        function toggleUserDropdown() {
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown) dropdown.classList.toggle('hidden');
        }

        // Close dropdown when clicking outside
        window.addEventListener('click', function(e) {
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                const btn = dropdown.previousElementSibling;
                if (btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            }
            const sDropdown = document.getElementById('sidebar-user-dropdown');
            if (sDropdown && !sDropdown.classList.contains('hidden')) {
                const parent = sDropdown.parentElement;
                if (parent && !parent.contains(e.target)) {
                    sDropdown.classList.add('hidden');
                }
            }
        });

        function initSystemSettings() {
            // Apply saved sidebar style
            const sidebarStyle = localStorage.getItem('hontech-sidebar-style') || 'expanded';
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) {
                if (sidebarStyle === 'icons') {
                    sidebar.classList.add('sidebar-collapsed');
                } else {
                    sidebar.classList.remove('sidebar-collapsed');
                }
            }

            // Start idle logout timer if logged in
            if (currentUserRole) {
                resetIdleTimer();
            }
        }

        function resetIdleTimer() {
            if (idleLogoutTimer) {
                clearTimeout(idleLogoutTimer);
            }
            if (!currentUserRole) return; // Only run if user is logged in
            
            const timeoutMinutes = parseInt(localStorage.getItem('hontech-idle-timeout') || '30', 10);
            if (timeoutMinutes === 0) return; // Disabled

            idleLogoutTimer = setTimeout(() => {
                handleLogout();
                alert("Session Expired: You have been logged out due to inactivity.");
            }, timeoutMinutes * 60 * 1000);
        }

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(evt => {
            window.addEventListener(evt, () => {
                resetIdleTimer();
            });
        });

        function toggleSidebar() {
            const sidebar = document.getElementById('app-sidebar');
            const toggleIcon = document.getElementById('sidebar-toggle-icon');
            const expandBtn = document.getElementById('sidebar-expand-btn');
            
            sidebar.classList.toggle('sidebar-collapsed');
            
            if (sidebar.classList.contains('sidebar-collapsed')) {
                localStorage.setItem('hontech-sidebar-collapsed', 'true');
                if (expandBtn) expandBtn.classList.remove('hidden');
            } else {
                localStorage.setItem('hontech-sidebar-collapsed', 'false');
                if (expandBtn) expandBtn.classList.add('hidden');
            }
        }

        function setLayout(layout) {
            const shell = document.getElementById('app-shell');
            const logo = document.getElementById('header-logo-container');
            const nav = document.getElementById('dynamic-nav');
            const userSec = document.getElementById('header-user-section');
            
            const btnSidebar1 = document.getElementById('layout-btn-sidebar');
            const btnTop1 = document.getElementById('layout-btn-top');
            const btnSidebar2 = document.getElementById('sidebar-layout-btn-sidebar');
            const btnTop2 = document.getElementById('sidebar-layout-btn-top');
            
            const sidebars = [btnSidebar1, btnSidebar2];
            const tops = [btnTop1, btnTop2];
            
            if (layout === 'sidebar') {
                shell.classList.remove('layout-top');
                shell.classList.add('layout-sidebar');
                localStorage.setItem('hontech-layout', 'sidebar');
                
                if (logo) logo.classList.add('hidden');
                if (nav) nav.classList.add('hidden');
                
                if (userSec) {
                    userSec.style.setProperty('margin-left', 'auto', 'important');
                    userSec.style.setProperty('margin-right', '0', 'important');
                    userSec.style.removeProperty('border-left');
                    userSec.style.removeProperty('padding-left');
                }
                
                sidebars.forEach(btn => {
                    if (btn) {
                        btn.classList.add('bg-gray-50', 'border-gray-300', 'text-gray-900');
                        btn.classList.remove('bg-white', 'border-gray-200', 'text-gray-700');
                    }
                });
                tops.forEach(btn => {
                    if (btn) {
                        btn.classList.add('bg-white', 'border-gray-200', 'text-gray-700');
                        btn.classList.remove('bg-gray-50', 'border-gray-300', 'text-gray-900');
                    }
                });
            } else {
                shell.classList.remove('layout-sidebar');
                shell.classList.add('layout-top');
                localStorage.setItem('hontech-layout', 'top');
                
                if (logo) logo.classList.remove('hidden');
                if (nav) nav.classList.remove('hidden');
                
                if (userSec) {
                    userSec.style.removeProperty('margin-left');
                    userSec.style.removeProperty('margin-right');
                    userSec.style.removeProperty('border-left');
                    userSec.style.removeProperty('padding-left');
                }
                
                tops.forEach(btn => {
                    if (btn) {
                        btn.classList.add('bg-gray-50', 'border-gray-300', 'text-gray-900');
                        btn.classList.remove('bg-white', 'border-gray-200', 'text-gray-700');
                    }
                });
                sidebars.forEach(btn => {
                    if (btn) {
                        btn.classList.add('bg-white', 'border-gray-200', 'text-gray-700');
                        btn.classList.remove('bg-gray-50', 'border-gray-300', 'text-gray-900');
                    }
                });
            }
            window.dispatchEvent(new Event('resize'));
        }

        function toggleSidebarDropdown() {
            const dropdown = document.getElementById('sidebar-user-dropdown');
            if (dropdown) dropdown.classList.toggle('hidden');
        }

        function initLayout() {
            const savedLayout = localStorage.getItem('hontech-layout') || 'sidebar';
            setLayout(savedLayout);
            
            const savedCollapsed = localStorage.getItem('hontech-sidebar-collapsed');
            const sidebar = document.getElementById('app-sidebar');
            const expandBtn = document.getElementById('sidebar-expand-btn');
            if (savedCollapsed === 'true' && sidebar) {
                sidebar.classList.add('sidebar-collapsed');
                if (expandBtn) expandBtn.classList.remove('hidden');
            }
        }

        function showSection(id, btnElement) {
            // Save current section to local storage for persistence across reloads
            localStorage.setItem('hontech-active-section', id);
            
            document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
            const targetSec = document.getElementById(`section-${id}`);
            if (targetSec) targetSec.classList.remove('hidden');

            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-red-50', 'text-red-600', 'bg-gray-100', 'text-gray-900');
                btn.classList.add('text-gray-600');
            });
            
            // Highlight matching buttons in both layouts
            const matchingBtns = document.querySelectorAll(`.nav-btn[onclick*="showSection('${id}'"]`);
            matchingBtns.forEach(btn => {
                if (btn.closest('#app-sidebar')) {
                    btn.classList.add('bg-gray-100', 'text-gray-900');
                    btn.classList.remove('text-gray-600');
                } else {
                    btn.classList.add('bg-red-50', 'text-red-600');
                    btn.classList.remove('text-gray-600');
                }
            });

            const titles = {
                'dashboard': 'Analytics Overview',
                'staff': 'Staff & Access Management',
                'intake': currentUserRole === 'assistant' ? 'Online Booking Form' : 'Walk-In Form',
                'queue': 'Master Data Records',
                'tv': 'Live Display Monitor',
                'profile': 'My Security & Profile Settings',
                'settings': 'Account Settings',
                'support': 'Help & Support Center'
            };
            if (titles[id]) document.getElementById('view-title').innerText = titles[id];
            

            if (id === 'tv') {
                (async () => {
                    try {
                        await loadData();
                        renderTV();
                    } catch (e) {
                        console.error('Error loading TV monitor:', e);
                    }
                })();
                if (tvInterval) clearInterval(tvInterval);
                tvInterval = setInterval(rotateTVSlides, 15000);
            } else {
                if (tvInterval) {
                    clearInterval(tvInterval);
                    tvInterval = null;
                }
            }
            if (id === 'profile') {
                loadSystemSettingsIntoForm();
            }
            if (id === 'dashboard') {
                switchDashboardTab(currentDashboardTab || 'monitor');
            }
        }

        function getRoleLabel(roleId) {
            const roles = { 'owner': 'Owner', 'admin': 'Administrator', 'assistant': 'Assistant Staff', 'sa': 'Service Advisor' };
            return roles[roleId] || roleId;
        }

        function getRoleColor(roleId) {
            const colors = {
                'owner': 'bg-red-800 text-white',
                'admin': 'bg-gray-800 text-white',
                'assistant': 'bg-blue-100 text-blue-700',
                'sa': 'bg-purple-100 text-purple-700'
            };
            return colors[roleId] || 'bg-gray-100 text-gray-700';
        }

        function renderStaffManagement() {
            const tbody = document.getElementById('table-staff-accounts');
            if (!tbody) return;

            tbody.innerHTML = staffAccounts.map(user => `
                <tr class="${!user.isActive ? 'opacity-65 bg-gray-50/50' : ''}">
                    <td>
                        <div class="font-bold text-gray-900 flex items-center gap-2">
                            <i data-lucide="user-circle" class="w-4 h-4 text-gray-400"></i>
                            <span>${user.name}</span>
                            <span class="inline-block w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse' : 'bg-gray-400'}" title="${user.isOnline ? 'Online' : 'Offline'}"></span>
                        </div>
                    </td>
                    <td>
                        ${user.role === 'owner' && user.email === 'owner@hontech.com'
                    ? `<span class="px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest bg-red-100 text-red-800">Primary Administrator</span>`
                    : `
                            <select onchange="updateStaffRole('${user._id}', this.value)" class="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-bold text-xs text-gray-900 outline-none focus:border-red-600 transition cursor-pointer">
                                <option value="assistant" ${user.role === 'assistant' ? 'selected' : ''}>Assistant Staff</option>
                                <option value="sa" ${user.role === 'sa' ? 'selected' : ''}>Service Advisor</option>
                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                                <option value="owner" ${user.role === 'owner' ? 'selected' : ''}>Owner</option>
                            </select>
                            `
                }
                    </td>
                    <td class="text-gray-600 font-medium text-sm">${user.branch || 'Branch A'}</td>
                    <td class="text-gray-600 font-medium text-sm">${user.email}</td>
                    <td>
                        <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${user.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-100 text-gray-500 border border-gray-200'}">${user.isActive ? 'Active' : 'Suspended'}</span>
                    </td>
                    <td>
                        ${user.role === 'owner' && user.email === 'owner@hontech.com'
                    ? '<span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Secured</span>'
                    : `<button onclick="openStaffPasswordReset('${user._id}', '${user.name}')" class="bg-white hover:bg-gray-50 text-gray-700 px-2 py-1 rounded-lg border border-gray-200 transition text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm"><i data-lucide="key-round" class="w-3 h-3 text-red-600"></i> Reset</button>`
                }
                    </td>
                    <td class="text-right">
                        <div class="flex gap-2 justify-end">
                            ${user.role === 'owner' && user.email === 'owner@hontech.com'
                    ? '<span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sys Owner</span>'
                    : `
                                <button onclick="openStaffEditModal('${user._id}', '${user.name.replace(/'/g, "\\'")}', '${user.email}', '${user.role}', '${user.branch}')" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-blue-600 hover:bg-blue-50 transition" title="Edit Details">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button onclick="toggleStaffActive('${user._id}', ${!user.isActive})" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm transition ${user.isActive ? 'text-amber-500 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}" title="${user.isActive ? 'Suspend Access' : 'Restore Access'}">
                                    <i data-lucide="${user.isActive ? 'user-minus' : 'user-check'}" class="w-4 h-4"></i>
                                </button>
                                <button onclick="deleteStaffAccount('${user._id}')" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete Account">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                                `
                }
                        </div>
                    </td>
                </tr>
            `).join('');
            lucide.createIcons();
        }

        async function updateStaffRole(userId, newRole) {
            try {
                await apiRequest(`/api/auth/staff/${userId}/role`, {
                    method: 'PUT',
                    body: { role: newRole }
                });
                showSystemToast('Staff role updated successfully.', 'success');
                await loadData();
                renderStaffManagement();
            } catch (err) {
                showSystemToast(err.message || 'Failed to update staff role.', 'error');
                renderStaffManagement();
            }
        }

        async function createStaffAccount() {
            const name = document.getElementById('new-staff-name').value.trim();
            const role = document.getElementById('new-staff-role').value;
            const branch = document.getElementById('new-staff-branch').value;
            const email = document.getElementById('new-staff-email').value.trim();
            const pass = document.getElementById('new-staff-pass').value.trim();

            if (!name || !role || !branch || !email || !pass) return showSystemToast('All fields are required to create an account.', 'error', 'Validation Failed');

            try {
                await apiRequest('/api/auth/staff', {
                    method: 'POST',
                    body: { name, email, password: pass, role, branch }
                });

                await loadData();
                renderStaffManagement();
                showSystemToast(`${name} has been added to the system.`, 'success', 'Account Created');

                document.getElementById('new-staff-name').value = '';
                document.getElementById('new-staff-email').value = '';
                document.getElementById('new-staff-pass').value = '';
            } catch (err) {
                showSystemToast(err.message || 'Could not create staff account.', 'error', 'Creation Failed');
            }
        }

        async function deleteStaffAccount(id) {
            if (!confirm('Are you sure you want to permanently delete this personnel? This action cannot be undone.')) return;
            try {
                await apiRequest(`/api/auth/staff/${id}`, { method: 'DELETE' });
                await loadData();
                renderStaffManagement();
                showSystemToast('Staff account successfully deleted.', 'success', 'Account Deleted');
            } catch (err) {
                showSystemToast(err.message || 'Could not delete staff account.', 'error');
            }
        }

        let activeBranches = [];

        async function loadBranches() {
            try {
                const res = await apiRequest('/api/branches');
                activeBranches = res || [];

                // Populate Branch Dropdowns in creation and edit modals
                const addBranchSelect = document.getElementById('new-staff-branch');
                const editBranchSelect = document.getElementById('staff-edit-branch');

                const optionsHtml = activeBranches.map(b => `<option value="${b.name}">${b.name}</option>`).join('');

                if (addBranchSelect) addBranchSelect.innerHTML = optionsHtml;
                if (editBranchSelect) editBranchSelect.innerHTML = optionsHtml;

                // Also populate filters if they exist
                const analyticBranchSelect = document.getElementById('analytics-branch');
                const periodicBranchSelect = document.getElementById('periodic-search-branch');
                
                const filterOptionsHtml = `<option value="all">All Branches</option>` + activeBranches.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
                
                if (analyticBranchSelect) {
                    const currentVal = analyticBranchSelect.value;
                    analyticBranchSelect.innerHTML = filterOptionsHtml;
                    analyticBranchSelect.value = currentVal || 'all';
                }
                if (periodicBranchSelect) {
                    const currentVal = periodicBranchSelect.value;
                    periodicBranchSelect.innerHTML = filterOptionsHtml;
                    periodicBranchSelect.value = currentVal || 'all';
                }
            } catch (err) {
                console.error("Failed to load branches:", err);
            }
        }

        // Tab switcher inside Staff Management
        function switchStaffTab(tab) {
            document.querySelectorAll('.staff-tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`staff-tab-${tab}`).classList.remove('hidden');

            const tabs = ['roster', 'branches'];
            tabs.forEach(t => {
                const btn = document.getElementById(`btn-staff-tab-${t}`);
                if (btn) {
                    if (t === tab) {
                        btn.className = "pb-3 text-xs font-black uppercase tracking-wider border-b-2 border-red-600 text-red-600 transition flex items-center gap-1.5 focus:outline-none";
                    } else {
                        btn.className = "pb-3 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 focus:outline-none";
                    }
                }
            });

            if (tab === 'branches') {
                loadBranchesList();
            } else if (tab === 'roster') {
                loadBranches();
            }
        }

        // Branch management operations
        async function loadBranchesList() {
            try {
                const branches = await apiRequest('/api/branches/all');
                const tbody = document.getElementById('table-branches-list');
                if (!tbody) return;

                tbody.innerHTML = branches.map(b => `
                    <tr class="${b.is_deleted ? 'opacity-65 bg-gray-50/50' : ''}">
                        <td class="px-6 py-4 font-mono font-bold text-xs text-gray-700">${b.code}</td>
                        <td class="px-6 py-4 font-bold text-gray-900">${b.name}</td>
                        <td class="px-6 py-4">
                            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                b.is_deleted ? 'bg-red-50 text-red-600 border border-red-200' :
                                b.is_active ? 'bg-green-50 text-green-600 border border-green-200' :
                                'bg-gray-100 text-gray-500 border border-gray-200'
                            }">${b.is_deleted ? 'Deleted' : b.is_active ? 'Active' : 'Suspended'}</span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <div class="flex gap-2 justify-end">
                                ${b.is_deleted ? `
                                    <button onclick="restoreBranch('${b.id}')" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-green-600 hover:bg-green-50 transition" title="Restore Branch">
                                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                                    </button>
                                ` : `
                                    <button onclick="editBranch('${b.id}', '${b.name.replace(/'/g, "\\'")}', '${b.code}')" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-blue-600 hover:bg-blue-50 transition" title="Edit Details">
                                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="toggleBranchActive('${b.id}', ${!b.is_active})" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm transition ${b.is_active ? 'text-amber-500 hover:bg-amber-50' : 'text-green-600 hover:bg-green-50'}" title="${b.is_active ? 'Suspend Branch' : 'Activate Branch'}">
                                        <i data-lucide="${b.is_active ? 'pause' : 'play'}" class="w-4 h-4"></i>
                                    </button>
                                    <button onclick="deleteBranch('${b.id}')" class="bg-white p-2 rounded-lg border border-gray-200 shadow-sm text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete Branch">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                `}
                            </div>
                        </td>
                    </tr>
                `).join('') || `<tr><td colspan="4" class="text-center py-8 text-gray-500 font-medium">No branches configured.</td></tr>`;
                lucide.createIcons();
            } catch (err) {
                showSystemToast("Failed to load branches register.", "error");
            }
        }

        async function saveBranch() {
            const id = document.getElementById('edit-branch-id').value;
            const name = document.getElementById('branch-name').value.trim();
            const code = document.getElementById('branch-code').value.trim();

            if (!name || !code) {
                return showSystemToast("Branch name and code are required.", "error");
            }

            try {
                if (id) {
                    await apiRequest(`/api/branches/${id}`, {
                        method: 'PUT',
                        body: { name, code }
                    });
                    showSystemToast("Branch details updated.", "success");
                } else {
                    await apiRequest('/api/branches', {
                        method: 'POST',
                        body: { name, code }
                    });
                    showSystemToast("Branch created successfully.", "success");
                }
                cancelBranchEdit();
                loadBranchesList();
                loadBranches();
            } catch (err) {
                showSystemToast(err.message || "Failed to save branch.", "error");
            }
        }

        function editBranch(id, name, code) {
            document.getElementById('edit-branch-id').value = id;
            document.getElementById('branch-name').value = name;
            document.getElementById('branch-code').value = code;
            document.getElementById('branch-form-title').innerText = "Edit Branch";
            document.getElementById('btn-cancel-branch-edit').classList.remove('hidden');
        }

        function cancelBranchEdit() {
            document.getElementById('edit-branch-id').value = "";
            document.getElementById('branch-name').value = "";
            document.getElementById('branch-code').value = "";
            document.getElementById('branch-form-title').innerText = "Add Branch";
            document.getElementById('btn-cancel-branch-edit').classList.add('hidden');
        }

        async function toggleBranchActive(id, newStatus) {
            try {
                await apiRequest(`/api/branches/${id}`, {
                    method: 'PUT',
                    body: { isActive: newStatus ? 1 : 0 }
                });
                showSystemToast(newStatus ? "Branch activated." : "Branch suspended.", "success");
                loadBranchesList();
            } catch (err) {
                showSystemToast(err.message || "Failed to toggle branch status.", "error");
            }
        }

        async function deleteBranch(id) {
            try {
                const res = await apiRequest(`/api/branches/${id}`, {
                    method: 'DELETE'
                });
                if (res.staffCount > 0) {
                    showSystemToast(`Branch deleted. Warning: ${res.staffCount} staff member(s) are still assigned to this branch.`, "warning", "Assigned Staff Alert");
                } else {
                    showSystemToast("Branch soft-deleted successfully.", "success");
                }
                loadBranchesList();
                loadBranches();
            } catch (err) {
                showSystemToast(err.message || "Failed to delete branch.", "error");
            }
        }

        async function restoreBranch(id) {
            try {
                await apiRequest(`/api/branches/${id}/restore`, {
                    method: 'POST'
                });
                showSystemToast("Branch successfully restored.", "success");
                loadBranchesList();
                loadBranches();
            } catch (err) {
                showSystemToast(err.message || "Failed to restore branch.", "error");
            }
        }

        // Staff details editing modals
        function openStaffEditModal(id, name, email, role, branch) {
            document.getElementById('staff-edit-id').value = id;
            document.getElementById('staff-edit-name').value = name;
            document.getElementById('staff-edit-email').value = email;
            document.getElementById('staff-edit-role').value = role;
            document.getElementById('staff-edit-branch').value = branch;
            
            document.getElementById('staff-edit-modal').classList.remove('hidden');
        }

        function closeStaffEditModal() {
            document.getElementById('staff-edit-modal').classList.add('hidden');
        }

        async function submitStaffEdit() {
            const id = document.getElementById('staff-edit-id').value;
            const name = document.getElementById('staff-edit-name').value.trim();
            const email = document.getElementById('staff-edit-email').value.trim();
            const role = document.getElementById('staff-edit-role').value;
            const branch = document.getElementById('staff-edit-branch').value;

            if (!name || !email || !role || !branch) {
                return showSystemToast("All fields are required.", "error");
            }

            try {
                await apiRequest(`/api/auth/staff/${id}/edit`, {
                    method: 'PUT',
                    body: { name, email, role, branch }
                });
                showSystemToast("Staff details updated successfully.", "success");
                closeStaffEditModal();
                await loadData();
                renderStaffManagement();
            } catch (err) {
                showSystemToast(err.message || "Failed to update staff details.", "error");
            }
        }

        // Live claim stub preview generated local for guidance, final saved one is computed securely on the backend
        function generateStubNumber() {
            const d = new Date();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const yy = String(d.getFullYear()).slice(2);
            const datePrefix = `${mm}${dd}${yy}`;
            const count = allJobs.filter(j => j.claimStub && j.claimStub.startsWith(datePrefix)).length + 1;
            return `${datePrefix}-${count.toString().padStart(3, '0')}`;
        }

        function updateStubPreview() {
            const preview = document.getElementById('intake-stub-preview');
            if (preview) preview.value = generateStubNumber();
        }

        function toggleCategoryOther() {
            const selectEl = document.getElementById('intake-category');
            const otherEl = document.getElementById('intake-category-other');
            if (selectEl && otherEl) {
                if (selectEl.value === 'Others') {
                    otherEl.classList.remove('hidden');
                } else {
                    otherEl.classList.add('hidden');
                    otherEl.value = '';
                }
            }
        }

        function setupIntakeForm(role) {
            const title = document.getElementById('intake-title');
            const subtitle = document.getElementById('intake-subtitle');
            const source = document.getElementById('intake-source');
            const walkinFields = document.getElementById('div-walkin-fields');
            const bookingFields = document.getElementById('div-booking-fields');

            const today = new Date().toISOString().split('T')[0];
            document.getElementById('intake-date').value = today;

            const arrHour = document.getElementById('intake-arrival-hour');
            const arrMin = document.getElementById('intake-arrival-minute');
            const apptHour = document.getElementById('intake-appt-hour');
            const apptMin = document.getElementById('intake-appt-minute');

            const now = new Date();
            const currHour = String(now.getHours()).padStart(2, '0');
            const currMin = String(now.getMinutes()).padStart(2, '0');

            if (arrHour) arrHour.innerHTML = getHourOptions(currHour);
            if (arrMin) arrMin.innerHTML = getMinuteOptions(currMin);
            if (apptHour) apptHour.innerHTML = getHourOptions(currHour);
            if (apptMin) apptMin.innerHTML = getMinuteOptions(currMin);

            // Reset Category Select and Specify Input
            const catSelect = document.getElementById('intake-category');
            if (catSelect) catSelect.value = 'PMS';
            const catOther = document.getElementById('intake-category-other');
            if (catOther) {
                catOther.classList.add('hidden');
                catOther.value = '';
            }

            const concernField = document.getElementById('div-concern-field');
            if (concernField) concernField.classList.add('hidden');

            if (role === 'assistant') {
                title.innerText = 'Online Booking Form';
                subtitle.innerText = 'Log online inquiries to Booking Module.';
                source.value = 'Online';
                walkinFields.classList.add('hidden');
                bookingFields.classList.remove('hidden');
                if (concernField) concernField.classList.add('hidden');
            } else if (role === 'sa') {
                title.innerText = 'Walk-In Form';
                subtitle.innerText = 'Encode physical walk-in paperwork & assign Stub.';
                source.value = 'Walk-in';
                walkinFields.classList.remove('hidden');
                bookingFields.classList.add('hidden');
                if (concernField) concernField.classList.add('hidden');
                updateStubPreview();
            }
        }

        async function processIntake() {
            const source = document.getElementById('intake-source').value;
            const date = document.getElementById('intake-date').value;
            const plate = document.getElementById('intake-plate').value.toUpperCase();
            const name = document.getElementById('intake-name').value;
            const contact = document.getElementById('intake-contact').value;
            const vehicle = document.getElementById('intake-vehicle').value;
            
            let concern = '';
            const concernEl = document.getElementById('intake-concern');
            if (concernEl && source === 'Walk-in') {
                concern = concernEl.value;
            }

            let category = document.getElementById('intake-category').value;
            if (category === 'Others') {
                const categoryOther = document.getElementById('intake-category-other').value.trim();
                if (!categoryOther) {
                    return showSystemToast("Please specify the custom service category.", "error");
                }
                category = categoryOther;
            }

            if (!plate || !name) return showSystemToast("Plate and Name are required.", "error");

            const isWalkin = source === 'Walk-in';
            let arrival = '';
            let apptDate = '', apptTime = '', confirmed = false, laneType = '';

            if (isWalkin) {
                const hour = document.getElementById('intake-arrival-hour').value;
                const min = document.getElementById('intake-arrival-minute').value;
                arrival = `${hour}:${min}`;
            } else {
                apptDate = date;
                const hour = document.getElementById('intake-appt-hour').value;
                const min = document.getElementById('intake-appt-minute').value;
                apptTime = `${hour}:${min}`;
                confirmed = document.getElementById('intake-confirmed').checked;
                laneType = document.getElementById('intake-lane-type').value;
            }

            try {
                await apiRequest('/api/jobs', {
                    method: 'POST',
                    body: {
                        source, dateReceived: date, plate, name, contact, category, vehicle, concern,
                        arrival, apptDate, apptTime, confirmed, laneType
                    }
                });

                await loadData();
                showSystemToast(`${plate} added successfully.`, 'success');

                ['plate', 'name', 'contact', 'vehicle', 'arrival', 'appt-time', 'concern'].forEach(id => {
                    if (document.getElementById(`intake-${id}`)) document.getElementById(`intake-${id}`).value = '';
                });

                const catSelect = document.getElementById('intake-category');
                if (catSelect) catSelect.value = 'PMS';
                const catOther = document.getElementById('intake-category-other');
                if (catOther) {
                    catOther.value = '';
                    catOther.classList.add('hidden');
                }

                const laneTypeSelect = document.getElementById('intake-lane-type');
                if (laneTypeSelect) laneTypeSelect.value = 'Flexible';

                if (document.getElementById('intake-confirmed')) document.getElementById('intake-confirmed').checked = false;

                if (isWalkin) updateStubPreview();
                renderStaffTables();
            } catch (err) {
                showSystemToast(err.message || 'Failed to submit intake.', 'error');
            }
        }

        async function updateJobField(jobId, field, value) {
            try {
                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field, value }
                });

                const job = allJobs.find(j => j.id === jobId);
                if (job) {
                    job[field] = value;

                    // Trigger auto-calculate of goal status if relevant fields change
                    if (field === 'arrival' || field === 'departure' || field === 'category') {
                        const computed = calculateGoalStatusForJob(job);
                        if (computed !== 'N/A' && job.goalStatus !== computed) {
                            await apiRequest(`/api/jobs/${jobId}/field`, {
                                method: 'PATCH',
                                body: { field: 'goalStatus', value: computed }
                            });
                            job.goalStatus = computed;
                        }
                    }
                }

                renderStaffTables();
                if (typeof renderTV === 'function') renderTV();
                if (typeof renderReports === 'function') renderReports();
            } catch (err) {
                showSystemToast(err.message || 'Error updating job property.', 'error');
            }
        }

        function updateCheckbox(jobId, field, checked) {
            updateJobField(jobId, field, checked);
        }

        function handleTableCategoryChange(jobId, selectElement) {
            const val = selectElement.value;
            const inputEl = document.getElementById(`category-input-${jobId}`);
            if (inputEl) {
                if (val === 'Others') {
                    inputEl.classList.remove('hidden');
                    inputEl.value = '';
                    inputEl.focus();
                } else {
                    inputEl.classList.add('hidden');
                    updateJobField(jobId, 'category', val);
                }
            }
        }

        function assignMeToJob(jobId) {
            document.getElementById('assign-job-id').value = jobId;
            document.getElementById('assign-confirm-modal').classList.remove('hidden');
        }

        async function confirmAssignJob() {
            const jobId = document.getElementById('assign-job-id').value;
            if (!jobId) return;
            document.getElementById('assign-confirm-modal').classList.add('hidden');
            
            let saNameValue = currentUserName;
            if (!saNameValue.includes('(Advisor)')) {
                saNameValue = `${currentUserName} (Advisor)`;
            }
            
            await updateJobField(jobId, 'saName', saNameValue);
        }

        async function setJobStatus(jobId, newStatus) {
            try {
                // Auto-calculate goal status if moving to end states
                const job = allJobs.find(j => j.id === jobId);
                if (job && (newStatus === 'Ready' || newStatus === 'Ready to Release' || newStatus === 'Released' || newStatus === 'Completed')) {
                    const computed = calculateGoalStatusForJob(job);
                    if (computed !== 'N/A' && job.goalStatus !== computed) {
                        await apiRequest(`/api/jobs/${jobId}/field`, {
                            method: 'PATCH',
                            body: { field: 'goalStatus', value: computed }
                        });
                        job.goalStatus = computed;
                    }
                }

                await apiRequest(`/api/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    body: { status: newStatus }
                });

                await loadData();
                renderStaffTables();
                renderTV();
            } catch (err) {
                showSystemToast(err.message || 'Error updating lift status.', 'error');
                // Re-render to undo choice visually
                renderStaffTables();
            }
        }

        function completeRelease(jobId) {
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return;
            document.getElementById('release-confirm-job-id').value = jobId;
            document.getElementById('release-confirm-message').innerText = `Are you sure you want to finalize the release for ${job.plate}? This will remove the vehicle from the active workshop view.`;
            document.getElementById('release-confirm-modal').classList.remove('hidden');
        }

        function closeReleaseConfirmModal() {
            document.getElementById('release-confirm-modal').classList.add('hidden');
            renderStaffTables();
        }

        async function confirmReleaseJob() {
            const jobId = document.getElementById('release-confirm-job-id').value;
            if (!jobId) return;
            closeReleaseConfirmModal();
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return;

            try {
                // Final auto-calculate before completing
                const computed = calculateGoalStatusForJob(job);
                if (computed !== 'N/A' && job.goalStatus !== computed) {
                    await apiRequest(`/api/jobs/${jobId}/field`, {
                        method: 'PATCH',
                        body: { field: 'goalStatus', value: computed }
                    });
                    job.goalStatus = computed;
                }

                await apiRequest(`/api/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    body: { status: 'Completed' }
                });

                await loadData();
                renderStaffTables();
                renderReports();
                renderTV();
                showSystemToast(`${job.plate} has been successfully released and archived.`, 'success', 'Release Finalized');
            } catch (err) {
                showSystemToast(err.message || 'Error releasing vehicle.', 'error');
            }
        }

        function removeJob(jobId) {
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return;
            document.getElementById('delete-confirm-job-id').value = jobId;
            document.getElementById('delete-confirm-message').innerText = `Are you sure you want to permanently delete the booking for ${job.name} (${job.plate})?`;
            document.getElementById('delete-confirm-modal').classList.remove('hidden');
        }

        function closeDeleteConfirmModal() {
            document.getElementById('delete-confirm-modal').classList.add('hidden');
        }

        async function confirmDeleteJob() {
            const jobId = document.getElementById('delete-confirm-job-id').value;
            if (!jobId) return;
            closeDeleteConfirmModal();
            try {
                await apiRequest(`/api/jobs/${jobId}`, { method: 'DELETE' });
                await loadData();
                renderStaffTables();
                renderTV();
                showSystemToast('Job record deleted successfully.', 'success', 'Record Deleted');
            } catch (err) {
                showSystemToast(err.message || 'Error deleting job.', 'error');
            }
        }

        function formatPhoneNumber(phone) {
            if (!phone) return '-';
            const cleaned = phone.replace(/\D/g, '');
            if (cleaned.length === 11) {
                return cleaned.replace(/(\d{4})(\d{3})(\d{4})/, '$1-$2-$3');
            }
            return phone;
        }

        function getHourOptions(selectedHour) {
            let html = '';
            const sel = selectedHour ? String(selectedHour).padStart(2, '0') : '';
            for (let i = 0; i < 24; i++) {
                const val = String(i).padStart(2, '0');
                html += `<option value="${val}" ${val === sel ? 'selected' : ''}>${val}</option>`;
            }
            return html;
        }

        function getMinuteOptions(selectedMinute) {
            let html = '';
            const sel = selectedMinute ? String(selectedMinute).padStart(2, '0') : '';
            for (let i = 0; i < 60; i++) {
                const val = String(i).padStart(2, '0');
                html += `<option value="${val}" ${val === sel ? 'selected' : ''}>${val}</option>`;
            }
            return html;
        }

        async function updateJobTimeField(jobId, field, partValue, partType) {
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return;
            const current24 = convertTimeTo24Hour(job[field]);
            const parts = current24.split(':');
            let hour = parts[0];
            let minute = parts[1];
            
            if (partType === 'hour') {
                hour = partValue;
            } else if (partType === 'minute') {
                minute = partValue;
            }
            
            const newVal = `${hour}:${minute}`;
            await updateJobField(jobId, field, newVal);
        }

        function saveSystemSettings() {
            const formatSelect = document.getElementById('settings-time-format');
            if (formatSelect) {
                const is24h = formatSelect.value === '24h';
                localStorage.setItem('timeFormat24h', is24h ? 'true' : 'false');
            }

            const sidebarSelect = document.getElementById('settings-sidebar-style');
            if (sidebarSelect) {
                const style = sidebarSelect.value;
                localStorage.setItem('hontech-sidebar-style', style);
                const sidebar = document.getElementById('app-sidebar');
                if (sidebar) {
                    if (style === 'icons') {
                        sidebar.classList.add('sidebar-collapsed');
                    } else {
                        sidebar.classList.remove('sidebar-collapsed');
                    }
                }
            }

            const idleSelect = document.getElementById('settings-idle-timeout');
            if (idleSelect) {
                localStorage.setItem('hontech-idle-timeout', idleSelect.value);
                resetIdleTimer();
            }

            showSystemToast('System settings saved successfully.', 'success', 'Settings Saved');
            renderStaffTables();
            renderTV();
            updateClock();
        }

        function loadSystemSettingsIntoForm() {
            const timeFormat = localStorage.getItem('timeFormat24h') === 'true' ? '24h' : '12h';
            const sidebar = localStorage.getItem('hontech-sidebar-style') || 'expanded';
            const idle = localStorage.getItem('hontech-idle-timeout') || '30';

            const formatSelect = document.getElementById('settings-time-format');
            if (formatSelect) formatSelect.value = timeFormat;

            const sidebarSelect = document.getElementById('settings-sidebar-style');
            if (sidebarSelect) sidebarSelect.value = sidebar;

            const idleSelect = document.getElementById('settings-idle-timeout');
            if (idleSelect) idleSelect.value = idle;
        }

        function formatTime12Hour(timeStr) {
            if (!timeStr) return '--:--';
            const is24h = localStorage.getItem('timeFormat24h') !== 'false';
            const lower = timeStr.toLowerCase();
            let isOriginalPm = false;
            let clean = timeStr;
            if (lower.includes('am') || lower.includes('pm')) {
                isOriginalPm = lower.includes('pm');
                clean = timeStr.replace(/am|pm/gi, '').trim();
            }
            const parts = clean.split(':');
            if (parts.length < 2) return timeStr;
            let hour = parseInt(parts[0], 10);
            const minute = parts[1].trim();
            if (isNaN(hour)) return timeStr;

            if (lower.includes('am') || lower.includes('pm')) {
                if (isOriginalPm && hour < 12) hour += 12;
                if (!isOriginalPm && hour === 12) hour = 0;
            }

            if (is24h) {
                return `${String(hour).padStart(2, '0')}:${minute}`;
            } else {
                const isPm = hour >= 12;
                hour = hour % 12;
                hour = hour ? hour : 12;
                const ampm = isPm ? 'PM' : 'AM';
                return `${String(hour).padStart(2, '0')}:${minute} ${ampm}`;
            }
        }

        function convertTimeTo24Hour(timeStr) {
            if (!timeStr) return '08:00';
            const totalMins = parseTimeToMinutes(timeStr);
            if (totalMins === null) return '08:00';
            const hrs = Math.floor(totalMins / 60) % 24;
            const mins = totalMins % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        }

        function parseTimeToMinutes(timeStr) {
            if (!timeStr) return null;
            const lower = timeStr.toLowerCase();
            let isPm = lower.includes('pm');
            let clean = timeStr.replace(/am|pm/gi, '').trim();
            const parts = clean.split(':');
            if (parts.length < 2) return null;
            let hour = parseInt(parts[0], 10);
            let minute = parseInt(parts[1], 10);
            if (isNaN(hour) || isNaN(minute)) return null;
            if (lower.includes('am') || lower.includes('pm')) {
                if (isPm && hour < 12) hour += 12;
                if (!isPm && hour === 12) hour = 0;
            }
            return hour * 60 + minute;
        }

        async function confirmActiveOnlineJob(jobId) {
            try {
                const now = new Date();
                const currHour = String(now.getHours()).padStart(2, '0');
                const currMin = String(now.getMinutes()).padStart(2, '0');
                const arrivalTime = `${currHour}:${currMin}`;
                
                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field: 'arrival', value: arrivalTime }
                });
                
                await apiRequest(`/api/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    body: { status: 'Waiting' }
                });
                
                await loadData();
                renderStaffTables();
                renderTV();
                showSystemToast('Booking activated successfully.', 'success', 'Active Intake');
            } catch (err) {
                showSystemToast(err.message || 'Error activating booking.', 'error');
            }
        }

        function calculateGoalStatusForJob(job) {
            const isPMS = job.category && job.category.toUpperCase().includes('PMS');
            if (!isPMS) return 'N/A';
            if (!job.arrival || !job.departure) return 'N/A';
            try {
                const arrMin = parseTimeToMinutes(job.arrival);
                const depMin = parseTimeToMinutes(job.departure);
                if (arrMin === null || depMin === null) return 'N/A';

                let diff = depMin - arrMin;
                if (diff < 0) diff += 24 * 60;
                return diff <= 120 ? 'Successful' : 'Failed';
            } catch (e) {
                return 'N/A';
            }
        }

        function renderStaffTables() {
            const isOwner = currentUserRole === 'owner';
            const isAdmin = currentUserRole === 'admin';
            const isAsst = currentUserRole === 'assistant';
            const isSA = currentUserRole === 'sa';
            const isTech = currentUserRole === 'tech';
            const isOwnerOrAdmin = isOwner || isAdmin;

            const onlineQueueEl = document.getElementById('container-online-queue');
            const dailyIntakesEl = document.getElementById('container-daily-intakes');
            const techBoardEl = document.getElementById('container-tech-board');
            const periodicRecordsEl = document.getElementById('container-periodic-records');

            if (onlineQueueEl) onlineQueueEl.classList.toggle('hidden', !(isAsst || isOwner || isAdmin));
            if (dailyIntakesEl) dailyIntakesEl.classList.toggle('hidden', isTech);
            if (techBoardEl) techBoardEl.classList.toggle('hidden', !isTech);
            if (periodicRecordsEl) periodicRecordsEl.classList.toggle('hidden', !(isOwner || isAdmin));

            // BOOKING MODULE
            if ((isAsst || isOwner || isAdmin) && document.getElementById('table-pending-express')) {
                const pendingOnline = allJobs.filter(j => j.source === 'Online' && j.status === 'Pending');
                document.getElementById('table-pending-express').innerHTML = pendingOnline.map(job => {
                    return `
                    <tr>
                        <td>
                            <div class="font-bold text-gray-900">${job.name}</div>
                            <div class="text-xs text-gray-500 font-mono mt-0.5">${formatPhoneNumber(job.contact)}</div>
                        </td>
                        <td><div class="font-black italic text-gray-700 text-lg">${job.plate}</div></td>
                        <td class="text-gray-500 text-sm">${job.vehicle}</td>
                        <td>
                            ${isOwnerOrAdmin ? `
                                <span class="text-xs font-semibold uppercase text-gray-700 bg-gray-50 border border-gray-150 rounded px-2 py-0.5">${job.laneType || 'Flexible'}</span>
                            ` : `
                                <select onchange="updateJobField('${job.id}', 'laneType', this.value)" class="table-select text-xs font-bold uppercase border border-gray-200 bg-white cursor-pointer py-0.5 w-32">
                                    <option value="Flexible" ${job.laneType === 'Flexible' ? 'selected' : ''}>Flexible</option>
                                    <option value="Express Lane" ${job.laneType === 'Express Lane' ? 'selected' : ''}>Express Lane</option>
                                    <option value="Special Lane" ${job.laneType === 'Special Lane' ? 'selected' : ''}>Special Lane</option>
                                </select>
                            `}
                        </td>
                        <td>
                            ${isOwnerOrAdmin ? `
                                <div class="text-xs text-gray-700 font-bold">${job.apptDate || 'N/A'}</div>
                                <div class="text-xs text-gray-500 font-mono mt-0.5">${job.apptTime ? formatTime12Hour(job.apptTime) : 'N/A'}</div>
                            ` : `
                                <div class="flex flex-col gap-1.5">
                                    <input type="date" value="${job.apptDate || ''}" onchange="updateJobField('${job.id}', 'apptDate', this.value)" class="table-select text-xs border border-gray-200 bg-white px-1 py-0.5 w-28">
                                    <input type="time" value="${job.apptTime || ''}" onchange="updateJobField('${job.id}', 'apptTime', this.value)" class="table-select text-xs border border-gray-200 bg-white px-1 py-0.5 w-24">
                                </div>
                            `}
                        </td>
                        <td class="text-center">
                            <input type="checkbox" ${job.confirmed ? 'checked' : ''} ${isOwnerOrAdmin ? 'disabled' : `onchange="updateCheckbox('${job.id}', 'confirmed', this.checked)"`} class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 ${isOwnerOrAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}">
                        </td>
                        <td class="text-right flex items-center justify-end gap-2">
                            ${isOwnerOrAdmin ? `
                                <span class="text-xs font-bold text-gray-400 italic">View Only</span>
                            ` : `
                                <button onclick="confirmActiveOnlineJob('${job.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase transition shadow-md shadow-emerald-500/10 flex items-center gap-1">
                                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Confirm Active
                                </button>
                                <button onclick="removeJob('${job.id}')" class="border border-red-200 hover:border-red-500 text-red-500 hover:bg-red-50 p-2 rounded-xl transition flex items-center justify-center" title="Delete Booking">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            `}
                        </td>
                    </tr>
                    `;
                }).join('') || `<tr><td colspan="7" class="text-center py-8 text-gray-500 font-medium">No pending online bookings.</td></tr>`;
            }

            // DAILY INTAKES
            if (!isTech && document.getElementById('container-daily-intakes')) {
                let activeJobs = allJobs.filter(j => j.status !== 'Pending' && j.status !== 'Carry Over' && j.status !== 'Completed');
                
                // Filter by Source
                if (intakeSourceFilter !== 'all') {
                    activeJobs = activeJobs.filter(j => j.source === intakeSourceFilter);
                }

                // Filter by Time (Prototype)
                if (intakeTimeFilter === 'morning') {
                    activeJobs = activeJobs.filter(j => {
                        const hr = parseInt(convertTimeTo24Hour(j.arrival).split(':')[0]) || 0;
                        return hr >= 8 && hr < 12;
                    });
                } else if (intakeTimeFilter === 'afternoon') {
                    activeJobs = activeJobs.filter(j => {
                        const hr = parseInt(convertTimeTo24Hour(j.arrival).split(':')[0]) || 0;
                        return hr >= 12 && hr < 17;
                    });
                }

                // Sort
                if (intakeSortBy === 'arrival') {
                    activeJobs.sort((a, b) => {
                        const timeA = parseTimeToMinutes(convertTimeTo24Hour(a.arrival));
                        const timeB = parseTimeToMinutes(convertTimeTo24Hour(b.arrival));
                        return timeA - timeB;
                    });
                } else {
                    // Default: claimStub
                    activeJobs.sort((a, b) => {
                        const stubA = a.claimStub || 'zzzzz';
                        const stubB = b.claimStub || 'zzzzz';
                        return stubA.localeCompare(stubB);
                    });
                }

                const showGoal = isOwnerOrAdmin || isAsst;

                const getTableHeaderHtml = () => {
                    return `
                        <thead class="sticky top-0 z-10 bg-gray-50">
                            <tr class="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                <th class="px-2 py-3 bg-gray-50">Claim Stub</th>
                                <th class="px-2 py-3 bg-gray-50">Plate No.</th>
                                <th class="px-2 py-3 bg-gray-50">Model & Category</th>
                                <th class="px-2 py-3 bg-gray-50">Source</th>
                                <th class="px-2 py-3 bg-gray-50">Arrival</th>
                                <th class="px-2 py-3 bg-gray-50">Departure</th>
                                <th class="px-2 py-3 bg-gray-50">Evaluation / Diagnosis</th>
                                <th class="px-2 py-3 bg-gray-50">Promised Date</th>
                                <th class="px-2 py-3 bg-gray-50">C.O. Status</th>
                                ${showGoal ? '<th class="px-2 py-3 bg-gray-50">SLA Status (2h)</th>' : ''}
                                <th class="px-2 py-3 bg-gray-50">Status</th>
                                <th class="px-2 py-3 bg-gray-50">Location</th>
                            </tr>
                        </thead>
                    `;
                };
                const renderJobRows = (jobsList) => {
                    return jobsList.map(job => {
                        const isEditable = isSA;
                        

                        // Re-evaluate occupied lifts for this specific row excluding current job
                        const rowOccupiedLifts = {};
                        allJobs.forEach(j => {
                            if (j.id !== job.id && j.location && j.location.startsWith('Lift') && j.status !== 'Completed' && j.status !== 'Released') {
                                rowOccupiedLifts[j.location] = j.plate;
                            }
                        });

                                return `
                        <tr class="${job.status === 'Ready' ? 'bg-green-50/50' : job.status === 'Released' ? 'bg-gray-50/80' : ''}">
                            <!-- Claim Stub -->
                            <td class="px-2 py-3 align-middle"><span class="inline-flex items-center justify-center w-fit font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-250">${job.claimStub || 'N/A'}</span></td>
                            
                            <!-- Plate -->
                            <td class="px-2 py-3 align-middle">
                                <div class="flex flex-col gap-1">
                                    <span class="inline-flex items-center justify-center w-fit font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-250">${job.plate}</span>
                                    ${(job.promisedDate || job.carryOverStatus) ? `
                                    <span class="inline-flex items-center justify-center w-fit bg-orange-100 text-orange-800 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-orange-200">
                                        Carry-Over
                                    </span>
                                    ` : ''}
                                </div>
                            </td>
                            
                            <!-- Model & Category -->
                            <td class="px-2 py-3 align-middle">
                                <div class="font-black text-gray-900 text-sm py-0.5 flex items-center gap-1.5">
                                    <i data-lucide="car" class="w-4 h-4 text-slate-400 shrink-0"></i>
                                    <span>${job.vehicle}</span>
                                </div>
                                <div class="text-[10px] text-gray-500 font-bold uppercase mt-1">
                                    <div class="flex flex-wrap items-center gap-x-1 gap-y-1">
                                        <div class="flex items-center flex-nowrap gap-1">
                                            ${isEditable ? `
                                            <div class="flex items-center gap-1 shrink-0 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg">
                                                <i data-lucide="wrench" class="w-3 h-3 text-red-500 shrink-0"></i>
                                                <select onchange="handleTableCategoryChange('${job.id}', this)" class="table-select text-[10px] font-bold uppercase bg-transparent border-none cursor-pointer py-0 !w-[115px] outline-none">
                                                    <option value="PMS" ${job.category === 'PMS' ? 'selected' : ''}>PMS</option>
                                                    <option value="GRS" ${job.category === 'GRS' ? 'selected' : ''}>GRS</option>
                                                    <option value="PMS AND GRS" ${job.category === 'PMS AND GRS' ? 'selected' : ''}>PMS AND GRS</option>
                                                    <option value="Others" ${!['PMS', 'GRS', 'PMS AND GRS'].includes(job.category) ? 'selected' : ''}>Others</option>
                                                </select>
                                                <input type="text" id="category-input-${job.id}" value="${!['PMS', 'GRS', 'PMS AND GRS'].includes(job.category) ? job.category : ''}" 
                                                       placeholder="Specify..." 
                                                       onchange="updateJobField('${job.id}', 'category', this.value)" 
                                                       class="table-select text-[10px] font-bold border border-gray-200 bg-white px-1 py-0.5 !w-[115px] shrink-0 ${['PMS', 'GRS', 'PMS AND GRS'].includes(job.category) ? 'hidden' : ''}">
                                            </div>
                                            ` : `<span class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-lg text-[10px] font-bold uppercase text-gray-900 shrink-0"><i data-lucide="wrench" class="w-3 h-3 text-slate-400"></i><span>${job.category || '-'}</span></span>`}
                                            
                                            <div class="flex items-center shrink-0 whitespace-nowrap">
                                                ${job.saName ? `<span class="text-gray-400 font-bold mx-0.5">|</span> <span class="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500">SA: <i data-lucide="user" class="w-3 h-3 text-gray-400"></i> <span class="text-gray-800 font-black">${job.saName}</span></span>` : ((isAsst || isOwnerOrAdmin) ? `<span class="text-gray-400 font-bold mx-0.5">|</span> <span class="text-gray-500 ml-1">Unassigned</span>` : `<span class="text-gray-400 font-bold mx-0.5">|</span> <button onclick="assignMeToJob('${job.id}')" class="text-blue-600 hover:text-blue-800 underline font-bold bg-transparent border-none p-0 cursor-pointer text-[10px] ml-1">Assign to Me</button>`)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="w-full mt-1.5">
                                        ${isEditable ? `
                                        <div class="flex items-center gap-1.5 text-red-600 font-bold bg-red-50/50 border border-red-100 rounded-lg px-2 py-0.5 w-fit">
                                            <i data-lucide="route" class="w-3.5 h-3.5 text-red-500 shrink-0"></i>
                                            <span>LANE:</span>
                                            <select onchange="updateJobField('${job.id}', 'laneType', this.value)" class="table-select text-[10px] font-bold uppercase text-red-600 bg-transparent border-none cursor-pointer p-0 outline-none">
                                                <option value="Flexible" ${job.laneType === 'Flexible' ? 'selected' : ''}>FLEXIBLE</option>
                                                <option value="Express Lane" ${job.laneType === 'Express Lane' ? 'selected' : ''}>EXPRESS LANE</option>
                                                <option value="Special Lane" ${job.laneType === 'Special Lane' ? 'selected' : ''}>SPECIAL LANE</option>
                                            </select>
                                        </div>
                                        ` : `
                                        <div class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-50/50 border border-red-100 rounded-lg px-2 py-0.5"><i data-lucide="route" class="w-3 h-3 text-red-500 shrink-0"></i><span>LANE: ${job.laneType || 'FLEXIBLE'}</span></div>
                                        `}
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Source -->
                            <td class="px-2 py-3 align-middle">
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${job.source === 'Online' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${job.source || 'Walk-in'}</span>
                            </td>

                            <!-- Arrival -->
                            <td class="px-2 py-3 align-middle">
                                <span class="block py-0.5 text-xs font-medium text-gray-600">${formatTime12Hour(job.arrival)}</span>
                            </td>
                            
                            <!-- Departure -->
                            <td class="px-2 py-3 align-middle">
                                ${isEditable ? `
                                <div class="flex items-center gap-1 shrink-0">
                                    <select onchange="updateJobTimeField('${job.id}', 'departure', this.value, 'hour')" class="table-select text-xs !w-[52px] shrink-0 !min-w-[52px] border border-gray-200 bg-white">
                                        ${getHourOptions(convertTimeTo24Hour(job.departure).split(':')[0])}
                                    </select>
                                    <span class="text-gray-400 font-bold">:</span>
                                    <select onchange="updateJobTimeField('${job.id}', 'departure', this.value, 'minute')" class="table-select text-xs !w-[52px] shrink-0 !min-w-[52px] border border-gray-200 bg-white">
                                        ${getMinuteOptions(convertTimeTo24Hour(job.departure).split(':')[1])}
                                    </select>
                                </div>
                                ` : `<span class="block py-0.5 text-xs font-medium text-gray-600">${formatTime12Hour(job.departure)}</span>`}
                            </td>
                            

                            <!-- Evaluation / Diagnosis -->
                            <td class="px-2 py-3 align-middle">
                                ${isEditable ? `
                                <input type="text" id="evaluation-${job.id}" value="${job.evaluation || ''}" placeholder="Diagnosis..." onchange="updateJobField('${job.id}', 'evaluation', this.value)" class="table-select text-xs text-gray-900 border border-gray-200 !w-40 bg-white">
                                ` : `<span class="block py-0.5 text-xs font-medium text-gray-600" id="evaluation-${job.id}">${job.evaluation || '-'}</span>`}
                            </td>

                            <!-- Promised Date -->
                            <td class="px-2 py-3 align-middle">
                                <span class="block py-0.5 text-xs font-bold text-gray-700">${job.promisedDate || '-'}</span>
                            </td>

                            <!-- C.O. Status -->
                            <td class="px-2 py-3 align-middle">
                                ${job.carryOverStatus ? `
                                <span class="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-100">
                                    ${job.carryOverStatus}
                                </span>
                                ` : '<span class="text-gray-400">-</span>'}
                            </td>


                                                      <!-- SLA status -->
                            ${showGoal ? `
                            <td class="px-2 py-3 align-middle">
                                <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase ${job.goalStatus === 'Successful' ? 'bg-green-50 text-green-700 border border-green-100' : job.goalStatus === 'Failed' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-100 text-gray-700'}">
                                    ${job.goalStatus || 'N/A'}
                                </span>
                            </td>
                            ` : ''}
                            
                            <!-- Status -->
                            <td class="px-2 py-3 align-middle">
                                ${isEditable ? `
                                <select onchange="handleStatusChange('${job.id}', this.value, this)" 
                                        class="table-select font-bold text-xs uppercase !w-[150px] border rounded-xl py-1 px-1.5 bg-white outline-none transition cursor-pointer" 
                                        style="${
                                            job.status === 'Ready to Release' || job.status === 'Ready' 
                                                ? 'background-color:#ecfdf5; color:#047857; border-color:#a7f3d0;' 
                                                : job.status === 'Carry Over' 
                                                    ? 'background-color:#fff7ed; color:#c2410c; border-color:#fed7aa;' 
                                                    : job.status === 'Monitoring' 
                                                        ? 'background-color:#eff6ff; color:#1e40af; border-color:#bfdbfe;' 
                                                        : 'background-color:#f9fafb; color:#4b5563; border-color:#e5e7eb;'
                                        }">
                                    <option value="Waiting" style="background-color: white; color: #374151;" ${job.status === 'Waiting' ? 'selected' : ''}>Waiting</option>
                                    <option value="Monitoring" style="background-color: white; color: #374151;" ${job.status === 'Monitoring' ? 'selected' : ''}>Monitoring</option>
                                    <option value="Carry Over" style="background-color: white; color: #374151;" ${job.status === 'Carry Over' ? 'selected' : ''}>${(job.promisedDate || job.carryOverStatus) ? 'Return Carry Over' : 'Carry Over'}</option>
                                    <option value="Ready to Release" style="background-color: white; color: #374151;" ${job.status === 'Ready to Release' || job.status === 'Ready' ? 'selected' : ''}>Ready to Release</option>
                                    <option value="Released" style="background-color: white; color: #374151;" ${job.status === 'Released' ? 'selected' : ''}>Released</option>
                                </select>
                                ` : `<span class="px-1.5 py-0.5 rounded bg-gray-100 text-xs font-bold uppercase text-gray-700">${job.status === 'Ready' ? 'Ready to Release' : job.status}</span>`}
                            </td>

                            <!-- Location -->
                            <td class="px-2 py-3 align-middle">
                                ${isEditable ? `
                                <select onchange="updateJobField('${job.id}', 'location', this.value)" class="table-select font-bold text-xs uppercase !w-[140px] border rounded-xl py-1 px-1.5 bg-white outline-none focus:ring-2 focus:ring-blue-500/20 transition cursor-pointer" style="${job.location !== 'None' ? 'background-color:#eff6ff; color:#1e40af; border-color:#bfdbfe;' : 'color:#4b5563; background-color:#ffffff; border-color:#e5e7eb;'}">
                                    <option value="None" style="background-color: white; color: #374151;" ${job.location === 'None' ? 'selected' : ''}>Waiting Area</option>
                                    ${[1, 2, 3, 4].map(i => {
                                        const liftName = `Lift ${i}`;
                                        const occupiedBy = rowOccupiedLifts[liftName];
                                        const isSelected = job.location === liftName;
                                        if (occupiedBy && !isSelected) {
                                            return `<option value="${liftName}" style="background-color: white; color: #9ca3af;" disabled>${liftName} (Occupied - ${occupiedBy})</option>`;
                                        }
                                        return `<option value="${liftName}" style="background-color: white; color: #1f2937;" ${isSelected ? 'selected' : ''}>${liftName}</option>`;
                                    }).join('')}
                                </select>
                                ` : (job.location && job.location.startsWith('Lift')) ? `<span class="px-2.5 py-1 rounded-full bg-blue-50 text-xs font-bold uppercase text-blue-700 border border-blue-100">${job.location}</span>` : `<span class="px-2.5 py-1 rounded-full bg-gray-50 text-xs font-bold uppercase text-gray-500 border border-gray-150">Waiting Area</span>`}
                            </td>
                        </tr>
                        `;
                    }).join('');
                };

                const dailyIntakesEl = document.getElementById('container-daily-intakes');
                if (dailyIntakesEl) {
                    let filteredActiveJobs = [...activeJobs];
                    if (intakeSearchQuery) {
                        const q = intakeSearchQuery.toLowerCase();
                        filteredActiveJobs = filteredActiveJobs.filter(j =>
                            (j.plate && j.plate.toLowerCase().includes(q)) ||
                            (j.name && j.name.toLowerCase().includes(q)) ||
                            (j.vehicle && j.vehicle.toLowerCase().includes(q)) ||
                            (j.claimStub && j.claimStub.toLowerCase().includes(q)) ||
                            (j.category && j.category.toLowerCase().includes(q))
                        );
                    }

                    // Preserve search input focus before re-rendering
                    const searchInputActive = (document.activeElement && document.activeElement.id === 'intake-search-input');
                    const selectionStart = searchInputActive ? document.activeElement.selectionStart : null;
                    const selectionEnd = searchInputActive ? document.activeElement.selectionEnd : null;

                    dailyIntakesEl.innerHTML = `
                        <div class="space-y-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="p-2 bg-red-50 rounded-lg text-red-600"><i data-lucide="list-todo" class="w-5 h-5"></i></div>
                                    <div>
                                        <h3 class="text-lg font-black uppercase tracking-tight text-gray-900">Daily Intakes - Marikina</h3>
                                        <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Active Vehicles in Workshop</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Daily Intakes Advanced Filter & Sorting Panel -->
                            <div class="flex flex-wrap items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                                <!-- Search Input -->
                                <div class="relative w-64">
                                    <i data-lucide="search" class="absolute left-3 top-2.5 text-gray-400 w-4 h-4"></i>
                                    <input type="text" id="intake-search-input" value="${intakeSearchQuery}" oninput="updateIntakeFilter('search', this.value)" placeholder="Search plate, vehicle..." class="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 outline-none text-xs focus:border-red-500 transition font-medium">
                                </div>
                                
                                <!-- Dropdown Filters -->
                                <div class="flex flex-wrap items-center gap-3">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Source:</span>
                                        <select id="intake-source-filter" onchange="updateIntakeFilter('source', this.value)" class="bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none text-xs focus:border-red-500 transition font-bold cursor-pointer">
                                            <option value="all" ${intakeSourceFilter === 'all' ? 'selected' : ''}>All Sources</option>
                                            <option value="Online" ${intakeSourceFilter === 'Online' ? 'selected' : ''}>Online Booking</option>
                                            <option value="Walk-in" ${intakeSourceFilter === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
                                        </select>
                                    </div>
                                    
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Time (Prototype):</span>
                                        <select id="intake-time-filter" onchange="updateIntakeFilter('time', this.value)" class="bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none text-xs focus:border-red-500 transition font-bold cursor-pointer">
                                            <option value="all" ${intakeTimeFilter === 'all' ? 'selected' : ''}>All Day</option>
                                            <option value="morning" ${intakeTimeFilter === 'morning' ? 'selected' : ''}>Morning (08:00 - 12:00)</option>
                                            <option value="afternoon" ${intakeTimeFilter === 'afternoon' ? 'selected' : ''}>Afternoon (12:00 - 17:00)</option>
                                        </select>
                                    </div>

                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Sort By:</span>
                                        <select id="intake-sort-by" onchange="updateIntakeFilter('sort', this.value)" class="bg-white border border-gray-200 rounded-xl px-3 py-1.5 outline-none text-xs focus:border-red-500 transition font-bold cursor-pointer">
                                            <option value="claimStub" ${intakeSortBy === 'claimStub' ? 'selected' : ''}>Claim Stub (Asc)</option>
                                            <option value="arrival" ${intakeSortBy === 'arrival' ? 'selected' : ''}>Arrival Time</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div class="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 rounded-xl custom-scroll bg-white">
                                <table class="w-full text-left min-w-full">
                                    ${getTableHeaderHtml()}
                                    <tbody>
                                        ${renderJobRows(filteredActiveJobs) || `<tr><td colspan="${showGoal ? 10 : 9}" class="text-center py-8 text-gray-500 font-medium">No active vehicles in the queue.</td></tr>`}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;

                    // Restore search input focus and cursor selection position
                    if (searchInputActive) {
                        const newInput = document.getElementById('intake-search-input');
                        if (newInput) {
                            newInput.focus();
                            if (selectionStart !== null && selectionEnd !== null) {
                                newInput.setSelectionRange(selectionStart, selectionEnd);
                            }
                        }
                    }
                }
            }

            // TECH BOARD (DEPRECATED - Hiding it)
            if (isTech && document.getElementById('tech-cards-grid')) {
                document.getElementById('tech-cards-grid').innerHTML = `<div class="col-span-full text-center py-12 text-gray-500 font-medium bg-white rounded-2xl border border-gray-200">Tech Board is no longer active. SAs manage evaluations from Daily Intakes.</div>`;
            }

            // CARRY OVER BOARD
            if (document.getElementById('table-carry-over')) {
                const carryOverJobs = allJobs.filter(j => j.status === 'Carry Over');
                document.getElementById('table-carry-over').innerHTML = carryOverJobs.map(job => {
                    const isEditable = isSA;
                    
                    let actions = '';
                    if (isEditable) {
                        actions = `
                            <div class="flex gap-1.5 justify-end">
                                <button onclick="setJobStatus('${job.id}', 'Waiting')" class="bg-slate-100 text-slate-700 hover:bg-slate-200 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase transition whitespace-nowrap">Return Active</button>
                                <button onclick="setJobStatus('${job.id}', 'Ready')" class="bg-emerald-650 bg-emerald-600 text-white hover:bg-emerald-700 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase transition whitespace-nowrap shadow-md shadow-emerald-500/10">Ready (TV)</button>
                                <button onclick="completeRelease('${job.id}')" class="bg-rose-600 text-white hover:bg-rose-700 px-2 py-1.5 rounded-xl text-[10px] font-black uppercase transition whitespace-nowrap shadow-md shadow-rose-500/10">Remove</button>
                            </div>
                        `;
                    } else {
                        actions = `<span class="text-xs text-gray-400 italic">Read-Only</span>`;
                    }

                    return `
                    <tr>
                        <td class="px-3 py-4"><span class="font-black italic text-gray-900 text-lg">${job.plate}</span></td>
                        <td class="px-3 py-4"><span class="text-gray-600 text-sm font-medium">${job.vehicle}</span></td>
                        <td class="px-3 py-4">
                            <div class="flex gap-2 items-center">
                                <span class="text-gray-500 text-xs w-24 bg-gray-100 px-2 py-1 rounded">${job.dateReceived}</span>
                                ${isEditable ? `<input type="date" value="${job.promisedDate || ''}" onchange="updateJobField('${job.id}', 'promisedDate', this.value)" class="table-select text-orange-600 font-bold text-sm w-32 border border-gray-200 bg-white">` : `<span class="text-orange-600 font-bold text-sm w-28">${job.promisedDate || 'TBD'}</span>`}
                            </div>
                        </td>
                        <td class="px-3 py-4"><span class="text-gray-750 text-sm font-semibold">${job.saName || '-'}</span></td>
                        <td class="px-3 py-4">
                            ${isEditable ? `<input type="text" value="${job.evaluation || ''}" onchange="updateJobField('${job.id}', 'evaluation', this.value)" class="table-select text-gray-900 font-medium w-48 border border-gray-200 bg-white">` : `<span class="text-gray-700 text-sm">${job.evaluation || '-'}</span>`}
                        </td>
                        <td class="px-3 py-4">
                            ${isEditable ? `
                            <select onchange="updateJobField('${job.id}', 'carryOverStatus', this.value)" 
                                    class="table-select font-bold text-xs uppercase !w-44 border rounded-xl py-1.5 px-2 bg-white outline-none transition cursor-pointer" 
                                    style="background-color:#fff7ed; color:#c2410c; border-color:#fed7aa;">
                                <option value="Awaiting Parts" style="background-color: white; color: #374151;" ${job.carryOverStatus === 'Awaiting Parts' ? 'selected' : ''}>Awaiting Parts</option>
                                <option value="Extended Repair" style="background-color: white; color: #374151;" ${job.carryOverStatus === 'Extended Repair' ? 'selected' : ''}>Extended Repair</option>
                                <option value="Technician Unavailable" style="background-color: white; color: #374151;" ${job.carryOverStatus === 'Technician Unavailable' ? 'selected' : ''}>Technician Unavailable</option>
                                <option value="WCA" style="background-color: white; color: #374151;" ${job.carryOverStatus === 'WCA' ? 'selected' : ''}>WCA</option>
                                <option value="Others" style="background-color: white; color: #374151;" ${job.carryOverStatus === 'Others' ? 'selected' : ''}>Others</option>
                            </select>
                            ` : `<span class="px-2.5 py-1 rounded-full bg-orange-50 text-xs font-bold uppercase text-orange-700 border border-orange-100">${job.carryOverStatus || 'Awaiting Parts'}</span>`}
                        </td>
                        <td class="px-3 py-4 text-right">
                            ${actions}
                        </td>
                    </tr>
                    `;
                }).join('') || `<tr><td colspan="7" class="text-center py-8 text-gray-500 font-medium">No carry over vehicles.</td></tr>`;
            }

            lucide.createIcons();
            applyPeriodicFilters();
        }

        function handleStatusChange(jobId, newStatus, selectElement) {
            if (newStatus === 'Carry Over') {
                openCarryoverModal(jobId, selectElement);
            } else if (newStatus === 'Released') {
                completeRelease(jobId);
            } else {
                setJobStatus(jobId, newStatus);
            }
        }

        function applyPeriodicFilters() {
            const query = document.getElementById('periodic-search-query') ? document.getElementById('periodic-search-query').value.toLowerCase().trim() : '';
            const source = document.getElementById('periodic-search-source') ? document.getElementById('periodic-search-source').value : 'all';
            const branch = document.getElementById('periodic-search-branch') ? document.getElementById('periodic-search-branch').value : 'all';
            const saFilter = document.getElementById('periodic-search-sa') ? document.getElementById('periodic-search-sa').value : 'all';
            const statusFilter = document.getElementById('periodic-search-status') ? document.getElementById('periodic-search-status').value : 'all';
            const goalFilter = document.getElementById('periodic-search-goal') ? document.getElementById('periodic-search-goal').value : 'all';
            const startDateVal = document.getElementById('periodic-search-start-date') ? document.getElementById('periodic-search-start-date').value : '';
            const endDateVal = document.getElementById('periodic-search-end-date') ? document.getElementById('periodic-search-end-date').value : '';
            
            let filtered = allJobs || [];
            
            if (source !== 'all') {
                filtered = filtered.filter(j => j.source === source);
            }
            if (branch !== 'all') {
                filtered = filtered.filter(j => j.branch === branch);
            }
            if (saFilter !== 'all') {
                filtered = filtered.filter(j => j.saName === saFilter);
            }
            if (statusFilter !== 'all') {
                filtered = filtered.filter(j => j.status === statusFilter);
            }
            if (goalFilter !== 'all') {
                filtered = filtered.filter(j => j.goalStatus === goalFilter);
            }
            if (query) {
                filtered = filtered.filter(j => 
                    (j.plate && j.plate.toLowerCase().includes(query)) ||
                    (j.name && j.name.toLowerCase().includes(query)) ||
                    (j.contact && j.contact.toLowerCase().includes(query)) ||
                    (j.vehicle && j.vehicle.toLowerCase().includes(query)) ||
                    (j.claimStub && j.claimStub.toLowerCase().includes(query)) ||
                    (j.saName && j.saName.toLowerCase().includes(query)) ||
                    (j.category && j.category.toLowerCase().includes(query)) ||
                    (j.remarks && j.remarks.toLowerCase().includes(query)) ||
                    (j.evaluation && j.evaluation.toLowerCase().includes(query)) ||
                    (j.laneType && j.laneType.toLowerCase().includes(query))
                );
            }
            if (startDateVal) {
                filtered = filtered.filter(j => j.dateReceived >= startDateVal);
            }
            if (endDateVal) {
                filtered = filtered.filter(j => j.dateReceived <= endDateVal);
            }
            
            const tbody = document.getElementById('table-periodic-body');
            if (tbody) {
                tbody.innerHTML = filtered.map(job => `
                    <tr class="${job.status === 'Completed' ? 'bg-green-50/10' : job.status === 'Carry Over' ? 'bg-orange-50/10' : ''}">
                        <td class="px-2 py-3 align-middle"><span class="block py-0.5 text-xs text-gray-600 font-medium">${job.dateReceived}</span></td>
                        <td class="px-2 py-3 align-middle"><span class="inline-flex items-center justify-center w-fit font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-850 px-2 py-0.5 rounded border border-gray-250">${job.claimStub || 'N/A'}</span></td>
                        <td class="px-2 py-3 align-middle"><span class="inline-flex items-center justify-center w-fit font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-850 px-2 py-0.5 rounded border border-gray-250">${job.plate}</span></td>
                        <td class="px-2 py-3 align-middle"><span class="block py-0.5 text-xs font-bold text-gray-800">${job.name}</span></td>
                        <td class="px-2 py-3 align-middle"><span class="block py-0.5 font-mono text-xs text-gray-600">${formatPhoneNumber(job.contact)}</span></td>
                        <td class="px-2 py-3 align-middle">
                            <div class="text-xs font-bold text-gray-800 py-0.5">${job.vehicle}</div>
                            ${job.laneType ? `<span class="inline-block text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 mt-1">${job.laneType}</span>` : ''}
                        </td>
                        <td class="px-2 py-3 align-middle">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.category && job.category.toUpperCase().includes('PMS') ? 'bg-blue-50 text-blue-600 border border-blue-100' : job.category && job.category.toUpperCase().includes('GR') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}">
                                ${job.category}
                            </span>
                        </td>
                        <td class="px-2 py-3 align-middle"><span class="block py-0.5 text-xs font-bold text-gray-500 uppercase tracking-wider">${job.source}</span></td>
                        <td class="px-2 py-3 align-middle"><span class="block py-0.5 text-xs font-medium text-gray-600">${job.branch || 'Branch A'}</span></td>
                        <td class="px-2 py-3 align-middle">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${job.goalStatus === 'Successful' ? 'bg-green-50 text-green-700 border border-green-100' : job.goalStatus === 'Failed' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-100 text-gray-700'}">
                                ${job.goalStatus || 'N/A'}
                            </span>
                        </td>
                        <td class="px-2 py-3 align-middle"><span class="block py-0.5 text-xs font-semibold text-gray-700">${job.saName || '-'}</span></td>
                        <td class="px-2 py-3 align-middle"><span class="px-2 py-0.5 rounded bg-gray-100 text-xs font-bold uppercase text-gray-700">${job.status}</span></td>
                        <td class="px-2 py-3 align-top text-gray-655 max-w-[200px] truncate" title="Evaluation: ${job.evaluation || '-'}&#10;Remarks: ${job.remarks || '-'}">
                            <span class="block py-0.5 text-xs font-semibold text-gray-700">Diag: ${job.evaluation || '-'}</span>
                            <span class="block text-[10px] text-gray-400">Rem: ${job.remarks || '-'}</span>
                        </td>
                    </tr>
                `).join('') || `<tr><td colspan="13" class="text-center py-12 text-gray-400 font-medium">No records found.</td></tr>`;
            }
            
            const countEl = document.getElementById('periodic-table-count');
            if (countEl) countEl.innerText = `${filtered.length} records`;
            lucide.createIcons();
        }

        let carryoverDropdownRef = null;
        function openCarryoverModal(jobId, selectElement) {
            carryoverDropdownRef = selectElement;
            document.getElementById('carryover-job-id').value = jobId;
            
            const job = allJobs.find(j => j.id === jobId);
            
            if (job && (job.promisedDate || job.carryOverStatus)) {
                document.getElementById('carryover-promised-date').value = job.promisedDate || '';
                document.getElementById('carryover-status').value = job.carryOverStatus || 'Awaiting Parts';
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                document.getElementById('carryover-promised-date').value = tomorrow.toISOString().split('T')[0];
                document.getElementById('carryover-status').value = 'Awaiting Parts';
            }
            
            document.getElementById('carryover-modal').classList.remove('hidden');
        }

        function closeCarryoverModal() {
            document.getElementById('carryover-modal').classList.add('hidden');
            if (carryoverDropdownRef) {
                const jobId = document.getElementById('carryover-job-id').value;
                const job = allJobs.find(j => j.id === jobId);
                if (job) {
                    carryoverDropdownRef.value = job.status;
                }
            }
            renderStaffTables();
        }

        async function submitCarryoverDetails() {
            const jobId = document.getElementById('carryover-job-id').value;
            const promisedDate = document.getElementById('carryover-promised-date').value;
            const carryOverStatus = document.getElementById('carryover-status').value;
            if (!promisedDate) {
                return alert('Promised date is required.');
            }
            
            try {
                // Get the evaluation value from the Daily Intakes table row to save it
                const evalEl = document.getElementById(`evaluation-${jobId}`);
                if (evalEl) {
                    const evaluationValue = evalEl.value !== undefined ? evalEl.value.trim() : evalEl.textContent.trim();
                    await apiRequest(`/api/jobs/${jobId}/field`, {
                        method: 'PATCH',
                        body: { field: 'evaluation', value: evaluationValue }
                    });
                }

                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field: 'carryOverStatus', value: carryOverStatus }
                });
                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field: 'promisedDate', value: promisedDate }
                });
                await apiRequest(`/api/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    body: { status: 'Carry Over' }
                });
                
                document.getElementById('carryover-modal').classList.add('hidden');
                showSystemToast('Vehicle successfully moved to Carry Over.', 'success', 'Carry-Over Updated');
                await loadData();
                renderStaffTables();
                renderTV();
            } catch (err) {
                showSystemToast(err.message || 'Failed to update Carry Over details.', 'error');
            }
        }

        async function approveGRS(jobId) {
            try {
                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field: 'category', value: 'PMS AND GRS' }
                });
                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field: 'recommendation', value: 'Approved' }
                });
                showSystemToast('GRS recommendation approved. Category upgraded to PMS AND GRS.', 'success', 'Recommendation Approved');
                await loadData();
                renderStaffTables();
            } catch (err) {
                showSystemToast(err.message || 'Failed to approve GRS recommendation.', 'error');
            }
        }

        async function declineGRS(jobId) {
            try {
                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field: 'recommendation', value: 'Declined' }
                });
                showSystemToast('GRS recommendation declined.', 'info', 'Recommendation Declined');
                await loadData();
                renderStaffTables();
            } catch (err) {
                showSystemToast(err.message || 'Failed to decline GRS recommendation.', 'error');
            }
        }

        function renderReports() {
            if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;

            // Read selected branch filter if it exists
            const branchVal = document.getElementById('analytics-branch') ? document.getElementById('analytics-branch').value : 'all';
            let listForReports = [...allJobs];
            if (branchVal !== 'all') {
                listForReports = listForReports.filter(j => j.branch === branchVal);
            }

            // Render live operations cards (Tab 1)
            const today = new Date().toISOString().split('T')[0];
            const todayJobs = listForReports.filter(j => j.dateReceived === today);
            
            const releasedCount = listForReports.filter(j => j.status === 'Completed' && j.dateCompleted === today).length;
            const readyToReleaseCount = listForReports.filter(j => j.status === 'Ready to Release' || j.status === 'Ready').length;
            const carryoverCount = listForReports.filter(j => j.status === 'Carry Over').length;
            
            const inBayCount = listForReports.filter(j => j.location && j.location.startsWith('Lift') && j.status !== 'Completed' && j.status !== 'Released').length;
            const monitoringCount = listForReports.filter(j => j.status === 'Monitoring').length;

            document.getElementById('metric-intake').innerText = todayJobs.length;
            document.getElementById('metric-completed').innerText = releasedCount;
            document.getElementById('metric-carryover').innerText = carryoverCount;
            document.getElementById('metric-inbay').innerText = inBayCount;

            // Calculate live branch splits
            const intakeA = allJobs.filter(j => j.dateReceived === today && j.branch === 'Branch A').length;
            const intakeB = allJobs.filter(j => j.dateReceived === today && j.branch === 'Branch B').length;

            const completedA = allJobs.filter(j => j.status === 'Completed' && j.dateCompleted === today && j.branch === 'Branch A').length;
            const completedB = allJobs.filter(j => j.status === 'Completed' && j.dateCompleted === today && j.branch === 'Branch B').length;

            const carryA = allJobs.filter(j => j.status === 'Carry Over' && j.branch === 'Branch A').length;
            const carryB = allJobs.filter(j => j.status === 'Carry Over' && j.branch === 'Branch B').length;

            const inbayA = allJobs.filter(j => j.location && j.location.startsWith('Lift') && j.status !== 'Completed' && j.status !== 'Released' && j.branch === 'Branch A').length;
            const inbayB = allJobs.filter(j => j.location && j.location.startsWith('Lift') && j.status !== 'Completed' && j.status !== 'Released' && j.branch === 'Branch B').length;

            if (document.getElementById('live-branch-a-intake')) document.getElementById('live-branch-a-intake').innerText = intakeA;
            if (document.getElementById('live-branch-b-intake')) document.getElementById('live-branch-b-intake').innerText = intakeB;

            if (document.getElementById('live-branch-a-completed')) document.getElementById('live-branch-a-completed').innerText = completedA;
            if (document.getElementById('live-branch-b-completed')) document.getElementById('live-branch-b-completed').innerText = completedB;

            if (document.getElementById('live-branch-a-carryover')) document.getElementById('live-branch-a-carryover').innerText = carryA;
            if (document.getElementById('live-branch-b-carryover')) document.getElementById('live-branch-b-carryover').innerText = carryB;

            if (document.getElementById('live-branch-a-inbay')) document.getElementById('live-branch-a-inbay').innerText = inbayA;
            if (document.getElementById('live-branch-b-inbay')) document.getElementById('live-branch-b-inbay').innerText = inbayB;

            // Toggle visibility of live breakdowns depending on branchVal
            const liveSplits = ['live-intake-branch-split', 'live-completed-branch-split', 'live-carryover-branch-split', 'live-inbay-branch-split'];
            liveSplits.forEach(sId => {
                const el = document.getElementById(sId);
                if (el) {
                    if (branchVal === 'all') {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                }
            });

            // Update subtext labels to show supplementary stats
            const completedSub = document.getElementById('metric-completed-subtext');
            if (completedSub) {
                completedSub.innerHTML = `Services Completed <span class="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mt-1">(${readyToReleaseCount} Ready to Release)</span>`;
            }

            const inbaySub = document.getElementById('metric-inbay-subtext');
            if (inbaySub) {
                inbaySub.innerHTML = `Currently on Lift <span class="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mt-1">(${monitoringCount} Monitoring)</span>`;
            }

            // If we are currently looking at the analytics center or periodic tab, reload their data too
            if (currentDashboardTab === 'analytics') {
                loadAnalyticsData();
            } else if (currentDashboardTab === 'periodic') {
                applyAnalyticFilters();
            }
        }

        async function switchDashboardTab(tab) {
            currentDashboardTab = tab;
            const btnMonitor = document.getElementById('btn-db-tab-monitor');
            const btnAnalytics = document.getElementById('btn-db-tab-analytics');
            const btnPeriodic = document.getElementById('btn-db-tab-periodic');
            const secMonitor = document.getElementById('db-tab-monitor');
            const secAnalytics = document.getElementById('db-tab-analytics');
            const secPeriodic = document.getElementById('db-tab-periodic');
            const secSelectors = document.getElementById('db-analytics-selectors');

            const activeClass = "pb-3 text-xs font-black uppercase tracking-wider border-b-2 border-red-650 text-red-650 transition flex items-center gap-1.5";
            const inactiveClass = "pb-3 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5";

            // Hide all tabs
            secMonitor.classList.add('hidden');
            secAnalytics.classList.add('hidden');
            if (secPeriodic) secPeriodic.classList.add('hidden');
            
            // Show/Hide selectors container
            if (secSelectors) {
                secSelectors.classList.remove('hidden');
                const wrapScope = document.getElementById('wrapper-analytics-scope');
                const wrapPeriod = document.getElementById('wrapper-analytics-period');
                const pickerDaily = document.getElementById('picker-daily');
                const pickerWeekly = document.getElementById('picker-weekly');
                const pickerMonthly = document.getElementById('picker-monthly');

                if (tab === 'monitor') {
                    if (wrapScope) wrapScope.classList.add('hidden');
                    if (wrapPeriod) wrapPeriod.classList.add('hidden');
                    if (pickerDaily) pickerDaily.classList.add('hidden');
                    if (pickerWeekly) pickerWeekly.classList.add('hidden');
                    if (pickerMonthly) pickerMonthly.classList.add('hidden');
                } else {
                    if (wrapScope) wrapScope.classList.remove('hidden');
                    if (wrapPeriod) wrapPeriod.classList.remove('hidden');
                    handleScopeChange();
                }
            }

            btnMonitor.className = inactiveClass;
            btnAnalytics.className = inactiveClass;
            if (btnPeriodic) btnPeriodic.className = inactiveClass;

            if (tab === 'monitor') {
                secMonitor.classList.remove('hidden');
                btnMonitor.className = activeClass;
            } else if (tab === 'analytics') {
                secAnalytics.classList.remove('hidden');
                btnAnalytics.className = activeClass;
                initAnalyticsPickers();
                loadAnalyticsData();
            } else if (tab === 'periodic') {
                if (secPeriodic) secPeriodic.classList.remove('hidden');
                if (btnPeriodic) btnPeriodic.className = activeClass;
                
                if (!analyticsJobs) {
                    initAnalyticsPickers();
                    await loadAnalyticsData();
                } else {
                    applyAnalyticFilters();
                }
            }
        }

        function handleBranchChange() {
            if (currentDashboardTab === 'monitor') {
                renderReports();
            } else if (currentDashboardTab === 'analytics') {
                loadAnalyticsData();
            } else if (currentDashboardTab === 'periodic') {
                applyAnalyticFilters();
            }
        }

        function initAnalyticsPickers() {
            const today = new Date().toISOString().split('T')[0];
            const month = today.slice(0, 7); // YYYY-MM

            if (!document.getElementById('analytics-date').value) {
                document.getElementById('analytics-date').value = today;
            }
            if (!document.getElementById('analytics-week-date').value) {
                document.getElementById('analytics-week-date').value = today;
            }
            if (!document.getElementById('analytics-month').value) {
                document.getElementById('analytics-month').value = month;
            }
        }

        function handleScopeChange() {
            const scope = document.getElementById('analytics-scope').value;
            document.getElementById('picker-daily').classList.toggle('hidden', scope !== 'daily');
            document.getElementById('picker-weekly').classList.toggle('hidden', scope !== 'weekly');
            document.getElementById('picker-monthly').classList.toggle('hidden', scope !== 'monthly');
            loadAnalyticsData();
        }

        async function loadAnalyticsData() {
            if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;

            const scope = document.getElementById('analytics-scope').value;
            let startDate = '';
            let endDate = '';
            let labelText = '';

            if (scope === 'daily') {
                const val = document.getElementById('analytics-date').value;
                if (!val) return;
                startDate = val;
                endDate = val;
                labelText = `Period: ${new Date(val).toLocaleDateString('en-US', { dateStyle: 'long' })}`;
            } else if (scope === 'weekly') {
                const val = document.getElementById('analytics-week-date').value;
                if (!val) return;

                // Calculate Monday and Sunday of selected week
                const d = new Date(val);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                const monday = new Date(d.setDate(diff));
                const sunday = new Date(d.setDate(monday.getDate() + 6));

                startDate = monday.toISOString().split('T')[0];
                endDate = sunday.toISOString().split('T')[0];
                labelText = `Period: ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else if (scope === 'monthly') {
                const val = document.getElementById('analytics-month').value; // YYYY-MM
                if (!val) return;

                const parts = val.split('-');
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]);

                startDate = `${val}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                endDate = `${val}-${String(lastDay).padStart(2, '0')}`;

                const dummyDate = new Date(year, month - 1, 1);
                labelText = `Period: ${dummyDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            }

            document.getElementById('analytics-period-label').innerText = labelText;

            try {
                analyticsJobs = await apiRequest(`/api/jobs/analytics?startDate=${startDate}&endDate=${endDate}`);
                
                const branchVal = document.getElementById('analytics-branch') ? document.getElementById('analytics-branch').value : 'all';
                let filteredJobs = [...analyticsJobs];
                if (branchVal !== 'all') {
                    filteredJobs = filteredJobs.filter(j => j.branch === branchVal);
                }
                
                renderAnalytics(filteredJobs, scope, startDate, endDate);
            } catch (err) {
                console.error(err);
                showSystemToast('Failed to load analytics data.', 'error', 'API Error');
            }
        }

        function applyAnalyticFilters() {
            const saFilter = document.getElementById('filter-analytic-sa').value;
            const statusFilter = document.getElementById('filter-analytic-status').value;
            const goalFilter = document.getElementById('filter-analytic-goal').value;
            const searchQuery = document.getElementById('filter-analytic-search') ? document.getElementById('filter-analytic-search').value.toLowerCase().trim() : '';
            const startDateVal = document.getElementById('filter-analytic-start-date') ? document.getElementById('filter-analytic-start-date').value : '';
            const endDateVal = document.getElementById('filter-analytic-end-date') ? document.getElementById('filter-analytic-end-date').value : '';
            const branchFilter = document.getElementById('analytics-branch') ? document.getElementById('analytics-branch').value : 'all';

            let filtered = analyticsJobs || [];

            if (branchFilter !== 'all') {
                filtered = filtered.filter(j => j.branch === branchFilter);
            }
            if (saFilter !== 'all') {
                filtered = filtered.filter(j => j.saName === saFilter);
            }
            if (statusFilter !== 'all') {
                filtered = filtered.filter(j => j.status === statusFilter);
            }
            if (goalFilter !== 'all') {
                filtered = filtered.filter(j => j.goalStatus === goalFilter);
            }
            if (searchQuery) {
                filtered = filtered.filter(j => 
                    (j.plate && j.plate.toLowerCase().includes(searchQuery)) ||
                    (j.vehicle && j.vehicle.toLowerCase().includes(searchQuery)) ||
                    (j.saName && j.saName.toLowerCase().includes(searchQuery)) ||
                    (j.claimStub && j.claimStub.toLowerCase().includes(searchQuery)) ||
                    (j.category && j.category.toLowerCase().includes(searchQuery)) ||
                    (j.evaluation && j.evaluation.toLowerCase().includes(searchQuery)) ||
                    (j.remarks && j.remarks.toLowerCase().includes(searchQuery)) ||
                    (j.branch && j.branch.toLowerCase().includes(searchQuery))
                );
            }
            if (startDateVal) {
                filtered = filtered.filter(j => j.dateReceived >= startDateVal);
            }
            if (endDateVal) {
                filtered = filtered.filter(j => j.dateReceived <= endDateVal);
            }

            const tableBody = document.getElementById('table-analytics-body');
            if (tableBody) {
                tableBody.innerHTML = filtered.map(job => `
                    <tr class="${job.status === 'Completed' ? 'bg-green-50/20' : job.status === 'Carry Over' ? 'bg-orange-50/20' : ''}">
                        <td class="px-6 py-4.5">${job.dateReceived}</td>
                        <td class="px-6 py-4.5"><span class="font-mono text-[11px] bg-gray-100 px-2.5 py-1 rounded text-gray-600 font-bold">${job.claimStub || 'N/A'}</span></td>
                        <td class="px-6 py-4.5"><span class="font-black italic text-gray-900 text-sm">${job.plate}</span></td>
                        <td class="px-6 py-4.5">${job.vehicle}</td>
                        <td class="px-6 py-4.5">
                            <span class="px-2.5 py-1 rounded text-[10px] font-black ${job.category && job.category.toUpperCase().includes('PMS') ? 'bg-blue-50 text-blue-600 border border-blue-100' : job.category && job.category.toUpperCase().includes('GR') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}">
                                ${job.category}
                            </span>
                        </td>
                        <td class="px-6 py-4.5 text-xs text-gray-700 font-semibold">${job.branch || 'Branch A'}</td>
                        <td class="px-6 py-4.5 text-xs text-gray-500 font-bold uppercase tracking-wider">${job.source}</td>
                        <td class="px-6 py-4.5 font-mono text-xs text-gray-600">${formatTime12Hour(job.arrival)}</td>
                        <td class="px-6 py-4.5 font-mono text-xs text-gray-600">${formatTime12Hour(job.departure)}</td>
                        <td class="px-6 py-4.5">
                            <span class="px-2.5 py-1 rounded text-[10px] font-black uppercase ${job.goalStatus === 'Successful' ? 'bg-green-50 text-green-700 border border-green-100' : job.goalStatus === 'Failed' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-100 text-gray-700'}">
                                ${job.goalStatus || 'N/A'}
                            </span>
                        </td>
                        <td class="px-6 py-4.5 text-gray-700 font-bold text-xs">${job.saName || '-'}</td>
                        <td class="px-6 py-4.5 text-gray-500 max-w-[200px] truncate" title="${job.remarks || ''}">${job.remarks || '-'}</td>
                    </tr>
                `).join('') || `<tr><td colspan="12" class="text-center py-12 text-gray-400 font-medium">No record entries match this period.</td></tr>`;
            }
            document.getElementById('analytic-table-count').innerText = `${filtered.length} records`;
        }

        function renderAnalytics(jobs, scope, startStr, endStr) {
            const total = jobs.length;
            const completed = jobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const carryover = jobs.filter(j => j.status === 'Carry Over').length;

            // Average Service Duration
            const timedJobs = jobs.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.arrival && j.departure);
            let totalMinutes = 0;
            let countTimed = 0;

            timedJobs.forEach(j => {
                const arrMin = parseTimeToMinutes(j.arrival);
                const depMin = parseTimeToMinutes(j.departure);
                if (arrMin !== null && depMin !== null) {
                    let diff = depMin - arrMin;
                    if (diff < 0) diff += 24 * 60; // overnight adjustment
                    totalMinutes += diff;
                    countTimed++;
                }
            });

            const avgMinutes = countTimed > 0 ? Math.round(totalMinutes / countTimed) : 0;
            const durationText = countTimed > 0 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : '--';

            // Update Metric Display
            document.getElementById('analytic-metric-intake').innerText = total;
            document.getElementById('analytic-metric-completed').innerText = completed;
            document.getElementById('analytic-metric-carryover').innerText = carryover;
            document.getElementById('analytic-metric-duration').innerText = durationText;

            // Branch level metrics (computed from unfiltered analyticsJobs)
            const listForBranchCalc = analyticsJobs || [];
            
            const intakeA = listForBranchCalc.filter(j => j.branch === 'Branch A').length;
            const intakeB = listForBranchCalc.filter(j => j.branch === 'Branch B').length;
            document.getElementById('branch-a-intake').innerText = intakeA;
            document.getElementById('branch-b-intake').innerText = intakeB;

            const completedA = listForBranchCalc.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.branch === 'Branch A').length;
            const completedB = listForBranchCalc.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.branch === 'Branch B').length;
            document.getElementById('branch-a-completed').innerText = completedA;
            document.getElementById('branch-b-completed').innerText = completedB;

            const carryA = listForBranchCalc.filter(j => j.status === 'Carry Over' && j.branch === 'Branch A').length;
            const carryB = listForBranchCalc.filter(j => j.status === 'Carry Over' && j.branch === 'Branch B').length;
            document.getElementById('branch-a-carryover').innerText = carryA;
            document.getElementById('branch-b-carryover').innerText = carryB;

            const timedA = listForBranchCalc.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.arrival && j.departure && j.branch === 'Branch A');
            const timedB = listForBranchCalc.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.arrival && j.departure && j.branch === 'Branch B');
            
            const calcAvgDuration = (timedList) => {
                let totalMin = 0;
                let count = 0;
                timedList.forEach(j => {
                    const arrMin = parseTimeToMinutes(j.arrival);
                    const depMin = parseTimeToMinutes(j.departure);
                    if (arrMin !== null && depMin !== null) {
                        let diff = depMin - arrMin;
                        if (diff < 0) diff += 24 * 60;
                        totalMin += diff;
                        count++;
                    }
                });
                const avgMin = count > 0 ? Math.round(totalMin / count) : 0;
                return count > 0 ? `${Math.floor(avgMin / 60)}h ${avgMin % 60}m` : '--';
            };
            document.getElementById('branch-a-duration').innerText = calcAvgDuration(timedA);
            document.getElementById('branch-b-duration').innerText = calcAvgDuration(timedB);

            // Compute Insights
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            const checkups = jobs.filter(j => j.category && j.category.toUpperCase().includes('CHECK-UP')).length;
            const pms = jobs.filter(j => j.category && j.category.toUpperCase().includes('PMS')).length;
            const gr = jobs.filter(j => j.category && j.category.toUpperCase().includes('GR')).length;

            document.getElementById('insight-completion-rate').innerText = `${completionRate}%`;
            document.getElementById('insight-checkups-count').innerText = checkups;
            document.getElementById('insight-pms-count').innerText = pms;
            document.getElementById('insight-gr-count').innerText = gr;

            // Compute PMS Success & Failure
            const pmsJobs = jobs.filter(j => j.category && j.category.toUpperCase().includes('PMS'));
            const completedPmsJobs = pmsJobs.filter(j => j.goalStatus === 'Successful' || j.goalStatus === 'Failed');
            const successfulPms = pmsJobs.filter(j => j.goalStatus === 'Successful').length;
            const failedPms = pmsJobs.filter(j => j.goalStatus === 'Failed').length;
            const pmsSuccessRate = completedPmsJobs.length > 0 ? Math.round((successfulPms / completedPmsJobs.length) * 100) : 0;

            if (document.getElementById('insight-pms-success-rate')) {
                document.getElementById('insight-pms-success-rate').innerText = `${pmsSuccessRate}%`;
            }
            if (document.getElementById('insight-pms-success-counts')) {
                document.getElementById('insight-pms-success-counts').innerText = `${successfulPms} S / ${failedPms} F`;
            }

            // Compute Peak Intake Hours
            const hourCounts = {};
            jobs.forEach(j => {
                const time = j.arrival || j.apptTime;
                if (time && time.includes(':')) {
                    const hour = parseInt(time.split(':')[0]);
                    if (!isNaN(hour)) {
                        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                    }
                }
            });
            let peakHour = -1;
            let maxCount = 0;
            for (const hour in hourCounts) {
                if (hourCounts[hour] > maxCount) {
                    maxCount = hourCounts[hour];
                    peakHour = parseInt(hour);
                }
            }
            let peakHourText = '--';
            if (peakHour !== -1) {
                const ampm = peakHour >= 12 ? 'PM' : 'AM';
                const displayHour = peakHour % 12 === 0 ? 12 : peakHour % 12;
                peakHourText = `${displayHour}:00 ${ampm} (${maxCount} cars)`;
            }
            if (document.getElementById('insight-peak-hour')) {
                document.getElementById('insight-peak-hour').innerText = peakHourText;
            }

            // Compute Walk-in vs. Online Ratio
            const walkinCount = jobs.filter(j => j.source === 'Walk-in').length;
            const onlineCount = jobs.filter(j => j.source === 'Online').length;
            let ratioText = '0% W / 0% O';
            if (total > 0) {
                const walkinPct = Math.round((walkinCount / total) * 100);
                const onlinePct = Math.round((onlineCount / total) * 100);
                ratioText = `${walkinPct}% W / ${onlinePct}% O`;
            }
            if (document.getElementById('insight-booking-ratio')) {
                document.getElementById('insight-booking-ratio').innerText = ratioText;
            }

            // Populate handled-by (SA) filter select list dynamically
            const saFilterSelect = document.getElementById('filter-analytic-sa');
            if (saFilterSelect) {
                const currentSaFilter = saFilterSelect.value || 'all';
                const saNames = Array.from(new Set(jobs.map(j => j.saName).filter(name => name && name.trim() !== '')));
                saFilterSelect.innerHTML = `<option value="all">All SAs</option>` + saNames.map(name => `<option value="${name}">${name}</option>`).join('');
                if (saNames.includes(currentSaFilter)) {
                    saFilterSelect.value = currentSaFilter;
                } else {
                    saFilterSelect.value = 'all';
                }
            }

            // Apply filters to populate table rows
            applyAnalyticFilters();

            // Draw Charts
            renderCharts(jobs, scope, startStr, endStr);
            lucide.createIcons();
        }

        function renderCharts(jobs, scope, startStr, endStr) {
            // Destroy existing chart instances to avoid redraw overlaps
            if (chartInstances.volTrend) chartInstances.volTrend.destroy();
            if (chartInstances.category) chartInstances.category.destroy();
            if (chartInstances.channel) chartInstances.channel.destroy();
            if (chartInstances.branchShare) chartInstances.branchShare.destroy();
            if (chartInstances.laneShare) chartInstances.laneShare.destroy();
            if (chartInstances.partsStatus) chartInstances.partsStatus.destroy();

            // --- 1. TREND CHART (Intakes vs Completions vs Carry Overs) ---
            let labels = [];
            let intakesData = [];
            let completionsData = [];
            let carryoversData = [];

            if (scope === 'daily') {
                labels = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', 'Other'];
                intakesData = [0, 0, 0, 0, 0, 0, 0];
                completionsData = [0, 0, 0, 0, 0, 0, 0];
                carryoversData = [0, 0, 0, 0, 0, 0, 0];

                jobs.forEach(j => {
                    const time = j.arrival || j.apptTime;
                    if (time) {
                        const hr = parseInt(time.split(':')[0]);
                        let idx = 6;
                        if (hr >= 8 && hr < 10) idx = 0;
                        else if (hr >= 10 && hr < 12) idx = 1;
                        else if (hr >= 12 && hr < 14) idx = 2;
                        else if (hr >= 14 && hr < 16) idx = 3;
                        else if (hr >= 16 && hr < 18) idx = 4;
                        else if (hr >= 18 && hr < 20) idx = 5;

                        intakesData[idx]++;
                        if (j.status === 'Completed' || j.status === 'Released') {
                            completionsData[idx]++;
                        }
                        if (j.status === 'Carry Over') {
                            carryoversData[idx]++;
                        }
                    } else {
                        intakesData[6]++;
                        if (j.status === 'Completed' || j.status === 'Released') {
                            completionsData[6]++;
                        }
                        if (j.status === 'Carry Over') {
                            carryoversData[6]++;
                        }
                    }
                });
            } else if (scope === 'weekly') {
                labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                intakesData = [0, 0, 0, 0, 0, 0, 0];
                completionsData = [0, 0, 0, 0, 0, 0, 0];
                carryoversData = [0, 0, 0, 0, 0, 0, 0];

                jobs.forEach(j => {
                    if (j.dateReceived) {
                        const jd = new Date(j.dateReceived);
                        let dayIdx = jd.getDay() - 1;
                        if (dayIdx === -1) dayIdx = 6; // Shift Sunday to last

                        if (dayIdx >= 0 && dayIdx < 7) {
                            intakesData[dayIdx]++;
                            if (j.status === 'Completed' || j.status === 'Released') {
                                completionsData[dayIdx]++;
                            }
                            if (j.status === 'Carry Over') {
                                carryoversData[dayIdx]++;
                            }
                        }
                    }
                });
            } else if (scope === 'monthly') {
                const daysInMonth = new Date(new Date(startStr).getFullYear(), new Date(startStr).getMonth() + 1, 0).getDate();
                labels = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
                intakesData = Array(daysInMonth).fill(0);
                completionsData = Array(daysInMonth).fill(0);
                carryoversData = Array(daysInMonth).fill(0);

                jobs.forEach(j => {
                    if (j.dateReceived) {
                        const day = parseInt(j.dateReceived.split('-')[2]);
                        if (day >= 1 && day <= daysInMonth) {
                            intakesData[day - 1]++;
                            if (j.status === 'Completed' || j.status === 'Released') {
                                completionsData[day - 1]++;
                            }
                            if (j.status === 'Carry Over') {
                                carryoversData[day - 1]++;
                            }
                        }
                    }
                });
            }

            const ctxTrend = document.getElementById('chart-volume-trend').getContext('2d');
            chartInstances.volTrend = new Chart(ctxTrend, {
                type: scope === 'monthly' ? 'line' : 'bar',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Intakes',
                            data: intakesData,
                            backgroundColor: 'rgba(220, 38, 38, 0.75)',
                            borderColor: 'rgb(220, 38, 38)',
                            borderWidth: 1.5,
                            fill: scope === 'monthly',
                            tension: 0.3
                        },
                        {
                            label: 'Completions',
                            data: completionsData,
                            backgroundColor: 'rgba(16, 185, 129, 0.75)',
                            borderColor: 'rgb(16, 185, 129)',
                            borderWidth: 1.5,
                            fill: scope === 'monthly',
                            tension: 0.3
                        },
                        {
                            label: 'Carry Overs',
                            data: carryoversData,
                            backgroundColor: 'rgba(249, 115, 22, 0.75)',
                            borderColor: 'rgb(249, 115, 22)',
                            borderWidth: 1.5,
                            fill: scope === 'monthly',
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'top', labels: { font: { weight: 'bold', size: 10 } } }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1, color: '#64748b' },
                            grid: { color: '#f1f5f9' }
                        },
                        x: {
                            ticks: { color: '#64748b', font: { size: 9 } },
                            grid: { display: false }
                        }
                    }
                }
            });

            // --- 2. CATEGORY BREAKDOWN ---
            const pms = jobs.filter(j => j.category && j.category.toUpperCase().includes('PMS')).length;
            const gr = jobs.filter(j => j.category && j.category.toUpperCase().includes('GR')).length;
            const checkups = jobs.filter(j => j.category && j.category.toUpperCase().includes('CHECK-UP')).length;
            const othersCount = jobs.length - pms - gr - checkups;

            const ctxCat = document.getElementById('chart-category-breakdown').getContext('2d');
            chartInstances.category = new Chart(ctxCat, {
                type: 'doughnut',
                data: {
                    labels: ['PMS', 'GR', 'Check-Up', 'Others'],
                    datasets: [{
                        data: [pms, gr, checkups, othersCount],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.85)',
                            'rgba(239, 68, 68, 0.85)',
                            'rgba(16, 185, 129, 0.85)',
                            'rgba(163, 163, 163, 0.85)'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } }
                    },
                    cutout: '60%'
                }
            });

            // --- 3. CHANNEL SHARE ---
            const walkin = jobs.filter(j => j.source === 'Walk-in').length;
            const online = jobs.filter(j => j.source === 'Online').length;

            const ctxChan = document.getElementById('chart-channel-breakdown').getContext('2d');
            chartInstances.channel = new Chart(ctxChan, {
                type: 'pie',
                data: {
                    labels: ['Walk-In', 'Facebook Online'],
                    datasets: [{
                        data: [walkin, online],
                        backgroundColor: [
                            'rgba(31, 41, 55, 0.85)',
                            'rgba(220, 38, 38, 0.85)'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } }
                    }
                }
            });

            // --- 4. BRANCH SHARE ---
            const branchA = jobs.filter(j => j.branch === 'Branch A').length;
            const branchB = jobs.filter(j => j.branch === 'Branch B').length;

            const ctxBranch = document.getElementById('chart-branch-share').getContext('2d');
            chartInstances.branchShare = new Chart(ctxBranch, {
                type: 'doughnut',
                data: {
                    labels: ['Branch A', 'Branch B'],
                    datasets: [{
                        data: [branchA, branchB],
                        backgroundColor: [
                            'rgba(220, 38, 38, 0.85)',
                            'rgba(71, 85, 105, 0.85)'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } }
                    },
                    cutout: '60%'
                }
            });

            // --- 5. LANE SHARE ---
            const flexLane = jobs.filter(j => j.laneType === 'Flexible').length;
            const expressLane = jobs.filter(j => j.laneType === 'Express Lane').length;
            const specialLane = jobs.filter(j => j.laneType === 'Special Lane').length;

            const ctxLane = document.getElementById('chart-lane-share').getContext('2d');
            chartInstances.laneShare = new Chart(ctxLane, {
                type: 'pie',
                data: {
                    labels: ['Flexible', 'Express Lane', 'Special Lane'],
                    datasets: [{
                        data: [flexLane, expressLane, specialLane],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.85)',
                            'rgba(16, 185, 129, 0.85)',
                            'rgba(249, 115, 22, 0.85)'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } }
                    }
                }
            });

            // --- 6. PARTS STATUS ---
            const partsYes = jobs.filter(j => j.partsAvailable === 'Yes').length;
            const partsNo = jobs.filter(j => j.partsAvailable === 'No').length;
            const partsPending = jobs.filter(j => j.partsAvailable === 'Pending').length;

            const ctxParts = document.getElementById('chart-parts-status').getContext('2d');
            chartInstances.partsStatus = new Chart(ctxParts, {
                type: 'doughnut',
                data: {
                    labels: ['Available', 'Not Available', 'Pending'],
                    datasets: [{
                        data: [partsYes, partsNo, partsPending],
                        backgroundColor: [
                            'rgba(16, 185, 129, 0.85)',
                            'rgba(239, 68, 68, 0.85)',
                            'rgba(245, 158, 11, 0.85)'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { font: { weight: 'bold', size: 10 } } }
                    },
                    cutout: '60%'
                }
            });

        }

        function exportData(format) {
            if (currentDashboardTab === 'analytics') {
                if (format === 'PDF') {
                    exportAnalyticsPDF();
                } else if (format === 'Word') {
                    exportAnalyticsWord();
                }
            } else {
                if (format === 'PDF') {
                    exportPDF();
                } else if (format === 'Word') {
                    exportWord();
                }
            }
        }

        function downloadBlob(blob, filename) {
            try {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                }, 100);
            } catch (err) {
                console.error('Error initiating download:', err);
                showSystemToast('Failed to download report.', 'error', 'Export Failed');
            }
        }

        function exportPDF() {
            showSystemToast('Consolidating data for PDF export...', 'info', 'Management Module');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const todayStr = new Date().toISOString().split('T')[0];

            // Draw header bar (Red theme)
            doc.setFillColor(220, 38, 38);
            doc.rect(0, 0, 210, 8, 'F');

            // Header Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(17, 24, 39);
            doc.text('HONTECH AUTOCENTER INC.', 14, 20);

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text('OPERATIONS & QUEUE REPORT', 14, 26);

            // Meta Details
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(`Date Generated: ${today} at ${time}`, 14, 34);
            doc.text(`Generated By: ${currentUserName || 'System Admin'} (Role: ${currentUserRole})`, 14, 39);

            // Divider Line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 44, 196, 44);

            // Metrics Summary Section
            const todayJobs = allJobs.filter(j => j.dateReceived === todayStr);
            const intakeCount = todayJobs.length;
            const releasedCount = allJobs.filter(j => (j.status === 'Released' || j.status === 'Completed') && j.dateReceived === todayStr).length;
            const carryoverCount = allJobs.filter(j => j.status === 'Carry Over').length;
            const inbayCount = allJobs.filter(j => j.location && j.location.startsWith('Lift')).length;

            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('OPERATIONAL METRICS SUMMARY', 14, 52);

            // Metric boxes represented as a plain table
            doc.autoTable({
                startY: 55,
                head: [['Total Daily Intakes', 'Released Today', 'Active on Lifts', 'Active Carry-Overs']],
                body: [[intakeCount, releasedCount, inbayCount, carryoverCount]],
                theme: 'plain',
                styles: { fontSize: 10, halign: 'center', cellPadding: 4, fontStyle: 'bold' },
                headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'center' }
            });

            let nextY = doc.autoTable.previous.finalY + 10;

            // Section: Active Workshop Queue
            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('ACTIVE WORKSHOP QUEUE', 14, nextY);

            const activeJobs = allJobs.filter(j => j.status !== 'Pending' && j.status !== 'Carry Over' && j.status !== 'Completed');

            doc.autoTable({
                startY: nextY + 3,
                head: [['Claim Stub', 'Plate No.', 'Vehicle Model', 'Arrival', 'Departure', 'Status', 'Remarks']],
                body: activeJobs.map(job => [
                    job.claimStub || 'N/A',
                    job.plate || '',
                    job.vehicle || '',
                    formatTime12Hour(job.arrival),
                    formatTime12Hour(job.departure),
                    job.status || '',
                    job.remarks || ''
                ]),
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
                styles: { fontSize: 8.5, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 25 },
                    1: { cellWidth: 20, fontStyle: 'bold' },
                    2: { cellWidth: 35 },
                    3: { cellWidth: 15 },
                    4: { cellWidth: 15 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 50 }
                }
            });

            nextY = doc.autoTable.previous.finalY + 10;

            // Prevent page overflow check for section title
            if (nextY > 260) {
                doc.addPage();
                nextY = 20;
            }

            // Section: Carry Over
            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('CARRY-OVER VEHICLES', 14, nextY);

            const carryOverJobs = allJobs.filter(j => j.status === 'Carry Over');

            doc.autoTable({
                startY: nextY + 3,
                head: [['Plate No.', 'Vehicle Model', 'Date Recv', 'Promised', 'Parts', 'Advisor', 'Remarks']],
                body: carryOverJobs.map(job => [
                    job.plate || '',
                    job.vehicle || '',
                    job.dateReceived || '',
                    job.promisedDate || 'TBD',
                    job.partsAvailable || '',
                    job.saName || '-',
                    job.remarks || ''
                ]),
                theme: 'striped',
                headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] }, // Orange theme for carryover
                styles: { fontSize: 8.5, cellPadding: 3 }
            });

            // Footer info
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('HonTech AutoCenter Operations System | Capstone Project', 14, 287);
                doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
            }

            const pdfBlob = doc.output('blob');
            downloadBlob(pdfBlob, `Hontech_Operations_Report_${todayStr}.pdf`);
            showSystemToast('Hontech_Report.pdf successfully generated.', 'success', 'Export Complete');
        }

        function exportWord() {
            showSystemToast('Consolidating data for Word export...', 'info', 'Management Module');

            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const todayStr = new Date().toISOString().split('T')[0];

            // Prepare metrics
            const todayJobs = allJobs.filter(j => j.dateReceived === todayStr);
            const intakeCount = todayJobs.length;
            const releasedCount = allJobs.filter(j => (j.status === 'Released' || j.status === 'Completed') && j.dateReceived === todayStr).length;
            const carryoverCount = allJobs.filter(j => j.status === 'Carry Over').length;
            const inbayCount = allJobs.filter(j => j.location && j.location.startsWith('Lift')).length;

            const activeJobs = allJobs.filter(j => j.status !== 'Pending' && j.status !== 'Carry Over' && j.status !== 'Completed');
            const carryOverJobs = allJobs.filter(j => j.status === 'Carry Over');

            let htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <title>HonTech Operations Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; line-height: 1.4; }
                        h1 { color: #dc2626; font-size: 20pt; font-weight: bold; border-bottom: 2px solid #dc2626; padding-bottom: 5px; }
                        h2 { color: #111827; font-size: 14pt; margin-top: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
                        .meta-table, .data-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
                        .meta-table td { border: none; padding: 4px; font-size: 10pt; }
                        .data-table th, .data-table td { border: 1px solid #d1d5db; padding: 8px; font-size: 9.5pt; text-align: left; }
                        .data-table th { background-color: #f3f4f6; font-weight: bold; color: #111827; }
                        .metric-box { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; margin-bottom: 15px; border-radius: 8px; }
                        .footer { margin-top: 40px; font-size: 8pt; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>HONTECH AUTOCENTER INC. - OPERATIONS REPORT</h1>
                    
                    <table class="meta-table">
                        <tr>
                            <td><strong>Date Generated:</strong> ${today}</td>
                            <td><strong>Time Generated:</strong> ${time}</td>
                        </tr>
                        <tr>
                            <td><strong>Report Type:</strong> Daily System Log</td>
                            <td><strong>Authorized User:</strong> ${currentUserName || 'System Admin'}</td>
                        </tr>
                    </table>

                    <h2>OPERATIONAL METRICS (SUMMARY)</h2>
                    <div class="metric-box">
                        <table style="width: 100%; border: none;">
                            <tr>
                                <td><strong>Total Daily Intake:</strong> ${intakeCount}</td>
                                <td><strong>Released Today:</strong> ${releasedCount}</td>
                                <td><strong>Active in Bays:</strong> ${inbayCount}</td>
                                <td><strong>Carry-Over Vehicles:</strong> ${carryoverCount}</td>
                            </tr>
                        </table>
                    </div>

                    <h2>ACTIVE INTAKES & WORKSHOP QUEUE</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Claim Stub</th>
                                <th>Plate No.</th>
                                <th>Vehicle Model</th>
                                <th>Arrival</th>
                                <th>Departure</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${activeJobs.map(job => `
                                <tr>
                                    <td>${job.claimStub || 'N/A'}</td>
                                    <td><strong>${job.plate}</strong></td>
                                    <td>${job.vehicle}</td>
                                    <td>${formatTime12Hour(job.arrival)}</td>
                                    <td>${formatTime12Hour(job.departure)}</td>
                                    <td>${job.category}</td>
                                    <td>${job.status}</td>
                                    <td>${job.remarks || ''}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="8" style="text-align: center; color: #999;">No active jobs in the queue.</td></tr>'}
                        </tbody>
                    </table>

                    <h2>CARRY-OVER VEHICLES</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Plate No.</th>
                                <th>Vehicle Model</th>
                                <th>Date Received</th>
                                <th>Promised Date</th>
                                <th>Parts Status</th>
                                <th>Service Advisor</th>
                                <th>Evaluation</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${carryOverJobs.map(job => `
                                <tr>
                                    <td><strong>${job.plate}</strong></td>
                                    <td>${job.vehicle}</td>
                                    <td>${job.dateReceived}</td>
                                    <td>${job.promisedDate || 'TBD'}</td>
                                    <td>${job.partsAvailable}</td>
                                    <td>${job.saName || '-'}</td>
                                    <td>${job.evaluation || '-'}</td>
                                    <td>${job.remarks || ''}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="8" style="text-align: center; color: #999;">No carry-over vehicles.</td></tr>'}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>© 2026 HonTech AutoCenter Inc. Operations Report. All rights reserved.</p>
                        <p>STI College Marikina | BSIT Capstone System</p>
                    </div>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
            downloadBlob(blob, `Hontech_Operations_Report_${todayStr}.doc`);
            showSystemToast('Hontech_Report.doc successfully generated.', 'success', 'Export Complete');
        }

        function exportAnalyticsPDF() {
            if (!analyticsJobs || analyticsJobs.length === 0) {
                return showSystemToast('No analytics records found to export.', 'error', 'Export Failed');
            }
            showSystemToast('Consolidating data for analytics PDF export...', 'info', 'Management Module');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const scope = document.getElementById('analytics-scope').value;
            const periodText = document.getElementById('analytics-period-label').innerText.replace('Period: ', '');

            // Calculate metrics
            const total = analyticsJobs.length;
            const completed = analyticsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const carryover = analyticsJobs.filter(j => j.status === 'Carry Over').length;
            const pms = analyticsJobs.filter(j => j.category === 'PMS').length;
            const gr = analyticsJobs.filter(j => j.category === 'GR').length;
            const checkups = analyticsJobs.filter(j => j.category === 'Check-Up').length;
            const walkin = analyticsJobs.filter(j => j.source === 'Walk-in').length;
            const online = analyticsJobs.filter(j => j.source === 'Online').length;
            const completionRate = total > 0 ? Math.round((completed / total) * 105) : 0;
            const normalizedRate = completionRate > 100 ? 100 : completionRate;

            const timedJobs = analyticsJobs.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.arrival && j.departure);
            let totalMinutes = 0;
            let countTimed = 0;
            timedJobs.forEach(j => {
                const arrMin = parseTimeToMinutes(j.arrival);
                const depMin = parseTimeToMinutes(j.departure);
                if (arrMin !== null && depMin !== null) {
                    let diff = depMin - arrMin;
                    if (diff < 0) diff += 24 * 60;
                    totalMinutes += diff;
                    countTimed++;
                }
            });
            const avgMinutes = countTimed > 0 ? Math.round(totalMinutes / countTimed) : 0;
            const durationText = countTimed > 0 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : 'N/A';

            // Draw header bar (Red theme)
            doc.setFillColor(220, 38, 38);
            doc.rect(0, 0, 210, 8, 'F');

            // Header Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(18);
            doc.setTextColor(17, 24, 39);
            doc.text('HONTECH AUTOCENTER INC.', 14, 20);

            doc.setFontSize(12);
            doc.setTextColor(100, 116, 139);
            doc.text(`${scope.toUpperCase()} ANALYTICS & OPERATIONS REPORT`, 14, 26);

            // Meta Details
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(`Report Period: ${periodText}`, 14, 34);
            doc.text(`Generated By: ${currentUserName || 'System Admin'} | Date: ${today} at ${time}`, 14, 39);

            // Divider Line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 43, 196, 43);

            // Period Summary Table
            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('OPERATIONAL PERIOD METRICS', 14, 50);

            doc.autoTable({
                startY: 53,
                head: [['Total Period Intakes', 'Services Completed', 'Carry-Overs Recorded', 'Avg Service Time', 'Completion Rate']],
                body: [[total, completed, carryover, durationText, `${normalizedRate}%`]],
                theme: 'plain',
                styles: { fontSize: 9.5, halign: 'center', cellPadding: 3.5, fontStyle: 'bold' },
                headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'center' }
            });

            let nextY = doc.autoTable.previous.finalY + 8;

            // Service Types & Channels distribution grid
            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('SERVICE SEGMENTATION BREAKDOWN', 14, nextY);

            doc.autoTable({
                startY: nextY + 3,
                head: [['Preventive Maint (PMS)', 'General Repairs (GR)', 'Complimentary Check-Ups', 'Walk-Ins Service', 'Online Messenger Bookings']],
                body: [[pms, gr, checkups, walkin, online]],
                theme: 'plain',
                styles: { fontSize: 9.5, halign: 'center', cellPadding: 3.5, fontStyle: 'bold' },
                headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', halign: 'center' }
            });

            // PAGE 2: VISUAL CHARTS & GRAPHS
            doc.addPage();
            
            // Header bar on page 2
            doc.setFillColor(220, 38, 38);
            doc.rect(0, 0, 210, 8, 'F');
            
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(17, 24, 39);
            doc.text('VISUAL ANALYTICS & CHARTS', 14, 20);
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.text(`Report Period: ${periodText}`, 14, 25);
            
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 28, 196, 28);
            
            let chartY = 35;
            
            const volumeCanvas = document.getElementById('chart-volume-trend');
            if (volumeCanvas) {
                try {
                    const volumeImg = volumeCanvas.toDataURL('image/png');
                    doc.setFontSize(10);
                    doc.setTextColor(71, 85, 105);
                    doc.text('1. Job Volume Trend (Intakes vs Completions)', 14, chartY);
                    doc.addImage(volumeImg, 'PNG', 14, chartY + 3, 180, 50);
                    chartY += 60;
                } catch (e) {
                    console.error('Error adding Volume Trend Chart to PDF:', e);
                }
            }
            
            const categoryCanvas = document.getElementById('chart-category-breakdown');
            if (categoryCanvas) {
                try {
                    const categoryImg = categoryCanvas.toDataURL('image/png');
                    doc.setFontSize(10);
                    doc.setTextColor(71, 85, 105);
                    doc.text('2. Service Category Breakdown', 14, chartY);
                    doc.addImage(categoryImg, 'PNG', 14, chartY + 3, 85, 50);
                } catch (e) {
                    console.error('Error adding Category Breakdown Chart to PDF:', e);
                }
            }
            
            const channelCanvas = document.getElementById('chart-channel-breakdown');
            if (channelCanvas) {
                try {
                    const channelImg = channelCanvas.toDataURL('image/png');
                    doc.setFontSize(10);
                    doc.setTextColor(71, 85, 105);
                    doc.text('3. Booking Channel Breakdown', 110, chartY);
                    doc.addImage(channelImg, 'PNG', 110, chartY + 3, 85, 50);
                } catch (e) {
                    console.error('Error adding Channel Breakdown Chart to PDF:', e);
                }
            }

            // PAGE 3+: Detailed Records Log
            doc.addPage();
            
            // Header bar on page 3
            doc.setFillColor(220, 38, 38);
            doc.rect(0, 0, 210, 8, 'F');
            
            nextY = 20;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('RECORD LOG LIST', 14, nextY);

            doc.autoTable({
                startY: nextY + 3,
                head: [['Date', 'Claim Stub', 'Plate No.', 'Vehicle Model', 'Category', 'Source', 'Status', 'Arrival/Departure']],
                body: analyticsJobs.map(job => [
                    job.dateReceived || '',
                    job.claimStub || 'N/A',
                    job.plate || '',
                    job.vehicle || '',
                    job.category || '',
                    job.source || '',
                    job.status || '',
                    `${formatTime12Hour(job.arrival)} / ${formatTime12Hour(job.departure)}`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
                styles: { fontSize: 8, cellPadding: 2.5 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 22 },
                    2: { cellWidth: 18, fontStyle: 'bold' },
                    3: { cellWidth: 35 },
                    4: { cellWidth: 15 },
                    5: { cellWidth: 15 },
                    6: { cellWidth: 20 },
                    7: { cellWidth: 35 }
                }
            });

            // Footer info
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(148, 163, 184);
                doc.text('HonTech AutoCenter Operations System | STI College Marikina Capstone', 14, 287);
                doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
            }

            const pdfBlob = doc.output('blob');
            downloadBlob(pdfBlob, `Hontech_${scope}_Report_${periodText.replace(/ /g, '_')}.pdf`);
            showSystemToast('PDF successfully generated.', 'success', 'Export Complete');
        }

        function exportAnalyticsWord() {
            if (!analyticsJobs || analyticsJobs.length === 0) {
                return showSystemToast('No analytics records found to export.', 'error', 'Export Failed');
            }
            showSystemToast('Consolidating data for analytics Word export...', 'info', 'Management Module');

            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const scope = document.getElementById('analytics-scope').value;
            const periodText = document.getElementById('analytics-period-label').innerText.replace('Period: ', '');

            // Calculate metrics
            const total = analyticsJobs.length;
            const completed = analyticsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const carryover = analyticsJobs.filter(j => j.status === 'Carry Over').length;
            const pms = analyticsJobs.filter(j => j.category === 'PMS').length;
            const gr = analyticsJobs.filter(j => j.category === 'GR').length;
            const checkups = analyticsJobs.filter(j => j.category === 'Check-Up').length;
            const walkin = analyticsJobs.filter(j => j.source === 'Walk-in').length;
            const online = analyticsJobs.filter(j => j.source === 'Online').length;
            const completionRate = total > 0 ? Math.round((completed / total) * 105) : 0;
            const normalizedRate = completionRate > 100 ? 100 : completionRate;

            const timedJobs = analyticsJobs.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.arrival && j.departure);
            let totalMinutes = 0;
            let countTimed = 0;
            timedJobs.forEach(j => {
                const arrMin = parseTimeToMinutes(j.arrival);
                const depMin = parseTimeToMinutes(j.departure);
                if (arrMin !== null && depMin !== null) {
                    let diff = depMin - arrMin;
                    if (diff < 0) diff += 24 * 60;
                    totalMinutes += diff;
                    countTimed++;
                }
            });
            const avgMinutes = countTimed > 0 ? Math.round(totalMinutes / countTimed) : 0;
            const durationText = countTimed > 0 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : 'N/A';

            // Get charts base64 image strings to embed directly in Word HTML
            let volumeImgHtml = '';
            let categoryImgHtml = '';
            let channelImgHtml = '';
            
            const volumeCanvas = document.getElementById('chart-volume-trend');
            if (volumeCanvas) {
                try {
                    volumeImgHtml = `<img src="${volumeCanvas.toDataURL('image/png')}" width="650" height="220" style="display:block; margin: 15px auto; max-width: 100%; border: 1px solid #e5e7eb;" />`;
                } catch(e) { console.error(e); }
            }
            const categoryCanvas = document.getElementById('chart-category-breakdown');
            if (categoryCanvas) {
                try {
                    categoryImgHtml = `<img src="${categoryCanvas.toDataURL('image/png')}" width="280" height="200" style="display:block; margin: 10px auto; max-width: 100%; border: 1px solid #e5e7eb;" />`;
                } catch(e) { console.error(e); }
            }
            const channelCanvas = document.getElementById('chart-channel-breakdown');
            if (channelCanvas) {
                try {
                    channelImgHtml = `<img src="${channelCanvas.toDataURL('image/png')}" width="280" height="200" style="display:block; margin: 10px auto; max-width: 100%; border: 1px solid #e5e7eb;" />`;
                } catch(e) { console.error(e); }
            }

            let htmlContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head>
                    <title>HonTech Operations Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; color: #333; line-height: 1.4; }
                        h1 { color: #dc2626; font-size: 20pt; font-weight: bold; border-bottom: 2px solid #dc2626; padding-bottom: 5px; margin-bottom: 5px; }
                        h2 { color: #111827; font-size: 13pt; font-weight: bold; margin-top: 15px; margin-bottom: 5px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px; }
                        .meta-table, .data-table, .metric-table { border-collapse: collapse; width: 100%; margin-top: 10px; }
                        .meta-table td { border: none; padding: 4px; font-size: 9.5pt; }
                        .metric-table th, .metric-table td { border: 1px solid #e5e7eb; padding: 8px; font-size: 10pt; text-align: center; }
                        .metric-table th { background-color: #f9fafb; font-weight: bold; color: #4b5563; }
                        .data-table th, .data-table td { border: 1px solid #d1d5db; padding: 8px; font-size: 9pt; text-align: left; }
                        .data-table th { background-color: #dc2626; font-weight: bold; color: #ffffff; }
                        .footer { margin-top: 40px; font-size: 8pt; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>HONTECH AUTOCENTER INC. - OPERATIONS SUMMARY</h1>
                    
                    <table class="meta-table">
                        <tr>
                            <td><strong>Report Scope:</strong> ${scope.toUpperCase()} Report</td>
                            <td><strong>Report Period:</strong> ${periodText}</td>
                        </tr>
                        <tr>
                            <td><strong>Date Generated:</strong> ${today} at ${time}</td>
                            <td><strong>Generated By:</strong> ${currentUserName || 'System Admin'} (Role: ${currentUserRole})</td>
                        </tr>
                    </table>
 
                    <h2>OPERATIONAL METRICS SUMMARY</h2>
                    <table class="metric-table">
                        <thead>
                            <tr>
                                <th>Total Intakes</th>
                                <th>Services Completed</th>
                                <th>Active Carry-Overs</th>
                                <th>Avg Completion Time</th>
                                <th>Completion Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>${total}</strong></td>
                                <td><strong>${completed}</strong></td>
                                <td><strong>${carryover}</strong></td>
                                <td><strong>${durationText}</strong></td>
                                <td><strong>${normalizedRate}%</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <h2>SERVICE SEGMENTATION</h2>
                    <table class="metric-table">
                        <thead>
                            <tr>
                                <th>Preventive Maintenance (PMS)</th>
                                <th>General Repairs (GR)</th>
                                <th>Complimentary Check-Ups</th>
                                <th>Walk-In Channel</th>
                                <th>Online Booking Channel</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${pms}</td>
                                <td>${gr}</td>
                                <td>${checkups}</td>
                                <td>${walkin}</td>
                                <td>${online}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h2>VISUAL ANALYTICS & CHARTS</h2>
                    <div style="margin-top:15px; margin-bottom: 20px;">
                        <h3 style="font-size: 11pt; color: #4b5563; font-weight:bold; margin-bottom:5px;">1. Job Volume Trend (Intakes vs Completions)</h3>
                        ${volumeImgHtml}
                    </div>
                    <table style="width: 100%; border: none; border-collapse:collapse; margin-top:15px; margin-bottom: 20px;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; border: none; padding-right:10px;">
                                <h3 style="font-size: 11pt; color: #4b5563; font-weight:bold; margin-bottom:5px;">2. Service Category Breakdown</h3>
                                ${categoryImgHtml}
                            </td>
                            <td style="width: 50%; vertical-align: top; border: none; padding-left:10px;">
                                <h3 style="font-size: 11pt; color: #4b5563; font-weight:bold; margin-bottom:5px;">3. Booking Channel Breakdown</h3>
                                ${channelImgHtml}
                            </td>
                        </tr>
                    </table>

                    <h2>RECORD LOG DATA (${total} entries)</h2>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Date Recv</th>
                                <th>Claim Stub</th>
                                <th>Plate No.</th>
                                <th>Vehicle Model</th>
                                <th>Category</th>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Arrival/Departure</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${analyticsJobs.map(job => `
                                <tr>
                                    <td>${job.dateReceived || ''}</td>
                                    <td>${job.claimStub || 'N/A'}</td>
                                    <td><strong>${job.plate}</strong></td>
                                    <td>${job.vehicle}</td>
                                    <td>${job.category}</td>
                                    <td>${job.source}</td>
                                    <td>${job.status}</td>
                                    <td>${formatTime12Hour(job.arrival)} / ${formatTime12Hour(job.departure)}</td>
                                    <td>${job.remarks || ''}</td>
                                </tr>
                            `).join('') || '<tr><td colspan="9" style="text-align: center; color: #999;">No records found for this period.</td></tr>'}
                        </tbody>
                    </table>

                    <div class="footer">
                        <p>© 2026 HonTech AutoCenter Inc. Operations Report. All rights reserved.</p>
                        <p>STI College Marikina | BSIT Capstone System</p>
                    </div>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
            downloadBlob(blob, `Hontech_${scope}_Report_${periodText.replace(/ /g, '_')}.doc`);
            showSystemToast('Word Document successfully generated.', 'success', 'Export Complete');
        }

        function showSystemToast(msg, type = 'info', title = 'System Alert') {
            const toast = document.getElementById('toast');
            document.getElementById('toast-msg').innerText = msg;
            document.getElementById('toast-title').innerText = title;

            const icon = document.getElementById('toast-icon');
            if (type === 'error') { icon.setAttribute('data-lucide', 'alert-circle'); icon.className = 'text-red-600 w-6 h-6'; toast.className = 'fixed bottom-10 right-10 bg-white border-l-4 border-red-600 text-gray-900 px-6 py-4 rounded-xl shadow-2xl transform transition-transform duration-300 z-[1000] flex items-center gap-4'; }
            else if (type === 'success') { icon.setAttribute('data-lucide', 'check-circle'); icon.className = 'text-green-600 w-6 h-6'; toast.className = 'fixed bottom-10 right-10 bg-white border-l-4 border-green-600 text-gray-900 px-6 py-4 rounded-xl shadow-2xl transform transition-transform duration-300 z-[1000] flex items-center gap-4'; }
            else { icon.setAttribute('data-lucide', 'info'); icon.className = 'text-blue-600 w-6 h-6'; toast.className = 'fixed bottom-10 right-10 bg-white border-l-4 border-blue-600 text-gray-900 px-6 py-4 rounded-xl shadow-2xl transform transition-transform duration-300 z-[1000] flex items-center gap-4'; }

            lucide.createIcons();
            toast.style.transform = 'translateX(0)';
            setTimeout(() => { toast.style.transform = 'translateX(150%)'; }, 3000);
        }

        function launchTVMode() { window.open(window.location.href.split('?')[0] + '?mode=tv', '_blank'); }

        function setupTVMode() {
            document.getElementById('auth-view').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');
            document.querySelector('header').classList.add('hidden');
            
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) sidebar.classList.add('hidden');

            const mainContent = document.getElementById('main-content');
            mainContent.classList.remove('p-4', 'md:p-6', 'p-6', 'md:p-10');
            mainContent.classList.add('p-0');
            
            const header = document.querySelector('header');
            if(header) header.classList.add('hidden');
            
            const appShell = document.getElementById('app-shell');
            if(appShell) appShell.classList.remove('layout-sidebar');

            const dashHeader = document.getElementById('dashboard-header');
            if(dashHeader) dashHeader.classList.add('hidden');
            
            showSection('tv');

            // TV synchronization via REST API polling
            setInterval(async () => {
                try {
                    await loadData();
                    renderTV();
                } catch (e) {
                    console.error('Error refreshing TV monitor:', e);
                }
            }, 2000);

            // Set slide interval to 15 seconds (15000ms) for longer display time
            tvInterval = setInterval(rotateTVSlides, 15000);
            setInterval(updateClock, 1000);
            
            // Initial weather fetch, and poll weather every 15 minutes
            updateWeather();
            setInterval(updateWeather, 900000);
            
            // Developer shortcut: Click the TV screen to manually rotate slides instantly
            document.getElementById('section-tv').addEventListener('click', (e) => {
                // Prevent click triggers from inside buttons or input fields if any
                if (e.target.closest('button, select, input, a')) return;
                rotateTVSlides();
                if (tvInterval) clearInterval(tvInterval);
                tvInterval = setInterval(rotateTVSlides, 15000);
            });
            
            loadData().then(() => renderTV());
        }

        function rotateTVSlides() {
            const slides = ['tv-slide-1', 'tv-slide-2', 'tv-slide-3'];
            const currentEl = document.getElementById(slides[tvSlideIndex]);
            if (!currentEl) return;
            currentEl.classList.remove('fade-in');
            currentEl.classList.add('fade-out');

            setTimeout(() => {
                currentEl.classList.add('hidden');
                tvSlideIndex = (tvSlideIndex + 1) % slides.length;
                const nextEl = document.getElementById(slides[tvSlideIndex]);
                if (nextEl) {
                    nextEl.classList.remove('hidden', 'fade-out');
                    nextEl.classList.add('fade-in');
                }

                [0, 1, 2].forEach(i => {
                    const dot = document.getElementById(`tv-dot-${i}`);
                    if (dot) {
                        dot.className = `w-3 h-3 rounded-full transition-all ${i === tvSlideIndex ? 'bg-red-500 scale-125' : 'bg-gray-600'}`;
                    }
                });
            }, 300);
        }

        function getServiceTheme(category) {
            const catLower = (category || '').toLowerCase();
            if (catLower.includes('pms') && (catLower.includes('grs') || catLower.includes('gr'))) {
                return {
                    border: 'border-purple-600',
                    text: 'text-purple-600',
                    bgBadge: 'bg-purple-600',
                    bgCard: 'bg-purple-50/30'
                };
            } else if (catLower.includes('pms')) {
                return {
                    border: 'border-emerald-500',
                    text: 'text-emerald-600',
                    bgBadge: 'bg-emerald-600',
                    bgCard: 'bg-emerald-50/30'
                };
            } else if (catLower.includes('grs') || catLower.includes('gr')) {
                return {
                    border: 'border-red-600',
                    text: 'text-red-600',
                    bgBadge: 'bg-red-600',
                    bgCard: 'bg-red-50/30'
                };
            } else {
                return {
                    border: 'border-blue-600',
                    text: 'text-blue-600',
                    bgBadge: 'bg-blue-600',
                    bgCard: 'bg-blue-50/30'
                };
            }
        }

        function renderTV() {
            // Group 1: Waiting Jobs (Upcoming Queue) - Monitoring AND Waiting status shows on TV waiting list
            const waitingJobs = allJobs.filter(j => j.status === 'Monitoring' || j.status === 'Waiting');
            // Group 2: Released (Ready, Ready to Release)
            const releasedAll = allJobs.filter(j => j.status === 'Ready' || j.status === 'Ready to Release');
            // Group 3: Carry Over (Carry Over)
            const carryOverAll = allJobs.filter(j => j.status === 'Carry Over');

            // Render Slide 2 Upcoming Queue List
            const tvAllUpcoming = document.getElementById('tv-all-upcoming-list');
            const tvAllUpcomingCount = document.getElementById('tv-all-upcoming-count');
            if (tvAllUpcomingCount) tvAllUpcomingCount.innerText = waitingJobs.length;
            if (tvAllUpcoming) {
                tvAllUpcoming.innerHTML = waitingJobs.map(job => {
                    const theme = getServiceTheme(job.category);
                    return `
                        <div class="bg-white border-l-4 ${theme.border} rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform duration-200">
                            <div class="flex items-center gap-3">
                                <span class="text-lg font-black uppercase italic text-gray-900 tracking-tighter">${job.plate}</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">${job.vehicle}</span>
                            </div>
                            <span class="${theme.text} font-extrabold text-[10px] uppercase tracking-widest">${job.category}</span>
                        </div>
                    `;
                }).join('') || `<div class="w-full text-center py-8 text-gray-400/80 font-black uppercase italic text-sm tracking-widest">No Upcoming Vehicles</div>`;
            }

            // Render Slide 2 Released List
            const tvAllReleased = document.getElementById('tv-all-released-list');
            const tvAllReleasedCount = document.getElementById('tv-all-released-count');
            if (tvAllReleasedCount) tvAllReleasedCount.innerText = releasedAll.length;
            if (tvAllReleased) {
                tvAllReleased.innerHTML = releasedAll.map(job => `
                    <div class="bg-white border-l-4 border-green-500 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform duration-200">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-black uppercase italic text-gray-900 tracking-tighter">${job.plate}</span>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">${job.vehicle} | <span class="text-green-600 font-extrabold">${job.category}</span></span>
                        </div>
                        <span class="bg-green-100 text-green-800 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">
                            Ready
                        </span>
                    </div>
                `).join('') || `<div class="w-full text-center py-8 text-gray-400/80 font-black uppercase italic text-sm tracking-widest">Waiting for Completed Jobs</div>`;
            }

            // Render Slide 2 Carry Over List
            const tvAllCarry = document.getElementById('tv-all-carryover-list');
            const tvAllCarryCount = document.getElementById('tv-all-carryover-count');
            if (tvAllCarryCount) tvAllCarryCount.innerText = carryOverAll.length;
            if (tvAllCarry) {
                tvAllCarry.innerHTML = carryOverAll.map(job => `
                    <div class="bg-white border-l-4 border-orange-500 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-sm hover:scale-[1.01] transition-transform duration-200">
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-black uppercase italic text-gray-900 tracking-tighter">${job.plate}</span>
                            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500">${job.vehicle} | <span class="text-orange-600 font-extrabold">${job.category}</span></span>
                        </div>
                        <span class="bg-orange-100 text-orange-800 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded">Carry Over</span>
                    </div>
                `).join('') || `<div class="w-full text-center py-8 text-gray-400/80 font-black uppercase italic text-sm tracking-widest">No Carry-Overs</div>`;
            }

            // GRS Active Bays slide (tv-slide-1) rendering (Lifts 1-4)
            const tvGRS = document.getElementById('tv-grs-list');
            if (tvGRS) {
                let liftsHTML = '';
                for (let i = 1; i <= 4; i++) {
                    const job = allJobs.find(j => j.location === `Lift ${i}`);
                    if (job) {
                        const theme = getServiceTheme(job.category);
                        liftsHTML += `
                            <div class="bg-white border-2 ${theme.border} rounded-2xl p-4 flex flex-col justify-between items-center h-40 relative shadow-md animate-fade-in">
                                <div class="flex flex-col items-center gap-1 mt-1">
                                    <span class="text-xs font-bold uppercase tracking-widest text-gray-400">LIFT-0${i}</span>
                                    <span class="${theme.bgBadge} text-white font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">IN SERVICE</span>
                                </div>
                                <span class="text-3xl font-black uppercase italic text-gray-900 tracking-tighter text-center">${job.plate}</span>
                                <span class="text-[10px] font-bold uppercase tracking-widest text-gray-500 text-center mb-1">${job.vehicle} | <span class="${theme.text}">${job.category}</span></span>
                            </div>`;
                    } else {
                        liftsHTML += `
                            <div class="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-4 flex flex-col justify-between items-center h-40 relative shadow-sm">
                                <div class="flex flex-col items-center gap-1 mt-1">
                                    <span class="text-xs font-bold uppercase tracking-widest text-gray-400">LIFT-0${i}</span>
                                    <span class="bg-gray-200 text-gray-500 font-extrabold text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">AVAILABLE</span>
                                </div>
                                <span class="text-2xl font-extrabold uppercase italic text-gray-400 tracking-wider text-center">EMPTY</span>
                                <div class="h-4"></div>
                            </div>`;
                    }
                }
                tvGRS.innerHTML = liftsHTML;
            }
            // Slide 3: Lane Monitoring lists (Express, Flexible, Specialty)
            const activeLaneJobs = allJobs.filter(j => (j.status === 'Monitoring' || j.status === 'Waiting' || j.status === 'In Progress' || j.status === 'Ready' || j.status === 'Ready to Release' || (j.location && j.location.startsWith('Lift'))) && j.status !== 'Completed' && j.status !== 'Released');
            const renderLaneJobCard = (job) => {
                const theme = getServiceTheme(job.category);
                let statusBadge = '';
                if (job.location && job.location.startsWith('Lift')) {
                    statusBadge = `<span class="${theme.bgBadge} text-white font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">${job.location}</span>`;
                } else if (job.status === 'Ready' || job.status === 'Ready to Release') {
                    statusBadge = `<span class="bg-green-150 text-green-700 border border-green-200 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">READY</span>`;
                } else if (job.status === 'Waiting') {
                    statusBadge = `<span class="bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">WAITING</span>`;
                } else if (job.status === 'In Progress') {
                    statusBadge = `<span class="bg-purple-50 text-purple-700 border border-purple-200 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">IN PROGRESS</span>`;
                } else {
                    statusBadge = `<span class="bg-blue-50 text-blue-700 border border-blue-100 font-extrabold text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full">MONITORING</span>`;
                }
                return `
                    <div class="bg-white border-l-4 ${theme.border} rounded-xl p-3 flex flex-col gap-2 shadow-sm hover:scale-[1.01] transition-transform duration-200 text-left">
                        <div class="flex items-center justify-between">
                            <span class="text-base font-black uppercase italic text-gray-900 tracking-tighter">${job.plate}</span>
                            ${statusBadge}
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            <span>${job.vehicle}</span>
                            <span class="${theme.text}">${job.category}</span>
                        </div>
                    </div>
                `;
            };

            const expressList = document.getElementById('tv-express-lane-list');
            const flexibleList = document.getElementById('tv-flexible-lane-list');
            const specialList = document.getElementById('tv-special-lane-list');
            if (expressList) {
                expressList.innerHTML = activeLaneJobs.filter(j => j.laneType === 'Express Lane').map(renderLaneJobCard).join('') || `<div class="text-center py-6 text-gray-400 font-semibold text-xs italic">No Vehicles</div>`;
            }
            if (flexibleList) {
                flexibleList.innerHTML = activeLaneJobs.filter(j => j.laneType === 'Flexible' || !j.laneType).map(renderLaneJobCard).join('') || `<div class="text-center py-6 text-gray-400 font-semibold text-xs italic">No Vehicles</div>`;
            }
            if (specialList) {
                specialList.innerHTML = activeLaneJobs.filter(j => j.laneType === 'Special Lane').map(renderLaneJobCard).join('') || `<div class="text-center py-6 text-gray-400 font-semibold text-xs italic">No Vehicles</div>`;
            }

            lucide.createIcons();
            startTVAutoScroll();
        }

        function initTimeFormatSetting() {
            const saved = localStorage.getItem('timeFormat24h');
            if (saved === null) {
                localStorage.setItem('timeFormat24h', 'true');
            }
            const settingsSelect = document.getElementById('settings-time-format');
            if (settingsSelect) {
                settingsSelect.value = localStorage.getItem('timeFormat24h') === 'true' ? '24h' : '12h';
            }
        }

        function updateClock() {
            const now = new Date();
            const is24h = localStorage.getItem('timeFormat24h') !== 'false';
            const timeStr = now.toLocaleTimeString('en-US', { hour12: !is24h, hour: '2-digit', minute: '2-digit' });
            if (document.getElementById('sys-clock')) document.getElementById('sys-clock').innerText = timeStr;
            if (document.getElementById('tv-clock-display')) document.getElementById('tv-clock-display').innerText = timeStr;
            
            // Update Date in TV Header
            const dateDisplay = document.getElementById('tv-date-display');
            if (dateDisplay) {
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                dateDisplay.innerText = now.toLocaleDateString('en-US', options);
            }
        }

        let previousScrollHeights = {};
        async function updateWeather() {
            try {
                // Marikina, Philippines Coordinates
                const lat = 14.6507;
                const lon = 121.1029;
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
                const data = await res.json();
                
                if (data && data.current) {
                    const temp = Math.round(data.current.temperature_2m);
                    const code = data.current.weather_code;
                    
                    // Map WMO Weather Codes to text & Lucide icons
                    let weatherText = 'Clear';
                    let iconName = 'sun';
                    
                    if (code === 0) { weatherText = 'Sunny'; iconName = 'sun'; }
                    else if (code >= 1 && code <= 3) { weatherText = 'Partly Cloudy'; iconName = 'cloud-sun'; }
                    else if (code >= 45 && code <= 48) { weatherText = 'Foggy'; iconName = 'cloud-fog'; }
                    else if (code >= 51 && code <= 67) { weatherText = 'Rainy'; iconName = 'cloud-rain'; }
                    else if (code >= 80 && code <= 82) { weatherText = 'Showers'; iconName = 'cloud-drizzle'; }
                    else if (code >= 95 && code <= 99) { weatherText = 'Thunderstorm'; iconName = 'cloud-lightning'; }
                    
                    const tempEl = document.getElementById('tv-temp-display');
                    const textEl = document.getElementById('tv-weather-text');
                    const iconWrapEl = document.getElementById('tv-weather-icon-wrap');
                    
                    if (tempEl) tempEl.innerText = `${temp}°C`;
                    if (textEl) textEl.innerText = weatherText;
                    if (iconWrapEl) {
                        iconWrapEl.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5 text-amber-400"></i>`;
                        lucide.createIcons();
                    }
                }
            } catch (err) {
                console.warn('Weather fetch failed, using fallback:', err);
                const hour = new Date().getHours();
                const isDay = hour > 6 && hour < 18;
                const fallbackTemp = isDay ? 32 : 26;
                
                if (document.getElementById('tv-temp-display')) document.getElementById('tv-temp-display').innerText = `${fallbackTemp}°C`;
                if (document.getElementById('tv-weather-text')) document.getElementById('tv-weather-text').innerText = isDay ? 'Sunny' : 'Clear';
                if (document.getElementById('tv-weather-icon-wrap')) {
                    document.getElementById('tv-weather-icon-wrap').innerHTML = `<i data-lucide="${isDay ? 'sun' : 'moon'}" class="w-5 h-5 text-amber-400"></i>`;
                    lucide.createIcons();
                }
            }
        }

        function startTVAutoScroll() {
            const containers = {
                'released': document.getElementById('tv-all-released-list')?.parentElement,
                'upcoming': document.getElementById('tv-all-upcoming-list')?.parentElement,
                'carryover': document.getElementById('tv-all-carryover-list')?.parentElement
            };

            if (!window.tvScrollIntervals) {
                window.tvScrollIntervals = {};
            }

            Object.keys(containers).forEach(key => {
                const container = containers[key];
                if (!container) return;

                const currentHeight = container.scrollHeight;
                const prevHeight = previousScrollHeights[key] || 0;

                // Only re-initialize if contents height has changed to prevent scroll resets
                if (currentHeight !== prevHeight) {
                    previousScrollHeights[key] = currentHeight;

                    if (window.tvScrollIntervals[key]) {
                        clearInterval(window.tvScrollIntervals[key]);
                    }

                    const maxScroll = currentHeight - container.clientHeight;
                    if (maxScroll <= 0) {
                        container.scrollTop = 0;
                        return; // Content fits completely
                    }

                    let direction = 1; // 1 = down, -1 = up
                    let delayCycles = 0;

                    window.tvScrollIntervals[key] = setInterval(() => {
                        const maxScrollNow = container.scrollHeight - container.clientHeight;
                        if (maxScrollNow <= 0) return;

                        const atBottom = container.scrollTop >= maxScrollNow - 1;
                        const atTop = container.scrollTop === 0;

                        if ((atBottom && direction === 1) || (atTop && direction === -1)) {
                            delayCycles++;
                            if (delayCycles < 30) return; // Pause for 3 seconds (30 * 100ms)
                            
                            direction = direction === 1 ? -1 : 1;
                            delayCycles = 0;
                        }

                        if (direction === 1) {
                            container.scrollTop += 1.5; // Smooth scroll down
                        } else {
                            container.scrollTop -= 2.5; // Fast scroll back up
                        }
                    }, 100);
                }
            });
        }

        function populatePeriodicSaFilter() {
            const saFilterSelect = document.getElementById('periodic-search-sa');
            if (saFilterSelect) {
                const currentSaVal = saFilterSelect.value || 'all';
                const saNames = Array.from(new Set((allJobs || []).map(j => j.saName).filter(name => name && name.trim() !== '')));
                saFilterSelect.innerHTML = `<option value="all">All SAs</option>` + saNames.map(name => `<option value="${name}">${name}</option>`).join('');
                if (saNames.includes(currentSaVal)) {
                    saFilterSelect.value = currentSaVal;
                } else {
                    saFilterSelect.value = 'all';
                }
            }
        }

        async function loadData() {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const isTVMode = urlParams.get('mode') === 'tv';
                const isOwnerOrAdmin = currentUserRole === 'owner' || currentUserRole === 'admin';
                const jobsUrl = isTVMode ? '/api/jobs?monitor=true' : (isOwnerOrAdmin ? '/api/jobs?all=true' : '/api/jobs');
                allJobs = await apiRequest(jobsUrl);
                if (isOwnerOrAdmin) {
                    staffAccounts = await apiRequest('/api/auth/staff');
                    populatePeriodicSaFilter();
                }
            } catch (err) {
                console.error('Failed to load operational data:', err);
            }
        }

        // --- PROFILE & SECURITY PORTAL ACTIONS ---
        function togglePasswordVisibility(inputId, buttonEl) {
            const input = document.getElementById(inputId);
            if (!input) return;
            const icon = buttonEl.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.setAttribute('data-lucide', 'eye-off');
            } else {
                input.type = 'password';
                icon.setAttribute('data-lucide', 'eye');
            }
            lucide.createIcons();
        }

        async function loadUserProfile() {
            try {
                const user = await apiRequest('/api/auth/me');
                renderProfileSection(user);
            } catch (err) {
                showSystemToast('Could not load user profile details.', 'error');
            }
        }

        function renderProfileSection(user) {
            document.getElementById('profile-name-display').innerText = user.name;
            document.getElementById('profile-role-display').innerText = getRoleLabel(user.role);
            document.getElementById('profile-email-display').innerText = user.email;

            // Backup Recovery Email display
            const backupEmail = user.backupEmail || '';
            const backupEmailDisp = document.getElementById('backup-email-display');
            if (backupEmail) {
                backupEmailDisp.innerText = backupEmail;
                backupEmailDisp.className = 'font-bold text-gray-700 font-mono text-sm';
            } else {
                backupEmailDisp.innerText = 'Not Configured';
                backupEmailDisp.className = 'text-sm text-gray-400 font-semibold italic';
            }

            // Google account linking display
            const googleStatus = document.getElementById('google-link-status');
            const googleBtnContainer = document.getElementById('google-link-btn-container');
            if (user.googleLinked) {
                googleStatus.innerText = `Linked to: ${user.googleEmail || 'Google Account'}`;
                googleStatus.className = 'font-bold text-green-600 text-sm font-mono';
                googleBtnContainer.innerHTML = `<button onclick="unlinkGoogleAccount()" class="text-xs font-black uppercase tracking-wider text-gray-500 hover:text-red-600 bg-gray-50 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-gray-200 transition shadow-sm">Unlink Google</button>`;
            } else {
                googleStatus.innerText = 'Not Linked';
                googleStatus.className = 'text-sm text-gray-400 font-semibold italic';
                googleBtnContainer.innerHTML = `<button onclick="triggerGoogleLink()" class="text-xs font-black uppercase tracking-wider text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition shadow-sm">Link Google</button>`;
            }

            // MFA display
            const mfaStatus = document.getElementById('mfa-status-display');
            const mfaBtnContainer = document.getElementById('mfa-toggle-btn-container');
            const mfaPanel = document.getElementById('mfa-config-panel');
            const mfaBackupPanel = document.getElementById('mfa-backup-codes-panel');

            if (user.mfaEnabled) {
                mfaStatus.innerText = 'Enabled';
                mfaStatus.className = 'font-extrabold text-green-600 text-sm';
                mfaBtnContainer.innerHTML = `<button onclick="triggerMfaDisable()" class="text-xs font-black uppercase tracking-wider text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition shadow-sm">Disable MFA</button>`;
                mfaPanel.classList.add('hidden');
            } else {
                mfaStatus.innerText = 'Disabled';
                mfaStatus.className = 'font-extrabold text-red-600 text-sm';
                mfaBtnContainer.innerHTML = `<button onclick="initiateMfaSetup()" class="text-xs font-black uppercase tracking-wider text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg border border-green-200 transition shadow-sm">Setup MFA</button>`;
                mfaBackupPanel.classList.add('hidden');
            }

            lucide.createIcons();
        }

        // --- PASSWORD CHANGE FLOW ---
        async function submitPasswordChange() {
            const currentPassword = document.getElementById('change-pwd-current').value;
            const newPassword = document.getElementById('change-pwd-new').value;
            const confirmPassword = document.getElementById('change-pwd-confirm').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                return showSystemToast('All fields are required to update your password.', 'error', 'Validation Failed');
            }
            if (newPassword !== confirmPassword) {
                return showSystemToast('New passwords do not match.', 'error', 'Validation Failed');
            }

            try {
                const res = await apiRequest('/api/auth/profile/password', {
                    method: 'PUT',
                    body: { currentPassword, newPassword }
                });
                showSystemToast(res.message, 'success', 'Password Updated');
                document.getElementById('change-pwd-current').value = '';
                document.getElementById('change-pwd-new').value = '';
                document.getElementById('change-pwd-confirm').value = '';
            } catch (err) {
                showSystemToast(err.message || 'Failed to update password.', 'error');
            }
        }

        // --- EMAIL CHANGE FLOW ---
        function openEmailChangeModal() {
            document.getElementById('email-change-modal').classList.remove('hidden');
            document.getElementById('email-change-step-1').classList.remove('hidden');
            document.getElementById('email-change-step-2').classList.add('hidden');
            document.getElementById('email-change-new').value = '';
            document.getElementById('email-change-pass').value = '';
            document.getElementById('email-change-otp').value = '';
            lucide.createIcons();
        }

        function closeEmailChangeModal() {
            document.getElementById('email-change-modal').classList.add('hidden');
        }

        async function requestEmailChangeSubmit() {
            const newEmail = document.getElementById('email-change-new').value;
            const password = document.getElementById('email-change-pass').value;

            if (!newEmail || !password) {
                return showSystemToast('New email and password are required.', 'error', 'Validation Failed');
            }

            try {
                const res = await apiRequest('/api/auth/profile/email-change/request', {
                    method: 'POST',
                    body: { password, newEmail }
                });

                showSystemToast(res.message, 'success', 'Verification OTP Sent');
                if (res.token) {
                    document.getElementById('email-change-otp').value = res.token;
                }
                document.getElementById('email-change-step-1').classList.add('hidden');
                document.getElementById('email-change-step-2').classList.remove('hidden');
                lucide.createIcons();
            } catch (err) {
                showSystemToast(err.message || 'Could not verify email change.', 'error');
            }
        }

        async function submitEmailChangeVerify() {
            const otp = document.getElementById('email-change-otp').value;
            if (!otp) return showSystemToast('Verification code is required.', 'error');

            try {
                const res = await apiRequest('/api/auth/profile/email-change/verify', {
                    method: 'POST',
                    body: { otp }
                });

                showSystemToast(res.message, 'success', 'Email Updated');
                closeEmailChangeModal();
                loadUserProfile();
            } catch (err) {
                showSystemToast(err.message || 'Failed to verify new email.', 'error');
            }
        }

        // --- BACKUP EMAIL RECOVERY FLOW ---
        function openBackupEmailModal() {
            document.getElementById('backup-email-modal').classList.remove('hidden');
            document.getElementById('backup-email-step-1').classList.remove('hidden');
            document.getElementById('backup-email-step-2').classList.add('hidden');
            document.getElementById('backup-email-new').value = '';
            document.getElementById('backup-email-pass').value = '';
            document.getElementById('backup-email-otp').value = '';
            lucide.createIcons();
        }

        function closeBackupEmailModal() {
            document.getElementById('backup-email-modal').classList.add('hidden');
        }

        async function requestBackupEmailSubmit() {
            const backupEmail = document.getElementById('backup-email-new').value;
            const password = document.getElementById('backup-email-pass').value;

            if (!backupEmail || !password) {
                return showSystemToast('Backup email and password are required.', 'error', 'Validation Failed');
            }

            try {
                const res = await apiRequest('/api/auth/profile/backup-email/request', {
                    method: 'POST',
                    body: { password, backupEmail }
                });

                showSystemToast(res.message, 'success', 'Verification OTP Sent');
                if (res.token) {
                    document.getElementById('backup-email-otp').value = res.token;
                }
                document.getElementById('backup-email-step-1').classList.add('hidden');
                document.getElementById('backup-email-step-2').classList.remove('hidden');
                lucide.createIcons();
            } catch (err) {
                showSystemToast(err.message || 'Could not request backup email.', 'error');
            }
        }

        async function submitBackupEmailVerify() {
            const backupEmail = document.getElementById('backup-email-new').value;
            const otp = document.getElementById('backup-email-otp').value;
            if (!otp || !backupEmail) return showSystemToast('Verification code is required.', 'error');

            try {
                const res = await apiRequest('/api/auth/profile/backup-email/verify', {
                    method: 'POST',
                    body: { otp, backupEmail }
                });

                showSystemToast(res.message, 'success', 'Backup Recovery Connected');
                closeBackupEmailModal();
                loadUserProfile();
            } catch (err) {
                showSystemToast(err.message || 'Failed to verify backup email.', 'error');
            }
        }

        // --- MFA TWO-FACTOR MANAGEMENT ---
        async function initiateMfaSetup() {
            try {
                const res = await apiRequest('/api/auth/mfa/setup', { method: 'POST' });
                document.getElementById('mfa-qr-image').src = res.qrCodeUrl;
                document.getElementById('mfa-secret-display').innerText = res.secret;
                document.getElementById('mfa-otp-input').value = '';
                document.getElementById('mfa-config-panel').classList.remove('hidden');
                lucide.createIcons();
                showSystemToast('Scan the QR code to set up MFA.', 'info', 'Authenticator Setup');
            } catch (err) {
                showSystemToast('Could not initiate MFA setup.', 'error');
            }
        }

        async function submitMfaEnable() {
            const otpCode = document.getElementById('mfa-otp-input').value;
            if (!otpCode) return showSystemToast('Verification OTP code is required.', 'error');

            try {
                const res = await apiRequest('/api/auth/mfa/enable', {
                    method: 'POST',
                    body: { otpCode }
                });

                showSystemToast(res.message, 'success', 'MFA Secured');

                // Show backup recovery codes
                const grid = document.getElementById('backup-codes-grid');
                if (res.backupCodes && grid) {
                    grid.innerHTML = res.backupCodes.map(code => `<div class="p-1.5 border border-gray-200 rounded-lg text-center select-all bg-gray-50 font-mono hover:bg-gray-100 transition">${code}</div>`).join('');
                }
                document.getElementById('mfa-backup-codes-panel').classList.remove('hidden');
                document.getElementById('mfa-config-panel').classList.add('hidden');

                loadUserProfile();
            } catch (err) {
                showSystemToast(err.message || 'MFA validation failed.', 'error');
            }
        }

        async function triggerMfaDisable() {
            const password = prompt("To disable Multi-Factor Authentication, please enter your password for authorization:");
            if (!password) return;

            try {
                const res = await apiRequest('/api/auth/mfa/disable', {
                    method: 'POST',
                    body: { password }
                });

                showSystemToast(res.message, 'success', 'MFA Deactivated');
                loadUserProfile();
            } catch (err) {
                showSystemToast(err.message || 'Failed to disable MFA.', 'error');
            }
        }

        // --- GOOGLE OAUTH SIMULATOR & ACTIONS ---
        function triggerGoogleLogin() {
            document.getElementById('google-sim-modal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeGoogleSim() {
            document.getElementById('google-sim-modal').classList.add('hidden');
        }

        async function submitGoogleSim() {
            closeGoogleSim();
            const emailInput = document.getElementById('google-sim-custom-email');
            const email = emailInput ? emailInput.value.trim() : '';
            if (!email) return;
            try {
                const res = await apiRequest('/api/auth/google/login', {
                    method: 'POST',
                    body: { googleEmail: email }
                });

                if (res.requiresMfa) {
                    document.getElementById('login-form-container').classList.add('hidden');
                    document.getElementById('forgot-form-container').classList.add('hidden');
                    document.getElementById('mfa-form-container').classList.remove('hidden');
                    document.getElementById('mfa-user-id').value = res.userId;
                    document.getElementById('mfa-email-display').innerText = res.email;
                    document.getElementById('mfa-code-input').value = '';
                    lucide.createIcons();
                    showSystemToast('Two-Factor verification required.', 'info', 'MFA Check');
                    return;
                }

                currentUserName = res.name;
                currentUserEmail = res.email || 'user@hontech.com';
                handleLogin(res.role);
                showSystemToast('Logged in via Google Sandbox.', 'success', 'Google Authenticated');
            } catch (err) {
                showSystemToast(err.message || 'Google authentication failed.', 'error');
            }
        }

        async function triggerGoogleLink() {
            const googleEmail = prompt("Link account to Google. Please enter your Google Email:", "owner@hontech.com");
            if (!googleEmail) return;

            try {
                const res = await apiRequest('/api/auth/google/link', {
                    method: 'POST',
                    body: { googleEmail }
                });

                showSystemToast(res.message, 'success', 'Google Connected');
                loadUserProfile();
            } catch (err) {
                showSystemToast(err.message || 'Google linking failed.', 'error');
            }
        }

        async function unlinkGoogleAccount() {
            if (!confirm("Are you sure you want to unlink your Google account? You will no longer be able to log in using Google.")) return;

            try {
                const res = await apiRequest('/api/auth/google/unlink', { method: 'POST' });
                showSystemToast(res.message, 'success', 'Google Unlinked');
                loadUserProfile();
            } catch (err) {
                showSystemToast(err.message || 'Google unlinking failed.', 'error');
            }
        }

        // --- MFA TRANSITION LOGIN ---
        async function submitMfaCode() {
            const userId = document.getElementById('mfa-user-id').value;
            const code = document.getElementById('mfa-code-input').value;

            if (!code) return showSystemToast('Verification code is required.', 'error');

            try {
                const user = await apiRequest('/api/auth/verify-mfa', {
                    method: 'POST',
                    body: { userId, mfaCode: code }
                });

                currentUserName = user.name;
                currentUserEmail = user.email || 'user@hontech.com';
                handleLogin(user.role);

                // Reset Login Form views
                document.getElementById('mfa-form-container').classList.add('hidden');
                document.getElementById('login-form-container').classList.remove('hidden');
                document.getElementById('mfa-code-input').value = '';

                showSystemToast('MFA Code verified. Logged in.', 'success', 'Access Granted');
            } catch (err) {
                showSystemToast(err.message || 'Verification code is invalid or expired.', 'error', 'MFA Failed');
            }
        }

        function cancelMfa() {
            document.getElementById('mfa-form-container').classList.add('hidden');
            document.getElementById('login-form-container').classList.remove('hidden');
            document.getElementById('mfa-code-input').value = '';
            lucide.createIcons();
        }

        // --- STAFF MANAGEMENT UPGRADES (OWNER CONTROLS) ---
        function openStaffPasswordReset(id, name) {
            document.getElementById('staff-pwd-id').value = id;
            document.getElementById('staff-pwd-name').innerText = `Reset Password for: ${name}`;
            document.getElementById('staff-pwd-input').value = '';
            document.getElementById('staff-pwd-modal').classList.remove('hidden');
            lucide.createIcons();
        }

        function closeStaffPasswordReset() {
            document.getElementById('staff-pwd-modal').classList.add('hidden');
        }

        async function submitStaffPasswordReset() {
            const id = document.getElementById('staff-pwd-id').value;
            const newPassword = document.getElementById('staff-pwd-input').value;

            if (!newPassword) return showSystemToast('New password is required.', 'error', 'Validation Failed');

            try {
                const res = await apiRequest(`/api/auth/staff/${id}/reset-password`, {
                    method: 'POST',
                    body: { newPassword }
                });

                showSystemToast(res.message, 'success', 'Password Overwritten');
                closeStaffPasswordReset();
                await loadData();
                renderStaffManagement();
            } catch (err) {
                showSystemToast(err.message || 'Could not reset personnel password.', 'error');
            }
        }

        async function toggleStaffActive(id, isActive) {
            try {
                const res = await apiRequest(`/api/auth/staff/${id}/toggle-active`, {
                    method: 'PATCH',
                    body: { isActive }
                });

                showSystemToast(res.message, 'success', 'Status Changed');
                await loadData();
                renderStaffManagement();
            } catch (err) {
                showSystemToast(err.message || 'Failed to toggle account active status.', 'error');
            }
        }

        // --- DEVELOPER SANDBOX MAILBOX CLIENT LOGIC ---
        function toggleDevMailbox() {
            const modal = document.getElementById('dev-mailbox-modal');
            if (!modal) return;

            if (modal.classList.contains('hidden')) {
                modal.classList.remove('hidden');
                fetchSimulatedEmails();
                if (mailboxPollInterval) clearInterval(mailboxPollInterval);
                mailboxPollInterval = setInterval(fetchSimulatedEmails, 1500);
            } else {
                modal.classList.add('hidden');
                if (mailboxPollInterval) clearInterval(mailboxPollInterval);
                mailboxPollInterval = setInterval(fetchSimulatedEmails, 4000);
            }
        }

        async function fetchSimulatedEmails() {
            try {
                const res = await apiRequest('/api/auth/developer/emails');
                devEmails = res || [];

                devEmails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                const unreadCount = devEmails.filter(e => !e.read).length;

                const badge = document.getElementById('dev-mailbox-badge');
                const sidebarBadge = document.getElementById('sidebar-inbox-count');

                if (unreadCount > 0) {
                    if (badge) {
                        badge.innerText = unreadCount;
                        badge.classList.remove('hidden');
                    }
                    if (sidebarBadge) {
                        sidebarBadge.innerText = unreadCount;
                        sidebarBadge.classList.remove('hidden');
                    }
                } else {
                    if (badge) badge.classList.add('hidden');
                    if (sidebarBadge) sidebarBadge.classList.add('hidden');
                }

                renderMailboxList();
            } catch (err) {
                console.error('Failed to sync developer mailbox:', err);
            }
        }

        function renderMailboxList() {
            const container = document.getElementById('mailbox-list-container');
            const emptyEl = document.getElementById('mailbox-list-empty');
            if (!container || !emptyEl) return;

            if (devEmails.length === 0) {
                container.innerHTML = '';
                emptyEl.classList.remove('hidden');
                return;
            }

            emptyEl.classList.add('hidden');

            container.innerHTML = devEmails.map(mail => {
                const isSelected = mail.id === selectedEmailId;
                const isUnread = !mail.read;
                const time = new Date(mail.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return `
                    <div onclick="selectEmail('${mail.id}')" class="px-5 py-4 cursor-pointer transition flex flex-col gap-1 border-b border-gray-100 ${isSelected ? 'bg-red-50/70 border-l-4 border-l-red-600' : 'hover:bg-gray-50'} ${isUnread ? 'bg-gray-50/40' : ''}">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black uppercase tracking-wider text-gray-800 ${isUnread ? 'text-red-600 font-extrabold' : 'text-gray-500 font-bold'}">${mail.to.split('@')[0]}</span>
                            <span class="text-[9px] font-bold text-gray-400 font-mono">${time}</span>
                        </div>
                        <div class="text-[11px] font-extrabold text-gray-900 truncate ${isUnread ? 'font-black' : 'font-semibold'}">${mail.subject}</div>
                        <div class="text-[10px] text-gray-500 truncate font-semibold">${mail.text || ''}</div>
                    </div>
                `;
            }).join('');
            lucide.createIcons();
        }

        async function selectEmail(id) {
            selectedEmailId = id;
            const mail = devEmails.find(e => e.id === id);
            if (!mail) return;

            if (!mail.read) {
                mail.read = true;
                try {
                    await apiRequest(`/api/auth/developer/emails/${id}/read`, { method: 'PATCH' });
                } catch (e) {
                    console.error(e);
                }
            }

            const detailHeader = document.getElementById('mailbox-detail-header');
            const placeholder = document.getElementById('mailbox-detail-placeholder');
            const iframe = document.getElementById('mail-preview-iframe');

            if (detailHeader) detailHeader.classList.remove('hidden');
            if (placeholder) placeholder.classList.add('hidden');
            if (iframe) iframe.classList.remove('hidden');

            const subjectEl = document.getElementById('mail-detail-subject');
            const toEl = document.getElementById('mail-detail-to');
            if (subjectEl) subjectEl.innerText = mail.subject;
            if (toEl) toEl.innerText = mail.to;

            if (iframe) {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                doc.open();
                doc.write(mail.html);
                doc.close();
            }

            // Check if there is a 6-digit OTP code in the email text or html
            const otpMatch = (mail.text && mail.text.match(/\b\d{6}\b/)) || (mail.html && mail.html.match(/\b\d{6}\b/));
            const copyBtn = document.getElementById('mail-copy-otp-btn');
            if (copyBtn) {
                if (otpMatch) {
                    copyBtn.classList.remove('hidden');
                } else {
                    copyBtn.classList.add('hidden');
                }
            }

            renderMailboxList();
            fetchSimulatedEmails();
        }

        async function clearMailboxHistory() {
            if (!confirm("Are you sure you want to delete all simulated emails?")) return;
            try {
                await apiRequest('/api/auth/developer/emails', { method: 'DELETE' });
                selectedEmailId = null;

                const detailHeader = document.getElementById('mailbox-detail-header');
                const placeholder = document.getElementById('mailbox-detail-placeholder');
                const iframe = document.getElementById('mail-preview-iframe');

                if (detailHeader) detailHeader.classList.add('hidden');
                if (placeholder) placeholder.classList.remove('hidden');
                if (iframe) iframe.classList.add('hidden');

                showSystemToast('Simulated mailbox history cleared.', 'success', 'Sandbox Reset');
                fetchSimulatedEmails();
            } catch (err) {
                showSystemToast('Failed to clear mailbox.', 'error');
            }
        }

        function copyOtpFromCurrentMail() {
            const mail = devEmails.find(e => e.id === selectedEmailId);
            if (!mail) return;

            const otpMatch = (mail.text && mail.text.match(/\b\d{6}\b/)) || (mail.html && mail.html.match(/\b\d{6}\b/));
            if (otpMatch) {
                navigator.clipboard.writeText(otpMatch[0]);
                showSystemToast(`OTP Code [${otpMatch[0]}] copied to clipboard!`, 'success', 'Verification Sandbox');
            } else {
                showSystemToast('No 6-digit code found in this email.', 'error');
            }
        }
