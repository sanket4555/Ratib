document.addEventListener('DOMContentLoaded', () => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/admin/login';
        return;
    }

    loadAgencies();
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('agency-search').addEventListener('input', filterAgencies);
    
    // Status filter
    document.getElementById('status-filter').addEventListener('change', filterAgencies);
    
    // Edit form submission
    document.getElementById('edit-agency-form').addEventListener('submit', handleEditAgency);

    // Add agency button
    document.getElementById('add-agency-btn')?.addEventListener('click', () => {
        document.getElementById('agency-modal').style.display = 'block';
    });

    // Update logout handler
    document.getElementById('logout').addEventListener('click', handleLogout);

    // Add mobile menu toggle
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(menuToggle);

    menuToggle.addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('active');
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
}

async function loadAgencies() {
    try {
        const response = await fetch('/api/admin/agencies', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const agencies = await response.json();
        console.log('Loaded agencies:', agencies);
        displayAgencies(agencies);
    } catch (error) {
        console.error('Error loading agencies:', error);
        alert('Failed to load agencies. Please check console for details.');
    }
}

function displayAgencies(agencies) {
    const tbody = document.getElementById('agencies-list');
    tbody.innerHTML = '';

    if (agencies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">No agencies found</td>
            </tr>
        `;
        return;
    }

    agencies.forEach(agency => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${agency.name}</td>
            <td>${agency.owner}</td>
            <td>${agency.contact}</td>
            <td>${agency.newspapers ? agency.newspapers.join(', ') : 'N/A'}</td>
            <td>
                <span class="status-badge ${agency.status}">
                    ${agency.status}
                </span>
            </td>
            <td class="actions">
                <button onclick="editAgency('${agency._id}')" class="edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="toggleAgencyStatus('${agency._id}', '${agency.status}')" class="toggle-btn">
                    ${agency.status === 'active' ? 'Suspend' : 'Activate'}
                </button>
                <button onclick="deleteAgency('${agency._id}')" class="delete-btn">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function editAgency(agencyId) {
    try {
        const response = await fetch(`/api/admin/agencies/${agencyId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch agency details');
        }

        const agency = await response.json();
        
        // Populate the edit form
        document.getElementById('edit-agency-id').value = agency._id;
        document.getElementById('edit-agency-name').value = agency.name;
        document.getElementById('edit-agency-email').value = agency.email;
        document.getElementById('edit-agency-contact').value = agency.contact;
        document.getElementById('edit-agency-owner').value = agency.owner;
        document.getElementById('edit-newspaper-names').value = agency.newspapers.join('\n');
        document.getElementById('edit-agency-status').value = agency.status;

        // Show the modal
        document.getElementById('edit-agency-modal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching agency details:', error);
        alert('Failed to load agency details');
    }
}

async function handleEditAgency(e) {
    e.preventDefault();
    const agencyId = document.getElementById('edit-agency-id').value;

    try {
        const response = await fetch(`/api/admin/agencies/${agencyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({
                name: document.getElementById('edit-agency-name').value,
                email: document.getElementById('edit-agency-email').value,
                contact: document.getElementById('edit-agency-contact').value,
                owner: document.getElementById('edit-agency-owner').value,
                newspapers: document.getElementById('edit-newspaper-names').value.split('\n').filter(n => n.trim()),
                status: document.getElementById('edit-agency-status').value
            })
        });

        if (response.ok) {
            closeEditModal();
            loadAgencies();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to update agency');
        }
    } catch (error) {
        console.error('Error updating agency:', error);
        alert('Failed to update agency');
    }
}

async function toggleAgencyStatus(agencyId, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    
    try {
        const response = await fetch(`/api/admin/agencies/${agencyId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            loadAgencies();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to update agency status');
        }
    } catch (error) {
        console.error('Error updating agency status:', error);
        alert('Failed to update agency status');
    }
}

async function deleteAgency(agencyId) {
    if (!confirm('Are you sure you want to delete this agency? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/admin/agencies/${agencyId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });

        if (response.ok) {
            loadAgencies();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete agency');
        }
    } catch (error) {
        console.error('Error deleting agency:', error);
        alert('Failed to delete agency');
    }
}

function filterAgencies() {
    const searchTerm = document.getElementById('agency-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const rows = document.querySelectorAll('#agencies-list tr');

    rows.forEach(row => {
        const name = row.cells[0].textContent.toLowerCase();
        const status = row.cells[4].textContent.trim().toLowerCase();
        const matchesSearch = name.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || status === statusFilter;
        row.style.display = matchesSearch && matchesStatus ? '' : 'none';
    });
}

function closeEditModal() {
    document.getElementById('edit-agency-modal').style.display = 'none';
}

// Add these functions for debugging
function checkToken() {
    const token = localStorage.getItem('adminToken');
    console.log('Admin token:', token);
    return token;
}

function testApiEndpoint() {
    fetch('/api/admin/agencies', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('API response:', data);
    })
    .catch(error => {
        console.error('API error:', error);
    });
}

// Call this function to test the connection
testApiEndpoint(); 