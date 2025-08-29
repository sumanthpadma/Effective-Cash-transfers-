// Main application JavaScript for Telangana MCH Kit G2P Dashboard

// Global variables
let currentBeneficiary = null;
let filteredBeneficiaries = [];
let filteredFraudSignals = [];

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
            case 'beneficiaries':
                loadBeneficiaries();
                break;
            case 'profile':
                loadProfile();
                break;
            case 'payments':
                loadPayments();
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
        
        row.innerHTML = `
            <td>${beneficiary.name}</td>
            <td>${beneficiary.aadhaarMasked}</td>
            <td>${beneficiary.district}</td>
            <td>${statusBadge}</td>
            <td>${riskBadge}</td>
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
    }
});