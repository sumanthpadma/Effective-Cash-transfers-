// Mock data for Telangana MCH Kit G2P system

// Stage configuration
const stageAmounts = {
    anc: 3000,
    deliveryBoy: 4000,
    deliveryGirl: 5000,
    immunisation1: 2000,
    immunisation2: 3000
};

// Settlement mode configuration
let settlementMode = 'RTGS';

// Payment Connectors and Routing
const connectors = [
    {
        id: 'upi-npci',
        name: 'UPI-NPCI',
        type: 'UPI',
        enabled: true,
        priority: 1,
        avgETA: '5s',
        fee: 0,
        countries: ['IN'],
        currencies: ['INR'],
        status: 'ACTIVE'
    },
    {
        id: 'imps-bank',
        name: 'IMPS Banking',
        type: 'BANK',
        enabled: true,
        priority: 2,
        avgETA: '30s',
        fee: 2,
        countries: ['IN'],
        currencies: ['INR'],
        status: 'ACTIVE'
    },
    {
        id: 'rtgs-rbi',
        name: 'RTGS-RBI',
        type: 'BANK',
        enabled: true,
        priority: 3,
        avgETA: '2h',
        fee: 25,
        countries: ['IN'],
        currencies: ['INR'],
        status: 'ACTIVE'
    },
    {
        id: 'card-visa',
        name: 'Visa Direct',
        type: 'CARD',
        enabled: false,
        priority: 4,
        avgETA: '1m',
        fee: 15,
        countries: ['IN', 'US', 'GB'],
        currencies: ['INR', 'USD', 'GBP'],
        status: 'DOWN'
    },
    {
        id: 'wallet-paytm',
        name: 'Paytm Wallet',
        type: 'WALLET',
        enabled: true,
        priority: 5,
        avgETA: '10s',
        fee: 1,
        countries: ['IN'],
        currencies: ['INR'],
        status: 'ACTIVE'
    }
];

// FX Rates (mock)
const fxRates = {
    'INR-USD': 0.012,
    'INR-EUR': 0.011,
    'INR-GBP': 0.0095,
    'USD-INR': 83.2,
    'EUR-INR': 91.5,
    'GBP-INR': 105.8
};

// Risk & Compliance Rules
const riskRules = {
    maxTransactionAmount: {
        UPI: 100000,
        BANK: 1000000,
        CARD: 200000,
        WALLET: 50000
    },
    sanctionsLists: ['PEP_LIST', 'OFAC_LIST', 'EU_SANCTIONS'],
    velocityLimits: {
        daily: 500000,
        monthly: 2000000
    },
    riskScoreThresholds: {
        low: 0.3,
        medium: 0.7,
        high: 1.0
    }
};

// Beneficiary Types and KYC Status
const beneficiaryTypes = ['PERSON', 'BUSINESS'];
const kycStatuses = ['PENDING', 'VERIFIED', 'FAILED'];
const payoutMethods = [
    { type: 'BANK', name: 'Bank Account', fields: ['accountNumber', 'routingCode', 'bankName'] },
    { type: 'UPI', name: 'UPI ID', fields: ['upiId'] },
    { type: 'WALLET', name: 'Mobile Wallet', fields: ['walletId', 'provider'] },
    { type: 'CARD', name: 'Debit Card', fields: ['cardNumber', 'expiryDate'] },
    { type: 'MPESA', name: 'M-Pesa', fields: ['phoneNumber'] }
];

// Transfer States
const transferStates = {
    INITIATED: 'Payment initiated',
    ROUTING: 'Selecting optimal route',
    AUTHORIZING: 'Authorization in progress',
    AUTHORIZED: 'Payment authorized',
    CREDIT_INSTRUCTION: 'Credit instruction issued',
    SETTLEMENT_PENDING: 'Settlement in progress',
    SETTLEMENT_CONFIRMED: 'Settlement confirmed',
    PAID: 'Payment completed',
    HELD: 'Payment held',
    FAILED: 'Payment failed',
    CANCELLED: 'Payment cancelled'
};

// Districts in Telangana
const districts = [
    'Hyderabad', 'Warangal', 'Khammam', 'Nizamabad', 'Karimnagar', 
    'Mahbubnagar', 'Rangareddy', 'Nalgonda', 'Medak', 'Adilabad'
];

// Helper function to generate random dates
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to mask Aadhaar number
function maskAadhaar(aadhaar) {
    return aadhaar.substring(0, 4) + ' XXXX XXXX ' + aadhaar.substring(8, 12);
}

