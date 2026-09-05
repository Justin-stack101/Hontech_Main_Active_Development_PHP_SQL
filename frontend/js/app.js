        // Defensive global stub for third-party icon library in offline/lagging CDN environments
        if (typeof window.lucide === 'undefined' || typeof window.lucide.createIcons !== 'function') {
            window.lucide = { createIcons: function () { } };
        }

        function escapeHtml(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }
        window.escapeHtml = escapeHtml;

        function formatFieldName(field) {
            if (!field) return 'System Action';
            const map = {
                'departure': 'Departure Time',
                'arrival': 'Arrival Time',
                'evaluation': 'Diagnosis / Evaluation',
                'category': 'Service Category',
                'laneType': 'Lane Type',
                'promisedDate': 'Promised Date',
                'carryOverStatus': 'Carry Over Status',
                'status': 'Job Status',
                'remarks': 'Remarks & Notes',
                'location': 'Workshop Bay',
                'saName': 'Ticket Handover (SA)',
                'express_delay_report': 'Express Delay Report'
            };
            return map[field] || field;
        }
        window.formatFieldName = formatFieldName;

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
        let intakeAdvisorFilter = 'all';
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
            if (type === 'advisor') intakeAdvisorFilter = value;
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
            const modal = document.getElementById('dev-toolbox-modal');
            if (!modal) return;

            const isHidden = modal.classList.contains('hidden');
            const shouldShow = typeof forceState === 'boolean' ? forceState : isHidden;

            if (shouldShow) {
                modal.classList.remove('hidden');
                showSystemToast('🛠️ Developer Toolbox active (Press Ctrl + D to toggle)', 'info', 'Developer Sandbox');
            } else {
                modal.classList.add('hidden');
            }
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        // Global Developer Shortcut: Press Ctrl + D or Cmd + D anywhere to open/close Developer Toolbox
        window.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                toggleDevToolbox();
                return;
            }
            if (e.key === 'Escape') {
                const modal = document.getElementById('dev-toolbox-modal');
                if (modal && !modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
            }
        });

        // Close Dev Toolbox when clicking outside modal dialog
        window.addEventListener('click', function(e) {
            const modal = document.getElementById('dev-toolbox-modal');
            if (modal && !modal.classList.contains('hidden') && e.target === modal) {
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
            const userBranch = currentUserBranch || 'Marikina Branch';

            if (document.getElementById('header-user-name')) {
                document.getElementById('header-user-name').innerText = userDisplayName;
                document.getElementById('header-user-name').title = `${userDisplayName} (${userRoleLabel} - ${userBranch})`;
            }
            if (document.getElementById('header-user-branch-text')) {
                document.getElementById('header-user-branch-text').innerText = userBranch;
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
                document.getElementById('sidebar-menu-user-name').title = `${userDisplayName} (${userRoleLabel} - ${userBranch})`;
            }
            if (document.getElementById('sidebar-menu-user-role')) {
                document.getElementById('sidebar-menu-user-role').innerText = `${userBranch} • ${userRoleLabel}`;
            }

            if (document.getElementById('dropdown-user-name')) {
                document.getElementById('dropdown-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('dropdown-user-branch')) {
                document.getElementById('dropdown-user-branch').innerText = userBranch;
            }
            if (document.getElementById('dropdown-user-email')) {
                document.getElementById('dropdown-user-email').innerText = currentUserEmail || 'user@hontech.com';
            }
            if (document.getElementById('dropdown-user-role')) {
                document.getElementById('dropdown-user-role').innerText = userRoleLabel;
            }

            if (document.getElementById('sidebar-dropdown-user-name')) {
                document.getElementById('sidebar-dropdown-user-name').innerText = userDisplayName;
            }
            if (document.getElementById('sidebar-dropdown-user-branch')) {
                document.getElementById('sidebar-dropdown-user-branch').innerText = userBranch;
            }
            if (document.getElementById('sidebar-dropdown-user-email')) {
                document.getElementById('sidebar-dropdown-user-email').innerText = currentUserEmail || 'user@hontech.com';
            }
            if (document.getElementById('sidebar-dropdown-user-role')) {
                document.getElementById('sidebar-dropdown-user-role').innerText = userRoleLabel;
            }

            // --- RBAC for Security Settings & Bay Capacity ---
            const isOwnerOrAdmin = (role === 'owner' || role === 'admin');
            const isAdmin = (role === 'admin');
            
            if (document.getElementById('profile-change-password-container')) {
                document.getElementById('profile-change-password-container').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }
            if (document.getElementById('settings-security-container')) {
                document.getElementById('settings-security-container').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }
            if (document.getElementById('settings-bay-config-container')) {
                // Both Owner and Administrator have authority to configure facility max capacity ceiling
                document.getElementById('settings-bay-config-container').style.display = isOwnerOrAdmin ? 'block' : 'none';
            }
            if (document.getElementById('bays-control-card')) {
                // SA and Admin can scale active floor bays; Owner is view-only
                document.getElementById('bays-control-card').style.display = (role !== 'owner') ? 'block' : 'none';
            }

            if (role === 'owner') {
                if (document.getElementById('sidebar-user-role')) {
                    document.getElementById('sidebar-user-role').innerText = 'Owner (Executive)';
                }
                if (document.getElementById('header-actions')) {
                    document.getElementById('header-actions').classList.remove('hidden');
                }

                // Owner: Analytics Only & High-Level Telemetry (Customer Lookup removed per specification)
                navHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="pie-chart" class="w-4 h-4"></i> Analytics</button>`;
                navHTML += `<button onclick="showSection('bays', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4"></i> Workshop Bays (View-Only)</button>`;
                navHTML += `<button onclick="showSection('staff', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="users" class="w-4 h-4"></i> Staff Access</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="database" class="w-4 h-4"></i> Records</button>`;

                sidebarNavHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="pie-chart" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Analytics</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Workshop Bays</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('staff', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="users" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Staff Access</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="database" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Records</span></button>`;

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

                sidebarNavHTML += `<button onclick="showSection('dashboard', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="pie-chart" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Analytics</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Workshop Bays</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('staff', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="users" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Staff Access</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="database" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Records</span></button>`;

                defaultView = 'dashboard';
            }
            else if (role === 'assistant') {
                if (document.getElementById('sidebar-user-role')) {
                    document.getElementById('sidebar-user-role').innerText = 'Assistant';
                }
                if (document.getElementById('header-actions')) {
                    document.getElementById('header-actions').classList.add('hidden');
                }

                // Assistant Order: 1. Online Bookings, 2. Master Queue, 3. Customer Lookup, 4. TV Monitor (Bay Status excluded per specification)
                navHTML += `<button onclick="showSection('intake', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="calendar-plus" class="w-4 h-4"></i> Online Bookings</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="list-todo" class="w-4 h-4"></i> Master Queue</button>`;
                navHTML += `<button onclick="showSection('lookup', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Customer Lookup</button>`;
                navHTML += `<button onclick="launchTVMode()" class="px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 text-gray-500 flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4"></i> TV Monitor</button>`;

                sidebarNavHTML += `<button onclick="showSection('intake', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="calendar-plus" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Online Bookings</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="list-todo" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Master Queue</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="launchTVMode()" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-400 text-[13.5px]"><i data-lucide="monitor" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">TV Monitor</span></button>`;

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

                // Service Advisor Order: 1. Walk-In Form, 2. Daily Intakes / Master Queue, 3. Customer Lookup, 4. Bay Status, 5. TV Monitor
                navHTML += `<button onclick="showSection('intake', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="user-plus" class="w-4 h-4"></i> Walk-In Form</button>`;
                navHTML += `<button onclick="showSection('queue', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="clipboard-list" class="w-4 h-4"></i> Daily Intakes</button>`;
                navHTML += `<button onclick="showSection('lookup', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4"></i> Customer Lookup</button>`;
                navHTML += `<button onclick="showSection('bays', this)" class="nav-btn px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 flex items-center gap-2"><i data-lucide="layout-grid" class="w-4 h-4"></i> Bay Status</button>`;
                navHTML += `<button onclick="launchTVMode()" class="px-4 py-2 rounded-lg font-bold transition hover:bg-gray-100 text-gray-500 flex items-center gap-2"><i data-lucide="monitor" class="w-4 h-4"></i> TV Monitor</button>`;

                sidebarNavHTML += `<button onclick="showSection('intake', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="user-plus" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Walk-In Form</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('queue', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="clipboard-list" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Daily Intakes</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('lookup', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="history" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Customer Lookup</span></button>`;
                sidebarNavHTML += `<button onclick="showSection('bays', this)" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-300 text-[13.5px]"><i data-lucide="layout-grid" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">Bay Status</span></button>`;
                sidebarNavHTML += `<button onclick="launchTVMode()" class="nav-btn w-full px-3.5 py-2.5 rounded-xl font-bold transition-all hover:bg-gray-100 flex items-center gap-3 text-slate-400 text-[13.5px]"><i data-lucide="monitor" class="w-5 h-5 shrink-0"></i><span class="nav-text whitespace-nowrap">TV Monitor</span></button>`;

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

        function toggleUserDropdown(e) {
            if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
            }
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown) {
                const isHidden = dropdown.classList.contains('hidden');
                dropdown.classList.toggle('hidden');
                
                // Populate user email badge in dropdown defensively
                const emailEl = document.getElementById('header-dropdown-user-email') || document.getElementById('dropdown-user-email');
                if (emailEl) {
                    emailEl.innerText = (typeof currentUserEmail !== 'undefined' && currentUserEmail) ? currentUserEmail : 'user@hontech.com';
                }

                // Close sidebar dropdown if open
                const sDropdown = document.getElementById('sidebar-user-dropdown');
                if (sDropdown) sDropdown.classList.add('hidden');

                if (isHidden && window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        }
        window.toggleUserDropdown = toggleUserDropdown;

        function toggleSidebarDropdown(e) {
            if (e && typeof e.stopPropagation === 'function') {
                e.stopPropagation();
            }
            const dropdown = document.getElementById('sidebar-user-dropdown');
            if (dropdown) {
                const isHidden = dropdown.classList.contains('hidden');
                dropdown.classList.toggle('hidden');

                // Populate user email badge in dropdown defensively
                const emailEl = document.getElementById('sidebar-dropdown-user-email') || document.getElementById('dropdown-user-email');
                if (emailEl) {
                    emailEl.innerText = (typeof currentUserEmail !== 'undefined' && currentUserEmail) ? currentUserEmail : 'user@hontech.com';
                }

                // Close header dropdown if open
                const uDropdown = document.getElementById('user-dropdown');
                if (uDropdown) uDropdown.classList.add('hidden');

                if (isHidden && window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            }
        }
        window.toggleSidebarDropdown = toggleSidebarDropdown;

        // Close dropdown when clicking outside
        window.addEventListener('click', function(e) {
            const dropdown = document.getElementById('user-dropdown');
            if (dropdown && !dropdown.classList.contains('hidden')) {
                const trigger = document.getElementById('header-user-dropdown-btn') || dropdown.previousElementSibling;
                if ((!trigger || !trigger.contains(e.target)) && !dropdown.contains(e.target)) {
                    dropdown.classList.add('hidden');
                }
            }
            const sDropdown = document.getElementById('sidebar-user-dropdown');
            if (sDropdown && !sDropdown.classList.contains('hidden')) {
                const sTrigger = document.getElementById('sidebar-footer-expanded') || sDropdown.parentElement;
                if ((!sTrigger || !sTrigger.contains(e.target)) && !sDropdown.contains(e.target)) {
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

        // (toggleSidebarDropdown defined above with event stopPropagation)

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
            // Guard: Assistant does not have Bay Status reader permissions
            if (id === 'bays' && currentUserRole === 'assistant') {
                showSystemToast('Access Restricted: Assistant role does not have Bay Status reader access.', 'warning', 'Permission Denied');
                showSection('intake');
                return;
            }

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
            const roles = { 'owner': 'Owner', 'admin': 'Administrator', 'assistant': 'Assistant', 'sa': 'Service Advisor' };
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

        function setCurrentTimeToArrival() {
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const timeVal = `${hh}:${mm}`;
            
            const arrivalInput = document.getElementById('intake-arrival-time');
            if (arrivalInput) arrivalInput.value = timeVal;
            
            syncArrivalTimeToHiddenSelects();
            showSystemToast(`Arrival time set to current reception time (${timeVal}).`, 'info', 'Time Captured');
        }
        window.setCurrentTimeToArrival = setCurrentTimeToArrival;

        function setQuickArrivalSlot(timeStr) {
            const arrivalInput = document.getElementById('intake-arrival-time');
            if (arrivalInput) arrivalInput.value = timeStr;
            syncArrivalTimeToHiddenSelects();
            showSystemToast(`Arrival time set to ${timeStr}.`, 'info', 'Arrival Time');
        }
        window.setQuickArrivalSlot = setQuickArrivalSlot;

        function syncArrivalTimeToHiddenSelects() {
            const arrivalInput = document.getElementById('intake-arrival-time');
            if (!arrivalInput) return;
            const parts = (arrivalInput.value || '08:00').split(':');
            const hh = parts[0] || '08';
            const mm = parts[1] || '00';

            const arrHour = document.getElementById('intake-arrival-hour');
            const arrMin = document.getElementById('intake-arrival-minute');
            if (arrHour) arrHour.value = hh;
            if (arrMin) arrMin.value = mm;
        }
        window.syncArrivalTimeToHiddenSelects = syncArrivalTimeToHiddenSelects;

        function selectQuickApptSlot(timeStr) {
            const apptInput = document.getElementById('intake-appt-time');
            if (apptInput) apptInput.value = timeStr;
            syncApptTimeToHiddenSelects();

            // Highlight active appointment button with rich indigo styling
            document.querySelectorAll('.appt-slot-btn').forEach(btn => {
                if (btn.getAttribute('onclick')?.includes(timeStr)) {
                    btn.className = "appt-slot-btn py-1.5 text-center text-xs font-black rounded-lg bg-indigo-600 text-white border border-indigo-600 shadow-sm transition cursor-pointer active:scale-95";
                } else {
                    btn.className = "appt-slot-btn py-1.5 text-center text-xs font-bold rounded-lg bg-slate-50 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 transition cursor-pointer active:scale-95";
                }
            });
            showSystemToast(`Appointment slot set to ${timeStr}.`, 'info', 'Slot Selected');
        }
        window.selectQuickApptSlot = selectQuickApptSlot;

        function syncApptTimeToHiddenSelects() {
            const apptInput = document.getElementById('intake-appt-time');
            if (!apptInput) return;
            const parts = (apptInput.value || '09:00').split(':');
            const hh = parts[0] || '09';
            const mm = parts[1] || '00';

            const apptHour = document.getElementById('intake-appt-hour');
            const apptMin = document.getElementById('intake-appt-minute');
            if (apptHour) apptHour.value = hh;
            if (apptMin) apptMin.value = mm;
        }
        window.syncApptTimeToHiddenSelects = syncApptTimeToHiddenSelects;

        function setupIntakeForm(role) {
            const title = document.getElementById('intake-title');
            const subtitle = document.getElementById('intake-subtitle');
            const roleBadge = document.getElementById('intake-role-badge');
            const iconWrap = document.getElementById('intake-icon-wrap');
            const card3Title = document.getElementById('intake-card3-title');
            const source = document.getElementById('intake-source');
            const walkinFields = document.getElementById('div-walkin-fields');
            const bookingFields = document.getElementById('div-booking-fields');
            const walkinLaneWrap = document.getElementById('div-walkin-lane-wrap');
            const bookingLaneWrap = document.getElementById('div-booking-lane-wrap');
            const submitBtn = document.getElementById('intake-submit-btn');
            const submitText = document.getElementById('intake-submit-text');

            const today = new Date().toISOString().split('T')[0];
            const dateEl = document.getElementById('intake-date');
            if (dateEl) dateEl.value = today;

            const arrHour = document.getElementById('intake-arrival-hour');
            const arrMin = document.getElementById('intake-arrival-minute');
            const apptHour = document.getElementById('intake-appt-hour');
            const apptMin = document.getElementById('intake-appt-minute');

            const now = new Date();
            const currHour = String(now.getHours()).padStart(2, '0');
            const currMin = String(now.getMinutes()).padStart(2, '0');
            const currentTimeStr = `${currHour}:${currMin}`;

            // Initialize Modern Time Pickers
            const arrivalInput = document.getElementById('intake-arrival-time');
            if (arrivalInput) arrivalInput.value = currentTimeStr;

            const apptInput = document.getElementById('intake-appt-time');
            if (apptInput) apptInput.value = '09:00';

            // Sync live clock badge
            const liveClockBadge = document.getElementById('intake-live-clock-badge');
            if (liveClockBadge) liveClockBadge.innerText = currentTimeStr;

            if (arrHour) arrHour.innerHTML = getHourOptions(currHour);
            if (arrMin) arrMin.innerHTML = getMinuteOptions(currMin);
            if (apptHour) apptHour.innerHTML = getHourOptions('09');
            if (apptMin) apptMin.innerHTML = getMinuteOptions('00');

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
                if (title) title.innerText = 'Online Booking Form';
                if (subtitle) subtitle.innerText = 'LOG ONLINE INQUIRIES TO BOOKING MODULE.';
                if (iconWrap) iconWrap.className = 'w-11 h-11 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0';
                if (source) source.value = 'Online';
                if (walkinFields) walkinFields.classList.add('hidden');
                if (bookingFields) bookingFields.classList.remove('hidden');
                if (walkinLaneWrap) walkinLaneWrap.classList.add('hidden');
                if (bookingLaneWrap) bookingLaneWrap.classList.remove('hidden');
                const walkinStubWrap = document.getElementById('div-walkin-stub-wrap');
                const bookingConfirmWrap = document.getElementById('div-booking-confirm-wrap');
                if (walkinStubWrap) walkinStubWrap.classList.add('hidden');
                if (bookingConfirmWrap) bookingConfirmWrap.classList.remove('hidden');
                if (submitBtn) submitBtn.className = 'w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-black uppercase text-sm tracking-wider rounded-xl shadow-md shadow-red-600/20 transition flex items-center justify-center gap-2 cursor-pointer';
                if (submitText) submitText.innerText = 'Register to System';
                selectQuickApptSlot('09:30');
            } else if (role === 'sa') {
                if (title) title.innerText = 'Vehicle Intake Form';
                if (subtitle) subtitle.innerText = 'LOG PHYSICAL VEHICLE RECEPTION TO WORKSHOP QUEUE.';
                if (iconWrap) iconWrap.className = 'w-11 h-11 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center shrink-0';
                if (source) source.value = 'Walk-in';
                if (walkinFields) walkinFields.classList.remove('hidden');
                if (bookingFields) bookingFields.classList.add('hidden');
                if (walkinLaneWrap) walkinLaneWrap.classList.remove('hidden');
                if (bookingLaneWrap) bookingLaneWrap.classList.add('hidden');
                const walkinStubWrap = document.getElementById('div-walkin-stub-wrap');
                const bookingConfirmWrap = document.getElementById('div-booking-confirm-wrap');
                if (walkinStubWrap) walkinStubWrap.classList.remove('hidden');
                if (bookingConfirmWrap) bookingConfirmWrap.classList.add('hidden');
                if (submitBtn) submitBtn.className = 'w-full py-3.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white font-black uppercase text-sm tracking-wider rounded-xl shadow-md shadow-red-600/20 transition flex items-center justify-center gap-2 cursor-pointer';
                if (submitText) submitText.innerText = 'Register to System';
                updateStubPreview();
            }

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }
        window.setupIntakeForm = setupIntakeForm;

        async function processIntake() {
            const source = document.getElementById('intake-source')?.value || 'Walk-in';
            const date = document.getElementById('intake-date')?.value || new Date().toISOString().split('T')[0];
            const plate = (document.getElementById('intake-plate')?.value || '').toUpperCase().trim();
            const name = (document.getElementById('intake-name')?.value || '').trim();
            const contact = (document.getElementById('intake-contact')?.value || '').trim();
            const vehicle = (document.getElementById('intake-vehicle')?.value || '').trim();
            
            let concern = '';
            const concernEl = document.getElementById('intake-concern');
            if (concernEl && source === 'Walk-in') {
                concern = concernEl.value;
            }

            let category = document.getElementById('intake-category')?.value || 'PMS';
            if (category === 'Others') {
                const categoryOther = (document.getElementById('intake-category-other')?.value || '').trim();
                if (!categoryOther) {
                    return showSystemToast("Please specify the custom service category.", "error");
                }
                category = categoryOther;
            }

            if (!plate) return showSystemToast("Plate Number is required.", "error");
            if (!name) return showSystemToast("Customer Name is required.", "error");
            if (!vehicle) return showSystemToast("Vehicle Model is required.", "error");

            let pendingDuplicateIntakePayload = null;

            async function executeIntakeSubmission(payload) {
                const submitBtn = document.getElementById('intake-submit-btn');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.classList.add('opacity-50', 'pointer-events-none');
                }

                try {
                    await apiRequest('/api/jobs', {
                        method: 'POST',
                        body: payload
                    });

                    await loadData();
                    renderStaffTables();
                    showSection('queue');
                    showSystemToast(`Vehicle ${payload.plate} registered successfully. Added to Daily Intakes.`, 'success', 'Intake Completed');

                    ['plate', 'name', 'contact', 'vehicle', 'concern'].forEach(id => {
                        const el = document.getElementById(`intake-${id}`);
                        if (el) el.value = '';
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

                    if (payload.source === 'Walk-in') updateStubPreview();
                } catch (err) {
                    showSystemToast(err.message || 'Failed to submit intake.', 'error');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.classList.remove('opacity-50', 'pointer-events-none');
                    }
                }
            }

            function showDuplicateIntakeWarningModal(existingJob, payload) {
                window.pendingDuplicateIntakePayload = payload;
                const modal = document.getElementById('modal-duplicate-intake-warning');
                if (!modal) return;

                if (document.getElementById('modal-dup-plate-badge')) {
                    document.getElementById('modal-dup-plate-badge').innerText = payload.plate || 'NO-PLATE';
                }
                if (document.getElementById('modal-dup-status')) {
                    document.getElementById('modal-dup-status').innerText = existingJob.status || 'Active';
                }
                if (document.getElementById('modal-dup-time')) {
                    const src = existingJob.source || 'Inquiry';
                    const time = existingJob.appt_time || existingJob.arrival || 'Today';
                    document.getElementById('modal-dup-time').innerText = `${src} • ${time}`;
                }
                if (document.getElementById('modal-dup-sa')) {
                    document.getElementById('modal-dup-sa').innerText = existingJob.saName || existingJob.handled_by || 'Front Desk SA';
                }

                modal.classList.remove('hidden');
                if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
            }

            function cancelDuplicateIntake() {
                window.pendingDuplicateIntakePayload = null;
                const modal = document.getElementById('modal-duplicate-intake-warning');
                if (modal) modal.classList.add('hidden');
                showSystemToast('Duplicate submission cancelled.', 'info', 'Intake Guard');
            }
            window.cancelDuplicateIntake = cancelDuplicateIntake;

            async function proceedDuplicateIntake() {
                const payload = window.pendingDuplicateIntakePayload;
                window.pendingDuplicateIntakePayload = null;
                const modal = document.getElementById('modal-duplicate-intake-warning');
                if (modal) modal.classList.add('hidden');

                if (!payload) return;
                await executeIntakeSubmission(payload);
            }
            window.proceedDuplicateIntake = proceedDuplicateIntake;

            const isWalkin = source === 'Walk-in';
            let arrival = '';
            let apptDate = '', apptTime = '', confirmed = false, laneType = '';
            let claimStub = '';

            if (isWalkin) {
                const arrivalInput = document.getElementById('intake-arrival-time');
                if (arrivalInput && arrivalInput.value) {
                    arrival = arrivalInput.value;
                } else {
                    const hour = document.getElementById('intake-arrival-hour')?.value || '08';
                    const min = document.getElementById('intake-arrival-minute')?.value || '00';
                    arrival = `${hour}:${min}`;
                }
                laneType = document.getElementById('intake-walkin-lane-type')?.value || 'Flexible Lane';
                claimStub = document.getElementById('intake-stub-preview')?.value || generateStubNumber();
            } else {
                apptDate = date;
                const apptInput = document.getElementById('intake-appt-time');
                if (apptInput && apptInput.value) {
                    apptTime = apptInput.value;
                } else {
                    const hour = document.getElementById('intake-appt-hour')?.value || '09';
                    const min = document.getElementById('intake-appt-minute')?.value || '00';
                    apptTime = `${hour}:${min}`;
                }
                confirmed = document.getElementById('intake-confirmed') ? document.getElementById('intake-confirmed').checked : false;
                laneType = document.getElementById('intake-lane-type')?.value || 'Flexible Lane';
            }

            const intakePayload = {
                source, dateReceived: date, plate, name, contact, category, vehicle, concern,
                arrival, apptDate, apptTime, confirmed, laneType, claimStub
            };

            // ACTIVE DUPLICATE RECORD GUARD (Custom Glassmorphic Modal)
            const normalizedPlate = plate.replace(/[\s-]/g, '').toUpperCase();
            if (normalizedPlate !== 'NOPLATE' && normalizedPlate.length >= 3) {
                const existingActiveJob = allJobs.find(j => {
                    const jPlate = (j.plate || '').replace(/[\s-]/g, '').toUpperCase();
                    const isSamePlate = jPlate === normalizedPlate;
                    const isActive = j.status !== 'Released' && j.status !== 'Completed' && j.status !== 'Cancelled';
                    return isSamePlate && isActive;
                });

                if (existingActiveJob) {
                    showDuplicateIntakeWarningModal(existingActiveJob, intakePayload);
                    return;
                }
            }

            await executeIntakeSubmission(intakePayload);
        }

        async function updateJobField(jobId, field, value, editReason = null) {
            try {
                const job = allJobs.find(j => (j.id === jobId || j.job_id === jobId));
                if (job && field === 'laneType') {
                    const allowed = getAvailableLanesForJob(job.category).map(l => l.value);
                    if (!allowed.includes(value)) {
                        showSystemToast(`Lane "${value}" is not permitted for category "${job.category}". Allowed: ${allowed.join(', ')}`, 'error', 'Invalid Lane');
                        renderStaffTables();
                        return;
                    }
                }

                if (job && field === 'location' && value && value !== 'None') {
                    const isMonitoringOrActive = job.status === 'Monitoring' || job.status === 'In Progress';
                    if (!isMonitoringOrActive) {
                        showSystemToast(`Vehicle must be set to 'Monitoring' before allocating a workshop bay.`, 'warning', 'Status Locked');
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
                    if (job) announceVehicleMonitoring(job, value);
                }

                const payload = { field, value };
                if (editReason) {
                    payload.editReason = editReason;
                }

                await apiRequest(`/api/jobs/${jobId}/field`, {
                    method: 'PATCH',
                    body: payload
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
                                body: { field: 'laneType', value: clampedLane, editReason: editReason || 'Category auto-clamp' }
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
                                body: { field: 'goalStatus', value: computed, editReason: 'Goal status auto-calculation' }
                            });
                            job.goalStatus = computed;
                        }
                    }
                }

                if (editReason) {
                    showSystemToast(`Field "${field}" updated and logged to audit trail.`, 'success', 'Audit Saved');
                }

                renderStaffTables();
            } catch (err) {
                console.error(`Error updating job field ${field}:`, err);
                showSystemToast(err.message || 'Error updating job record.', 'error', 'Update Error');
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

        function openTicketTakeoverModal(jobId) {
            const job = allJobs.find(j => j.id === jobId);
            if (!job) return;

            const modal = document.getElementById('modal-ticket-takeover');
            if (!modal) return;

            const idEl = document.getElementById('takeover-job-id');
            if (idEl) idEl.value = jobId;
            if (document.getElementById('takeover-plate-badge')) {
                document.getElementById('takeover-plate-badge').innerText = job.plate || 'NO-PLATE';
            }
            if (document.getElementById('takeover-vehicle-model')) {
                document.getElementById('takeover-vehicle-model').innerText = job.vehicle || 'Vehicle';
            }
            if (document.getElementById('takeover-current-sa')) {
                document.getElementById('takeover-current-sa').innerText = job.saName || job.handled_by || 'Assigned SA';
            }
            if (document.getElementById('takeover-incoming-sa')) {
                const rawName = currentUserName || 'Service Advisor';
                const cleanName = rawName.replace(/\s*\(You\)$/i, '');
                document.getElementById('takeover-incoming-sa').innerText = `${cleanName} (You)`;
            }

            modal.classList.remove('hidden');
            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        }
        window.openTicketTakeoverModal = openTicketTakeoverModal;

        function closeTicketTakeoverModal() {
            const modal = document.getElementById('modal-ticket-takeover');
            if (modal) modal.classList.add('hidden');
        }
        window.closeTicketTakeoverModal = closeTicketTakeoverModal;

        async function confirmTicketTakeover() {
            const idEl = document.getElementById('takeover-job-id');
            const jobId = idEl ? idEl.value : '';
            if (!jobId) return;

            const selectedReasonEl = document.querySelector('input[name="takeover-reason"]:checked');
            const reason = selectedReasonEl ? selectedReasonEl.value : 'Shift Handover';

            closeTicketTakeoverModal();

            let saNameValue = currentUserName;
            if (!saNameValue.includes('(Advisor)')) {
                saNameValue = `${currentUserName} (Advisor)`;
            }

            const targetJob = allJobs.find(j => j.id === jobId);
            const prevSAName = targetJob ? (targetJob.saName || targetJob.handled_by || 'Previous SA') : 'Previous SA';

            await updateJobField(jobId, 'saName', saNameValue, `Ticket Takeover Handover: ${reason}`);
            
            if (targetJob) {
                targetJob.saName = saNameValue;
                targetJob.handled_by = saNameValue;
                showSystemToast(`Transferred vehicle (${targetJob.plate}) from ${prevSAName} to ${saNameValue} [${reason}].`, 'success', 'Ticket Handover');
            }

            if (typeof renderStaffTables === 'function') renderStaffTables();
            if (typeof renderWorkshopBaysModule === 'function') renderWorkshopBaysModule();
        }
        window.confirmTicketTakeover = confirmTicketTakeover;

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
                } else if (newStatus === 'Ready' || newStatus === 'Ready to Release') {
                    if (job) announceVehicleReady(job);
                    else playAutomotiveChime();
                }

                if (newStatus === 'Waiting') {
                    // Reset location back to Waiting Area when vehicle returns to Waiting
                    await apiRequest(`/api/jobs/${jobId}/field`, {
                        method: 'PATCH',
                        body: { field: 'location', value: 'None' }
                    });
                    if (job) job.location = 'None';
                }

                await apiRequest(`/api/jobs/${jobId}/status`, {
                    method: 'PATCH',
                    body: { status: newStatus }
                });

                if (newStatus === 'Monitoring') {
                    showSystemToast(`Vehicle moved to Monitoring. You can now assign a workshop bay.`, 'info', 'Status: Monitoring');
                    if (job) announceVehicleMonitoring(job, job.location || 'Monitoring Area');
                }

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
            const msgEl = document.getElementById('delete-confirm-message');
            if (msgEl) {
                msgEl.innerHTML = `Are you sure you want to delete the booking for <strong class="text-slate-900 font-bold">${job.name}</strong> (<span class="font-mono font-bold text-slate-800">${job.plate}</span>)?`;
            }
            document.getElementById('delete-confirm-modal').classList.remove('hidden');
            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
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
            const job = (allJobs || []).find(j => (j.id === jobId || j.job_id === jobId));
            if (!rawVal) {
                requestFieldEditWithReason(jobId, 'departure', '', job?.departure || '');
                return;
            }

            const parsedMins = parseTimeToMinutes(rawVal);
            if (parsedMins === null) {
                showSystemToast(`Invalid time "${rawVal}". Please enter a valid 24H time (e.g. 12:00 or 1233).`, 'warning', 'Time Guide');
                inputEl.value = convertTimeTo24Hour(job?.departure) || '';
                return;
            }

            const formatted = convertTimeTo24Hour(rawVal);
            inputEl.value = formatted;
            requestFieldEditWithReason(jobId, 'departure', formatted, job?.departure || '');
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

        window.switchQueueTab = function(tab) {
            // Deprecated queue tab switch stub
        };

        function renderStaffTables() {
            const isOwner = currentUserRole === 'owner';
            const isAdmin = currentUserRole === 'admin';
            const isAsst = currentUserRole === 'assistant';
            const isSA = currentUserRole === 'sa';
            const isTech = currentUserRole === 'tech';
            const isOwnerOrAdmin = isOwner || isAdmin;
            const isReadOnlyOnline = isOwner || isAdmin || isSA;
            const canViewOnline = isAsst || isOwner || isAdmin || isSA;

            const safeJobs = Array.isArray(allJobs) ? allJobs : [];
            const pendingOnline = safeJobs.filter(j => j.source === 'Online' && j.status === 'Pending');

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
                document.getElementById('table-pending-express').innerHTML = pendingOnline.map(job => {
                    const isExpress = (job.laneType === 'Express Lane' || job.laneType === 'Express');
                    const curLane = job.laneType || 'Flexible Lane';
                    return `
                    <tr class="hover:bg-gray-50/60 transition border-b border-gray-100 text-xs">
                        <td class="py-3 px-3.5 align-middle">
                            <div class="font-bold text-gray-900">${job.name}</div>
                            <div class="text-[10px] text-gray-500 font-mono mt-0.5">${formatPhoneNumber(job.contact)}</div>
                        </td>
                        <td class="py-3 px-3.5 align-middle">
                            <div class="inline-block font-bold font-mono text-gray-900 bg-gray-100 border border-gray-300 px-2 py-0.5 rounded-md text-xs tracking-wide shadow-2xs">${job.plate}</div>
                        </td>
                        <td class="py-3 px-3.5 align-middle">
                            <span class="text-gray-700 text-[11px] font-semibold block truncate max-w-[130px]" title="${job.vehicle}">${job.vehicle}</span>
                        </td>
                        <td class="py-3 px-3.5 align-middle">
                            ${isReadOnlyOnline ? `
                                <span class="lane-badge-static">
                                    ${curLane.replace(' Lane', '')}
                                </span>
                            ` : `
                                <div class="lane-selector-pill">
                                    <select onchange="updateJobField('${job.id}', 'laneType', this.value)" title="Lane Type">
                                        <option value="Express Lane" ${curLane.includes('Express') ? 'selected' : ''}>Express</option>
                                        <option value="Flexible Lane" ${curLane.includes('Flexible') ? 'selected' : ''}>Flexible</option>
                                        <option value="Special Lane" ${curLane.includes('Special') ? 'selected' : ''}>Special</option>
                                        <option value="Priority Lane" ${curLane.includes('Priority') ? 'selected' : ''}>Priority</option>
                                    </select>
                                    <svg class="lane-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </div>
                            `}
                        </td>
                        <td class="py-3 px-3.5 align-middle">
                            ${isReadOnlyOnline ? `
                                <div class="appt-badge-static">
                                    <div class="flex items-center gap-1.5 font-bold text-gray-900 text-[10.5px]">
                                        <svg class="w-3 h-3 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <span class="truncate">${job.apptDate || 'N/A'}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 font-mono font-bold text-gray-700 text-[10px] mt-0.5 pt-0.5 border-t border-slate-200">
                                        <svg class="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        <span>${job.apptTime ? convertTimeTo24Hour(job.apptTime) : 'N/A'}</span>
                                    </div>
                                </div>
                            ` : `
                                <div class="appt-selector-card">
                                    <div class="appt-field-row">
                                        <svg class="w-3 h-3 text-gray-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        <input type="date" value="${job.apptDate || ''}" 
                                            onchange="updateJobField('${job.id}', 'apptDate', this.value)" 
                                            class="appt-date-input" 
                                            title="Select Appointment Date">
                                    </div>
                                    <div class="appt-field-row border-t border-slate-200">
                                        <svg class="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <polyline points="12 6 12 12 16 14"></polyline>
                                        </svg>
                                        <input type="text" value="${convertTimeTo24Hour(job.apptTime) || ''}" 
                                            placeholder="08:00" maxlength="8"
                                            onchange="this.value = convertTimeTo24Hour(this.value) || this.value; updateJobField('${job.id}', 'apptTime', this.value)"
                                            onblur="this.value = convertTimeTo24Hour(this.value) || this.value; updateJobField('${job.id}', 'apptTime', this.value)"
                                            class="appt-time-input font-mono font-bold" 
                                            title="Appointment Time (HH:MM)">
                                    </div>
                                </div>
                            `}
                        </td>
                        <td class="py-3 px-3.5 align-middle">
                            ${isReadOnlyOnline ? `
                                <div class="eval-badge-static">
                                    <svg class="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <span class="text-[10.5px] font-medium text-gray-700 truncate" title="${job.evaluation || ''}">${job.evaluation || 'No evaluation note'}</span>
                                </div>
                            ` : `
                                <div class="eval-field-card">
                                    <svg class="w-3 h-3 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <input type="text" value="${job.evaluation || ''}" title="${job.evaluation || ''}" placeholder="Diagnosis / Notes..." onchange="updateJobField('${job.id}', 'evaluation', this.value)">
                                </div>
                            `}
                        </td>
                        <td class="py-3 px-3.5 text-center align-middle">
                            <input type="checkbox" ${job.confirmed ? 'checked' : ''} ${isReadOnlyOnline ? 'disabled' : `onchange="updateCheckbox('${job.id}', 'confirmed', this.checked)"`} class="w-3.5 h-3.5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 ${isReadOnlyOnline ? 'cursor-not-allowed' : 'cursor-pointer'}" title="${job.confirmed ? 'Confirmed Booking' : 'Pending Confirmation'}">
                        </td>
                        <td class="py-3 px-3.5 text-right align-middle">
                            <div class="flex items-center justify-end gap-1.5">
                                ${isReadOnlyOnline ? `
                                    <span class="text-[11px] font-bold text-gray-400 italic">View Only</span>
                                ` : `
                                    <button onclick="confirmActiveOnlineJob('${job.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase transition shadow-sm hover:shadow-md flex items-center gap-1 cursor-pointer">
                                        <i data-lucide="check" class="w-3 h-3"></i> Confirm
                                    </button>
                                    <button onclick="removeJob('${job.id}')" class="border border-red-200 hover:border-red-500 text-red-500 hover:bg-red-50 p-1 rounded-lg transition flex items-center justify-center cursor-pointer" title="Delete Booking">
                                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                    </button>
                                `}
                            </div>
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

                // Filter by Advisor / Responsibility
                if (intakeAdvisorFilter === 'mine') {
                    const cleanCurrentSA = (currentUserName || '').replace(/\s*\(Advisor\)\s*/i, '').trim().toLowerCase();
                    activeJobs = activeJobs.filter(j => {
                        const rawJobSA = j.saName || j.handled_by || j.sa || '';
                        const cleanJobSA = rawJobSA.replace(/\s*\(Advisor\)\s*/i, '').trim().toLowerCase();
                        if (!cleanJobSA || cleanJobSA === '-' || cleanJobSA === 'front desk sa' || cleanJobSA === 'unassigned') return false;
                        return cleanJobSA === cleanCurrentSA || rawJobSA.toLowerCase().includes(cleanCurrentSA);
                    });
                } else if (intakeAdvisorFilter === 'unassigned') {
                    activeJobs = activeJobs.filter(j => {
                        const rawJobSA = j.saName || j.handled_by || j.sa || '';
                        const cleanJobSA = rawJobSA.replace(/\s*\(Advisor\)\s*/i, '').trim().toLowerCase();
                        return !cleanJobSA || cleanJobSA === '-' || cleanJobSA === 'front desk sa' || cleanJobSA === 'unassigned';
                    });
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
                        <thead class="sticky top-0 z-10 bg-slate-50">
                            <tr class="bg-slate-50 border-b border-gray-200 text-gray-500 text-[9.5px] font-black uppercase tracking-widest">
                                <th class="px-2.5 py-2.5 bg-slate-50 text-center w-10 text-gray-400 font-bold">#</th>
                                <th onclick="toggleClaimStubSort()" class="px-3 py-2.5 bg-slate-50 cursor-pointer select-none hover:bg-slate-100 transition whitespace-nowrap" title="Click to toggle sorting">
                                    <span class="inline-flex items-center gap-1">
                                        Claim Stub
                                        <i data-lucide="${intakeSortBy === 'claimStub' ? (intakeSortOrder === 'desc' ? 'arrow-down' : 'arrow-up') : 'arrow-up-down'}" class="w-3 h-3 text-red-600"></i>
                                    </span>
                                </th>
                                <th class="px-3 py-2.5 bg-slate-50 whitespace-nowrap">Plate No.</th>
                                <th class="px-3 py-2.5 bg-slate-50 min-w-[260px]">Model & Category</th>
                                <th class="px-2.5 py-2.5 bg-slate-50 text-center whitespace-nowrap">Source</th>
                                <th class="px-2.5 py-2.5 bg-slate-50 text-center whitespace-nowrap">Arrival (24H)</th>
                                <th class="px-2.5 py-2.5 bg-slate-50 text-center whitespace-nowrap">Departure (24H)</th>
                                <th class="px-3 py-2.5 bg-slate-50 min-w-[300px]">Evaluation / Diagnosis</th>
                                <th class="px-2.5 py-2.5 bg-slate-50 text-center whitespace-nowrap min-w-[110px]">Promised Date</th>
                                <th class="px-2.5 py-2.5 bg-slate-50 text-center whitespace-nowrap min-w-[100px]">C.O. Status</th>
                                ${showGoal ? '<th class="px-2.5 py-2.5 bg-slate-50 text-center whitespace-nowrap min-w-[120px]">SLA Status (2h)</th>' : ''}
                                <th class="px-3 py-2.5 bg-slate-50 text-center whitespace-nowrap min-w-[165px]">Status</th>
                                <th class="px-3 py-2.5 bg-slate-50 text-center whitespace-nowrap min-w-[165px]">Location</th>
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
                        const rawJobSA = job.saName || job.handled_by || job.sa || '';
                        const cleanJobSA = rawJobSA.replace(/\s*\(Advisor\)\s*/i, '').trim();
                        const cleanCurrentSA = (currentUserName || '').replace(/\s*\(Advisor\)\s*/i, '').trim();

                        const isAssignedToMe = isSA && cleanJobSA !== '' && cleanJobSA !== '-' && cleanJobSA !== 'Front Desk SA' && cleanJobSA !== 'Unassigned' && (
                            cleanJobSA.toLowerCase() === cleanCurrentSA.toLowerCase() ||
                            rawJobSA.includes(currentUserName)
                        );
                        const isUnassigned = !rawJobSA || rawJobSA === '-' || rawJobSA === 'Front Desk SA' || rawJobSA === 'Unassigned';
                        const isAssignedToOtherSA = isSA && !isUnassigned && !isAssignedToMe;

                        // STRICT SINGLE-OWNER RULE: Only the assigned SA can edit this vehicle's operational fields
                        const isEditable = isAssignedToMe;

                        return `
                        <tr class="hover:bg-slate-50/70 transition-colors border-b border-gray-100/80 ${job.status === 'Ready' || job.status === 'Ready to Release' ? 'bg-emerald-50/30' : job.status === 'Released' ? 'bg-gray-50/80' : ''}">
                            <!-- Row Number -->
                            <td class="px-2.5 py-2.5 align-middle text-center font-mono text-xs text-gray-400 font-bold">${idx + 1}</td>

                            <!-- Claim Stub & Audit History -->
                            <td class="px-3 py-2.5 align-middle">
                                <div class="flex items-center gap-1">
                                    <button onclick="printJobClaimStubPDF('${job.id}')" class="inline-flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide bg-slate-100/90 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs transition cursor-pointer active:scale-95" title="Click to print official Customer Claim Stub PDF">
                                        <i data-lucide="printer" class="w-3.5 h-3.5 text-red-600"></i> ${job.claimStub || 'N/A'}
                                    </button>
                                    <button type="button" onclick="openJobAuditHistoryModal('${job.id}')" class="p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0" title="View Audit History Trail">
                                        <i data-lucide="history" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>
                            </td>
                            
                            <!-- Plate -->
                            <td class="px-3 py-2.5 align-middle">
                                <div class="flex flex-col gap-1">
                                    <span class="inline-flex items-center justify-center w-fit font-mono font-bold text-xs uppercase tracking-wide bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">${job.plate}</span>
                                    ${(job.promisedDate || job.carryOverStatus) ? `
                                    <span class="inline-flex items-center justify-center w-fit bg-orange-100 text-orange-800 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-orange-200">
                                        Carry-Over
                                    </span>
                                    ` : ''}
                                </div>
                            </td>
                            
                            <!-- Model & Category & Express SLA Alert -->
                            <td class="px-3 py-2.5 align-top min-w-[240px]">
                                <div class="font-bold text-gray-900 text-xs sm:text-[13px] flex items-center gap-1.5 mb-1.5">
                                    <i data-lucide="car" class="w-3.5 h-3.5 text-slate-500 shrink-0"></i>
                                    <span class="truncate max-w-[220px] font-bold text-slate-900" title="${job.vehicle}">${job.vehicle}</span>
                                </div>
                                
                                <div class="flex flex-col gap-1.5 items-start">
                                    <!-- Row 1: Service Advisor Action / Status Badge -->
                                    <div class="inline-flex items-center shrink-0">
                                        ${isAssignedToMe ? `
                                            <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10.5px] font-bold uppercase px-2 py-0.5 rounded-md shadow-2xs" title="Assigned to you">
                                                <i data-lucide="user-check" class="w-3 h-3 text-emerald-600"></i>
                                                <span>My Job</span>
                                            </span>
                                        ` : isAssignedToOtherSA ? `
                                            <div class="inline-flex items-center gap-1 flex-wrap">
                                                <span class="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-[10.5px] font-semibold uppercase px-2 py-0.5 rounded-md shadow-2xs" title="Assigned to ${cleanJobSA}">
                                                    <i data-lucide="user" class="w-3 h-3 text-slate-400"></i>
                                                    <span>${cleanJobSA}</span>
                                                </span>
                                                <button type="button" onclick="openTicketTakeoverModal('${job.id}')" class="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-white hover:bg-slate-900 text-slate-600 hover:text-white border border-slate-300 hover:border-slate-900 px-1.5 py-0.5 rounded-md transition cursor-pointer shadow-2xs" title="Take over this vehicle ticket">
                                                    <i data-lucide="refresh-cw" class="w-3 h-3"></i>
                                                    <span>Take Over</span>
                                                </button>
                                            </div>
                                        ` : (isSA && isUnassigned) ? `
                                            <button type="button" onclick="assignMeToJob('${job.id}')" class="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase bg-slate-900 hover:bg-black text-white px-2 py-0.5 rounded-md transition-all shadow-2xs cursor-pointer active:scale-95">
                                                <i data-lucide="user-plus" class="w-3 h-3 text-slate-300"></i>
                                                <span>Take Job</span>
                                            </button>
                                        ` : `
                                            <span class="inline-flex items-center gap-1 bg-gray-50 text-gray-600 border border-gray-200 text-[10.5px] font-medium uppercase px-2 py-0.5 rounded-md shadow-2xs">
                                                <i data-lucide="user" class="w-3 h-3 text-slate-400"></i>
                                                <span>${cleanJobSA || 'Unassigned'}</span>
                                            </span>
                                        `}
                                    </div>

                                    <!-- Row 2: Service Category Selection -->
                                    <div class="inline-flex items-center gap-1.5 flex-wrap">
                                        <!-- Category Pill -->
                                        ${isEditable ? `
                                        <div class="relative inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 hover:border-red-500 rounded-md px-1.5 py-0.5 shadow-2xs transition cursor-pointer shrink-0" title="${job.category ? `Category: ${job.category}` : 'Category: OTHERS'} (Click to change)">
                                            <i data-lucide="wrench" class="w-3 h-3 text-red-600 shrink-0 pointer-events-none"></i>
                                            <span class="text-[10px] font-bold uppercase text-slate-800 pointer-events-none">${['PMS', 'GRS', 'PMS & GRS', 'PMS AND GRS'].includes(job.category) ? job.category : 'OTHERS'}</span>
                                            <i data-lucide="chevron-down" class="w-2.5 h-2.5 text-slate-400 shrink-0 pointer-events-none"></i>
                                            <select onchange="handleTableCategoryChange('${job.id}', this)" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="${job.category ? `Category: ${job.category}` : 'Category: OTHERS'} (Click to change)">
                                                <option value="PMS" ${job.category === 'PMS' ? 'selected' : ''}>PMS</option>
                                                <option value="GRS" ${job.category === 'GRS' ? 'selected' : ''}>GRS</option>
                                                <option value="PMS & GRS" ${job.category === 'PMS & GRS' || job.category === 'PMS AND GRS' ? 'selected' : ''}>PMS & GRS</option>
                                                <option value="OTHERS" ${!['PMS', 'GRS', 'PMS & GRS', 'PMS AND GRS'].includes(job.category) ? 'selected' : ''}>OTHERS</option>
                                            </select>
                                        </div>
                                        
                                        ${!['PMS', 'GRS', 'PMS & GRS', 'PMS AND GRS'].includes(job.category) ? `
                                        <div class="inline-flex items-center bg-white border border-slate-300 focus-within:border-red-600 rounded-md px-2 py-0.5 shadow-2xs transition shrink-0" title="${job.category && job.category !== 'Others' && job.category !== 'OTHERS' ? job.category : 'Custom Service Specification'}">
                                            <input type="text" 
                                                   value="${(job.category !== 'Others' && job.category !== 'OTHERS') ? job.category : ''}" 
                                                   placeholder="Specify service..." 
                                                   maxlength="40"
                                                   onkeydown="if(event.key === 'Enter') this.blur();"
                                                   oninput="this.title = this.value.trim() || 'Custom Service Specification';"
                                                   onblur="requestFieldEditWithReason('${job.id}', 'category', this.value.trim() || 'OTHERS', '${job.category || 'OTHERS'}')" 
                                                   class="text-[10.5px] font-semibold text-gray-800 bg-transparent border-none outline-none p-0 cursor-text truncate"
                                                   style="width: 140px !important; min-width: 120px !important; max-width: 170px !important; padding: 0 !important;"
                                                   title="${job.category && job.category !== 'Others' && job.category !== 'OTHERS' ? job.category : 'Custom Service Specification'}">
                                        </div>
                                        ` : ''}
                                        ` : `
                                        <span class="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase text-slate-700 shadow-2xs shrink-0" title="Category: ${job.category || '-'}">
                                            <i data-lucide="wrench" class="w-3 h-3 text-slate-500"></i>
                                            <span>${job.category || '-'}</span>
                                        </span>
                                        `}
                                    </div>

                                    <!-- Row 3: Lane / Priority Selection -->
                                    <div class="inline-flex items-center shrink-0">
                                        ${isEditable ? `
                                        <div class="relative inline-flex items-center gap-1 bg-white hover:bg-slate-50 border border-slate-300 hover:border-red-500 rounded-md px-1.5 py-0.5 shadow-2xs transition cursor-pointer shrink-0" title="Click to change Lane">
                                            <i data-lucide="route" class="w-3 h-3 text-red-600 shrink-0 pointer-events-none"></i>
                                            <span class="text-[10px] font-bold uppercase text-slate-800 pointer-events-none">${job.laneType ? job.laneType.replace(/\s*Lane/i, '') : 'FLEXIBLE'}</span>
                                            <i data-lucide="chevron-down" class="w-2.5 h-2.5 text-slate-400 shrink-0 pointer-events-none"></i>
                                            <select onchange="requestFieldEditWithReason('${job.id}', 'laneType', this.value, '${job.laneType || ''}')" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" title="Change Lane">
                                                ${getAvailableLanesForJob(job.category).map(opt => `
                                                    <option value="${opt.value}" ${job.laneType === opt.value ? 'selected' : ''}>${opt.label}</option>
                                                `).join('')}
                                            </select>
                                        </div>
                                        ` : `
                                        <div class="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-700 bg-slate-50 border border-slate-200 rounded-md px-1.5 py-0.5 shadow-2xs shrink-0">
                                            <i data-lucide="route" class="w-3 h-3 text-red-500 shrink-0"></i>
                                            <span>${job.laneType ? job.laneType.replace(/\s*Lane/i, '') : 'FLEXIBLE'}</span>
                                        </div>
                                        `}
                                    </div>
                                </div>
                            </td>
                            
                            <!-- Source -->
                            <td class="px-2.5 py-2.5 align-middle text-center">
                                <span class="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider ${job.source === 'Online' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-700 border border-slate-200'} shadow-2xs">${job.source || 'Walk-in'}</span>
                            </td>

                            <!-- Arrival (24-Hour Base) -->
                            <td class="px-2.5 py-2.5 align-middle text-center">
                                <span class="block py-0.5 text-xs font-bold font-mono text-gray-700">${convertTimeTo24Hour(job.arrival) || job.arrival || '--:--'}</span>
                            </td>
                            
                            <!-- Departure (Hybrid Combo-Box: Direct Type Numbers + Preset Quick Selection) -->
                            <td class="px-2.5 py-2.5 align-middle text-center">
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
                                        <select onchange="document.getElementById('dep-input-${job.id}').value = this.value; requestFieldEditWithReason('${job.id}', 'departure', this.value, '${job.departure || ''}');" 
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
                            <td class="px-3 py-2.5 align-middle min-w-[240px]">
                                ${isEditable ? `
                                <div class="eval-field-card">
                                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <input type="text" id="evaluation-${job.id}" value="${job.evaluation || ''}" title="${job.evaluation || ''}" placeholder="Diagnosis / Notes..." onchange="requestFieldEditWithReason('${job.id}', 'evaluation', this.value, '${(job.evaluation || '').replace(/'/g, "\\'")}')">
                                </div>
                                ` : `
                                <div class="eval-badge-static">
                                    <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <polyline points="10 9 9 9 8 9"></polyline>
                                    </svg>
                                    <span class="text-[10.5px] font-medium text-gray-700 truncate" title="${job.evaluation || ''}" id="evaluation-${job.id}">${job.evaluation || 'No evaluation note'}</span>
                                </div>
                                `}
                            </td>

                            <!-- Promised Date -->
                            <td class="px-2.5 py-2.5 align-middle text-center whitespace-nowrap min-w-[110px]">
                                <span class="inline-block py-0.5 text-xs font-bold text-gray-700">${job.promisedDate || '-'}</span>
                            </td>

                            <!-- C.O. Status -->
                            <td class="px-2.5 py-2.5 align-middle text-center whitespace-nowrap min-w-[100px]">
                                ${job.carryOverStatus ? `
                                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-orange-50 text-orange-700 border border-orange-100">
                                    ${job.carryOverStatus}
                                </span>
                                ` : '<span class="text-gray-400">-</span>'}
                            </td>

                            <!-- SLA status -->
                            ${showGoal ? `
                            <td class="px-2.5 py-2.5 align-middle text-center whitespace-nowrap min-w-[120px]">
                                <span class="px-1.5 py-0.5 rounded text-xs font-bold uppercase ${job.goalStatus === 'Successful' ? 'bg-green-50 text-green-700 border border-green-100' : job.goalStatus === 'Failed' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-100 text-gray-700'}">
                                    ${job.goalStatus || 'N/A'}
                                </span>
                            </td>
                            ` : ''}
                            
                            <!-- Status -->
                            <td class="px-3 py-2.5 align-middle text-center whitespace-nowrap min-w-[165px]">
                                ${isEditable ? `
                                <div class="relative inline-flex items-center justify-between gap-1.5 border rounded-xl px-3 py-1.5 shadow-2xs transition cursor-pointer min-w-[155px] max-w-[170px]" 
                                     style="${
                                         job.status === 'Ready to Release' || job.status === 'Ready' 
                                             ? 'background-color:#ecfdf5; color:#047857; border-color:#a7f3d0;' 
                                             : job.status === 'Carry Over' 
                                                 ? 'background-color:#fff7ed; color:#c2410c; border-color:#fed7aa;' 
                                                 : job.status === 'Monitoring' 
                                                     ? 'background-color:#eff6ff; color:#1e40af; border-color:#bfdbfe;' 
                                                     : 'background-color:#f9fafb; color:#4b5563; border-color:#e5e7eb;'
                                     }" title="Change Status">
                                    <span class="font-bold text-[11px] uppercase tracking-tight flex-1 text-center pointer-events-none whitespace-nowrap">${job.status === 'Ready' ? 'Ready to Release' : job.status}</span>
                                    <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-80 shrink-0 pointer-events-none stroke-[2.5]"></i>
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
                                <span class="inline-flex items-center justify-center font-bold text-[11px] uppercase tracking-tight px-3 py-1.5 rounded-xl shadow-2xs min-w-[155px] max-w-[170px] whitespace-nowrap" 
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
                            <td class="px-3 py-2.5 align-middle text-center whitespace-nowrap min-w-[165px]">
                                ${(() => {
                                    const isMonitoringOrActive = job.status === 'Monitoring' || job.status === 'In Progress';
                                    if (isEditable && isMonitoringOrActive) {
                                        return `
                                        <div class="relative group inline-flex items-center justify-between gap-1.5 border rounded-xl px-3 py-1.5 shadow-2xs transition min-w-[155px] max-w-[170px] ${
                                            (job.location && (job.location.startsWith('Bay') || job.location.startsWith('Lift')))
                                                ? 'bg-blue-50 text-blue-800 border-blue-200 cursor-pointer hover:border-blue-400' 
                                                : 'bg-amber-50/80 text-amber-900 border-amber-300 cursor-pointer hover:border-amber-400'
                                        }" title="Assign / Change Workshop Bay">
                                            <span class="font-bold text-[11px] uppercase tracking-tight flex-1 text-center pointer-events-none whitespace-nowrap">${(!job.location || job.location === 'None') ? 'Waiting Area' : job.location.replace(/^Lift/, 'Bay')}</span>
                                            <i data-lucide="chevron-down" class="w-3.5 h-3.5 opacity-80 shrink-0 pointer-events-none stroke-[2.5]"></i>
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
                                        `;
                                    } else if (isEditable && !isMonitoringOrActive) {
                                        return `
                                        <div class="inline-flex items-center justify-between gap-1.5 border border-slate-200 bg-slate-100/90 text-slate-500 rounded-xl px-3 py-1.5 shadow-2xs min-w-[155px] max-w-[170px] cursor-not-allowed select-none opacity-85" 
                                             title="Vehicle is in '${job.status}'. Set Status to 'Monitoring' to assign a workshop bay.">
                                            <span class="font-bold text-[11px] uppercase tracking-tight flex-1 text-center whitespace-nowrap">${(!job.location || job.location === 'None') ? 'Waiting Area' : job.location.replace(/^Lift/, 'Bay')}</span>
                                            <i data-lucide="lock" class="w-3.5 h-3.5 text-slate-400 shrink-0 stroke-[2.2]"></i>
                                        </div>
                                        `;
                                    } else {
                                        return `
                                        <span class="inline-flex items-center justify-center font-bold text-[11px] uppercase tracking-tight px-3 py-1.5 rounded-xl shadow-2xs min-w-[155px] max-w-[170px] whitespace-nowrap ${
                                            (job.location && (job.location.startsWith('Bay') || job.location.startsWith('Lift')))
                                                ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                                                : 'bg-gray-100/90 text-gray-800 border border-gray-250'
                                        }">
                                            ${(!job.location || job.location === 'None') ? 'Waiting Area' : job.location.replace(/^Lift/, 'Bay')}
                                        </span>
                                        `;
                                    }
                                })()}
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
                        <div class="space-y-4">
                            <div class="flex items-center justify-between mb-1">
                                <div class="flex items-center gap-2.5">
                                    <div class="p-1.5 bg-red-50 rounded-lg text-red-600"><i data-lucide="list-todo" class="w-4 h-4"></i></div>
                                    <div>
                                        <h3 class="text-base font-black uppercase tracking-tight text-gray-900">Daily Intakes - Marikina</h3>
                                        <p class="text-[9.5px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Active Vehicles in Workshop</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Daily Intakes Advanced Filter & Sorting Panel -->
                            <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2.5 md:p-3 rounded-xl border border-slate-200/80">
                                <!-- Search Input -->
                                <div class="relative w-60">
                                    <i data-lucide="search" class="absolute left-2.5 top-2 text-gray-400 w-3.5 h-3.5"></i>
                                    <input type="text" id="intake-search-input" value="${intakeSearchQuery}" oninput="updateIntakeFilter('search', this.value)" placeholder="Search plate, vehicle..." class="w-full bg-white border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 outline-none text-xs focus:border-red-500 transition font-medium shadow-2xs">
                                </div>
                                
                                <!-- Dropdown Filters -->
                                <div class="flex flex-wrap items-center gap-2.5">
                                    <!-- Advisor / Works Filter -->
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[10.5px] text-gray-500 font-semibold uppercase tracking-wider">Advisor:</span>
                                        <div class="inline-flex items-center gap-1 bg-white border border-gray-200 hover:border-slate-400 rounded-lg px-2.5 py-1 shadow-2xs transition">
                                            <select id="intake-advisor-filter" onchange="updateIntakeFilter('advisor', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="all" ${intakeAdvisorFilter === 'all' ? 'selected' : ''}>All Advisors</option>
                                                <option value="mine" ${intakeAdvisorFilter === 'mine' ? 'selected' : ''}>My Works Only</option>
                                                <option value="unassigned" ${intakeAdvisorFilter === 'unassigned' ? 'selected' : ''}>Unassigned Only</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[10.5px] text-gray-500 font-semibold uppercase tracking-wider">Source:</span>
                                        <div class="inline-flex items-center gap-1 bg-white border border-gray-200 hover:border-slate-400 rounded-lg px-2.5 py-1 shadow-2xs transition">
                                            <select id="intake-source-filter" onchange="updateIntakeFilter('source', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="all" ${intakeSourceFilter === 'all' ? 'selected' : ''}>All Sources</option>
                                                <option value="Online" ${intakeSourceFilter === 'Online' ? 'selected' : ''}>Online Booking</option>
                                                <option value="Walk-in" ${intakeSourceFilter === 'Walk-in' ? 'selected' : ''}>Walk-in</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>
                                    
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[10.5px] text-gray-500 font-semibold uppercase tracking-wider">Time:</span>
                                        <div class="inline-flex items-center gap-1 bg-white border border-gray-200 hover:border-slate-400 rounded-lg px-2.5 py-1 shadow-2xs transition">
                                            <select id="intake-time-filter" onchange="updateIntakeFilter('time', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="all" ${intakeTimeFilter === 'all' ? 'selected' : ''}>All Day</option>
                                                <option value="morning" ${intakeTimeFilter === 'morning' ? 'selected' : ''}>Morning (08:00 - 12:00)</option>
                                                <option value="afternoon" ${intakeTimeFilter === 'afternoon' ? 'selected' : ''}>Afternoon (12:00 - 17:00)</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-1.5">
                                        <span class="text-[10.5px] text-gray-500 font-semibold uppercase tracking-wider">Sort By:</span>
                                        <div class="inline-flex items-center gap-1 bg-white border border-gray-200 hover:border-slate-400 rounded-lg px-2.5 py-1 shadow-2xs transition">
                                            <select id="intake-sort-by" onchange="updateIntakeFilter('sort', this.value)" class="text-xs font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer p-0 pr-1 appearance-none">
                                                <option value="claimStubDesc" ${intakeSortBy === 'claimStub' && intakeSortOrder === 'desc' ? 'selected' : ''}>Claim Stub (Desc)</option>
                                                <option value="claimStubAsc" ${intakeSortBy === 'claimStub' && intakeSortOrder === 'asc' ? 'selected' : ''}>Claim Stub (Asc)</option>
                                                <option value="arrival" ${intakeSortBy === 'arrival' ? 'selected' : ''}>Arrival Time</option>
                                            </select>
                                            <i data-lucide="chevron-down" class="w-3 h-3 text-gray-400 shrink-0 pointer-events-none stroke-[2]"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="overflow-x-auto max-h-[420px] overflow-y-auto border border-gray-200 rounded-xl custom-scroll bg-white">
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

                    const partsAvail = String(job.partsAvailable || '').trim().toLowerCase();
                    const isPartsYes = (partsAvail === 'yes' || partsAvail === '1' || partsAvail === 'true');
                    const isPartsNo = (partsAvail === 'no' || partsAvail === '0' || partsAvail === 'false');

                    return `
                    <tr class="hover:bg-slate-50/70 transition-colors border-b border-gray-100/80">
                        <!-- Row Number -->
                        <td class="px-2.5 py-2.5 align-middle text-center font-mono text-xs text-gray-400 font-bold">${idx + 1}</td>
                        <td class="px-3 py-2.5 align-middle"><span class="inline-flex items-center justify-center font-mono font-bold text-xs uppercase tracking-wide bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">${job.claimStub || 'N/A'}</span></td>
                        <td class="px-3 py-2.5 align-middle"><span class="inline-flex items-center justify-center font-mono font-bold text-xs uppercase tracking-wide bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">${job.plate}</span></td>
                        <td class="px-3 py-2.5 align-middle"><span class="text-gray-900 text-sm font-bold">${job.vehicle}</span></td>
                        <!-- Date (Received, Promised) -->
                        <td class="px-3 py-2.5 align-middle whitespace-nowrap">
                            <div class="inline-flex flex-col bg-slate-50 border border-slate-200 rounded-lg overflow-hidden min-w-[150px] shadow-2xs">
                                <div class="flex items-center justify-between px-2.5 py-1 text-[10.5px] border-b border-slate-200 font-medium text-slate-600 gap-2">
                                    <span class="text-[9.5px] uppercase font-bold text-slate-400 shrink-0">Recv:</span>
                                    <span class="font-mono font-bold text-slate-800">${job.dateReceived || '--'}</span>
                                </div>
                                <div class="relative flex items-center justify-between px-2.5 py-1 text-[10.5px] font-medium text-slate-600 gap-2 ${isEditable ? 'hover:bg-white cursor-pointer group' : ''}">
                                    <span class="text-[9.5px] uppercase font-bold text-amber-600 shrink-0">Promised:</span>
                                    <span class="font-mono font-bold text-slate-900 ${!job.promisedDate ? 'text-slate-400 italic' : ''}">${job.promisedDate || 'Set Date'}</span>
                                    ${isEditable ? `
                                    <input type="date" 
                                           value="${job.promisedDate || ''}" 
                                           onchange="updateJobField('${job.id}', 'promisedDate', this.value)" 
                                           class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                           title="Click to select promised date">
                                    ` : ''}
                                </div>
                            </div>
                        </td>
                        <!-- Parts & Materials Available? (Whiteboard YES / NO requirement) -->
                        <td class="px-3 py-2.5 align-middle text-center whitespace-nowrap">
                            ${isEditable ? `
                            <div class="inline-flex p-0.5 bg-slate-100 border border-slate-200 rounded-xl shadow-2xs">
                                <button type="button" 
                                        onclick="updateJobField('${job.id}', 'partsAvailable', 'Yes')" 
                                        class="px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center gap-1 ${isPartsYes ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}"
                                        title="Mark Parts & Materials as AVAILABLE (YES)">
                                    <i data-lucide="check" class="w-3 h-3"></i> YES
                                </button>
                                <button type="button" 
                                        onclick="updateJobField('${job.id}', 'partsAvailable', 'No')" 
                                        class="px-2.5 py-1 rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center gap-1 ${(isPartsNo || (!isPartsYes && !isPartsNo)) ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-700 hover:bg-rose-50'}"
                                        title="Mark Parts & Materials as NOT AVAILABLE (NO)">
                                    <i data-lucide="x" class="w-3 h-3"></i> NO
                                </button>
                            </div>
                            ` : `
                            ${isPartsYes ? `
                                <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
                                    <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-600"></i> YES
                                </span>
                            ` : `
                                <span class="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider">
                                    <i data-lucide="x-circle" class="w-3.5 h-3.5 text-rose-600"></i> NO
                                </span>
                            `}
                            `}
                        </td>
                        <td class="px-3 py-2.5 align-middle min-w-[220px]">
                            ${isEditable ? `
                            <div class="eval-field-card">
                                <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <input type="text" value="${job.evaluation || ''}" title="${job.evaluation || ''}" placeholder="Diagnosis / Notes..." onchange="updateJobField('${job.id}', 'evaluation', this.value)">
                            </div>
                            ` : `
                            <div class="eval-badge-static">
                                <svg class="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                </svg>
                                <span class="text-[10.5px] font-medium text-gray-700 truncate" title="${job.evaluation || ''}">${job.evaluation || 'No evaluation note'}</span>
                            </div>
                            `}
                        </td>
                        <td class="px-3 py-2.5 align-middle">
                            ${isEditable ? `
                            <div class="relative inline-flex items-center justify-between gap-1.5 border border-orange-200 bg-orange-50/80 hover:bg-orange-100/80 hover:border-orange-400 text-orange-900 rounded-xl px-2.5 py-1.5 shadow-2xs transition cursor-pointer w-[165px]" title="Click to Change Carry-Over Status">
                                <span class="font-extrabold text-xs uppercase flex-1 text-left truncate pointer-events-none">${job.carryOverStatus || 'Awaiting Parts'}</span>
                                <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-orange-600 shrink-0 pointer-events-none stroke-[2.5]"></i>
                                <select onchange="updateJobField('${job.id}', 'carryOverStatus', this.value)" 
                                        class="table-select absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                        title="Change Carry-Over Status">
                                    <option value="Awaiting Parts" ${job.carryOverStatus === 'Awaiting Parts' ? 'selected' : ''}>Awaiting Parts</option>
                                    <option value="Extended Repair" ${job.carryOverStatus === 'Extended Repair' ? 'selected' : ''}>Extended Repair</option>
                                    <option value="Technician Unavailable" ${job.carryOverStatus === 'Technician Unavailable' ? 'selected' : ''}>Technician Unavailable</option>
                                    <option value="WCA" ${job.carryOverStatus === 'WCA' ? 'selected' : ''}>WCA</option>
                                    <option value="Others" ${job.carryOverStatus === 'Others' ? 'selected' : ''}>Others</option>
                                </select>
                            </div>
                            ` : `<span class="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold uppercase text-gray-800 border border-gray-200 shadow-2xs">${job.carryOverStatus || 'Awaiting Parts'}</span>`}
                        </td>
                        <td class="px-3 py-2.5 align-middle text-right">
                            ${actions}
                        </td>
                    </tr>
                    `;
                }).join('') || `<tr><td colspan="10" class="text-center py-8 text-gray-500 font-medium">No carry over vehicles.</td></tr>`;
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
            const partsAvail = job ? String(job.partsAvailable || '').trim().toLowerCase() : '';
            const isYes = (partsAvail === 'yes' || partsAvail === '1' || partsAvail === 'true');
            
            const radioYes = document.querySelector('input[name="carryover-parts-available"][value="Yes"]');
            const radioNo = document.querySelector('input[name="carryover-parts-available"][value="No"]');
            if (radioYes && radioNo) {
                if (isYes) radioYes.checked = true;
                else radioNo.checked = true;
            }
            
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
            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
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
            const partsAvailableInput = document.querySelector('input[name="carryover-parts-available"]:checked');
            const partsAvailable = partsAvailableInput ? partsAvailableInput.value : 'No';

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
                    body: { field: 'partsAvailable', value: partsAvailable }
                });
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
            const btnBackjobs = document.getElementById('btn-db-tab-backjobs');
            const btnAudits = document.getElementById('btn-db-tab-audits');

            const secMonitor = document.getElementById('db-tab-monitor');
            const secAnalytics = document.getElementById('db-tab-analytics');
            const secReports = document.getElementById('db-tab-reports');
            const secExpress = document.getElementById('db-tab-express');
            const secPeriodic = document.getElementById('db-tab-periodic');
            const secBackjobs = document.getElementById('db-tab-backjobs');
            const secAudits = document.getElementById('db-tab-audits');
            const secSelectors = document.getElementById('db-analytics-selectors');

            const activeClass = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-xs transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer";
            const inactiveClass = "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 hover:text-slate-900 hover:bg-white/80 transition flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer";

            // Hide all tabs
            if (secMonitor) secMonitor.classList.add('hidden');
            if (secAnalytics) secAnalytics.classList.add('hidden');
            if (secReports) secReports.classList.add('hidden');
            if (secExpress) secExpress.classList.add('hidden');
            if (secPeriodic) secPeriodic.classList.add('hidden');
            if (secBackjobs) secBackjobs.classList.add('hidden');
            if (secAudits) secAudits.classList.add('hidden');
            
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
            if (btnBackjobs) btnBackjobs.className = inactiveClass;
            if (btnAudits) btnAudits.className = inactiveClass;

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
            } else if (tab === 'backjobs') {
                if (secBackjobs) secBackjobs.classList.remove('hidden');
                if (btnBackjobs) btnBackjobs.className = activeClass;
                if (!Array.isArray(allJobs) || allJobs.length === 0) {
                    loadData().then(() => renderBackJobIntelligenceModule());
                } else {
                    renderBackJobIntelligenceModule();
                }
            } else if (tab === 'audits') {
                if (secAudits) secAudits.classList.remove('hidden');
                if (btnAudits) btnAudits.className = activeClass;
                renderCentralAuditLogsModule();
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

        function renderBackJobIntelligenceModule() {
            const container = document.getElementById('db-tab-backjobs');
            if (!container || container.classList.contains('hidden')) return;

            const safeJobs = (Array.isArray(allJobs) && allJobs.length > 0) ? allJobs : ((Array.isArray(analyticsJobs) && analyticsJobs.length > 0) ? analyticsJobs : (window.allJobs || []));
            const backJobs = safeJobs.filter(j => {
                const cat = (j.category || '').toLowerCase();
                const evalNotes = (j.evaluation || '').toLowerCase();
                const remarks = (j.remarks || '').toLowerCase();
                const concern = (j.concern || '').toLowerCase();
                return cat.includes('back-job') || cat.includes('backjob') || cat.includes('warranty') || cat.includes('return') ||
                       evalNotes.includes('back-job') || evalNotes.includes('backjob') || evalNotes.includes('warranty return') ||
                       remarks.includes('back-job') || remarks.includes('backjob') || remarks.includes('warranty return') ||
                       concern.includes('back-job') || concern.includes('backjob') || concern.includes('warranty') ||
                       Boolean(j.isBackJob || j.is_backjob);
            });

            const totalInflow = safeJobs.length || 1;
            const backJobCount = backJobs.length;
            const returnRate = ((backJobCount / totalInflow) * 100).toFixed(1);

            const mTotal = document.getElementById('backjob-metric-total');
            const mTotalBar = document.getElementById('backjob-metric-total-bar');
            const mRate = document.getElementById('backjob-metric-rate');
            const mRateBar = document.getElementById('backjob-metric-rate-bar');
            const mInflow = document.getElementById('backjob-total-inflow-count');
            const mRecords = document.getElementById('backjob-records-count');
            const mResolved = document.getElementById('backjob-resolved-count');
            const mPending = document.getElementById('backjob-pending-eval');
            const mCompleted = document.getElementById('backjob-completed-eval');
            const mTopCat = document.getElementById('backjob-top-category');

            if (mTotal) mTotal.innerText = backJobCount.toString();
            if (mTotalBar) mTotalBar.style.width = `${Math.min(100, backJobCount * 10)}%`;
            if (mRate) mRate.innerText = `${returnRate}%`;
            if (mRateBar) mRateBar.style.width = `${Math.min(100, parseFloat(returnRate) * 10)}%`;
            if (mInflow) mInflow.innerText = `${safeJobs.length} cars`;
            if (mRecords) mRecords.innerText = `${backJobCount} Back-Jobs Logged`;

            // Calculate category breakdown
            const catCounts = {};
            backJobs.forEach(j => {
                const c = j.category || 'General Repair';
                catCounts[c] = (catCounts[c] || 0) + 1;
            });
            const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
            if (mTopCat) mTopCat.innerText = topCat ? `${topCat[0]} (${topCat[1]})` : 'None Logged';

            const resolvedJobs = backJobs.filter(j => j.status === 'Released' || j.status === 'Completed').length;
            const pendingJobs = backJobs.filter(j => j.status !== 'Released' && j.status !== 'Completed').length;
            if (mResolved) mResolved.innerText = resolvedJobs.toString();
            if (mPending) mPending.innerText = pendingJobs.toString();
            if (mCompleted) mCompleted.innerText = resolvedJobs.toString();

            const tableBody = document.getElementById('table-backjobs-analytics-body');
            if (tableBody) {
                if (backJobs.length === 0) {
                    tableBody.innerHTML = `
                        <tr>
                            <td colspan="8" class="text-center py-12 text-slate-400 font-medium">
                                <div class="flex flex-col items-center justify-center gap-2">
                                    <i data-lucide="check-circle" class="w-8 h-8 text-emerald-500"></i>
                                    <p class="text-xs uppercase font-bold tracking-wider text-slate-700">No Back-Job Return Repairs Recorded</p>
                                    <p class="text-[11px] text-slate-400 font-normal">All customer repair orders passed quality verification without repeat warranty complaints.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    tableBody.innerHTML = backJobs.map(j => {
                        const plate = j.plate || j.plateNumber || 'NO-PLATE';
                        const vehicle = j.vehicle || j.model || 'Unknown Model';
                        const name = j.name || j.customerName || j.customer || 'Customer';
                        const date = j.dateReceived || j.apptDate || j.date || (j.createdAt ? j.createdAt.split('T')[0].split(' ')[0] : '--');
                        const branch = j.branch || 'Marikina Branch';
                        const sa = j.saName || j.handled_by || 'Assigned SA';
                        const concern = j.concern || j.remarks || j.evaluation || j.category || 'Return inspection';
                        const isDone = j.status === 'Released' || j.status === 'Completed';
                        const statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${isDone ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-800 border border-slate-200'}">${j.status || 'In Progress'}</span>`;

                        return `
                            <tr class="hover:bg-slate-50/70 transition border-b border-gray-100">
                                <td class="px-6 py-3.5 font-bold text-slate-900 text-xs whitespace-nowrap">${date}</td>
                                <td class="px-6 py-3.5"><span class="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${plate}</span></td>
                                <td class="px-6 py-3.5 font-medium text-slate-800 text-xs">${vehicle}</td>
                                <td class="px-6 py-3.5 text-slate-900 font-bold text-xs">${name}</td>
                                <td class="px-6 py-3.5 text-slate-700 text-xs font-medium max-w-[240px] truncate" title="${concern}">${concern}</td>
                                <td class="px-6 py-3.5 text-slate-600 text-xs font-semibold">${branch}</td>
                                <td class="px-6 py-3.5 text-slate-900 font-bold text-xs">${sa}</td>
                                <td class="px-6 py-3.5 text-center">${statusBadge}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        }
        window.renderBackJobIntelligenceModule = renderBackJobIntelligenceModule;

        let centralAuditLogsCache = [];

        async function renderCentralAuditLogsModule() {
            const container = document.getElementById('db-tab-audits');
            if (!container || container.classList.contains('hidden')) return;

            const tbody = document.getElementById('table-central-audit-body');
            const totalEl = document.getElementById('audit-stat-total');
            const handoversEl = document.getElementById('audit-stat-handovers');
            const delaysEl = document.getElementById('audit-stat-delays');
            const usersEl = document.getElementById('audit-stat-users');
            const badgeEl = document.getElementById('audit-records-count-badge');

            if (tbody && centralAuditLogsCache.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-10 text-slate-400">
                            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-slate-500 mb-2"></i>
                            <p class="text-xs font-semibold">Loading system audit logs...</p>
                        </td>
                    </tr>
                `;
                if (window.lucide) window.lucide.createIcons();
            }

            try {
                const logs = await apiRequest('/api/audit-logs');
                centralAuditLogsCache = Array.isArray(logs) ? logs : [];
            } catch (err) {
                console.warn('Failed to fetch from /api/audit-logs:', err);
            }

            const actionFilter = document.getElementById('audit-filter-action')?.value || 'all';
            const startDate = document.getElementById('audit-filter-start-date')?.value || '';
            const endDate = document.getElementById('audit-filter-end-date')?.value || '';
            const query = (document.getElementById('audit-filter-search')?.value || '').toLowerCase().trim();

            let filtered = centralAuditLogsCache.filter(log => {
                if (actionFilter !== 'all' && log.field_name !== actionFilter) return false;
                const logDate = log.created_at ? log.created_at.split('T')[0].split(' ')[0] : '';
                if (startDate && logDate < startDate) return false;
                if (endDate && logDate > endDate) return false;
                if (query) {
                    const str = `${log.plate || ''} ${log.field_name || ''} ${log.old_value || ''} ${log.new_value || ''} ${log.edit_reason || ''} ${log.edited_by_name || ''} ${log.edited_by_role || ''}`.toLowerCase();
                    if (!str.includes(query)) return false;
                }
                return true;
            });

            // Update Telemetry Metrics
            const totalEvents = centralAuditLogsCache.length;
            const handoversCount = centralAuditLogsCache.filter(l => l.field_name === 'saName').length;
            const delaysCount = centralAuditLogsCache.filter(l => l.field_name === 'express_delay_report').length;
            const distinctUsers = new Set(centralAuditLogsCache.map(l => l.edited_by_name).filter(Boolean)).size;

            if (totalEl) totalEl.innerText = totalEvents.toString();
            if (handoversEl) handoversEl.innerText = handoversCount.toString();
            if (delaysEl) delaysEl.innerText = delaysCount.toString();
            if (usersEl) usersEl.innerText = distinctUsers.toString();
            if (badgeEl) badgeEl.innerText = `${filtered.length} Records`;

            if (!tbody) return;

            if (filtered.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-12 text-slate-400">
                            <i data-lucide="shield-check" class="w-8 h-8 mx-auto text-emerald-500 mb-2"></i>
                            <p class="text-xs font-bold text-slate-700">No Audit Events Matching Filter</p>
                            <p class="text-[11px] text-slate-400 mt-0.5">All operations are pristine or try adjusting your search filters.</p>
                        </td>
                    </tr>
                `;
                if (window.lucide) window.lucide.createIcons();
                return;
            }

            let html = '';
            filtered.forEach(log => {
                const formattedDate = log.created_at ? log.created_at.replace('T', ' ').substring(0, 16) : 'Recently';
                const isHandover = log.field_name === 'saName';
                const isDelay = log.field_name === 'express_delay_report';
                const badgeColor = isHandover ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : isDelay ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-800 border-slate-200';

                html += `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">${escapeHtml(formattedDate)}</td>
                        <td class="py-3 px-4 whitespace-nowrap">
                            <span class="font-mono font-bold text-xs bg-slate-100 border border-slate-200 text-slate-900 px-2 py-0.5 rounded shadow-2xs">${escapeHtml(log.plate || 'N/A')}</span>
                        </td>
                        <td class="py-3 px-4 whitespace-nowrap">
                            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${badgeColor}">
                                ${escapeHtml(formatFieldName(log.field_name))}
                            </span>
                        </td>
                        <td class="py-3 px-4 font-mono text-[11px] text-slate-600 max-w-[140px] truncate" title="${escapeHtml(log.old_value || 'None')}">${escapeHtml(log.old_value || '-')}</td>
                        <td class="py-3 px-4 font-mono font-bold text-[11px] text-slate-900 max-w-[140px] truncate" title="${escapeHtml(log.new_value || 'None')}">${escapeHtml(log.new_value || '-')}</td>
                        <td class="py-3 px-4 text-[11px] text-slate-700 italic max-w-[200px] truncate" title="${escapeHtml(log.edit_reason || '-')}">${escapeHtml(log.edit_reason || '-')}</td>
                        <td class="py-3 px-4 text-right whitespace-nowrap">
                            <span class="px-2 py-0.5 bg-slate-200/80 text-slate-800 rounded text-[9.5px] font-extrabold uppercase">
                                ${escapeHtml(log.edited_by_name || 'Staff')} (${escapeHtml(log.edited_by_role || 'SA')})
                            </span>
                        </td>
                    </tr>
                `;
            });

            tbody.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();
        }
        window.renderCentralAuditLogsModule = renderCentralAuditLogsModule;

        function exportCentralAuditLogsCSV() {
            if (!Array.isArray(centralAuditLogsCache) || centralAuditLogsCache.length === 0) {
                showSystemToast('No audit logs available to export.', 'warning', 'Export Empty');
                return;
            }

            let csv = "Created At,Vehicle Plate,Action / Field,Previous Value,Updated Value,Reason / Justification,Modified By Name,Modified By Role\n";
            centralAuditLogsCache.forEach(log => {
                const row = [
                    `"${(log.created_at || '').replace(/"/g, '""')}"`,
                    `"${(log.plate || '').replace(/"/g, '""')}"`,
                    `"${(log.field_name || '').replace(/"/g, '""')}"`,
                    `"${(log.old_value || '').replace(/"/g, '""')}"`,
                    `"${(log.new_value || '').replace(/"/g, '""')}"`,
                    `"${(log.edit_reason || '').replace(/"/g, '""')}"`,
                    `"${(log.edited_by_name || '').replace(/"/g, '""')}"`,
                    `"${(log.edited_by_role || '').replace(/"/g, '""')}"`
                ];
                csv += row.join(',') + "\n";
            });

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `HonTech_Audit_Trail_Handovers_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSystemToast('Audit trail CSV exported successfully.', 'success', 'Audit Export');
        }
        window.exportCentralAuditLogsCSV = exportCentralAuditLogsCSV;

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

            // 1. INFLOW BREAKDOWN CALCULATIONS (Strictly 4 Core Categories: PMS, GRS, PMS & GRS, Others)
            function getJobCoreCategory(job) {
                const cat = (job.category || '').toUpperCase();
                const serv = (job.serviceType || job.service_type || job.services || '').toUpperCase();
                const combined = `${cat} ${serv}`;

                const hasPMS = combined.includes('PMS') || combined.includes('PREVENTIVE') || combined.includes('MAINTENANCE');
                const hasGRS = combined.includes('GRS') || combined.includes('GENERAL REPAIR') || combined.includes('REPAIR') || combined.includes('OVERHAUL') || combined.includes('SUSPENSION') || combined.includes('BRAKE');

                if (hasPMS && hasGRS) return 'PMS & GRS';
                if (hasPMS) return 'PMS';
                if (hasGRS) return 'GRS';
                return 'Others';
            }

            const pmsJobs = filtered.filter(j => getJobCoreCategory(j) === 'PMS');
            const grsJobs = filtered.filter(j => getJobCoreCategory(j) === 'GRS');
            const pmsGrsJobs = filtered.filter(j => getJobCoreCategory(j) === 'PMS & GRS');
            const othersJobs = filtered.filter(j => getJobCoreCategory(j) === 'Others');

            const totalPumasok = filtered.length;
            const countPMS = pmsJobs.length;
            const inbayPMS = pmsJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedPMS = pmsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const sharePMS = totalPumasok > 0 ? Math.round((countPMS / totalPumasok) * 100) : 0;

            const countGRS = grsJobs.length;
            const inbayGRS = grsJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedGRS = grsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const shareGRS = totalPumasok > 0 ? Math.round((countGRS / totalPumasok) * 100) : 0;

            const countPMSGrs = pmsGrsJobs.length;
            const inbayPMSGrs = pmsGrsJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedPMSGrs = pmsGrsJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const sharePMSGrs = totalPumasok > 0 ? Math.round((countPMSGrs / totalPumasok) * 100) : 0;

            const countOthers = othersJobs.length;
            const inbayOthers = othersJobs.filter(j => j.location && (j.location.startsWith('Bay') || j.location.startsWith('Lift')) && j.status !== 'Completed' && j.status !== 'Released').length;
            const releasedOthers = othersJobs.filter(j => j.status === 'Completed' || j.status === 'Released').length;
            const shareOthers = totalPumasok > 0 ? Math.round((countOthers / totalPumasok) * 100) : 0;

            const totalInBay = inbayPMS + inbayGRS + inbayPMSGrs + inbayOthers;
            const totalReleased = releasedPMS + releasedGRS + releasedPMSGrs + releasedOthers;

            // 2. POPULATE TABLE 1: Category Intakes Matrix & Chart.js Graph (4 Core Categories - Clean Executive Monochrome)
            const categoryRows = [
                {
                    name: 'PMS (Preventive Maintenance Service)',
                    categoryKey: 'PMS',
                    actual: countPMS,
                    inbay: inbayPMS,
                    released: releasedPMS,
                    share: sharePMS
                },
                {
                    name: 'GRS (General Repair Service)',
                    categoryKey: 'GRS',
                    actual: countGRS,
                    inbay: inbayGRS,
                    released: releasedGRS,
                    share: shareGRS
                },
                {
                    name: 'PMS & GRS (Combined Services)',
                    categoryKey: 'PMS & GRS',
                    actual: countPMSGrs,
                    inbay: inbayPMSGrs,
                    released: releasedPMSGrs,
                    share: sharePMSGrs
                },
                {
                    name: 'Others (Diagnostics, Electrical, Multi-Point, etc.)',
                    categoryKey: 'Others',
                    actual: countOthers,
                    inbay: inbayOthers,
                    released: releasedOthers,
                    share: shareOthers
                }
            ];

            // Render Chart.js Graph (Actual Population vs Completed & Released)
            if (typeof Chart !== 'undefined') {
                const chartCanvas = document.getElementById('chart-category-inflow');
                if (chartCanvas) {
                    if (window.categoryInflowChartInstance) {
                        try { window.categoryInflowChartInstance.destroy(); } catch (e) {}
                    }
                    window.categoryInflowChartInstance = new Chart(chartCanvas, {
                        type: 'bar',
                        data: {
                            labels: ['PMS', 'GRS', 'PMS & GRS', 'Others'],
                            datasets: [
                                {
                                    label: 'Actual Population (Intakes)',
                                    data: [countPMS, countGRS, countPMSGrs, countOthers],
                                    backgroundColor: '#0f172a',
                                    borderColor: '#0f172a',
                                    borderWidth: 1,
                                    borderRadius: 6,
                                    barPercentage: 0.55,
                                    categoryPercentage: 0.75
                                },
                                {
                                    label: 'Completed & Released',
                                    data: [releasedPMS, releasedGRS, releasedPMSGrs, releasedOthers],
                                    backgroundColor: '#475569',
                                    borderColor: '#334155',
                                    borderWidth: 1,
                                    borderRadius: 6,
                                    barPercentage: 0.55,
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
                                    ticks: { font: { size: 11, weight: '700' }, color: '#475569' }
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
                let catHtml = categoryRows.map(row => `
                    <tr class="hover:bg-gray-50/60 transition border-b border-gray-100">
                        <td class="px-6 py-4 font-semibold text-gray-900 text-xs">
                            ${row.name}
                        </td>
                        <td class="px-6 py-4 text-center font-black text-gray-900 text-sm">
                            ${row.actual} <span class="text-xs text-gray-400 font-normal">cars</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                                <strong class="text-slate-900 font-bold">${row.inbay}</strong> in bay
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                                <strong class="text-slate-900 font-bold">${row.released}</strong> released
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="font-bold text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">${row.share}%</span>
                        </td>
                    </tr>
                `).join('');

                catHtml += `
                    <tr class="bg-gray-100/90 text-gray-900 font-extrabold text-xs border-t-2 border-gray-300">
                        <td class="px-6 py-4 text-gray-950 uppercase tracking-wider font-black">
                            <div class="flex items-center gap-2">
                                <span class="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                                <span>TOTAL WORKSHOP POPULATION</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center font-black text-gray-950 text-base">
                            ${totalPumasok} <span class="text-xs text-gray-500 font-semibold">cars</span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-md border border-gray-200 shadow-2xs">
                                <strong class="text-gray-950 font-black">${totalInBay}</strong> in bay
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded-md border border-gray-200 shadow-2xs">
                                <strong class="text-gray-950 font-black">${totalReleased}</strong> released
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-[10px] uppercase font-black tracking-wider text-gray-700 bg-white px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">100% TOTAL</span>
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
                    tableDailyBody.innerHTML = `<tr><td colspan="9" class="text-center py-12 text-gray-400 font-medium">No daily intake records match the selected date range.</td></tr>`;
                } else {
                    tableDailyBody.innerHTML = sortedDates.map(dateStr => {
                        const dayJobs = dateGroups[dateStr];
                        const dayObj = dateStr !== 'Unspecified Date' ? new Date(dateStr + 'T00:00:00') : null;
                        const dayOfWeek = dayObj && !isNaN(dayObj) ? dayObj.toLocaleDateString('en-US', { weekday: 'long' }) : '--';

                        const dayWalkin = dayJobs.filter(j => j.source === 'Walk-in').length;
                        const dayOnline = dayJobs.filter(j => j.source === 'Online').length;
                        const dayTotal = dayJobs.length;

                        const dayPMS = dayJobs.filter(j => getJobCoreCategory(j) === 'PMS').length;
                        const dayGRS = dayJobs.filter(j => getJobCoreCategory(j) === 'GRS').length;
                        const dayPMSGrs = dayJobs.filter(j => getJobCoreCategory(j) === 'PMS & GRS').length;
                        const dayOthers = dayJobs.filter(j => getJobCoreCategory(j) === 'Others').length;

                        const pmsCell = dayPMS > 0 ? `<span class="font-bold text-slate-900">${dayPMS}</span>` : `<span class="text-slate-300 font-normal">0</span>`;
                        const grsCell = dayGRS > 0 ? `<span class="font-bold text-slate-900">${dayGRS}</span>` : `<span class="text-slate-300 font-normal">0</span>`;
                        const pmsGrsCell = dayPMSGrs > 0 ? `<span class="font-bold text-slate-900">${dayPMSGrs}</span>` : `<span class="text-slate-300 font-normal">0</span>`;
                        const othersCell = dayOthers > 0 ? `<span class="font-bold text-slate-900">${dayOthers}</span>` : `<span class="text-slate-300 font-normal">0</span>`;

                        return `
                            <tr class="hover:bg-slate-50/70 transition border-b border-slate-100">
                                <td class="px-6 py-3.5 font-bold text-slate-900">${dateStr}</td>
                                <td class="px-6 py-3.5 text-xs text-slate-500 font-medium">${dayOfWeek}</td>
                                <td class="px-6 py-3.5 text-center font-semibold text-slate-700">${dayWalkin}</td>
                                <td class="px-6 py-3.5 text-center font-semibold text-slate-700">${dayOnline}</td>
                                <td class="px-6 py-3.5 text-center font-bold text-slate-900 bg-slate-50/80">${dayTotal} cars</td>
                                <td class="px-6 py-3.5 text-center">${pmsCell}</td>
                                <td class="px-6 py-3.5 text-center">${grsCell}</td>
                                <td class="px-6 py-3.5 text-center">${pmsGrsCell}</td>
                                <td class="px-6 py-3.5 text-right">${othersCell}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            if (window.lucide) lucide.createIcons();
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
            let csv = "Date,Day of Week,Walk-In,Online,Total Intakes,PMS,GRS,PMS & GRS,Others\n";
            rows.forEach(tr => {
                const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
                if (cols.length >= 9) {
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

            // Filter jobs in range with robust date parsing
            const filteredJobs = safeJobs.filter(j => {
                let jobDate = j.dateReceived || j.apptDate || j.date || (j.createdAt ? j.createdAt.split('T')[0].split(' ')[0] : '');
                jobDate = (jobDate || '').trim().substring(0, 10);
                if (startDate && jobDate && jobDate < startDate) return false;
                if (endDate && jobDate && jobDate > endDate) return false;
                if (branchFilter !== 'all' && j.branch && j.branch !== branchFilter) return false;
                if (searchFilter) {
                    const matchStr = `${j.claimStub || ''} ${j.plateNumber || ''} ${j.plate || ''} ${j.model || ''} ${j.vehicle || ''} ${j.category || ''} ${j.saName || ''} ${j.remarks || ''} ${j.goalRemarks || ''} ${j.delayReason || ''} ${j.evaluation || ''}`.toLowerCase();
                    if (!matchStr.includes(searchFilter)) return false;
                }
                return true;
            });

            // Focus on Express, PMS, and workshop turnaround jobs
            const expressJobs = filteredJobs.filter(j => {
                const cat = (j.category || '').toUpperCase();
                const lane = (j.laneType || '').toUpperCase();
                return lane.includes('EXPRESS') || lane.includes('PMS') || cat === 'PMS' || cat === 'PMS & GRS' || cat === 'EXPRESS' || j.isExpress;
            });

            const delayedRecords = [];

            // Process jobs and capture SA turnaround reports
            expressJobs.forEach(j => {
                let duration = 0;
                if (j.arrival && j.departure && j.arrival.includes(':') && j.departure.includes(':')) {
                    const [ah, am] = j.arrival.split(':').map(Number);
                    const [dh, dm] = j.departure.split(':').map(Number);
                    let diff = (dh * 60 + dm) - (ah * 60 + am);
                    if (diff < 0) diff += 1440;
                    if (diff > 0) duration = diff;
                } else if (j.arrival && j.arrival.includes(':') && j.status !== 'Completed' && j.status !== 'Released') {
                    const [ah, am] = j.arrival.split(':').map(Number);
                    const now = new Date();
                    let diff = (now.getHours() * 60 + now.getMinutes()) - (ah * 60 + am);
                    if (diff < 0) diff += 1440;
                    if (diff > 0) duration = diff;
                } else if (j.timeStarted && j.timeCompleted) {
                    const s = new Date(j.timeStarted);
                    const e = new Date(j.timeCompleted);
                    if (!isNaN(s) && !isNaN(e) && e >= s) {
                        duration = Math.round((e - s) / 60000);
                    }
                }

                if (!duration || duration <= 0) {
                    if (j.durationMinutes) duration = Number(j.durationMinutes);
                    else if (j.estimatedTime) duration = Number(j.estimatedTime);
                    else duration = 45;
                }

                const isExpressLane = (j.laneType && j.laneType.toLowerCase().includes('express')) || (j.category && j.category.toUpperCase().includes('EXPRESS'));
                const maxAllowedSLA = isExpressLane ? 60 : 120; // 60 mins for Express, 120 mins (2 Hours) for Standard PMS
                const isOverrun = duration > maxAllowedSLA || j.status === 'Delayed' || j.goalRemarks === 'Failed' || (j.remarks && j.remarks.toLowerCase().includes('delay')) || (j.evaluation && j.evaluation.toLowerCase().includes('delay'));

                if (isOverrun) {
                    const overrunDelta = Math.max(1, duration - maxAllowedSLA);
                    delayedRecords.push({
                        date: j.dateReceived || j.date || (j.createdAt ? j.createdAt.split('T')[0].split(' ')[0] : 'Today'),
                        claimStub: j.claimStub || `CS-${j.id || '000'}`,
                        plate: j.plateNumber || j.plate || 'N/A',
                        model: j.model || j.vehicleModel || j.vehicle || 'Standard Vehicle',
                        saName: j.saName || j.handled_by || 'Front Desk SA',
                        category: j.category || (isExpressLane ? 'Express PMS' : 'PMS / GRS'),
                        arrival: j.arrival || '--:--',
                        departure: j.departure || (j.status !== 'Completed' && j.status !== 'Released' ? 'Active in Shop' : '--:--'),
                        duration: duration,
                        overrun: overrunDelta,
                        remarks: j.evaluation || j.remarks || j.goalRemarks || `Turnaround duration exceeded ${maxAllowedSLA}-minute target`
                    });
                }
            });

            // Populate Delayed Services Log Table
            const delayTableBody = document.getElementById('table-express-delays-body');
            if (delayTableBody) {
                if (delayedRecords.length === 0) {
                    delayTableBody.innerHTML = `
                        <tr>
                            <td colspan="11" class="text-center py-12 text-slate-400 font-semibold">
                                <div class="flex flex-col items-center justify-center gap-2">
                                    <i data-lucide="check-circle" class="w-8 h-8 text-slate-400"></i>
                                    <p class="text-xs uppercase font-bold tracking-wider text-slate-700">No Delayed Records in Selected Period</p>
                                    <p class="text-[11px] text-slate-400 font-normal">All service advisor entries within this date range were serviced within target turnaround thresholds.</p>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    delayTableBody.innerHTML = delayedRecords.map(r => `
                        <tr class="hover:bg-slate-50/70 transition border-b border-gray-100/80">
                            <td class="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">${r.date}</td>
                            <td class="px-4 py-3.5 font-bold text-slate-800">${r.claimStub}</td>
                            <td class="px-4 py-3.5 font-black text-slate-900 font-mono">${r.plate}</td>
                            <td class="px-5 py-3.5 font-medium text-slate-700">${r.model}</td>
                            <td class="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">${r.saName}</td>
                            <td class="px-4 py-3.5 font-bold text-slate-800">${r.category}</td>
                            <td class="px-4 py-3.5 text-center font-mono font-bold text-slate-700">${r.arrival}</td>
                            <td class="px-4 py-3.5 text-center font-mono font-bold text-slate-700">${r.departure}</td>
                            <td class="px-4 py-3.5 text-center font-black text-slate-900">${r.duration}m</td>
                            <td class="px-4 py-3.5 text-center">
                                <span class="px-2 py-0.5 rounded text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">+${r.overrun}m</span>
                            </td>
                            <td class="px-6 py-3.5 text-slate-800 text-xs font-medium">
                                ${r.remarks}
                            </td>
                        </tr>
                    `).join('');
                }
            }

            if (document.getElementById('express-delay-records-count')) {
                document.getElementById('express-delay-records-count').innerText = `${delayedRecords.length} Reports Found`;
            }

            if (window.lucide) lucide.createIcons();
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
            let csv = "Date,Claim Stub,Plate No,Vehicle Model,Service Advisor,Category,Arrival,Departure,Duration (mins),Overrun (mins),Diagnosis & Evaluation Remarks\n";
            rows.forEach(tr => {
                const cols = Array.from(tr.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""').trim()}"`);
                if (cols.length >= 10) {
                    csv += cols.join(',') + "\n";
                }
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `HonTech_SA_Delay_Reports_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showSystemToast('SA Delay Reports CSV downloaded.', 'success', 'Export Complete');
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
            if (document.getElementById('analytics-express-sla-rate-badge')) document.getElementById('analytics-express-sla-rate-badge').innerText = `${expressSuccessRate}% On-Time`;
            if (document.getElementById('analytics-express-unsuccessful-count-badge')) document.getElementById('analytics-express-unsuccessful-count-badge').innerText = `${failedExpress} Unsuccessful`;

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
                reportTitle = 'HONTECH AUTOCENTER INC. - DAILY INTAKE & OPERATIONS SUMMARY';
                tableHeaders = ['Claim Stub', 'Plate No.', 'Customer Name', 'Contact Number', 'Vehicle Model', 'Service Category', 'Intake Source', 'Assigned SA', 'Bay Location', 'Arrival Time', 'Promised / Departure', 'Status', 'Diagnosis & Remarks'];
                const todayJobs = (typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs.filter(j => j.dateReceived === todayStr) : [];
                const dataset = todayJobs.length > 0 ? todayJobs : ((typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs : []);
                tableRows = dataset.map(job => [
                    job.claimStub || 'N/A',
                    job.plate || '',
                    job.customerName || job.name || 'Walk-in Client',
                    job.contactNumber || job.phone || job.contact || 'N/A',
                    job.vehicle || '',
                    job.category || '',
                    job.source || 'Walk-in',
                    job.saName || '-',
                    job.location || 'Bay 1',
                    typeof formatTime12Hour === 'function' ? formatTime12Hour(job.arrival || '') : (job.arrival || ''),
                    job.promisedDate || (typeof formatTime12Hour === 'function' ? formatTime12Hour(job.departure || '') : (job.departure || 'TBD')),
                    job.status || '',
                    job.concern || job.remarks || 'Standard Intake'
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
                head: [['Claim Stub', 'Plate No.', 'Vehicle Model', 'Category', 'Advisor & Bay', 'Arrival / Promised', 'Status', 'Diagnosis & Remarks']],
                body: activeJobs.map(job => [
                    job.claimStub || 'N/A',
                    job.plate || '',
                    job.vehicle || '',
                    job.category || 'PMS',
                    `${job.saName || 'SA'}\n(${job.location || 'Bay 1'})`,
                    `${formatTime12Hour(job.arrival)}\n${job.promisedDate ? 'Due: ' + job.promisedDate : formatTime12Hour(job.departure)}`,
                    job.status || '',
                    job.concern || job.remarks || 'Standard Service'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
                styles: { fontSize: 8, cellPadding: 2.5 },
                columnStyles: {
                    0: { cellWidth: 20 },
                    1: { cellWidth: 18, fontStyle: 'bold' },
                    2: { cellWidth: 28 },
                    3: { cellWidth: 20 },
                    4: { cellWidth: 26 },
                    5: { cellWidth: 24 },
                    6: { cellWidth: 18 },
                    7: { cellWidth: 36 }
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
                                <th>Arrival (24H)</th>
                                <th>Departure (24H)</th>
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
                                    <td>${convertTimeTo24Hour(job.arrival) || job.arrival || '--:--'}</td>
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
        let tvVoiceEnabled = localStorage.getItem('hontech_tv_voice_enabled') !== 'false';
        let previousReadyJobKeys = new Set();
        let previousMonitoringJobKeys = new Set();
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

        function toggleTVVoice() {
            tvVoiceEnabled = !tvVoiceEnabled;
            localStorage.setItem('hontech_tv_voice_enabled', tvVoiceEnabled ? 'true' : 'false');
            
            // Update TV Header badge if present
            const icon = document.getElementById('tv-voice-icon');
            const text = document.getElementById('tv-voice-text');
            if (icon) {
                icon.className = tvVoiceEnabled ? 'w-4 h-4 text-emerald-400' : 'w-4 h-4 text-gray-500';
            }
            if (text) {
                text.className = tvVoiceEnabled ? 'text-[10px] font-black uppercase tracking-wider text-emerald-400 block leading-none' : 'text-[10px] font-black uppercase tracking-wider text-gray-400 block leading-none';
                text.innerText = tvVoiceEnabled ? 'Voice ON' : 'Voice OFF';
            }

            // Update TV Developer Toolbox button & status dot if present
            const devToggleBtn = document.getElementById('tv-dev-toggle-voice-btn');
            const devStatusDot = document.getElementById('tv-dev-voice-status-dot');
            if (devToggleBtn) {
                devToggleBtn.className = tvVoiceEnabled ? 'px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5' : 'px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-750 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5';
                devToggleBtn.innerHTML = tvVoiceEnabled ? '<i data-lucide="mic" class="w-3.5 h-3.5"></i> Voice: ON' : '<i data-lucide="mic-off" class="w-3.5 h-3.5"></i> Voice: MUTED';
            }
            if (devStatusDot) {
                devStatusDot.className = tvVoiceEnabled ? 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse' : 'w-2 h-2 rounded-full bg-gray-500';
            }

            // Update Settings button if present
            const settingsBtn = document.getElementById('settings-btn-tv-voice');
            if (settingsBtn) {
                settingsBtn.className = tvVoiceEnabled ? 'px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer' : 'px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer';
                settingsBtn.innerHTML = tvVoiceEnabled ? '<i data-lucide="mic" class="w-3.5 h-3.5 text-emerald-600"></i> Voice: Enabled' : '<i data-lucide="mic-off" class="w-3.5 h-3.5 text-gray-500"></i> Voice: Muted';
            }

            if (tvVoiceEnabled) {
                showSystemToast('Automated TV Voice Announcements Enabled', 'success', 'Voice Engine');
                speakTVAnnouncement('Automated voice announcement system is now active.');
            } else {
                showSystemToast('Automated TV Voice Announcements Muted', 'info', 'Voice Engine');
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            }
            lucide.createIcons();
        }
        window.toggleTVVoice = toggleTVVoice;

        window.toggleTVDevToolbox = toggleDevToolbox;

        function simulateVehicleMonitoringEvent() {
            const sampleJob = {
                plate: 'NDO 8492',
                customer: 'Sophia Loren',
                location: 'Service Bay 1',
                claimStub: 'CS-104'
            };
            showSystemToast('Simulating: Vehicle Sent to Bay 1', 'info', 'TV Dev Simulator');
            announceVehicleMonitoring(sampleJob, 'Service Bay 1');
        }
        window.simulateVehicleMonitoringEvent = simulateVehicleMonitoringEvent;

        function simulateVehicleReadyEvent() {
            const sampleJob = {
                plate: 'NDO 8492',
                customer: 'Sophia Loren',
                location: 'Claim Lounge',
                claimStub: 'CS-104'
            };
            showSystemToast('Simulating: Vehicle Ready for Release', 'success', 'TV Dev Simulator');
            announceVehicleReady(sampleJob);
        }
        window.simulateVehicleReadyEvent = simulateVehicleReadyEvent;

        function dispatchCustomTVSimulation() {
            const plateInput = document.getElementById('tv-dev-sim-plate');
            const customerInput = document.getElementById('tv-dev-sim-customer');
            const statusSelect = document.getElementById('tv-dev-sim-status');

            const plate = (plateInput && plateInput.value.trim()) || 'NDO 8492';
            const customer = (customerInput && customerInput.value.trim()) || 'Valued Customer';
            const statusType = (statusSelect && statusSelect.value) || 'Monitoring';

            const customJob = {
                plate: plate,
                customer: customer,
                location: statusType === 'Monitoring' ? 'Service Bay 1' : 'Service Counter',
                claimStub: 'CS-' + Math.floor(100 + Math.random() * 900)
            };

            if (statusType === 'Ready') {
                showSystemToast(`Broadcasting Custom Ready Announcement for ${plate}...`, 'success', 'TV Voice Broadcast');
                announceVehicleReady(customJob);
            } else {
                showSystemToast(`Broadcasting Custom Monitoring Announcement for ${plate}...`, 'info', 'TV Voice Broadcast');
                announceVehicleMonitoring(customJob, 'Service Bay 1');
            }
        }
        window.dispatchCustomTVSimulation = dispatchCustomTVSimulation;

        function formatPlateForSpeech(rawPlate) {
            if (!rawPlate) return 'vehicle';
            const clean = String(rawPlate).replace(/[^a-zA-Z0-9]/g, ' ').trim();
            // Spell out characters clearly with spaces
            return clean.split('').join(' ');
        }
        window.formatPlateForSpeech = formatPlateForSpeech;

        function speakTVAnnouncement(text, options = {}) {
            if (!tvVoiceEnabled) return;
            if (!('speechSynthesis' in window)) {
                console.warn('Speech synthesis not supported in this browser.');
                return;
            }

            try {
                // Cancel pending speech to prevent overlapping queue build-up
                window.speechSynthesis.cancel();

                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = options.rate || 0.90; // Natural, clear broadcast pacing
                utterance.pitch = options.pitch || 1.0;
                utterance.volume = options.volume !== undefined ? options.volume : 1.0;

                // Pick clean natural-sounding voice if available
                const voices = window.speechSynthesis.getVoices();
                if (voices && voices.length > 0) {
                    const bestVoice = voices.find(v => 
                        (v.lang.startsWith('en') || v.lang.startsWith('fil') || v.lang.startsWith('tl')) && 
                        (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Jenny') || v.name.includes('Zira') || v.name.includes('David') || v.name.includes('English'))
                    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

                    if (bestVoice) utterance.voice = bestVoice;
                }

                // Play pre-announcement chime first, then broadcast speech
                playAutomotiveChime();
                setTimeout(() => {
                    window.speechSynthesis.speak(utterance);
                }, 400);
            } catch (err) {
                console.warn('TV voice announcement error:', err);
            }
        }
        window.speakTVAnnouncement = speakTVAnnouncement;

        function announceVehicleMonitoring(job, locationName) {
            if (!job) return;
            const plateSpoken = formatPlateForSpeech(job.plate);
            const customer = job.customer || job.name || 'valued customer';
            const loc = locationName || job.location || 'the workshop bay';
            
            const message = `Attention please. Vehicle ${plateSpoken}, customer ${customer}, is now being monitored in ${loc}.`;
            speakTVAnnouncement(message);
            triggerTVSlideAlertBanner(`${job.plate || 'Vehicle'} — In ${loc}`);
        }
        window.announceVehicleMonitoring = announceVehicleMonitoring;

        function announceVehicleReady(job) {
            if (!job) return;
            const plateSpoken = formatPlateForSpeech(job.plate);
            const customer = job.customer || job.name || 'valued customer';
            const stubText = job.claimStub ? `Claim stub ${job.claimStub}.` : '';

            const message = `Attention please. Vehicle ${plateSpoken}, customer ${customer}, is now ready for release. ${stubText} Please proceed to the service counter.`;
            speakTVAnnouncement(message);
            triggerTVSlideAlertBanner(`${job.plate || 'Vehicle'} — Ready to Claim!`);
        }
        window.announceVehicleReady = announceVehicleReady;

        function testTVVoiceAnnouncement() {
            const sampleJob = {
                plate: 'NDO 8492',
                customer: 'Sophia Loren',
                location: 'Service Bay 1',
                claimStub: 'CS-104'
            };
            showSystemToast('Broadcasting live TV voice announcement sample...', 'info', 'TV Voice System');
            announceVehicleMonitoring(sampleJob, 'Service Bay 1');
        }
        window.testTVVoiceAnnouncement = testTVVoiceAnnouncement;

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

        function triggerTVSlideAlertBanner(textOrPlate = 'Vehicle') {
            const banner = document.getElementById('tv-ready-alert-banner');
            const text = document.getElementById('tv-ready-alert-text');
            if (!banner) return;

            let msg = String(textOrPlate || 'Vehicle');
            if (!msg.includes('Ready') && !msg.includes('—') && !msg.includes('Vehicle')) {
                msg = `Vehicle Ready: ${msg} — Ready to Claim!`;
            } else if (!msg.startsWith('Vehicle')) {
                msg = `Vehicle: ${msg}`;
            }

            // Remove bell emoji 🔔 to keep typography bold, clean, and crisp
            msg = msg.replace(/🔔\s*/g, '').trim();

            if (text) text.innerText = msg;
            banner.classList.remove('hidden');

            if (tvAlertBannerTimeout) clearTimeout(tvAlertBannerTimeout);
            tvAlertBannerTimeout = setTimeout(() => {
                banner.classList.add('hidden');
            }, 7000);
            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
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

            // Detect newly ready vehicles to trigger Audio Chime, Voice Announcement & Visual TV Banner
            const currentReadyKeys = new Set(releasedAll.map(j => String(j.id || j.claimStub || j.plate)));
            if (previousReadyJobKeys.size > 0) {
                releasedAll.forEach(job => {
                    const key = String(job.id || job.claimStub || job.plate);
                    if (!previousReadyJobKeys.has(key)) {
                        announceVehicleReady(job);
                    }
                });
            }
            previousReadyJobKeys = currentReadyKeys;

            // Detect newly monitoring vehicles to trigger Speech Announcement
            const currentMonitoringKeys = new Set(waitingJobs.filter(j => j.status === 'Monitoring').map(j => String(j.id || j.claimStub || j.plate)));
            if (previousMonitoringJobKeys.size > 0) {
                waitingJobs.filter(j => j.status === 'Monitoring').forEach(job => {
                    const key = String(job.id || job.claimStub || job.plate);
                    if (!previousMonitoringJobKeys.has(key)) {
                        announceVehicleMonitoring(job, job.location || 'Monitoring Area');
                    }
                });
            }
            previousMonitoringJobKeys = currentMonitoringKeys;

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

        function getFacilityMaxBayLimit() {
            const stored = parseInt(localStorage.getItem('hontech_max_bay_limit'), 10);
            if (!isNaN(stored) && stored >= 1 && stored <= 50) {
                return stored;
            }
            return 20; // Default facility maximum ceiling
        }
        window.getFacilityMaxBayLimit = getFacilityMaxBayLimit;

        function setFacilityMaxBayLimit(val) {
            if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
                showSystemToast('Only Owner and Administrator can configure facility maximum capacity ceiling.', 'warning', 'Higher Authority Required');
                return;
            }
            const maxVal = Math.min(50, Math.max(1, parseInt(val, 10) || 20));
            localStorage.setItem('hontech_max_bay_limit', maxVal.toString());
            
            // If current active bays exceed new max limit, clamp it down
            const currentActive = getWorkshopBayCount();
            if (currentActive > maxVal) {
                localStorage.setItem('hontech_workshop_bay_count', maxVal.toString());
            }

            initWorkshopBaySettings();
            if (typeof renderWorkshopBaysModule === 'function') renderWorkshopBaysModule();
            if (typeof renderStaffTables === 'function') renderStaffTables();
            if (typeof renderTV === 'function') renderTV();
            showSystemToast(`Facility capacity ceiling set to ${maxVal} bays for Service Advisor operations.`, 'success', 'Ceiling Configured');
        }
        window.setFacilityMaxBayLimit = setFacilityMaxBayLimit;

        function promptCustomCeilingLimit() {
            if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
                showSystemToast('Only Owner and Administrator can configure facility maximum capacity ceiling.', 'warning', 'Higher Authority Required');
                return;
            }
            const current = getFacilityMaxBayLimit();
            const input = prompt(`Enter Facility Max Bay Ceiling for Service Advisors (1-50 bays):`, current.toString());
            if (input !== null) {
                const parsed = parseInt(input.trim(), 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
                    setFacilityMaxBayLimit(parsed);
                } else {
                    showSystemToast('Please enter a valid bay ceiling number between 1 and 50.', 'error', 'Invalid Input');
                }
            }
        }
        window.promptCustomCeilingLimit = promptCustomCeilingLimit;

        function getWorkshopBayCount() {
            const maxLimit = getFacilityMaxBayLimit();
            const stored = parseInt(localStorage.getItem('hontech_workshop_bay_count'), 10);
            if (!isNaN(stored) && stored >= 1) {
                return Math.min(maxLimit, stored);
            }
            return Math.min(maxLimit, Math.min(4, maxLimit)); // Default up to 4 service bays
        }
        window.getWorkshopBayCount = getWorkshopBayCount;

        function stepWorkshopBayCount(delta) {
            if (currentUserRole === 'owner') {
                showSystemToast('Owner has view-only access to workshop floor bays.', 'info', 'Read Only');
                return;
            }
            const current = getWorkshopBayCount();
            const maxLimit = getFacilityMaxBayLimit();
            const next = Math.min(maxLimit, Math.max(1, current + Number(delta || 0)));
            if (next === current && delta > 0 && current >= maxLimit) {
                showSystemToast(`Cannot exceed facility maximum of ${maxLimit} bays configured by Owner/Admin.`, 'warning', 'Limit Reached');
                return;
            }
            handleWorkshopBayCountChange(next);
        }
        window.stepWorkshopBayCount = stepWorkshopBayCount;

        let tempCustomModalBayCount = 4;

        function openCustomBayCapacityModal() {
            if (currentUserRole === 'owner') {
                showSystemToast('Owner has view-only access to workshop floor bays.', 'info', 'Read Only');
                return;
            }
            const maxLimit = getFacilityMaxBayLimit();
            tempCustomModalBayCount = getWorkshopBayCount();
            const valEl = document.getElementById('modal-bay-stepper-value');
            if (valEl) valEl.innerText = tempCustomModalBayCount.toString();

            const modal = document.getElementById('modal-custom-bay-capacity');
            if (modal) modal.classList.remove('hidden');
            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
        }
        window.openCustomBayCapacityModal = openCustomBayCapacityModal;
        window.promptCustomBayCount = openCustomBayCapacityModal; // backward compatible alias

        function closeCustomBayCapacityModal() {
            const modal = document.getElementById('modal-custom-bay-capacity');
            if (modal) modal.classList.add('hidden');
        }
        window.closeCustomBayCapacityModal = closeCustomBayCapacityModal;

        function adjustCustomModalBayCount(delta) {
            const maxLimit = getFacilityMaxBayLimit();
            tempCustomModalBayCount = Math.min(maxLimit, Math.max(1, tempCustomModalBayCount + Number(delta || 0)));
            const valEl = document.getElementById('modal-bay-stepper-value');
            if (valEl) valEl.innerText = tempCustomModalBayCount.toString();
        }
        window.adjustCustomModalBayCount = adjustCustomModalBayCount;

        function setCustomModalBayCount(count) {
            const maxLimit = getFacilityMaxBayLimit();
            tempCustomModalBayCount = Math.min(maxLimit, Math.max(1, parseInt(count, 10) || 1));
            const valEl = document.getElementById('modal-bay-stepper-value');
            if (valEl) valEl.innerText = tempCustomModalBayCount.toString();
        }
        window.setCustomModalBayCount = setCustomModalBayCount;

        function applyCustomModalBayCount() {
            closeCustomBayCapacityModal();
            handleWorkshopBayCountChange(tempCustomModalBayCount);
        }
        window.applyCustomModalBayCount = applyCustomModalBayCount;

        function handleWorkshopBayCountChange(newCount) {
            if (currentUserRole === 'owner') {
                showSystemToast('Owner has view-only access to workshop floor bays.', 'info', 'Read Only');
                return;
            }
            const maxLimit = getFacilityMaxBayLimit();
            const requested = parseInt(newCount, 10) || 1;
            if (requested > maxLimit) {
                showSystemToast(`Cannot exceed facility maximum of ${maxLimit} bays configured by Owner/Admin.`, 'warning', 'Limit Reached');
            }
            const num = Math.min(maxLimit, Math.max(1, requested));
            localStorage.setItem('hontech_workshop_bay_count', num.toString());
            
            initWorkshopBaySettings();
            
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

            if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();

            showSystemToast(`Floor active capacity scaled to ${num} service bays (Facility Ceiling: ${maxLimit}).`, 'success', 'Bays Scaled');
        }
        window.handleWorkshopBayCountChange = handleWorkshopBayCountChange;

        function initWorkshopBaySettings() {
            const maxLimit = getFacilityMaxBayLimit();
            const bayCount = getWorkshopBayCount();

            const settingMaxSelect = document.getElementById('settings-facility-max-bays');
            if (settingMaxSelect) {
                if (!settingMaxSelect.querySelector(`option[value="${maxLimit}"]`)) {
                    const opt = document.createElement('option');
                    opt.value = maxLimit.toString();
                    opt.innerText = `${maxLimit} Bays (Custom Ceiling)`;
                    settingMaxSelect.appendChild(opt);
                }
                settingMaxSelect.value = maxLimit.toString();
            }

            const badge1 = document.getElementById('settings-bay-count-badge');
            if (badge1) badge1.innerText = `${maxLimit} Bays Max Ceiling`;

            const select2 = document.getElementById('bays-module-select');
            if (select2) {
                let optionsHtml = '';
                for (let i = 1; i <= maxLimit; i++) {
                    const label = (i === 1) ? '1 Bay (Solo Pod)' : (i === 4 ? '4 Bays (Standard)' : `${i} Bays`);
                    optionsHtml += `<option value="${i}" ${i === bayCount ? 'selected' : ''}>${label}</option>`;
                }
                select2.innerHTML = optionsHtml;
            }
            const badge2 = document.getElementById('bays-module-count-badge');
            if (badge2) badge2.innerText = `${bayCount} / ${maxLimit} Bays Active`;
        }
        window.initWorkshopBaySettings = initWorkshopBaySettings;

        window.jumpToJobRecord = function(plate) {
            showSection('queue');
            if (typeof updateIntakeFilter === 'function') {
                updateIntakeFilter('search', plate || '');
                const searchInput = document.getElementById('intake-search-input');
                if (searchInput) {
                    searchInput.value = plate || '';
                }
            }
        };

        window.unassignBay = async function(jobId, bayName) {
            try {
                await updateJobField(jobId, 'location', 'None');
                showSystemToast(`Vehicle unassigned from ${bayName} and returned to Waiting Area.`, 'info', 'Bay Freed');
                if (typeof renderWorkshopBaysModule === 'function') renderWorkshopBaysModule();
                if (typeof renderStaffTables === 'function') renderStaffTables();
                if (typeof renderTV === 'function') renderTV();
            } catch (err) {
                showSystemToast(err.message || 'Error unassigning bay.', 'error');
            }
        };

        function renderWorkshopBaysModule() {
            const baySection = document.getElementById('section-bays');
            if (baySection && baySection.classList.contains('hidden')) return;

            const bayCount = getWorkshopBayCount();
            
            // Sync capacity selectors and badges
            const moduleSelect = document.getElementById('bays-module-select');
            if (moduleSelect) moduleSelect.value = bayCount.toString();
            const moduleBadge = document.getElementById('bays-module-count-badge');
            if (moduleBadge) moduleBadge.innerText = `${bayCount} Bays Active`;

            // Calculate occupied bays by unique active bay numbers (capped at bayCount)
            const occupiedBaySet = new Set();
            for (let i = 1; i <= bayCount; i++) {
                const padBay = String(i).padStart(2, '0');
                const hasJob = (allJobs || []).some(j => {
                    if (j.status === 'Completed' || j.status === 'Released' || j.status === 'Pending') return false;
                    if (!j.location || j.location === 'None' || j.location === 'Waiting Area') return false;
                    if (Number(j.bayAssigned) === i || Number(j.bay_assigned) === i) return true;
                    const cleanLoc = String(j.location).toLowerCase().replace(/[^a-z0-9]/g, '');
                    return cleanLoc === `bay${i}` || cleanLoc === `lift${i}` || cleanLoc === `bay0${i}` || cleanLoc === `lift0${i}` || cleanLoc === `bay${padBay}`;
                });
                if (hasJob) occupiedBaySet.add(i);
            }

            const occupiedCount = occupiedBaySet.size;
            const freeCount = Math.max(0, bayCount - occupiedCount);
            const utilizationRate = Math.min(100, Math.round((occupiedCount / bayCount) * 100));

            if (document.getElementById('bays-stat-total')) document.getElementById('bays-stat-total').innerText = bayCount;
            if (document.getElementById('bays-stat-occupied')) document.getElementById('bays-stat-occupied').innerText = occupiedCount;
            if (document.getElementById('bays-stat-free')) document.getElementById('bays-stat-free').innerText = freeCount;
            if (document.getElementById('bays-stat-utilization')) document.getElementById('bays-stat-utilization').innerText = `${utilizationRate}%`;

            // Render Floor Grid
            const gridEl = document.getElementById('bays-floor-grid');
            if (gridEl) {
                let gridHtml = '';
                const isOwner = (currentUserRole === 'owner');

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
                        const custName = (job.customer && job.customer !== 'CUSTOMER' && job.customer !== 'Customer') ? job.customer : (job.client || 'Front Desk Customer');
                        const category = job.category || 'General Service';
                        const lane = job.laneType || job.lane || 'Standard Lane';
                        const advisor = job.advisor || job.handled_by || job.sa || 'Front Desk SA';
                        const status = job.status || 'Monitoring';

                        let statusBadgeHtml = '';
                        let dotColor = 'bg-slate-900';
                        if (status === 'Monitoring') {
                            dotColor = 'bg-blue-600';
                            statusBadgeHtml = `<span class="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> MONITORING</span>`;
                        } else if (status === 'In Progress') {
                            dotColor = 'bg-indigo-600';
                            statusBadgeHtml = `<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span> IN PROGRESS</span>`;
                        } else if (status === 'Ready to Release' || status === 'Ready') {
                            dotColor = 'bg-emerald-600';
                            statusBadgeHtml = `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> READY TO RELEASE</span>`;
                        } else if (status === 'Carry Over') {
                            dotColor = 'bg-amber-600';
                            statusBadgeHtml = `<span class="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> CARRY OVER</span>`;
                        } else {
                            statusBadgeHtml = `<span class="bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">${status.toUpperCase()}</span>`;
                        }

                        gridHtml += `
                            <div class="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-sm flex flex-col justify-between gap-3.5 transition">
                                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="w-2.5 h-2.5 rounded-full ${dotColor} animate-pulse"></span>
                                        <span class="font-black text-xs uppercase tracking-wider text-slate-900">BAY-${padBay}</span>
                                    </div>
                                    ${statusBadgeHtml}
                                </div>

                                <div class="space-y-1.5">
                                    <span class="font-mono font-black text-lg text-white bg-slate-900 px-2.5 py-0.5 rounded-md inline-block shadow-2xs">${job.plate || 'NO-PLATE'}</span>
                                    <div class="text-xs font-bold text-slate-800 truncate">${job.vehicle || 'Vehicle'}</div>
                                    <div class="text-[11px] text-slate-500 font-medium truncate">${custName}</div>
                                </div>

                                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[10.5px]">
                                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-150">
                                        <span class="text-slate-400 uppercase text-[9px] font-bold block">Category</span>
                                        <span class="text-slate-800 font-bold truncate block">${category}</span>
                                    </div>
                                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-150">
                                        <span class="text-slate-400 uppercase text-[9px] font-bold block">Lane</span>
                                        <span class="text-slate-800 font-bold truncate block">${lane}</span>
                                    </div>
                                    <div class="col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                                        <span class="text-slate-400 uppercase text-[9px] font-bold">Advisor</span>
                                        <span class="text-slate-800 font-bold truncate text-[11px]">${advisor}</span>
                                    </div>
                                </div>

                                <div class="pt-2 border-t border-slate-100 flex items-center gap-2">
                                    <button onclick="jumpToJobRecord('${job.plate || ''}')" class="flex-1 py-2 px-3 bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5">
                                        <i data-lucide="file-text" class="w-3.5 h-3.5 text-slate-300"></i> View Record
                                    </button>
                                    ${!isOwner ? `
                                        <button onclick="unassignBay('${job.id}', 'BAY-${padBay}')" class="py-2 px-3 bg-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-slate-700 font-bold text-xs uppercase tracking-wider rounded-xl transition border border-slate-200 cursor-pointer" title="Unassign Bay">
                                            Unassign
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                        `;
                    } else {
                        gridHtml += `
                            <div class="bg-slate-50/70 border border-dashed border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 min-h-[220px]">
                                <div class="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                    <div class="flex items-center gap-2">
                                        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                        <span class="font-black text-xs uppercase tracking-wider text-slate-700">BAY-${padBay}</span>
                                    </div>
                                    <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">AVAILABLE</span>
                                </div>

                                <div class="text-center py-4 space-y-1 my-auto">
                                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                                        <i data-lucide="warehouse" class="w-5 h-5"></i>
                                    </div>
                                    <p class="text-xs font-bold text-slate-700">Bay Ready</p>
                                    <p class="text-[10px] text-slate-400 font-medium">Available for allocation</p>
                                </div>

                                <div class="pt-2 border-t border-slate-200/60">
                                    ${isOwner ? `
                                        <div class="w-full py-2 px-3 bg-white border border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5">
                                            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400"></i> Bay Ready
                                        </div>
                                    ` : `
                                        <button onclick="openBayAllocationModal(${i})" class="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 font-bold text-xs uppercase tracking-wider rounded-xl transition shadow-2xs cursor-pointer flex items-center justify-center gap-1.5">
                                            <i data-lucide="plus" class="w-3.5 h-3.5 text-slate-500"></i> Assign From Queue
                                        </button>
                                    `}
                                </div>
                            </div>
                        `;
                    }
                }
                gridEl.innerHTML = gridHtml;
                if (window.lucide) window.lucide.createIcons();
            }
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
                    const curStatus = job.status || 'Waiting';
                    return `
                        <div class="bg-white border-2 border-gray-200 hover:border-gray-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-xs">
                            <div class="flex-1 min-w-0 space-y-1.5 text-left">
                                <div class="flex flex-wrap items-center gap-2">
                                    <span class="text-xl font-black uppercase italic tracking-wide text-gray-950 font-mono">${job.plate}</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300 whitespace-nowrap">${job.laneType || 'Flexible Lane'}</span>
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 whitespace-nowrap">${job.category || 'PMS'}</span>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">Status: ${curStatus} ➔ Promotes to Monitoring</span>
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
                const job = (allJobs || []).find(j => j.id === jobId);
                if (job && (job.status === 'Waiting' || !job.status)) {
                    await setJobStatus(jobId, 'Monitoring');
                }
                await updateJobField(jobId, 'location', targetBay);
                showSystemToast(`${plate} set to Monitoring and dispatched to ${targetBay}!`, 'success', 'Bay Allocated');
                if (typeof renderWorkshopBaysModule === 'function') renderWorkshopBaysModule();
                if (typeof renderStaffTables === 'function') renderStaffTables();
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

                // Fetch and cache Express Lane Delay Incident Reports
                try {
                    const issues = await apiRequest('/api/express-issues');
                    window.reportedExpressIssues = {};
                    if (Array.isArray(issues)) {
                        issues.forEach(iss => {
                            if (iss.job_id) window.reportedExpressIssues[iss.job_id] = iss;
                            if (iss.plate) window.reportedExpressIssues[iss.plate] = iss;
                        });
                    }
                } catch (issErr) {
                    console.warn('Express issues cache load error:', issErr);
                }

                if (isOwnerOrAdmin) {
                    staffAccounts = await apiRequest('/api/auth/staff');
                    populatePeriodicSaFilter();
                }

                if (typeof renderExpressIntelligenceModule === 'function') {
                    renderExpressIntelligenceModule();
                }

                if (typeof renderBackJobIntelligenceModule === 'function') {
                    renderBackJobIntelligenceModule();
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

        let currentLookupFilterTab = 'all';
        function setLookupFilterTab(tab) {
            currentLookupFilterTab = tab;
            const pills = ['all', 'regulars', 'backjobs', 'duepms'];
            pills.forEach(p => {
                const el = document.getElementById(`lookup-pill-${p}`);
                if (el) {
                    if (p === tab) {
                        el.className = "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-2xs transition cursor-pointer flex items-center gap-1.5";
                    } else {
                        el.className = "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer flex items-center gap-1.5";
                    }
                }
            });
            filterCustomerLookup();
        }
        window.setLookupFilterTab = setLookupFilterTab;

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

                // Smart Tab Filter
                if (currentLookupFilterTab === 'regulars') {
                    if (cust.jobs.length < 2) return false;
                } else if (currentLookupFilterTab === 'backjobs') {
                    const hasBackJob = cust.jobs.some(j => {
                        const cat = (j.category || '').toLowerCase();
                        const remarks = (j.remarks || '').toLowerCase();
                        const evalNotes = (j.evaluation || '').toLowerCase();
                        return cat.includes('back-job') || cat.includes('backjob') || cat.includes('warranty') || 
                               remarks.includes('back-job') || evalNotes.includes('back-job');
                    });
                    if (!hasBackJob) return false;
                } else if (currentLookupFilterTab === 'duepms') {
                    const latestJob = cust.jobs[0];
                    if (!latestJob) return false;
                    const d = new Date(latestJob.date || latestJob.created_at);
                    if (isNaN(d.getTime())) return false;
                    const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
                    if (diffDays < 30) return false; // Due for PMS if >30 days since last service
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
                    <div class="text-center py-12 px-4 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-2">
                        <div class="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                            <i data-lucide="user-x" class="w-6 h-6"></i>
                        </div>
                        <h5 class="text-xs font-black uppercase tracking-wider text-gray-800">No matching customer records</h5>
                        <p class="text-[11px] text-gray-500 font-medium max-w-xs mx-auto">Try adjusting your search terms or filter tabs. First-time visitors can be registered immediately.</p>
                        <button onclick="showSection('intake')" class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm cursor-pointer">
                            <i data-lucide="user-plus" class="w-3.5 h-3.5 text-red-400"></i> New Customer Intake
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
                const hasBackJob = cust.jobs.some(j => (j.category || '').toLowerCase().includes('back-job') || (j.category || '').toLowerCase().includes('warranty'));
                const isRegular = cust.jobs.length >= 2;

                const initials = (cust.name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                html += `
                    <div onclick="selectCustomerForLookup('${encodeURIComponent(cust.key)}')" 
                        data-cust-key="${encodeURIComponent(cust.key)}"
                        class="lookup-item-card p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2 relative group ${isSelected ? 'bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-2xs' : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'}">
                        
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-center gap-2.5 min-w-0">
                                <div class="lookup-avatar w-9 h-9 rounded-lg ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'} flex items-center justify-center font-black text-xs shrink-0 transition">
                                    ${initials}
                                </div>
                                <div class="min-w-0">
                                    <h4 class="text-xs font-black text-slate-900 truncate flex items-center gap-1">
                                        ${cust.name}
                                        ${isRegular ? '<span class="text-[10px] text-slate-400 font-bold" title="Regular Customer">• 2+</span>' : ''}
                                    </h4>
                                    <p class="text-[10.5px] text-slate-500 font-medium truncate">${cust.vehicle}</p>
                                </div>
                            </div>
                            <span class="lookup-plate font-mono font-bold text-[10px] px-2 py-0.5 rounded ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'} shrink-0">
                                ${cust.plate !== 'NO-PLATE' ? cust.plate : 'NO-PLATE'}
                            </span>
                        </div>

                        <div class="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                            <span class="flex items-center gap-1 text-slate-600 truncate max-w-[170px]">
                                <i data-lucide="wrench" class="w-3 h-3 text-slate-400 shrink-0"></i> ${lastCategory}
                            </span>
                            <div class="flex items-center gap-1.5 shrink-0">
                                ${hasBackJob ? '<span class="text-[9px] font-bold uppercase text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">Back-Job</span>' : ''}
                                <span class="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600 text-[9.5px]">
                                    ${cust.jobs.length} ${cust.jobs.length === 1 ? 'Visit' : 'Visits'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
            });

            listEl.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();

            // Keep selected customer synchronized
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
            currentLookupFilterTab = 'all';
            const pills = ['all', 'regulars', 'backjobs', 'duepms'];
            pills.forEach(p => {
                const el = document.getElementById(`lookup-pill-${p}`);
                if (el) {
                    el.className = p === 'all' 
                        ? "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 text-white shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                        : "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 hover:bg-gray-200 transition cursor-pointer flex items-center gap-1.5";
                }
            });
            filterCustomerLookup();
        }

        function selectCustomerForLookup(rawCustomerKey, reFilterList = true) {
            if (!rawCustomerKey) return;
            const decodedKey = decodeURIComponent(rawCustomerKey);
            selectedLookupCustomerKey = decodedKey;
            const cust = customerLookupRegistry[decodedKey] || customerLookupRegistry[rawCustomerKey];

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
            const rawLastDate = latestJob.date || latestJob.created_at;

            // Generate Initials Avatar
            const initials = (cust.name || 'Customer').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'CU';
            if (document.getElementById('dossier-avatar-initials')) {
                document.getElementById('dossier-avatar-initials').innerText = initials;
            }

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
            if (document.getElementById('dossier-branch-text')) {
                document.getElementById('dossier-branch-text').innerText = cust.branch || 'Marikina Branch';
            }
            if (document.getElementById('dossier-loyalty-badge')) {
                const badge = document.getElementById('dossier-loyalty-badge');
                if (cust.jobs.length >= 2) {
                    badge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white shadow-xs flex items-center gap-1";
                    badge.innerHTML = `<i data-lucide="award" class="w-3 h-3 text-amber-400"></i> Regular (${cust.jobs.length} Visits)`;
                } else {
                    badge.className = "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1";
                    badge.innerHTML = `<i data-lucide="user" class="w-3 h-3 text-slate-500"></i> Initial Visit Record`;
                }
            }
            if (document.getElementById('dossier-total-visits')) {
                document.getElementById('dossier-total-visits').innerText = cust.jobs.length;
            }
            if (document.getElementById('dossier-last-date')) {
                document.getElementById('dossier-last-date').innerText = rawLastDate || 'Recent';
            }
            if (document.getElementById('dossier-last-category')) {
                document.getElementById('dossier-last-category').innerText = latestJob.category || 'General Service';
            }
            if (document.getElementById('dossier-history-count')) {
                document.getElementById('dossier-history-count').innerText = `${cust.jobs.length} Orders`;
            }

            // Calculate Days Ago for Last Release
            let daysAgoText = 'Recent';
            if (rawLastDate) {
                const lastD = new Date(rawLastDate);
                if (!isNaN(lastD.getTime())) {
                    const diff = Math.max(0, Math.floor((Date.now() - lastD.getTime()) / (1000 * 60 * 60 * 24)));
                    daysAgoText = diff === 0 ? 'Today' : `${diff}d ago`;
                }
            }
            if (document.getElementById('dossier-last-days-ago')) {
                const daEl = document.getElementById('dossier-last-days-ago');
                daEl.innerText = daysAgoText;
                daEl.className = "text-[9.5px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.2 rounded shrink-0";
            }

            // Calculate Next Predicted PMS Date (40-Day standard interval)
            let nextPmsText = 'Approx. 40 Days';
            if (rawLastDate) {
                const d = new Date(rawLastDate);
                if (!isNaN(d.getTime())) {
                    d.setDate(d.getDate() + 40);
                    nextPmsText = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
            }
            if (document.getElementById('dossier-next-pms-date')) {
                document.getElementById('dossier-next-pms-date').innerText = nextPmsText;
            }
            if (document.getElementById('dossier-pms-health')) {
                const pmsHealthEl = document.getElementById('dossier-pms-health');
                pmsHealthEl.className = "text-[9.5px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded shrink-0";
                pmsHealthEl.innerText = 'Good';
            }

            // Calculate Warranty / Return Standing
            const hasBackJob = cust.jobs.some(j => (j.category && j.category.toLowerCase().includes('back-job')) || (j.concern && j.concern.toLowerCase().includes('back-job')));
            if (document.getElementById('dossier-warranty-badge')) {
                const wBadge = document.getElementById('dossier-warranty-badge');
                if (hasBackJob) {
                    wBadge.className = "text-[9.5px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded shrink-0";
                    wBadge.innerText = 'Past Return';
                } else {
                    wBadge.className = "text-[9.5px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded shrink-0";
                    wBadge.innerText = '0 Returns';
                }
            }

            // Calculate Preferred Service Advisor
            const saCounts = {};
            cust.jobs.forEach(j => {
                const sa = j.handled_by || j.sa;
                if (sa && sa !== '-' && sa !== 'Front Desk SA') {
                    saCounts[sa] = (saCounts[sa] || 0) + 1;
                }
            });
            let preferredSA = 'Front Desk SA';
            let maxCount = 0;
            for (const [sa, count] of Object.entries(saCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    preferredSA = sa;
                }
            }
            if (document.getElementById('dossier-preferred-sa')) {
                document.getElementById('dossier-preferred-sa').innerText = preferredSA;
            }

            // Render Historical Orders Timeline with Clean Corporate Automotive Detail
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
                    const mechanic = job.mechanic || 'Assigned Technician';
                    const bay = job.bay_number || job.bay || (job.status === 'Pending' ? 'Staging Area' : 'Bay 1');
                    const concern = job.concern || job.evaluation || job.diagnosis || 'Standard periodic service maintenance';
                    const remarks = job.remarks || job.goal_remarks || 'Inspection completed according to workshop checklist.';

                    // Clean Status Badge
                    let statusBadgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
                    if (status.includes('COMPLETED') || status.includes('RELEASED')) {
                        statusBadgeClass = 'bg-slate-100 text-emerald-800 border-slate-200 font-bold';
                    } else if (status.includes('PROGRESS') || status.includes('BAY')) {
                        statusBadgeClass = 'bg-slate-900 text-white border-slate-900 font-bold';
                    } else if (status.includes('CANCEL')) {
                        statusBadgeClass = 'bg-slate-100 text-rose-700 border-slate-200 font-bold';
                    }

                    historyHTML += `
                        <div class="bg-white border border-slate-200 hover:border-slate-400 p-4 md:p-4.5 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3">
                            <!-- Top Row: Service Category & Date + Status & Action Buttons -->
                            <div class="flex items-center justify-between gap-3 flex-wrap">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="w-6 h-6 rounded-lg bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                                        #${cust.jobs.length - idx}
                                    </span>
                                    <span class="text-xs font-black text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">${category}</span>
                                    <span class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                                        <i data-lucide="clock" class="w-3 h-3 text-slate-300"></i> ${fullDateStr}
                                    </span>
                                </div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${statusBadgeClass}">
                                        ${status}
                                    </span>
                                    <!-- Print Claim Stub PDF Button with Red PDF Indicator -->
                                    <button type="button" onclick="printJobClaimStubPDF('${jobId}')" 
                                        class="group px-3 py-1.5 bg-white hover:bg-red-50 text-slate-700 hover:text-red-700 border border-slate-300 hover:border-red-300 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                                        title="Export & Print Official Customer Claim Stub (PDF)">
                                        <i data-lucide="printer" class="w-3.5 h-3.5 text-red-600 group-hover:scale-110 transition-transform"></i>
                                        <span>Stub</span>
                                        <span class="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded tracking-tighter">PDF</span>
                                    </button>
                                    <!-- Flag Back-Job Button with Distinct Down Arrow Action Indicator -->
                                    <button type="button" onclick="openBackJobReasonModal('${jobId}')" 
                                        class="group px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-400 rounded-xl text-xs font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
                                        title="Initiate Back-Job Return Intake and record customer complaints">
                                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-amber-600 group-hover:-rotate-45 transition-transform"></i>
                                        <span>Flag Back-Job</span>
                                        <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-700 group-hover:translate-y-0.5 transition-all"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Bottom Summary: Clean Key Details & Concern Box -->
                            <div class="text-xs text-slate-600 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 flex flex-col gap-2">
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 font-medium">
                                    <div class="flex items-center gap-1.5 truncate">
                                        <i data-lucide="hash" class="w-3 h-3 text-slate-400 shrink-0"></i>
                                        <span class="truncate"><strong class="text-slate-800 font-bold">Job:</strong> ${jobId}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 truncate">
                                        <i data-lucide="user" class="w-3 h-3 text-slate-400 shrink-0"></i>
                                        <span class="truncate"><strong class="text-slate-800 font-bold">Advisor:</strong> ${sa}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 truncate">
                                        <i data-lucide="layout-grid" class="w-3 h-3 text-slate-400 shrink-0"></i>
                                        <span class="truncate"><strong class="text-slate-800 font-bold">Bay:</strong> ${bay}</span>
                                    </div>
                                    <div class="flex items-center gap-1.5 truncate">
                                        <i data-lucide="wrench" class="w-3 h-3 text-slate-400 shrink-0"></i>
                                        <span class="truncate"><strong class="text-slate-800 font-bold">Tech:</strong> ${mechanic}</span>
                                    </div>
                                </div>
                                <div class="text-xs text-slate-800 pt-2 border-t border-slate-200/70 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-slate-150">
                                    <span class="font-bold text-slate-900 flex items-center gap-1.5 mb-0.5">
                                        <i data-lucide="alert-circle" class="w-3.5 h-3.5 text-slate-500"></i> Customer Concern / Diagnosis:
                                    </span>
                                    <p class="text-slate-700 font-normal pl-5">${concern}</p>
                                </div>
                            </div>
                        </div>
                    `;
                });
                timelineEl.innerHTML = historyHTML;
            }

            // Dynamically update card selection highlights on the left list without wiping their styling
            document.querySelectorAll('#lookup-results-list .lookup-item-card').forEach(card => {
                const cardKey = decodeURIComponent(card.getAttribute('data-cust-key') || '');
                const isCurrent = cardKey === decodedKey;
                if (isCurrent) {
                    card.className = "lookup-item-card p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2 relative group bg-slate-50 border-slate-900 ring-1 ring-slate-900 shadow-2xs";
                    const avatar = card.querySelector('.lookup-avatar');
                    if (avatar) avatar.className = "lookup-avatar w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 transition";
                    const plate = card.querySelector('.lookup-plate');
                    if (plate) plate.className = "lookup-plate font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-900 text-white shrink-0";
                } else {
                    card.className = "lookup-item-card p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2 relative group bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300";
                    const avatar = card.querySelector('.lookup-avatar');
                    if (avatar) avatar.className = "lookup-avatar w-9 h-9 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-black text-xs shrink-0 transition";
                    const plate = card.querySelector('.lookup-plate');
                    if (plate) plate.className = "lookup-plate font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0";
                }
            });

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
                concernEl.value = `[BACK-JOB / RETURN REPAIR] Previous Ref: ${refJobId} (${prevCategory} on ${prevDate}). Customer concern/issue: `;
            }

            showSystemToast(`Back-Job initialized referencing order ${refJobId}!`, 'success', 'Back-Job Created');
        }

        function copyCustomerPhone() {
            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) return;
            const cust = customerLookupRegistry[selectedLookupCustomerKey];
            const phone = cust.phone || '';
            if (!phone || phone === 'N/A') {
                showSystemToast('No phone number recorded for this customer.', 'warning', 'Copy Contact');
                return;
            }
            navigator.clipboard.writeText(phone);
            showSystemToast(`Phone number [${phone}] copied to clipboard!`, 'success', 'Contact Copied');
        }
        window.copyCustomerPhone = copyCustomerPhone;

        function openBackJobReasonModal(explicitJobId) {
            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) {
                showSystemToast('Please select a customer record first.', 'warning', 'Back-Job Intake');
                return;
            }

            const cust = customerLookupRegistry[selectedLookupCustomerKey];
            let targetJob = (cust.jobs && cust.jobs[0]) || {};
            if (explicitJobId && cust.jobs) {
                const found = cust.jobs.find(j => (j.job_id || j.id || j._id) === explicitJobId);
                if (found) targetJob = found;
            }

            const refJobId = targetJob.job_id || targetJob.id || targetJob._id || 'PREV-ORDER';
            const prevDate = targetJob.date || targetJob.created_at || 'Previous Service';
            const prevCat = targetJob.category || 'General Service';
            const prevSA = targetJob.sa || targetJob.handled_by || 'Front Desk SA';
            const origTech = targetJob.mechanic || targetJob.tech || 'Assigned Bay Technician';

            // Calculate Days Elapsed and Warranty Status
            const lastServiceDate = new Date(prevDate);
            let daysElapsedText = 'Recent (Within 30-Day Window)';
            let diffDays = 0;
            if (!isNaN(lastServiceDate.getTime())) {
                diffDays = Math.max(0, Math.floor((Date.now() - lastServiceDate.getTime()) / (1000 * 60 * 60 * 24)));
                const warrantyTag = diffDays <= 30 ? 'Within 30-Day Standard Warranty' : 'Over 30 Days (Management Review)';
                daysElapsedText = `${diffDays} Day${diffDays === 1 ? '' : 's'} Elapsed (${warrantyTag})`;
            }

            const modal = document.getElementById('modal-backjob-reason');
            if (!modal) {
                confirmBackJobIntake();
                return;
            }

            // Fill preview values in modal
            const nameEl = document.getElementById('modal-bj-cust-name');
            const plateEl = document.getElementById('modal-bj-plate-badge');
            const vehEl = document.getElementById('modal-bj-vehicle');
            const catEl = document.getElementById('modal-bj-prev-cat');
            const refEl = document.getElementById('modal-bj-prev-ref');
            const origTechEl = document.getElementById('modal-bj-orig-tech');
            const prevSaEl = document.getElementById('modal-bj-prev-sa');
            const daysElapsedEl = document.getElementById('modal-bj-days-elapsed');
            const inputEl = document.getElementById('modal-bj-concern-input');
            const odoEl = document.getElementById('modal-bj-odometer-input');

            if (nameEl) nameEl.innerText = cust.name || 'Customer Name';
            if (plateEl) plateEl.innerText = cust.plate !== 'NO-PLATE' ? cust.plate : 'NO PLATE';
            if (vehEl) vehEl.innerText = cust.vehicle !== 'Unknown Model' ? cust.vehicle : 'Vehicle Model';
            if (catEl) catEl.innerText = prevCat;
            if (refEl) refEl.innerText = `${prevDate} (#${refJobId})`;
            if (origTechEl) origTechEl.innerText = origTech;
            if (prevSaEl) prevSaEl.innerText = `Advisor: ${prevSA}`;
            if (daysElapsedEl) {
                daysElapsedEl.innerText = daysElapsedText;
                if (diffDays <= 30) {
                    daysElapsedEl.className = "text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200";
                } else {
                    daysElapsedEl.className = "text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200";
                }
            }

            if (inputEl) {
                inputEl.value = '';
                setTimeout(() => inputEl.focus(), 50);
            }
            if (odoEl) {
                odoEl.value = '';
            }

            modal.dataset.refJobId = refJobId;
            modal.dataset.prevDate = prevDate;
            modal.dataset.prevCat = prevCat;
            modal.dataset.prevSa = prevSA;
            modal.dataset.origTech = origTech;
            modal.dataset.daysElapsed = String(diffDays);

            modal.classList.remove('hidden');
        }
        window.openBackJobReasonModal = openBackJobReasonModal;

        function closeBackJobReasonModal() {
            const modal = document.getElementById('modal-backjob-reason');
            if (modal) modal.classList.add('hidden');
        }
        window.closeBackJobReasonModal = closeBackJobReasonModal;

        function submitBackJobWithReason() {
            const modal = document.getElementById('modal-backjob-reason');
            const inputEl = document.getElementById('modal-bj-concern-input');
            const reasonText = inputEl ? inputEl.value.trim() : '';

            if (!reasonText) {
                showSystemToast('Please describe the customer\'s return complaint / symptom.', 'warning', 'Reason Required');
                if (inputEl) inputEl.focus();
                return;
            }

            if (!selectedLookupCustomerKey || !customerLookupRegistry[selectedLookupCustomerKey]) {
                closeBackJobReasonModal();
                showSystemToast('Customer record lost. Please reselect customer.', 'error');
                return;
            }

            const cust = customerLookupRegistry[selectedLookupCustomerKey];
            const refJobId = modal ? modal.dataset.refJobId || 'PREV-JOB' : 'PREV-JOB';
            const prevDate = modal ? modal.dataset.prevDate || 'past service' : 'past service';
            const prevCat = modal ? modal.dataset.prevCat || 'General Repair' : 'General Repair';
            const origTech = modal ? modal.dataset.origTech || 'Assigned Bay Technician' : 'Assigned Bay Technician';
            const diffDays = modal ? modal.dataset.daysElapsed || '0' : '0';
            const selectedConcernCat = document.getElementById('modal-bj-category-select') ? document.getElementById('modal-bj-category-select').value : 'Back-Job Return';
            const currentOdometer = document.getElementById('modal-bj-odometer-input') ? document.getElementById('modal-bj-odometer-input').value.trim() : '';

            closeBackJobReasonModal();

            // 1. Switch view to intake
            showSection('intake');

            // 2. Pre-fill customer fields
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

            // Set category to Back-Job / Return Repair
            if (catEl) {
                catEl.value = 'Others';
                if (catOtherEl) {
                    catOtherEl.value = `Back-Job / Return (${selectedConcernCat})`;
                    catOtherEl.classList.remove('hidden');
                }
            }

            // Pre-fill concern with complete automotive traceability
            if (concernEl) {
                const odoTag = currentOdometer ? ` | Current Odometer: ${currentOdometer} KM` : '';
                concernEl.value = `[BACK-JOB / RETURN REPAIR - ${selectedConcernCat}] Prev Order: ${refJobId} (${prevCat} on ${prevDate} | Orig Tech: ${origTech} | Returned after ${diffDays} days${odoTag}). Customer Return Complaint: ${reasonText}`;
            }

            showSystemToast(`Back-Job ticket prepared for "${cust.name}" (Original Tech: ${origTech})!`, 'success', 'Back-Job Initialized');
        }
        window.submitBackJobWithReason = submitBackJobWithReason;

        function confirmBackJobIntake() {
            openBackJobReasonModal();
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

        function printJobClaimStubPDF(jobId) {
            let job = (typeof allJobs !== 'undefined' && Array.isArray(allJobs)) ? allJobs.find(j => String(j.id) === String(jobId) || String(j.job_id) === String(jobId)) : null;
            
            // If not found in allJobs, search in customerLookupRegistry
            if (!job && typeof customerLookupRegistry !== 'undefined') {
                for (const k in customerLookupRegistry) {
                    const found = customerLookupRegistry[k]?.jobs?.find(j => String(j.id) === String(jobId) || String(j.job_id) === String(jobId) || String(j._id) === String(jobId));
                    if (found) {
                        job = {
                            id: found.id || found.job_id,
                            claimStub: found.claim_stub || found.stub,
                            plate: found.plate || customerLookupRegistry[k].plate,
                            vehicle: found.vehicle || customerLookupRegistry[k].vehicle,
                            category: found.category,
                            saName: found.handled_by || found.sa,
                            location: found.bay_number || found.bay,
                            arrival: found.arrival || found.appt_time,
                            departure: found.departure,
                            dateReceived: found.date || found.created_at,
                            concern: found.concern || found.evaluation || found.diagnosis,
                            remarks: found.remarks
                        };
                        break;
                    }
                }
            }

            if (!job) {
                return showSystemToast('Job record not found for Claim Stub generation.', 'error', 'Claim Stub');
            }

            showSystemToast(`Printing Claim Stub for ${job.plate || 'Vehicle'}...`, 'info', 'Claim Stub');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a5'); // 148mm x 210mm compact format

            const todayStr = new Date().toISOString().split('T')[0];
            const today = new Date().toLocaleDateString();
            const time = new Date().toLocaleTimeString('en-US', { hour12: localStorage.getItem('timeFormat24h') === 'false', hour: '2-digit', minute: '2-digit' });

            // Top Brand Bar (Red)
            doc.setFillColor(220, 38, 38);
            doc.rect(0, 0, 148, 6, 'F');

            // Company Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(17, 24, 39);
            doc.text('HONTECH AUTOCENTER INC.', 10, 15);

            doc.setFontSize(8.5);
            doc.setTextColor(100, 116, 139);
            doc.text('CUSTOMER SERVICE CLAIM STUB & GATE PASS', 10, 20);

            // Claim Stub Box
            doc.setFillColor(248, 250, 252);
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.4);
            doc.roundedRect(95, 9, 43, 16, 2, 2, 'FD');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(220, 38, 38);
            doc.text('CLAIM STUB NO.', 116.5, 14, { align: 'center' });

            doc.setFontSize(11);
            doc.setTextColor(17, 24, 39);
            doc.text(job.claimStub || 'N/A', 116.5, 21, { align: 'center' });

            // Divider Line
            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.2);
            doc.line(10, 28, 138, 28);

            // Vehicle & Service Details Table
            doc.autoTable({
                startY: 31,
                head: [['CUSTOMER & VEHICLE INFORMATION', 'SERVICE INTAKE DETAILS']],
                body: [
                    [
                        `Plate Number: ${job.plate || 'N/A'}\nVehicle Model: ${job.vehicle || 'N/A'}\nIntake Date: ${job.dateReceived || todayStr}\nArrival Time: ${formatTime12Hour(job.arrival)}`,
                        `Service Category: ${job.category || 'General Service'}\nService Advisor: ${job.saName || 'Assigned SA'}\nAssigned Bay: ${job.location || 'Bay 1'}\nPromised Time: ${job.promisedDate || formatTime12Hour(job.departure) || 'To be advised'}`
                    ]
                ],
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 3, lineColor: [226, 232, 240], lineWidth: 0.2 },
                headStyles: { fillColor: [248, 250, 252], textColor: [17, 24, 39], fontStyle: 'bold' }
            });

            let nextY = doc.autoTable.previous.finalY + 5;

            // Customer Concern / Scope of Work Box
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(17, 24, 39);
            doc.text('WORK ORDER & DIAGNOSTIC CONCERN:', 10, nextY);

            doc.autoTable({
                startY: nextY + 2,
                body: [
                    [job.concern || job.remarks || 'Standard Periodic Maintenance Service (PMS) & Workshop Multi-Point Inspection.']
                ],
                theme: 'plain',
                styles: { fontSize: 7.5, cellPadding: 2.5, fontStyle: 'italic', textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.2 }
            });

            nextY = doc.autoTable.previous.finalY + 5;

            // Terms & Conditions Notice
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(10, nextY, 128, 24, 1.5, 1.5, 'F');

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.setTextColor(153, 27, 27);
            doc.text('IMPORTANT CUSTOMER REMINDERS & GATE PASS POLICY:', 13, nextY + 4.5);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(127, 29, 29);
            doc.text('1. Please present this official Claim Stub upon vehicle releasing & billing settlement.', 13, nextY + 9);
            doc.text('2. Please remove all personal valuables from the vehicle before leaving the service bay.', 13, nextY + 13);
            doc.text('3. Vehicles left unclaimed over 48 hours after notice may incur standard garage storage fees.', 13, nextY + 17);
            doc.text('4. Official HonTech warranty covers specified labor and genuine replacement parts.', 13, nextY + 21);

            nextY += 31;

            // Signatures
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('CUSTOMER SIGNATURE (Intake Acknowledged):', 10, nextY);
            doc.text('AUTHORIZED SERVICE ADVISOR:', 78, nextY);

            doc.setDrawColor(148, 163, 184);
            doc.line(10, nextY + 10, 65, nextY + 10);
            doc.line(78, nextY + 10, 135, nextY + 10);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(100, 116, 139);
            doc.text('Customer / Vehicle Owner', 10, nextY + 14);
            doc.text((job.saName || 'Service Advisor') + ' (HonTech AutoCenter)', 78, nextY + 14);

            // Footer
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text(`Printed on ${today} at ${time} | HonTech AutoCenter Marikina`, 10, 202);
            doc.text('Customer Copy', 138, 202, { align: 'right' });

            const safePlate = (job.plate || 'Vehicle').replace(/[^a-zA-Z0-9]/g, '_');
            const pdfBlob = doc.output('blob');
            downloadBlob(pdfBlob, `Hontech_ClaimStub_${job.claimStub || safePlate}.pdf`);
            showSystemToast('Customer Claim Stub PDF generated successfully!', 'success', 'Claim Stub');
        }
        window.printJobClaimStubPDF = printJobClaimStubPDF;

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

        // ============================================================
        // 1. EXPRESS LANE 2-HOUR SLA DELAY REPORTING WORKFLOW
        // ============================================================
        window.reportedExpressIssues = window.reportedExpressIssues || {};

        function openExpressDelayModal(jobId) {
            const job = (allJobs || []).find(j => (j.id === jobId || j.job_id === jobId));
            if (!job) {
                showSystemToast('Vehicle job record not found.', 'error');
                return;
            }

            const modal = document.getElementById('modal-express-delay-report');
            if (!modal) return;

            const jobIdInput = document.getElementById('modal-delay-job-id');
            const plateBadge = document.getElementById('modal-delay-plate-badge');
            const custName = document.getElementById('modal-delay-customer-name');
            const vehModel = document.getElementById('modal-delay-vehicle-model');
            const arrTime = document.getElementById('modal-delay-arrival-time');
            const elapsedBadge = document.getElementById('modal-delay-elapsed-badge');
            const reasonSelect = document.getElementById('modal-delay-reason');
            const customWrap = document.getElementById('modal-delay-custom-wrap');
            const customInput = document.getElementById('modal-delay-custom-input');
            const detailsTextarea = document.getElementById('modal-delay-details');

            // Calculate elapsed time
            const arr24 = convertTimeTo24Hour(job.arrival) || job.arrival || '08:00';
            let elapsedMin = 120;
            if (arr24 && arr24.includes(':')) {
                const [ah, am] = arr24.split(':').map(Number);
                const now = new Date();
                const diff = (now.getHours() * 60 + now.getMinutes()) - (ah * 60 + am);
                elapsedMin = diff > 0 ? diff : 120;
            }

            const hours = Math.floor(elapsedMin / 60);
            const mins = elapsedMin % 60;

            if (jobIdInput) jobIdInput.value = job.job_id || job.id;
            if (plateBadge) plateBadge.innerText = job.plate || 'PLATE';
            if (custName) custName.innerText = job.name || job.customer_name || 'Walk-in Customer';
            if (vehModel) vehModel.innerText = job.vehicle || '-';
            if (arrTime) arrTime.innerText = arr24;
            if (elapsedBadge) elapsedBadge.innerText = `${hours}h ${mins}m (${elapsedMin} mins)`;

            if (reasonSelect) reasonSelect.value = 'Required Parts Delay / Not In Stock';
            if (customWrap) customWrap.classList.add('hidden');
            if (customInput) customInput.value = '';
            if (detailsTextarea) detailsTextarea.value = '';

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        }

        function closeExpressDelayModal() {
            const modal = document.getElementById('modal-express-delay-report');
            if (modal) modal.classList.add('hidden');
        }

        function toggleDelayCustomReason(val) {
            const wrap = document.getElementById('modal-delay-custom-wrap');
            if (!wrap) return;
            if (val === 'Others') {
                wrap.classList.remove('hidden');
            } else {
                wrap.classList.add('hidden');
            }
        }

        async function submitExpressDelayReport() {
            const jobId = document.getElementById('modal-delay-job-id')?.value;
            const job = (allJobs || []).find(j => (j.id === jobId || j.job_id === jobId));
            if (!job) {
                showSystemToast('Target vehicle record is invalid.', 'error');
                return;
            }

            const reasonSelect = document.getElementById('modal-delay-reason');
            const customInput = document.getElementById('modal-delay-custom-input');
            const detailsTextarea = document.getElementById('modal-delay-details');

            const reasonCategory = reasonSelect?.value || '';
            const customReasonCategory = customInput?.value?.trim() || '';
            const reasonDetails = detailsTextarea?.value?.trim() || '';

            if (reasonCategory === 'Others' && !customReasonCategory) {
                showSystemToast('Please specify the custom delay category.', 'warning', 'Required Field');
                customInput?.focus();
                return;
            }

            if (!reasonDetails) {
                showSystemToast('Please provide a brief root cause explanation for the delay.', 'warning', 'Required Field');
                detailsTextarea?.focus();
                return;
            }

            // Calculate elapsed minutes
            const arr24 = convertTimeTo24Hour(job.arrival) || job.arrival || '08:00';
            let elapsedMin = 120;
            if (arr24 && arr24.includes(':')) {
                const [ah, am] = arr24.split(':').map(Number);
                const now = new Date();
                const diff = (now.getHours() * 60 + now.getMinutes()) - (ah * 60 + am);
                elapsedMin = diff > 0 ? diff : 120;
            }

            const submitBtn = document.getElementById('btn-submit-express-delay');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Submitting...`;
            }

            try {
                const payload = {
                    jobId: job.job_id || job.id,
                    plate: job.plate,
                    customerName: job.name || job.customer_name || 'Walk-in Customer',
                    vehicle: job.vehicle || '-',
                    saName: job.saName || currentUserName || 'Service Advisor',
                    arrivalTime: arr24,
                    elapsedMinutes: elapsedMin,
                    reasonCategory: reasonCategory,
                    customReasonCategory: customReasonCategory,
                    reasonDetails: reasonDetails
                };

                const savedRecord = await apiRequest('/api/express-issues', {
                    method: 'POST',
                    body: payload
                });

                // Update local cache
                window.reportedExpressIssues[job.id] = savedRecord;
                window.reportedExpressIssues[job.job_id || job.id] = savedRecord;
                window.reportedExpressIssues[job.plate] = savedRecord;

                closeExpressDelayModal();
                showSystemToast(`Express delay report recorded successfully for ${job.plate}.`, 'success', 'Incident Logged');

                renderStaffTables();
                if (typeof renderExpressIntelligenceModule === 'function') {
                    renderExpressIntelligenceModule();
                }
            } catch (err) {
                console.error('Failed to submit express delay report:', err);
                showSystemToast(err.message || 'Failed to submit delay report.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i> Submit Delay Report`;
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        }

        // ============================================================
        // 2. SYSTEM-WIDE REASON-REQUIRED EDIT WORKFLOW
        // ============================================================
        let pendingFieldEdit = null;

        function requestFieldEditWithReason(jobId, field, value, oldValue = null) {
            const job = (allJobs || []).find(j => (j.id === jobId || j.job_id === jobId));
            if (!job) {
                updateJobField(jobId, field, value);
                return;
            }

            // Normalization for comparison
            let curVal = oldValue !== null ? oldValue : (job[field] || '');
            let newVal = value || '';
            if (field === 'departure' || field === 'arrival') {
                curVal = convertTimeTo24Hour(curVal) || curVal;
                newVal = convertTimeTo24Hour(newVal) || newVal;
            }

            // If identical, do nothing
            if (curVal === newVal) return;

            pendingFieldEdit = {
                jobId: job.job_id || job.id,
                field: field,
                value: newVal,
                oldValue: curVal || 'None'
            };

            const modal = document.getElementById('modal-edit-reason-prompt');
            if (!modal) {
                updateJobField(jobId, field, value);
                return;
            }

            const fieldNameElem = document.getElementById('modal-edit-field-name');
            const oldValElem = document.getElementById('modal-edit-old-val');
            const newValElem = document.getElementById('modal-edit-new-val');
            const presetSelect = document.getElementById('modal-edit-reason-preset');
            const reasonTextarea = document.getElementById('modal-edit-reason-text');

            if (fieldNameElem) fieldNameElem.innerText = formatFieldName(field);
            if (oldValElem) oldValElem.innerText = String(pendingFieldEdit.oldValue);
            if (newValElem) newValElem.innerText = String(newVal);
            if (presetSelect) presetSelect.value = 'Typo / Data Entry Correction';
            if (reasonTextarea) reasonTextarea.value = '';

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
            if (reasonTextarea) setTimeout(() => reasonTextarea.focus(), 150);
        }

        function handleEditPresetChange(val) {
            const reasonTextarea = document.getElementById('modal-edit-reason-text');
            if (!reasonTextarea) return;
            if (val !== 'Others' && !reasonTextarea.value) {
                reasonTextarea.placeholder = `Details for "${val}"...`;
            } else if (val === 'Others') {
                reasonTextarea.placeholder = 'Please state your specific operational justification...';
            }
        }

        async function confirmFieldEditWithReason() {
            if (!pendingFieldEdit) return;

            const presetSelect = document.getElementById('modal-edit-reason-preset');
            const reasonTextarea = document.getElementById('modal-edit-reason-text');

            const preset = presetSelect?.value || 'Data Entry Update';
            const details = reasonTextarea?.value?.trim() || '';

            if (!details && preset === 'Others') {
                showSystemToast('Please provide an operational justification reason for this modification.', 'warning', 'Reason Required');
                reasonTextarea?.focus();
                return;
            }

            const finalReason = details ? `${preset}: ${details}` : preset;

            const modal = document.getElementById('modal-edit-reason-prompt');
            if (modal) modal.classList.add('hidden');

            const { jobId, field, value } = pendingFieldEdit;
            pendingFieldEdit = null;

            await updateJobField(jobId, field, value, finalReason);
        }

        function cancelFieldEdit() {
            pendingFieldEdit = null;
            const modal = document.getElementById('modal-edit-reason-prompt');
            if (modal) modal.classList.add('hidden');
            renderStaffTables();
        }

        // ============================================================
        // 3. AUDIT HISTORY TIMELINE WORKFLOW
        // ============================================================
        async function openJobAuditHistoryModal(jobId) {
            const job = (allJobs || []).find(j => (j.id === jobId || j.job_id === jobId));
            const modal = document.getElementById('modal-job-audit-history');
            const plateBadge = document.getElementById('modal-audit-plate-badge');
            const subtitle = document.getElementById('modal-audit-customer-subtitle');
            const content = document.getElementById('modal-audit-history-content');

            if (!modal || !content) return;

            const targetJobId = job ? (job.job_id || job.id) : jobId;
            if (plateBadge) plateBadge.innerText = job?.plate || 'VEHICLE';
            if (subtitle) subtitle.innerText = job ? `${job.name || 'Customer'} • ${job.vehicle || 'Model'}` : 'Customer Change History Log';

            content.innerHTML = `
                <div class="py-8 text-center text-slate-400 space-y-2">
                    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-slate-500"></i>
                    <p class="text-xs font-semibold">Loading immutable audit trail...</p>
                </div>
            `;

            modal.classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();

            try {
                const logs = await apiRequest(`/api/jobs/${targetJobId}/audit-history`);
                if (!Array.isArray(logs) || logs.length === 0) {
                    content.innerHTML = `
                        <div class="py-10 text-center text-slate-400 space-y-2">
                            <i data-lucide="shield-check" class="w-8 h-8 mx-auto text-emerald-500"></i>
                            <p class="text-xs font-bold text-slate-700">Original Record Pristine</p>
                            <p class="text-[11px] text-slate-400">No modifications or delay reports logged for this vehicle.</p>
                        </div>
                    `;
                    if (window.lucide) window.lucide.createIcons();
                    return;
                }

                let html = '';
                logs.forEach(log => {
                    const formattedDate = log.created_at ? log.created_at.replace('T', ' ').substring(0, 16) : 'Recently';
                    const isDelayReport = log.field_name === 'express_delay_report';

                    html += `
                        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                            <div class="flex items-center justify-between text-xs">
                                <div class="flex items-center gap-1.5">
                                    <span class="w-2 h-2 rounded-full ${isDelayReport ? 'bg-amber-500' : 'bg-blue-500'}"></span>
                                    <span class="font-extrabold text-slate-800 uppercase text-[11px]">${formatFieldName(log.field_name)}</span>
                                </div>
                                <span class="font-mono text-[10px] text-slate-400 font-bold">${formattedDate}</span>
                            </div>

                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <div class="p-2 bg-white rounded-xl border border-slate-150">
                                    <span class="text-[9px] text-slate-400 font-bold block uppercase">Previous</span>
                                    <span class="font-mono text-slate-600 truncate block text-[11px]">${escapeHtml(log.old_value || 'None')}</span>
                                </div>
                                <div class="p-2 bg-white rounded-xl border border-slate-150">
                                    <span class="text-[9px] text-blue-500 font-bold block uppercase">Updated</span>
                                    <span class="font-mono text-slate-900 font-bold truncate block text-[11px]">${escapeHtml(log.new_value || 'None')}</span>
                                </div>
                            </div>

                            <div class="pt-1.5 border-t border-slate-200/80 flex items-start justify-between gap-2 text-[11px]">
                                <div class="text-slate-700">
                                    <strong class="text-slate-900 font-bold">Reason:</strong>
                                    <span class="italic text-slate-600">${escapeHtml(log.edit_reason || '-')}</span>
                                </div>
                                <span class="px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded text-[9px] font-extrabold uppercase shrink-0">
                                    ${escapeHtml(log.edited_by_name || 'Staff')} (${escapeHtml(log.edited_by_role || 'SA')})
                                </span>
                            </div>
                        </div>
                    `;
                });

                content.innerHTML = html;
                if (window.lucide) window.lucide.createIcons();
            } catch (err) {
                console.error('Failed to load job audit history:', err);
                content.innerHTML = `
                    <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center">
                        Failed to retrieve audit records. Please try again.
                    </div>
                `;
            }
        }

        function closeJobAuditHistoryModal() {
            const modal = document.getElementById('modal-job-audit-history');
            if (modal) modal.classList.add('hidden');
        }
        window.openJobAuditHistoryModal = openJobAuditHistoryModal;
        window.closeJobAuditHistoryModal = closeJobAuditHistoryModal;

        // ============================================================
        // 4. DEVELOPER SANDBOX SIMULATION TRIGGERS
        // ============================================================
        async function triggerSimulateExpressOverdue() {
            try {
                showSystemToast('Spawning simulated 2-hour overdue Express Lane vehicle...', 'info', 'Dev Simulator');
                const res = await apiRequest('/api/auth/developer/simulate-express-overdue', {
                    method: 'POST'
                });
                await loadData();
                renderStaffTables();
                showSection('queue');
                showSystemToast(res.message || 'Simulated 2H overdue vehicle created.', 'success', 'Sim Created');
            } catch (err) {
                console.error('Failed to simulate express overdue job:', err);
                showSystemToast(err.message || 'Simulation error.', 'error');
            }
        }

        async function triggerClearAuditLogs() {
            try {
                const res = await apiRequest('/api/auth/developer/clear-audit-logs', {
                    method: 'POST'
                });
                window.reportedExpressIssues = {};
                await loadData();
                renderStaffTables();
                if (typeof renderExpressIntelligenceModule === 'function') {
                    renderExpressIntelligenceModule();
                }
                showSystemToast(res.message || 'Audit logs and express delay reports cleared.', 'success', 'Logs Purged');
            } catch (err) {
                console.error('Failed to clear audit logs:', err);
                showSystemToast(err.message || 'Failed to clear logs.', 'error');
            }
        }

        // Project Team & Contributors Modal Handlers
        window.openTeamContributorsModal = function() {
            const modal = document.getElementById('modal-team-contributors');
            if (modal) {
                modal.classList.remove('hidden');
                if (typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons();
                }
            }
        };

        window.closeTeamContributorsModal = function() {
            const modal = document.getElementById('modal-team-contributors');
            if (modal) {
                modal.classList.add('hidden');
            }
        };



