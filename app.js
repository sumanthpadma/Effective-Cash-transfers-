// Main application JavaScript for Telangana MCH Kit G2P Dashboard

// Global variables
let currentBeneficiary = null;
let filteredBeneficiaries = [];
let filteredFraudSignals = [];
let currentTransfer = null;
let selectedConnector = null;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupEventListeners();
    loadDashboard();
    updateKPIs();
    filteredBeneficiaries = [...window.appData.beneficiaries];
}

// Navigation setup
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const screenName = btn.dataset.screen;
            showScreen(screenName);
            
            // Update active nav button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Screen navigation
function showScreen(screenName) {
    // Hide all screens
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    // Show selected screen
    const targetScreen = document.getElementById(screenName);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        // Load screen-specific content
        switch(screenName) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'send':
                loadSend();
                break;
            case 'beneficiaries':
                loadBeneficiaries();
                break;
            case 'profile':
                loadProfile();
                break;
            case 'payments':
                loadPayments();
                break;
            case 'reconciliation':
                loadReconciliation();
                break;
            case 'ai-review':
                loadAIReview();
                break;
            case 'disaster':
                loadDisaster();
                break;
            case 'settings':
                loadSettings();
                break;
        }
    }
}

// Event listeners setup
function setupEventListeners() {
    // Filter event listeners
    document.getElementById('district-filter')?.addEventListener('change', applyFilters);
    document.getElementById('eligibility-filter')?.addEventListener('change', applyFilters);
    document.getElementById('risk-filter')?.addEventListener('change', applyFilters);
    
    // Interactive pipeline
    const pipelineNodes = document.querySelectorAll('#interactive-pipeline .pipeline-node');
    pipelineNodes.forEach(node => {
        node.addEventListener('click', () => highlightPipelinePath(node));
    });
    
    // Nudge modal template change
    document.getElementById('nudge-type')?.addEventListener('change', updateNudgeMessage);
    document.getElementById('nudge-template')?.addEventListener('change', updateNudgeMessage);
}

// Dashboard functions
function loadDashboard() {
    updateKPIs();
    updateSettlementMode();
}

function updateKPIs() {
    const beneficiaries = window.appData.beneficiaries;
    
    const eligible = beneficiaries.filter(b => b.eligibilityStatus === 'eligible').length;
    const ineligible = beneficiaries.filter(b => b.eligibilityStatus === 'ineligible').length;
    const held = beneficiaries.filter(b => 
        b.timeline.some(t => t.status === 'HELD')
    ).length;
    
    const totalDisbursed = window.appData.payments
        .filter(p => p.status === 'SUCCESS')
        .reduce((sum, p) => sum + p.amount, 0);
    
    const creditInstructionsIssued = window.appData.payments
        .filter(p => p.path.creditInstructionAt)
        .length;
    const totalPayments = window.appData.payments.length;
    const creditInstructionPercentage = totalPayments > 0 ? 
        Math.round((creditInstructionsIssued / totalPayments) * 100) : 0;
    
    document.getElementById('kpi-eligible').textContent = eligible;
    document.getElementById('kpi-ineligible').textContent = ineligible;
    document.getElementById('kpi-held').textContent = held;
    document.getElementById('kpi-disbursed').textContent = `₹${totalDisbursed.toLocaleString()}`;
    document.getElementById('kpi-credit-instructions').textContent = `${creditInstructionPercentage}%`;
}

function updateSettlementMode() {
    const mode = window.appData.settlementMode;
    const elements = document.querySelectorAll('[id*="settlement-mode"]');
    elements.forEach(el => el.textContent = mode);
}

// Beneficiaries functions
function loadBeneficiaries() {
    applyFilters();
}

function applyFilters() {
    const districtFilter = document.getElementById('district-filter')?.value || '';
    const eligibilityFilter = document.getElementById('eligibility-filter')?.value || '';
    const riskFilter = document.getElementById('risk-filter')?.value || '';
    
    filteredBeneficiaries = window.appData.beneficiaries.filter(beneficiary => {
        const matchesDistrict = !districtFilter || beneficiary.district === districtFilter;
        const matchesEligibility = !eligibilityFilter || beneficiary.eligibilityStatus === eligibilityFilter;
        
        let matchesRisk = true;
        if (riskFilter) {
            const riskScore = beneficiary.ai.riskScore;
            switch(riskFilter) {
                case 'low': matchesRisk = riskScore <= 0.3; break;
                case 'medium': matchesRisk = riskScore > 0.3 && riskScore <= 0.7; break;
                case 'high': matchesRisk = riskScore > 0.7; break;
            }
        }
        
        return matchesDistrict && matchesEligibility && matchesRisk;
    });
    
    renderBeneficiariesTable();
}