// Generate beneficiaries data
const beneficiaries = [
    {
        id: 'B001',
        name: 'Lakshmi Devi',
        aadhaarMasked: maskAadhaar('123456789012'),
        mobile: '+91-9876543210',
        district: 'Hyderabad',
        phcId: 'PHC001',
        deliveriesCount: 1,
        childGender: 'girl',
        constraints: {
            resident: true,
            aadhaarLinked: true,
            govtHospital: true,
            maxDeliveries: true,
            maxChildren: true
        },
        migration: null,
        disasterFlags: [],
        ai: {
            riskScore: 0.2,
            reasons: ['Clean transaction history', 'Verified documents']
        },
        timeline: [
            { stage: 'ANC', amount: 3000, status: 'PAID', date: '2024-01-15', paymentId: 'P001' },
            { stage: 'Delivery', amount: 5000, status: 'PAID', date: '2024-06-10', paymentId: 'P002' },
            { stage: 'Immunisation 1', amount: 2000, status: 'DUE', date: null, paymentId: null },
            { stage: 'Immunisation 2', amount: 3000, status: 'DUE', date: null, paymentId: null }
        ],
        eligibilityStatus: 'eligible'
    },
    {
        id: 'B002',
        name: 'Sunita Reddy',
        aadhaarMasked: maskAadhaar('234567890123'),
        mobile: '+91-9876543211',
        district: 'Warangal',
        phcId: 'PHC002',
        deliveriesCount: 1,
        childGender: 'boy',
        constraints: {
            resident: true,
            aadhaarLinked: true,
            govtHospital: true,
            maxDeliveries: true,
            maxChildren: true
        },
        migration: null,
        disasterFlags: [],
        ai: {
            riskScore: 0.7,
            reasons: ['Unusual transaction velocity', 'Geographic risk factors']
        },
        timeline: [
            { stage: 'ANC', amount: 3000, status: 'PAID', date: '2024-02-20', paymentId: 'P003' },
            { stage: 'Delivery', amount: 4000, status: 'PAID', date: '2024-07-15', paymentId: 'P004' },
            { stage: 'Immunisation 1', amount: 2000, status: 'PAID', date: '2024-10-15', paymentId: 'P005' },
            { stage: 'Immunisation 2', amount: 3000, status: 'DUE', date: null, paymentId: null }
        ],
        eligibilityStatus: 'eligible'
    },
    {
        id: 'B003',
        name: 'Ramya Kumari',
        aadhaarMasked: maskAadhaar('345678901234'),
        mobile: '+91-9876543212',
        district: 'Khammam',
        phcId: 'PHC003',
        deliveriesCount: 2,
        childGender: 'girl',
        constraints: {
            resident: true,
            aadhaarLinked: false,
            govtHospital: true,
            maxDeliveries: true,
            maxChildren: true
        },
        migration: {
            from: 'Khammam',
            to: 'Hyderabad',
            reason: 'flood'
        },
        disasterFlags: ['flood_affected', 'displaced'],
        ai: {
            riskScore: 0.9,
            reasons: ['Bank account mismatch', 'Identity verification pending']
        },
        timeline: [
            { stage: 'ANC', amount: 3000, status: 'HELD', date: null, paymentId: null },
            { stage: 'Delivery', amount: 5000, status: 'DUE', date: null, paymentId: null },
            { stage: 'Immunisation 1', amount: 2000, status: 'DUE', date: null, paymentId: null },
            { stage: 'Immunisation 2', amount: 3000, status: 'DUE', date: null, paymentId: null }
        ],
        eligibilityStatus: 'ineligible'
    },
    {
        id: 'B004',
        name: 'Kavitha Naik',
        aadhaarMasked: maskAadhaar('456789012345'),
        mobile: '+91-9876543213',
        district: 'Nizamabad',
        phcId: 'PHC004',
        deliveriesCount: 1,
        childGender: 'boy',
        constraints: {
            resident: true,
            aadhaarLinked: true,
            govtHospital: true,
            maxDeliveries: true,
            maxChildren: true
        },
        migration: null,
        disasterFlags: [],
        ai: {
            riskScore: 0.1,
            reasons: ['Verified beneficiary', 'Regular compliance']
        },
        timeline: [
            { stage: 'ANC', amount: 3000, status: 'PAID', date: '2024-03-10', paymentId: 'P006' },
            { stage: 'Delivery', amount: 4000, status: 'PAID', date: '2024-08-05', paymentId: 'P007' },
            { stage: 'Immunisation 1', amount: 2000, status: 'DUE', date: null, paymentId: null },
            { stage: 'Immunisation 2', amount: 3000, status: 'DUE', date: null, paymentId: null }
        ],
        eligibilityStatus: 'eligible'
    },
    {
        id: 'B005',
        name: 'Anitha Singh',
        aadhaarMasked: maskAadhaar('567890123456'),
        mobile: '+91-9876543214',
        district: 'Khammam',
        phcId: 'PHC005',
        deliveriesCount: 1,
        childGender: 'girl',
        constraints: {
            resident: true,
            aadhaarLinked: true,
            govtHospital: true,
            maxDeliveries: true,
            maxChildren: true
        },
        migration: {
            from: 'Khammam',
            to: 'Warangal',
            reason: 'flood'
        },
        disasterFlags: ['flood_affected'],
        ai: {
            riskScore: 0.3,
            reasons: ['Disaster affected', 'Migration updated']
        },
        timeline: [
            { stage: 'ANC', amount: 3000, status: 'PAID', date: '2024-01-25', paymentId: 'P008' },
            { stage: 'Delivery', amount: 5000, status: 'PAID', date: '2024-06-20', paymentId: 'P009' },
            { stage: 'Immunisation 1', amount: 2000, status: 'PAID', date: '2024-09-20', paymentId: 'P010' },
            { stage: 'Immunisation 2', amount: 3000, status: 'DUE', date: null, paymentId: null }
        ],
        eligibilityStatus: 'eligible'
    }
];

