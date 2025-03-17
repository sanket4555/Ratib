document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    // Load all dashboard data
    loadDashboardData();
    loadCustomerGrowth();
    loadNewsInterests();
    loadAgencyPerformance();
    
    // Setup navigation
    setupNavigation();

    // Setup event listeners
    document.getElementById('add-agency-btn')?.addEventListener('click', showAddAgencyModal);
    document.getElementById('agency-form')?.addEventListener('submit', handleAddAgency);
    document.getElementById('logout')?.addEventListener('click', handleLogout);

    // Add mobile menu toggle
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(menuToggle);

    menuToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
    });

    // Handle logout
    document.getElementById('logout').addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.querySelector('.menu-toggle');
        
        if (sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !toggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });

    // Highlight current page in navigation
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
});

async function loadDashboardData() {
    try {
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();

        // Update stats
        document.getElementById('total-customers').textContent = data.totalCustomers;
        document.getElementById('active-agencies').textContent = data.activeAgencies;
        document.getElementById('total-revenue').textContent = `₹${data.totalRevenue.toLocaleString()}`;
        document.getElementById('active-subscriptions').textContent = data.activeSubscriptions;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadCustomerGrowth() {
    try {
        const response = await fetch('/api/admin/stats/customer-growth', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();

        const months = data.map(item => {
            const date = new Date(0);
            date.setMonth(item._id.month - 1);
            return date.toLocaleString('default', { month: 'short' });
        });
        const counts = data.map(item => item.count);

        const customerCtx = document.getElementById('customerGrowthChart').getContext('2d');
        new Chart(customerCtx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: 'New Customers',
                    data: counts,
                    borderColor: '#3498db',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    } catch (error) {
        console.error('Error loading customer growth data:', error);
    }
}

async function loadNewsInterests() {
    try {
        const response = await fetch('/api/admin/stats/news-interests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();

        const labels = data.map(item => item._id);
        const counts = data.map(item => item.count);

        const interestsCtx = document.getElementById('interestsChart').getContext('2d');
        new Chart(interestsCtx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: [
                        '#3498db',
                        '#e74c3c',
                        '#2ecc71',
                        '#f1c40f',
                        '#9b59b6'
                    ]
                }]
            }
        });
    } catch (error) {
        console.error('Error loading news interests data:', error);
    }
}

async function loadAgencyPerformance() {
    try {
        const response = await fetch('/api/admin/stats/agency-performance', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();

        const performanceChart = new ApexCharts(document.querySelector("#agencyPerformanceChart"), {
            series: [{
                name: 'Subscriptions',
                data: data.map(agency => agency.subscriptionCount)
            }],
            chart: {
                type: 'bar',
                height: 250
            },
            xaxis: {
                categories: data.map(agency => agency.name)
            },
            colors: ['#3498db']
        });
        performanceChart.render();
    } catch (error) {
        console.error('Error loading agency performance data:', error);
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('section');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            const page = link.dataset.page;
            if (page) {
                // Update active link
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Show active section
                sections.forEach(section => {
                    section.classList.remove('active-section');
                    if (section.id === `${page}-section`) {
                        section.classList.add('active-section');
                    }
                });
            }
        });
    });
}

function showAddAgencyModal() {
    document.getElementById('agency-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('agency-modal').style.display = 'none';
}

async function handleAddAgency(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('agency-name').value,
        email: document.getElementById('agency-email').value,
        contact: document.getElementById('agency-contact').value,
        owner: document.getElementById('agency-owner').value
    };

    try {
        const response = await fetch('/api/admin/agencies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
            alert('Agency added successfully!');
            closeModal();
            // Reload agencies list
            loadAgencies();
        } else {
            alert(data.message || 'Failed to add agency');
        }
    } catch (error) {
        console.error('Error adding agency:', error);
        alert('An error occurred while adding the agency');
    }
}

function handleLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/admin/login';
}

function setupEventListeners() {
    // ... existing code ...

    // Update logout handler
    document.getElementById('logout').addEventListener('click', handleLogout);
} 