function renderBeneficiariesTable() {
    const tbody = document.getElementById('beneficiaries-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    filteredBeneficiaries.forEach(beneficiary => {
        const row = document.createElement('tr');
        const riskLevel = getRiskLevel(beneficiary.ai.riskScore);
        const statusBadge = getStatusBadge(beneficiary.eligibilityStatus);
        const riskBadge = getRiskBadge(riskLevel);
        const kycBadge = getKYCBadge(beneficiary.kycStatus);
        const complianceFlags = getComplianceFlags(beneficiary.complianceFlags);
        
        row.innerHTML = `
            <td>${beneficiary.name}</td>
            <td>${beneficiary.aadhaarMasked}</td>
            <td>${beneficiary.district}</td>
            <td>${kycBadge}</td>
            <td>${statusBadge}</td>
            <td>${riskBadge}</td>
            <td>${complianceFlags}</td>
            <td>
                <button class="btn btn-sm" onclick="viewBeneficiary('${beneficiary.id}')">View</button>
                <button class="btn btn-warning btn-sm" onclick="holdBeneficiary('${beneficiary.id}')">Hold</button>
                <button class="btn btn-success btn-sm" onclick="showNudgeModal('${beneficiary.id}')">Nudge</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function getRiskLevel(riskScore) {
    if (riskScore <= 0.3) return 'low';
    if (riskScore <= 0.7) return 'medium';
    return 'high';
}

function getStatusBadge(status) {
    const badgeClass = status === 'eligible' ? 'badge-success' : 'badge-danger';
    return `<span class="badge ${badgeClass}">${status.toUpperCase()}</span>`;
}

function getRiskBadge(level) {
    const badgeClass = level === 'low' ? 'badge-success' : 
                      level === 'medium' ? 'badge-warning' : 'badge-danger';
    return `<span class="badge ${badgeClass}">${level.toUpperCase()}</span>`;
}

// Profile functions
function viewBeneficiary(beneficiaryId) {
    currentBeneficiary = window.appData.beneficiaries.find(b => b.id === beneficiaryId);
    if (currentBeneficiary) {
        document.querySelector('[data-screen="profile"]').style.display = 'block';
        showScreen('profile');
    }
}

function loadProfile() {
    if (!currentBeneficiary) return;
    
    const detailsContainer = document.getElementById('profile-details');
    detailsContainer.innerHTML = `
        <div class="flex gap-2" style="flex-wrap: wrap;">
            <div style="flex: 1; min-width: 300px;">
                <h3>${currentBeneficiary.name}</h3>
                <p><strong>Aadhaar:</strong> ${currentBeneficiary.aadhaarMasked}</p>
                <p><strong>Mobile:</strong> ${currentBeneficiary.mobile}</p>
                <p><strong>District:</strong> ${currentBeneficiary.district}</p>
                <p><strong>PHC:</strong> ${currentBeneficiary.phcId}</p>
                <p><strong>Deliveries:</strong> ${currentBeneficiary.deliveriesCount}</p>
                <p><strong>Child Gender:</strong> ${currentBeneficiary.childGender}</p>
            </div>
            <div style="flex: 1; min-width: 300px;">
                <h4>Risk Assessment</h4>
                <p><strong>Risk Score:</strong> ${(currentBeneficiary.ai.riskScore * 100).toFixed(1)}%</p>
                <p><strong>Reasons:</strong></p>
                <ul>
                    ${currentBeneficiary.ai.reasons.map(reason => `<li>${reason}</li>`).join('')}
                </ul>
                ${currentBeneficiary.migration ? `
                <h4>Migration Info</h4>
                <p><strong>From:</strong> ${currentBeneficiary.migration.from}</p>
                <p><strong>To:</strong> ${currentBeneficiary.migration.to}</p>
                <p><strong>Reason:</strong> ${currentBeneficiary.migration.reason}</p>
                ` : ''}
            </div>
        </div>
        
        <div class="mt-2">
            <h4>Eligibility Constraints</h4>
            <div class="flex gap-1" style="flex-wrap: wrap;">
                ${Object.entries(currentBeneficiary.constraints).map(([key, value]) => {
                    const label = getConstraintLabel(key);
                    const badgeClass = value ? 'badge-success' : 'badge-danger';
                    return `<span class="badge ${badgeClass}">${label}</span>`;
                }).join('')}
            </div>
        </div>
    `;
    
    renderTimeline();
    renderLatestPaymentPath();
}

function getConstraintLabel(key) {
    const labels = {
        resident: 'Telangana Resident',
        aadhaarLinked: 'Aadhaar Linked',
        govtHospital: 'Govt Hospital',
        maxDeliveries: 'Max Deliveries OK',
        maxChildren: 'Max Children OK'
    };
    return labels[key] || key;
}

function renderTimeline() {
    const timelineContainer = document.getElementById('payment-timeline');
    timelineContainer.innerHTML = '';
    
    currentBeneficiary.timeline.forEach(stage => {
        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item ${stage.status.toLowerCase()}`;
        
        timelineItem.innerHTML = `
            <h4>${stage.stage}</h4>
            <p><strong>Amount:</strong> ₹${stage.amount.toLocaleString()}</p>
            <p><strong>Status:</strong> <span class="badge ${getTimelineStatusBadge(stage.status)}">${stage.status}</span></p>
            ${stage.date ? `<p><strong>Date:</strong> ${new Date(stage.date).toLocaleDateString()}</p>` : ''}
            ${stage.paymentId ? `<p><strong>Payment ID:</strong> ${stage.paymentId}</p>` : ''}
        `;
        
        timelineContainer.appendChild(timelineItem);
    });
}

function getTimelineStatusBadge(status) {
    switch(status) {
        case 'PAID': return 'badge-success';
        case 'DUE': return 'badge-warning';
        case 'HELD': return 'badge-danger';
        default: return 'badge-info';
    }
}

