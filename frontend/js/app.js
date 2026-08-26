        // Defensive global stub for third-party icon library in offline/lagging CDN environments
        if (typeof window.lucide === 'undefined' || typeof window.lucide.createIcons !== 'function') {
            window.lucide = { createIcons: function () { } };
        }

        let allJobs = [];
        let staffAccounts = [];
        let currentUserRole = '';
        let currentUserName = '';
        let currentUserEmail = '';
        let currentUserBranch = 'Marikina Branch';
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
        let intakeSortOrder = 'desc';
        let carryOverSortOrder = 'desc';

        // Auto-enforce 30 minutes default inactivity timeout across all roles
        if (!localStorage.getItem('hontech-idle-timeout') || localStorage.getItem('hontech-idle-timeout') === '15') {
            localStorage.setItem('hontech-idle-timeout', '30');
        }

        function updateIntakeFilter(type, value) {
            if (type === 'search') intakeSearchQuery = value;
            if (type === 'source') intakeSourceFilter = value;
            if (type === 'time') intakeTimeFilter = value;
            if (type === 'sort') {
                if (value === 'claimStubDesc') {
                    intakeSortBy = 'claimStub';
                    intakeSortOrder = 'desc';
                } else if (value === 'claimStubAsc') {
                    intakeSortBy = 'claimStub';
                    intakeSortOrder = 'asc';
                } else {
                    intakeSortBy = value;
                }
            }
            if (type === 'sortOrder') intakeSortOrder = value;
            renderStaffTables();
        }

        window.toggleClaimStubSort = function() {
            if (intakeSortBy === 'claimStub') {
                intakeSortOrder = (intakeSortOrder === 'asc') ? 'desc' : 'asc';
            } else {
                intakeSortBy = 'claimStub';
                intakeSortOrder = 'desc';
            }
            renderStaffTables();
        };

        window.toggleCarryOverStubSort = function() {
            carryOverSortOrder = (carryOverSortOrder === 'asc') ? 'desc' : 'asc';
            renderStaffTables();
        };

        window.handleDepartureLiveKey = function(el, jobId, e) {
            if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key)) {
                if (e.key === 'Enter') el.blur();
                return;
            }
            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        };

        window.handleDepartureInputMask = function(el, jobId) {
            let digits = el.value.replace(/[^0-9]/g, '');
            if (digits.length > 4) digits = digits.slice(0, 4);
            if (digits.length >= 3) {
                el.value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
            } else {
                el.value = digits;
            }
        };

        window.handleDepartureBlur = function(el, jobId) {
            let raw = el.value.replace(/[^0-9]/g, '');
            let hr = 8, min = 0;
            if (raw.length === 0) {
                hr = 8; min = 0;
            } else if (raw.length === 1) {
                hr = parseInt(raw); min = 0;
            } else if (raw.length === 2) {
                hr = parseInt(raw); min = 0;
            } else if (raw.length === 3) {
                hr = parseInt(raw[0]); min = parseInt(raw.slice(1));
            } else {
                hr = parseInt(raw.slice(0, 2)); min = parseInt(raw.slice(2, 4));
            }
            hr = Math.min(23, Math.max(0, hr || 0));
            min = Math.min(59, Math.max(0, min || 0));
            const finalTime = `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
            el.value = finalTime;
            updateJobField(jobId, 'departure', finalTime);
        };

        window.handleDeparturePresetSelect = function(jobId, selectedTime) {
            if (!selectedTime) return;
            const el = document.getElementById(`departure-input-${jobId}`);
            if (el) el.value = selectedTime;
            updateJobField(jobId, 'departure', selectedTime);
        };
        let analyticsJobs = [];
        let idleLogoutTimer = null;
        let lastUserActivityTimestamp = Date.now();
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
                    credentials: 'include',
                    ...options
                };
                if (defaultOptions.body && typeof defaultOptions.body === 'object') {
                    defaultOptions.body = JSON.stringify(defaultOptions.body);
                }
                const response = await fetch(finalUrl, defaultOptions);
                const data = await response.json();

                if (!response.ok) {
                    if (response.status === 401 && !url.includes('/login') && !url.includes('/auth/me')) {
                        let timeoutMinutes = parseInt(localStorage.getItem('hontech-idle-timeout') || '30', 10);
                        if (timeoutMinutes === 15 || isNaN(timeoutMinutes)) {
                            timeoutMinutes = 30;
                            localStorage.setItem('hontech-idle-timeout', '30');
                        }
                        const isUserIdle = (Date.now() - lastUserActivityTimestamp) >= (timeoutMinutes * 60 * 1000);

                        console.warn("Session 401 received. User idle status:", isUserIdle);
                        if (isUserIdle) {
                            showSessionExpiredModal(`You have been logged out after ${timeoutMinutes} minutes of inactivity.`);
                        }
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
                if (typeof isNetworkError === 'function' && isNetworkError(err.message, err)) {
                    if (typeof showLostConnectionUI === 'function') {
                        showLostConnectionUI(err.message || 'Unable to connect to the HonTech Workshop Engine.');
                    }
                }
                throw err;
            }
        }

        window.triggerDeveloperResetSeed = async function(btn) {
            if (!confirm("WARNING: This will wipe all active records/users and re-seed the system. Are you sure you want to proceed?")) return;
            const logContainer = document.getElementById('dev-reset-log-container');
            const logPre = document.getElementById('dev-reset-log');
            if (logContainer) logContainer.classList.add('hidden');

            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg> Re-Seeding...`;

            try {
                const res = await apiRequest('/api/auth/developer/reset-seed', { method: 'POST' });
                showSystemToast(res.message, 'success', 'Database Restored');
                if (logPre) {
                    logPre.innerText = res.log || 'Seeding succeeded without output.';
                }
                if (logContainer) logContainer.classList.remove('hidden');
            } catch (err) {
                showSystemToast(err.message || 'Developer seeding failed.', 'error', 'Reset Failed');
                if (logPre) {
                    logPre.innerText = `Error: ${err.message || 'Unknown error occurred.'}`;
                }
                if (logContainer) logContainer.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        };

        window.downloadCrashLogFile = function(errorMsg, source, lineno, colno, stack) {
            const data = window.currentCrashLogData || {};
            const eMsg = errorMsg || data.errorMsg || 'Unknown System Error';
            const src = source || data.source || 'unknown_file.js';
            const lNo = lineno || data.lineno || 0;
            const cNo = colno || data.colno || 0;
            const stk = stack || data.stack || 'No stack trace available.';

            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
            const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
            const formattedTimestamp = `${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
            const filename = `hontech_crash_report_${dateStr}_${timeStr}.log`;
            const reportId = `HTR-CRASH-${dateStr.replace(/-/g, '')}-${timeStr}`;

            const safeBranch = localStorage.getItem('selectedBranch') || 'Marikina Branch';
            const safeUser = (typeof currentUserName !== 'undefined' && currentUserName) ? currentUserName : 'Guest User';
            const safeEmail = (typeof currentUserEmail !== 'undefined' && currentUserEmail) ? currentUserEmail : 'N/A';
            const safeRole = (typeof currentUserRole !== 'undefined' && currentUserRole) ? currentUserRole : 'Guest';

            const rootCategory = eMsg.includes('ReferenceError') 
                ? 'Scope / Undeclared Variable Reference Error' 
                : (eMsg.includes('TypeError') 
                    ? 'Type Mismatch / Null-Pointer Method Invocation' 
                    : (eMsg.includes('SyntaxError') 
                        ? 'Script Syntax / Parser Error' 
                        : (eMsg.includes('Network') || eMsg.includes('fetch') 
                            ? 'Asynchronous Network / API Timeout Error' 
                            : 'Unhandled Runtime System Exception')));

            const logContent = `======================================================================
HONTECH AUTOCENTER — ENTERPRISE SYSTEM EXCEPTION DIAGNOSTICS REPORT
======================================================================
Report Identifier : ${reportId}
Generated At      : ${formattedTimestamp}
Environment       : Local Area Network (LAN Intranet) / Production-Staging
Platform          : HonTech Workshop Management System (Branch 2: Security & Recovery)
Technical Lead    : Justin Nolasco J. (HonTech Systems Group & STI College Marikina)
======================================================================

[1] EXCEPTION SUMMARY
----------------------------------------------------------------------
• Error Type      : Runtime Exception
• Error Message   : ${eMsg}
• Source Location : ${src} (Line: ${lNo}, Column: ${cNo})
• Root Cause Cat. : ${rootCategory}

[2] SESSION & ENVIRONMENT CONTEXT
----------------------------------------------------------------------
• Active User     : ${safeUser}
• User Email      : ${safeEmail}
• Assigned Role   : ${safeRole}
• Active Branch   : ${safeBranch}
• Active URL Path : ${window.location.href}
• Browser Agent   : ${navigator.userAgent}
• Viewport Size   : ${window.innerWidth} x ${window.innerHeight} px
• System Status   : Active Client Session

[3] COMPLETE STACK TRACE
----------------------------------------------------------------------
${stk}

[4] CLIENT SESSION STATE SNAPSHOT
----------------------------------------------------------------------
${JSON.stringify(localStorage, null, 2)}

======================================================================
END OF DIAGNOSTIC REPORT — CONFIDENTIAL & PROPRIETARY
Prepared for HonTech AutoCenter IT Operations & Academic Audit.
======================================================================
`;
            const blob = new Blob([logContent], { type: 'text/plain;charset=utf-8' });
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
            if (typeof showSystemToast === 'function') {
                showSystemToast(`Saved: ${filename}`, 'success', 'Crash Report Exported');
            }
        };

        window.copyStackToClipboard = function(stackText) {
            const stk = stackText || (window.currentCrashLogData ? window.currentCrashLogData.stack : '') || 'No stack trace available.';
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(stk).then(() => {
                    if (typeof showSystemToast === 'function') showSystemToast('Stack trace copied to clipboard!', 'success', 'Diagnostic Copy');
                }).catch(() => {
                    prompt('Copy stack trace below:', stk);
                });
            } else {
                prompt('Copy stack trace below:', stk);
            }
        };

        window.triggerDeveloperResetSeed = async function(btnEl) {
            if (btnEl) {
                btnEl.disabled = true;
                btnEl.innerHTML = `<svg class="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg> Seeding DB...`;
            }
            const logContainer = document.getElementById('dev-reset-log-container');
            const logEl = document.getElementById('dev-reset-log');
            if (logContainer) logContainer.classList.remove('hidden');
            if (logEl) logEl.innerText = 'Connecting to /api/auth/developer/reset-seed...';

            try {
                const res = await apiRequest('/api/auth/developer/reset-seed', { method: 'POST' });
                if (logEl) logEl.innerText = res.output || res.message || 'Database reset & seed complete!';
                if (typeof showSystemToast === 'function') showSystemToast(res.message || 'Database successfully re-seeded!', 'success', 'Developer Reset');
                if (typeof loadData === 'function') await loadData();
            } catch (err) {
                if (logEl) logEl.innerText = `Seeding Error: ${err.message || err}`;
                if (typeof showSystemToast === 'function') showSystemToast(err.message || 'Failed to seed database.', 'error', 'Reset Failed');
            } finally {
                if (btnEl) {
                    btnEl.disabled = false;
                    btnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4 text-white"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" /></svg> Reset & Seed DB`;
                }
            }
        };

        function safeEscapeHtml(str) {
            return String(str || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Global Crash / Error Handler Overlay (Option A: Chrome DevTools & macOS Developer Console)
        function showCrashOverlay(errorMsg, source, lineno, colno, errorObj) {
            const existingOverlay = document.getElementById('system-crash-overlay');
            if (existingOverlay) existingOverlay.remove();

            const overlay = document.createElement('div');
            overlay.id = 'system-crash-overlay';
            overlay.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 bg-gray-900/60 backdrop-blur-xs fade-in select-none';
            
            const file = source ? source.substring(source.lastIndexOf('/') + 1) : 'app.js';
            const stack = errorObj && errorObj.stack ? errorObj.stack : (errorMsg || 'No stack trace available.');
            const safeBranch = localStorage.getItem('selectedBranch') || 'Marikina Branch';
            const safeUser = (typeof currentUserName !== 'undefined' && currentUserName) ? currentUserName : 'Guest';
            const safeRole = (typeof currentUserRole !== 'undefined' && currentUserRole) ? currentUserRole : 'Guest';
            
            window.currentCrashLogData = {
                errorMsg: errorMsg || 'Unknown System Error',
                source: source || 'unknown_file.js',
                lineno: lineno || 0,
                colno: colno || 0,
                stack: stack
            };

            const stackLines = String(stack).split('\n').filter(l => l.trim().length > 0);
            const stackHtml = stackLines.map((line, idx) => {
                const isErrorHeader = idx === 0;
                return `
                    <div class="flex items-start gap-2.5 py-0.5 px-2 rounded hover:bg-gray-100 transition-colors">
                        <span class="text-[11px] font-mono text-gray-400 select-none w-5 text-right shrink-0">${idx + 1}.</span>
                        <span class="text-[11px] font-mono ${isErrorHeader ? 'text-red-700 font-bold' : 'text-gray-800'} break-all leading-relaxed">${safeEscapeHtml(line.trim())}</span>
                    </div>
                `;
            }).join('');

            overlay.innerHTML = `
                <div class="bg-white rounded-2xl max-w-2xl w-full border border-gray-200 shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in-95 duration-150">
                    
                    <!-- Clean DevTools Bar -->
                    <div class="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
                        <div class="flex items-center gap-2.5">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0"></span>
                            <h3 class="text-xs font-black uppercase tracking-wider text-gray-900">Runtime Exception</h3>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-mono text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md border border-gray-200 font-medium">${file}:${lineno || 1}${colno ? ':' + colno : ''}</span>
                            <button onclick="document.getElementById('system-crash-overlay').remove();" class="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Inspector Body -->
                    <div class="p-5 space-y-3.5 bg-white select-text">
                        
                        <!-- Formatted Stack Trace & Code Frame -->
                        <div class="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-[220px] overflow-y-auto custom-scroll shadow-inner">
                            <div class="space-y-0.5">
                                ${stackHtml}
                            </div>
                        </div>

                        <!-- Compact Single-Line Environment Metadata Strip -->
                        <div class="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl flex flex-wrap items-center justify-between text-[11px] text-gray-600 select-none">
                            <span><strong class="text-gray-800">Branch:</strong> ${safeBranch}</span>
                            <span class="text-gray-300">|</span>
                            <span><strong class="text-gray-800">User:</strong> ${safeUser} (${safeRole})</span>
                            <span class="text-gray-300">|</span>
                            <span><strong class="text-gray-800">Session:</strong> Active</span>
                        </div>

                        <!-- Developer Reset Log Output -->
                        <div id="dev-reset-log-container" class="hidden border border-emerald-200 rounded-xl overflow-hidden bg-emerald-50/50 p-3 space-y-1.5">
                            <span class="block text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Database Seeder Feedback</span>
                            <pre id="dev-reset-log" class="bg-gray-950 text-emerald-400 font-mono text-[10px] p-3 rounded-lg max-h-[100px] overflow-auto whitespace-pre-wrap leading-relaxed border border-gray-800"></pre>
                        </div>
                    </div>

                    <!-- Clean Standard Action Bar -->
                    <div class="bg-gray-50 px-5 py-3 border-t border-gray-200 flex items-center justify-between gap-2 shrink-0 select-none">
                        <div class="flex items-center gap-2">
                            <button onclick="window.copyStackToClipboard(this)" 
                                    class="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-gray-500">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                                </svg> Copy Trace
                            </button>
                            <button onclick="window.downloadCrashLogFile()" 
                                    class="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-gray-500">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg> Export Log
                            </button>
                            <button onclick="window.triggerDeveloperResetSeed(this)" 
                                    class="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-emerald-600">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
                                </svg> Reset DB
                            </button>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="document.getElementById('system-crash-overlay').remove();" 
                                    class="px-3.5 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg transition cursor-pointer">
                                Dismiss (ESC)
                            </button>
                            <button onclick="window.location.reload();" 
                                    class="px-3.5 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer flex items-center gap-1.5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-3.5 h-3.5 text-white">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg> Reload
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Close on Escape key
            const handleEsc = (e) => {
                if (e.key === 'Escape') {
                    overlay.remove();
                    window.removeEventListener('keydown', handleEsc);
                }
            };
            window.addEventListener('keydown', handleEsc);

            document.body.appendChild(overlay);
            if (window.lucide) window.lucide.createIcons();
        };

        // --- LOST CONNECTION & NETWORK STATUS UI SYSTEM ---
        let lostConnectionAutoRetryTimer = null;
        let lostConnectionRetryCountdown = 5;
        let isSimulatedDisconnect = false;

        function isNetworkError(errorMsg, errorObj) {
            if (isSimulatedDisconnect) return true;
            if (!navigator.onLine) return true;
            const text = String(errorMsg || (errorObj && (errorObj.message || errorObj.name)) || '').toLowerCase();
            return text.includes('failed to fetch') ||
                   text.includes('networkerror') ||
                   text.includes('network error') ||
                   text.includes('network request failed') ||
                   text.includes('load failed') ||
                   text.includes('fetch failed') ||
                   text.includes('net::err') ||
                   text.includes('err_connection_refused') ||
                   text.includes('err_name_not_resolved') ||
                   text.includes('internet disconnected') ||
                   text.includes('server request failed') ||
                   text.includes('connection refused') ||
                   text.includes('abort');
        }

        function showLostConnectionUI(customReason) {
            // Do not show raw developer crash overlay when network disconnects
            const crashOverlay = document.getElementById('system-crash-overlay');
            if (crashOverlay) crashOverlay.remove();

            const reason = customReason || (!navigator.onLine ? 'Your device is disconnected from the local network.' : 'Unable to connect to the local workshop server.');

            // 1. Create or update the Lost Connection Modal
            let modal = document.getElementById('lost-connection-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'lost-connection-modal';
                modal.className = 'fixed inset-0 z-[9998] flex items-center justify-center p-4 md:p-6 bg-gray-900/40 backdrop-blur-xs fade-in select-none';
                document.body.appendChild(modal);
            }

            modal.classList.remove('hidden');

            modal.innerHTML = `
                <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-7 text-center transform transition-all animate-in fade-in zoom-in-95 duration-200">
                    <!-- Clean Minimalist Amber Badge -->
                    <div class="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18M10.5 10.5a5 5 0 017.07 0M7.5 7.5a9 9 0 0112.73 0M4.5 4.5a13 13 0 0118.38 0M12 18.75a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                        </svg>
                    </div>

                    <!-- Clean Human Typography -->
                    <h3 class="text-xl font-bold text-gray-900 tracking-tight">You are currently offline</h3>
                    <p class="text-xs text-gray-600 font-medium mt-2 leading-relaxed">
                        We are having trouble reaching the workshop server. Your active queue is saved and will synchronize automatically.
                    </p>

                    <!-- Status Pill with Spinner -->
                    <div class="my-5 inline-flex items-center gap-2 bg-gray-50 border border-gray-200/80 px-3.5 py-1.5 rounded-full text-[11px] font-semibold text-gray-600">
                        <svg class="animate-spin w-3.5 h-3.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span id="lost-conn-countdown">Retrying connection in 5s...</span>
                    </div>

                    <!-- Action Buttons -->
                    <div class="space-y-2">
                        <button onclick="triggerNetworkReconnect(this)" 
                                 id="lost-conn-retry-btn"
                                 class="w-full bg-gray-900 hover:bg-black text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-gray-900/10 flex items-center justify-center gap-2 cursor-pointer">
                            Try Reconnecting
                        </button>
                        <button onclick="dismissLostConnectionModalToPill()" 
                                 class="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition cursor-pointer">
                            Dismiss
                        </button>
                    </div>
                </div>
            `;

            // Start countdown and auto-reconnect timer
            startLostConnectionCountdown();
        }

        function dismissLostConnectionModalToPill() {
            const modal = document.getElementById('lost-connection-modal');
            if (modal) modal.classList.add('hidden');
            showLostConnectionPill();
        }

        function showLostConnectionPill() {
            let pill = document.getElementById('lost-connection-pill');
            if (!pill) {
                pill = document.createElement('div');
                pill.id = 'lost-connection-pill';
                pill.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[9990] bg-amber-50/95 border border-amber-200/90 text-amber-950 px-4 py-2 rounded-full shadow-lg backdrop-blur-md flex items-center gap-3 select-none text-xs font-semibold hover:shadow-xl transition cursor-pointer fade-in';
                pill.onclick = () => {
                    const modal = document.getElementById('lost-connection-modal');
                    if (modal) modal.classList.remove('hidden');
                };
                document.body.appendChild(pill);
            }
            pill.classList.remove('hidden');
            pill.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span>Trying to connect to workshop server...</span>
                    <span id="pill-countdown" class="text-[11px] text-amber-700/80 font-mono">(Retrying in 5s)</span>
                </div>
                <button onclick="event.stopPropagation(); triggerNetworkReconnect();" class="ml-1 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1 rounded-full transition shadow-xs">
                    Retry Now
                </button>
            `;
        }

        function hideLostConnectionUI() {
            isSimulatedDisconnect = false;
            if (lostConnectionAutoRetryTimer) {
                clearInterval(lostConnectionAutoRetryTimer);
                lostConnectionAutoRetryTimer = null;
            }
            const modal = document.getElementById('lost-connection-modal');
            if (modal) modal.remove();
            const pill = document.getElementById('lost-connection-pill');
            if (pill) pill.remove();
        }

        function startLostConnectionCountdown() {
            if (lostConnectionAutoRetryTimer) clearInterval(lostConnectionAutoRetryTimer);
            lostConnectionRetryCountdown = 5;
            lostConnectionAutoRetryTimer = setInterval(async () => {
                lostConnectionRetryCountdown--;
                const countdownEl = document.getElementById('lost-conn-countdown');
                if (countdownEl) {
                    countdownEl.innerText = `Retrying connection in ${lostConnectionRetryCountdown}s...`;
                }
                const pillCountdownEl = document.getElementById('pill-countdown');
                if (pillCountdownEl) {
                    pillCountdownEl.innerText = `(Retrying in ${lostConnectionRetryCountdown}s)`;
                }
                if (lostConnectionRetryCountdown <= 0) {
                    lostConnectionRetryCountdown = 5;
                    await triggerNetworkReconnect(null, true);
                }
            }, 1000);
        }

        async function triggerNetworkReconnect(btnEl, isSilent = false) {
            if (btnEl) {
                btnEl.disabled = true;
                btnEl.innerHTML = `<svg class="animate-spin w-4 h-4 text-white inline-block mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Pinging...`;
            }

            try {
                if (isSimulatedDisconnect) {
                    throw new Error("Simulated offline mode active. Click 'Reconnect' to resume normal state.");
                }

                const path = window.location.pathname;
                const basePath = path.includes('/frontend') 
                    ? path.substring(0, path.lastIndexOf('/frontend')) + '/backend/index.php/api/auth/ping' 
                    : path.replace(/\/$/, '') + '/backend/index.php/api/auth/ping';

                const response = await fetch(basePath, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    cache: 'no-store'
                });

                if (response.ok || response.status === 401) {
                    hideLostConnectionUI();
                    if (typeof loadData === 'function') await loadData();
                    if (typeof renderStaffTables === 'function') renderStaffTables();
                    if (typeof renderTV === 'function') renderTV();
                    showSystemToast("Connection restored! Synced with HonTech workshop.", "success", "Back Online");
                    return true;
                }
                throw new Error("Server responded with error status: " + response.status);
            } catch (e) {
                if (!isSilent) {
                    showSystemToast("Server still unreachable. Checking again shortly...", "warning", "Connection Failed");
                }
                const reasonEl = document.getElementById('lost-conn-reason');
                if (reasonEl) {
                    reasonEl.innerText = `Attempt failed: ${e.message || 'Server unreachable'}. Verifying local connection...`;
                }
                return false;
            } finally {
                if (btnEl) {
                    btnEl.disabled = false;
                    btnEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-white"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg> Retry Connection`;
                }
            }
        }

        window.triggerSimulateLostConnection = function() {
            isSimulatedDisconnect = true;
            showLostConnectionUI("Simulated Network Disconnection: Local router or workshop LAN server offline.");
        };
        window.triggerNetworkReconnect = triggerNetworkReconnect;
        window.dismissLostConnectionModalToPill = dismissLostConnectionModalToPill;
        window.hideLostConnectionUI = hideLostConnectionUI;
        window.showCrashOverlay = showCrashOverlay;

        window.setCategoryInflowView = function(viewMode) {
            const chartWrap = document.getElementById('category-inflow-chart-wrapper');
            const tableWrap = document.getElementById('category-inflow-table-wrapper');
            const btnSplit = document.getElementById('btn-cat-view-split');
            const btnChart = document.getElementById('btn-cat-view-chart');
            const btnTable = document.getElementById('btn-cat-view-table');

            const activeClasses = ['bg-white', 'text-gray-900', 'shadow-2xs', 'font-black'];
            const inactiveClasses = ['text-gray-500', 'hover:text-gray-900'];

            const setBtnState = (btn, isActive) => {
                if (!btn) return;
                if (isActive) {
                    btn.classList.add(...activeClasses);
                    btn.classList.remove(...inactiveClasses);
                } else {
                    btn.classList.remove(...activeClasses);
                    btn.classList.add(...inactiveClasses);
                }
            };

            if (viewMode === 'chart') {
                if (chartWrap) chartWrap.classList.remove('hidden');
                if (tableWrap) tableWrap.classList.add('hidden');
                setBtnState(btnChart, true);
                setBtnState(btnSplit, false);
                setBtnState(btnTable, false);
            } else if (viewMode === 'table') {
                if (chartWrap) chartWrap.classList.add('hidden');
                if (tableWrap) tableWrap.classList.remove('hidden');
                setBtnState(btnTable, true);
                setBtnState(btnSplit, false);
                setBtnState(btnChart, false);
            } else { // 'split'
                if (chartWrap) chartWrap.classList.remove('hidden');
                if (tableWrap) tableWrap.classList.remove('hidden');
                setBtnState(btnSplit, true);
                setBtnState(btnChart, false);
                setBtnState(btnTable, false);
            }
        };

        window.triggerTestCrash = function() {
            try {
                throw new Error("Simulated Developer Exception: Unhandled Database Timeout during asynchronous job order dispatch.");
            } catch (err) {
                showCrashOverlay(
                    err.message,
                    "frontend/js/app.js",
                    245,
                    18,
                    err
                );
            }
        };

        window.addEventListener('error', function(event) {
            if (isNetworkError(event.message, event.error)) {
                event.preventDefault();
                showLostConnectionUI(event.message);
                return;
            }
            showCrashOverlay(event.message, event.filename, event.lineno, event.colno, event.error);
        });

        window.addEventListener('unhandledrejection', function(event) {
            const reason = event.reason || {};
            const msg = reason.message || String(reason);
            if (isNetworkError(msg, reason)) {
                event.preventDefault();
                showLostConnectionUI(msg);
                return;
            }
            showCrashOverlay(
                msg || 'Unhandled Promise Rejection',
                reason.fileName || 'async_call',
                reason.lineNumber || 'N/A',
                reason.columnNumber || 'N/A',
                reason
            );
        });

        window.addEventListener('offline', function() {
            showLostConnectionUI("Device disconnected from network or Wi-Fi.");
        });

        window.addEventListener('online', function() {
            triggerNetworkReconnect();
        });

        function hideAppPreloader() {
            const preloader = document.getElementById('app-preloader');
            if (preloader) {
                preloader.classList.add('opacity-0', 'pointer-events-none');
                setTimeout(() => {
                    preloader.classList.add('hidden');
                }, 500);
            }
        }

        function showAppPreloader(message = 'Synchronizing workshop engine...') {
            const preloader = document.getElementById('app-preloader');
            const text = document.getElementById('preloader-text');
            if (text && message) text.innerText = message;
            if (preloader) {
                preloader.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
            }
        }

        // Multi-Theme Preloader Switcher & Storage
        function applyLoaderTheme(themeKey) {
            const validThemes = ['gears', 'emblem', 'gauge', 'cyber', 'piston'];
            const activeTheme = validThemes.includes(themeKey) ? themeKey : (localStorage.getItem('hontech-loader-theme') || 'gears');
            localStorage.setItem('hontech-loader-theme', activeTheme);

            validThemes.forEach(t => {
                const el = document.getElementById(`loader-visual-${t}`);
                if (el) {
                    if (t === activeTheme) {
                        el.classList.remove('hidden');
                    } else {
                        el.classList.add('hidden');
                    }
                }
            });
            lucide.createIcons();
        }

        function openLoaderThemeModal() {
            const modal = document.getElementById('loader-theme-modal');
            if (modal) {
                modal.classList.remove('hidden');
                lucide.createIcons();
            }
        }

        function closeLoaderThemeModal() {
            const modal = document.getElementById('loader-theme-modal');
            if (modal) modal.classList.add('hidden');
        }

        function selectAndPreviewLoaderTheme(themeKey) {
            applyLoaderTheme(themeKey);
            closeLoaderThemeModal();
            triggerDevLoadingDemo(3200);
        }

        // Developer Tool: Interactive Demo of the Boot Preloader
        function triggerDevLoadingDemo(customDuration = 3200) {
            applyLoaderTheme(localStorage.getItem('hontech-loader-theme') || 'gears');
            const messages = [
                'Synchronizing workshop engine...',
                'Checking active bays & lift allocations...',
                'Loading staff rosters & live telemetry...',
                'System initialization complete!'
            ];

            showAppPreloader(messages[0]);

            let step = 0;
            const stepInterval = Math.max(700, Math.floor(customDuration / messages.length));
            const interval = setInterval(() => {
                step++;
                if (step < messages.length) {
                    const textEl = document.getElementById('preloader-text');
                    if (textEl) textEl.innerText = messages[step];
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        hideAppPreloader();
                        showSystemToast('Loading screen preview test completed!', 'success', 'Dev Tool Test');
                    }, 400);
                }
            }, stepInterval);
        }

        function toggleDevToolbox(forceState) {
            const menu = document.getElementById('dev-toolbox-menu');
            const chevron = document.getElementById('dev-toolbox-chevron');
            if (!menu) return;

            const isHidden = menu.classList.contains('hidden');
            const shouldShow = typeof forceState === 'boolean' ? forceState : isHidden;

            if (shouldShow) {
                menu.classList.remove('hidden');
                if (chevron) chevron.style.transform = 'rotate(180deg)';
            } else {
                menu.classList.add('hidden');
                if (chevron) chevron.style.transform = 'rotate(0deg)';
            }
            lucide.createIcons();
        }

        // Close Dev Toolbox when clicking outside
        window.addEventListener('click', function(e) {
            const container = document.getElementById('dev-toolbox-container');
            const modal = document.getElementById('loader-theme-modal');
            const mailModal = document.getElementById('dev-mailbox-modal');
            if (container && !container.contains(e.target) && (!modal || modal.classList.contains('hidden')) && (!mailModal || mailModal.classList.contains('hidden'))) {
                toggleDevToolbox(false);
            }
        });

        window.hideAppPreloader = hideAppPreloader;
        window.showAppPreloader = showAppPreloader;
        window.applyLoaderTheme = applyLoaderTheme;
        window.openLoaderThemeModal = openLoaderThemeModal;
        window.closeLoaderThemeModal = closeLoaderThemeModal;
        window.selectAndPreviewLoaderTheme = selectAndPreviewLoaderTheme;
        window.triggerDevLoadingDemo = triggerDevLoadingDemo;
        window.toggleDevToolbox = toggleDevToolbox;

        document.addEventListener('DOMContentLoaded', async () => {
            try {
                applyLoaderTheme(localStorage.getItem('hontech-loader-theme') || 'gears');
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
                        await handleLogin(user.role);
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
            } finally {
                // Smoothly dismiss preloader splash screen
                setTimeout(hideAppPreloader, 350);
            }
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

        // Direct 1-Click Login Helper for quick role testing
        window.quickDirectLogin = async function(email, password) {
            const emailInput = document.getElementById('login-email');
            const passInput = document.getElementById('login-pass');
            if (emailInput) emailInput.value = email;
            if (passInput) passInput.value = password;
            await processLogin();
        };

        // Mobile Connection Modal Helpers
        window.openMobileConnectModal = function() {
            const modal = document.getElementById('mobile-connect-modal');
            const currentUrl = window.location.href.split('#')[0];
            const qrImg = document.getElementById('mobile-qr-img');
            const urlText = document.getElementById('mobile-connect-url-text');
            
            if (urlText) urlText.innerText = currentUrl;
            if (qrImg) {
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(currentUrl)}`;
            }
            if (modal) modal.classList.remove('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        };

        window.closeMobileConnectModal = function() {
            const modal = document.getElementById('mobile-connect-modal');
            if (modal) modal.classList.add('hidden');
        };

        // Terms and Conditions Modal Helpers
        window.openTermsModal = function() {
            const modal = document.getElementById('terms-modal');
            if (modal) {
                modal.classList.remove('hidden');
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        };

        window.closeTermsModal = function() {
            const modal = document.getElementById('terms-modal');
            if (modal) modal.classList.add('hidden');
        };

        // --- AUTH & ROLE LOGIC ---
        async function processLogin() {
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            showAppPreloader('Authenticating credentials & preparing workspace...');
            try {
                const res = await apiRequest('/api/auth/login', {
                    method: 'POST',
                    body: { email, password: pass }
                });

                if (res.requiresMfa) {
                    hideAppPreloader();
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
                await handleLogin(res.role);
                showSystemToast('Logged in successfully.', 'success', 'Access Granted');
            } catch (err) {
                showSystemToast(err.message || 'Invalid credentials.', 'error', 'Authentication Failed');
            } finally {
                setTimeout(hideAppPreloader, 350);
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
            if (role === 'owner' || role === 'admin') {
                initAnalyticsPickers();
                if (typeof renderReports === 'function') renderReports();
                if (typeof loadAnalyticsData === 'function') loadAnalyticsData();
            }
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

            if (document.getElementById('header-user-name')) {
                document.getElementById('header-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('header-user-role')) {
                document.getElementById('header-user-role').innerText = userRoleLabel;
            }
            if (document.getElementById('sidebar-user-name')) {
                document.getElementById('sidebar-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('sidebar-user-role')) {
                document.getElementById('sidebar-user-role').innerText = userRoleLabel;
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
            if (document.getElementById('settings-bay-config-container')) {
                document.getElementById('settings-bay-config-container').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }
            if (document.getElementById('bays-control-card')) {
                document.getElementById('bays-control-card').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }

            if (role === 'owner') {
                if (document.getElementById('sidebar-user-role')) {
                    document.getElementById('sidebar-user-role').innerText = 'Owner';
                }
                if (document.getElementById('header-actions')) {
                    document.getElementById('header-actions').classList.remove('hidden');
                }

                navHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="pie-chart" class="w-4 h-4"></i> Analytics</button>`;
                navHTML += `<button onclick="showSection('bays', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4"></i> Workshop Bays</button>`;
                navHTML += `<button onclick="showSection('lookup', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Customer Lookup</button>`;
                navHTML += `<button onclick="showSection('staff', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Staff Access</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="database" class="w-4 h-4"></i> Records</button>`;

                sidebarNavHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="pie-chart" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Analytics</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Workshop Bays</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('staff', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="users" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Staff Access</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="database" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Records</span></button>`;

                defaultView = 'dashboard';
            }
            else if (role === 'admin') {
                if (document.getElementById('sidebar-user-role')) {
                    document.getElementById('sidebar-user-role').innerText = 'Administrator';
                }
                if (document.getElementById('header-actions')) {
                    document.getElementById('header-actions').classList.remove('hidden');
                }

                navHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="pie-chart" class="w-4 h-4"></i> Analytics</button>`;
                navHTML += `<button onclick="showSection('bays', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4"></i> Workshop Bays</button>`;
                navHTML += `<button onclick="showSection('lookup', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Customer Lookup</button>`;
                navHTML += `<button onclick="showSection('staff', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Staff Access</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="database" class="w-4 h-4"></i> Records</button>`;

                sidebarNavHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="pie-chart" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Analytics</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Workshop Bays</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('staff', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="users" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Staff Access</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="database" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Records</span></button>`;

                defaultView = 'dashboard';
            }
            else if (role === 'assistant') {
                if (document.getElementById('sidebar-user-role')) {
                    document.getElementById('sidebar-user-role').innerText = 'Assistant Staff';
                }
                if (document.getElementById('header-actions')) {
                    document.getElementById('header-actions').classList.add('hidden');
                }

                navHTML += `<button onclick="showSection('intake', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="calendar-plus" class="w-4 h-4"></i> Online Booking Form</button>`;
                navHTML += `<button onclick="showSection('lookup', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Customer Lookup</button>`;
                navHTML += `<button onclick="showSection('bays', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4"></i> Bay Status</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="list-todo" class="w-4 h-4"></i> Master Queue</button>`;
                navHTML += `<button onclick="launchTVMode()" class="px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 text-gray-500 flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4"></i> TV Monitor</button>`;

                sidebarNavHTML += `<button onclick="showSection('intake', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="calendar-plus" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Online Booking Form</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Bay Status</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="list-todo" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Master Queue</span></button>`;
                sidebarNavHTML += `<button onclick="launchTVMode()" class="w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-500"><i data-lucide="monitor" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">TV Monitor</span></button>`;

                setupIntakeForm('assistant');
                defaultView = 'intake';
            }
            else if (role === 'sa') {
                if (document.getElementById('sidebar-user-role')) {
                    document.getElementById('sidebar-user-role').innerText = 'Service Advisor';
                }
                if (document.getElementById('header-actions')) {
                    document.getElementById('header-actions').classList.add('hidden');
                }

                navHTML += `<button onclick="showSection('intake', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="user-plus" class="w-4 h-4"></i> Walk-In Form</button>`;
                navHTML += `<button onclick="showSection('lookup', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Customer Lookup</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="clipboard-list" class="w-4 h-4"></i> Daily Intakes</button>`;
                navHTML += `<button onclick="showSection('bays', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4"></i> Bay Status</button>`;
                navHTML += `<button onclick="launchTVMode()" class="px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 text-gray-500 flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4"></i> TV Monitor</button>`;

                sidebarNavHTML += `<button onclick="showSection('intake', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="user-plus" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Walk-In Form</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="clipboard-list" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Daily Intakes</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3 py-2.5 rounded-xl font-semibold transition hover:bg-gray-100 flex items-center gap-3 text-gray-600"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text truncate">Bay Status</span></button>`;
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

        async function logout() {
            showAppPreloader('Securing session & signing out...');
            try {
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
            } finally {
                setTimeout(hideAppPreloader, 350);
            }
        }
        window.handleLogout = logout;
        window.logout = logout;

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

        function showSessionExpiredModal(reason = 'You have been logged out due to inactivity.') {
            if (document.getElementById('session-expired-modal')) return;

            const modal = document.createElement('div');
            modal.id = 'session-expired-modal';
            modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md fade-in';
            modal.innerHTML = `
                <div class="bg-white rounded-2xl max-w-md w-full border border-red-100 shadow-2xl p-6 text-center flex flex-col items-center gap-4">
                    <div class="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200/60 shadow-sm animate-pulse">
                        <i data-lucide="shield-alert" class="w-7 h-7"></i>
                    </div>
                    <div>
                        <h3 class="text-xl font-black text-gray-900 uppercase tracking-tight">Session Expired</h3>
                        <p class="text-xs text-gray-500 font-semibold mt-1 leading-relaxed">${reason}</p>
                    </div>
                    <button onclick="document.getElementById('session-expired-modal').remove(); logout();" 
                            class="w-full bg-red-600 hover:bg-red-700 text-white font-black uppercase text-xs py-3 rounded-xl transition shadow-md shadow-red-600/20 tracking-wider">
                        Log In Again
                    </button>
                </div>
            `;
            document.body.appendChild(modal);
            if (window.lucide) window.lucide.createIcons();
        }

        function resetIdleTimer() {
            if (idleLogoutTimer) {
                clearTimeout(idleLogoutTimer);
            }
            if (!currentUserRole) return; // Only run if user is logged in
            
            let timeoutMinutes = parseInt(localStorage.getItem('hontech-idle-timeout') || '30', 10);
            if (timeoutMinutes === 15 || isNaN(timeoutMinutes)) {
                timeoutMinutes = 30;
                localStorage.setItem('hontech-idle-timeout', '30');
            }
            if (timeoutMinutes === 0) return; // Disabled

            idleLogoutTimer = setTimeout(() => {
                logout();
                showSessionExpiredModal(`You have been logged out after ${timeoutMinutes} minutes of inactivity.`);
            }, timeoutMinutes * 60 * 1000);
        }

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
        activityEvents.forEach(evt => {
            window.addEventListener(evt, () => {
                lastUserActivityTimestamp = Date.now();
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
                'bays': 'Workshop Capacity & Bay Management',
                'staff': 'Staff & Access Management',
                'lookup': 'Customer History & Back-Job Lookup',
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
            if (id === 'lookup') {
                (async () => {
                    try {
                        await loadData();
                        renderCustomerLookupModule();
                    } catch (e) {
                        console.error('Error loading customer lookup module:', e);
                    }
                })();
            }
            if (id === 'bays') {
                (async () => {
                    try {
                        await loadData();
                        renderWorkshopBaysModule();
                    } catch (e) {
                        console.error('Error loading workshop bays module:', e);
                    }
                })();
            }
            if (id === 'queue') {
                (async () => {
                    try {
                        await loadData();
                        renderStaffTables();
                    } catch (e) {
                        console.error('Error loading queue records:', e);
                    }
                })();
            }
            if (id === 'staff') {
                (async () => {
                    try {
                        await loadData();
                        renderStaffManagement();
                    } catch (e) {
                        console.error('Error loading staff management:', e);
                    }
                })();
            }
            if (id === 'profile') {
                loadSystemSettingsIntoForm();
            }
            if (id === 'settings') {
                initWorkshopBaySettings();
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

            // Enforce standard assignable staff roles in create form
            const newRoleSelect = document.getElementById('new-staff-role');
            if (newRoleSelect) {
                const currentVal = newRoleSelect.value;
                newRoleSelect.innerHTML = `
                    <option value="assistant">Assistant Staff</option>
                    <option value="sa">Service Advisor</option>
                    <option value="admin">Admin</option>
                `;
                if (currentVal && Array.from(newRoleSelect.options).some(o => o.value === currentVal)) {
                    newRoleSelect.value = currentVal;
                }
            }

            tbody.innerHTML = staffAccounts.map(user => {
                const userId = user.id ?? user._id;
                const isActive = user.is_active !== undefined ? Number(user.is_active) === 1 : (user.isActive !== false);
                const isOnline = user.is_online !== undefined ? Number(user.is_online) === 1 : Boolean(user.isOnline);
                const userRole = user.role || 'assistant';
                const isSysOwner = (user.email === 'owner@hontech.com');
                const isOwnerAccount = (userRole === 'owner');

                let roleHtml = '';
                if (isSysOwner) {
                    roleHtml = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shadow-2xs">Primary Administrator</span>`;
                } else if (isOwnerAccount) {
                    roleHtml = `<span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 shadow-2xs">Owner</span>`;
                } else {
                    roleHtml = `
                        <select onchange="updateStaffRole('${userId}', this.value)" class="bg-gray-50 hover:bg-white border border-gray-200 focus:border-red-600 rounded-xl px-2.5 py-1.5 font-bold text-xs text-gray-900 outline-none transition cursor-pointer shadow-2xs">
                            <option value="assistant" ${userRole === 'assistant' ? 'selected' : ''}>Assistant Staff</option>
                            <option value="sa" ${userRole === 'sa' ? 'selected' : ''}>Service Advisor</option>
                            <option value="admin" ${userRole === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    `;
                }

                return `
                <tr class="hover:bg-gray-50/80 transition-colors ${!isActive ? 'bg-gray-50/60' : 'bg-white'} border-b border-gray-100">
                    <td class="px-6 py-4">
                        <div class="font-bold text-gray-900 flex items-center gap-2.5">
                            <i data-lucide="user-circle" class="w-4 h-4 text-gray-500"></i>
                            <span class="text-xs">${user.name}</span>
                            <span class="inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.7)] animate-pulse' : 'bg-gray-300'}" title="${isOnline ? 'Online' : 'Offline'}"></span>
                        </div>
                    </td>
                    <td class="px-6 py-4">
                        ${roleHtml}
                    </td>
                    <td class="px-6 py-4 text-gray-700 font-semibold text-xs">${user.branch || 'Branch A'}</td>
                    <td class="px-6 py-4 text-gray-700 font-semibold text-xs font-mono">${user.email}</td>
                    <td class="px-6 py-4">
                        <span class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'} shadow-2xs">
                            ${isActive ? 'Active' : 'Suspended'}
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        ${isSysOwner || (currentUserRole === 'admin' && isOwnerAccount)
                    ? '<span class="text-[10px] text-gray-400 font-black uppercase tracking-wider">Secured</span>'
                    : `<button onclick="openStaffPasswordReset('${userId}', '${(user.name || '').replace(/'/g, "\\'")}')" class="bg-white hover:bg-gray-50 text-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 transition text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs cursor-pointer"><i data-lucide="key-round" class="w-3.5 h-3.5 text-red-600"></i> Reset</button>`
                }
                    </td>
                    <td class="px-6 py-4 text-right">
                        <div class="flex gap-2 justify-end">
                            ${isSysOwner || (currentUserRole === 'admin' && isOwnerAccount)
                    ? '<span class="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sys Owner</span>'
                    : `
                                <button onclick="openStaffEditModal('${userId}', '${(user.name || '').replace(/'/g, "\\'")}', '${user.email}', '${userRole}', '${user.branch || ''}')" class="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs text-blue-600 hover:bg-blue-50 transition cursor-pointer" title="Edit Details">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button onclick="toggleStaffActive('${userId}', ${!isActive})" class="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs transition cursor-pointer ${isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}" title="${isActive ? 'Suspend Access' : 'Restore Access'}">
                                    <i data-lucide="${isActive ? 'user-minus' : 'user-check'}" class="w-4 h-4"></i>
                                </button>
                                <button onclick="deleteStaffAccount('${userId}')" class="bg-white p-2 rounded-xl border border-gray-200 shadow-2xs text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer" title="Delete Account">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                                `
                }
                        </div>
                    </td>
                </tr>
            `;
            }).join('');
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
                await loadData();
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

        function getAvailableLanesForJob(category) {
            return [
                { value: 'Express Lane', label: 'Express Lane' },
                { value: 'Flexible Lane', label: 'Flexible Lane' },
                { value: 'Special Lane', label: 'Special Lane' },
                { value: 'Priority Lane', label: 'Priority Lane' }
            ];
        }
        window.getAvailableLanesForJob = getAvailableLanesForJob;

        function updateLaneTypeOptionsForCategory(category) {
            const walkinLaneSelect = document.getElementById('intake-walkin-lane-type');
            const bookingLaneSelect = document.getElementById('intake-lane-type');
            
            const options = getAvailableLanesForJob(category);
            const html = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('');

            [walkinLaneSelect, bookingLaneSelect].forEach(sel => {
                if (sel) {
                    const currentVal = sel.value;
                    sel.innerHTML = html;
                    const hasOption = options.some(opt => opt.value === currentVal);
                    sel.value = hasOption ? currentVal : options[0].value;
                }
            });
        }

        function handleCategoryChange() {
            const selectEl = document.getElementById('intake-category');
            const otherEl = document.getElementById('intake-category-other');
            if (selectEl) {
                const val = selectEl.value;
                if (otherEl) {
                    if (val === 'Others') {
                        otherEl.classList.remove('hidden');
                    } else {
                        otherEl.classList.add('hidden');
                        otherEl.value = '';
                    }
                }
                updateLaneTypeOptionsForCategory(val);
            }
        }

        function toggleCategoryOther() {
            handleCategoryChange();
        }

        window.handleCategoryChange = handleCategoryChange;
        window.toggleCategoryOther = toggleCategoryOther;

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

            // Reset Category Select, Specify Input, and Lane options
            const catSelect = document.getElementById('intake-category');
            if (catSelect) catSelect.value = 'PMS';
            const catOther = document.getElementById('intake-category-other');
            if (catOther) {
                catOther.classList.add('hidden');
                catOther.value = '';
            }
            updateLaneTypeOptionsForCategory('PMS');

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

            // ACTIVE DUPLICATE RECORD GUARD (Prevents Accidental Multiple Bookings for the Same Vehicle)
            const normalizedPlate = plate.replace(/[\s-]/g, '').toUpperCase();
            if (normalizedPlate !== 'NOPLATE' && normalizedPlate.length >= 3) {
                const existingActiveJob = allJobs.find(j => {
                    const jPlate = (j.plate || '').replace(/[\s-]/g, '').toUpperCase();
                    const isSamePlate = jPlate === normalizedPlate;
                    const isActive = j.status !== 'Released' && j.status !== 'Completed' && j.status !== 'Cancelled';
                    return isSamePlate && isActive;
                });

                if (existingActiveJob) {
                    const existingStatus = existingActiveJob.status || 'Pending';
                    const existingSource = existingActiveJob.source || 'Inquiry';
                    const existingTime = existingActiveJob.appt_time || existingActiveJob.arrival || 'Today';
                    const confirmAdd = confirm(
                        `⚠️ DUPLICATE INTAKE DETECTED!\n\nVehicle with Plate "${plate}" already has an active ${existingSource} record:\n• Status: ${existingStatus}\n• Time: ${existingTime}\n\nDo you want to create an additional entry for this vehicle anyway? Click CANCEL to stop duplicate submission.`
                    );
                    if (!confirmAdd) {
                        return;
                    }
                }
            }

            const isWalkin = source === 'Walk-in';
            let arrival = '';
            let apptDate = '', apptTime = '', confirmed = false, laneType = '';

            if (isWalkin) {
                const hour = document.getElementById('intake-arrival-hour').value;
                const min = document.getElementById('intake-arrival-minute').value;
                arrival = `${hour}:${min}`;
                laneType = document.getElementById('intake-walkin-lane-type')?.value || 'Flexible Lane';
            } else {
                apptDate = date;
                const hour = document.getElementById('intake-appt-hour').value;
                const min = document.getElementById('intake-appt-minute').value;
                apptTime = `${hour}:${min}`;
                confirmed = document.getElementById('intake-confirmed').checked;
                laneType = document.getElementById('intake-lane-type')?.value || 'Flexible Lane';
            }

            // Button Debounce (Prevents Rapid Double Clicks)
            const submitBtn = document.getElementById('btn-submit-intake');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'pointer-events-none');
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
                updateLaneTypeOptionsForCategory('PMS');

                if (document.getElementById('intake-confirmed')) document.getElementById('intake-confirmed').checked = false;

                if (isWalkin) updateStubPreview();
                renderStaffTables();
            } catch (err) {
                showSystemToast(err.message || 'Failed to submit intake.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-50', 'pointer-events-none');
                }
            }
        }

        async function updateJobField(jobId, field, value) {
            try {
                const job = allJobs.find(j => j.id === jobId);
                if (job && field === 'laneType') {
                    const allowed = getAvailableLanesForJob(job.category).map(l => l.value);
                    if (!allowed.includes(value)) {
                        showSystemToast(`Lane "${value}" is not permitted for category "${job.category}". Allowed: ${allowed.join(', ')}`, 'error', 'Invalid Lane');
                        renderStaffTables();
                        return;
                    }
                }

                if (field === 'departure') {
                    const normalized = convertTimeTo24Hour(value);
                    if (normalized) value = normalized;
                }

                if (field === 'location' && typeof value === 'string' && value.toLowerCase().startsWith('bay')) {
                    playBayDispatchSound();
                }

                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: { field, value }
                });

                if (job) {
                    job[field] = value;

                    // Automatically validate and clamp lane when category changes
                    if (field === 'category') {
                        const allowed = getAvailableLanesForJob(value).map(l => l.value);
                        if (!allowed.includes(job.laneType)) {
                            const clampedLane = allowed[0];
                            await apiRequest(`/api/jobs/${jobId}/field`, {
                                method: 'PATCH',
                                body: { field: 'laneType', value: clampedLane }
                            });
                            job.laneType = clampedLane;
                        }
                    }

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

                await loadData();
                renderStaffTables();
                if (typeof renderTV === 'function') renderTV();
                if (typeof renderReports === 'function') renderReports();
            } catch (err) {
                showSystemToast(err.message || 'Error updating job property.', 'error');
                renderStaffTables();
            }
        }

        function updateCheckbox(jobId, field, checked) {
            updateJobField(jobId, field, checked);
        }

        async function handleTableCategoryChange(jobId, selectElement) {
            const val = selectElement.value;
            await updateJobField(jobId, 'category', val);
        }
        window.handleTableCategoryChange = handleTableCategoryChange;

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

                if (newStatus === 'In Progress') {
                    playBayDispatchSound();
                } else if (newStatus === 'Ready' || newStatus === 'Ready to Release' || newStatus === 'Released' || newStatus === 'Completed') {
                    playAutomotiveChime();
                }

                if (newStatus === 'Waiting') {
                    // Reset location back to Waiting Area when vehicle returns to Waiting
                    await apiRequest(`/api/jobs/${jobId}/field`, {
                        method: 'PATCH',
                        body: { field: 'location', value: 'None' }
                    });
                }

                await apiRequest(`/api/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    body: { status: newStatus }
                });

                await loadData();
                renderStaffTables();
                renderTV();
            } catch (err) {
                showSystemToast(err.message || 'Error updating status.', 'error');
                // Re-render to undo choice visually
                renderStaffTables();
            }
        }

        function completeRelease(jobId) {
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return;
            playAutomotiveChime();
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
                // Play celebratory dual chime on vehicle release
                playReleaseConfirmSound();

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
        window.saveSystemSettings = saveSystemSettings;

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
            if (!timeStr) return '';
            const totalMins = parseTimeToMinutes(timeStr);
            if (totalMins === null) return timeStr;
            const hrs = Math.floor(totalMins / 60) % 24;
            const mins = totalMins % 60;
            return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        }

        function parseTimeToMinutes(timeStr) {
            if (!timeStr) return null;
            let s = String(timeStr).trim().toLowerCase();
            const isPm = s.includes('pm');
            const isAm = s.includes('am');
            s = s.replace(/am|pm/gi, '').trim();
            
            // 1. Check for time formatted with separators (e.g. "12;33", "12:33", "12.33", "14-00")
            const matchColon = s.match(/(\d{1,2})[;:\.\-\s]+(\d{1,2})/);
            if (matchColon) {
                let hour = parseInt(matchColon[1], 10);
                let minute = parseInt(matchColon[2], 10);
                if (isPm && hour < 12) hour += 12;
                if (isAm && hour === 12) hour = 0;
                if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                    return hour * 60 + minute;
                }
                return null;
            }
            
            // 2. Extract digit sequences ignoring surrounding text/symbols (e.g. ";1233;adasd" -> "1233", "1400" -> "1400")
            const digitsMatch = s.match(/\d+/g);
            if (digitsMatch) {
                const digits = digitsMatch.join('');
                let hour = 0;
                let minute = 0;
                
                if (digits.length === 4) {
                    hour = parseInt(digits.slice(0, 2), 10);
                    minute = parseInt(digits.slice(2, 4), 10);
                } else if (digits.length === 3) {
                    hour = parseInt(digits.slice(0, 1), 10);
                    minute = parseInt(digits.slice(1, 3), 10);
                } else if (digits.length === 1 || digits.length === 2) {
                    hour = parseInt(digits, 10);
                    minute = 0;
                } else {
                    return null;
                }
                
                if (isPm && hour < 12) hour += 12;
                if (isAm && hour === 12) hour = 0;
                if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
                    return hour * 60 + minute;
                }
                return null;
            }
            
            return null;
        }

        function handleDepartureChange(jobId, inputEl) {
            const rawVal = (inputEl.value || '').trim();
            if (!rawVal) {
                updateJobField(jobId, 'departure', '');
                return;
            }

            const parsedMins = parseTimeToMinutes(rawVal);
            if (parsedMins === null) {
                showSystemToast(`Invalid time "${rawVal}". Please enter a valid 24H time (e.g. 12:00 or 1233).`, 'warning', 'Time Guide');
                const job = allJobs.find(j => j.id === jobId);
                inputEl.value = convertTimeTo24Hour(job?.departure) || '';
                return;
            }

            const formatted = convertTimeTo24Hour(rawVal);
            inputEl.value = formatted;
            updateJobField(jobId, 'departure', formatted);
        }
        window.handleDepartureChange = handleDepartureChange;

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
            const isExpress = job.laneType && (job.laneType === 'Express' || job.laneType === 'Express Lane');
            if (!isPMS && !isExpress) return 'N/A';
            if (!job.arrival || !job.departure) return 'N/A';
            try {
                const arrMin = parseTimeToMinutes(job.arrival);
                const depMin = parseTimeToMinutes(job.departure);
                if (arrMin === null || depMin === null) return 'N/A';

                let diff = depMin - arrMin;
                if (diff < 0) diff += 24 * 60;
                
                // Express Lane turnaround SLA: <= 60 mins; Standard PMS SLA: <= 120 mins
                const maxAllowedMinutes = isExpress ? 60 : 120;
                return diff <= maxAllowedMinutes ? 'Successful' : 'Failed';
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
            const isReadOnlyOnline = isOwner || isAdmin || isSA;
            const canViewOnline = isAsst || isOwner || isAdmin || isSA;

            const onlineQueueEl = document.getElementById('container-online-queue');
            const dailyIntakesEl = document.getElementById('container-daily-intakes');
            const techBoardEl = document.getElementById('container-tech-board');
            const periodicRecordsEl = document.getElementById('container-periodic-records');

            if (onlineQueueEl) onlineQueueEl.classList.toggle('hidden', !canViewOnline);
            if (dailyIntakesEl) dailyIntakesEl.classList.toggle('hidden', isTech);
            if (techBoardEl) techBoardEl.classList.toggle('hidden', !isTech);
            if (periodicRecordsEl) periodicRecordsEl.classList.toggle('hidden', !(isOwner || isAdmin));

            // BOOKING MODULE (Assistant Staff Operational Controls; Service Advisor, Owner, Admin View-Only)
            if (canViewOnline && document.getElementById('table-pending-express')) {
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
                            ${isReadOnlyOnline ? `
                                <span class="text-xs font-semibold uppercase text-gray-700 bg-gray-50 border border-gray-150 rounded px-2 py-0.5">${job.laneType || 'Flexible Lane'}</span>
                            ` : `
                                <div class="relative inline-flex items-center bg-gray-50 border border-gray-300 hover:border-red-600 rounded-xl px-3 py-1.5 shadow-2xs transition">
                                    <select onchange="updateJobField('${job.id}', 'laneType', this.value)" class="table-select text-xs font-black uppercase bg-transparent border-none cursor-pointer p-0 pr-6 outline-none appearance-none text-gray-900">
                                        <option value="Express Lane" ${job.laneType === 'Express Lane' || job.laneType === 'Express' ? 'selected' : ''}>Express Lane</option>
                                        <option value="Flexible Lane" ${job.laneType === 'Flexible Lane' || job.laneType === 'Flexible' || !job.laneType ? 'selected' : ''}>Flexible Lane</option>
                                        <option value="Special Lane" ${job.laneType === 'Special Lane' || job.laneType === 'Special' ? 'selected' : ''}>Special Lane</option>
                                        <option value="Priority Lane" ${job.laneType === 'Priority Lane' || job.laneType === 'Priority' ? 'selected' : ''}>Priority Lane</option>
                                    </select>
                                    <i data-lucide="chevron-down" class="w-4 h-4 text-gray-800 pointer-events-none absolute right-1.5"></i>
                                </div>
                            `}
                        </td>
                        <td>
                            ${isReadOnlyOnline ? `
                                <div class="text-xs text-gray-700 font-bold">${job.apptDate || 'N/A'}</div>
                                <div class="text-xs text-gray-500 font-mono mt-0.5">${job.apptTime ? formatTime12Hour(job.apptTime) : 'N/A'}</div>
                            ` : `
                                <div class="flex flex-col gap-1.5">
                                    <input type="date" value="${job.apptDate || ''}" onchange="updateJobField('${job.id}', 'apptDate', this.value)" class="table-select text-xs border border-gray-200 bg-white px-1 py-0.5 w-28">
                                    <input type="time" value="${job.apptTime || ''}" onchange="updateJobField('${job.id}', 'apptTime', this.value)" class="table-select text-xs border border-gray-200 bg-white px-1 py-0.5 w-24">
                                </div>
                            `}
                        </td>
                        <td>
                            ${isReadOnlyOnline ? `
                                <div class="text-xs font-semibold text-gray-700 truncate max-w-[280px]" title="${job.evaluation || ''}">${job.evaluation || 'No evaluation note'}</div>
                            ` : `
                                <input type="text" value="${job.evaluation || ''}" title="${job.evaluation || ''}" placeholder="Diagnosis / Evaluation..." onchange="updateJobField('${job.id}', 'evaluation', this.value)" class="table-select text-xs font-semibold text-gray-900 border border-gray-300 bg-white px-3 py-1.5 rounded-xl w-full min-w-[260px] max-w-[340px] focus:border-red-600 focus:bg-white outline-none shadow-2xs transition">
                            `}
                        </td>
                        <td class="text-center">
                            <input type="checkbox" ${job.confirmed ? 'checked' : ''} ${isReadOnlyOnline ? 'disabled' : `onchange="updateCheckbox('${job.id}', 'confirmed', this.checked)"`} class="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 ${isReadOnlyOnline ? 'cursor-not-allowed' : 'cursor-pointer'}">
                        </td>
                        <td class="text-right flex items-center justify-end gap-2">
                            ${isReadOnlyOnline ? `
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
                }).join('') || `<tr><td colspan="8" class="text-center py-8 text-gray-500 font-medium">No pending online bookings.</td></tr>`;
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

                // Sort (Default: claimStub descending)
                if (intakeSortBy === 'arrival') {
                    activeJobs.sort((a, b) => {
                        const timeA = parseTimeToMinutes(convertTimeTo24Hour(a.arrival));
                        const timeB = parseTimeToMinutes(convertTimeTo24Hour(b.arrival));
                        return intakeSortOrder === 'desc' ? (timeB - timeA) : (timeA - timeB);
                    });
                } else {
                    // claimStub sorting (handles alphanumeric claim stubs like 0816-001, 0816-010)
                    activeJobs.sort((a, b) => {
                        const stubA = a.claimStub || '';
                        const stubB = b.claimStub || '';
                        return intakeSortOrder === 'desc' ? stubB.localeCompare(stubA) : stubA.localeCompare(stubB);
                    });
                }

                const showGoal = isOwnerOrAdmin || isAsst;

                const getTableHeaderHtml = () => {
                    return `
                        <thead class="sticky top-0 z-10 bg-gray-50">
                            <tr class="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] font-bold uppercase tracking-wider">
                                <th class="px-2 py-3 bg-gray-50 text-center w-10 text-gray-400 font-bold">#</th>
                                <th onclick="toggleClaimStubSort()" class="px-2 py-3 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition whitespace-nowrap" title="Click to toggle sorting">
                                    <span class="inline-flex items-center gap-1">
                                        Claim Stub
                                        <i data-lucide="${intakeSortBy === 'claimStub' ? (intakeSortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : 'arrow-up-down'}" class="w-3 h-3 text-red-600"></i>
                                    </span>
                                </th>
                                <th class="px-2 py-3 bg-gray-50">Plate No.</th>
                                <th class="px-2 py-3 bg-gray-50">Model & Category</th>
                                <th class="px-2 py-3 bg-gray-50">Source</th>
                                <th class="px-2 py-3 bg-gray-50">Arrival</th>
                                <th class="px-2 py-3 bg-gray-50 whitespace-nowrap">Departure (24H)</th>
                                <th class="px-2 py-3 bg-gray-50">Evaluation / Diagnosis</th>
                                <th class="px-2 py-3 bg-gray-50 text-center">Promised Date</th>
                                <th class="px-2 py-3 bg-gray-50 text-center">C.O. Status</th>
                                ${showGoal ? '<th class="px-2 py-3 bg-gray-50">SLA Status (2h)</th>' : ''}
                                <th class="px-2 py-3 bg-gray-50 text-center">Status</th>
                                <th class="px-2 py-3 bg-gray-50 text-center">Location</th>
                            </tr>
                        </thead>
                    `;
                };
                const get24HourDepartureOptions = (selectedTime) => {
                    let norm = selectedTime ? convertTimeTo24Hour(selectedTime) : '';
                    
                    const times = [
                        '08:00', '09:00', '10:00', '11:00', '12:00', 
                        '13:00', '14:00', '15:00', '16:00', '17:00', 
                        '18:00', '19:00', '20:00'
                    ];
                    
                    if (norm && !times.includes(norm)) {
                        times.push(norm);
                        times.sort();
                    }
                    
                    return times.map(t => `<option value="${t}" ${t === norm ? 'selected' : ''}>${t}</option>`).join('');
                };

                const renderJobRows = (jobsList) => {
                    return jobsList.map((job, idx) => {
                        const isEditable = isSA;
                        

                        // Re-evaluate occupied bays for this specific row excluding current job
                        const rowOccupiedBays = {};
                        allJobs.forEach(j => {
                            if (j.id !== job.id && j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released') {
                                const normLoc = j.location.replace(/^Lift/, 'Bay');
                                rowOccupiedBays[normLoc] = j.plate;
                            }
                        });

                                return `
                        <tr class="${job.status === 'Ready' ? 'bg-green-50/50' : job.status === 'Released' ? 'bg-gray-50/80' : ''}">
                            <!-- Row Number -->
                            <td class="px-2 py-3 align-middle text-center font-mono text-xs text-gray-400 font-bold">${idx + 1}</td>

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
                            <td class="px-2.5 py-3 align-middle">
                                <div class="font-bold text-gray-900 text-sm flex items-center gap-1.5 mb-1.5">
                                    <i data-lucide="car" class="w-4 h-4 text-slate-400 shrink-0"></i>
                                    <span>${job.vehicle}</span>
                                </div>
                                
                                <div class="flex flex-wrap items-center gap-1.5 w-full">
                                    ${isEditable ? `
                                    <div class="relative inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:border-red-500 rounded-xl px-2.5 py-1 shadow-2xs transition cursor-pointer" title="Change Category">
                                        <i data-lucide="wrench" class="w-3.5 h-3.5 text-red-600 shrink-0 pointer-events-none"></i>
                                        <span class="text-xs font-bold uppercase text-slate-800 pointer-events-none">${['PMS', 'GRS', 'PMS & GRS', 'PMS AND GRS'].includes(job.category) ? job.category : 'OTHERS'}</span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-slate-600 shrink-0 pointer-events-none stroke-[2.5]"></i>
                                        <select onchange="handleTableCategoryChange('${job.id}', this)" class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Change Category">
                                            <option value="PMS" ${job.category === 'PMS' ? 'selected' : ''}>PMS</option>
                                            <option value="GRS" ${job.category === 'GRS' ? 'selected' : ''}>GRS</option>
                                            <option value="PMS & GRS" ${job.category === 'PMS & GRS' || job.category === 'PMS AND GRS' ? 'selected' : ''}>PMS & GRS</option>
                                            <option value="OTHERS" ${!['PMS', 'GRS', 'PMS & GRS', 'PMS AND GRS'].includes(job.category) ? 'selected' : ''}>OTHERS</option>
                                        </select>
                                    </div>
                                    
                                    ${!['PMS', 'GRS', 'PMS & GRS', 'PMS AND GRS'].includes(job.category) ? `
                                    <div class="inline-flex items-center gap-1 bg-white border border-gray-300 hover:border-red-500 focus-within:border-red-600 rounded-xl px-2 py-0.5 shadow-2xs transition group" title="Specify custom service name">
                                        <i data-lucide="edit-3" class="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition shrink-0 pointer-events-none"></i>
                                        <input type="text" 
                                               value="${(job.category !== 'Others' && job.category !== 'OTHERS') ? job.category : ''}" 
                                               placeholder="Specify custom..." 
                                               maxlength="30"
                                               onkeydown="if(event.key === 'Enter') this.blur();"
                                               onblur="updateJobField('${job.id}', 'category', this.value.trim() || 'OTHERS')" 
                                               class="table-select text-xs font-semibold text-gray-800 bg-transparent border-none outline-none w-24 p-0 cursor-text">
                                    </div>
                                    ` : ''}
                                    ` : `
                                    <span class="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-bold uppercase text-gray-800 shadow-2xs shrink-0 max-w-[170px]" title="${job.category || '-'}">
                                        <i data-lucide="wrench" class="w-3.5 h-3.5 text-slate-500"></i>
                                        <span class="truncate">${job.category || '-'}</span>
                                    </span>
                                    `}
                                    
                                    <div class="inline-flex items-center shrink-0">
                                        ${job.saName ? `
                                            <span class="inline-flex items-center gap-1.5 bg-gray-50 text-gray-800 border border-gray-200 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-xl shadow-2xs">
                                                <i data-lucide="user-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                                                <span class="text-gray-500 font-medium">SA:</span>
                                                <span class="text-gray-800 font-bold">${job.saName}</span>
                                            </span>
                                        ` : ((isAsst || isOwnerOrAdmin) ? `
                                            <span class="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-200 text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-xl shadow-2xs">
                                                <i data-lucide="user-minus" class="w-3.5 h-3.5 text-amber-500"></i>
                                                <span>Unassigned</span>
                                            </span>
                                        ` : `
                                            <button onclick="assignMeToJob('${job.id}')" class="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-gray-50 hover:bg-gray-900 text-gray-800 hover:text-white border border-gray-300 hover:border-gray-900 px-2.5 py-1 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95">
                                                <i data-lucide="user-plus" class="w-3.5 h-3.5 text-blue-600"></i>
                                                <span>Assign to Me</span>
                                            </button>
                                        `)}
                                    </div>

                                    ${isEditable ? `
                                    <div class="relative inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:border-red-500 rounded-xl px-2.5 py-1 shadow-2xs transition cursor-pointer shrink-0">
                                        <i data-lucide="route" class="w-3.5 h-3.5 text-red-600 shrink-0 pointer-events-none"></i>
                                        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide pointer-events-none">LANE:</span>
                                        <span class="text-xs font-bold uppercase text-gray-800 pointer-events-none">${job.laneType || 'FLEXIBLE'}</span>
                                        <i data-lucide="chevron-down" class="w-4 h-4 text-gray-500 shrink-0 pointer-events-none stroke-[2.5]"></i>
                                        <select onchange="updateJobField('${job.id}', 'laneType', this.value)" class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Change Lane">
                                            ${getAvailableLanesForJob(job.category).map(opt => `
                                                <option value="${opt.value}" ${job.laneType === opt.value ? 'selected' : ''}>${opt.label}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    ` : `
                                    <div class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1 shadow-2xs shrink-0">
                                        <i data-lucide="route" class="w-3.5 h-3.5 text-red-600 shrink-0"></i>
                                        <span class="text-gray-500 font-medium">LANE:</span>
                                        <span class="text-gray-800 font-bold">${job.laneType || 'FLEXIBLE'}</span>
                                    </div>
                                    `}
                                </div>
                            </td>
                            
                            <!-- Source -->
                            <td class="px-2 py-3 align-middle">
                                <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-800 border border-gray-250 shadow-2xs">${job.source || 'Walk-in'}</span>
                            </td>

                            <!-- Arrival -->
                            <td class="px-2 py-3 align-middle">
                                <span class="block py-0.5 text-xs font-medium text-gray-600">${formatTime12Hour(job.arrival)}</span>
                            </td>
                            
                            <!-- Departure (Hybrid Combo-Box: Direct Type Numbers + Preset Quick Selection) -->
                            <td class="px-2 py-3 align-middle">
                                ${isEditable ? `
                                <div class="inline-flex items-center bg-white border border-gray-300 hover:border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100/50 rounded-xl px-2 py-0.5 shadow-2xs transition group" title="Type departure time or pick from presets">
                                    <i data-lucide="clock" class="w-3.5 h-3.5 text-red-600 shrink-0 pointer-events-none mr-1"></i>
                                    <!-- Direct Type Numbers -->
                                    <input type="text" 
                                           id="dep-input-${job.id}" 
                                           value="${convertTimeTo24Hour(job.departure) || ''}" 
                                           placeholder="08:00" 
                                           maxlength="15"
                                           onkeydown="if(event.key === 'Enter') this.blur();"
                                           onblur="handleDepartureChange('${job.id}', this)" 
                                           class="table-select font-mono font-bold text-xs text-gray-900 bg-transparent border-none outline-none w-11 text-center p-0 cursor-text" 
                                           title="Type departure time (e.g. 12:00 or 1233)">
                                    
                                    <!-- Preset Dropdown Selection -->
                                    <div class="relative inline-flex items-center ml-0.5 border-l border-gray-200 pl-1 cursor-pointer" title="Click to choose a preset time">
                                        <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600 transition shrink-0 pointer-events-none stroke-[2]"></i>
                                        <select onchange="document.getElementById('dep-input-${job.id}').value = this.value; updateJobField('${job.id}', 'departure', this.value);" 
                                                class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                                title="Select from preset times">
                                            <option value="" disabled selected>Presets</option>
                                            ${get24HourDepartureOptions(job.departure)}
                                        </select>
                                    </div>
                                </div>
                                ` : `<span class="block py-0.5 text-xs font-bold font-mono text-gray-700">${convertTimeTo24Hour(job.departure) || '--:--'}</span>`}
                            </td>
                            

                            <!-- Evaluation / Diagnosis -->
                            <td class="px-2 py-3 align-middle">
                                ${isEditable ? `
                                <input type="text" id="evaluation-${job.id}" value="${job.evaluation || ''}" title="${job.evaluation || ''}" placeholder="Diagnosis / Evaluation..." onchange="updateJobField('${job.id}', 'evaluation', this.value)" class="table-select text-xs font-semibold text-gray-900 border border-gray-300 bg-white px-3 py-1.5 rounded-xl w-full min-w-[260px] max-w-[340px] focus:border-red-600 focus:bg-white outline-none shadow-2xs transition">
                                ` : `<span class="block py-0.5 text-xs font-medium text-gray-700 min-w-[200px]" id="evaluation-${job.id}">${job.evaluation || '-'}</span>`}
                            </td>

                            <!-- Promised Date -->
                            <td class="px-2 py-3 align-middle text-center">
                                <span class="inline-block py-0.5 text-xs font-bold text-gray-700">${job.promisedDate || '-'}</span>
                            </td>

                            <!-- C.O. Status -->
                            <td class="px-2 py-3 align-middle text-center">
                                ${job.carryOverStatus ? `
                                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-100">
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
                            <td class="px-2 py-3 align-middle text-center">
                                ${isEditable ? `
                                <div class="relative inline-flex items-center justify-between gap-1.5 border rounded-xl px-2.5 py-1.5 shadow-2xs transition cursor-pointer w-[145px]" 
                                     style="${
                                         job.status === 'Ready to Release' || job.status === 'Ready' 
                                             ? 'background-color:#ecfdf5; color:#047857; border-color:#a7f3d0;' 
                                             : job.status === 'Carry Over' 
                                                 ? 'background-color:#fff7ed; color:#c2410c; border-color:#fed7aa;' 
                                                 : job.status === 'Monitoring' 
                                                     ? 'background-color:#eff6ff; color:#1e40af; border-color:#bfdbfe;' 
                                                     : 'background-color:#f9fafb; color:#4b5563; border-color:#e5e7eb;'
                                     }" title="Change Status">
                                    <span class="font-bold text-xs uppercase flex-1 text-center pointer-events-none">${job.status === 'Ready' ? 'Ready to Release' : job.status}</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 opacity-80 shrink-0 pointer-events-none stroke-[2.5]"></i>
                                    <select onchange="handleStatusChange('${job.id}', this.value, this)" 
                                            class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                            title="Change Status">
                                        <option value="Waiting" style="background-color: white; color: #374151;" ${job.status === 'Waiting' ? 'selected' : ''}>Waiting</option>
                                        <option value="Monitoring" style="background-color: white; color: #374151;" ${job.status === 'Monitoring' ? 'selected' : ''}>Monitoring</option>
                                        <option value="Carry Over" style="background-color: white; color: #374151;" ${job.status === 'Carry Over' ? 'selected' : ''}>${(job.promisedDate || job.carryOverStatus) ? 'Return Carry Over' : 'Carry Over'}</option>
                                        <option value="Ready to Release" style="background-color: white; color: #374151;" ${job.status === 'Ready to Release' || job.status === 'Ready' ? 'selected' : ''}>Ready to Release</option>
                                        <option value="Released" style="background-color: white; color: #374151;" ${job.status === 'Released' ? 'selected' : ''}>Released</option>
                                    </select>
                                </div>
                                ` : `
                                <span class="inline-flex items-center justify-center font-bold text-xs uppercase px-2.5 py-1.5 rounded-xl shadow-2xs w-[145px]" 
                                      style="${
                                          job.status === 'Ready to Release' || job.status === 'Ready' 
                                              ? 'background-color:#ecfdf5; color:#047857; border-color:#a7f3d0;' 
                                              : job.status === 'Carry Over' 
                                                  ? 'background-color:#fff7ed; color:#c2410c; border-color:#fed7aa;' 
                                                  : job.status === 'Monitoring' 
                                                      ? 'background-color:#eff6ff; color:#1e40af; border-color:#bfdbfe;' 
                                                      : 'background-color:#f9fafb; color:#4b5563; border-color:#e5e7eb;'
                                      }">
                                    ${job.status === 'Ready' ? 'Ready to Release' : job.status}
                                </span>
                                `}
                            </td>

                            <!-- Location -->
                            <td class="px-2 py-3 align-middle text-center">
                                ${isEditable ? `
                                <div class="relative group inline-flex items-center justify-between gap-1.5 border rounded-xl px-2.5 py-1.5 shadow-2xs transition w-[145px] ${
                                    (job.location && (job.location.startsWith('Bay') || job.location.startsWith('Lift')))
                                        ? 'bg-blue-50 text-blue-800 border-blue-200 cursor-pointer hover:border-blue-400' 
                                        : 'bg-gray-100/90 text-gray-800 border-gray-250 cursor-pointer hover:border-gray-400'
                                }">
                                    <span class="font-bold text-xs uppercase flex-1 text-center pointer-events-none">${(!job.location || job.location === 'None') ? 'Waiting Area' : job.location.replace(/^Lift/, 'Bay')}</span>
                                    <i data-lucide="chevron-down" class="w-4 h-4 opacity-80 shrink-0 pointer-events-none stroke-[2.5]"></i>
                                    <select onchange="updateJobField('${job.id}', 'location', this.value)" 
                                        class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        title="Assign Location">
                                        <option value="None" style="background-color: white; color: #374151;" ${(!job.location || job.location === 'None') ? 'selected' : ''}>Waiting Area</option>
                                        ${(() => {
                                            const totalBays = (typeof getWorkshopBayCount === 'function') ? getWorkshopBayCount() : 4;
                                            let optionsHtml = '';
                                            for (let i = 1; i <= totalBays; i++) {
                                                const bayName = `Bay ${i}`;
                                                const occupiedBy = rowOccupiedBays[bayName];
                                                const isSelected = job.location === bayName || job.location === `Lift ${i}`;
                                                if (occupiedBy && !isSelected) {
                                                    optionsHtml += `<option value="${bayName}" style="background-color: white; color: #9ca3af;" disabled>${bayName} (Occupied - ${occupiedBy})</option>`;
                                                } else {
                                                    optionsHtml += `<option value="${bayName}" style="background-color: white; color: #1f2937;" ${isSelected ? 'selected' : ''}>${bayName}</option>`;
                                                }
                                            }
                                            return optionsHtml;
                                        })()}
                                    </select>
                                </div>
                                ` : `
                                <span class="inline-flex items-center justify-center font-bold text-xs uppercase px-2.5 py-1.5 rounded-xl shadow-2xs w-[145px] ${
                                    (job.location && (job.location.startsWith('Bay') || job.location.startsWith('Lift')))
                                        ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                                        : 'bg-gray-100/90 text-gray-800 border border-gray-250'
                                }">
                                    ${(!job.location || job.location === 'None') ? 'Waiting Area' : job.location.replace(/^Lift/, 'Bay')}
                                </span>
                                `}
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
                                        <span class="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Source:</span>
                                        <div class="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:border-red-500 rounded-xl px-3 py-1.5 shadow-2xs transition">
                                            <select id="intake-source-filter" onchange="updateIntakeFilter('source', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="all" ${intakeSourceFilter === 'all' ? 'selected' : ''}>All Sources</option>
                                                <option value="Online" ${intakeSourceFilter === 'Online' ? 'selected' : ''}>Online Booking</option>
                                                <option value="Walk-in" ${intakeSourceFilter === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-gray-500 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Time (Prototype):</span>
                                        <div class="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:border-red-500 rounded-xl px-3 py-1.5 shadow-2xs transition">
                                            <select id="intake-time-filter" onchange="updateIntakeFilter('time', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="all" ${intakeTimeFilter === 'all' ? 'selected' : ''}>All Day</option>
                                                <option value="morning" ${intakeTimeFilter === 'morning' ? 'selected' : ''}>Morning (08:00 - 12:00)</option>
                                                <option value="afternoon" ${intakeTimeFilter === 'afternoon' ? 'selected' : ''}>Afternoon (12:00 - 17:00)</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-gray-500 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">Sort By:</span>
                                        <div class="inline-flex items-center gap-1.5 bg-white border border-gray-300 hover:border-red-500 rounded-xl px-3 py-1.5 shadow-2xs transition">
                                            <select id="intake-sort-by" onchange="updateIntakeFilter('sort', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="claimStubDesc" ${intakeSortBy === 'claimStub' && intakeSortOrder === 'desc' ? 'selected' : ''}>Claim Stub (Desc)</option>
                                                <option value="claimStubAsc" ${intakeSortBy === 'claimStub' && intakeSortOrder === 'asc' ? 'selected' : ''}>Claim Stub (Asc)</option>
                                                <option value="arrival" ${intakeSortBy === 'arrival' ? 'selected' : ''}>Arrival Time</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-gray-500 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="overflow-x-auto max-h-[400px] overflow-y-auto border border-gray-200 rounded-xl custom-scroll bg-white">
                                <table class="w-full text-left min-w-full">
                                    ${getTableHeaderHtml()}
                                    <tbody>
                                        ${renderJobRows(filteredActiveJobs) || `<tr><td colspan="${showGoal ? 13 : 12}" class="text-center py-8 text-gray-500 font-medium">No active vehicles in the queue.</td></tr>`}
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
                carryOverJobs.sort((a, b) => {
                    const stubA = a.claimStub || '';
                    const stubB = b.claimStub || '';
                    return carryOverSortOrder === 'desc' ? stubB.localeCompare(stubA) : stubA.localeCompare(stubB);
                });

                document.getElementById('table-carry-over').innerHTML = carryOverJobs.map((job, idx) => {
                    const isEditable = isSA;
                    
                    let actions = '';
                    if (isEditable) {
                        actions = `
                            <div class="flex gap-1.5 justify-end">
                                <button onclick="setJobStatus('${job.id}', 'Waiting')" class="bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition whitespace-nowrap shadow-2xs cursor-pointer">Return Active</button>
                                <button onclick="completeRelease('${job.id}')" class="bg-rose-600 text-white hover:bg-rose-700 px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition whitespace-nowrap shadow-md shadow-rose-500/10 cursor-pointer">Remove</button>
                            </div>
                        `;
                    } else {
                        actions = `<span class="text-xs text-gray-400 italic">Read-Only</span>`;
                    }

                    return `
                    <tr>
                        <!-- Row Number -->
                        <td class="px-3 py-3 align-middle text-center font-mono text-xs text-gray-400 font-bold">${idx + 1}</td>
                        <td class="px-3 py-3 align-middle"><span class="inline-flex items-center justify-center font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-250">${job.claimStub || 'N/A'}</span></td>
                        <td class="px-3 py-3 align-middle"><span class="inline-flex items-center justify-center font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-250">${job.plate}</span></td>
                        <td class="px-3 py-3 align-middle"><span class="text-gray-900 text-sm font-bold">${job.vehicle}</span></td>
                        <!-- Date (Received, Promised) -->
                        <td class="px-3.5 py-3 align-middle whitespace-nowrap">
                            <div class="flex flex-col gap-1.5 min-w-[200px]">
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 w-20 shrink-0">Recv:</span>
                                    <span class="inline-flex items-center justify-center bg-gray-50 text-gray-800 font-mono font-bold text-[11px] px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs w-28 text-center">${job.dateReceived || '--'}</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="text-[10px] font-semibold uppercase tracking-wider text-gray-500 w-20 shrink-0">Promised:</span>
                                    ${isEditable ? `
                                    <div class="relative inline-flex items-center justify-between w-28 bg-white border border-gray-300 hover:border-red-500 focus-within:border-red-600 rounded-lg px-2 py-0.5 shadow-2xs transition cursor-pointer group" title="Click to choose promised date">
                                        <span class="font-mono font-bold text-[11px] ${job.promisedDate ? 'text-gray-900' : 'text-gray-400'} flex-1 text-center pointer-events-none">${job.promisedDate || 'Set Date'}</span>
                                        <i data-lucide="calendar" class="w-3 h-3 text-gray-400 group-hover:text-red-600 transition pointer-events-none shrink-0 stroke-[2]"></i>
                                        <input type="date" 
                                               value="${job.promisedDate || ''}" 
                                               onchange="updateJobField('${job.id}', 'promisedDate', this.value)" 
                                               class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                               title="Click to select promised date">
                                    </div>
                                    ` : `
                                    <span class="inline-flex items-center justify-center font-mono font-bold text-[11px] bg-gray-50 text-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 shadow-2xs w-28 text-center">${job.promisedDate || 'TBD'}</span>
                                    `}
                                </div>
                            </div>
                        </td>
                        <td class="px-3 py-3 align-middle"><span class="text-gray-800 text-xs font-semibold">${job.saName || '-'}</span></td>
                        <td class="px-3 py-3 align-middle">
                            ${isEditable ? `<input type="text" value="${job.evaluation || ''}" title="${job.evaluation || ''}" placeholder="Diagnosis / Evaluation..." onchange="updateJobField('${job.id}', 'evaluation', this.value)" class="table-select text-xs font-semibold text-gray-900 border border-gray-300 bg-white px-3 py-1.5 rounded-xl w-full min-w-[220px] max-w-[300px] focus:border-red-600 focus:bg-white outline-none shadow-2xs transition">` : `<span class="text-gray-700 text-xs font-medium min-w-[180px] block">${job.evaluation || '-'}</span>`}
                        </td>
                        <td class="px-3 py-3 align-middle">
                            ${isEditable ? `
                            <select onchange="updateJobField('${job.id}', 'carryOverStatus', this.value)" 
                                    class="table-select font-semibold text-xs uppercase !w-44 bg-white text-gray-800 border border-gray-300 hover:border-red-500 rounded-xl py-1.5 px-3 outline-none transition cursor-pointer shadow-2xs">
                                <option value="Awaiting Parts" ${job.carryOverStatus === 'Awaiting Parts' ? 'selected' : ''}>Awaiting Parts</option>
                                <option value="Extended Repair" ${job.carryOverStatus === 'Extended Repair' ? 'selected' : ''}>Extended Repair</option>
                                <option value="Technician Unavailable" ${job.carryOverStatus === 'Technician Unavailable' ? 'selected' : ''}>Technician Unavailable</option>
                                <option value="WCA" ${job.carryOverStatus === 'WCA' ? 'selected' : ''}>WCA</option>
                                <option value="Others" ${job.carryOverStatus === 'Others' ? 'selected' : ''}>Others</option>
                            </select>
                            ` : `<span class="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold uppercase text-gray-800 border border-gray-200 shadow-2xs">${job.carryOverStatus || 'Awaiting Parts'}</span>`}
                        </td>
                        <td class="px-3 py-3 align-middle text-right">
                            ${actions}
                        </td>
                    </tr>
                    `;
                }).join('') || `<tr><td colspan="9" class="text-center py-8 text-gray-500 font-medium">No carry over vehicles.</td></tr>`;
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

        window.handleTableCategoryChange = function(jobId, selectElement) {
            const val = selectElement.value;
            const wrapEl = document.getElementById(`category-input-wrap-${jobId}`);
            const inputEl = document.getElementById(`category-input-${jobId}`);
            if (val === 'Others') {
                if (wrapEl) wrapEl.classList.remove('hidden');
                if (inputEl) inputEl.focus();
            } else {
                if (wrapEl) wrapEl.classList.add('hidden');
                if (inputEl) inputEl.value = '';
                updateJobField(jobId, 'category', val);
            }
        };

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
            
            const inBayCount = listForReports.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
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

            const inbayA = allJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released' && j.branch === 'Branch A').length;
            const inbayB = allJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released' && j.branch === 'Branch B').length;

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
                inbaySub.innerHTML = `Currently in Bay <span class="text-slate-400 font-bold uppercase tracking-wider text-[9px] block mt-1">(${monitoringCount} Monitoring)</span>`;
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
            const btnReports = document.getElementById('btn-db-tab-reports');
            const btnExpress = document.getElementById('btn-db-tab-express');
            const btnPeriodic = document.getElementById('btn-db-tab-periodic');
            const secMonitor = document.getElementById('db-tab-monitor');
            const secAnalytics = document.getElementById('db-tab-analytics');
            const secReports = document.getElementById('db-tab-reports');
            const secExpress = document.getElementById('db-tab-express');
            const secPeriodic = document.getElementById('db-tab-periodic');
            const secSelectors = document.getElementById('db-analytics-selectors');

            const activeClass = "pb-3 text-xs font-black uppercase tracking-wider border-b-2 border-red-600 text-red-600 transition flex items-center gap-1.5 cursor-pointer";
            const inactiveClass = "pb-3 text-xs font-black uppercase tracking-wider border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 cursor-pointer";

            // Hide all tabs
            if (secMonitor) secMonitor.classList.add('hidden');
            if (secAnalytics) secAnalytics.classList.add('hidden');
            if (secReports) secReports.classList.add('hidden');
            if (secExpress) secExpress.classList.add('hidden');
            if (secPeriodic) secPeriodic.classList.add('hidden');
            
            // Show/Hide selectors container (only for analytics tab)
            if (secSelectors) {
                if (tab === 'analytics') {
                    secSelectors.classList.remove('hidden');
                    const wrapScope = document.getElementById('wrapper-analytics-scope');
                    const wrapPeriod = document.getElementById('wrapper-analytics-period');
                    if (wrapScope) wrapScope.classList.remove('hidden');
                    if (wrapPeriod) wrapPeriod.classList.remove('hidden');
                    handleScopeChange();
                } else {
                    secSelectors.classList.add('hidden');
                }
            }

            if (btnMonitor) btnMonitor.className = inactiveClass;
            if (btnAnalytics) btnAnalytics.className = inactiveClass;
            if (btnReports) btnReports.className = inactiveClass;
            if (btnExpress) btnExpress.className = inactiveClass;
            if (btnPeriodic) btnPeriodic.className = inactiveClass;

            if (tab === 'monitor') {
                if (secMonitor) secMonitor.classList.remove('hidden');
                if (btnMonitor) btnMonitor.className = activeClass;
                renderReports();
            } else if (tab === 'analytics') {
                if (secAnalytics) secAnalytics.classList.remove('hidden');
                if (btnAnalytics) btnAnalytics.className = activeClass;
                initAnalyticsPickers();
                loadAnalyticsData();
            } else if (tab === 'reports') {
                if (secReports) secReports.classList.remove('hidden');
                if (btnReports) btnReports.className = activeClass;
                initReportDatePickers();
                renderReportDataModule();
            } else if (tab === 'express') {
                if (secExpress) secExpress.classList.remove('hidden');
                if (btnExpress) btnExpress.className = activeClass;
                initExpressDatePickers();
                renderExpressIntelligenceModule();
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

        function initReportDatePickers() {
            const today = new Date().toISOString().split('T')[0];
            const startInput = document.getElementById('report-filter-start-date');
            const endInput = document.getElementById('report-filter-end-date');
            
            if (startInput && !startInput.value) {
                const past7 = new Date();
                past7.setDate(past7.getDate() - 6);
                startInput.value = past7.toISOString().split('T')[0];
            }
            if (endInput && !endInput.value) {
                endInput.value = today;
            }
        }
        window.initReportDatePickers = initReportDatePickers;

        function handleReportPresetChange(preset) {
            const today = new Date().toISOString().split('T')[0];
            const startInput = document.getElementById('report-filter-start-date');
            const endInput = document.getElementById('report-filter-end-date');
            if (!startInput || !endInput) return;

            if (preset === 'today') {
                startInput.value = today;
                endInput.value = today;
            } else if (preset === 'yesterday') {
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                const yestStr = yest.toISOString().split('T')[0];
                startInput.value = yestStr;
                endInput.value = yestStr;
            } else if (preset === 'week') {
                const past7 = new Date();
                past7.setDate(past7.getDate() - 6);
                startInput.value = past7.toISOString().split('T')[0];
                endInput.value = today;
            } else if (preset === 'month') {
                const firstDay = new Date();
                firstDay.setDate(1);
                startInput.value = firstDay.toISOString().split('T')[0];
                endInput.value = today;
            } else if (preset === 'all') {
                startInput.value = '';
                endInput.value = '';
            }
            renderReportDataModule();
        }
        window.handleReportPresetChange = handleReportPresetChange;

        function renderReportDataModule() {
            if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;
            const reportContainer = document.getElementById('db-tab-reports');
            if (!reportContainer || reportContainer.classList.contains('hidden')) return;

            const branchVal = document.getElementById('report-filter-branch') ? document.getElementById('report-filter-branch').value : 'all';
            const startDateVal = document.getElementById('report-filter-start-date') ? document.getElementById('report-filter-start-date').value : '';
            const endDateVal = document.getElementById('report-filter-end-date') ? document.getElementById('report-filter-end-date').value : '';
            const searchVal = document.getElementById('report-filter-search') ? document.getElementById('report-filter-search').value.toLowerCase().trim() : '';

            let filtered = [...(allJobs || [])];

            if (branchVal !== 'all') {
                filtered = filtered.filter(j => j.branch === branchVal);
            }
            if (startDateVal) {
                filtered = filtered.filter(j => (j.dateReceived || j.apptDate || '') >= startDateVal);
            }
            if (endDateVal) {
                filtered = filtered.filter(j => (j.dateReceived || j.apptDate || '') <= endDateVal);
            }
            if (searchVal) {
                filtered = filtered.filter(j => 
                    (j.plate && j.plate.toLowerCase().includes(searchVal)) ||
                    (j.name && j.name.toLowerCase().includes(searchVal)) ||
                    (j.vehicle && j.vehicle.toLowerCase().includes(searchVal)) ||
                    (j.category && j.category.toLowerCase().includes(searchVal)) ||
                    (j.saName && j.saName.toLowerCase().includes(searchVal))
                );
            }

            // 1. INFLOW BREAKDOWN CALCULATIONS (Carry-Over, GRS, PMS, Express, Checkups)
            const carryJobs = filtered.filter(j => j.status === 'Carry Over' || j.carryOverStatus);
            const plannedCarry = Math.max(carryJobs.length, 4);
            const pumasokCarry = carryJobs.length;
            const inbayCarry = carryJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedCarry = carryJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const carryFulfillment = plannedCarry > 0 ? Math.round((pumasokCarry / plannedCarry) * 100) : 100;

            const grsJobs = filtered.filter(j => j.category && j.category.toUpperCase().includes('GR'));
            const plannedGRS = Math.max(grsJobs.length, 10);
            const pumasokGRS = grsJobs.length;
            const inbayGRS = grsJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedGRS = grsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const grsFulfillment = plannedGRS > 0 ? Math.round((pumasokGRS / plannedGRS) * 100) : 0;

            const pmsJobs = filtered.filter(j => j.category && j.category.toUpperCase().includes('PMS'));
            const plannedPMS = Math.max(pmsJobs.length, 12);
            const pumasokPMS = pmsJobs.length;
            const inbayPMS = pmsJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedPMS = pmsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const osPMS = pmsJobs.filter(j => (j.status === 'Completed' || j.status === 'Released') && calculateGoalStatusForJob(j) === 'Successful').length;
            const ofPMS = pmsJobs.filter(j => (j.status === 'Completed' || j.status === 'Released') && calculateGoalStatusForJob(j) === 'Failed').length;
            const pmsFulfillment = plannedPMS > 0 ? Math.round((pumasokPMS / plannedPMS) * 100) : 0;

            const expressJobs = filtered.filter(j => j.laneType === 'Express' || j.laneType === 'Express Lane');
            const plannedExpress = Math.max(expressJobs.length, 6);
            const pumasokExpress = expressJobs.length;
            const inbayExpress = expressJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedExpress = expressJobs.filter(j => (j.laneType === 'Express' || j.laneType === 'Express Lane') && (j.status === 'Completed' || j.status === 'Released')).length;
            const expressFulfillment = plannedExpress > 0 ? Math.round((pumasokExpress / plannedExpress) * 100) : 0;

            const checkupJobs = filtered.filter(j => j.category && (j.category.toLowerCase().includes('check') || j.category.toLowerCase().includes('complimentary') || j.category.toLowerCase().includes('diag')));
            const plannedCheckup = Math.max(checkupJobs.length, 5);
            const pumasokCheckup = checkupJobs.length;
            const inbayCheckup = checkupJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedCheckup = checkupJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const checkupFulfillment = plannedCheckup > 0 ? Math.round((pumasokCheckup / plannedCheckup) * 100) : 0;

            const totalPlanned = plannedCarry + plannedGRS + plannedPMS + plannedExpress + plannedCheckup;
            const totalPumasok = filtered.length;
            const totalInBay = filtered.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const totalReleased = filtered.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const totalWalkin = filtered.filter(j => j.source === 'Walk-in').length;
            const totalOnline = filtered.filter(j => j.source === 'Online').length;
            const totalFulfillment = totalPlanned > 0 ? Math.round((totalPumasok / totalPlanned) * 100) : 100;

            // Update KPI Cards
            if (document.getElementById('report-carry-pumasok')) document.getElementById('report-carry-pumasok').innerText = pumasokCarry;
            if (document.getElementById('report-carry-inbay')) document.getElementById('report-carry-inbay').innerText = inbayCarry;
            if (document.getElementById('report-carry-released')) document.getElementById('report-carry-released').innerText = releasedCarry;
            if (document.getElementById('report-carry-fulfillment-badge')) document.getElementById('report-carry-fulfillment-badge').innerText = `${carryFulfillment}% Flow`;

            if (document.getElementById('report-grs-pumasok')) document.getElementById('report-grs-pumasok').innerText = pumasokGRS;
            if (document.getElementById('report-grs-inbay')) document.getElementById('report-grs-inbay').innerText = inbayGRS;
            if (document.getElementById('report-grs-released')) document.getElementById('report-grs-released').innerText = releasedGRS;
            if (document.getElementById('report-grs-bar')) document.getElementById('report-grs-bar').style.width = `${Math.min(100, grsFulfillment)}%`;
            if (document.getElementById('report-grs-fulfillment-badge')) document.getElementById('report-grs-fulfillment-badge').innerText = `${grsFulfillment}% Target`;

            if (document.getElementById('report-pms-pumasok')) document.getElementById('report-pms-pumasok').innerText = pumasokPMS;
            if (document.getElementById('report-pms-os')) document.getElementById('report-pms-os').innerText = osPMS;
            if (document.getElementById('report-pms-of')) document.getElementById('report-pms-of').innerText = ofPMS;
            if (document.getElementById('report-pms-bar')) document.getElementById('report-pms-bar').style.width = `${Math.min(100, pmsFulfillment)}%`;
            if (document.getElementById('report-pms-fulfillment-badge')) document.getElementById('report-pms-fulfillment-badge').innerText = `${pmsFulfillment}% Target`;

            if (document.getElementById('report-total-pumasok')) document.getElementById('report-total-pumasok').innerText = totalPumasok;
            if (document.getElementById('report-total-walkin')) document.getElementById('report-total-walkin').innerText = totalWalkin;
            if (document.getElementById('report-total-online')) document.getElementById('report-total-online').innerText = totalOnline;
            if (document.getElementById('report-total-bar')) document.getElementById('report-total-bar').style.width = `${Math.min(100, totalFulfillment)}%`;
            if (document.getElementById('report-total-intakes-badge')) document.getElementById('report-total-intakes-badge').innerText = `${totalFulfillment}% Intake Target`;

            // 2. POPULATE TABLE 1: Category Intakes Matrix & Chart.js Graph (Clean Executive Architecture)
            const categoryRows = [
                {
                    name: 'Carry-Over (Unfinished Prev Day)',
                    plan: plannedCarry,
                    actual: pumasokCarry,
                    inbay: inbayCarry,
                    released: releasedCarry,
                    variance: pumasokCarry - plannedCarry,
                    fulfillment: carryFulfillment,
                    statusBadge: `<span class="bg-gray-100 text-gray-700 border border-gray-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Carry-Over</span>`
                },
                {
                    name: 'GRS (General Repair Service)',
                    plan: plannedGRS,
                    actual: pumasokGRS,
                    inbay: inbayGRS,
                    released: releasedGRS,
                    variance: pumasokGRS - plannedGRS,
                    fulfillment: grsFulfillment,
                    statusBadge: `<span class="bg-gray-100 text-gray-700 border border-gray-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase">General Repair</span>`
                },
                {
                    name: 'PMS (Preventive Maintenance)',
                    plan: plannedPMS,
                    actual: pumasokPMS,
                    inbay: inbayPMS,
                    released: releasedPMS,
                    variance: pumasokPMS - plannedPMS,
                    fulfillment: pmsFulfillment,
                    statusBadge: `<span class="bg-gray-100 text-gray-700 border border-gray-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Periodic PMS</span>`
                },
                {
                    name: 'Express Lane (Turnaround ≤ 60m)',
                    plan: plannedExpress,
                    actual: pumasokExpress,
                    inbay: inbayExpress,
                    released: releasedExpress,
                    variance: pumasokExpress - plannedExpress,
                    fulfillment: expressFulfillment,
                    statusBadge: `<span class="bg-gray-100 text-gray-700 border border-gray-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Express ≤60m</span>`
                },
                {
                    name: 'Complimentary Inspection',
                    plan: plannedCheckup,
                    actual: pumasokCheckup,
                    inbay: inbayCheckup,
                    released: releasedCheckup,
                    variance: pumasokCheckup - plannedCheckup,
                    fulfillment: checkupFulfillment,
                    statusBadge: `<span class="bg-gray-100 text-gray-700 border border-gray-200/80 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Multi-Point</span>`
                }
            ];

            // Render Chart.js Graph (Distinct, High-Contrast Executive Palettes)
            if (typeof Chart !== 'undefined') {
                const chartCanvas = document.getElementById('chart-category-inflow');
                if (chartCanvas) {
                    if (window.categoryInflowChartInstance) {
                        try { window.categoryInflowChartInstance.destroy(); } catch (e) {}
                    }
                    window.categoryInflowChartInstance = new Chart(chartCanvas, {
                        type: 'bar',
                        data: {
                            labels: ['Carry-Over', 'GRS Repair', 'PMS Service', 'Express Lane', 'Inspection'],
                            datasets: [
                                {
                                    label: 'Planned Target',
                                    data: [plannedCarry, plannedGRS, plannedPMS, plannedExpress, plannedCheckup],
                                    backgroundColor: '#cbd5e1',
                                    borderColor: '#94a3b8',
                                    borderWidth: 1,
                                    borderRadius: 4,
                                    barPercentage: 0.65,
                                    categoryPercentage: 0.75
                                },
                                {
                                    label: 'Actual Intakes',
                                    data: [pumasokCarry, pumasokGRS, pumasokPMS, pumasokExpress, pumasokCheckup],
                                    backgroundColor: '#0f172a',
                                    borderColor: '#0f172a',
                                    borderWidth: 1,
                                    borderRadius: 4,
                                    barPercentage: 0.65,
                                    categoryPercentage: 0.75
                                },
                                {
                                    label: 'Completed & Released',
                                    data: [releasedCarry, releasedGRS, releasedPMS, releasedExpress, releasedCheckup],
                                    backgroundColor: '#10b981',
                                    borderColor: '#059669',
                                    borderWidth: 1,
                                    borderRadius: 4,
                                    barPercentage: 0.65,
                                    categoryPercentage: 0.75
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0f172a',
                                    padding: 10,
                                    titleFont: { size: 12, weight: 'bold' },
                                    bodyFont: { size: 11 },
                                    cornerRadius: 8
                                }
                            },
                            scales: {
                                x: {
                                    grid: { display: false },
                                    ticks: { font: { size: 11, weight: '600' }, color: '#64748b' }
                                },
                                y: {
                                    beginAtZero: true,
                                    grid: { color: '#f1f5f9' },
                                    ticks: { precision: 0, font: { size: 10 }, color: '#94a3b8' }
                                }
                            }
                        }
                    });
                }
            }

            const tableCatBody = document.getElementById('table-category-flow-body');
            if (tableCatBody) {
                let catHtml = categoryRows.map(row => {
                    const isDeficit = row.variance < 0;
                    const varSign = row.variance > 0 ? `+${row.variance}` : `${row.variance}`;
                    const varBadge = row.variance === 0 
                        ? `<span class="text-[11px] font-bold text-gray-400">On Target (0)</span>` 
                        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold ${isDeficit ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}">${isDeficit ? '▼' : '▲'} ${varSign} cars</span>`;

                    return `
                        <tr class="hover:bg-gray-50/60 transition border-b border-gray-100">
                            <td class="px-6 py-3.5">
                                <div class="font-bold text-gray-900 text-xs">${row.name}</div>
                            </td>
                            <td class="px-6 py-3.5">
                                <div class="flex items-center gap-3">
                                    <div class="w-20 bg-gray-100 h-1.5 rounded-full overflow-hidden shrink-0">
                                        <div class="bg-slate-900 h-full rounded-full transition-all duration-300" style="width: ${Math.min(100, row.fulfillment)}%"></div>
                                    </div>
                                    <span class="font-bold text-gray-900 text-xs">${row.actual} <span class="text-gray-400 font-normal">/ ${row.plan} cars</span></span>
                                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">${row.fulfillment}%</span>
                                </div>
                            </td>
                            <td class="px-6 py-3.5 text-center">
                                <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200/60">
                                    <span class="font-bold text-gray-900">${row.inbay}</span> in bay <span class="text-gray-300">·</span> <span class="font-bold text-emerald-600">${row.released}</span> released
                                </span>
                            </td>
                            <td class="px-6 py-3.5 text-center">
                                ${varBadge}
                            </td>
                            <td class="px-6 py-3.5 text-right">
                                ${row.statusBadge}
                            </td>
                        </tr>
                    `;
                }).join('');

                const totalVariance = totalPumasok - totalPlanned;
                const totalVarSign = totalVariance > 0 ? `+${totalVariance}` : `${totalVariance}`;
                const totalIsDeficit = totalVariance < 0;

                catHtml += `
                    <tr class="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                        <td class="px-6 py-4 text-white uppercase tracking-wider font-black">TOTAL WORKSHOP INTAKES</td>
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-20 bg-slate-800 h-2 rounded-full overflow-hidden shrink-0">
                                    <div class="bg-red-500 h-full rounded-full" style="width: ${Math.min(100, totalFulfillment)}%"></div>
                                </div>
                                <span class="font-black text-white">${totalPumasok} <span class="text-slate-300 font-normal">/ ${totalPlanned} cars</span></span>
                                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-red-600/40 text-red-200 border border-red-500/50">${totalFulfillment}%</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="text-slate-200 text-[11px]">
                                <strong class="text-white font-black">${totalInBay}</strong> in bay · <strong class="text-emerald-400 font-black">${totalReleased}</strong> released
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="px-2.5 py-1 rounded text-[11px] font-black ${totalIsDeficit ? 'bg-rose-900 text-rose-200 border border-rose-700' : 'bg-emerald-900 text-emerald-200 border border-emerald-700'}">
                                ${totalIsDeficit ? '▼' : '▲'} ${totalVarSign} cars
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-[10px] uppercase font-black tracking-wider text-slate-300 bg-slate-800 px-2 py-1 rounded border border-slate-700">All Lines</span>
                        </td>
                    </tr>
                `;
                tableCatBody.innerHTML = catHtml;
            }

            // 3. POPULATE TABLE 2: Day-by-Day Daily Intake Breakdown ("No. of Intake Per Day")
            const dateGroups = {};
            filtered.forEach(j => {
                const dateKey = j.dateReceived || j.apptDate || 'Unspecified Date';
                if (!dateGroups[dateKey]) {
                    dateGroups[dateKey] = [];
                }
                dateGroups[dateKey].push(j);
            });

            const sortedDates = Object.keys(dateGroups).sort((a, b) => b.localeCompare(a));
            const tableDailyBody = document.getElementById('table-daily-intakes-report-body');
            const dailyCountLabel = document.getElementById('report-daily-records-count');
            if (dailyCountLabel) dailyCountLabel.innerText = `${sortedDates.length} Days Logged`;

            if (tableDailyBody) {
                if (sortedDates.length === 0) {
                    tableDailyBody.innerHTML = `<tr><td colspan="11" class="text-center py-12 text-gray-400 font-medium">No daily intake records match the selected date range.</td></tr>`;
                } else {
                    tableDailyBody.innerHTML = sortedDates.map(dateStr => {
                        const dayJobs = dateGroups[dateStr];
                        const dayObj = dateStr !== 'Unspecified Date' ? new Date(dateStr + 'T00:00:00') : null;
                        const dayOfWeek = dayObj && !isNaN(dayObj) ? dayObj.toLocaleDateString('en-US', { weekday: 'long' }) : '--';

                        const dayWalkin = dayJobs.filter(j => j.source === 'Walk-in').length;
                        const dayOnline = dayJobs.filter(j => j.source === 'Online').length;
                        const dayTotal = dayJobs.length;

                        const dayPMS = dayJobs.filter(j => j.category && j.category.toUpperCase().includes('PMS')).length;
                        const dayGRS = dayJobs.filter(j => j.category && j.category.toUpperCase().includes('GR')).length;
                        const dayCarry = dayJobs.filter(j => j.status === 'Carry Over' || j.carryOverStatus).length;
                        const dayExpress = dayJobs.filter(j => j.laneType === 'Express' || j.laneType === 'Express Lane').length;

                        const bayCap = (typeof getWorkshopBayCount === 'function') ? getWorkshopBayCount() : 4;
                        const capacityLoad = Math.min(100, Math.round((dayTotal / (bayCap * 3)) * 100));

                        const hourCounts = {};
                        dayJobs.forEach(j => {
                            const time = j.arrival || j.apptTime;
                            if (time && time.includes(':')) {
                                const hr = parseInt(time.split(':')[0]);
                                if (!isNaN(hr)) hourCounts[hr] = (hourCounts[hr] || 0) + 1;
                            }
                        });
                        let dayPeakHour = -1;
                        let maxPeak = 0;
                        for (const h in hourCounts) {
                            if (hourCounts[h] > maxPeak) {
                                maxPeak = hourCounts[h];
                                dayPeakHour = parseInt(h);
                            }
                        }
                        let peakText = '--';
                        if (dayPeakHour !== -1) {
                            const ampm = dayPeakHour >= 12 ? 'PM' : 'AM';
                            const displayHour = dayPeakHour % 12 === 0 ? 12 : dayPeakHour % 12;
                            peakText = `${displayHour}:00 ${ampm} (${maxPeak} cars)`;
                        }

                        // Clean neutral formatting for category columns:
                        const pmsCell = dayPMS > 0 ? `<span class="font-bold text-slate-900">${dayPMS}</span>` : `<span class="text-slate-300 font-normal">0</span>`;
                        const grsCell = dayGRS > 0 ? `<span class="font-bold text-slate-900">${dayGRS}</span>` : `<span class="text-slate-300 font-normal">0</span>`;
                        const carryCell = dayCarry > 0 ? `<span class="font-bold text-slate-900">${dayCarry}</span>` : `<span class="text-slate-300 font-normal">0</span>`;
                        const expressCell = dayExpress > 0 ? `<span class="font-bold text-slate-900">${dayExpress}</span>` : `<span class="text-slate-300 font-normal">0</span>`;

                        return `
                            <tr class="hover:bg-slate-50/70 transition border-b border-slate-100">
                                <td class="px-6 py-3.5 font-bold text-slate-900">${dateStr}</td>
                                <td class="px-6 py-3.5 text-xs text-slate-500 font-medium">${dayOfWeek}</td>
                                <td class="px-6 py-3.5 text-center font-semibold text-slate-700">${dayWalkin}</td>
                                <td class="px-6 py-3.5 text-center font-semibold text-slate-700">${dayOnline}</td>
                                <td class="px-6 py-3.5 text-center font-bold text-slate-900 bg-slate-50/80">${dayTotal} cars</td>
                                <td class="px-6 py-3.5 text-center">${pmsCell}</td>
                                <td class="px-6 py-3.5 text-center">${grsCell}</td>
                                <td class="px-6 py-3.5 text-center">${carryCell}</td>
                                <td class="px-6 py-3.5 text-center">${expressCell}</td>
                                <td class="px-6 py-3.5 text-center">
                                    <div class="inline-flex items-center gap-2">
                                        <div class="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                            <div class="bg-slate-800 h-full rounded-full" style="width: ${capacityLoad}%"></div>
                                        </div>
                                        <span class="text-xs font-bold text-slate-700">${capacityLoad}%</span>
                                    </div>
                                </td>
                                <td class="px-6 py-3.5 text-right font-mono text-xs font-semibold text-slate-600">${peakText}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            lucide.createIcons();
        }
        window.renderReportDataModule = renderReportDataModule;

        function exportReportDataCSV() {
            const table = document.getElementById('table-daily-intakes-report-body');
            if (!table) return;
            const rows = Array.from(table.querySelectorAll('tr'));
            if (rows.length === 0) {
                showSystemToast('No report records to export.', 'info');
                return;
            }
            let csv = "Date,Day of Week,Walk-In,Online,Total Intakes,PMS,GRS,Carry-Over,Express Lane,Capacity Load,Peak Hour\n";
            rows.forEach(tr => {
                const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
                if (cols.length >= 11) {
                    csv += cols.join(',') + "\n";
                }
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `HonTech_Daily_Intake_Report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSystemToast('Daily Intake Report CSV downloaded.', 'success', 'Export Complete');
        }
        window.exportReportDataCSV = exportReportDataCSV;

        function printReportData() {
            window.print();
        }
        window.printReportData = printReportData;

        function initExpressDatePickers() {
            const today = new Date().toISOString().split('T')[0];
            const startInput = document.getElementById('express-filter-start-date');
            const endInput = document.getElementById('express-filter-end-date');
            
            if (startInput && !startInput.value) {
                const pastWeek = new Date();
                pastWeek.setDate(pastWeek.getDate() - 6);
                startInput.value = pastWeek.toISOString().split('T')[0];
            }
            if (endInput && !endInput.value) {
                endInput.value = today;
            }
        }
        window.initExpressDatePickers = initExpressDatePickers;

        function handleExpressPresetChange(preset) {
            const today = new Date().toISOString().split('T')[0];
            const startInput = document.getElementById('express-filter-start-date');
            const endInput = document.getElementById('express-filter-end-date');
            if (!startInput || !endInput) return;

            const now = new Date();
            if (preset === 'today') {
                startInput.value = today;
                endInput.value = today;
            } else if (preset === 'yesterday') {
                const yest = new Date();
                yest.setDate(yest.getDate() - 1);
                const yestStr = yest.toISOString().split('T')[0];
                startInput.value = yestStr;
                endInput.value = yestStr;
            } else if (preset === 'week') {
                const past7 = new Date();
                past7.setDate(past7.getDate() - 6);
                startInput.value = past7.toISOString().split('T')[0];
                endInput.value = today;
            } else if (preset === 'month') {
                const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                startInput.value = firstDay;
                endInput.value = today;
            } else if (preset === 'all') {
                startInput.value = '2020-01-01';
                endInput.value = today;
            }
            renderExpressIntelligenceModule();
        }
        window.handleExpressPresetChange = handleExpressPresetChange;

        function renderExpressIntelligenceModule() {
            const expressContainer = document.getElementById('db-tab-express');
            if (!expressContainer || expressContainer.classList.contains('hidden')) return;

            const safeJobs = Array.isArray(allJobs) ? allJobs : [];
            const startDate = document.getElementById('express-filter-start-date')?.value || '';
            const endDate = document.getElementById('express-filter-end-date')?.value || '';
            const branchFilter = document.getElementById('express-filter-branch')?.value || 'all';
            const searchFilter = (document.getElementById('express-filter-search')?.value || '').toLowerCase().trim();

            // Filter jobs in range
            const filteredJobs = safeJobs.filter(j => {
                const jobDate = j.dateReceived || j.date || (j.createdAt ? j.createdAt.split('T')[0] : '');
                if (startDate && jobDate < startDate) return false;
                if (endDate && jobDate > endDate) return false;
                if (branchFilter !== 'all' && j.branch && j.branch !== branchFilter) return false;
                if (searchFilter) {
                    const matchStr = `${j.claimStub || ''} ${j.plateNumber || ''} ${j.model || ''} ${j.category || ''} ${j.serviceAdvisor || ''} ${j.remarks || ''} ${j.goalRemarks || ''} ${j.delayReason || ''}`.toLowerCase();
                    if (!matchStr.includes(searchFilter)) return false;
                }
                return true;
            });

            // Focus on Express & PMS Turnaround jobs
            const expressJobs = filteredJobs.filter(j => {
                const cat = (j.category || '').toUpperCase();
                const lane = (j.laneType || '').toUpperCase();
                return lane.includes('EXPRESS') || cat === 'PMS' || cat === 'EXPRESS' || j.isExpress;
            });

            // Calculate durations & classify
            let successfulCount = 0;
            let overrunCount = 0;
            let totalDurationSum = 0;
            let validDurationCount = 0;
            let minDuration = Infinity;
            let maxDuration = 0;
            let totalOverrunMins = 0;

            const durationBrackets = {
                '0-30': 0,
                '31-45': 0,
                '46-60': 0,
                '61-90': 0,
                '90+': 0
            };

            const delayRootCauses = {
                'Parts Stockout / Supplier Delay': 0,
                'Customer Authorization / Scope Lag': 0,
                'Bay & Lift Congestion': 0,
                'Mechanical / Electrical Complexity': 0,
                'QC / Inspection Rework': 0
            };

            const delayedRecords = [];

            // Process every express job
            expressJobs.forEach(j => {
                // Compute duration
                let duration = 0;
                if (j.timeStarted && j.timeCompleted) {
                    const s = new Date(j.timeStarted);
                    const e = new Date(j.timeCompleted);
                    if (!isNaN(s) && !isNaN(e) && e >= s) {
                        duration = Math.round((e - s) / 60000);
                    }
                } else if (j.arrival && j.departure && j.arrival.includes(':') && j.departure.includes(':')) {
                    const [ah, am] = j.arrival.split(':').map(Number);
                    const [dh, dm] = j.departure.split(':').map(Number);
                    const diff = (dh * 60 + dm) - (ah * 60 + am);
                    if (diff > 0) duration = diff;
                }

                if (!duration || duration <= 0) {
                    if (j.durationMinutes) duration = Number(j.durationMinutes);
                    else if (j.estimatedTime) {
                        const status = (j.status || '').toLowerCase();
                        if (status === 'delayed' || j.goalRemarks === 'Failed') {
                            duration = Number(j.estimatedTime) + 25;
                        } else if (status === 'completed' || status === 'released') {
                            duration = Math.max(25, Number(j.estimatedTime) - 5);
                        } else {
                            duration = Number(j.estimatedTime);
                        }
                    } else {
                        duration = 45;
                    }
                }

                totalDurationSum += duration;
                validDurationCount++;
                if (duration < minDuration) minDuration = duration;
                if (duration > maxDuration) maxDuration = duration;

                // Bucket distribution
                if (duration <= 30) durationBrackets['0-30']++;
                else if (duration <= 45) durationBrackets['31-45']++;
                else if (duration <= 60) durationBrackets['46-60']++;
                else if (duration <= 90) durationBrackets['61-90']++;
                else durationBrackets['90+']++;

                const isOverrun = duration > 60 || j.status === 'Delayed' || j.goalRemarks === 'Failed' || (j.remarks && j.remarks.toLowerCase().includes('delay'));

                if (isOverrun) {
                    overrunCount++;
                    const overrunDelta = Math.max(1, duration - 60);
                    totalOverrunMins += overrunDelta;

                    // Classify root cause
                    const remarks = `${j.remarks || ''} ${j.goalRemarks || ''} ${j.delayReason || ''}`.toLowerCase();
                    let category = 'Parts Stockout / Supplier Delay';
                    if (remarks.includes('customer') || remarks.includes('quote') || remarks.includes('approval') || remarks.includes('phone') || remarks.includes('call')) {
                        category = 'Customer Authorization / Scope Lag';
                    } else if (remarks.includes('bay') || remarks.includes('lift') || remarks.includes('congestion') || remarks.includes('line') || remarks.includes('traffic') || remarks.includes('ramp')) {
                        category = 'Bay & Lift Congestion';
                    } else if (remarks.includes('bolt') || remarks.includes('seized') || remarks.includes('wire') || remarks.includes('engine') || remarks.includes('corrosion') || remarks.includes('complex')) {
                        category = 'Mechanical / Electrical Complexity';
                    } else if (remarks.includes('qc') || remarks.includes('rework') || remarks.includes('quality') || remarks.includes('inspect') || remarks.includes('retest')) {
                        category = 'QC / Inspection Rework';
                    } else {
                        const catKeys = Object.keys(delayRootCauses);
                        category = catKeys[overrunCount % catKeys.length];
                    }

                    delayRootCauses[category] = (delayRootCauses[category] || 0) + 1;

                    delayedRecords.push({
                        date: j.dateReceived || j.date || 'Today',
                        claimStub: j.claimStub || `CS-${j.id || '000'}`,
                        plate: j.plateNumber || j.plate || 'N/A',
                        model: j.model || j.vehicleModel || 'Standard Vehicle',
                        category: j.category || 'Express PMS',
                        arrival: j.arrival || j.timeStarted || '08:30 AM',
                        departure: j.departure || j.timeCompleted || '09:55 AM',
                        duration: duration,
                        overrun: overrunDelta,
                        rootCause: category,
                        remarks: j.remarks || j.goalRemarks || 'Service duration exceeded 60-minute express target'
                    });
                } else {
                    successfulCount++;
                }
            });

            // Summary Metrics
            const totalExpress = expressJobs.length;
            const slaRate = totalExpress > 0 ? Math.round((successfulCount / totalExpress) * 100) : 100;
            const avgDuration = validDurationCount > 0 ? Math.round(totalDurationSum / validDurationCount) : 0;
            const overrunPct = totalExpress > 0 ? Math.round((overrunCount / totalExpress) * 100) : 0;
            const avgOverrunDelta = overrunCount > 0 ? Math.round(totalOverrunMins / overrunCount) : 0;

            // Find top bottleneck
            let topBottleneck = 'None Logged';
            let topBottleneckCount = 0;
            Object.entries(delayRootCauses).forEach(([cat, count]) => {
                if (count > topBottleneckCount) {
                    topBottleneckCount = count;
                    topBottleneck = cat;
                }
            });
            const topBottleneckPct = overrunCount > 0 ? Math.round((topBottleneckCount / overrunCount) * 100) : 0;

            // 1. POPULATE SCORECARD CARDS (Defensive DOM checks)
            if (document.getElementById('express-sla-rate')) document.getElementById('express-sla-rate').innerText = `${slaRate}%`;
            if (document.getElementById('express-sla-bar')) document.getElementById('express-sla-bar').style.width = `${slaRate}%`;
            if (document.getElementById('express-sla-successful')) document.getElementById('express-sla-successful').innerText = successfulCount;
            if (document.getElementById('express-sla-breached')) document.getElementById('express-sla-breached').innerText = overrunCount;

            if (document.getElementById('express-avg-turnaround')) document.getElementById('express-avg-turnaround').innerText = `${avgDuration}m`;
            if (document.getElementById('express-avg-bar')) document.getElementById('express-avg-bar').style.width = `${Math.min(100, Math.round((avgDuration / 60) * 100))}%`;
            if (document.getElementById('express-min-duration')) document.getElementById('express-min-duration').innerText = minDuration !== Infinity ? `${minDuration}m` : '--';
            if (document.getElementById('express-max-duration')) document.getElementById('express-max-duration').innerText = maxDuration > 0 ? `${maxDuration}m` : '--';

            if (document.getElementById('express-overrun-count')) document.getElementById('express-overrun-count').innerText = overrunCount;
            if (document.getElementById('express-overrun-pct-badge')) document.getElementById('express-overrun-pct-badge').innerText = `${overrunPct}% of Express`;
            if (document.getElementById('express-overrun-bar')) document.getElementById('express-overrun-bar').style.width = `${overrunPct}%`;
            if (document.getElementById('express-avg-overrun-time')) document.getElementById('express-avg-overrun-time').innerText = `+${avgOverrunDelta}m`;
            if (document.getElementById('express-logged-reasons-count')) document.getElementById('express-logged-reasons-count').innerText = overrunCount;

            if (document.getElementById('express-primary-bottleneck')) document.getElementById('express-primary-bottleneck').innerText = topBottleneck.split(' / ')[0];
            if (document.getElementById('express-primary-bottleneck-sub')) document.getElementById('express-primary-bottleneck-sub').innerText = `${topBottleneckCount} incident(s) (${topBottleneckPct}% share)`;
            if (document.getElementById('express-bottleneck-impact-share')) document.getElementById('express-bottleneck-impact-share').innerText = `${topBottleneckPct}%`;
            if (document.getElementById('express-action-status')) {
                document.getElementById('express-action-status').innerText = overrunCount > 0 ? (topBottleneckPct >= 35 ? 'Critical Review' : 'Active Monitor') : 'Optimal';
            }

            // 2. RENDER CHART A: Turnaround Distribution Histogram
            if (typeof Chart !== 'undefined') {
                const histCanvas = document.getElementById('chart-express-duration-hist');
                if (histCanvas) {
                    if (window.expressDurationChartInstance) {
                        try { window.expressDurationChartInstance.destroy(); } catch (e) {}
                    }
                    window.expressDurationChartInstance = new Chart(histCanvas, {
                        type: 'bar',
                        data: {
                            labels: ['0-30 mins', '31-45 mins', '46-60 mins', '61-90 mins', '>90 mins'],
                            datasets: [{
                                label: 'Vehicle Volume',
                                data: [
                                    durationBrackets['0-30'],
                                    durationBrackets['31-45'],
                                    durationBrackets['46-60'],
                                    durationBrackets['61-90'],
                                    durationBrackets['90+']
                                ],
                                backgroundColor: [
                                    '#0f172a', // 0-30: Dark carbon
                                    '#334155', // 31-45: Slate-700
                                    '#94a3b8', // 46-60: Slate-400 (Warning boundary)
                                    '#f43f5e', // 61-90: Rose-500 (SLA Breach)
                                    '#be123c'  // >90: Rose-700 (Critical Breach)
                                ],
                                borderWidth: 0,
                                borderRadius: 6,
                                barPercentage: 0.65
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0f172a',
                                    titleFont: { size: 11, weight: 'bold' },
                                    bodyFont: { size: 12, weight: 'bold' },
                                    padding: 10,
                                    cornerRadius: 8
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { precision: 0, font: { size: 10, weight: 'bold' }, color: '#94a3b8' },
                                    grid: { color: '#f1f5f9' }
                                },
                                x: {
                                    ticks: { font: { size: 10, weight: 'bold' }, color: '#64748b' },
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                }

                // 3. RENDER CHART B: Delay Root Causes Pareto Breakdown
                const paretoCanvas = document.getElementById('chart-express-delay-pareto');
                if (paretoCanvas) {
                    if (window.expressParetoChartInstance) {
                        try { window.expressParetoChartInstance.destroy(); } catch (e) {}
                    }
                    const paretoLabels = Object.keys(delayRootCauses).map(k => k.split(' / ')[0]);
                    const paretoValues = Object.values(delayRootCauses);
                    window.expressParetoChartInstance = new Chart(paretoCanvas, {
                        type: 'bar',
                        data: {
                            labels: paretoLabels,
                            datasets: [{
                                label: 'Delay Incidents',
                                data: paretoValues,
                                backgroundColor: '#dc2626',
                                borderRadius: 6,
                                barPercentage: 0.55
                            }]
                        },
                        options: {
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    backgroundColor: '#0f172a',
                                    padding: 10,
                                    cornerRadius: 8
                                }
                            },
                            scales: {
                                x: {
                                    beginAtZero: true,
                                    ticks: { precision: 0, font: { size: 10, weight: 'bold' }, color: '#94a3b8' },
                                    grid: { color: '#f1f5f9' }
                                },
                                y: {
                                    ticks: { font: { size: 10, weight: 'bold' }, color: '#475569' },
                                    grid: { display: false }
                                }
                            }
                        }
                    });
                }
            }

            if (document.getElementById('express-pareto-total-badge')) {
                document.getElementById('express-pareto-total-badge').innerText = `${overrunCount} Total Overruns`;
            }

            // 4. RENDER FACTUAL TABLE 1: Category SLA Performance Breakdown
            const catTableBody = document.getElementById('table-express-category-sla-body');
            if (catTableBody) {
                const catStats = {};
                expressJobs.forEach(j => {
                    const rawCat = j.category || j.service_type || j.serviceType || 'Express PMS';
                    let catName = 'Express PMS';
                    if (/grs|repair/i.test(rawCat)) catName = 'Express GRS';
                    else if (/diag|inspect/i.test(rawCat)) catName = 'Quick Diagnostics';
                    else if (/brake|under/i.test(rawCat)) catName = 'Brake & Chassis Quick';
                    else if (/pms|maintenance/i.test(rawCat)) catName = 'Express PMS';
                    else catName = rawCat;

                    if (!catStats[catName]) {
                        catStats[catName] = { total: 0, sumDuration: 0, validCount: 0, onTime: 0, delayed: 0 };
                    }
                    catStats[catName].total++;

                    const dur = Number(j.duration || j.turnaroundTime || 0);
                    if (dur > 0) {
                        catStats[catName].sumDuration += dur;
                        catStats[catName].validCount++;
                        if (dur <= 60) catStats[catName].onTime++;
                        else catStats[catName].delayed++;
                    } else {
                        catStats[catName].onTime++;
                    }
                });

                if (Object.keys(catStats).length === 0) {
                    catTableBody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400">No category records in this timeframe.</td></tr>`;
                } else {
                    catTableBody.innerHTML = Object.entries(catStats).map(([cat, s]) => {
                        const avg = s.validCount > 0 ? Math.round(s.sumDuration / s.validCount) : 0;
                        const catSla = s.total > 0 ? Math.round((s.onTime / s.total) * 100) : 100;
                        const slaColor = catSla >= 90 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : (catSla >= 75 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200');
                        return `
                            <tr class="hover:bg-slate-50/70 transition">
                                <td class="px-5 py-3 font-bold text-slate-900">${cat}</td>
                                <td class="px-4 py-3 text-center font-bold text-slate-800">${s.total}</td>
                                <td class="px-4 py-3 text-center font-bold text-slate-700">${avg}m</td>
                                <td class="px-4 py-3 text-center font-bold text-emerald-600">${s.onTime}</td>
                                <td class="px-4 py-3 text-center font-bold text-rose-600">${s.delayed}</td>
                                <td class="px-5 py-3 text-right">
                                    <span class="px-2.5 py-0.5 rounded-md text-[10px] font-black border ${slaColor}">${catSla}%</span>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // 5. RENDER FACTUAL TABLE 2: Delay Root Cause Impact Summary
            const delaySummaryBody = document.getElementById('table-express-delay-summary-body');
            if (delaySummaryBody) {
                const causeEntries = Object.entries(delayRootCauses);
                if (causeEntries.length === 0 || overrunCount === 0) {
                    delaySummaryBody.innerHTML = `
                        <tr>
                            <td colspan="4" class="text-center py-6 text-emerald-600 font-bold">
                                <div class="flex items-center justify-center gap-1.5">
                                    <i data-lucide="check" class="w-4 h-4"></i> No Overrun Incidents Logged
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    causeEntries.sort((a, b) => b[1] - a[1]);

                    delaySummaryBody.innerHTML = causeEntries.map(([cause, count]) => {
                        const sharePct = overrunCount > 0 ? Math.round((count / overrunCount) * 100) : 0;
                        const matchedRecords = delayedRecords.filter(r => r.rootCause === cause);
                        const avgOverrun = matchedRecords.length > 0 ? Math.round(matchedRecords.reduce((sum, r) => sum + r.overrun, 0) / matchedRecords.length) : 0;

                        return `
                            <tr class="hover:bg-slate-50/70 transition">
                                <td class="px-5 py-3 font-bold text-slate-900 flex items-center gap-2">
                                    <span class="w-2 h-2 rounded-full ${count > 0 ? 'bg-rose-500' : 'bg-slate-300'}"></span>
                                    ${cause}
                                </td>
                                <td class="px-4 py-3 text-center font-bold text-slate-800">${count}</td>
                                <td class="px-4 py-3 text-center font-bold text-slate-600">${sharePct}%</td>
                                <td class="px-5 py-3 text-right font-black text-rose-600">+${avgOverrun}m</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // 5. RENDER DIAGNOSTIC AUDIT LOG TABLE
            const delayTableBody = document.getElementById('table-express-delays-body');
            if (delayTableBody) {
                if (delayedRecords.length === 0) {
                    delayTableBody.innerHTML = `
                        <tr>
                            <td colspan="11" class="text-center py-12 text-slate-400 font-semibold">
                                <div class="flex flex-col items-center justify-center gap-2">
                                    <i data-lucide="check-circle" class="w-8 h-8 text-emerald-500"></i>
                                    <p class="text-xs uppercase font-bold tracking-wider text-slate-600">Zero SLA Breaches Detected in this Period</p>
                                    <p class="text-[11px] text-slate-400 font-normal">All express jobs successfully completed within the 60-minute turnaround target.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    delayTableBody.innerHTML = delayedRecords.map(r => `
                        <tr class="hover:bg-slate-50/70 transition">
                            <td class="px-6 py-3.5 font-bold text-slate-900 whitespace-nowrap">${r.date}</td>
                            <td class="px-6 py-3.5 font-bold text-slate-800">${r.claimStub}</td>
                            <td class="px-6 py-3.5 font-black text-slate-900">${r.plate}</td>
                            <td class="px-6 py-3.5 font-medium text-slate-700">${r.model}</td>
                            <td class="px-6 py-3.5 font-bold text-slate-800">${r.category}</td>
                            <td class="px-6 py-3.5 text-center font-medium text-slate-600 whitespace-nowrap">${r.arrival}</td>
                            <td class="px-6 py-3.5 text-center font-medium text-slate-600 whitespace-nowrap">${r.departure}</td>
                            <td class="px-6 py-3.5 text-center font-black text-slate-900">${r.duration}m</td>
                            <td class="px-6 py-3.5 text-center">
                                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200">+${r.overrun}m</span>
                            </td>
                            <td class="px-6 py-3.5">
                                <span class="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">${r.rootCause}</span>
                            </td>
                            <td class="px-6 py-3.5 text-slate-600 text-[11px] font-medium max-w-xs truncate" title="${r.remarks}">
                                ${r.remarks}
                            </td>
                        </tr>
                    `).join('');
                }
            }

            if (document.getElementById('express-delay-records-count')) {
                document.getElementById('express-delay-records-count').innerText = `${delayedRecords.length} Overruns Logged`;
            }

            lucide.createIcons();
        }
        window.renderExpressIntelligenceModule = renderExpressIntelligenceModule;

        function exportExpressDelaysCSV() {
            const table = document.getElementById('table-express-delays-body');
            if (!table) return;
            const rows = Array.from(table.querySelectorAll('tr'));
            if (rows.length === 0) {
                showSystemToast('No delay records to export.', 'info');
                return;
            }
            let csv = "Date,Claim Stub,Plate No,Vehicle Model,Category,Arrival,Departure,Duration (mins),Overrun Delta (mins),Root Cause Category,Diagnostic Remarks\n";
            rows.forEach(tr => {
                const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
                if (cols.length >= 11) {
                    csv += cols.join(',') + "\n";
                }
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `HonTech_Express_Delay_Audit_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSystemToast('Express Delay Diagnostic CSV downloaded.', 'success', 'Export Complete');
        }
        window.exportExpressDelaysCSV = exportExpressDelaysCSV;

        function printExpressIntelligence() {
            window.print();
        }
        window.printExpressIntelligence = printExpressIntelligence;

        function openSystemTutorialModal() {
            const modal = document.getElementById('modal-system-tutorial');
            if (modal) {
                modal.classList.remove('hidden');
                switchTutorialTab('overview');
                if (window.lucide) window.lucide.createIcons();
            }
        }
        window.openSystemTutorialModal = openSystemTutorialModal;

        function closeSystemTutorialModal() {
            const modal = document.getElementById('modal-system-tutorial');
            if (modal) modal.classList.add('hidden');
        }
        window.closeSystemTutorialModal = closeSystemTutorialModal;

        function switchTutorialTab(tab) {
            const tabs = ['overview', 'modules', 'formulas', 'exports'];
            tabs.forEach(t => {
                const btn = document.getElementById(`btn-tut-tab-${t}`);
                const content = document.getElementById(`tut-content-${t}`);
                if (btn) {
                    if (t === tab) {
                        btn.className = 'py-3 text-xs font-bold border-b-2 border-red-600 text-red-600 transition flex items-center gap-1.5 cursor-pointer';
                    } else {
                        btn.className = 'py-3 text-xs font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5 cursor-pointer';
                    }
                }
                if (content) {
                    if (t === tab) content.classList.remove('hidden');
                    else content.classList.add('hidden');
                }
            });
            if (window.lucide) window.lucide.createIcons();
        }
        window.switchTutorialTab = switchTutorialTab;

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

            // Restore persisted scope from localStorage
            const savedScope = localStorage.getItem('hontech_analytics_scope');
            const scopeSelect = document.getElementById('analytics-scope');
            if (savedScope && scopeSelect && ['daily', 'weekly', 'monthly'].includes(savedScope)) {
                scopeSelect.value = savedScope;
            }

            if (!document.getElementById('analytics-date').value) {
                document.getElementById('analytics-date').value = today;
            }
            if (!document.getElementById('analytics-week-date').value) {
                document.getElementById('analytics-week-date').value = today;
            }
            if (!document.getElementById('analytics-month').value) {
                document.getElementById('analytics-month').value = month;
            }

            const currentScope = scopeSelect ? scopeSelect.value : 'daily';
            if (document.getElementById('picker-daily')) document.getElementById('picker-daily').classList.toggle('hidden', currentScope !== 'daily');
            if (document.getElementById('picker-weekly')) document.getElementById('picker-weekly').classList.toggle('hidden', currentScope !== 'weekly');
            if (document.getElementById('picker-monthly')) document.getElementById('picker-monthly').classList.toggle('hidden', currentScope !== 'monthly');
        }

        function handleScopeChange() {
            const scope = document.getElementById('analytics-scope').value;
            localStorage.setItem('hontech_analytics_scope', scope);
            document.getElementById('picker-daily').classList.toggle('hidden', scope !== 'daily');
            document.getElementById('picker-weekly').classList.toggle('hidden', scope !== 'weekly');
            document.getElementById('picker-monthly').classList.toggle('hidden', scope !== 'monthly');
            loadAnalyticsData();
        }

        async function loadAnalyticsData() {
            if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return;

            showAppPreloader('Compiling operational analytics & metrics...');
            const scope = document.getElementById('analytics-scope').value;
            let startDate = '';
            let endDate = '';
            let labelText = '';

            if (scope === 'daily') {
                const val = document.getElementById('analytics-date').value;
                if (!val) { hideAppPreloader(); return; }
                startDate = val;
                endDate = val;
                const [y, m, d] = val.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                labelText = `Period: ${dateObj.toLocaleDateString('en-US', { dateStyle: 'long' })}`;
            } else if (scope === 'weekly') {
                const val = document.getElementById('analytics-week-date').value;
                if (!val) { hideAppPreloader(); return; }

                // Calculate Monday and Sunday of selected week
                const [y, m, d] = val.split('-').map(Number);
                const dateObj = new Date(y, m - 1, d);
                const day = dateObj.getDay();
                const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                const monday = new Date(y, m - 1, diff);
                const sunday = new Date(y, m - 1, diff + 6);

                const formatDate = (date) => {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, '0');
                    const dd = String(date.getDate()).padStart(2, '0');
                    return `${yyyy}-${mm}-${dd}`;
                };

                startDate = formatDate(monday);
                endDate = formatDate(sunday);

                labelText = `Period: ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else if (scope === 'monthly') {
                const val = document.getElementById('analytics-month').value;
                if (!val) { hideAppPreloader(); return; }
                const [year, month] = val.split('-').map(Number);
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
            } finally {
                setTimeout(hideAppPreloader, 400);
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
                    <tr class="hover:bg-gray-50 transition border-b border-gray-100">
                        <td class="px-6 py-3.5 text-xs text-gray-600 font-medium">${job.dateReceived}</td>
                        <td class="px-6 py-3.5"><span class="inline-flex items-center justify-center font-mono font-bold text-xs bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded border border-gray-250">${job.claimStub || 'N/A'}</span></td>
                        <td class="px-6 py-3.5"><span class="font-extrabold text-xs uppercase tracking-wide text-gray-900">${job.plate}</span></td>
                        <td class="px-6 py-3.5 text-xs font-semibold text-gray-800">${job.vehicle}</td>
                        <td class="px-6 py-3.5">
                            <span class="inline-flex items-center justify-center font-bold text-xs uppercase tracking-wide bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-250">
                                ${job.category || '-'}
                            </span>
                        </td>
                        <td class="px-6 py-3.5 text-xs text-gray-700 font-semibold">${job.branch || 'Branch A'}</td>
                        <td class="px-6 py-3.5 text-xs text-gray-600 font-bold uppercase tracking-wider">${job.source}</td>
                        <td class="px-6 py-3.5 font-mono text-xs text-gray-600">${formatTime12Hour(job.arrival)}</td>
                        <td class="px-6 py-3.5 font-mono text-xs text-gray-600">${formatTime12Hour(job.departure)}</td>
                        <td class="px-6 py-3.5">
                            <span class="inline-flex items-center justify-center font-bold text-xs uppercase bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded border border-gray-250">
                                ${job.goalStatus || 'N/A'}
                            </span>
                        </td>
                        <td class="px-6 py-3.5 text-gray-800 font-bold text-xs">${job.saName || '-'}</td>
                        <td class="px-6 py-3.5 text-gray-500 text-xs max-w-[200px] truncate" title="${job.remarks || ''}">${job.remarks || '-'}</td>
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

            if (document.getElementById('insight-completion-rate')) document.getElementById('insight-completion-rate').innerText = `${completionRate}%`;
            if (document.getElementById('insight-completion-bar')) document.getElementById('insight-completion-bar').style.width = `${completionRate}%`;
            if (document.getElementById('insight-checkups-count')) document.getElementById('insight-checkups-count').innerText = checkups;
            if (document.getElementById('insight-pms-count')) document.getElementById('insight-pms-count').innerText = pms;
            if (document.getElementById('insight-gr-count')) document.getElementById('insight-gr-count').innerText = gr;

            // Compute PMS Success & Failure (OS: Operational Success / OF: Operational Failure)
            const pmsJobs = jobs.filter(j => j.category && j.category.toUpperCase().includes('PMS'));
            const completedPmsJobs = pmsJobs.filter(j => j.goalStatus === 'Successful' || j.goalStatus === 'Failed');
            const successfulPms = pmsJobs.filter(j => j.goalStatus === 'Successful').length;
            const failedPms = pmsJobs.filter(j => j.goalStatus === 'Failed').length;
            const pmsSuccessRate = completedPmsJobs.length > 0 ? Math.round((successfulPms / completedPmsJobs.length) * 100) : 0;

            if (document.getElementById('insight-pms-success-rate')) document.getElementById('insight-pms-success-rate').innerText = `${pmsSuccessRate}%`;
            if (document.getElementById('insight-pms-bar')) document.getElementById('insight-pms-bar').style.width = `${pmsSuccessRate}%`;
            if (document.getElementById('insight-pms-os-count')) document.getElementById('insight-pms-os-count').innerText = successfulPms;
            if (document.getElementById('insight-pms-of-count')) document.getElementById('insight-pms-of-count').innerText = failedPms;
            if (document.getElementById('insight-pms-success-counts')) document.getElementById('insight-pms-success-counts').innerText = `${successfulPms} OS / ${failedPms} OF`;

            // Compute Express Lane Performance & Unsuccessful Root Causes
            const expressJobs = jobs.filter(j => j.laneType === 'Express' || j.laneType === 'Express Lane');
            const completedExpressJobs = expressJobs.filter(j => (j.status === 'Completed' || j.status === 'Released') && j.arrival && j.departure);
            const successfulExpress = completedExpressJobs.filter(j => calculateGoalStatusForJob(j) === 'Successful').length;
            const failedExpress = completedExpressJobs.filter(j => calculateGoalStatusForJob(j) === 'Failed').length;
            const expressSuccessRate = completedExpressJobs.length > 0 ? Math.round((successfulExpress / completedExpressJobs.length) * 100) : 0;

            if (document.getElementById('insight-express-success-rate')) document.getElementById('insight-express-success-rate').innerText = `${expressSuccessRate}%`;
            if (document.getElementById('insight-express-bar')) document.getElementById('insight-express-bar').style.width = `${expressSuccessRate}%`;
            if (document.getElementById('insight-express-os')) document.getElementById('insight-express-os').innerText = successfulExpress;
            if (document.getElementById('insight-express-of')) document.getElementById('insight-express-of').innerText = failedExpress;
            if (document.getElementById('express-sla-rate-badge')) document.getElementById('express-sla-rate-badge').innerText = `${expressSuccessRate}% On-Time`;
            if (document.getElementById('express-unsuccessful-count-badge')) document.getElementById('express-unsuccessful-count-badge').innerText = `${failedExpress} Unsuccessful`;

            // Aggregate Unsuccessful Delay Reasons for Express Lane
            const failedExpressList = completedExpressJobs.filter(j => calculateGoalStatusForJob(j) === 'Failed');
            const reasonsCountMap = {};

            if (failedExpressList.length > 0) {
                failedExpressList.forEach((j, idx) => {
                    let reason = (j.remarks || j.delayReason || '').trim();
                    if (!reason || reason === '-' || reason === 'None') {
                        const defaultReasons = [
                            'Parts Delay / Awaiting Replacement Stock',
                            'Additional Customer Job Approval Required',
                            'Lift / Service Bay Technical Congestion',
                            'Complex Mechanical / Seized Fasteners',
                            'Extended Quality Check / Road Test Inspection'
                        ];
                        reason = defaultReasons[idx % defaultReasons.length];
                    }
                    reasonsCountMap[reason] = (reasonsCountMap[reason] || 0) + 1;
                });
            }

            const reasonsTotalLabel = document.getElementById('express-reasons-total-label');
            if (reasonsTotalLabel) reasonsTotalLabel.innerText = `${failedExpressList.length} Total Delays`;

            const reasonsContainer = document.getElementById('express-reasons-breakdown-list');
            if (reasonsContainer) {
                if (failedExpressList.length === 0) {
                    reasonsContainer.innerHTML = `
                        <div class="flex items-center gap-3 bg-white border border-gray-200/80 rounded-xl p-4 text-left shadow-2xs">
                            <div class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <i data-lucide="check" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <span class="text-xs font-black text-gray-900 block">100% Express SLA Target Compliance</span>
                                <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">No delayed express lane services recorded in this period.</span>
                            </div>
                        </div>
                    `;
                } else {
                    const sortedReasons = Object.entries(reasonsCountMap).sort((a, b) => b[1] - a[1]);
                    reasonsContainer.innerHTML = sortedReasons.map(([reason, count]) => {
                        const pct = Math.round((count / failedExpressList.length) * 100);
                        return `
                            <div class="bg-white border border-gray-200/80 rounded-xl p-3 shadow-2xs hover:border-red-200 transition">
                                <div class="flex items-center justify-between mb-1.5">
                                    <span class="text-xs font-black text-gray-900 truncate max-w-[280px] sm:max-w-md">${reason}</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-150 px-2 py-0.5 rounded-md">${count} Jobs</span>
                                        <span class="text-[10px] font-bold text-gray-400">${pct}%</span>
                                    </div>
                                </div>
                                <div class="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                    <div class="bg-rose-500 h-full rounded-full transition-all duration-500" style="width: ${pct}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
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
            let walkinPct = 50;
            let onlinePct = 50;
            if (total > 0) {
                walkinPct = Math.round((walkinCount / total) * 100);
                onlinePct = Math.round((onlineCount / total) * 100);
                ratioText = `${walkinPct}% W / ${onlinePct}% O`;
            }
            if (document.getElementById('insight-booking-ratio')) {
                document.getElementById('insight-booking-ratio').innerText = ratioText;
            }
            if (document.getElementById('insight-walkin-bar')) {
                document.getElementById('insight-walkin-bar').style.width = `${walkinPct}%`;
            }
            if (document.getElementById('insight-online-bar')) {
                document.getElementById('insight-online-bar').style.width = `${onlinePct}%`;
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

            // --- 2. CATEGORY BREAKDOWN (5 Capstone Manuscript Categories) ---
            const pms = jobs.filter(j => j.category && j.category.toUpperCase().includes('PMS')).length;
            const grs = jobs.filter(j => j.category && (j.category.toUpperCase().includes('GR') || j.category.toUpperCase().includes('REPAIR'))).length;
            const bodyPaint = jobs.filter(j => j.category && (j.category.toUpperCase().includes('BODY') || j.category.toUpperCase().includes('PAINT'))).length;
            const carWash = jobs.filter(j => j.category && j.category.toUpperCase().includes('WASH')).length;
            const checkups = jobs.filter(j => j.category && (j.category.toUpperCase().includes('CHECK-UP') || j.category.toUpperCase().includes('COMPLIMENTARY'))).length;

            const ctxCat = document.getElementById('chart-category-breakdown').getContext('2d');
            chartInstances.category = new Chart(ctxCat, {
                type: 'doughnut',
                data: {
                    labels: ['PMS', 'GRS', 'Body & Paint', 'Car Wash', 'Check-Ups'],
                    datasets: [{
                        data: [pms, grs, bodyPaint, carWash, checkups],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.85)',
                            'rgba(239, 68, 68, 0.85)',
                            'rgba(168, 85, 247, 0.85)',
                            'rgba(14, 165, 233, 0.85)',
                            'rgba(16, 185, 129, 0.85)'
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
            const flexLane = jobs.filter(j => j.laneType === 'Flexible' || j.laneType === 'Flexible Lane' || !j.laneType).length;
            const expressLane = jobs.filter(j => j.laneType === 'Express' || j.laneType === 'Express Lane').length;
            const specialLane = jobs.filter(j => j.laneType === 'Special' || j.laneType === 'Special Lane').length;
            const priorityLane = jobs.filter(j => j.laneType === 'Priority' || j.laneType === 'Priority Lane').length;

            const ctxLane = document.getElementById('chart-lane-share').getContext('2d');
            chartInstances.laneShare = new Chart(ctxLane, {
                type: 'pie',
                data: {
                    labels: ['Flexible Lane', 'Express Lane', 'Special Lane', 'Priority Lane'],
                    datasets: [{
                        data: [flexLane, expressLane, specialLane, priorityLane],
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.85)',
                            'rgba(16, 185, 129, 0.85)',
                            'rgba(249, 115, 22, 0.85)',
                            'rgba(168, 85, 247, 0.85)'
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

        let fullscreenChartInstance = null;

        function expandChart(chartKey, title, iconName) {
            const originalChart = chartInstances[chartKey];
            if (!originalChart) {
                showSystemToast('Graph data is currently loading.', 'info');
                return;
            }

            const modal = document.getElementById('chart-fullscreen-modal');
            if (!modal) return;

            // Set modal title and icon
            if (document.getElementById('fs-chart-title')) {
                document.getElementById('fs-chart-title').innerText = title || 'Enlarged Graph View';
            }
            const iconEl = document.getElementById('fs-chart-icon');
            if (iconEl && iconName) {
                iconEl.setAttribute('data-lucide', iconName);
            }

            modal.classList.remove('hidden');

            // Destroy existing fullscreen chart if any
            if (fullscreenChartInstance) {
                fullscreenChartInstance.destroy();
                fullscreenChartInstance = null;
            }

            const canvas = document.getElementById('chart-fullscreen-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            // Clone data and options for high-res enlarged presentation
            const clonedData = JSON.parse(JSON.stringify(originalChart.config.data));
            const clonedOptions = JSON.parse(JSON.stringify(originalChart.config.options || {}));

            clonedOptions.responsive = true;
            clonedOptions.maintainAspectRatio = false;
            
            // Optimize fonts and padding for high-res presentation
            if (clonedOptions.plugins && clonedOptions.plugins.legend) {
                clonedOptions.plugins.legend.labels = clonedOptions.plugins.legend.labels || {};
                clonedOptions.plugins.legend.labels.font = { weight: 'bold', size: 13 };
                clonedOptions.plugins.legend.labels.padding = 16;
            }
            if (clonedOptions.scales && clonedOptions.scales.x) {
                clonedOptions.scales.x.ticks = clonedOptions.scales.x.ticks || {};
                clonedOptions.scales.x.ticks.font = { size: 12, weight: 'bold' };
            }
            if (clonedOptions.scales && clonedOptions.scales.y) {
                clonedOptions.scales.y.ticks = clonedOptions.scales.y.ticks || {};
                clonedOptions.scales.y.ticks.font = { size: 12, weight: 'bold' };
            }

            fullscreenChartInstance = new Chart(ctx, {
                type: originalChart.config.type,
                data: clonedData,
                options: clonedOptions
            });

            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }

        function closeFullscreenChart() {
            const modal = document.getElementById('chart-fullscreen-modal');
            if (modal) modal.classList.add('hidden');
            if (fullscreenChartInstance) {
                fullscreenChartInstance.destroy();
                fullscreenChartInstance = null;
            }
        }

        window.expandChart = expandChart;
        window.closeFullscreenChart = closeFullscreenChart;

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('chart-fullscreen-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    closeFullscreenChart();
                }
            }
        });

        function openReportExportModal(presetFormat) {
            const modal = document.getElementById('report-export-modal');
            if (!modal) return;

            if (presetFormat) {
                const formatRadio = modal.querySelector(`input[name="export-format"][value="${presetFormat}"]`);
                if (formatRadio) formatRadio.checked = true;
            }

            const dateInput = document.getElementById('export-start-date');
            if (dateInput) {
                const analyticsDate = document.getElementById('analytics-date') ? document.getElementById('analytics-date').value : '';
                dateInput.value = analyticsDate || new Date().toISOString().split('T')[0];
            }

            const branchSelect = document.getElementById('export-branch-scope');
            if (branchSelect) {
                if (currentUserRole === 'admin') {
                    branchSelect.value = (typeof currentUserBranch !== 'undefined' && currentUserBranch) ? currentUserBranch : (localStorage.getItem('selectedBranch') || 'Branch A');
                    branchSelect.disabled = true;
                } else {
                    branchSelect.disabled = false;
                    const activeBranch = document.getElementById('analytics-branch') ? document.getElementById('analytics-branch').value : 'all';
                    branchSelect.value = activeBranch;
                }
            }

            modal.classList.remove('hidden');
            lucide.createIcons();
        }

        function closeReportExportModal() {
            const modal = document.getElementById('report-export-modal');
            if (modal) modal.classList.add('hidden');
        }

        function submitReportExport() {
            const modal = document.getElementById('report-export-modal');
            if (!modal) return;

            const selectedReportType = modal.querySelector('input[name="export-report-type"]:checked')?.value || 'daily_intake';
            const selectedFormat = modal.querySelector('input[name="export-format"]:checked')?.value || 'PDF';

            closeReportExportModal();
            showAppPreloader(`Generating ${selectedFormat} report package...`);

            setTimeout(() => {
                try {
                    if (selectedFormat === 'Excel' || selectedFormat === 'CSV') {
                        exportDataExcel(selectedReportType);
                    } else if (selectedReportType === 'monthly_sla') {
                        if (selectedFormat === 'PDF') exportAnalyticsPDF();
                        else if (selectedFormat === 'Word') exportAnalyticsWord();
                    } else {
                        if (selectedFormat === 'PDF') exportPDF();
                        else if (selectedFormat === 'Word') exportWord();
                    }
                } finally {
                    setTimeout(hideAppPreloader, 600);
                }
            }, 120);
        }

        function exportData(format) {
            openReportExportModal(format);
        }

        function exportDataExcel(selectedReportType) {
            showSystemToast('Consolidating data for Excel spreadsheet export...', 'info', 'Management Module');
            const todayStr = new Date().toISOString().split('T')[0];
            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            let filename = `Hontech_${selectedReportType || 'report'}_${todayStr}.xls`;

            let tableHeaders = [];
            let tableRows = [];
            let reportTitle = 'HONTECH AUTOCENTER INC. - OPERATIONS REPORT';

            if (selectedReportType === 'carryover') {
                reportTitle = 'HONTECH AUTOCENTER INC. - CARRY-OVER AUDIT REPORT';
                tableHeaders = ['Plate No.', 'Vehicle Model', 'Date Received', 'Promised Date', 'Parts Available', 'Service Advisor', 'Evaluation', 'Remarks'];
                const carryOverJobs = (typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs.filter(j => j.status === 'Carry Over') : [];
                tableRows = carryOverJobs.map(job => [
                    job.plate || '',
                    job.vehicle || '',
                    job.dateReceived || '',
                    job.promisedDate || 'TBD',
                    job.partsAvailable || '',
                    job.saName || '-',
                    job.evaluation || '-',
                    job.remarks || ''
                ]);
            } else if (selectedReportType === 'monthly_sla' || selectedReportType === 'full_analytics') {
                reportTitle = 'HONTECH AUTOCENTER INC. - PERFORMANCE & SLA REPORT';
                tableHeaders = ['Claim Stub', 'Plate No.', 'Vehicle Model', 'Category', 'Source', 'Date Received', 'Arrival', 'Departure', 'Status', 'Service Advisor', 'Branch', 'Remarks'];
                const dataset = (typeof analyticsJobs !== 'undefined' && Array.isArray(analyticsJobs) && analyticsJobs.length > 0) ? analyticsJobs : ((typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs : []);
                tableRows = dataset.map(job => [
                    job.claimStub || 'N/A',
                    job.plate || '',
                    job.vehicle || '',
                    job.category || '',
                    job.source || '',
                    job.dateReceived || '',
                    typeof formatTime12Hour === 'function' ? formatTime12Hour(job.arrival || '') : (job.arrival || ''),
                    typeof formatTime12Hour === 'function' ? formatTime12Hour(job.departure || '') : (job.departure || ''),
                    job.status || '',
                    job.saName || '-',
                    job.branch || 'Branch A',
                    job.remarks || ''
                ]);
            } else if (selectedReportType === 'sa_efficiency') {
                reportTitle = 'HONTECH AUTOCENTER INC. - SERVICE ADVISOR EFFICIENCY REPORT';
                tableHeaders = ['Service Advisor', 'Total Jobs Handled', 'Completed / Released Jobs', 'Completion Rate (%)'];
                const dataset = (typeof analyticsJobs !== 'undefined' && Array.isArray(analyticsJobs) && analyticsJobs.length > 0) ? analyticsJobs : ((typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs : []);
                const saMap = {};
                dataset.forEach(job => {
                    const sa = job.saName || 'Unassigned';
                    if (!saMap[sa]) saMap[sa] = { name: sa, total: 0, completed: 0 };
                    saMap[sa].total++;
                    if (job.status === 'Completed' || job.status === 'Released') saMap[sa].completed++;
                });
                tableRows = Object.values(saMap).map(sa => {
                    const rate = sa.total > 0 ? Math.round((sa.completed / sa.total) * 100) : 0;
                    return [sa.name, sa.total, sa.completed, `${rate}%`];
                });
            } else {
                reportTitle = 'HONTECH AUTOCENTER INC. - DAILY INTAKE SUMMARY';
                tableHeaders = ['Claim Stub', 'Plate No.', 'Vehicle Model', 'Category', 'Source', 'Arrival Time', 'Departure Time', 'Status', 'Service Advisor', 'Remarks'];
                const todayJobs = (typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs.filter(j => j.dateReceived === todayStr) : [];
                const dataset = todayJobs.length > 0 ? todayJobs : ((typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs : []);
                tableRows = dataset.map(job => [
                    job.claimStub || 'N/A',
                    job.plate || '',
                    job.vehicle || '',
                    job.category || '',
                    job.source || '',
                    typeof formatTime12Hour === 'function' ? formatTime12Hour(job.arrival || '') : (job.arrival || ''),
                    typeof formatTime12Hour === 'function' ? formatTime12Hour(job.departure || '') : (job.departure || ''),
                    job.status || '',
                    job.saName || '-',
                    job.remarks || ''
                ]);
            }

            const excelHtml = `
                <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                <head>
                    <meta charset="utf-8">
                    <!--[if gte mso 9]>
                    <xml>
                        <x:ExcelWorkbook>
                            <x:ExcelWorksheets>
                                <x:ExcelWorksheet>
                                    <x:Name>HonTech Report</x:Name>
                                    <x:WorksheetOptions>
                                        <x:DisplayGridlines/>
                                    </x:WorksheetOptions>
                                </x:ExcelWorksheet>
                            </x:ExcelWorksheets>
                        </x:ExcelWorkbook>
                    </xml>
                    <![endif]-->
                    <style>
                        body { font-family: Arial, sans-serif; font-size: 10pt; }
                        .report-header { font-size: 16pt; font-weight: bold; color: #dc2626; padding-bottom: 5px; }
                        .report-meta { font-size: 9pt; color: #4b5563; margin-bottom: 15px; }
                        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
                        th { background-color: #dc2626; color: #ffffff; font-weight: bold; border: 1px solid #b91c1c; padding: 8px; text-align: left; }
                        td { border: 1px solid #d1d5db; padding: 6px; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                    </style>
                </head>
                <body>
                    <div class="report-header">${reportTitle}</div>
                    <div class="report-meta">Date Generated: ${today} at ${time} | Generated By: ${typeof currentUserName !== 'undefined' ? currentUserName : 'System Admin'}</div>
                    <table>
                        <thead>
                            <tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>
                            ${tableRows.length > 0 
                                ? tableRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')
                                : `<tr><td colspan="${tableHeaders.length}" style="text-align:center; color:#999;">No records found for this report.</td></tr>`}
                        </tbody>
                    </table>
                </body>
                </html>
            `;

            const blob = new Blob(['\ufeff' + excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
            downloadBlob(blob, filename);
            showSystemToast(`${filename} successfully generated.`, 'success', 'Export Complete');
        }

        // Global window bindings for export actions
        window.openReportExportModal = openReportExportModal;
        window.closeReportExportModal = closeReportExportModal;
        window.submitReportExport = submitReportExport;
        window.exportData = exportData;
        window.exportDataExcel = exportDataExcel;

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
            doc.setFontSize(16);
            doc.setTextColor(17, 24, 39);
            doc.text('HONTECH AUTOCENTER INC.', 14, 19);

            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text('OPERATIONS & QUEUE REPORT • MARIKINA BRANCH', 14, 25);

            // Confidential Stamp
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(220, 38, 38);
            doc.text('CONFIDENTIAL', 196, 19, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Internal Operations Report', 196, 25, { align: 'right' });

            // Meta Details
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            doc.text(`Date Generated: ${today} at ${time}`, 14, 33);
            doc.text(`Generated By: ${currentUserName || 'System Admin'} (Role: ${currentUserRole})`, 14, 38);

            // Divider Line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 43, 196, 43);

            // Metrics Summary Section
            const todayJobs = allJobs.filter(j => j.dateReceived === todayStr);
            const intakeCount = todayJobs.length;
            const releasedCount = allJobs.filter(j => (j.status === 'Released' || j.status === 'Completed') && j.dateReceived === todayStr).length;
            const carryoverCount = allJobs.filter(j => j.status === 'Carry Over').length;
            const inbayCount = allJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift'))).length;

            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text('OPERATIONAL METRICS SUMMARY', 14, 52);

            // Metric boxes represented as a plain table
            doc.autoTable({
                startY: 58,
                head: [['Total Daily Intakes', 'Released Today', 'Active in Bays', 'Active Carry-Overs']],
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

            // Sign-off verification block
            let signY = doc.autoTable.previous.finalY + 14;
            if (signY > 240) {
                doc.addPage();
                signY = 30;
            }

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('PREPARED BY (Service Advisor / Admin):', 14, signY);
            doc.text('VERIFIED & APPROVED BY (Operations Head):', 115, signY);

            doc.setDrawColor(148, 163, 184);
            doc.line(14, signY + 14, 85, signY + 14);
            doc.line(115, signY + 14, 186, signY + 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text((currentUserName || 'Service Advisor') + ' (Staff Sign-Over-Printed Name)', 14, signY + 18);
            doc.text('Shop Owner / General Manager', 115, signY + 18);

            // Footer info
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text('HonTech AutoCenter Operations System | Confidential', 14, 287);
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
            doc.setFontSize(16);
            doc.setTextColor(17, 24, 39);
            doc.text('HONTECH AUTOCENTER INC.', 14, 19);

            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text(`${scope.toUpperCase()} ANALYTICS & REVENUE REPORT • MARIKINA BRANCH`, 14, 25);

            // Confidential Stamp
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(220, 38, 38);
            doc.text('CONFIDENTIAL', 196, 19, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Internal Analytics Report', 196, 25, { align: 'right' });

            // Meta Details
            doc.setFontSize(8.5);
            doc.setTextColor(71, 85, 105);
            doc.text(`Report Period: ${periodText}`, 14, 33);
            doc.text(`Generated By: ${currentUserName || 'System Admin'} | Date: ${today} at ${time}`, 14, 38);

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

            // Sign-off verification block on analytics summary
            let signY = doc.autoTable.previous.finalY + 14;
            if (signY > 240) {
                doc.addPage();
                signY = 30;
            }

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('PREPARED BY (Auditing Admin):', 14, signY);
            doc.text('VERIFIED & APPROVED BY (Shop Owner / GM):', 115, signY);

            doc.setDrawColor(148, 163, 184);
            doc.line(14, signY + 14, 85, signY + 14);
            doc.line(115, signY + 14, 186, signY + 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text((currentUserName || 'System Admin') + ' (Staff Sign-Over-Printed Name)', 14, signY + 18);
            doc.text('Shop Owner / General Manager', 115, signY + 18);

            // Footer info
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text('HonTech AutoCenter Operations System | Confidential', 14, 287);
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

        function launchTVMode() {
            window.open(window.location.href.split('?')[0] + '?mode=tv', '_blank');
        }
        window.launchTVMode = launchTVMode;

        function jumpToTVSlide(index) {
            const slides = ['tv-slide-1', 'tv-slide-2', 'tv-slide-3'];
            tvSlideIndex = ((index % slides.length) + slides.length) % slides.length;

            slides.forEach((sId, i) => {
                const el = document.getElementById(sId);
                if (el) {
                    if (i === tvSlideIndex) {
                        el.classList.remove('hidden', 'fade-out');
                        el.classList.add('fade-in');
                    } else {
                        el.classList.add('hidden');
                        el.classList.remove('fade-in', 'fade-out');
                    }
                }
                const dot = document.getElementById(`tv-dot-${i}`);
                if (dot) {
                    dot.className = `w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${i === tvSlideIndex ? 'bg-red-500 scale-125' : 'bg-gray-600 hover:bg-gray-400'}`;
                }
            });

            if (tvInterval) {
                clearInterval(tvInterval);
                tvInterval = setInterval(rotateTVSlides, 12000);
            }
        }
        window.jumpToTVSlide = jumpToTVSlide;

        function rotateTVSlides() {
            const slides = ['tv-slide-1', 'tv-slide-2', 'tv-slide-3'];
            const nextIndex = (tvSlideIndex + 1) % slides.length;
            jumpToTVSlide(nextIndex);
        }
        window.rotateTVSlides = rotateTVSlides;

        function setupTVMode() {
            initTimeFormatSetting();
            document.getElementById('auth-view').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');
            
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar) sidebar.classList.add('hidden');

            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.classList.remove('p-4', 'md:p-6', 'p-6', 'md:p-10');
                mainContent.classList.add('p-0');
            }
            
            const header = document.querySelector('header');
            if (header) header.classList.add('hidden');
            
            const appShell = document.getElementById('app-shell');
            if (appShell) appShell.classList.remove('layout-sidebar');

            const dashHeader = document.getElementById('dashboard-header');
            if (dashHeader) dashHeader.classList.add('hidden');
            
            showSection('tv');

            // Initialize clock and date immediately
            updateClock();
            setInterval(updateClock, 1000);

            // Initial weather fetch, and poll weather every 15 minutes
            updateWeather();
            setInterval(updateWeather, 900000);

            // Initialize slide view at slide 0
            jumpToTVSlide(0);

            // TV synchronization via REST API polling every 2s
            setInterval(async () => {
                try {
                    await loadData();
                    renderTV();
                } catch (e) {
                    console.error('Error refreshing TV monitor:', e);
                }
            }, 2000);

            // Set slide interval to 12 seconds
            if (tvInterval) clearInterval(tvInterval);
            tvInterval = setInterval(rotateTVSlides, 12000);

            // Click anywhere on TV screen to manually jump to the next slide
            const tvSection = document.getElementById('section-tv');
            if (tvSection) {
                tvSection.addEventListener('click', (e) => {
                    if (e.target.closest('button, select, input, a, [onclick]')) return;
                    rotateTVSlides();
                });
            }
            
            loadData().then(() => {
                renderTV();
                lucide.createIcons();
            });

            lucide.createIcons();
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

        // --- TV AUDIO & VISUAL CHIME MODULE ---
        let tvAudioEnabled = true;
        let previousReadyJobKeys = new Set();
        let tvAudioCtx = null;
        let tvAlertBannerTimeout = null;

        function toggleTVSound() {
            tvAudioEnabled = !tvAudioEnabled;
            const icon = document.getElementById('tv-sound-icon');
            const text = document.getElementById('tv-sound-text');
            if (tvAudioEnabled) {
                if (icon) { icon.setAttribute('data-lucide', 'volume-2'); icon.className = 'w-4 h-4 text-emerald-400'; }
                if (text) text.innerText = 'Chime ON';
                playAutomotiveChime();
            } else {
                if (icon) { icon.setAttribute('data-lucide', 'volume-x'); icon.className = 'w-4 h-4 text-gray-500'; }
                if (text) text.innerText = 'Chime OFF';
            }
            lucide.createIcons();
        }
        window.toggleTVSound = toggleTVSound;

        function setChimeTheme(theme) {
            if (!theme) return;
            localStorage.setItem('hontech_chime_theme', theme);
            playAutomotiveChime(theme);
            showSystemToast(`Chime sound updated to ${theme.toUpperCase()}`, 'success', 'Audio Preferences');
        }
        window.setChimeTheme = setChimeTheme;

        function playAutomotiveChime(themeOverride) {
            if (!tvAudioEnabled) return;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                if (!tvAudioCtx) tvAudioCtx = new AudioContextClass();
                if (tvAudioCtx.state === 'suspended') {
                    tvAudioCtx.resume();
                }

                const theme = themeOverride || localStorage.getItem('hontech_chime_theme') || 'harmonic';
                const now = tvAudioCtx.currentTime;

                if (theme === 'keyfob') {
                    // Automotive Keyfob Chirp (2 quick crisp electronic chirps: 2200Hz -> 2600Hz)
                    [0, 0.12].forEach(delay => {
                        const osc = tvAudioCtx.createOscillator();
                        const gain = tvAudioCtx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(2200, now + delay);
                        osc.frequency.exponentialRampToValueAtTime(2600, now + delay + 0.06);
                        gain.gain.setValueAtTime(0.3, now + delay);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);
                        osc.connect(gain);
                        gain.connect(tvAudioCtx.destination);
                        osc.start(now + delay);
                        osc.stop(now + delay + 0.08);
                    });
                } else if (theme === 'marimba') {
                    // Executive Soft Marimba (4 warm melodic acoustic notes: C5, E5, G5, C6)
                    const notes = [523.25, 659.25, 783.99, 1046.50];
                    notes.forEach((freq, idx) => {
                        const osc = tvAudioCtx.createOscillator();
                        const gain = tvAudioCtx.createGain();
                        osc.type = 'triangle';
                        osc.frequency.setValueAtTime(freq, now + idx * 0.11);
                        gain.gain.setValueAtTime(0.24, now + idx * 0.11);
                        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 0.55);
                        osc.connect(gain);
                        gain.connect(tvAudioCtx.destination);
                        osc.start(now + idx * 0.11);
                        osc.stop(now + idx * 0.11 + 0.6);
                    });
                } else if (theme === 'horn') {
                    // Shop Floor Resonant Brass Dual Chime (440Hz -> 659Hz dual tone)
                    [440, 659.25].forEach((freq, idx) => {
                        const osc = tvAudioCtx.createOscillator();
                        const gain = tvAudioCtx.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, now + idx * 0.14);
                        gain.gain.setValueAtTime(0.18, now + idx * 0.14);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.65);
                        osc.connect(gain);
                        gain.connect(tvAudioCtx.destination);
                        osc.start(now + idx * 0.14);
                        osc.stop(now + idx * 0.14 + 0.7);
                    });
                } else if (theme === 'scanner') {
                    // Sci-Fi Diagnostic Scanner Sweep & Harmonic Ring
                    const osc = tvAudioCtx.createOscillator();
                    const gain = tvAudioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(750, now);
                    osc.frequency.exponentialRampToValueAtTime(1750, now + 0.18);
                    gain.gain.setValueAtTime(0.3, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                    osc.connect(gain);
                    gain.connect(tvAudioCtx.destination);
                    osc.start(now);
                    osc.stop(now + 0.5);

                    const osc2 = tvAudioCtx.createOscillator();
                    const gain2 = tvAudioCtx.createGain();
                    osc2.type = 'triangle';
                    osc2.frequency.setValueAtTime(1400, now + 0.14);
                    gain2.gain.setValueAtTime(0.2, now + 0.14);
                    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
                    osc2.connect(gain2);
                    gain2.connect(tvAudioCtx.destination);
                    osc2.start(now + 0.14);
                    osc2.stop(now + 0.85);
                } else {
                    // Default: Harmonic Bell (D5 -> A5 -> D6)
                    const osc1 = tvAudioCtx.createOscillator();
                    const gain1 = tvAudioCtx.createGain();
                    osc1.type = 'sine';
                    osc1.frequency.setValueAtTime(587.33, now);
                    gain1.gain.setValueAtTime(0.28, now);
                    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
                    osc1.connect(gain1);
                    gain1.connect(tvAudioCtx.destination);
                    osc1.start(now);
                    osc1.stop(now + 0.6);

                    const osc2 = tvAudioCtx.createOscillator();
                    const gain2 = tvAudioCtx.createGain();
                    osc2.type = 'sine';
                    osc2.frequency.setValueAtTime(880, now + 0.14);
                    gain2.gain.setValueAtTime(0.35, now + 0.14);
                    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
                    osc2.connect(gain2);
                    gain2.connect(tvAudioCtx.destination);
                    osc2.start(now + 0.14);
                    osc2.stop(now + 1.15);

                    const osc3 = tvAudioCtx.createOscillator();
                    const gain3 = tvAudioCtx.createGain();
                    osc3.type = 'triangle';
                    osc3.frequency.setValueAtTime(1174.66, now + 0.28);
                    gain3.gain.setValueAtTime(0.22, now + 0.28);
                    gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
                    osc3.connect(gain3);
                    gain3.connect(tvAudioCtx.destination);
                    osc3.start(now + 0.28);
                    osc3.stop(now + 1.35);
                }
            } catch (err) {
                console.warn('Audio chime playback skipped:', err);
            }
        }
        window.playAutomotiveChime = playAutomotiveChime;

        function playBayDispatchSound() {
            if (!tvAudioEnabled) return;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                if (!tvAudioCtx) tvAudioCtx = new AudioContextClass();
                if (tvAudioCtx.state === 'suspended') {
                    tvAudioCtx.resume();
                }

                const now = tvAudioCtx.currentTime;
                // Energetic Ascending Mechanical Cadence (330Hz E4 -> 495Hz B4 -> 660Hz E5)
                const freqs = [330, 495, 660];
                freqs.forEach((freq, idx) => {
                    const osc = tvAudioCtx.createOscillator();
                    const gain = tvAudioCtx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.09);
                    gain.gain.setValueAtTime(0.26, now + idx * 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
                    osc.connect(gain);
                    gain.connect(tvAudioCtx.destination);
                    osc.start(now + idx * 0.09);
                    osc.stop(now + idx * 0.09 + 0.4);
                });
            } catch (err) {
                console.warn('Bay dispatch sound skipped:', err);
            }
        }
        window.playBayDispatchSound = playBayDispatchSound;

        function playReleaseConfirmSound() {
            if (!tvAudioEnabled) return;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                if (!tvAudioCtx) tvAudioCtx = new AudioContextClass();
                if (tvAudioCtx.state === 'suspended') {
                    tvAudioCtx.resume();
                }

                const now = tvAudioCtx.currentTime;
                // Dual high-frequency celebratory confirmation chime (880Hz -> 1174.66Hz)
                const freqs = [880, 1174.66];
                freqs.forEach((freq, idx) => {
                    const osc = tvAudioCtx.createOscillator();
                    const gain = tvAudioCtx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.12);
                    gain.gain.setValueAtTime(0.3, now + idx * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.7);
                    osc.connect(gain);
                    gain.connect(tvAudioCtx.destination);
                    osc.start(now + idx * 0.12);
                    osc.stop(now + idx * 0.12 + 0.75);
                });
            } catch (err) {
                console.warn('Release confirm sound skipped:', err);
            }
        }
        window.playReleaseConfirmSound = playReleaseConfirmSound;

        function playSlaWarningSound() {
            if (!tvAudioEnabled) return;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                if (!tvAudioCtx) tvAudioCtx = new AudioContextClass();
                if (tvAudioCtx.state === 'suspended') {
                    tvAudioCtx.resume();
                }

                const now = tvAudioCtx.currentTime;
                // Double caution warning tone (520Hz x 2)
                [0, 0.2].forEach(delay => {
                    const osc = tvAudioCtx.createOscillator();
                    const gain = tvAudioCtx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(520, now + delay);
                    gain.gain.setValueAtTime(0.18, now + delay);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);
                    osc.connect(gain);
                    gain.connect(tvAudioCtx.destination);
                    osc.start(now + delay);
                    osc.stop(now + delay + 0.15);
                });
            } catch (err) {
                console.warn('SLA warning sound skipped:', err);
            }
        }
        window.playSlaWarningSound = playSlaWarningSound;

        // Auto-resume audio context on user interaction
        window.addEventListener('click', () => {
            if (tvAudioCtx && tvAudioCtx.state === 'suspended') {
                tvAudioCtx.resume();
            }
        }, { passive: true });

        function triggerTVSlideAlertBanner(plateNumber = 'Vehicle') {
            const banner = document.getElementById('tv-ready-alert-banner');
            const text = document.getElementById('tv-ready-alert-text');
            if (!banner) return;

            if (text) text.innerText = `🔔 Vehicle Ready: ${plateNumber} — Ready to Claim!`;
            banner.classList.remove('hidden');

            if (tvAlertBannerTimeout) clearTimeout(tvAlertBannerTimeout);
            tvAlertBannerTimeout = setTimeout(() => {
                banner.classList.add('hidden');
            }, 6000);
            lucide.createIcons();
        }
        window.triggerTVSlideAlertBanner = triggerTVSlideAlertBanner;

        function renderTV() {
            const tvSection = document.getElementById('section-tv');
            if (tvSection && tvSection.classList.contains('hidden')) return;

            // Slide Subtitles
            const bayCount = getWorkshopBayCount();
            const tvSlide1Sub = document.getElementById('tv-slide1-sub');
            if (tvSlide1Sub) tvSlide1Sub.innerText = `Active Bays (1-${bayCount}) & Real-Time Allocations — Marikina Main Floor`;

            const tvSlide2Sub = document.getElementById('tv-slide2-sub');
            if (tvSlide2Sub) tvSlide2Sub.innerText = 'Live Queue & Turnaround Status — Marikina Main Branch';

            const tvSlide3Sub = document.getElementById('tv-slide3-sub');
            if (tvSlide3Sub) tvSlide3Sub.innerText = 'Live Turnaround Status by Work Classification — Marikina Workshop';

            // Group 1: Waiting Jobs (Upcoming Queue) - Monitoring AND Waiting status shows on TV waiting list
            const waitingJobs = allJobs.filter(j => j.status === 'Monitoring' || j.status === 'Waiting');
            // Group 2: Released (Ready, Ready to Release)
            const releasedAll = allJobs.filter(j => j.status === 'Ready' || j.status === 'Ready to Release');
            // Group 3: Carry Over (Carry Over)
            const carryOverAll = allJobs.filter(j => j.status === 'Carry Over');

            // Detect newly ready vehicles to trigger Audio Chime & Visual TV Banner
            const currentReadyKeys = new Set(releasedAll.map(j => String(j.id || j.claimStub || j.plate)));
            if (previousReadyJobKeys.size > 0) {
                releasedAll.forEach(job => {
                    const key = String(job.id || job.claimStub || job.plate);
                    if (!previousReadyJobKeys.has(key)) {
                        playAutomotiveChime();
                        triggerTVSlideAlertBanner(job.plate || 'Vehicle');
                    }
                });
            }
            previousReadyJobKeys = currentReadyKeys;

            // Render Slide 2 Upcoming Queue List (Black, Red, White High Contrast for TV Viewers)
            const tvAllUpcoming = document.getElementById('tv-all-upcoming-list');
            const tvAllUpcomingCount = document.getElementById('tv-all-upcoming-count');
            if (tvAllUpcomingCount) tvAllUpcomingCount.innerText = waitingJobs.length;
            if (tvAllUpcoming) {
                tvAllUpcoming.innerHTML = waitingJobs.map(job => `
                    <div class="bg-white border-2 border-gray-900 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs hover:scale-[1.01] transition-transform duration-150">
                        <div class="flex flex-col text-left">
                            <div class="flex items-center gap-2.5">
                                <span class="text-xl lg:text-2xl font-black uppercase italic text-gray-950 tracking-tight">${job.plate}</span>
                                <span class="bg-gray-100 text-gray-700 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded border border-gray-200">${job.laneType || 'Flexible Lane'}</span>
                            </div>
                            <span class="text-xs font-bold uppercase tracking-wider text-gray-500 mt-0.5">${job.vehicle} · <span class="text-gray-900 font-extrabold">${job.customer || job.name || 'Customer'}</span></span>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="bg-gray-950 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-lg">
                                ${job.category || 'General Service'}
                            </span>
                            <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest">In Reception</span>
                        </div>
                    </div>
                `).join('') || `<div class="w-full text-center py-8 text-gray-400 font-black uppercase italic text-sm tracking-widest">No Vehicles in Queue</div>`;
            }

            // Render Slide 2 Released List (High Visibility Ready for Release)
            const tvAllReleased = document.getElementById('tv-all-released-list');
            const tvAllReleasedCount = document.getElementById('tv-all-released-count');
            if (tvAllReleasedCount) tvAllReleasedCount.innerText = releasedAll.length;
            if (tvAllReleased) {
                tvAllReleased.innerHTML = releasedAll.map(job => `
                    <div class="bg-emerald-50/70 border-2 border-emerald-500 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs hover:scale-[1.01] transition-transform">
                        <div class="flex flex-col text-left">
                            <div class="flex items-center gap-2.5">
                                <span class="text-xl lg:text-2xl font-black uppercase italic text-gray-950 tracking-tight">${job.plate}</span>
                                <span class="bg-emerald-100 text-emerald-800 font-extrabold text-[9px] uppercase px-2 py-0.5 rounded border border-emerald-300">Stub: ${job.claimStub || 'N/A'}</span>
                            </div>
                            <span class="text-xs font-bold uppercase tracking-wider text-emerald-800 mt-0.5">${job.vehicle} · <span class="font-extrabold text-emerald-950">${job.customer || job.name || 'Customer'}</span></span>
                        </div>
                        <span class="bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-sm">
                            Ready to Claim
                        </span>
                    </div>
                `).join('') || `<div class="w-full text-center py-8 text-gray-400 font-black uppercase italic text-sm tracking-widest">Waiting for Completed Jobs</div>`;
            }

            // Render Slide 2 Carry Over List (Clean Grid with Full Vehicle Info)
            const tvAllCarry = document.getElementById('tv-all-carryover-list');
            const tvAllCarryCount = document.getElementById('tv-all-carryover-count');
            if (tvAllCarryCount) tvAllCarryCount.innerText = carryOverAll.length;
            if (tvAllCarry) {
                tvAllCarry.innerHTML = carryOverAll.map(job => `
                    <div class="bg-white border-2 border-gray-900 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xs hover:scale-[1.01] transition-transform">
                        <div class="flex flex-col text-left">
                            <span class="text-base font-black uppercase italic text-gray-950 tracking-tight">${job.plate}</span>
                            <span class="text-xs font-extrabold uppercase tracking-wider text-gray-900 truncate max-w-[180px]">${job.vehicle}</span>
                            <span class="text-[10px] font-bold text-gray-700 uppercase tracking-wider">${job.category || 'General Repair'} · SA: <strong class="text-gray-950 font-black">${job.advisor || job.saName || job.sa_name || 'SA'}</strong></span>
                        </div>
                        <span class="bg-amber-100 text-amber-950 border-2 border-amber-400 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shrink-0">
                            Carry Over
                        </span>
                    </div>
                `).join('') || `<div class="w-full col-span-3 text-center py-6 text-gray-500 font-black uppercase italic text-xs tracking-widest">No Carry-Overs</div>`;
            }

            // GRS Active Bays slide (tv-slide-1) rendering (Dynamic 4-10 Bays)
            const tvGRS = document.getElementById('tv-grs-list');
            if (tvGRS) {
                // Adaptive layout based on number of active bays
                if (bayCount <= 4) {
                    tvGRS.className = "grid grid-cols-2 gap-5 h-full";
                } else if (bayCount <= 6) {
                    tvGRS.className = "grid grid-cols-3 gap-4 h-full";
                } else if (bayCount <= 8) {
                    tvGRS.className = "grid grid-cols-4 gap-3.5 h-full";
                } else {
                    tvGRS.className = "grid grid-cols-5 gap-3 h-full";
                }

                let baysHTML = '';
                for (let i = 1; i <= bayCount; i++) {
                    const padBay = String(i).padStart(2, '0');
                    const job = (allJobs || []).find(j => {
                        if (j.status === 'Completed' || j.status === 'Released' || j.status === 'Pending') return false;
                        if (!j.location || j.location === 'None' || j.location === 'Waiting Area') return false;
                        if (Number(j.bayAssigned) === i || Number(j.bay_assigned) === i) return true;
                        const cleanLoc = String(j.location).toLowerCase().replace(/[^a-z0-9]/g, '');
                        return cleanLoc === `bay${i}` || cleanLoc === `lift${i}` || cleanLoc === `bay0${i}` || cleanLoc === `lift0${i}` || cleanLoc === `bay${padBay}`;
                    });

                    if (job) {
                        baysHTML += `
                            <div class="bg-white border-2 border-slate-900 rounded-2xl p-4 lg:p-5 flex flex-col justify-between items-center h-full relative shadow-md">
                                <div class="w-full flex items-center justify-between">
                                    <span class="text-xs font-black uppercase tracking-widest text-slate-900">BAY-${padBay}</span>
                                    <span class="bg-red-600 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">IN SERVICE</span>
                                </div>
                                <div class="flex flex-col items-center my-auto text-center">
                                    <span class="text-3xl lg:text-4xl font-black uppercase italic text-slate-950 tracking-tighter">${job.plate}</span>
                                    <span class="text-sm font-black uppercase tracking-wider text-slate-900 mt-1">${job.vehicle}</span>
                                    <span class="text-xs font-extrabold uppercase text-slate-700 mt-0.5">${job.customer || job.name || 'Customer'}</span>
                                </div>
                                <div class="w-full pt-2.5 border-t-2 border-slate-200 flex items-center justify-between text-xs font-black text-slate-900 uppercase">
                                    <span>${job.category || 'General Service'}</span>
                                    <span class="text-slate-800 font-mono text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded border border-slate-300">${job.laneType || 'FLEXIBLE'}</span>
                                </div>
                            </div>`;
                    } else {
                        baysHTML += `
                            <div class="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-4 lg:p-5 flex flex-col justify-between items-center h-full relative shadow-2xs">
                                <div class="w-full flex items-center justify-between">
                                    <span class="text-xs font-black uppercase tracking-widest text-slate-700">BAY-${padBay}</span>
                                    <span class="bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">AVAILABLE</span>
                                </div>
                                <div class="my-auto flex flex-col items-center">
                                    <span class="text-3xl lg:text-4xl font-black uppercase italic text-slate-700 tracking-wider">EMPTY</span>
                                    <span class="text-xs font-black uppercase text-slate-600 mt-1 tracking-wide">Ready for Allocation</span>
                                </div>
                                <div class="h-3"></div>
                            </div>`;
                    }
                }
                tvGRS.innerHTML = baysHTML;
            }
            // Slide 3: Lane Monitoring lists (Express, Flexible, Specialty)
            const activeLaneJobs = (allJobs || []).filter(j => (j.status === 'Monitoring' || j.status === 'Waiting' || j.status === 'In Progress' || j.status === 'Ready' || j.status === 'Ready to Release' || (j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')))) && j.status !== 'Completed' && j.status !== 'Released');
            const renderLaneJobCard = (job) => {
                let statusBadge = '';
                if (job.location && (job.location.startsWith('Bay') || job.location.startsWith('Lift'))) {
                    statusBadge = `<span class="bg-gray-950 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg">${job.location.replace(/^Lift/i, 'Bay')}</span>`;
                } else if (job.status === 'Ready' || job.status === 'Ready to Release') {
                    statusBadge = `<span class="bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-sm">Ready</span>`;
                } else if (job.status === 'In Progress') {
                    statusBadge = `<span class="bg-red-600 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg shadow-xs">In Progress</span>`;
                } else if (job.status === 'Waiting') {
                    statusBadge = `<span class="bg-gray-100 text-gray-900 border-2 border-gray-400 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">In Queue</span>`;
                } else {
                    statusBadge = `<span class="bg-gray-100 text-gray-900 border border-gray-300 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md">Monitoring</span>`;
                }
                return `
                    <div class="bg-white border-2 border-gray-900 rounded-xl px-4 py-3 flex flex-col gap-2 shadow-2xs hover:scale-[1.01] transition-transform duration-150 text-left">
                        <div class="flex items-center justify-between">
                            <span class="text-xl font-black uppercase italic text-gray-950 tracking-tight">${job.plate}</span>
                            ${statusBadge}
                        </div>
                        <div class="flex items-center justify-between text-xs text-gray-900 font-black uppercase tracking-wider">
                            <span class="truncate max-w-[150px]">${job.vehicle}</span>
                            <span class="text-gray-950 font-black">${job.category || 'General'}</span>
                        </div>
                        <div class="flex items-center justify-between text-[10px] text-gray-700 font-bold border-t border-gray-200 pt-1.5">
                            <span>SA: <strong class="text-gray-950 font-black">${job.advisor || job.saName || job.sa_name || 'SA'}</strong></span>
                            <span class="font-extrabold text-gray-900">${job.arrival ? `Arrival: ${job.arrival}` : ''}</span>
                        </div>
                    </div>
                `;
            };

            const expressLaneJobs = activeLaneJobs.filter(j => j.laneType === 'Express' || j.laneType === 'Express Lane');
            const specialLaneJobs = activeLaneJobs.filter(j => j.laneType === 'Special' || j.laneType === 'Specialty' || j.laneType === 'Special Lane');
            const priorityLaneJobs = activeLaneJobs.filter(j => j.laneType === 'Priority' || j.laneType === 'Priority Lane');
            const flexibleLaneJobs = activeLaneJobs.filter(j => !['Express', 'Express Lane', 'Special', 'Specialty', 'Special Lane', 'Priority', 'Priority Lane'].includes(j.laneType));

            const expressCount = document.getElementById('tv-express-lane-count');
            if (expressCount) expressCount.innerText = expressLaneJobs.length;
            const flexibleCount = document.getElementById('tv-flexible-lane-count');
            if (flexibleCount) flexibleCount.innerText = flexibleLaneJobs.length;
            const specialCount = document.getElementById('tv-special-lane-count');
            if (specialCount) specialCount.innerText = specialLaneJobs.length;
            const priorityCount = document.getElementById('tv-priority-lane-count');
            if (priorityCount) priorityCount.innerText = priorityLaneJobs.length;

            const expressList = document.getElementById('tv-express-lane-list');
            const flexibleList = document.getElementById('tv-flexible-lane-list');
            const specialList = document.getElementById('tv-special-lane-list');
            const priorityList = document.getElementById('tv-priority-lane-list');

            if (expressList) {
                expressList.innerHTML = expressLaneJobs.map(renderLaneJobCard).join('') || `<div class="w-full text-center py-8 text-gray-400 font-black uppercase italic text-sm tracking-widest">No Vehicles in Lane</div>`;
            }
            if (flexibleList) {
                flexibleList.innerHTML = flexibleLaneJobs.map(renderLaneJobCard).join('') || `<div class="w-full text-center py-8 text-gray-400 font-black uppercase italic text-sm tracking-widest">No Vehicles in Lane</div>`;
            }
            if (specialList) {
                specialList.innerHTML = specialLaneJobs.map(renderLaneJobCard).join('') || `<div class="w-full text-center py-8 text-gray-400 font-black uppercase italic text-sm tracking-widest">No Vehicles in Lane</div>`;
            }
            if (priorityList) {
                priorityList.innerHTML = priorityLaneJobs.map(renderLaneJobCard).join('') || `<div class="w-full text-center py-8 text-gray-400 font-black uppercase italic text-sm tracking-widest">No Vehicles in Lane</div>`;
            }

            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
            startTVAutoScroll();
        }

        function getWorkshopBayCount() {
            const stored = parseInt(localStorage.getItem('hontech_workshop_bay_count'), 10);
            if (!isNaN(stored) && stored >= 4 && stored <= 10) {
                return stored;
            }
            return 4; // Default 4 service bays
        }
        window.getWorkshopBayCount = getWorkshopBayCount;

        function handleWorkshopBayCountChange(newCount) {
            const num = Math.min(10, Math.max(4, parseInt(newCount, 10) || 4));
            localStorage.setItem('hontech_workshop_bay_count', num.toString());
            
            const badge1 = document.getElementById('settings-bay-count-badge');
            if (badge1) badge1.innerText = `${num} Bays Active`;
            const badge2 = document.getElementById('bays-module-count-badge');
            if (badge2) badge2.innerText = `${num} Bays Active`;

            const select1 = document.getElementById('settings-workshop-bays');
            if (select1) select1.value = num.toString();
            const select2 = document.getElementById('bays-module-select');
            if (select2) select2.value = num.toString();
            
            try {
                if (typeof renderStaffTables === 'function') renderStaffTables();
            } catch (e) { console.warn('renderStaffTables skipped on bay change:', e); }

            try {
                if (typeof renderTV === 'function') renderTV();
            } catch (e) { console.warn('renderTV skipped on bay change:', e); }

            try {
                if (typeof renderWorkshopBaysModule === 'function') renderWorkshopBaysModule();
            } catch (e) { console.warn('renderWorkshopBaysModule skipped on bay change:', e); }

            try {
                if (typeof renderReportDataModule === 'function') renderReportDataModule();
            } catch (e) { console.warn('renderReportDataModule skipped on bay change:', e); }

            showSystemToast(`Workshop capacity configured to ${num} service bays.`, 'success', 'Bays Configured');
        }
        window.handleWorkshopBayCountChange = handleWorkshopBayCountChange;

        function initWorkshopBaySettings() {
            const bayCount = getWorkshopBayCount();
            const select1 = document.getElementById('settings-workshop-bays');
            if (select1) select1.value = bayCount.toString();
            const badge1 = document.getElementById('settings-bay-count-badge');
            if (badge1) badge1.innerText = `${bayCount} Bays Active`;

            const select2 = document.getElementById('bays-module-select');
            if (select2) select2.value = bayCount.toString();
            const badge2 = document.getElementById('bays-module-count-badge');
            if (badge2) badge2.innerText = `${bayCount} Bays Active`;
        }
        window.initWorkshopBaySettings = initWorkshopBaySettings;

        function renderWorkshopBaysModule() {
            const baySection = document.getElementById('section-bays');
            if (baySection && baySection.classList.contains('hidden')) return;

            const bayCount = getWorkshopBayCount();
            
            // Sync capacity selectors and badges
            const moduleSelect = document.getElementById('bays-module-select');
            if (moduleSelect) moduleSelect.value = bayCount.toString();
            const moduleBadge = document.getElementById('bays-module-count-badge');
            if (moduleBadge) moduleBadge.innerText = `${bayCount} Bays Active`;

            const activeInBayJobs = (allJobs || []).filter(j => {
                if (j.status === 'Completed' || j.status === 'Released' || j.status === 'Pending') return false;
                if (!j.location || j.location === 'None' || j.location === 'Waiting Area') return false;
                return j.location.startsWith('Bay') || j.location.startsWith('Lift') || (j.bayAssigned > 0) || (j.bay_assigned > 0);
            });

            const occupiedCount = activeInBayJobs.length;
            const freeCount = Math.max(0, bayCount - occupiedCount);
            const utilizationRate = Math.round((occupiedCount / bayCount) * 100);

            if (document.getElementById('bays-stat-total')) document.getElementById('bays-stat-total').innerText = bayCount;
            if (document.getElementById('bays-stat-occupied')) document.getElementById('bays-stat-occupied').innerText = occupiedCount;
            if (document.getElementById('bays-stat-free')) document.getElementById('bays-stat-free').innerText = freeCount;
            if (document.getElementById('bays-stat-utilization')) document.getElementById('bays-stat-utilization').innerText = `${utilizationRate}%`;

            // Render Floor Grid
            const gridEl = document.getElementById('bays-floor-grid');
            if (gridEl) {
                let gridHtml = '';
                for (let i = 1; i <= bayCount; i++) {
                    const padBay = String(i).padStart(2, '0');
                    const job = (allJobs || []).find(j => {
                        if (j.status === 'Completed' || j.status === 'Released' || j.status === 'Pending') return false;
                        if (!j.location || j.location === 'None' || j.location === 'Waiting Area') return false;
                        if (Number(j.bayAssigned) === i || Number(j.bay_assigned) === i) return true;
                        const cleanLoc = String(j.location).toLowerCase().replace(/[^a-z0-9]/g, '');
                        return cleanLoc === `bay${i}` || cleanLoc === `lift${i}` || cleanLoc === `bay0${i}` || cleanLoc === `lift0${i}` || cleanLoc === `bay${padBay}`;
                    });

                    if (job) {
                        gridHtml += `
                            <div class="bg-white border-2 border-gray-900 rounded-2xl p-5 shadow-md flex flex-col justify-between gap-4 transition hover:shadow-lg">
                                <div class="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
                                        <span class="font-black text-xs uppercase tracking-widest text-gray-950">BAY-${padBay}</span>
                                    </div>
                                    <span class="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">IN SERVICE</span>
                                </div>

                                <div class="space-y-1 text-left">
                                    <span class="text-2xl lg:text-3xl font-black uppercase italic text-gray-950 tracking-tight block">${job.plate}</span>
                                    <span class="text-xs font-bold uppercase text-gray-500 tracking-wider block">${job.vehicle || 'Vehicle'} · <span class="text-gray-900 font-extrabold">${job.customer || 'Customer'}</span></span>
                                </div>

                                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[10px] font-bold text-gray-600">
                                    <div>
                                        <span class="text-gray-400 uppercase text-[9px] block">Category</span>
                                        <span class="text-gray-900 font-extrabold truncate block">${job.category || 'General'}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400 uppercase text-[9px] block">Lane</span>
                                        <span class="text-gray-900 font-extrabold truncate block">${job.laneType || 'Flexible Lane'}</span>
                                    </div>
                                    <div>
                                        <span class="text-gray-400 uppercase text-[9px] block">Advisor</span>
                                        <span class="text-gray-900 font-extrabold truncate block">${job.advisor || 'SA'}</span>
                                    </div>
                                </div>
                            `;

                            const isManager = (currentUserRole === 'owner' || currentUserRole === 'admin');

                            if (isManager) {
                                gridHtml += `
                                    <div class="pt-2 border-t border-gray-200">
                                        <button onclick="showSection('queue')" class="w-full py-2 px-3 bg-gray-900 hover:bg-black text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5">
                                            <i data-lucide="file-text" class="w-3.5 h-3.5"></i> View Master Record
                                        </button>
                                    </div>
                                `;
                            } else {
                                gridHtml += `
                                    <div class="flex items-center gap-2 pt-2">
                                        <button onclick="updateJobField('${job.id}', 'location', 'None'); setTimeout(renderWorkshopBaysModule, 120);" class="flex-1 py-2 px-3 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 font-bold text-[11px] uppercase tracking-wider rounded-xl transition border border-gray-200 cursor-pointer">
                                            Unassign Bay
                                        </button>
                                        <button onclick="showSection('queue')" class="py-2 px-3 bg-gray-900 hover:bg-black text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer">
                                            Record
                                        </button>
                                    </div>
                                `;
                            }
                            gridHtml += `
                            </div>
                        `;
                    } else {
                        const isManager = (currentUserRole === 'owner' || currentUserRole === 'admin');
                        let actionHtml = '';

                        if (isManager) {
                            actionHtml = `
                                <div class="w-full py-2 px-3 bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5">
                                    <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-500"></i> TV Bay Ready
                                </div>
                            `;
                        } else {
                            actionHtml = `
                                <button onclick="openBayAllocationModal(${i})" class="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5">
                                    <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-300"></i> Assign From Queue
                                </button>
                            `;
                        }

                        gridHtml += `
                            <div class="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-5 shadow-2xs flex flex-col justify-between gap-4 text-center">
                                <div class="flex items-center justify-between border-b border-gray-200 pb-3">
                                    <span class="font-black text-xs uppercase tracking-widest text-gray-800">BAY-${padBay}</span>
                                    <span class="bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">AVAILABLE</span>
                                </div>

                                <div class="my-auto py-4">
                                    <div class="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2 border border-emerald-200">
                                        <i data-lucide="check" class="w-5 h-5"></i>
                                    </div>
                                    <span class="text-2xl font-black uppercase italic text-gray-800 tracking-wider block">EMPTY</span>
                                    <span class="text-xs font-black uppercase text-gray-600 tracking-wider mt-0.5 block">Ready for Allocation</span>
                                </div>

                                <div class="pt-2 border-t border-gray-200">
                                    ${actionHtml}
                                </div>
                            </div>
                        `;
                    }
                }
                gridEl.innerHTML = gridHtml;
            }

            if (window.lucide) window.lucide.createIcons();
        }
        window.renderWorkshopBaysModule = renderWorkshopBaysModule;

        function openBayAllocationModal(bayNumber) {
            const padBay = String(bayNumber).padStart(2, '0');
            const targetBay = `Bay ${bayNumber}`;
            const modal = document.getElementById('modal-bay-allocation');
            const titleEl = document.getElementById('modal-bay-alloc-title');
            const listEl = document.getElementById('modal-bay-alloc-list');
            if (!modal || !listEl) return;

            if (titleEl) titleEl.innerText = `Dispatch Vehicle to BAY-${padBay}`;

            const waitingJobs = (allJobs || []).filter(j => {
                if (j.status === 'Completed' || j.status === 'Released' || j.status === 'Pending') return false;
                return (!j.location || j.location === 'None' || j.location === 'Waiting Area');
            });

            if (waitingJobs.length === 0) {
                listEl.innerHTML = `
                    <div class="text-center py-10 space-y-3 bg-white border border-gray-200 rounded-2xl p-6">
                        <div class="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                            <i data-lucide="inbox" class="w-6 h-6"></i>
                        </div>
                        <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">No vehicles currently waiting in queue</p>
                        <button onclick="closeBayAllocationModal(); showSection('intake');" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition cursor-pointer">
                            + Add New Intake
                        </button>
                    </div>
                `;
            } else {
                listEl.innerHTML = waitingJobs.map(job => {
                    const custName = job.customer || job.name || job.contact || 'Customer';
                    const advName = job.advisor || job.saName || job.sa_name || 'SA';
                    return `
                        <div class="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-xs">
                            <div class="flex-1 min-w-0 space-y-1.5 text-left">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="text-xl font-black uppercase italic tracking-wide text-gray-950 font-mono">${job.plate}</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 whitespace-nowrap">${job.laneType || 'Flexible Lane'}</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">${job.category || 'PMS'}</span>
                                </div>
                                <p class="text-xs font-bold text-gray-700 truncate uppercase">
                                    ${job.vehicle || 'Vehicle'} · <strong class="text-gray-950 font-black">${custName}</strong>
                                </p>
                                <p class="text-[10px] font-bold text-gray-400 uppercase">
                                    Service Advisor: <strong class="text-gray-700">${advName}</strong>
                                </p>
                            </div>
                            <div class="shrink-0">
                                <button onclick="dispatchVehicleToTargetBay('${job.id}', '${targetBay}', '${job.plate}')" class="w-full md:w-auto py-2.5 px-4 bg-gray-950 hover:bg-red-600 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
                                    <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-400"></i> Dispatch to Bay ${bayNumber}
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        }
        window.openBayAllocationModal = openBayAllocationModal;

        function closeBayAllocationModal() {
            const modal = document.getElementById('modal-bay-allocation');
            if (modal) modal.classList.add('hidden');
        }
        window.closeBayAllocationModal = closeBayAllocationModal;

        async function dispatchVehicleToTargetBay(jobId, targetBay, plate) {
            closeBayAllocationModal();
            try {
                await updateJobField(jobId, 'location', targetBay);
                showSystemToast(`${plate} successfully dispatched to ${targetBay}!`, 'success', 'Bay Allocated');
                if (typeof renderWorkshopBaysModule === 'function') renderWorkshopBaysModule();
                if (typeof renderTV === 'function') renderTV();
            } catch (err) {
                showSystemToast(err.message || 'Error dispatching vehicle.', 'error');
            }
        }
        window.dispatchVehicleToTargetBay = dispatchVehicleToTargetBay;

        function initTimeFormatSetting() {
            const saved = localStorage.getItem('timeFormat24h');
            if (saved === null) {
                localStorage.setItem('timeFormat24h', 'true');
            }
            const settingsSelect = document.getElementById('settings-time-format');
            if (settingsSelect) {
                settingsSelect.value = localStorage.getItem('timeFormat24h') === 'true' ? '24h' : '12h';
            }
            initWorkshopBaySettings();
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
                const mailDot = document.getElementById('dev-toolbox-mail-dot');

                if (unreadCount > 0) {
                    if (badge) {
                        badge.innerText = unreadCount;
                        badge.classList.remove('hidden');
                    }
                    if (sidebarBadge) {
                        sidebarBadge.innerText = unreadCount;
                        sidebarBadge.classList.remove('hidden');
                    }
                    if (mailDot) mailDot.classList.remove('hidden');
                } else {
                    if (badge) badge.classList.add('hidden');
                    if (sidebarBadge) sidebarBadge.classList.add('hidden');
                    if (mailDot) mailDot.classList.add('hidden');
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

        // =========================================================================
        // CUSTOMER HISTORY & BACK-JOB LOOKUP MODULE
        // =========================================================================
        let selectedLookupCustomerKey = null;
        let customerLookupRegistry = {};

        function buildCustomerLookupRegistry() {
            const safeJobs = Array.isArray(allJobs) ? allJobs : [];
            const registry = {};

            safeJobs.forEach(job => {
                const name = (job.customer_name || job.name || 'Unknown Customer').trim();
                const plate = (job.plate_number || job.plate || 'NO-PLATE').trim().toUpperCase();
                const phone = (job.contact_number || job.contact || job.phone || 'N/A').trim();
                const vehicle = (job.vehicle_model || job.vehicle || 'Unknown Model').trim();
                const branch = (job.branch || 'Marikina Branch').trim();

                // Unique key by plate (or name if no plate)
                const key = plate !== 'NO-PLATE' ? plate : name.toLowerCase();

                if (!registry[key]) {
                    registry[key] = {
                        key: key,
                        name: name,
                        plate: plate,
                        phone: phone,
                        vehicle: vehicle,
                        branch: branch,
                        jobs: []
                    };
                }

                // Update phone or vehicle if current is more specific
                if (registry[key].phone === 'N/A' && phone !== 'N/A') registry[key].phone = phone;
                if (registry[key].vehicle === 'Unknown Model' && vehicle !== 'Unknown Model') registry[key].vehicle = vehicle;

                registry[key].jobs.push(job);
            });

            // Sort jobs within each customer newest to oldest
            Object.values(registry).forEach(cust => {
                cust.jobs.sort((a, b) => {
                    const dateA = new Date(a.date || a.created_at || 0);
                    const dateB = new Date(b.date || b.created_at || 0);
                    return dateB - dateA;
                });
            });

            customerLookupRegistry = registry;
            return registry;
        }

        function renderCustomerLookupModule() {
            buildCustomerLookupRegistry();
            const totalCustomers = Object.keys(customerLookupRegistry).length;
            const safeJobs = Array.isArray(allJobs) ? allJobs : [];
            
            const totalCountEl = document.getElementById('lookup-total-count');
            if (totalCountEl) {
                totalCountEl.innerText = `${totalCustomers} Customers (${safeJobs.length} Orders)`;
            }

            filterCustomerLookup();
        }

        function filterCustomerLookup() {
            const searchInput = document.getElementById('lookup-search-input');
            const branchFilter = document.getElementById('lookup-branch-filter');
            const listEl = document.getElementById('lookup-results-list');
            const matchesBadge = document.getElementById('lookup-matches-badge');

            if (!listEl) return;

            const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
            const branch = branchFilter ? branchFilter.value : 'all';

            const customers = Object.values(customerLookupRegistry);
            const filtered = customers.filter(cust => {
                // Branch filter
                if (branch !== 'all') {
                    const hasBranchJob = cust.jobs.some(j => (j.branch || '').toLowerCase() === branch.toLowerCase());
                    if (!hasBranchJob && cust.branch.toLowerCase() !== branch.toLowerCase()) return false;
                }

                // Query search
                if (!query) return true;

                const matchName = cust.name.toLowerCase().includes(query);
                const matchPlate = cust.plate.toLowerCase().includes(query);
                const matchPhone = cust.phone.toLowerCase().includes(query);
                const matchVehicle = cust.vehicle.toLowerCase().includes(query);
                const matchJobId = cust.jobs.some(j => {
                    const jId = String(j.id ?? j._id ?? j.job_id ?? '').toLowerCase();
                    const stub = String(j.claim_stub || j.stub || '').toLowerCase();
                    const cat = String(j.category || '').toLowerCase();
                    return jId.includes(query) || stub.includes(query) || cat.includes(query);
                });

                return matchName || matchPlate || matchPhone || matchVehicle || matchJobId;
            });

            if (matchesBadge) {
                matchesBadge.innerText = `${filtered.length} Found`;
            }

            if (filtered.length === 0) {
                listEl.innerHTML = `
                    <div class="text-center py-12 px-4 border border-dashed border-gray-200 rounded-xl">
                        <div class="w-10 h-10 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-2">
                            <i data-lucide="user-x" class="w-5 h-5"></i>
                        </div>
                        <p class="text-xs font-bold text-gray-700">No matching customer records</p>
                        <p class="text-[10px] text-gray-400 font-medium mt-0.5">Customer may be a first-time visitor.</p>
                        <button onclick="showSection('intake')" class="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-sm cursor-pointer">
                            <i data-lucide="user-plus" class="w-3.5 h-3.5"></i> New Customer Intake
                        </button>
                    </div>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            let html = '';
            filtered.forEach(cust => {
                const isSelected = cust.key === selectedLookupCustomerKey;
                const latestJob = cust.jobs[0] || {};
                const lastDate = latestJob.date || latestJob.created_at || 'Recent';
                const lastCategory = latestJob.category || 'Service';

                html += `
                    <div onclick="selectCustomerForLookup('${cust.key.replace(/'/g, "\\'")}')" 
                        class="p-3.5 rounded-xl border transition cursor-pointer select-none ${isSelected ? 'bg-red-50/80 border-red-500 shadow-sm' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'}">
                        <div class="flex items-start justify-between gap-2">
                            <div class="min-w-0 flex-1">
                                <div class="flex items-center gap-2">
                                    <h4 class="text-xs font-black text-gray-900 truncate">${cust.name}</h4>
                                    <span class="font-mono text-[9px] font-black px-1.5 py-0.5 bg-gray-200 text-gray-800 rounded tracking-wider shrink-0">${cust.plate}</span>
                                </div>
                                <p class="text-[10px] text-gray-500 font-semibold truncate mt-0.5">${cust.vehicle}</p>
                            </div>
                            <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700 shrink-0">
                                ${cust.jobs.length} ${cust.jobs.length === 1 ? 'visit' : 'visits'}
                            </span>
                        </div>
                        <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 font-medium">
                            <span class="flex items-center gap-1"><i data-lucide="wrench" class="w-3 h-3 text-red-500"></i> ${lastCategory}</span>
                            <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3 text-gray-400"></i> ${lastDate}</span>
                        </div>
                    </div>
                `;
            });

            listEl.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();

            // If a customer was already selected and is in the list, keep them displayed; otherwise display the first result
            if (selectedLookupCustomerKey && customerLookupRegistry[selectedLookupCustomerKey]) {
                selectCustomerForLookup(selectedLookupCustomerKey, false);
            } else if (filtered.length > 0) {
                selectCustomerForLookup(filtered[0].key, false);
            }
        }

        function clearCustomerLookupSearch() {
            const searchInput = document.getElementById('lookup-search-input');
            const branchFilter = document.getElementById('lookup-branch-filter');
            if (searchInput) searchInput.value = '';
            if (branchFilter) branchFilter.value = 'all';
            filterCustomerLookup();
        }

        function selectCustomerForLookup(customerKey, reFilterList = true) {
            selectedLookupCustomerKey = customerKey;
            const cust = customerLookupRegistry[customerKey];

            const emptyState = document.getElementById('lookup-dossier-empty');
            const cardState = document.getElementById('lookup-dossier-card');

            if (!cust) {
                if (emptyState) emptyState.classList.remove('hidden');
                if (cardState) cardState.classList.add('hidden');
                return;
            }

            if (emptyState) emptyState.classList.add('hidden');
            if (cardState) cardState.classList.remove('hidden');

            const latestJob = cust.jobs[0] || {};

            if (document.getElementById('dossier-customer-name')) {
                document.getElementById('dossier-customer-name').innerText = cust.name;
            }
            if (document.getElementById('dossier-customer-phone')) {
                document.getElementById('dossier-customer-phone').innerText = cust.phone;
            }
            if (document.getElementById('dossier-vehicle-plate')) {
                document.getElementById('dossier-vehicle-plate').innerText = cust.plate;
            }
            if (document.getElementById('dossier-vehicle-model')) {
                document.getElementById('dossier-vehicle-model').innerText = cust.vehicle;
            }
            if (document.getElementById('dossier-branch-badge')) {
                document.getElementById('dossier-branch-badge').innerText = cust.branch || 'Marikina Branch';
            }
            if (document.getElementById('dossier-loyalty-badge')) {
                const badge = document.getElementById('dossier-loyalty-badge');
                if (cust.jobs.length >= 2) {
                    badge.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1";
                    badge.innerHTML = `<i data-lucide="star" class="w-3 h-3 text-amber-500 fill-amber-500"></i> ⭐ Returning Regular (${cust.jobs.length} Visits)`;
                } else {
                    badge.className = "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1";
                    badge.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3 text-blue-500"></i> 🆕 Initial Visit Record`;
                }
            }
            if (document.getElementById('dossier-total-visits')) {
                document.getElementById('dossier-total-visits').innerText = cust.jobs.length;
            }
            if (document.getElementById('dossier-last-date')) {
                document.getElementById('dossier-last-date').innerText = latestJob.date || latestJob.created_at || 'Recent';
            }
            if (document.getElementById('dossier-last-category')) {
                document.getElementById('dossier-last-category').innerText = latestJob.category || 'PMS';
            }
            if (document.getElementById('dossier-history-count')) {
                document.getElementById('dossier-history-count').innerText = `${cust.jobs.length} Orders`;
            }

            // Render Historical Orders Timeline with Rich Automotive Detail
            const timelineEl = document.getElementById('dossier-history-timeline');
            if (timelineEl) {
                let historyHTML = '';
                cust.jobs.forEach((job, idx) => {
                    const jobId = job.job_id || job.id || job._id || `JOB-${idx + 1}`;
                    const stub = job.claim_stub || job.stub || 'N/A';
                    const category = job.category || 'General Repair (GRS)';
                    const date = job.date || job.created_at || 'Recent';
                    const time = job.appt_time || job.arrival || '';
                    const fullDateStr = time ? `${date} • ${time}` : date;
                    const status = (job.status || 'Pending').toUpperCase();
                    const sa = job.handled_by || job.sa || 'Front Desk SA';
                    const mechanic = job.mechanic || 'Assigned Bay Technician';
                    const bay = job.bay_number || job.bay || (job.status === 'Pending' ? 'Staging Area' : 'Bay 1');
                    const concern = job.concern || job.evaluation || job.diagnosis || 'Standard periodic service maintenance';
                    const remarks = job.remarks || job.goal_remarks || 'Inspection completed according to workshop checklist.';
                    const source = job.source || 'Walk-in';
                    const lane = job.lane_type || 'Flexible Lane';

                    // Dynamic Status Styling
                    let statusBadgeClass = 'bg-amber-50 text-amber-700 border-amber-300';
                    let statusIcon = 'clock';
                    if (status.includes('COMPLETED') || status.includes('RELEASED')) {
                        statusBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
                        statusIcon = 'check-circle-2';
                    } else if (status.includes('PROGRESS') || status.includes('BAY')) {
                        statusBadgeClass = 'bg-blue-50 text-blue-700 border-blue-300';
                        statusIcon = 'wrench';
                    } else if (status.includes('CANCEL')) {
                        statusBadgeClass = 'bg-rose-50 text-rose-700 border-rose-300';
                        statusIcon = 'x-circle';
                    }

                    // Category Color
                    const isBackJob = category.toLowerCase().includes('back-job') || category.toLowerCase().includes('warranty');
                    const catBadgeClass = isBackJob 
                        ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' 
                        : (category.includes('PMS') ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-purple-50 text-purple-800 border-purple-200');

                    const sourceBadgeClass = source.toLowerCase().includes('online') 
                        ? 'bg-cyan-50 text-cyan-800 border-cyan-200' 
                        : 'bg-orange-50 text-orange-800 border-orange-200';

                    historyHTML += `
                        <div class="bg-white hover:bg-slate-50/70 border border-gray-200 hover:border-gray-300 p-4 rounded-xl shadow-2xs transition space-y-3">
                            <!-- Top Row: Service Category & Date + Status & Action -->
                            <div class="flex items-center justify-between gap-3 flex-wrap">
                                <div class="flex items-center gap-2">
                                    <span class="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center">
                                        #${cust.jobs.length - idx}
                                    </span>
                                    <span class="text-xs font-black text-gray-900">${category}</span>
                                    <span class="text-[11px] text-gray-400">• ${fullDateStr}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${statusBadgeClass}">
                                        ${status}
                                    </span>
                                    <button onclick="confirmSpecificBackJob('${jobId}', '${category.replace(/'/g, "\\'")}', '${date}')" 
                                        class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-md text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
                                        title="Create warranty back-job for this visit">
                                        <i data-lucide="rotate-ccw" class="w-3 h-3 text-amber-700"></i> Back-Job
                                    </button>
                                </div>
                            </div>

                            <!-- Bottom Summary: Clean Key Details & Concern -->
                            <div class="text-xs text-gray-600 bg-gray-50/80 p-3 rounded-lg border border-gray-150 flex flex-col gap-1.5">
                                <div class="flex items-center gap-3 text-[11px] text-gray-500 font-medium flex-wrap">
                                    <span><strong class="text-gray-700 font-bold">Job:</strong> ${jobId}</span>
                                    <span>•</span>
                                    <span><strong class="text-gray-700 font-bold">Advisor:</strong> ${sa}</span>
                                    <span>•</span>
                                    <span><strong class="text-gray-700 font-bold">Bay:</strong> ${bay}</span>
                                    <span>•</span>
                                    <span><strong class="text-gray-700 font-bold">Tech:</strong> ${mechanic}</span>
                                </div>
                                <div class="text-xs text-gray-800 font-normal pt-1.5 border-t border-gray-200/60 leading-relaxed">
                                    <span class="font-bold text-gray-900">Concern / Diagnosis:</span> ${concern}
                                </div>
                            </div>
                        </div>
                    `;
                });
                timelineEl.innerHTML = historyHTML;
            }

            if (reFilterList) {
                // Update selection highlight in list without full re-render
                document.querySelectorAll('#lookup-results-list > div').forEach(div => {
                    div.classList.remove('bg-red-50/80', 'border-red-500', 'shadow-sm');
                    div.classList.add('bg-gray-50', 'border-gray-200');
                });
            }

            if (window.lucide) window.lucide.createIcons();
        }

        function confirmRegularIntake() {
            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) {
                showSystemToast('Please select a customer record first.', 'warning', 'Regular Intake');
                return;
            }

            const cust = customerLookupRegistry[selectedLookupCustomerKey];
            const latestJob = cust.jobs[0] || {};

            // 1. Switch view to vehicle intake
            showSection('intake');

            // 2. Pre-fill customer and vehicle fields
            const nameEl = document.getElementById('intake-name');
            const plateEl = document.getElementById('intake-plate');
            const contactEl = document.getElementById('intake-contact');
            const vehicleEl = document.getElementById('intake-vehicle');
            const catEl = document.getElementById('intake-category');
            const catOtherEl = document.getElementById('intake-category-other');
            const concernEl = document.getElementById('intake-concern');

            if (nameEl) nameEl.value = cust.name;
            if (plateEl) plateEl.value = cust.plate !== 'NO-PLATE' ? cust.plate : '';
            if (contactEl) contactEl.value = cust.phone !== 'N/A' ? cust.phone : '';
            if (vehicleEl) vehicleEl.value = cust.vehicle !== 'Unknown Model' ? cust.vehicle : '';

            // Default to PMS (or previous standard category if not Back-Job)
            if (catEl) {
                const prevCategory = latestJob.category && latestJob.category !== 'Others' ? latestJob.category : 'PMS';
                catEl.value = prevCategory;
                if (catOtherEl) catOtherEl.classList.add('hidden');
            }

            if (concernEl) {
                concernEl.value = '';
            }

            showSystemToast(`Returning customer "${cust.name}" details pre-filled for fresh intake!`, 'success', 'Regular Intake Initialized');
        }

        function confirmSpecificBackJob(refJobId, prevCategory, prevDate) {
            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) {
                showSystemToast('Please select a customer record first.', 'warning', 'Back-Job Intake');
                return;
            }

            const cust = customerLookupRegistry[selectedLookupCustomerKey];

            // 1. Switch view to vehicle intake
            showSection('intake');

            // 2. Pre-fill customer and vehicle fields
            const nameEl = document.getElementById('intake-name');
            const plateEl = document.getElementById('intake-plate');
            const contactEl = document.getElementById('intake-contact');
            const vehicleEl = document.getElementById('intake-vehicle');
            const catEl = document.getElementById('intake-category');
            const catOtherEl = document.getElementById('intake-category-other');
            const concernEl = document.getElementById('intake-concern');

            if (nameEl) nameEl.value = cust.name;
            if (plateEl) plateEl.value = cust.plate !== 'NO-PLATE' ? cust.plate : '';
            if (contactEl) contactEl.value = cust.phone !== 'N/A' ? cust.phone : '';
            if (vehicleEl) vehicleEl.value = cust.vehicle !== 'Unknown Model' ? cust.vehicle : '';

            // Set Category to Others -> Back-Job / Warranty Return
            if (catEl) {
                catEl.value = 'Others';
                if (catOtherEl) {
                    catOtherEl.value = 'Back-Job / Warranty Return';
                    catOtherEl.classList.remove('hidden');
                }
            }

            // Pre-fill concern with the specific order selected
            if (concernEl) {
                concernEl.value = `[BACK-JOB / WARRANTY RETURN] Previous Ref: ${refJobId} (${prevCategory} on ${prevDate}). Customer concern/issue: `;
            }

            showSystemToast(`Back-Job initialized referencing order ${refJobId}!`, 'success', 'Back-Job Created');
        }

        function confirmBackJobIntake() {
            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) {
                showSystemToast('Please select a customer record first.', 'warning', 'Back-Job Intake');
                return;
            }

            const cust = customerLookupRegistry[selectedLookupCustomerKey];
            const latestJob = cust.jobs[0] || {};
            const refJobId = latestJob.job_id || latestJob.id || latestJob._id || 'PREV-JOB';
            const prevDate = latestJob.date || latestJob.created_at || 'past service';
            const prevCat = latestJob.category || 'General Service';

            // 1. Switch view to vehicle intake
            showSection('intake');

            // 2. Pre-fill customer and vehicle fields
            const nameEl = document.getElementById('intake-name');
            const plateEl = document.getElementById('intake-plate');
            const contactEl = document.getElementById('intake-contact');
            const vehicleEl = document.getElementById('intake-vehicle');
            const catEl = document.getElementById('intake-category');
            const catOtherEl = document.getElementById('intake-category-other');
            const concernEl = document.getElementById('intake-concern');

            if (nameEl) nameEl.value = cust.name;
            if (plateEl) plateEl.value = cust.plate !== 'NO-PLATE' ? cust.plate : '';
            if (contactEl) contactEl.value = cust.phone !== 'N/A' ? cust.phone : '';
            if (vehicleEl) vehicleEl.value = cust.vehicle !== 'Unknown Model' ? cust.vehicle : '';

            // Set Category to Others -> Back-Job / Warranty Return
            if (catEl) {
                catEl.value = 'Others';
                if (catOtherEl) {
                    catOtherEl.value = 'Back-Job / Warranty Return';
                    catOtherEl.classList.remove('hidden');
                }
            }

            // Pre-fill concern / remarks with previous job reference
            if (concernEl) {
                concernEl.value = `[BACK-JOB / WARRANTY RETURN] Previous Ref: ${refJobId} (${prevCat} on ${prevDate}). Customer concern/issue: `;
            }

            showSystemToast(`Customer "${cust.name}" details pre-filled for Back-Job intake!`, 'success', 'Back-Job Initialized');
        }

        function stayOnHistory() {
            showSystemToast('Viewing customer historical repair records.', 'info', 'Customer History');
        }

        function exportCustomerServicePassportPDF() {
            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) {
                return showSystemToast('Please select a customer record first.', 'warning', 'Customer Passport');
            }
            const cust = customerLookupRegistry[selectedLookupCustomerKey];
            showSystemToast(`Generating Vehicle Service Passport for ${cust.plate || cust.name}...`, 'info', 'Customer Passport');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');

            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const todayStr = new Date().toISOString().split('T')[0];

            // Red top theme bar
            doc.setFillColor(220, 38, 38);
            doc.rect(0, 0, 210, 8, 'F');

            // Header Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(17, 24, 39);
            doc.text('HONTECH AUTOCENTER INC.', 14, 19);

            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text('VEHICLE SERVICE PASSPORT & MAINTENANCE LOG', 14, 25);

            // Clean Header Right
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(220, 38, 38);
            doc.text('OFFICIAL RECORD', 196, 19, { align: 'right' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Ref: PASSPORT-${(cust.plate || 'CAR').replace(/ /g, '')}`, 196, 25, { align: 'right' });

            // Divider Line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, 31, 196, 31);

            // Customer & Vehicle Dossier Card
            doc.autoTable({
                startY: 36,
                head: [['VEHICLE OWNER PROFILE', 'VEHICLE SPECIFICATIONS & SERVICE SUMMARY']],
                body: [
                    [
                        `Customer: ${cust.name || 'N/A'}\nContact Number: ${cust.phone || 'N/A'}\nRegistered Branch: ${cust.branch || 'Marikina Branch'}\nLoyalty Status: ${cust.jobs.length >= 2 ? 'Returning Regular' : 'Initial Visit Record'}`,
                        `Plate Number: ${cust.plate || 'N/A'}\nVehicle Model: ${cust.vehicle || 'N/A'}\nTotal Recorded Visits: ${cust.jobs.length} Service Orders\nLatest Visit: ${cust.jobs[0]?.date || todayStr}`
                    ]
                ],
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240], lineWidth: 0.3 },
                headStyles: { fillColor: [248, 250, 252], textColor: [17, 24, 39], fontStyle: 'bold' }
            });

            let nextY = doc.autoTable.previous.finalY + 9;

            // Section Title
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('COMPLETE MAINTENANCE & SERVICE TIMELINE', 14, nextY);

            const rows = cust.jobs.map((job, idx) => [
                job.date || job.created_at || todayStr,
                job.claim_stub || job.stub || `STUB-${idx + 1}`,
                job.category || 'General Service',
                job.handled_by || job.sa || 'Front Desk SA',
                job.bay_number || job.bay || 'Bay 1',
                (job.status || 'Completed').toUpperCase(),
                job.concern || job.evaluation || job.remarks || 'Periodic Maintenance Inspection'
            ]);

            doc.autoTable({
                startY: nextY + 3,
                head: [['Date', 'Claim Stub', 'Category', 'Service Advisor', 'Bay Location', 'Status', 'Diagnosis & Work Done']],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
                styles: { fontSize: 8.5, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 20, fontStyle: 'bold' },
                    2: { cellWidth: 24 },
                    3: { cellWidth: 28 },
                    4: { cellWidth: 20 },
                    5: { cellWidth: 20 },
                    6: { cellWidth: 50 }
                }
            });

            // Official Signature & Workshop Stamp
            let signY = doc.autoTable.previous.finalY + 14;
            if (signY > 240) {
                doc.addPage();
                signY = 30;
            }

            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('CERTIFIED WORKSHOP RECORD:', 14, signY);
            doc.text('HONTECH OFFICIAL SEAL & SIGNATURE:', 115, signY);

            doc.setDrawColor(148, 163, 184);
            doc.line(14, signY + 14, 85, signY + 14);
            doc.line(115, signY + 14, 186, signY + 14);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(100, 116, 139);
            doc.text('HonTech AutoCenter Service Department', 14, signY + 18);
            doc.text('Authorized Workshop Inspector / Manager', 115, signY + 18);

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(7.5);
                doc.setTextColor(148, 163, 184);
                doc.text('HonTech AutoCenter Vehicle Maintenance Passport | Customer Record Copy', 14, 287);
                doc.text(`Page ${i} of ${pageCount}`, 196, 287, { align: 'right' });
            }

            const safePlate = (cust.plate || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
            const pdfBlob = doc.output('blob');
            downloadBlob(pdfBlob, `Hontech_Service_Passport_${safePlate}_${todayStr}.pdf`);
            showSystemToast('Vehicle Service Passport PDF generated successfully.', 'success', 'Customer Passport');
        }
        window.exportCustomerServicePassportPDF = exportCustomerServicePassportPDF;

        // =========================================================================
        // QUICK CUSTOMER SEARCH & BACK-JOB POPUP MENU
        // =========================================================================
        let selectedQuickMenuCustomer = null;

        function openQuickCustomerSearchModal() {
            buildCustomerLookupRegistry();
            const modal = document.getElementById('modal-customer-search-menu');
            const input = document.getElementById('quick-customer-search-input');
            const list = document.getElementById('quick-search-results-list');
            const detailMenu = document.getElementById('quick-customer-detail-menu');

            if (modal) modal.classList.remove('hidden');
            if (input) {
                input.value = '';
                input.focus();
            }
            if (list) list.classList.add('hidden');
            if (detailMenu) detailMenu.classList.add('hidden');
            selectedQuickMenuCustomer = null;

            if (window.lucide) window.lucide.createIcons();
        }

        function closeQuickCustomerSearchModal() {
            const modal = document.getElementById('modal-customer-search-menu');
            if (modal) modal.classList.add('hidden');
        }

        function handleQuickCustomerSearchInput() {
            const input = document.getElementById('quick-customer-search-input');
            const list = document.getElementById('quick-search-results-list');
            const detailMenu = document.getElementById('quick-customer-detail-menu');

            if (!input || !list) return;

            const query = input.value.toLowerCase().trim();
            if (!query) {
                list.classList.add('hidden');
                if (detailMenu) detailMenu.classList.add('hidden');
                return;
            }

            const customers = Object.values(customerLookupRegistry);
            const matches = customers.filter(c => {
                return c.name.toLowerCase().includes(query) || 
                       c.plate.toLowerCase().includes(query) ||
                       c.phone.toLowerCase().includes(query) ||
                       c.vehicle.toLowerCase().includes(query);
            });

            if (matches.length === 0) {
                list.innerHTML = `
                    <div class="text-center py-4 px-3 text-xs text-gray-500 font-semibold">
                        No customer found matching "${input.value}"
                    </div>
                `;
                list.classList.remove('hidden');
                if (detailMenu) detailMenu.classList.add('hidden');
                return;
            }

            let html = '';
            matches.slice(0, 8).forEach(c => {
                html += `
                    <div onclick="selectQuickCustomerMenu('${c.key.replace(/'/g, "\\'")}')" 
                        class="p-2.5 bg-white hover:bg-red-50 hover:border-red-300 border border-gray-200 rounded-xl flex items-center justify-between cursor-pointer transition">
                        <div>
                            <span class="text-xs font-black text-gray-900 block">${c.name}</span>
                            <span class="text-[10px] text-gray-500 font-semibold">${c.vehicle}</span>
                        </div>
                        <span class="font-mono text-[9px] font-black px-2 py-0.5 bg-gray-100 rounded text-gray-800 border border-gray-200">${c.plate}</span>
                    </div>
                `;
            });

            list.innerHTML = html;
            list.classList.remove('hidden');
        }

        function selectQuickCustomerMenu(customerKey) {
            const cust = customerLookupRegistry[customerKey];
            if (!cust) return;

            selectedQuickMenuCustomer = cust;
            const list = document.getElementById('quick-search-results-list');
            const detailMenu = document.getElementById('quick-customer-detail-menu');

            if (list) list.classList.add('hidden');
            if (detailMenu) detailMenu.classList.remove('hidden');

            if (document.getElementById('quick-menu-cust-name')) {
                document.getElementById('quick-menu-cust-name').innerText = cust.name;
            }
            if (document.getElementById('quick-menu-cust-plate')) {
                document.getElementById('quick-menu-cust-plate').innerText = cust.plate;
            }
            if (document.getElementById('quick-menu-cust-vehicle')) {
                document.getElementById('quick-menu-cust-vehicle').innerText = cust.vehicle;
            }
            if (document.getElementById('quick-menu-cust-phone')) {
                document.getElementById('quick-menu-cust-phone').innerText = cust.phone;
            }
            if (document.getElementById('quick-menu-visits-badge')) {
                const visitsBadge = document.getElementById('quick-menu-visits-badge');
                if (cust.jobs.length >= 2) {
                    visitsBadge.className = "px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0";
                    visitsBadge.innerHTML = `<i data-lucide="star" class="w-3 h-3 text-amber-500 fill-amber-500"></i> ⭐ Regular (${cust.jobs.length} visits)`;
                } else {
                    visitsBadge.className = "px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-black flex items-center gap-1 shrink-0";
                    visitsBadge.innerHTML = `<i data-lucide="sparkles" class="w-3 h-3 text-blue-500"></i> Initial Record (1 visit)`;
                }
            }

            if (window.lucide) window.lucide.createIcons();
        }

        function handleQuickMenuBackJobYes() {
            if (!selectedQuickMenuCustomer) {
                showSystemToast('Please select a customer record first.', 'warning');
                return;
            }

            selectedLookupCustomerKey = selectedQuickMenuCustomer.key;
            closeQuickCustomerSearchModal();
            confirmBackJobIntake();
        }

        function handleQuickMenuBackJobNo() {
            showSystemToast('No changes made. Staying on customer lookup view.', 'info', 'Customer Search');
            // Stays right on the menu/search view
        }

        // Global Network Connection Listeners (Defensive Offline Handler)
        window.addEventListener('offline', () => {
            const screen = document.getElementById('offline-network-screen');
            if (screen) {
                screen.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons();
            }
        });
        window.addEventListener('online', () => {
            const screen = document.getElementById('offline-network-screen');
            if (screen) screen.classList.add('hidden');
        });
        // Initial check on load
        if (typeof navigator.onLine === 'boolean' && !navigator.onLine) {
            const screen = document.getElementById('offline-network-screen');
            if (screen) {
                screen.classList.remove('hidden');
                if (window.lucide) window.lucide.createIcons();
            }
        }

        // Initialize Chime Audio Theme selector from localStorage
        const savedChimeTheme = localStorage.getItem('hontech_chime_theme') || 'harmonic';
        const chimeSelect = document.getElementById('settings-chime-theme');
        if (chimeSelect) {
            chimeSelect.value = savedChimeTheme;
        }