// Generate additional beneficiaries to reach 30-50 records
const additionalNames = [
    'Priya Sharma', 'Meena Patel', 'Radha Krishna', 'Sita Rani', 'Geetha Devi',
    'Padma Laxmi', 'Shanti Bai', 'Kamala Kumari', 'Vijaya Devi', 'Saroja Reddy',
    'Yamuna Devi', 'Saraswati Naik', 'Durga Prasad', 'Manjula Rao', 'Pushpa Devi',
    'Latha Kumari', 'Sudha Rani', 'Usha Devi', 'Vani Reddy', 'Swathi Naik',
    'Jyothi Devi', 'Kiran Kumari', 'Madhavi Rao', 'Nirmala Devi', 'Pallavi Reddy',
    'Rekha Singh', 'Shobha Naik', 'Tulasi Devi', 'Uma Rani', 'Vasantha Kumari'
];

for (let i = 0; i < 30; i++) {
    const id = `B${String(i + 6).padStart(3, '0')}`;
    const name = additionalNames[i];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const childGender = Math.random() > 0.5 ? 'girl' : 'boy';
    const deliveriesCount = Math.floor(Math.random() * 2) + 1;
    const isDisasterAffected = district === 'Khammam' && Math.random() > 0.7;
    const riskScore = Math.random();
    
    // Determine eligibility status
    let eligibilityStatus = 'eligible';
    const constraints = {
        resident: true,
        aadhaarLinked: Math.random() > 0.1,
        govtHospital: Math.random() > 0.05,
        maxDeliveries: deliveriesCount <= 2,
        maxChildren: deliveriesCount <= 2
    };
    
    if (!Object.values(constraints).every(c => c)) {
        eligibilityStatus = 'ineligible';
    }

    // Generate timeline based on eligibility and payments
    const timeline = [];
    const stages = ['ANC', 'Delivery', 'Immunisation 1', 'Immunisation 2'];
    const amounts = [stageAmounts.anc, childGender === 'girl' ? stageAmounts.deliveryGirl : stageAmounts.deliveryBoy, stageAmounts.immunisation1, stageAmounts.immunisation2];
    
    for (let j = 0; j < stages.length; j++) {
        let status = 'DUE';
        let date = null;
        let paymentId = null;
        
        if (eligibilityStatus === 'eligible') {
            if (j < 2 || (j === 2 && Math.random() > 0.3)) {
                status = Math.random() > 0.1 ? 'PAID' : 'HELD';
                if (status === 'PAID') {
                    date = randomDate(new Date(2024, 0, 1), new Date(2024, 10, 30)).toISOString().split('T')[0];
                    paymentId = `P${String(Math.floor(Math.random() * 1000) + 100)}`;
                }
            }
        } else {
            if (Math.random() > 0.7) {
                status = 'HELD';
            }
        }
        
        timeline.push({
            stage: stages[j],
            amount: amounts[j],
            status: status,
            date: date,
            paymentId: paymentId
        });
    }

    const beneficiary = {
        id: id,
        name: name,
        aadhaarMasked: maskAadhaar(`${Math.floor(Math.random() * 900000000000) + 100000000000}`),
        mobile: `+91-98765432${String(i + 15).padStart(2, '0')}`,
        district: district,
        phcId: `PHC${String(Math.floor(Math.random() * 50) + 1).padStart(3, '0')}`,
        deliveriesCount: deliveriesCount,
        childGender: childGender,
        constraints: constraints,
        migration: isDisasterAffected && Math.random() > 0.5 ? {
            from: district,
            to: districts[Math.floor(Math.random() * districts.length)],
            reason: 'flood'
        } : null,
        disasterFlags: isDisasterAffected ? ['flood_affected'] : [],
        ai: {
            riskScore: riskScore,
            reasons: riskScore > 0.7 ? ['High transaction velocity', 'Geographic risk'] : 
                    riskScore > 0.4 ? ['Medium risk profile'] : 
                    ['Low risk', 'Verified documents']
        },
        timeline: timeline,
        eligibilityStatus: eligibilityStatus
    };
    
    beneficiaries.push(beneficiary);
}

