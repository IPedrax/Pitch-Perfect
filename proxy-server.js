const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 8081;
const OLLAMA_BASE_URL = 'http://37.60.255.134:11434';
const OLLAMA_HOST = '37.60.255.134';
const OLLAMA_PORT = 11434;

// Simplified connection management
const agent = new http.Agent({
    keepAlive: true,
    timeout: 60000, // Increased timeout for AI requests
    maxSockets: 5,
    maxFreeSockets: 2
});

// Simple rate limiting (less aggressive)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests

console.log('🚀 Starting Enhanced Ollama Proxy Server...');
console.log(`📡 Proxy server will run on: http://localhost:${PORT}`);
console.log(`🤖 Ollama endpoint: ${OLLAMA_BASE_URL}`);

// Simplified request function with better error handling
async function makeOllamaRequest(path, method, data, retries = 1) {
    return new Promise((resolve, reject) => {
        const requestData = data ? JSON.stringify(data) : '';
        
        const options = {
            hostname: OLLAMA_HOST,
            port: OLLAMA_PORT,
            path: path,
            method: method,
            agent: agent,
            timeout: 60000, // 60 second timeout for AI requests
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'PitchPerfect/1.0',
                'Accept': 'application/json'
            }
        };

        // Add Content-Length only for POST requests with data
        if (method === 'POST' && data) {
            options.headers['Content-Length'] = Buffer.byteLength(requestData);
        }

        console.log(`🔄 Making ${method} request to ${path}...`);
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    console.log(`✅ Response received (${res.statusCode})`);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve({
                            success: true,
                            statusCode: res.statusCode,
                            data: responseData ? JSON.parse(responseData) : {},
                            response: responseData
                        });
                    } else {
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            error: `HTTP ${res.statusCode}: ${responseData}`,
                            response: responseData
                        });
                    }
                } catch (error) {
                    console.error('❌ JSON parse error:', error.message);
                    resolve({
                        success: false,
                        error: 'Invalid JSON response: ' + error.message,
                        rawData: responseData
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Request error:`, error.message);
            if (retries > 0 && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.message.includes('hang up'))) {
                console.log(`🔄 Retrying request (${retries} retries left)...`);
                setTimeout(() => {
                    makeOllamaRequest(path, method, data, retries - 1)
                        .then(resolve)
                        .catch(reject);
                }, 3000); // Wait 3 seconds before retry
            } else {
                resolve({
                    success: false,
                    error: error.message,
                    code: error.code
                });
            }
        });

        req.on('timeout', () => {
            console.error(`❌ Request timeout after 60 seconds`);
            req.destroy();
            resolve({
                success: false,
                error: 'Request timeout - AI response took too long'
            });
        });

        if (method === 'POST' && data) {
            req.write(requestData);
        }
        req.end();
    });
}

const server = http.createServer(async (req, res) => {
    // Simple rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`⏳ Rate limiting: waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    lastRequestTime = Date.now();

    // Enable CORS for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse the request URL
    const parsedUrl = url.parse(req.url, true);
    console.log(`📡 Processing request: ${req.method} ${parsedUrl.pathname}`);
    
    // Handle both /api/ollama/* and /api/* for compatibility
    if (!parsedUrl.pathname.startsWith('/api/')) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
        return;
    }

    try {
        if (parsedUrl.pathname === '/api/ollama/chat' || parsedUrl.pathname === '/api/chat') {
            // Handle chat requests - map to Ollama's /api/generate endpoint
            let body = '';
            req.on('data', chunk => {
                body += chunk;
            });
            
            req.on('end', async () => {
                try {
                    const requestData = JSON.parse(body);
                    const ollamaData = {
                        model: requestData.model || 'ipedrax-weeky:latest',
                        prompt: requestData.prompt,
                        stream: false
                    };
                    
                    console.log(`🔄 Sending chat request to Ollama (model: ${ollamaData.model})...`);
                    const result = await makeOllamaRequest('/api/generate', 'POST', ollamaData);
                    
                    if (result.success && result.data) {
                        // Transform Ollama response to our expected format
                        const response = {
                            success: true,
                            response: result.data.response || result.data.text || '',
                            model: result.data.model || ollamaData.model,
                            done: result.data.done !== false,
                            context: result.data.context,
                            total_duration: result.data.total_duration,
                            load_duration: result.data.load_duration,
                            prompt_eval_count: result.data.prompt_eval_count,
                            eval_count: result.data.eval_count
                        };
                        
                        console.log(`✅ Chat response successful (${response.response?.length || 0} chars)`);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(response));
                    } else {
                        console.error('❌ Chat request failed:', result.error);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({
                            success: false,
                            error: result.error || 'Unknown error occurred',
                            details: result
                        }));
                    }
                } catch (error) {
                    console.error('❌ Chat request parsing error:', error);
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        success: false,
                        error: 'Invalid request body: ' + error.message
                    }));
                }
            });
            
        } else if (parsedUrl.pathname === '/api/ollama/models' || parsedUrl.pathname === '/api/models') {
            // Handle models list request - map to Ollama's /api/tags endpoint
            console.log('📋 Fetching models list...');
            const result = await makeOllamaRequest('/api/tags', 'GET', null);
            
            if (result.success && result.data && result.data.models) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    models: result.data.models
                }));
            } else {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: result.error || 'Failed to fetch models',
                    models: []
                }));
            }
            
        } else if (parsedUrl.pathname === '/api/ollama/test' || parsedUrl.pathname === '/api/test') {
            // Handle connection test - map to Ollama's /api/tags endpoint
            console.log('🔍 Testing Ollama connection...');
            const result = await makeOllamaRequest('/api/tags', 'GET', null);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: result.success,
                message: result.success ? 'Ollama connection successful' : 'Connection failed',
                models: result.success && result.data ? (result.data.models?.length || 0) : 0,
                endpoint: OLLAMA_BASE_URL,
                error: result.error
            }));
            
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Endpoint not found' }));
        }
        
    } catch (error) {
        console.error('❌ Server error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: false,
            error: 'Internal server error: ' + error.message
        }));
    }
});

server.listen(PORT, () => {
    console.log('✅ Enhanced Ollama Proxy Server is running!');
    console.log('');
    console.log('Available endpoints:');
    console.log(`  POST http://localhost:${PORT}/api/ollama/chat     - Chat with AI`);
    console.log(`  GET  http://localhost:${PORT}/api/ollama/models   - List available models`);
    console.log(`  GET  http://localhost:${PORT}/api/ollama/test     - Test Ollama connection`);
    console.log('');
    console.log('💡 Enhanced with retry logic and better error handling!');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down enhanced proxy server...');
    server.close();
    process.exit(0);
});