// Startup script to automatically launch proxy server
console.log('🔧 Startup script loaded');

// Function to detect if we're running in a Node.js environment
function isNodeEnvironment() {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
}

// Function to start proxy server via different methods
async function autoStartProxy() {
    console.log('🚀 Attempting to auto-start proxy server...');
    
    // Check if proxy is already running
    try {
        const response = await fetch('http://localhost:8081/api/ollama/test', { 
            method: 'GET',
            timeout: 2000 
        });
        if (response.ok) {
            console.log('✅ Proxy server already running');
            return true;
        }
    } catch (error) {
        console.log('📡 Proxy server not detected, attempting to start...');
    }
    
    // Method 1: PowerShell command (Windows)
    if (navigator.platform.toLowerCase().includes('win')) {
        try {
            // Create a batch file to start the server
            const batchContent = `@echo off
cd /d "${window.location.pathname.replace('/src/renderer/index.html', '').replace('file:///', '')}"
start "Proxy Server" cmd /c "node proxy-server.js"
`;
            
            // For security reasons, we can't directly execute files, so show instructions
            console.log('🪟 Windows detected - showing startup instructions');
            return false;
        } catch (error) {
            console.log('❌ Windows startup method failed:', error);
        }
    }
    
    // Method 2: Create startup instructions
    const projectPath = window.location.pathname.replace('/src/renderer/index.html', '').replace('file:///', '');
    
    // Show user-friendly startup message
    setTimeout(() => {
        if (typeof addChatMessage === 'function') {
            addChatMessage('system', '🔧 **Starting Proxy Server**');
            addChatMessage('system', 'To enable AI functionality, please run this command in a terminal:');
            addChatMessage('system', '```powershell\ncd "' + projectPath + '"\nnode proxy-server.js\n```');
            addChatMessage('system', '💡 **Quick Start:** Open PowerShell, copy the command above, and press Enter.');
            addChatMessage('system', 'The server will start automatically and the AI features will become available.');
        }
    }, 2000);
    
    return false;
}

// Auto-execute when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStartProxy);
} else {
    autoStartProxy();
}

// Export for use in main app
window.autoStartProxy = autoStartProxy;