// Generate payments data
const payments = [];
beneficiaries.forEach(beneficiary => {
    beneficiary.timeline.forEach(stage => {
        if (stage.status === 'PAID' && stage.paymentId) {
            const payment = {
                id: stage.paymentId,
                beneficiaryId: beneficiary.id,
                beneficiaryName: beneficiary.name,
                stage: stage.stage,
                amount: stage.amount,
                createdAt: stage.date,
                path: {
                    pfms: new Date(stage.date + 'T08:00:00').toISOString(),
                    treasury: new Date(stage.date + 'T08:15:00').toISOString(),
                    remitterBank: new Date(stage.date + 'T08:30:00').toISOString(),
                    npci: new Date(stage.date + 'T08:45:00').toISOString(),
                    creditInstructionAt: new Date(stage.date + 'T09:00:00').toISOString(),
                    beneficiaryBank: new Date(stage.date + 'T09:15:00').toISOString(),
                    settlement: {
                        mode: settlementMode,
                        time: new Date(stage.date + 'T09:30:00').toISOString()
                    }
                },
                status: 'SUCCESS'
            };
            payments.push(payment);
        }
    });
});

// Generate fraud signals
const fraudSignals = [
    {
        id: 'F001',
        beneficiaryId: 'B002',
        type: 'BEHAVIOR',
        details: 'Multiple rapid transactions from different locations',
        severity: 'HIGH'
    },
    {
        id: 'F002',
        beneficiaryId: 'B003',
        type: 'IDENTITY',
        details: 'Aadhaar-bank account name mismatch',
        severity: 'CRITICAL'
    },
    {
        id: 'F003',
        beneficiaryId: 'B007',
        type: 'TRANSACTION',
        details: 'Amount threshold exceeded for stage',
        severity: 'MEDIUM'
    },
    {
        id: 'F004',
        beneficiaryId: 'B012',
        type: 'BEHAVIOR',
        details: 'Device fingerprint anomaly detected',
        severity: 'HIGH'
    },
    {
        id: 'F005',
        beneficiaryId: 'B018',
        type: 'TRANSACTION',
        details: 'Duplicate payment request within 24 hours',
        severity: 'HIGH'
    },
    {
        id: 'F006',
        beneficiaryId: 'B025',
        type: 'IDENTITY',
        details: 'KYC verification pending for over 30 days',
        severity: 'MEDIUM'
    }
];

// Nudge message templates
const nudgeTemplates = {
    'document-upload': {
        sms: 'Dear beneficiary, please upload required documents for MCH payment. Visit nearest PHC or call 1800-XXX-XXXX.',
        ivr: 'This is an automated reminder to complete your document submission for MCH scheme benefits.',
        whatsapp: '📋 Documents Required: Please submit your hospital delivery certificate and Aadhaar verification for MCH payment processing.'
    },
    'bank-verification': {
        sms: 'Bank account verification needed for MCH payment. Please visit PHC with passbook. Call 1800-XXX-XXXX for help.',
        ivr: 'Your bank account requires verification for MCH scheme payment processing.',
        whatsapp: '🏦 Bank Verification: Please verify your bank account details at the nearest PHC to receive your MCH payment.'
    },
    'hospital-visit': {
        sms: 'Reminder: Hospital visit due for MCH checkup. Visit govt hospital with ID. Call 1800-XXX-XXXX.',
        ivr: 'This is a reminder for your scheduled hospital visit under MCH scheme.',
        whatsapp: '🏥 Hospital Visit: Time for your scheduled checkup. Please visit your registered government hospital.'
    },
    'immunization': {
        sms: 'Child immunization due for MCH payment. Visit PHC for vaccination. Call 1800-XXX-XXXX.',
        ivr: 'Your child\'s immunization is due under the MCH scheme.',
        whatsapp: '💉 Immunization Due: Please bring your child for scheduled vaccination to receive MCH payment.'
    }
};

