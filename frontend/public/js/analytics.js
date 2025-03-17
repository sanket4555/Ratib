document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    setupEventListeners();
    initializeCharts();
    loadAnalytics();
});

function setupEventListeners() {
    // Logout handler
    document.getElementById('logout').addEventListener('click', handleLogout);

    // Date filter
    document.getElementById('apply-filter').addEventListener('click', loadAnalytics);

    // Mobile menu
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(menuToggle);

    menuToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });
}

function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart').getContext('2d');
    new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue',
                data: [],
                borderColor: '#2ecc71',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Subscription Chart
    const subscriptionCtx = document.getElementById('subscriptionChart').getContext('2d');
    new Chart(subscriptionCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'New Subscriptions',
                data: [],
                backgroundColor: '#3498db'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Newspaper Popularity Chart
    const newspaperCtx = document.getElementById('newspaperChart').getContext('2d');
    new Chart(newspaperCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#2ecc71',
                    '#3498db',
                    '#9b59b6',
                    '#e74c3c',
                    '#f1c40f'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Demographics Chart
    const demographicsCtx = document.getElementById('demographicsChart').getContext('2d');
    new Chart(demographicsCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#2ecc71',
                    '#3498db',
                    '#9b59b6',
                    '#e74c3c'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

async function loadAnalytics() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    try {
        const response = await fetch(`/api/admin/analytics?start=${startDate}&end=${endDate}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch analytics data');
        }

        const data = await response.json();
        updateCharts(data);
        updateDetailedStats(data);
    } catch (error) {
        console.error('Error loading analytics:', error);
        alert('Failed to load analytics data');
    }
}

function updateCharts(data) {
    // Update each chart with the new data
    updateRevenueChart(data.revenue);
    updateSubscriptionChart(data.subscriptions);
    updateNewspaperChart(data.newspapers);
    updateDemographicsChart(data.demographics);
}

function updateDetailedStats(data) {
    const tbody = document.getElementById('detailed-stats-body');
    tbody.innerHTML = '';

    const stats = [
        {
            metric: 'Total Revenue',
            current: formatCurrency(data.currentRevenue),
            previous: formatCurrency(data.previousRevenue),
            change: calculateChange(data.currentRevenue, data.previousRevenue)
        },
        // Add more metrics as needed
    ];

    stats.forEach(stat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${stat.metric}</td>
            <td>${stat.current}</td>
            <td>${stat.previous}</td>
            <td class="${stat.change >= 0 ? 'positive' : 'negative'}">
                ${stat.change}%
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

function calculateChange(current, previous) {
    if (!previous) return 0;
    return (((current - previous) / previous) * 100).toFixed(2);
} 