function renderLatestPaymentPath() {
    const pathContainer = document.getElementById('latest-payment-path');
    const latestPayment = window.appData.payments
        .filter(p => p.beneficiaryId === currentBeneficiary.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    if (!latestPayment) {
        pathContainer.innerHTML = '<p>No payments found</p>';
        return;
    }
    
    pathContainer.innerHTML = `
        <div class="card">
            <h4>Payment: ${latestPayment.id} (${latestPayment.stage})</h4>
            <p><strong>Amount:</strong> ₹${latestPayment.amount.toLocaleString()}</p>
            <div class="pipeline">
                <div class="pipeline-flow">
                    <div class="pipeline-node">
                        <strong>PFMS</strong><br>
                        <small>${new Date(latestPayment.path.pfms).toLocaleTimeString()}</small>
                    </div>
                    <div class="pipeline-arrow"></div>
                    <div class="pipeline-node">
                        <strong>Treasury</strong><br>
                        <small>${new Date(latestPayment.path.treasury).toLocaleTimeString()}</small>
                    </div>
                    <div class="pipeline-arrow"></div>
                    <div class="pipeline-node">
                        <strong>Remitter Bank</strong><br>
                        <small>${new Date(latestPayment.path.remitterBank).toLocaleTimeString()}</small>
                    </div>
                    <div class="pipeline-arrow"></div>
                    <div class="pipeline-node credit-instruction">
                        <strong>NPCI</strong><br>
                        <small>${new Date(latestPayment.path.npci).toLocaleTimeString()}</small>
                    </div>
                    <div class="pipeline-arrow"></div>
                    <div class="pipeline-node">
                        <strong>Beneficiary Bank</strong><br>
                        <small>${new Date(latestPayment.path.beneficiaryBank).toLocaleTimeString()}</small>
                    </div>
                    <div class="pipeline-arrow"></div>
                    <div class="pipeline-node">
                        <strong>Settlement (${latestPayment.path.settlement.mode})</strong><br>
                        <small>${new Date(latestPayment.path.settlement.time).toLocaleTimeString()}</small>
                    </div>
                </div>
            </div>
            <div class="mt-2">
                <p><strong>Credit Instruction Timestamp:</strong> ${new Date(latestPayment.path.creditInstructionAt).toLocaleString()}</p>
            </div>
        </div>
    `;
}

// Payments functions
function loadPayments() {
    renderPaymentsTable();
}

function renderPaymentsTable() {
    const tbody = document.getElementById('payments-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const recentPayments = window.appData.payments
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
    
    recentPayments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payment.beneficiaryName}</td>
            <td>${payment.stage}</td>
            <td>₹${payment.amount.toLocaleString()}</td>
            <td><span class="badge badge-success">${payment.status}</span></td>
            <td>${new Date(payment.path.creditInstructionAt).toLocaleString()}</td>
            <td>${new Date(payment.createdAt).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

function highlightPipelinePath(clickedNode) {
    const nodes = document.querySelectorAll('#interactive-pipeline .pipeline-node');
    const arrows = document.querySelectorAll('#interactive-pipeline .pipeline-arrow');
    
    // Reset all styles
    nodes.forEach(node => {
        node.style.background = '';
        node.style.transform = '';
    });
    
    // Highlight path up to clicked node
    const stepOrder = ['govt', 'pfms', 'remitter', 'npci', 'beneficiary-bank', 'settlement', 'beneficiary'];
    const clickedStep = clickedNode.dataset.step;
    const clickedIndex = stepOrder.indexOf(clickedStep);
    
    for (let i = 0; i <= clickedIndex; i++) {
        const node = document.querySelector(`[data-step="${stepOrder[i]}"]`);
        if (node) {
            node.style.background = '#4CAF50';
            node.style.color = 'white';
            node.style.transform = 'scale(1.05)';
        }
    }
}

// AI Review functions
function loadAIReview() {
    const fraudQueue = document.getElementById('fraud-queue');
    const fraudSignals = window.appData.fraudSignals;
    
    fraudQueue.innerHTML = '';
    
    if (fraudSignals.length === 0) {
        fraudQueue.innerHTML = '<p class="text-center">No fraud cases in queue</p>';
        return;
    }
    
    fraudSignals.forEach(signal => {
        const beneficiary = window.appData.beneficiaries.find(b => b.id === signal.beneficiaryId);
        if (!beneficiary) return;
        
        const fraudCard = document.createElement('div');
        fraudCard.className = 'card';
        fraudCard.innerHTML = `
            <div class="flex flex-between flex-center">
                <div>
                    <h4>${beneficiary.name}</h4>
                    <p><strong>Type:</strong> <span class="badge ${getFraudTypeBadge(signal.type)}">${signal.type}</span></p>
                    <p><strong>Severity:</strong> <span class="badge ${getSeverityBadge(signal.severity)}">${signal.severity}</span></p>
                    <p><strong>Details:</strong> ${signal.details}</p>
                </div>
                <div class="flex gap-1" style="flex-direction: column;">
                    <button class="btn btn-success btn-sm" onclick="approveFraudCase('${signal.id}')">Approve</button>
                    <button class="btn btn-danger btn-sm" onclick="holdFraudCase('${signal.id}')">Hold</button>
                    <button class="btn btn-warning btn-sm" onclick="requestDocsFraudCase('${signal.id}')">Request Docs</button>
                    <button class="btn btn-sm" onclick="showNudgeModal('${signal.beneficiaryId}')">Send Nudge</button>
                </div>
            </div>
        `;
        fraudQueue.appendChild(fraudCard);
    });
}

function getFraudTypeBadge(type) {
    switch(type) {
        case 'BEHAVIOR': return 'badge-warning';
        case 'TRANSACTION': return 'badge-info';
        case 'IDENTITY': return 'badge-danger';
        default: return 'badge-info';
    }
}

function getSeverityBadge(severity) {
    switch(severity) {
        case 'LOW': return 'badge-success';
        case 'MEDIUM': return 'badge-warning';
        case 'HIGH': return 'badge-danger';
        case 'CRITICAL': return 'badge-danger';
        default: return 'badge-info';
    }
}

// Disaster functions
function loadDisaster() {
    const disasterTable = document.getElementById('disaster-table');
    const affectedBeneficiaries = window.appData.beneficiaries.filter(b => 
        b.disasterFlags.includes('flood_affected')
    );
    
    disasterTable.innerHTML = '';
    
    affectedBeneficiaries.forEach(beneficiary => {
        const dueAmount = beneficiary.timeline
            .filter(t => t.status === 'DUE')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${beneficiary.name}</td>
            <td>${beneficiary.district}</td>
            <td>${beneficiary.migration ? beneficiary.migration.to : beneficiary.district}</td>
            <td>₹${dueAmount.toLocaleString()}</td>
            <td><span class="badge badge-warning">AFFECTED</span></td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="fastTrackBeneficiary('${beneficiary.id}')">Fast-track</button>
            </td>
        `;
        disasterTable.appendChild(row);
    });
}

// Settings functions
function loadSettings() {
    document.getElementById('anc-amount').value = window.appData.stageAmounts.anc;
    document.getElementById('delivery-boy-amount').value = window.appData.stageAmounts.deliveryBoy;
    document.getElementById('delivery-girl-amount').value = window.appData.stageAmounts.deliveryGirl;
    document.getElementById('immunisation1-amount').value = window.appData.stageAmounts.immunisation1;
    document.getElementById('immunisation2-amount').value = window.appData.stageAmounts.immunisation2;
    document.getElementById('settlement-mode-setting').value = window.appData.settlementMode;
}

// Action functions
function holdBeneficiary(beneficiaryId) {
    alert(`Beneficiary ${beneficiaryId} has been put on hold`);
}

function approveFraudCase(signalId) {
    alert(`Fraud case ${signalId} approved`);
}

function holdFraudCase(signalId) {
    alert(`Fraud case ${signalId} held for review`);
}

function requestDocsFraudCase(signalId) {
    alert(`Documentation requested for fraud case ${signalId}`);
}

function fastTrackBeneficiary(beneficiaryId) {
    alert(`Fast-tracking payments for beneficiary ${beneficiaryId}`);
}

function fastTrackDisaster() {
    const affectedCount = window.appData.beneficiaries.filter(b => 
        b.disasterFlags.includes('flood_affected')
    ).length;
    alert(`Fast-tracking DBT payments for ${affectedCount} affected beneficiaries`);
}

function saveSettings() {
    window.appData.stageAmounts.anc = parseInt(document.getElementById('anc-amount').value);
    window.appData.stageAmounts.deliveryBoy = parseInt(document.getElementById('delivery-boy-amount').value);
    window.appData.stageAmounts.deliveryGirl = parseInt(document.getElementById('delivery-girl-amount').value);
    window.appData.stageAmounts.immunisation1 = parseInt(document.getElementById('immunisation1-amount').value);
    window.appData.stageAmounts.immunisation2 = parseInt(document.getElementById('immunisation2-amount').value);
    window.appData.settlementMode = document.getElementById('settlement-mode-setting').value;
    
    updateSettlementMode();
    alert('Settings saved successfully');
}

// Nudge modal functions
function showNudgeModal(beneficiaryId) {
    currentBeneficiary = window.appData.beneficiaries.find(b => b.id === beneficiaryId);
    updateNudgeMessage();
    document.getElementById('nudge-modal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function updateNudgeMessage() {
    const type = document.getElementById('nudge-type')?.value || 'sms';
    const template = document.getElementById('nudge-template')?.value || 'document-upload';
    const message = window.appData.nudgeTemplates[template]?.[type] || '';
    
    const messageArea = document.getElementById('nudge-message');
    if (messageArea) {
        messageArea.value = message;
    }
}

function sendNudge() {
    const type = document.getElementById('nudge-type').value;
    const template = document.getElementById('nudge-template').value;
    
    alert(`${type.toUpperCase()} nudge sent for ${template.replace('-', ' ')} to ${currentBeneficiary?.name}`);
    closeModal('nudge-modal');
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// Keyboard navigation for accessibility
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            activeModal.classList.remove('active');
        }
        const activeDrawer = document.querySelector('.drawer.open');
        if (activeDrawer) {
            closeBeneficiaryDrawer();
        }
    }
});

// New orchestration functions

// KYC Status Badge
function getKYCBadge(status) {
    const badgeClass = status === 'VERIFIED' ? 'kyc-status verified' :
                      status === 'PENDING' ? 'kyc-status pending' : 'kyc-status failed';
    return `<span class="${badgeClass}">${status}</span>`;
}

// Compliance Flags
function getComplianceFlags(flags) {
    if (!flags || flags.length === 0) return '<span class="text-muted">-</span>';
    return flags.map(flag => 
        `<span class="compliance-flag ${flag.toLowerCase().replace('_', '-')}">${flag}</span>`
    ).join(' ');
}

// Send Screen Functions
function loadSend() {
    populateBeneficiarySelect();
    setupSendEventListeners();
}

function populateBeneficiarySelect() {
    const select = document.getElementById('send-beneficiary');
    if (!select) return;
    
    select.innerHTML = '<option value="">Choose beneficiary...</option>';
    window.appData.beneficiaries.forEach(beneficiary => {
        const option = document.createElement('option');
        option.value = beneficiary.id;
        option.textContent = `${beneficiary.name} (${beneficiary.district})`;
        select.appendChild(option);
    });
}

function setupSendEventListeners() {
    const beneficiarySelect = document.getElementById('send-beneficiary');
    const amountInput = document.getElementById('send-amount');
    const currencySelect = document.getElementById('send-currency');
    
    if (beneficiarySelect) {
        beneficiarySelect.addEventListener('change', onBeneficiarySelected);
    }
    if (amountInput) {
        amountInput.addEventListener('input', onAmountChanged);
    }
    if (currencySelect) {
        currencySelect.addEventListener('change', onCurrencyChanged);
    }
}

function onBeneficiarySelected() {
    const beneficiaryId = document.getElementById('send-beneficiary').value;
    if (beneficiaryId) {
        currentBeneficiary = window.appData.beneficiaries.find(b => b.id === beneficiaryId);
        displayBeneficiaryInfo();
    } else {
        document.getElementById('beneficiary-info').style.display = 'none';
    }
}

function displayBeneficiaryInfo() {
    const infoDiv = document.getElementById('beneficiary-info');
    const detailsDiv = document.getElementById('beneficiary-details');
    
    if (!currentBeneficiary) return;
    
    const kycBadge = getKYCBadge(currentBeneficiary.kycStatus);
    const complianceFlags = getComplianceFlags(currentBeneficiary.complianceFlags);
    
    detailsDiv.innerHTML = `
        <div class="flex gap-2" style="flex-wrap: wrap;">
            <div>
                <p><strong>KYC Status:</strong> ${kycBadge}</p>
                <p><strong>Risk Score:</strong> ${(currentBeneficiary.ai.riskScore * 100).toFixed(1)}%</p>
                <p><strong>Payout Method:</strong> ${currentBeneficiary.payoutMethod.type}</p>
            </div>
            <div>
                <p><strong>Account:</strong> ${currentBeneficiary.payoutMethod.accountNumber}</p>
                <p><strong>Bank:</strong> ${currentBeneficiary.payoutMethod.bankName}</p>
                ${currentBeneficiary.complianceFlags.length > 0 ? `<p><strong>Compliance:</strong> ${complianceFlags}</p>` : ''}
            </div>
        </div>
    `;
    
    infoDiv.style.display = 'block';
}

function onAmountChanged() {
    // Enable calculate button if amount is set
    const amount = document.getElementById('send-amount').value;
    const btn = document.getElementById('calculate-quote-btn');
    if (btn) {
        btn.disabled = !amount || amount <= 0;
    }
}

function onCurrencyChanged() {
    // Recalculate quote if already calculated
    const quoteResults = document.getElementById('quote-results');
    if (quoteResults.style.display !== 'none') {
        calculateQuote();
    }
}

// Quote Calculation
function calculateQuote() {
    if (!currentBeneficiary) {
        alert('Please select a beneficiary first');
        return;
    }
    
    const amount = parseFloat(document.getElementById('send-amount').value);
    const currency = document.getElementById('send-currency').value;
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return;
    }
    
    // Check KYC status
    if (currentBeneficiary.kycStatus === 'FAILED') {
        alert('Cannot process payment - Beneficiary KYC verification failed');
        return;
    }
    
    if (currentBeneficiary.kycStatus === 'PENDING') {
        if (!confirm('Beneficiary KYC is pending. Proceed anyway?')) {
            return;
        }
    }
    
    // FX Calculation
    let convertedAmount = amount;
    let fxRate = 1;
    
    if (currency !== 'INR') {
        const fxKey = `${currency}-INR`;
        fxRate = window.appData.fxRates[fxKey] || 1;
        convertedAmount = amount * fxRate;
    }
    
    // Display FX calculation
    const fxDiv = document.getElementById('fx-calculation');
    fxDiv.innerHTML = `
        <p><strong>Amount:</strong> ${amount} ${currency}</p>
        ${currency !== 'INR' ? `
            <p><strong>FX Rate:</strong> 1 ${currency} = ${fxRate.toFixed(4)} INR</p>
            <p><strong>INR Amount:</strong> ₹${convertedAmount.toFixed(2)}</p>
        ` : ''}
    `;
    
    // Route Selection
    displayRouteOptions(convertedAmount);
    
    document.getElementById('quote-results').style.display = 'block';
}

function displayRouteOptions(amount) {
    const routeDiv = document.getElementById('route-options');
    const availableConnectors = window.appData.connectors
        .filter(c => c.enabled && c.status === 'ACTIVE')
        .filter(c => amount <= window.appData.riskRules.maxTransactionAmount[c.type])
        .sort((a, b) => {
            // Sort by ETA first, then by fee
            const etaA = parseETAValue(a.avgETA);
            const etaB = parseETAValue(b.avgETA);
            if (etaA !== etaB) return etaA - etaB;
            return a.fee - b.fee;
        });
    
    routeDiv.innerHTML = '<h5>Available Routes:</h5>';
    
    availableConnectors.forEach((connector, index) => {
        const isSelected = index === 0; // Auto-select fastest
        if (isSelected) selectedConnector = connector;
        
        const routeOption = document.createElement('div');
        routeOption.className = `route-option ${isSelected ? 'selected' : ''}`;
        routeOption.onclick = () => selectRoute(connector, routeOption);
        
        routeOption.innerHTML = `
            <div class="route-info">
                <strong>${connector.name}</strong>
                <span class="connector-status ${connector.enabled ? 'enabled' : 'disabled'}">${connector.status}</span>
            </div>
            <div class="route-details">
                <span>ETA: ${connector.avgETA}</span>
                <span>Fee: ₹${connector.fee}</span>
                <span>Type: ${connector.type}</span>
            </div>
            ${isSelected ? '<small><strong>Recommended:</strong> Fastest ETA with lowest fee</small>' : ''}
        `;
        
        routeDiv.appendChild(routeOption);
    });
    
    // Show disabled connectors
    const disabledConnectors = window.appData.connectors
        .filter(c => !c.enabled || c.status !== 'ACTIVE');
    
    if (disabledConnectors.length > 0) {
        const disabledDiv = document.createElement('div');
        disabledDiv.innerHTML = '<h6>Unavailable Routes:</h6>';
        disabledConnectors.forEach(connector => {
            const reason = !connector.enabled ? 'Disabled' : 'Service Down';
            disabledDiv.innerHTML += `
                <div class="route-option" style="opacity: 0.5;">
                    <div class="route-info">
                        <strong>${connector.name}</strong>
                        <span class="connector-status ${connector.status === 'DOWN' ? 'down' : 'disabled'}">${reason}</span>
                    </div>
                </div>
            `;
        });
        routeDiv.appendChild(disabledDiv);
    }
    
    document.getElementById('send-payment-btn').disabled = false;
}

function parseETAValue(eta) {
    // Convert ETA to seconds for sorting
    if (eta.includes('s')) return parseInt(eta);
    if (eta.includes('m')) return parseInt(eta) * 60;
    if (eta.includes('h')) return parseInt(eta) * 3600;
    return 999999;
}

function selectRoute(connector, element) {
    document.querySelectorAll('.route-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    selectedConnector = connector;
}

// Transfer Initiation
function initiateTransfer() {
    if (!selectedConnector || !currentBeneficiary) {
        alert('Please select a route and beneficiary');
        return;
    }
    
    const amount = parseFloat(document.getElementById('send-amount').value);
    const currency = document.getElementById('send-currency').value;
    const purpose = document.getElementById('send-purpose').value;
    
    // Risk & Compliance Check
    const riskScore = calculateRiskScore(currentBeneficiary, amount);
    const complianceStatus = checkCompliance(currentBeneficiary, riskScore);
    
    if (complianceStatus === 'BLOCKED') {
        alert('Transfer blocked due to compliance issues');
        return;
    }
    
    if (complianceStatus === 'HOLD') {
        if (!confirm('High risk detected. Proceed with manual review?')) {
            return;
        }
    }
    
    // Create transfer object
    currentTransfer = {
        id: `T${Date.now()}`,
        beneficiaryId: currentBeneficiary.id,
        amount: amount,
        currency: currency,
        purpose: purpose,
        connector: selectedConnector,
        riskScore: riskScore,
        complianceStatus: complianceStatus,
        status: 'INITIATED',
        events: [],
        createdAt: new Date().toISOString()
    };
    
    // Show pipeline and start orchestration
    document.getElementById('orchestration-pipeline').style.display = 'block';
    startOrchestration();
}

function calculateRiskScore(beneficiary, amount) {
    let score = beneficiary.ai.riskScore;
    
    // Adjust based on amount
    const maxAmount = window.appData.riskRules.maxTransactionAmount[selectedConnector.type];
    if (amount > maxAmount * 0.8) {
        score += 0.2;
    }
    
    // Adjust based on compliance flags
    if (beneficiary.complianceFlags.includes('HIGH_RISK')) score += 0.3;
    if (beneficiary.complianceFlags.includes('PEP_MATCH')) score += 0.4;
    if (beneficiary.complianceFlags.includes('SANCTIONS_HIT')) score += 0.5;
    
    return Math.min(score, 1.0);
}

function checkCompliance(beneficiary, riskScore) {
    // Check sanctions
    if (beneficiary.complianceFlags.includes('SANCTIONS_HIT')) {
        return 'BLOCKED';
    }
    
    // Check risk thresholds
    if (riskScore > window.appData.riskRules.riskScoreThresholds.high) {
        return 'HOLD';
    }
    
    return 'CLEARED';
}

// Orchestration Pipeline
function startOrchestration() {
    addTransferEvent('INITIATED', { message: 'Transfer initiated' });
    
    // Step 1: Risk Check
    setTimeout(() => {
        activateStep('auth-risk');
        addTransferEvent('RISK_CHECK', { 
            riskScore: currentTransfer.riskScore,
            complianceStatus: currentTransfer.complianceStatus 
        });
        
        if (currentTransfer.complianceStatus === 'BLOCKED') {
            failTransfer('Compliance check failed');
            return;
        }
        
        // Step 2: Authorization
        setTimeout(() => {
            activateStep('auth-method');
            const authType = getAuthType(selectedConnector.type);
            simulateAuthorization(authType);
        }, 1000);
    }, 500);
}

function getAuthType(connectorType) {
    switch (connectorType) {
        case 'CARD': return '3DS';
        case 'UPI': return 'UPI_PIN';
        case 'BANK': return 'PENDING';
        default: return 'INSTANT';
    }
}

function simulateAuthorization(authType) {
    addTransferEvent('AUTHORIZING', { method: authType });
    
    let authDelay = 1000;
    if (authType === '3DS') authDelay = 3000;
    if (authType === 'PENDING') authDelay = 5000;
    
    setTimeout(() => {
        if (authType === 'PENDING') {
            addTransferEvent('AUTHORIZATION_PENDING', { message: 'Bank authorization pending' });
            activateStep('auth-complete');
            // For demo, auto-authorize after delay
            setTimeout(() => completeAuthorization(), 3000);
        } else {
            completeAuthorization();
        }
    }, authDelay);
}

function completeAuthorization() {
    activateStep('auth-complete');
    addTransferEvent('AUTHORIZED', { message: 'Payment authorized' });
    
    // Step 3: Route Selection
    setTimeout(() => {
        activateStep('route-select');
        addTransferEvent('ROUTING', { 
            selectedConnector: selectedConnector.id,
            reason: 'Fastest ETA selected'
        });
        
        // Step 4: Credit Instruction
        setTimeout(() => {
            highlightStep('credit-instruction');
            const instructionId = `CI${Date.now()}`;
            addTransferEvent('CREDIT_INSTRUCTION', { instructionId });
            
            // Step 5: Payout Request
            setTimeout(() => {
                activateStep('payout-confirm');
                addTransferEvent('PAYOUT_REQUEST', { message: 'Payout request sent to institution' });
                
                // Settlement
                setTimeout(() => {
                    processSettlement();
                }, 1500);
            }, 1000);
        }, 1000);
    }, 800);
}

function processSettlement() {
    activateStep('settlement-process');
    
    let settlementTime = 'Instant';
    let delay = 1000;
    
    if (selectedConnector.type === 'BANK' && selectedConnector.id !== 'imps-bank') {
        settlementTime = 'T+1';
        delay = 2000;
    }
    
    document.getElementById('settlement-time').textContent = settlementTime;
    addTransferEvent('SETTLEMENT_PENDING', { mode: settlementTime });
    
    setTimeout(() => {
        activateStep('settlement-confirm');
        addTransferEvent('SETTLEMENT_CONFIRMED', { message: 'Settlement confirmed' });
        
        setTimeout(() => {
            activateStep('final-status');
            currentTransfer.status = 'PAID';
            addTransferEvent('PAID', { message: 'Transfer completed successfully' });
            
            // Update beneficiary timeline
            updateBeneficiaryTimeline();
            
        }, 1000);
    }, delay);
}

function activateStep(stepId) {
    document.querySelectorAll('.pipeline-step').forEach(step => step.classList.remove('active'));
    document.getElementById(stepId)?.classList.add('active');
}

function highlightStep(stepId) {
    document.getElementById(stepId)?.classList.add('highlighted');
}

function addTransferEvent(type, data) {
    const event = {
        type: type,
        timestamp: new Date(),
        data: data || {}
    };
    
    currentTransfer.events.push(event);
    updateEventLog();
}

function updateEventLog() {
    const eventLog = document.getElementById('event-log');
    if (!eventLog) return;
    
    eventLog.innerHTML = '';
    
    currentTransfer.events.forEach(event => {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'alert alert-info';
        eventDiv.innerHTML = `
            <strong>${event.type}:</strong> ${event.data.message || JSON.stringify(event.data)}
            <br><small>${event.timestamp.toLocaleTimeString()}</small>
        `;
        eventLog.appendChild(eventDiv);
    });
    
    // Scroll to bottom
    eventLog.scrollTop = eventLog.scrollHeight;
}

function failTransfer(reason) {
    currentTransfer.status = 'FAILED';
    addTransferEvent('FAILED', { reason: reason });
    
    document.querySelectorAll('.pipeline-step').forEach(step => {
        step.style.borderColor = '#dc3545';
        step.style.background = '#f8d7da';
    });
}

function updateBeneficiaryTimeline() {
    // This would update the beneficiary's payment timeline
    // For demo purposes, we'll just show a success message
    setTimeout(() => {
        alert(`Payment of ₹${currentTransfer.amount} successfully sent to ${currentBeneficiary.name}`);
    }, 500);
}

// Reconciliation Functions
function loadReconciliation() {
    renderReconciliationTable();
}

function renderReconciliationTable() {
    const tbody = document.getElementById('reconciliation-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    window.appData.reconciliationData.forEach(recon => {
        const row = document.createElement('tr');
        const statusBadge = recon.status === 'MATCHED' ? 
            '<span class="badge badge-success">MATCHED</span>' :
            '<span class="badge badge-warning">MISMATCHED</span>';
        
        const differenceClass = recon.difference === 0 ? '' : 
                              recon.difference > 0 ? 'text-success' : 'text-danger';
        
        row.innerHTML = `
            <td>${recon.transferId}</td>
            <td>₹${recon.expectedAmount.toFixed(2)}</td>
            <td>₹${recon.actualAmount.toFixed(2)}</td>
            <td class="${differenceClass}">₹${recon.difference.toFixed(2)}</td>
            <td>${recon.reason || '-'}</td>
            <td>${statusBadge}</td>
            <td>
                ${recon.status === 'MISMATCHED' ? 
                    `<button class="btn btn-success btn-sm" onclick="resolveReconciliation('${recon.id}')">Mark Resolved</button>` :
                    '<span class="text-muted">-</span>'
                }
            </td>
        `;
        tbody.appendChild(row);
    });
}

function resolveReconciliation(reconId) {
    const recon = window.appData.reconciliationData.find(r => r.id === reconId);
    if (recon) {
        recon.status = 'RESOLVED';
        recon.resolvedAt = new Date().toISOString();
        renderReconciliationTable();
        alert(`Reconciliation ${reconId} marked as resolved`);
    }
}

// Beneficiary Registration Drawer
function openBeneficiaryDrawer() {
    document.getElementById('beneficiary-drawer-overlay').classList.add('active');
    document.getElementById('beneficiary-drawer').classList.add('open');
}

function closeBeneficiaryDrawer() {
    document.getElementById('beneficiary-drawer-overlay').classList.remove('active');
    document.getElementById('beneficiary-drawer').classList.remove('open');
}

function updatePayoutFields() {
    const methodType = document.getElementById('payout-method-type').value;
    const fieldsDiv = document.getElementById('payout-fields');
    
    if (!methodType) {
        fieldsDiv.innerHTML = '';
        return;
    }
    
    const method = window.appData.payoutMethods.find(m => m.type === methodType);
    if (!method) return;
    
    let fieldsHTML = '';
    method.fields.forEach(field => {
        const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        fieldsHTML += `
            <div class="form-group">
                <label for="payout-${field}">${label}</label>
                <input type="text" id="payout-${field}" placeholder="Enter ${label.toLowerCase()}">
            </div>
        `;
    });
    
    fieldsDiv.innerHTML = fieldsHTML;
}

function saveBeneficiary() {
    const name = document.getElementById('beneficiary-full-name').value;
    const type = document.getElementById('beneficiary-type').value;
    const country = document.getElementById('beneficiary-country').value;
    const currency = document.getElementById('beneficiary-currency').value;
    const kycStatus = document.getElementById('beneficiary-kyc').value;
    const riskScore = parseFloat(document.getElementById('beneficiary-risk-score').value);
    
    if (!name) {
        alert('Please enter beneficiary name');
        return;
    }
    
    // Collect compliance flags
    const flagCheckboxes = document.querySelectorAll('#beneficiary-drawer input[type="checkbox"]:checked');
    const complianceFlags = Array.from(flagCheckboxes).map(cb => cb.value);
    
    // Create new beneficiary
    const newBeneficiary = {
        id: `B${String(window.appData.beneficiaries.length + 1).padStart(3, '0')}`,
        name: name,
        type: type,
        country: country,
        currency: currency,
        kycStatus: kycStatus,
        ai: {
            riskScore: riskScore,
            reasons: riskScore > 0.7 ? ['High risk profile'] : ['New beneficiary']
        },
        complianceFlags: complianceFlags,
        payoutMethod: {
            type: document.getElementById('payout-method-type').value,
            // Additional fields would be collected here
        },
        // MCH Kit specific fields
        aadhaarMasked: 'XXXX XXXX XXXX ' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        mobile: '+91-98765' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'),
        district: 'Hyderabad',
        eligibilityStatus: kycStatus === 'VERIFIED' ? 'eligible' : 'pending',
        timeline: []
    };
    
    window.appData.beneficiaries.push(newBeneficiary);
    filteredBeneficiaries = [...window.appData.beneficiaries];
    
    alert(`Beneficiary ${name} registered successfully`);
    closeBeneficiaryDrawer();
    
    // Refresh beneficiaries table if on that screen
    if (document.getElementById('beneficiaries').classList.contains('active')) {
        renderBeneficiariesTable();
    }
}

// Settings - Connector Management
function loadSettings() {
    // Load existing settings
    document.getElementById('anc-amount').value = window.appData.stageAmounts.anc;
    document.getElementById('delivery-boy-amount').value = window.appData.stageAmounts.deliveryBoy;
    document.getElementById('delivery-girl-amount').value = window.appData.stageAmounts.deliveryGirl;
    document.getElementById('immunisation1-amount').value = window.appData.stageAmounts.immunisation1;
    document.getElementById('immunisation2-amount').value = window.appData.stageAmounts.immunisation2;
    document.getElementById('settlement-mode-setting').value = window.appData.settlementMode;
    
    // Load connectors
    renderConnectorsList();
}

function renderConnectorsList() {
    const connectorsDiv = document.getElementById('connectors-list');
    if (!connectorsDiv) return;
    
    connectorsDiv.innerHTML = '';
    
    window.appData.connectors.forEach((connector, index) => {
        const connectorCard = document.createElement('div');
        connectorCard.className = 'card';
        connectorCard.innerHTML = `
            <div class="flex flex-between flex-center">
                <div>
                    <h4>${connector.name}</h4>
                    <p><strong>Type:</strong> ${connector.type}</p>
                    <p><strong>ETA:</strong> ${connector.avgETA} | <strong>Fee:</strong> ₹${connector.fee}</p>
                    <p><strong>Priority:</strong> ${connector.priority}</p>
                </div>
                <div class="flex gap-1" style="flex-direction: column; align-items: flex-end;">
                    <div class="connector-status ${connector.enabled ? 'enabled' : 'disabled'}">
                        ${connector.status}
                    </div>
                    <label style="display: flex; align-items: center; gap: 0.5rem;">
                        <input type="checkbox" ${connector.enabled ? 'checked' : ''} 
                               onchange="toggleConnector('${connector.id}', this.checked)">
                        Enabled
                    </label>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-sm" onclick="moveConnectorUp(${index})">↑</button>
                        <button class="btn btn-sm" onclick="moveConnectorDown(${index})">↓</button>
                    </div>
                </div>
            </div>
        `;
        connectorsDiv.appendChild(connectorCard);
    });
}

function toggleConnector(connectorId, enabled) {
    const connector = window.appData.connectors.find(c => c.id === connectorId);
    if (connector) {
        connector.enabled = enabled;
        renderConnectorsList();
    }
}

function moveConnectorUp(index) {
    if (index > 0) {
        [window.appData.connectors[index], window.appData.connectors[index - 1]] = 
        [window.appData.connectors[index - 1], window.appData.connectors[index]];
        
        // Update priorities
        window.appData.connectors.forEach((connector, idx) => {
            connector.priority = idx + 1;
        });
        
        renderConnectorsList();
    }
}

function moveConnectorDown(index) {
    if (index < window.appData.connectors.length - 1) {
        [window.appData.connectors[index], window.appData.connectors[index + 1]] = 
        [window.appData.connectors[index + 1], window.appData.connectors[index]];
        
        // Update priorities
        window.appData.connectors.forEach((connector, idx) => {
            connector.priority = idx + 1;
        });
        
        renderConnectorsList();
    }
}

// Drawer overlay click handler
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('drawer-overlay')) {
        closeBeneficiaryDrawer();
    }
});