// Mock Transfers for orchestration demo
const transfers = [
    {
        id: 'T001',
        beneficiaryId: 'B001',
        amount: 3000,
        currency: 'INR',
        status: 'PAID',
        connector: connectors[0],
        routingReason: 'Fastest ETA selected',
        authorizationType: 'UPI_PIN',
        authorizationStatus: 'AUTHORIZED',
        riskScore: 0.2,
        complianceStatus: 'CLEARED',
        creditInstructionId: 'CI001',
        settlementMode: 'INSTANT',
        events: [
            { type: 'INITIATED', timestamp: new Date('2024-01-15T08:00:00'), data: {} },
            { type: 'ROUTING', timestamp: new Date('2024-01-15T08:00:01'), data: { selectedConnector: 'upi-npci' } },
            { type: 'AUTHORIZING', timestamp: new Date('2024-01-15T08:00:02'), data: { method: 'UPI_PIN' } },
            { type: 'AUTHORIZED', timestamp: new Date('2024-01-15T08:00:05'), data: {} },
            { type: 'CREDIT_INSTRUCTION', timestamp: new Date('2024-01-15T08:00:06'), data: { instructionId: 'CI001' } },
            { type: 'SETTLEMENT_CONFIRMED', timestamp: new Date('2024-01-15T08:00:10'), data: {} },
            { type: 'PAID', timestamp: new Date('2024-01-15T08:00:11'), data: {} }
        ],
        createdAt: '2024-01-15T08:00:00',
        completedAt: '2024-01-15T08:00:11'
    }
];

// Mock Reconciliation Data
const reconciliationData = [
    {
        id: 'R001',
        transferId: 'T001',
        expectedAmount: 3000,
        actualAmount: 2998,
        difference: -2,
        status: 'MISMATCHED',
        reason: 'Processing fee deducted',
        resolvedAt: null
    },
    {
        id: 'R002',
        transferId: 'P005',
        expectedAmount: 2000,
        actualAmount: 2000,
        difference: 0,
        status: 'MATCHED',
        reason: null,
        resolvedAt: '2024-10-15T12:00:00'
    },
    {
        id: 'R003',
        transferId: 'P007',
        expectedAmount: 4000,
        actualAmount: 4005,
        difference: 5,
        status: 'MISMATCHED',
        reason: 'Exchange rate variance',
        resolvedAt: null
    }
];

// Enhanced Beneficiary Data with KYC and Payout Methods
function enhanceBeneficiariesWithKYC() {
    beneficiaries.forEach((beneficiary, index) => {
        beneficiary.type = 'PERSON';
        beneficiary.kycStatus = index < 3 ? 'VERIFIED' : 
                              index < 6 ? 'PENDING' : 
                              index < 8 ? 'FAILED' : 'VERIFIED';
        beneficiary.payoutMethod = {
            type: 'BANK',
            accountNumber: `*****${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
            routingCode: `SBIN000${Math.floor(Math.random() * 999)}`,
            bankName: 'State Bank of India'
        };
        beneficiary.complianceFlags = [];
        
        // Add some compliance flags for demo
        if (beneficiary.ai.riskScore > 0.7) {
            beneficiary.complianceFlags.push('HIGH_RISK');
        }
        if (Math.random() < 0.05) {
            beneficiary.complianceFlags.push('PEP_MATCH');
        }
        if (Math.random() < 0.02) {
            beneficiary.complianceFlags.push('SANCTIONS_HIT');
        }
    });
}

enhanceBeneficiariesWithKYC();

// Export data for use in app.js
window.appData = {
    beneficiaries,
    payments,
    fraudSignals,
    stageAmounts,
    settlementMode,
    districts,
    nudgeTemplates,
    // New orchestration data
    connectors,
    fxRates,
    riskRules,
    beneficiaryTypes,
    kycStatuses,
    payoutMethods,
    transferStates,
    transfers,
    reconciliationData
};