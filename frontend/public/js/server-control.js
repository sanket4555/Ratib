document.addEventListener('DOMContentLoaded', () => {
    initializeServerControl();
    setupEventListeners();
    startMetricsPolling();
});

let serverMetricsInterval;
let charts = {};

function initializeServerControl() {
    createCharts();
    loadServerStatus();
    loadServerMetrics();
    loadServerLogs();
}

function setupEventListeners() {
    document.getElementById('toggle-server').addEventListener('click', toggleServer);
    document.getElementById('clear-logs').addEventListener('click', clearLogs);
    document.getElementById('download-logs').addEventListener('click', downloadLogs);
}

function createCharts() {
    // Connections Chart
    const connectionsCtx = document.getElementById('connectionsChart').getContext('2d');
    charts.connections = new Chart(connectionsCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Active Connections',
                data: [],
                borderColor: '#3498db',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Memory Usage Chart
    const memoryCtx = document.getElementById('memoryChart').getContext('2d');
    charts.memory = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Memory Usage (MB)',
                data: [],
                borderColor: '#2ecc71',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // CPU Usage Chart
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    charts.cpu = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'CPU Usage (%)',
                data: [],
                borderColor: '#e74c3c',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100
                }
            }
        }
    });
}

async function loadServerStatus() {
    try {
        const response = await fetch('/api/admin/server/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();
        updateServerStatus(data);
    } catch (error) {
        console.error('Error loading server status:', error);
    }
}

function updateServerStatus(data) {
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('server-status');
    const toggleBtn = document.getElementById('toggle-server');

    statusDot.className = `status-dot ${data.status}`;
    statusText.textContent = data.status === 'running' ? 'Running' : 'Stopped';
    toggleBtn.textContent = data.status === 'running' ? 'Stop Server' : 'Start Server';
}

async function toggleServer() {
    try {
        const response = await fetch('/api/admin/server/toggle', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();
        updateServerStatus(data);
    } catch (error) {
        console.error('Error toggling server:', error);
        alert('Failed to toggle server status');
    }
}

function startMetricsPolling() {
    // Poll metrics every 5 seconds
    serverMetricsInterval = setInterval(loadServerMetrics, 5000);
}

async function loadServerMetrics() {
    try {
        const response = await fetch('/api/admin/server/metrics', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();
        updateMetrics(data);
    } catch (error) {
        console.error('Error loading server metrics:', error);
    }
}

function updateMetrics(data) {
    // Update displayed values
    document.getElementById('active-connections').textContent = data.connections;
    document.getElementById('memory-usage').textContent = `${Math.round(data.memory)} MB`;
    document.getElementById('cpu-usage').textContent = `${Math.round(data.cpu)}%`;
    document.getElementById('server-uptime').textContent = formatUptime(data.uptime);

    // Update charts
    updateChart(charts.connections, data.connectionsHistory);
    updateChart(charts.memory, data.memoryHistory);
    updateChart(charts.cpu, data.cpuHistory);

    // Update uptime progress bar
    updateUptimeBar(data.uptime);
}

function updateChart(chart, data) {
    chart.data.labels = data.map(d => d.time);
    chart.data.datasets[0].data = data.map(d => d.value);
    chart.update();
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function updateUptimeBar(uptime) {
    const maxUptime = 24 * 3600; // 24 hours in seconds
    const percentage = Math.min((uptime / maxUptime) * 100, 100);
    document.getElementById('uptime-bar').style.width = `${percentage}%`;
}

async function loadServerLogs() {
    try {
        const response = await fetch('/api/admin/server/logs', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        const data = await response.json();
        displayLogs(data.logs);
    } catch (error) {
        console.error('Error loading server logs:', error);
    }
}

function displayLogs(logs) {
    const logContent = document.getElementById('server-log-content');
    logContent.textContent = logs.join('\n');
    logContent.scrollTop = logContent.scrollHeight;
}

async function clearLogs() {
    if (!confirm('Are you sure you want to clear all logs?')) {
        return;
    }

    try {
        await fetch('/api/admin/server/logs', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        loadServerLogs();
    } catch (error) {
        console.error('Error clearing logs:', error);
        alert('Failed to clear logs');
    }
}

function downloadLogs() {
    const logContent = document.getElementById('server-log-content').textContent;
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `server-logs-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(serverMetricsInterval);
}); 