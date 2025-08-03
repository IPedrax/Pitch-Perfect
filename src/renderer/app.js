// Web API Wrapper - Connects to Ollama via proxy server
const PROXY_BASE_URL = 'http://localhost:8081';

// Cache the models to avoid repeated 403 errors
const CACHED_MODELS = [
    {
        name: "ipedrax-weeky:latest",
        model: "ipedrax-weeky:latest",
        size: 2019393974,
        modified_at: "2025-08-02T22:29:18.928097589Z"
    },
    {
        name: "tinydolphin:latest", 
        model: "tinydolphin:latest",
        size: 636743607,
        modified_at: "2025-08-02T03:43:25.944008752Z"
    },
    {
        name: "tinyllama:latest",
        model: "tinyllama:latest", 
        size: 637700138,
        modified_at: "2025-08-02T03:42:55.744154845Z"
    },
    {
        name: "zuka-teufel:latest",
        model: "zuka-teufel:latest",
        size: 2019395843,
        modified_at: "2025-07-25T19:05:42.553195754Z"
    },
    {
        name: "ipedrax-juno:latest",
        model: "ipedrax-juno:latest", 
        size: 2019395546,
        modified_at: "2025-07-25T17:06:23.620134499Z"
    },
    {
        name: "gemma3:latest",
        model: "gemma3:latest",
        size: 3338801804,
        modified_at: "2025-07-23T15:16:36.115218286Z"
    },
    {
        name: "qwen2.5:3b",
        model: "qwen2.5:3b",
        size: 1929912432,
        modified_at: "2025-07-23T15:13:31.58820586Z"
    },
    {
        name: "llama3.2:latest",
        model: "llama3.2:latest",
        size: 2019393189,
        modified_at: "2025-07-23T15:12:05.584826499Z"
    }
];

const webAPI = {
    async ollamaChat(prompt, model = 'ipedrax-weeky:latest') {
        try {
            console.log('🔍 Sending chat request via proxy:', {
                prompt: prompt?.substring(0, 100) + '...',
                model,
                endpoint: `${PROXY_BASE_URL}/api/ollama/chat`
            });

            const response = await fetch(`${PROXY_BASE_URL}/api/ollama/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: prompt,
                    model: model
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Proxy chat response received');
            
            return data;
        } catch (error) {
            console.error('❌ Proxy chat API error:', error);
            return { success: false, error: error.message || 'Failed to communicate with Ollama via proxy' };
        }
    },
    
    async ollamaModels() {
        try {
            console.log('🔍 Fetching models via proxy:', `${PROXY_BASE_URL}/api/ollama/models`);
            console.log('💾 Using cached models due to server rate limiting');
            
            // Use cached models to avoid 403 errors
            console.log('✅ Using cached models:', CACHED_MODELS.length);
            
            return {
                success: true,
                models: CACHED_MODELS
            };
            
            // Uncomment below if you want to try the API first and fall back to cache
            /*
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const response = await fetch(`${PROXY_BASE_URL}/api/ollama/models`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.log('⚠️ API request failed, using cached models');
                return {
                    success: true,
                    models: CACHED_MODELS
                };
            }
            
            const data = await response.json();
            if (data.success && data.models && data.models.length > 0) {
                console.log('✅ Models fetched via proxy:', data.models.length);
                return data;
            } else {
                console.log('⚠️ API returned no models, using cached models');
                return {
                    success: true,
                    models: CACHED_MODELS
                };
            }
            */
        } catch (error) {
            console.error('❌ Failed to fetch models via proxy, using cached models:', error);
            return {
                success: true,
                models: CACHED_MODELS
            };
        }
    },
    
    async testOllamaConnection() {
        try {
            console.log('🔍 Testing Ollama connection via proxy:', `${PROXY_BASE_URL}/api/ollama/test`);
            
            const response = await fetch(`${PROXY_BASE_URL}/api/ollama/test`, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            return data;
        } catch (error) {
            console.error('❌ Proxy connection test failed:', error);
            return {
                success: false,
                error: error.message || 'Cannot connect to Ollama via proxy',
                endpoint: PROXY_BASE_URL
            };
        }
    },
    
    async loadFile() {
        // For web version, we'll use file input instead of Electron dialog
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.pptx';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const data = JSON.parse(event.target.result);
                            resolve({ success: true, data });
                        } catch (error) {
                            resolve({ success: false, error: 'Invalid file format' });
                        }
                    };
                    reader.readAsText(file);
                } else {
                    resolve({ success: false, error: 'No file selected' });
                }
            };
            input.click();
        });
    }
};

// Replace window.electronAPI with webAPI for web compatibility
if (typeof window !== 'undefined') {
    window.electronAPI = webAPI;
    console.log('🔌 webAPI assigned to window.electronAPI');
    console.log('🔍 webAPI methods available:', Object.keys(webAPI));
    console.log('🔍 Testing webAPI.ollamaModels function:', typeof webAPI.ollamaModels);
}

// Application State
let currentSlideIndex = 0;
let slides = []; // Start with empty slides array
let selectedModel = '';
let sessionLogs = []; // Store all AI requests and responses from this session

// Default slide styling themes
// Enhanced theme system with 20 variants per category
const slideThemes = {
    // BUSINESS THEMES (20 variants)
    business_classic: {
        name: 'Business Classic',
        category: 'business',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        accentColor: '#3b82f6',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 40 },
        contentPosition: { x: 50, y: 100 },
        decorations: ['clean lines', 'subtle shadows']
    },
    business_modern: {
        name: 'Business Modern',
        category: 'business',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        accentColor: '#1e40af',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 45 },
        contentPosition: { x: 40, y: 105 },
        decorations: ['geometric shapes', 'blue accents']
    },
    business_executive: {
        name: 'Business Executive',
        category: 'business',
        backgroundColor: '#1f2937',
        textColor: '#f9fafb',
        accentColor: '#60a5fa',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 60, y: 50 },
        contentPosition: { x: 60, y: 110 },
        decorations: ['premium borders', 'metallic accents']
    },
    business_corporate: {
        name: 'Business Corporate',
        category: 'business',
        backgroundColor: '#e5e7eb',
        textColor: '#374151',
        accentColor: '#2563eb',
        titleFont: 'bold 35px Inter',
        contentFont: '17px Inter',
        titlePosition: { x: 45, y: 35 },
        contentPosition: { x: 45, y: 95 },
        decorations: ['corporate grid', 'professional icons']
    },
    business_minimal: {
        name: 'Business Minimal',
        category: 'business',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        accentColor: '#4f46e5',
        titleFont: '36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 30, y: 60 },
        contentPosition: { x: 30, y: 120 },
        decorations: ['minimal lines', 'space optimization']
    },
    business_professional: {
        name: 'Business Professional',
        category: 'business',
        backgroundColor: '#f3f4f6',
        textColor: '#1f2937',
        accentColor: '#1d4ed8',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 42 },
        contentPosition: { x: 55, y: 102 },
        decorations: ['professional framework', 'structured layout']
    },
    business_elegant: {
        name: 'Business Elegant',
        category: 'business',
        backgroundColor: '#fafafa',
        textColor: '#262626',
        accentColor: '#0369a1',
        titleFont: 'bold 39px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 50, y: 38 },
        contentPosition: { x: 50, y: 98 },
        decorations: ['elegant typography', 'refined details']
    },
    business_formal: {
        name: 'Business Formal',
        category: 'business',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        accentColor: '#1e3a8a',
        titleFont: 'bold 34px Inter',
        contentFont: '17px Inter',
        titlePosition: { x: 40, y: 50 },
        contentPosition: { x: 40, y: 110 },
        decorations: ['formal structure', 'traditional elements']
    },
    business_dynamic: {
        name: 'Business Dynamic',
        category: 'business',
        backgroundColor: 'gradient:business_dynamic',
        textColor: '#ffffff',
        accentColor: '#93c5fd',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 45, y: 40 },
        contentPosition: { x: 45, y: 100 },
        decorations: ['dynamic gradients', 'movement lines']
    },
    business_contemporary: {
        name: 'Business Contemporary',
        category: 'business',
        backgroundColor: '#f1f5f9',
        textColor: '#334155',
        accentColor: '#0284c7',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 35, y: 45 },
        contentPosition: { x: 35, y: 105 },
        decorations: ['contemporary design', 'clean aesthetics']
    },
    business_premium: {
        name: 'Business Premium',
        category: 'business',
        backgroundColor: '#0f172a',
        textColor: '#e2e8f0',
        accentColor: '#38bdf8',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 50, y: 35 },
        contentPosition: { x: 50, y: 95 },
        decorations: ['premium styling', 'luxury accents']
    },
    business_strategic: {
        name: 'Business Strategic',
        category: 'business',
        backgroundColor: '#e4e4e7',
        textColor: '#18181b',
        accentColor: '#2563eb',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 60, y: 40 },
        contentPosition: { x: 60, y: 100 },
        decorations: ['strategic elements', 'data visualization']
    },
    business_innovative: {
        name: 'Business Innovative',
        category: 'business',
        backgroundColor: '#ffffff',
        textColor: '#1e293b',
        accentColor: '#6366f1',
        titleFont: 'bold 37px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 40, y: 55 },
        contentPosition: { x: 40, y: 115 },
        decorations: ['innovative patterns', 'forward-thinking design']
    },
    business_growth: {
        name: 'Business Growth',
        category: 'business',
        backgroundColor: 'gradient:business_growth',
        textColor: '#0f172a',
        accentColor: '#1d4ed8',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 42 },
        contentPosition: { x: 45, y: 102 },
        decorations: ['growth arrows', 'upward trends']
    },
    business_leadership: {
        name: 'Business Leadership',
        category: 'business',
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        accentColor: '#1e40af',
        titleFont: 'bold 39px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 38 },
        contentPosition: { x: 50, y: 98 },
        decorations: ['leadership symbols', 'authority elements']
    },
    business_success: {
        name: 'Business Success',
        category: 'business',
        backgroundColor: '#ffffff',
        textColor: '#111827',
        accentColor: '#059669',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 35, y: 50 },
        contentPosition: { x: 35, y: 110 },
        decorations: ['success indicators', 'achievement badges']
    },
    business_global: {
        name: 'Business Global',
        category: 'business',
        backgroundColor: '#1e293b',
        textColor: '#f1f5f9',
        accentColor: '#0ea5e9',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 55, y: 40 },
        contentPosition: { x: 55, y: 100 },
        decorations: ['global elements', 'international styling']
    },
    business_finance: {
        name: 'Business Finance',
        category: 'business',
        backgroundColor: '#f9fafb',
        textColor: '#1f2937',
        accentColor: '#059669',
        titleFont: 'bold 35px Inter',
        contentFont: '17px Inter',
        titlePosition: { x: 40, y: 45 },
        contentPosition: { x: 40, y: 105 },
        decorations: ['financial charts', 'currency symbols']
    },
    business_consulting: {
        name: 'Business Consulting',
        category: 'business',
        backgroundColor: '#ffffff',
        textColor: '#374151',
        accentColor: '#7c3aed',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 45, y: 40 },
        contentPosition: { x: 45, y: 100 },
        decorations: ['consulting framework', 'advisory elements']
    },
    business_analytics: {
        name: 'Business Analytics',
        category: 'business',
        backgroundColor: 'gradient:business_analytics',
        textColor: '#ffffff',
        accentColor: '#fbbf24',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 45 },
        contentPosition: { x: 50, y: 105 },
        decorations: ['data patterns', 'analytical charts']
    },

    // STARTUP THEMES (20 variants)
    startup_disruptive: {
        name: 'Startup Disruptive',
        category: 'startup',
        backgroundColor: 'gradient:startup',
        textColor: '#ffffff',
        accentColor: '#a855f7',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 50, y: 40 },
        contentPosition: { x: 50, y: 100 },
        decorations: ['disruptive patterns', 'bold shapes']
    },
    startup_innovative: {
        name: 'Startup Innovative',
        category: 'startup',
        backgroundColor: '#0f0f23',
        textColor: '#e2e8f0',
        accentColor: '#8b5cf6',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 35 },
        contentPosition: { x: 45, y: 95 },
        decorations: ['innovation icons', 'creative elements']
    },
    startup_unicorn: {
        name: 'Startup Unicorn',
        category: 'startup',
        backgroundColor: 'gradient:startup_unicorn',
        textColor: '#ffffff',
        accentColor: '#ec4899',
        titleFont: 'bold 44px Inter',
        contentFont: '21px Inter',
        titlePosition: { x: 40, y: 30 },
        contentPosition: { x: 40, y: 90 },
        decorations: ['unicorn elements', 'magical gradients']
    },
    startup_growth: {
        name: 'Startup Growth',
        category: 'startup',
        backgroundColor: '#1a1a2e',
        textColor: '#f8fafc',
        accentColor: '#06d6a0',
        titleFont: 'bold 39px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 55, y: 42 },
        contentPosition: { x: 55, y: 102 },
        decorations: ['growth charts', 'ascending elements']
    },
    startup_venture: {
        name: 'Startup Venture',
        category: 'startup',
        backgroundColor: '#000000',
        textColor: '#ffffff',
        accentColor: '#f59e0b',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 45 },
        contentPosition: { x: 50, y: 105 },
        decorations: ['venture symbols', 'investment themes']
    },
    startup_tech: {
        name: 'Startup Tech',
        category: 'startup',
        backgroundColor: 'gradient:startup_tech',
        textColor: '#f1f5f9',
        accentColor: '#3b82f6',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 35, y: 38 },
        contentPosition: { x: 35, y: 98 },
        decorations: ['tech circuits', 'digital patterns']
    },
    startup_bold: {
        name: 'Startup Bold',
        category: 'startup',
        backgroundColor: '#7c2d12',
        textColor: '#fef2f2',
        accentColor: '#fb923c',
        titleFont: 'bold 43px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 60, y: 35 },
        contentPosition: { x: 60, y: 95 },
        decorations: ['bold statements', 'impactful design']
    },
    startup_modern: {
        name: 'Startup Modern',
        category: 'startup',
        backgroundColor: '#18181b',
        textColor: '#fafafa',
        accentColor: '#a78bfa',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 50 },
        contentPosition: { x: 40, y: 110 },
        decorations: ['modern aesthetics', 'contemporary lines']
    },
    startup_dynamic: {
        name: 'Startup Dynamic',
        category: 'startup',
        backgroundColor: 'gradient:startup_dynamic',
        textColor: '#ffffff',
        accentColor: '#ef4444',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 40 },
        contentPosition: { x: 45, y: 100 },
        decorations: ['dynamic movement', 'energy flows']
    },
    startup_agile: {
        name: 'Startup Agile',
        category: 'startup',
        backgroundColor: '#0c0a09',
        textColor: '#e7e5e4',
        accentColor: '#22d3ee',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 48 },
        contentPosition: { x: 50, y: 108 },
        decorations: ['agile methodology', 'sprint elements']
    },
    startup_future: {
        name: 'Startup Future',
        category: 'startup',
        backgroundColor: 'gradient:startup_future',
        textColor: '#f8fafc',
        accentColor: '#06ffa5',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 30, y: 35 },
        contentPosition: { x: 30, y: 95 },
        decorations: ['futuristic elements', 'sci-fi aesthetics']
    },
    startup_mvp: {
        name: 'Startup MVP',
        category: 'startup',
        backgroundColor: '#1e1b4b',
        textColor: '#e0e7ff',
        accentColor: '#8b5cf6',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 45 },
        contentPosition: { x: 55, y: 105 },
        decorations: ['MVP framework', 'lean design']
    },
    startup_pivot: {
        name: 'Startup Pivot',
        category: 'startup',
        backgroundColor: '#431407',
        textColor: '#fed7aa',
        accentColor: '#fdba74',
        titleFont: 'bold 39px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 40, y: 42 },
        contentPosition: { x: 40, y: 102 },
        decorations: ['pivot arrows', 'transformation elements']
    },
    startup_scale: {
        name: 'Startup Scale',
        category: 'startup',
        backgroundColor: 'gradient:startup_scale',
        textColor: '#ffffff',
        accentColor: '#10b981',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 50, y: 38 },
        contentPosition: { x: 50, y: 98 },
        decorations: ['scaling graphics', 'exponential curves']
    },
    startup_seed: {
        name: 'Startup Seed',
        category: 'startup',
        backgroundColor: '#064e3b',
        textColor: '#d1fae5',
        accentColor: '#34d399',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 45, y: 50 },
        contentPosition: { x: 45, y: 110 },
        decorations: ['seed elements', 'growth metaphors']
    },
    startup_disrupt: {
        name: 'Startup Disrupt',
        category: 'startup',
        backgroundColor: '#7c1d6f',
        textColor: '#fdf4ff',
        accentColor: '#d946ef',
        titleFont: 'bold 43px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 35, y: 32 },
        contentPosition: { x: 35, y: 92 },
        decorations: ['disruption waves', 'breaking patterns']
    },
    startup_launch: {
        name: 'Startup Launch',
        category: 'startup',
        backgroundColor: 'gradient:startup_launch',
        textColor: '#ffffff',
        accentColor: '#fbbf24',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 60, y: 40 },
        contentPosition: { x: 60, y: 100 },
        decorations: ['rocket elements', 'launch trajectory']
    },
    startup_viral: {
        name: 'Startup Viral',
        category: 'startup',
        backgroundColor: '#1e40af',
        textColor: '#dbeafe',
        accentColor: '#60a5fa',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 55 },
        contentPosition: { x: 40, y: 115 },
        decorations: ['viral patterns', 'network effects']
    },
    startup_ecosystem: {
        name: 'Startup Ecosystem',
        category: 'startup',
        backgroundColor: '#0f766e',
        textColor: '#ccfbf1',
        accentColor: '#5eead4',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 45 },
        contentPosition: { x: 50, y: 105 },
        decorations: ['ecosystem nodes', 'interconnected elements']
    },
    startup_revolution: {
        name: 'Startup Revolution',
        category: 'startup',
        backgroundColor: 'gradient:startup_revolution',
        textColor: '#ffffff',
        accentColor: '#f97316',
        titleFont: 'bold 44px Inter',
        contentFont: '21px Inter',
        titlePosition: { x: 45, y: 30 },
        contentPosition: { x: 45, y: 90 },
        decorations: ['revolutionary symbols', 'change indicators']
    },

    // TECH THEMES (20 variants)
    tech_code: {
        name: 'Tech Code',
        category: 'tech',
        backgroundColor: '#0a0a0a',
        textColor: '#00ff41',
        accentColor: '#39ff14',
        titleFont: 'bold 38px "Courier New"',
        contentFont: '18px "Courier New"',
        titlePosition: { x: 40, y: 45 },
        contentPosition: { x: 40, y: 105 },
        decorations: ['code patterns', 'matrix effects']
    },
    tech_cyber: {
        name: 'Tech Cyber',
        category: 'tech',
        backgroundColor: 'gradient:tech_cyber',
        textColor: '#00ffff',
        accentColor: '#ff0080',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 50, y: 35 },
        contentPosition: { x: 50, y: 95 },
        decorations: ['cyber grids', 'neon accents']
    },
    tech_ai: {
        name: 'Tech AI',
        category: 'tech',
        backgroundColor: '#1a1a2e',
        textColor: '#eee',
        accentColor: '#0f3460',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 40 },
        contentPosition: { x: 45, y: 100 },
        decorations: ['neural networks', 'AI nodes']
    },
    tech_quantum: {
        name: 'Tech Quantum',
        category: 'tech',
        backgroundColor: 'gradient:tech_quantum',
        textColor: '#ffffff',
        accentColor: '#8b5cf6',
        titleFont: 'bold 39px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 35, y: 42 },
        contentPosition: { x: 35, y: 102 },
        decorations: ['quantum particles', 'probability waves']
    },
    tech_blockchain: {
        name: 'Tech Blockchain',
        category: 'tech',
        backgroundColor: '#000000',
        textColor: '#ffd700',
        accentColor: '#ff6b35',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 55, y: 38 },
        contentPosition: { x: 55, y: 98 },
        decorations: ['blockchain links', 'crypto elements']
    },
    tech_cloud: {
        name: 'Tech Cloud',
        category: 'tech',
        backgroundColor: 'gradient:tech_cloud',
        textColor: '#1f2937',
        accentColor: '#3b82f6',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 50 },
        contentPosition: { x: 40, y: 110 },
        decorations: ['cloud formations', 'data streams']
    },
    tech_iot: {
        name: 'Tech IoT',
        category: 'tech',
        backgroundColor: '#0f172a',
        textColor: '#f1f5f9',
        accentColor: '#06d6a0',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 45 },
        contentPosition: { x: 50, y: 105 },
        decorations: ['connected devices', 'IoT networks']
    },
    tech_machine: {
        name: 'Tech Machine Learning',
        category: 'tech',
        backgroundColor: 'gradient:tech_ml',
        textColor: '#ffffff',
        accentColor: '#f59e0b',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 30, y: 35 },
        contentPosition: { x: 30, y: 95 },
        decorations: ['algorithm flows', 'data processing']
    },
    tech_robotics: {
        name: 'Tech Robotics',
        category: 'tech',
        backgroundColor: '#1c1c1c',
        textColor: '#e5e5e5',
        accentColor: '#ff4757',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 60, y: 40 },
        contentPosition: { x: 60, y: 100 },
        decorations: ['robotic elements', 'mechanical parts']
    },
    tech_vr: {
        name: 'Tech Virtual Reality',
        category: 'tech',
        backgroundColor: 'gradient:tech_vr',
        textColor: '#ffffff',
        accentColor: '#e74c3c',
        titleFont: 'bold 39px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 45, y: 48 },
        contentPosition: { x: 45, y: 108 },
        decorations: ['VR headsets', 'virtual dimensions']
    },
    tech_data: {
        name: 'Tech Data Science',
        category: 'tech',
        backgroundColor: '#2c3e50',
        textColor: '#ecf0f1',
        accentColor: '#3498db',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 42 },
        contentPosition: { x: 40, y: 102 },
        decorations: ['data visualizations', 'statistical charts']
    },
    tech_security: {
        name: 'Tech Security',
        category: 'tech',
        backgroundColor: '#000000',
        textColor: '#00ff00',
        accentColor: '#ff0000',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 50 },
        contentPosition: { x: 55, y: 110 },
        decorations: ['security shields', 'encryption patterns']
    },
    tech_5g: {
        name: 'Tech 5G',
        category: 'tech',
        backgroundColor: 'gradient:tech_5g',
        textColor: '#ffffff',
        accentColor: '#9c88ff',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 35, y: 38 },
        contentPosition: { x: 35, y: 98 },
        decorations: ['signal waves', '5G towers']
    },
    tech_edge: {
        name: 'Tech Edge Computing',
        category: 'tech',
        backgroundColor: '#1a1a1a',
        textColor: '#ffffff',
        accentColor: '#4ecdc4',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 45 },
        contentPosition: { x: 50, y: 105 },
        decorations: ['edge nodes', 'distributed computing']
    },
    tech_devops: {
        name: 'Tech DevOps',
        category: 'tech',
        backgroundColor: '#34495e',
        textColor: '#ffffff',
        accentColor: '#f39c12',
        titleFont: 'bold 39px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 40 },
        contentPosition: { x: 45, y: 100 },
        decorations: ['CI/CD pipelines', 'deployment flows']
    },
    tech_microservices: {
        name: 'Tech Microservices',
        category: 'tech',
        backgroundColor: 'gradient:tech_micro',
        textColor: '#2c3e50',
        accentColor: '#e67e22',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 55 },
        contentPosition: { x: 40, y: 115 },
        decorations: ['service meshes', 'container clusters']
    },
    tech_ar: {
        name: 'Tech Augmented Reality',
        category: 'tech',
        backgroundColor: '#8e44ad',
        textColor: '#ffffff',
        accentColor: '#f1c40f',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 50, y: 35 },
        contentPosition: { x: 50, y: 95 },
        decorations: ['AR overlays', 'mixed reality']
    },
    tech_neural: {
        name: 'Tech Neural Networks',
        category: 'tech',
        backgroundColor: 'gradient:tech_neural',
        textColor: '#ffffff',
        accentColor: '#ff6b6b',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 30, y: 40 },
        contentPosition: { x: 30, y: 100 },
        decorations: ['neural pathways', 'synaptic connections']
    },
    tech_serverless: {
        name: 'Tech Serverless',
        category: 'tech',
        backgroundColor: '#16a085',
        textColor: '#ffffff',
        accentColor: '#f39c12',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 48 },
        contentPosition: { x: 55, y: 108 },
        decorations: ['serverless functions', 'cloud abstractions']
    },
    tech_web3: {
        name: 'Tech Web3',
        category: 'tech',
        backgroundColor: 'gradient:tech_web3',
        textColor: '#ffffff',
        accentColor: '#ff00ff',
        titleFont: 'bold 43px Inter',
        contentFont: '21px Inter',
        titlePosition: { x: 40, y: 32 },
        contentPosition: { x: 40, y: 92 },
        decorations: ['decentralized networks', 'Web3 protocols']
    },

    // CREATIVE THEMES (20 variants)
    creative_artistic: {
        name: 'Creative Artistic',
        category: 'creative',
        backgroundColor: 'gradient:creative_artistic',
        textColor: '#2d3748',
        accentColor: '#ed8936',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 40, y: 35 },
        contentPosition: { x: 40, y: 95 },
        decorations: ['paint brushes', 'color palettes']
    },
    creative_vibrant: {
        name: 'Creative Vibrant',
        category: 'creative',
        backgroundColor: '#ff6b6b',
        textColor: '#ffffff',
        accentColor: '#4ecdc4',
        titleFont: 'bold 44px Inter',
        contentFont: '21px Inter',
        titlePosition: { x: 50, y: 30 },
        contentPosition: { x: 50, y: 90 },
        decorations: ['vibrant shapes', 'energy bursts']
    },
    creative_modern: {
        name: 'Creative Modern',
        category: 'creative',
        backgroundColor: 'gradient:creative_modern',
        textColor: '#1a202c',
        accentColor: '#f56565',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 35, y: 40 },
        contentPosition: { x: 35, y: 100 },
        decorations: ['geometric art', 'modern shapes']
    },
    creative_bold: {
        name: 'Creative Bold',
        category: 'creative',
        backgroundColor: '#2d3748',
        textColor: '#fed7d7',
        accentColor: '#f6ad55',
        titleFont: 'bold 45px Inter',
        contentFont: '22px Inter',
        titlePosition: { x: 45, y: 25 },
        contentPosition: { x: 45, y: 85 },
        decorations: ['bold statements', 'impact elements']
    },
    creative_pastel: {
        name: 'Creative Pastel',
        category: 'creative',
        backgroundColor: 'gradient:creative_pastel',
        textColor: '#4a5568',
        accentColor: '#9f7aea',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 60, y: 45 },
        contentPosition: { x: 60, y: 105 },
        decorations: ['soft textures', 'pastel elements']
    },
    creative_dynamic: {
        name: 'Creative Dynamic',
        category: 'creative',
        backgroundColor: '#1a365d',
        textColor: '#e2e8f0',
        accentColor: '#f6e05e',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 40, y: 38 },
        contentPosition: { x: 40, y: 98 },
        decorations: ['dynamic flows', 'movement trails']
    },
    creative_minimalist: {
        name: 'Creative Minimalist',
        category: 'creative',
        backgroundColor: '#ffffff',
        textColor: '#2d3748',
        accentColor: '#38b2ac',
        titleFont: '39px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 30, y: 60 },
        contentPosition: { x: 30, y: 120 },
        decorations: ['clean lines', 'negative space']
    },
    creative_retro: {
        name: 'Creative Retro',
        category: 'creative',
        backgroundColor: 'gradient:creative_retro',
        textColor: '#ffffff',
        accentColor: '#ff8a80',
        titleFont: 'bold 43px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 50, y: 32 },
        contentPosition: { x: 50, y: 92 },
        decorations: ['retro patterns', 'vintage elements']
    },
    creative_organic: {
        name: 'Creative Organic',
        category: 'creative',
        backgroundColor: '#68d391',
        textColor: '#1a202c',
        accentColor: '#ed8936',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 42 },
        contentPosition: { x: 45, y: 102 },
        decorations: ['organic shapes', 'natural curves']
    },
    creative_experimental: {
        name: 'Creative Experimental',
        category: 'creative',
        backgroundColor: 'gradient:creative_exp',
        textColor: '#ffffff',
        accentColor: '#ff0080',
        titleFont: 'bold 46px Inter',
        contentFont: '21px Inter',
        titlePosition: { x: 35, y: 28 },
        contentPosition: { x: 35, y: 88 },
        decorations: ['experimental forms', 'abstract art']
    },
    creative_watercolor: {
        name: 'Creative Watercolor',
        category: 'creative',
        backgroundColor: 'gradient:creative_water',
        textColor: '#2d3748',
        accentColor: '#805ad5',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 50 },
        contentPosition: { x: 55, y: 110 },
        decorations: ['watercolor splashes', 'fluid textures']
    },
    creative_neon: {
        name: 'Creative Neon',
        category: 'creative',
        backgroundColor: '#000000',
        textColor: '#00ffff',
        accentColor: '#ff00ff',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 40, y: 35 },
        contentPosition: { x: 40, y: 95 },
        decorations: ['neon lights', 'glow effects']
    },
    creative_collage: {
        name: 'Creative Collage',
        category: 'creative',
        backgroundColor: 'gradient:creative_collage',
        textColor: '#1a202c',
        accentColor: '#e53e3e',
        titleFont: 'bold 39px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 45 },
        contentPosition: { x: 50, y: 105 },
        decorations: ['collage elements', 'mixed media']
    },
    creative_geometric: {
        name: 'Creative Geometric',
        category: 'creative',
        backgroundColor: '#4299e1',
        textColor: '#ffffff',
        accentColor: '#f6ad55',
        titleFont: 'bold 41px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 30, y: 38 },
        contentPosition: { x: 30, y: 98 },
        decorations: ['geometric patterns', 'mathematical art']
    },
    creative_grunge: {
        name: 'Creative Grunge',
        category: 'creative',
        backgroundColor: 'gradient:creative_grunge',
        textColor: '#f7fafc',
        accentColor: '#ed64a6',
        titleFont: 'bold 44px Inter',
        contentFont: '21px Inter',
        titlePosition: { x: 60, y: 30 },
        contentPosition: { x: 60, y: 90 },
        decorations: ['grunge textures', 'distressed elements']
    },
    creative_pop: {
        name: 'Creative Pop Art',
        category: 'creative',
        backgroundColor: '#ff6b35',
        textColor: '#ffffff',
        accentColor: '#4ecdc4',
        titleFont: 'bold 45px Inter',
        contentFont: '22px Inter',
        titlePosition: { x: 45, y: 25 },
        contentPosition: { x: 45, y: 85 },
        decorations: ['pop art style', 'comic elements']
    },
    creative_surreal: {
        name: 'Creative Surreal',
        category: 'creative',
        backgroundColor: 'gradient:creative_surreal',
        textColor: '#2d3748',
        accentColor: '#9f7aea',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 40, y: 40 },
        contentPosition: { x: 40, y: 100 },
        decorations: ['surreal elements', 'dreamlike forms']
    },
    creative_digital: {
        name: 'Creative Digital Art',
        category: 'creative',
        backgroundColor: '#1a1a2e',
        textColor: '#e2e8f0',
        accentColor: '#00d2ff',
        titleFont: 'bold 42px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 50, y: 35 },
        contentPosition: { x: 50, y: 95 },
        decorations: ['digital effects', 'pixel art']
    },
    creative_abstract: {
        name: 'Creative Abstract',
        category: 'creative',
        backgroundColor: 'gradient:creative_abstract',
        textColor: '#ffffff',
        accentColor: '#ff6b6b',
        titleFont: 'bold 43px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 35, y: 32 },
        contentPosition: { x: 35, y: 92 },
        decorations: ['abstract forms', 'fluid dynamics']
    },
    creative_handdrawn: {
        name: 'Creative Hand-drawn',
        category: 'creative',
        backgroundColor: '#f7fafc',
        textColor: '#2d3748',
        accentColor: '#ed8936',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 48 },
        contentPosition: { x: 55, y: 108 },
        decorations: ['sketch elements', 'hand-drawn style']
    },

    // MEDICAL THEMES (20 variants)
    medical_clinical: {
        name: 'Medical Clinical',
        category: 'medical',
        backgroundColor: '#ffffff',
        textColor: '#2d3748',
        accentColor: '#38a169',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 40 },
        contentPosition: { x: 50, y: 100 },
        decorations: ['medical crosses', 'clinical elements']
    },
    medical_research: {
        name: 'Medical Research',
        category: 'medical',
        backgroundColor: '#f7fafc',
        textColor: '#1a202c',
        accentColor: '#3182ce',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 45, y: 45 },
        contentPosition: { x: 45, y: 105 },
        decorations: ['research charts', 'data visualization']
    },
    medical_pharma: {
        name: 'Medical Pharmaceutical',
        category: 'medical',
        backgroundColor: 'gradient:medical_pharma',
        textColor: '#2d3748',
        accentColor: '#805ad5',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 42 },
        contentPosition: { x: 40, y: 102 },
        decorations: ['pill capsules', 'molecular structures']
    },
    medical_cardiology: {
        name: 'Medical Cardiology',
        category: 'medical',
        backgroundColor: '#fed7d7',
        textColor: '#742a2a',
        accentColor: '#e53e3e',
        titleFont: 'bold 39px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 55, y: 38 },
        contentPosition: { x: 55, y: 98 },
        decorations: ['heart symbols', 'ECG patterns']
    },
    medical_neurology: {
        name: 'Medical Neurology',
        category: 'medical',
        backgroundColor: 'gradient:medical_neuro',
        textColor: '#2d3748',
        accentColor: '#667eea',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 30, y: 35 },
        contentPosition: { x: 30, y: 95 },
        decorations: ['brain networks', 'neural pathways']
    },
    medical_surgery: {
        name: 'Medical Surgery',
        category: 'medical',
        backgroundColor: '#e6fffa',
        textColor: '#234e52',
        accentColor: '#319795',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 48 },
        contentPosition: { x: 50, y: 108 },
        decorations: ['surgical instruments', 'precision tools']
    },
    medical_pediatric: {
        name: 'Medical Pediatric',
        category: 'medical',
        backgroundColor: 'gradient:medical_pediatric',
        textColor: '#2d3748',
        accentColor: '#f093fb',
        titleFont: 'bold 36px Inter',
        contentFont: '17px Inter',
        titlePosition: { x: 45, y: 50 },
        contentPosition: { x: 45, y: 110 },
        decorations: ['playful elements', 'child-friendly design']
    },
    medical_emergency: {
        name: 'Medical Emergency',
        category: 'medical',
        backgroundColor: '#fed7d7',
        textColor: '#742a2a',
        accentColor: '#f56565',
        titleFont: 'bold 41px Inter',
        contentFont: '20px Inter',
        titlePosition: { x: 40, y: 32 },
        contentPosition: { x: 40, y: 92 },
        decorations: ['emergency symbols', 'urgent indicators']
    },
    medical_diagnostic: {
        name: 'Medical Diagnostic',
        category: 'medical',
        backgroundColor: '#ffffff',
        textColor: '#2d3748',
        accentColor: '#4299e1',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 35, y: 45 },
        contentPosition: { x: 35, y: 105 },
        decorations: ['diagnostic tools', 'medical scans']
    },
    medical_genetics: {
        name: 'Medical Genetics',
        category: 'medical',
        backgroundColor: 'gradient:medical_genetics',
        textColor: '#1a202c',
        accentColor: '#9f7aea',
        titleFont: 'bold 39px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 60, y: 40 },
        contentPosition: { x: 60, y: 100 },
        decorations: ['DNA helixes', 'genetic markers']
    },
    medical_oncology: {
        name: 'Medical Oncology',
        category: 'medical',
        backgroundColor: '#e6fffa',
        textColor: '#234e52',
        accentColor: '#38b2ac',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 42 },
        contentPosition: { x: 50, y: 102 },
        decorations: ['cellular structures', 'treatment symbols']
    },
    medical_radiology: {
        name: 'Medical Radiology',
        category: 'medical',
        backgroundColor: '#1a202c',
        textColor: '#e2e8f0',
        accentColor: '#4fd1c7',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 45, y: 35 },
        contentPosition: { x: 45, y: 95 },
        decorations: ['X-ray images', 'scanning equipment']
    },
    medical_pathology: {
        name: 'Medical Pathology',
        category: 'medical',
        backgroundColor: 'gradient:medical_pathology',
        textColor: '#2d3748',
        accentColor: '#ed64a6',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 40, y: 50 },
        contentPosition: { x: 40, y: 110 },
        decorations: ['microscopic views', 'cellular details']
    },
    medical_rehabilitation: {
        name: 'Medical Rehabilitation',
        category: 'medical',
        backgroundColor: '#f0fff4',
        textColor: '#22543d',
        accentColor: '#48bb78',
        titleFont: 'bold 36px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 55, y: 45 },
        contentPosition: { x: 55, y: 105 },
        decorations: ['recovery symbols', 'progress indicators']
    },
    medical_immunology: {
        name: 'Medical Immunology',
        category: 'medical',
        backgroundColor: 'gradient:medical_immuno',
        textColor: '#1a202c',
        accentColor: '#9f7aea',
        titleFont: 'bold 39px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 30, y: 38 },
        contentPosition: { x: 30, y: 98 },
        decorations: ['immune cells', 'antibody structures']
    },
    medical_dermatology: {
        name: 'Medical Dermatology',
        category: 'medical',
        backgroundColor: '#fffaf0',
        textColor: '#7c2d12',
        accentColor: '#ed8936',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 50, y: 48 },
        contentPosition: { x: 50, y: 108 },
        decorations: ['skin textures', 'dermal layers']
    },
    medical_psychiatry: {
        name: 'Medical Psychiatry',
        category: 'medical',
        backgroundColor: 'gradient:medical_psych',
        textColor: '#2d3748',
        accentColor: '#667eea',
        titleFont: 'bold 37px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 45, y: 42 },
        contentPosition: { x: 45, y: 102 },
        decorations: ['brain imagery', 'mental health symbols']
    },
    medical_anesthesiology: {
        name: 'Medical Anesthesiology',
        category: 'medical',
        backgroundColor: '#e6fffa',
        textColor: '#234e52',
        accentColor: '#319795',
        titleFont: 'bold 36px Inter',
        contentFont: '17px Inter',
        titlePosition: { x: 40, y: 50 },
        contentPosition: { x: 40, y: 110 },
        decorations: ['monitoring equipment', 'vital signs']
    },
    medical_sports: {
        name: 'Medical Sports Medicine',
        category: 'medical',
        backgroundColor: 'gradient:medical_sports',
        textColor: '#1a202c',
        accentColor: '#f56565',
        titleFont: 'bold 40px Inter',
        contentFont: '19px Inter',
        titlePosition: { x: 35, y: 35 },
        contentPosition: { x: 35, y: 95 },
        decorations: ['athletic elements', 'performance metrics']
    },
    medical_telemedicine: {
        name: 'Medical Telemedicine',
        category: 'medical',
        backgroundColor: '#ffffff',
        textColor: '#2d3748',
        accentColor: '#4299e1',
        titleFont: 'bold 38px Inter',
        contentFont: '18px Inter',
        titlePosition: { x: 60, y: 40 },
        contentPosition: { x: 60, y: 100 },
        decorations: ['digital health', 'remote care symbols']
    }
};

// Original simpler themes for backwards compatibility
const legacyThemes = {
    business: slideThemes.business_classic,
    startup: slideThemes.startup_disruptive,
    tech: slideThemes.tech_code,
    creative: slideThemes.creative_artistic,
    medical: slideThemes.medical_clinical
};

// DOM Elements - will be initialized after DOM loads
let elements = {};

// GitHub Pages compatible proxy detection and fallback
async function checkProxyAvailability() {
    console.log('🌐 Checking for GitHub Pages compatibility...');
    
    // Check if we're running on GitHub Pages
    const isGitHubPages = window.location.hostname.includes('github.io') || 
                         window.location.hostname.includes('github.com');
    
    if (isGitHubPages) {
        console.log('📄 Running on GitHub Pages - using direct API mode');
        return await setupGitHubPagesMode();
    }
    
    // For local development, try to detect proxy server
    try {
        const testResponse = await fetch('http://localhost:8081/api/ollama/test', {
            method: 'GET',
            signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        if (testResponse.ok) {
            console.log('✅ Local proxy server detected');
            return true;
        }
    } catch (error) {
        console.log('📡 No proxy server detected, enabling fallback mode');
    }
    
    return await setupFallbackMode();
}

// Setup GitHub Pages mode with direct API calls
async function setupGitHubPagesMode() {
    console.log('🚀 Configuring for GitHub Pages deployment...');
    
    // Override the webAPI to use direct calls or show instructions
    window.electronAPI.ollamaChat = async function(prompt, model = 'ipedrax-weeky:latest') {
        console.log('🌐 GitHub Pages: AI chat request intercepted');
        
        // Show user-friendly message for GitHub Pages
        addChatMessage('system', '🌐 **GitHub Pages Mode**');
        addChatMessage('system', 'AI features require a backend server. For full functionality:');
        addChatMessage('system', '1. **Local Setup**: Clone this repository and run `node proxy-server.js`');
        addChatMessage('system', '2. **Cloud Setup**: Deploy the proxy server to Heroku, Vercel, or similar');
        addChatMessage('system', '3. **API Key**: Use direct Ollama API with your own endpoint');
        addChatMessage('system', '');
        addChatMessage('system', '💡 You can still create and edit slides manually!');
        
        return {
            success: false,
            error: 'AI features require backend server - see instructions above',
            githubPages: true
        };
    };
    
    window.electronAPI.testOllamaConnection = async function() {
        return {
            success: false,
            message: 'Running on GitHub Pages - backend required for AI features',
            githubPages: true,
            models: 0
        };
    };
    
    // Enable offline mode features
    enableOfflineMode();
    
    return true;
}

// Setup fallback mode for local development without proxy
async function setupFallbackMode() {
    console.log('💻 Setting up local fallback mode...');
    
    // Show instructions for local setup
    setTimeout(() => {
        addChatMessage('system', '� **Local Development Setup**');
        addChatMessage('system', 'To enable AI features, start the proxy server:');
        addChatMessage('system', '```bash\nnode proxy-server.js\n```');
        addChatMessage('system', 'Then refresh this page. The app will work in offline mode until then.');
    }, 2000);
    
    enableOfflineMode();
    return true;
}

// Enable offline mode with limited functionality
function enableOfflineMode() {
    console.log('📴 Enabling offline mode...');
    
    // Override webAPI functions for offline mode
    const originalOllamaChat = window.electronAPI.ollamaChat;
    const originalTestConnection = window.electronAPI.testOllamaConnection;
    
    window.electronAPI.ollamaChat = async function(prompt, model = 'ipedrax-weeky:latest') {
        // Try original first (in case proxy becomes available)
        try {
            const result = await originalOllamaChat(prompt, model);
            if (result.success) return result;
        } catch (error) {
            console.log('🔄 Falling back to offline mode');
        }
        
        // Offline fallback with helpful message
        addChatMessage('system', '📴 **Offline Mode**: AI features unavailable');
        addChatMessage('system', 'You can still create and edit slides manually. For AI features, please set up the backend server.');
        
        return {
            success: false,
            error: 'Offline mode - AI features require backend server',
            offline: true
        };
    };
    
    window.electronAPI.testOllamaConnection = async function() {
        try {
            const result = await originalTestConnection();
            if (result.success) return result;
        } catch (error) {
            console.log('🔄 Connection test failed, using offline mode');
        }
        
        return {
            success: false,
            message: 'Offline mode - backend server required for AI features',
            offline: true,
            models: 0
        };
    };
}

// Initialize the application
async function init() {
    console.log('🚀 Initializing Pitch Perfect...');
    
    // Initialize DOM elements first
    console.log('🔍 Getting DOM elements...');
    elements = {
        createSlidesBtn: document.getElementById('create-slides-btn'),
        loadBtn: document.getElementById('load-btn'),
        modelSelect: document.getElementById('model-select'),
        addSlideBtn: document.getElementById('add-slide-btn'),
        slidesList: document.getElementById('slides-list'),
        slideTitle: document.getElementById('slide-title'),
        slideContent: document.getElementById('slide-content'),
        slideNotes: document.getElementById('slide-notes'),
        slideTheme: document.getElementById('slide-theme'),
        slideCanvas: document.getElementById('slide-canvas'),
        aiImproveBtn: document.getElementById('ai-improve-btn'),
        aiSuggestBtn: document.getElementById('ai-suggest-btn'),
        chatMessages: document.getElementById('chat-messages'),
        chatInput: document.getElementById('chat-input'),
        sendBtn: document.getElementById('send-btn'),
        connectionStatus: document.getElementById('connection-status'),
        previewModal: document.getElementById('preview-modal'),
        showSessionLogsBtn: document.getElementById('show-session-logs'),
        clearChatBtn: document.getElementById('clear-chat'),
        sessionLogsModal: document.getElementById('session-logs-modal')
    };
    
    console.log('🔍 Model select element:', elements.modelSelect);
    console.log('🔍 Add slide button element:', elements.addSlideBtn);
    console.log('🔍 Add slide button exists:', !!elements.addSlideBtn);
    console.log('🔍 AI Improve button element:', elements.aiImproveBtn);
    console.log('🔍 AI Improve button exists:', !!elements.aiImproveBtn);
    console.log('🔍 AI Suggest button element:', elements.aiSuggestBtn);
    console.log('🔍 AI Suggest button exists:', !!elements.aiSuggestBtn);
    
    // Check proxy availability and setup appropriate mode
    await checkProxyAvailability();
    
    console.log('📦 Setting up event listeners...');
    setupEventListeners();
    console.log('✅ Event listeners set up successfully');
    console.log('🎨 Initializing slide canvas...');
    initializeSlideCanvas();
    console.log('🔌 Loading available models...');
    await loadAvailableModels();
    console.log('📄 Rendering slides...');
    renderSlides();
    console.log('🔄 Updating create slides button...');
    updateCreateSlidesButton();
    console.log('📄 Loading first slide...');
    if (slides.length > 0) {
        loadSlide(0);
    } else {
        // Create a default slide to work with
        console.log('➕ No slides found, creating default slide...');
        addNewSlide();
    }
    console.log('✅ Initialization complete!');
    
    // Add global debugging function
    window.debugAI = function() {
        console.log('🔍 AI DEBUGGING REPORT:');
        console.log('  🔧 aiImproveBtn element:', elements.aiImproveBtn);
        console.log('  🔧 aiImproveBtn exists:', !!elements.aiImproveBtn);
        console.log('  🔧 selectedModel:', selectedModel);
        console.log('  🔧 currentSlideIndex:', currentSlideIndex);
        console.log('  🔧 slides.length:', slides.length);
        console.log('  🔧 Current slide:', currentSlideIndex >= 0 ? slides[currentSlideIndex] : null);
        console.log('  🔧 webAPI available:', !!window.electronAPI);
        console.log('  🔧 ollamaChat function:', typeof window.electronAPI?.ollamaChat);
        console.log('  🔧 Is GitHub Pages:', window.location.hostname.includes('github.io'));
        console.log('  🔧 Current hostname:', window.location.hostname);
        
        // Test button click programmatically
        if (elements.aiImproveBtn) {
            console.log('🧪 Testing button click...');
            elements.aiImproveBtn.click();
        } else {
            console.log('❌ Cannot test - button not found');
        }
        
        return 'Debug complete - check console output above';
    };
    
    console.log('🧪 Added global debugging function: window.debugAI()');
    
    // Add a visual indicator that the app initialized
    setTimeout(() => {
        const isGitHubPages = window.location.hostname.includes('github.io') || 
                             window.location.hostname.includes('github.com');
        
        if (isGitHubPages) {
            addChatMessage('system', '✅ Pitch Perfect running on GitHub Pages!');
            addChatMessage('system', '🌐 **GitHub Pages Mode** - Optimized for static hosting');
        } else {
            addChatMessage('system', '✅ Pitch Perfect inicializado com sucesso!');
        }
        
        addChatMessage('system', '🚀 **Startup Pitch Builder** - Create professional startup presentations with AI!');
        addChatMessage('system', '📄 Now supports PowerPoint (.pptx) file format for presentations!');
        addChatMessage('system', '🎯 **Welcome! Let\'s create your startup pitch presentation.**');
        addChatMessage('system', 'I\'ll guide you through a quick questionnaire to build a professional pitch based on your validation data.');
        addChatMessage('system', '');
        addChatMessage('system', '📋 **Available options:**');
        addChatMessage('system', '• Click "➕ Add Slide" to create slides manually');
        addChatMessage('system', '• Use "📂 Carregar Apresentação" to load existing presentations');
        
        if (isGitHubPages) {
            addChatMessage('system', '• For AI features, set up backend server (see instructions above)');
        }
        addChatMessage('system', '');
        
        // Auto-start the questionnaire
        setTimeout(() => {
            startStartupQuestionnaire();
        }, 2000);
    }, 1000);
}

// Initialize slide canvas
function initializeSlideCanvas() {
    const canvas = elements.slideCanvas;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 800;
    canvas.height = 450;
    
    // Initial render
    renderSlideCanvas();
}

// Render slide on canvas with advanced styling
function renderSlideCanvas() {
    const canvas = elements.slideCanvas;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Get current slide content and styling
    const title = elements.slideTitle.value || 'Slide Title';
    const content = elements.slideContent.value || 'Slide content goes here...';
    const currentSlide = currentSlideIndex >= 0 && slides[currentSlideIndex] ? slides[currentSlideIndex] : null;
    
    // Determine theme based on slide theme or default
    const slideStyle = currentSlide?.theme || currentSlide?.style || 'startup_modern';
    const theme = slideThemes[slideStyle] || legacyThemes[slideStyle] || slideThemes.startup_modern;
    
    // Debug: Log styling information
    console.log('🎨 Canvas Rendering Debug:');
    console.log('Current slide index:', currentSlideIndex);
    console.log('Current slide:', currentSlide);
    console.log('Slide style:', slideStyle);
    console.log('Selected theme:', theme);
    if (currentSlide) {
        console.log('Slide custom properties:');
        console.log('  backgroundColor:', currentSlide.backgroundColor);
        console.log('  textColor:', currentSlide.textColor);
        console.log('  accentColor:', currentSlide.accentColor);
        console.log('  titleStyle:', currentSlide.titleStyle);
        console.log('  contentStyle:', currentSlide.contentStyle);
    }
    
    // Apply background
    applyBackground(ctx, canvas, theme, currentSlide);
    
    // Apply decorations
    applyDecorations(ctx, canvas, theme, currentSlide);
    
    // Render title with custom styling
    renderStyledTitle(ctx, title, theme, currentSlide);
    
    // Render content with custom styling
    renderStyledContent(ctx, content, theme, currentSlide, canvas);
    
    // Add professional border
    ctx.strokeStyle = currentSlide?.accentColor || theme.accentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function applyBackground(ctx, canvas, theme, slide) {
    const bgColor = slide?.backgroundColor || theme.backgroundColor;
    
    if (bgColor.startsWith('gradient:')) {
        // Apply gradient background
        const gradientType = bgColor.split(':')[1];
        let gradient;
        
        switch (gradientType) {
            // Business gradients
            case 'business_dynamic':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#1e40af');
                gradient.addColorStop(0.5, '#3b82f6');
                gradient.addColorStop(1, '#60a5fa');
                break;
            case 'business_growth':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#f0f9ff');
                gradient.addColorStop(1, '#dbeafe');
                break;
            case 'business_analytics':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#1e293b');
                gradient.addColorStop(1, '#475569');
                break;
                
            // Startup gradients
            case 'startup':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#0f172a');
                gradient.addColorStop(0.5, '#1e293b');
                gradient.addColorStop(1, '#334155');
                break;
            case 'startup_unicorn':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#ec4899');
                gradient.addColorStop(0.5, '#be185d');
                gradient.addColorStop(1, '#831843');
                break;
            case 'startup_tech':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#1e40af');
                gradient.addColorStop(1, '#3730a3');
                break;
            case 'startup_dynamic':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#ef4444');
                gradient.addColorStop(0.3, '#dc2626');
                gradient.addColorStop(0.7, '#b91c1c');
                gradient.addColorStop(1, '#991b1b');
                break;
            case 'startup_future':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#0c0a09');
                gradient.addColorStop(0.5, '#1c1917');
                gradient.addColorStop(1, '#292524');
                break;
            case 'startup_scale':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#059669');
                gradient.addColorStop(1, '#065f46');
                break;
            case 'startup_launch':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/3, 0, canvas.width/2, canvas.height/3, canvas.width);
                gradient.addColorStop(0, '#fbbf24');
                gradient.addColorStop(0.6, '#f59e0b');
                gradient.addColorStop(1, '#d97706');
                break;
            case 'startup_revolution':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#f97316');
                gradient.addColorStop(0.5, '#ea580c');
                gradient.addColorStop(1, '#c2410c');
                break;
                
            // Tech gradients
            case 'tech':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#111827');
                gradient.addColorStop(1, '#1f2937');
                break;
            case 'tech_cyber':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.3, '#1a0033');
                gradient.addColorStop(0.7, '#330066');
                gradient.addColorStop(1, '#000000');
                break;
            case 'tech_quantum':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#8b5cf6');
                gradient.addColorStop(0.4, '#7c3aed');
                gradient.addColorStop(0.8, '#6d28d9');
                gradient.addColorStop(1, '#5b21b6');
                break;
            case 'tech_cloud':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#e0f2fe');
                gradient.addColorStop(0.5, '#bae6fd');
                gradient.addColorStop(1, '#7dd3fc');
                break;
            case 'tech_ml':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#f59e0b');
                gradient.addColorStop(0.5, '#d97706');
                gradient.addColorStop(1, '#b45309');
                break;
            case 'tech_vr':
                gradient = ctx.createRadialGradient(canvas.width/4, canvas.height/4, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#e74c3c');
                gradient.addColorStop(0.5, '#c0392b');
                gradient.addColorStop(1, '#a93226');
                break;
            case 'tech_5g':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#9c88ff');
                gradient.addColorStop(0.5, '#8b5cf6');
                gradient.addColorStop(1, '#7c3aed');
                break;
            case 'tech_micro':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#e67e22');
                gradient.addColorStop(1, '#d35400');
                break;
            case 'tech_neural':
                gradient = ctx.createRadialGradient(canvas.width/3, canvas.height/3, 0, canvas.width/2, canvas.height/2, canvas.width);
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(0.4, '#ee5a6f');
                gradient.addColorStop(0.8, '#e91e63');
                gradient.addColorStop(1, '#ad1457');
                break;
            case 'tech_web3':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#ff00ff');
                gradient.addColorStop(0.3, '#8b00ff');
                gradient.addColorStop(0.7, '#4b0082');
                gradient.addColorStop(1, '#000000');
                break;
                
            // Creative gradients
            case 'creative':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#fef3c7');
                gradient.addColorStop(1, '#f59e0b');
                break;
            case 'creative_artistic':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#fed7aa');
                gradient.addColorStop(0.5, '#fdba74');
                gradient.addColorStop(1, '#fb923c');
                break;
            case 'creative_modern':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#fecaca');
                gradient.addColorStop(0.5, '#fca5a5');
                gradient.addColorStop(1, '#f87171');
                break;
            case 'creative_pastel':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#e9d5ff');
                gradient.addColorStop(0.5, '#ddd6fe');
                gradient.addColorStop(1, '#c4b5fd');
                break;
            case 'creative_retro':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#ff8a80');
                gradient.addColorStop(0.5, '#ff5722');
                gradient.addColorStop(1, '#d84315');
                break;
            case 'creative_exp':
                gradient = ctx.createRadialGradient(canvas.width/4, canvas.height/4, 0, canvas.width/2, canvas.height/2, canvas.width);
                gradient.addColorStop(0, '#ff0080');
                gradient.addColorStop(0.4, '#ff1493');
                gradient.addColorStop(0.8, '#dc143c');
                gradient.addColorStop(1, '#8b0000');
                break;
            case 'creative_water':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#bfdbfe');
                gradient.addColorStop(0.3, '#93c5fd');
                gradient.addColorStop(0.7, '#60a5fa');
                gradient.addColorStop(1, '#3b82f6');
                break;
            case 'creative_collage':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#fef2f2');
                gradient.addColorStop(0.3, '#fecaca');
                gradient.addColorStop(0.7, '#f87171');
                gradient.addColorStop(1, '#ef4444');
                break;
            case 'creative_grunge':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#4a5568');
                gradient.addColorStop(0.5, '#2d3748');
                gradient.addColorStop(1, '#1a202c');
                break;
            case 'creative_surreal':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#e9d5ff');
                gradient.addColorStop(0.3, '#c4b5fd');
                gradient.addColorStop(0.7, '#a78bfa');
                gradient.addColorStop(1, '#8b5cf6');
                break;
            case 'creative_abstract':
                gradient = ctx.createRadialGradient(canvas.width/3, canvas.height/3, 0, canvas.width/2, canvas.height/2, canvas.width);
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(0.4, '#ff5252');
                gradient.addColorStop(0.8, '#f44336');
                gradient.addColorStop(1, '#d32f2f');
                break;
                
            // Medical gradients
            case 'medical_pharma':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#e9d5ff');
                gradient.addColorStop(0.5, '#c4b5fd');
                gradient.addColorStop(1, '#a78bfa');
                break;
            case 'medical_neuro':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#bfdbfe');
                gradient.addColorStop(0.5, '#93c5fd');
                gradient.addColorStop(1, '#60a5fa');
                break;
            case 'medical_pediatric':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#fce7f3');
                gradient.addColorStop(0.5, '#fbcfe8');
                gradient.addColorStop(1, '#f9a8d4');
                break;
            case 'medical_genetics':
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#e9d5ff');
                gradient.addColorStop(1, '#c4b5fd');
                break;
            case 'medical_pathology':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#fce7f3');
                gradient.addColorStop(1, '#f3e8ff');
                break;
            case 'medical_immuno':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#e9d5ff');
                gradient.addColorStop(1, '#ddd6fe');
                break;
            case 'medical_psych':
                gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
                gradient.addColorStop(0, '#dbeafe');
                gradient.addColorStop(0.5, '#bfdbfe');
                gradient.addColorStop(1, '#93c5fd');
                break;
            case 'medical_sports':
                gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2);
                gradient.addColorStop(0, '#fecaca');
                gradient.addColorStop(0.5, '#fca5a5');
                gradient.addColorStop(1, '#f87171');
                break;
                
            // Default fallback
            default:
                gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
                gradient.addColorStop(0, '#ffffff');
                gradient.addColorStop(1, '#f8fafc');
                break;
        }
        
        
        ctx.fillStyle = gradient;
    } else {
        ctx.fillStyle = bgColor;
    }
    
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function applyDecorations(ctx, canvas, theme, slide) {
    const decorations = slide?.decorations || theme.decorations;
    const themeName = slide?.style || theme.name || 'business_classic';
    
    // Apply theme-specific decorations
    switch (themeName) {
        // BUSINESS THEMES
        case 'business_classic':
            drawBusinessClassic(ctx, canvas, theme);
            break;
        case 'business_modern':
            drawBusinessModern(ctx, canvas, theme);
            break;
        case 'business_executive':
            drawBusinessExecutive(ctx, canvas, theme);
            break;
        case 'business_corporate':
            drawBusinessCorporate(ctx, canvas, theme);
            break;
        case 'business_minimal':
            drawBusinessMinimal(ctx, canvas, theme);
            break;
        case 'business_professional':
            drawBusinessProfessional(ctx, canvas, theme);
            break;
        case 'business_elegant':
            drawBusinessElegant(ctx, canvas, theme);
            break;
        case 'business_formal':
            drawBusinessFormal(ctx, canvas, theme);
            break;
        case 'business_dynamic':
            drawBusinessDynamic(ctx, canvas, theme);
            break;
        case 'business_contemporary':
            drawBusinessContemporary(ctx, canvas, theme);
            break;
        case 'business_premium':
            drawBusinessPremium(ctx, canvas, theme);
            break;
        case 'business_strategic':
            drawBusinessStrategic(ctx, canvas, theme);
            break;
        case 'business_innovative':
            drawBusinessInnovative(ctx, canvas, theme);
            break;
        case 'business_growth':
            drawBusinessGrowth(ctx, canvas, theme);
            break;
        case 'business_leadership':
            drawBusinessLeadership(ctx, canvas, theme);
            break;
        case 'business_success':
            drawBusinessSuccess(ctx, canvas, theme);
            break;
        case 'business_global':
            drawBusinessGlobal(ctx, canvas, theme);
            break;
        case 'business_finance':
            drawBusinessFinance(ctx, canvas, theme);
            break;
        case 'business_consulting':
            drawBusinessConsulting(ctx, canvas, theme);
            break;
        case 'business_analytics':
            drawBusinessAnalytics(ctx, canvas, theme);
            break;
            
        // STARTUP THEMES
        case 'startup_disruptive':
            drawStartupDisruptive(ctx, canvas, theme);
            break;
        case 'startup_innovative':
            drawStartupInnovative(ctx, canvas, theme);
            break;
        case 'startup_unicorn':
            drawStartupUnicorn(ctx, canvas, theme);
            break;
        case 'startup_growth':
            drawStartupGrowth(ctx, canvas, theme);
            break;
        case 'startup_venture':
            drawStartupVenture(ctx, canvas, theme);
            break;
        case 'startup_tech':
            drawStartupTech(ctx, canvas, theme);
            break;
        case 'startup_bold':
            drawStartupBold(ctx, canvas, theme);
            break;
        case 'startup_modern':
            drawStartupModern(ctx, canvas, theme);
            break;
        case 'startup_dynamic':
            drawStartupDynamic(ctx, canvas, theme);
            break;
        case 'startup_agile':
            drawStartupAgile(ctx, canvas, theme);
            break;
        case 'startup_future':
            drawStartupFuture(ctx, canvas, theme);
            break;
        case 'startup_mvp':
            drawStartupMVP(ctx, canvas, theme);
            break;
        case 'startup_pivot':
            drawStartupPivot(ctx, canvas, theme);
            break;
        case 'startup_scale':
            drawStartupScale(ctx, canvas, theme);
            break;
        case 'startup_seed':
            drawStartupSeed(ctx, canvas, theme);
            break;
        case 'startup_disrupt':
            drawStartupDisrupt(ctx, canvas, theme);
            break;
        case 'startup_launch':
            drawStartupLaunch(ctx, canvas, theme);
            break;
        case 'startup_viral':
            drawStartupViral(ctx, canvas, theme);
            break;
        case 'startup_ecosystem':
            drawStartupEcosystem(ctx, canvas, theme);
            break;
        case 'startup_revolution':
            drawStartupRevolution(ctx, canvas, theme);
            break;
            
        // TECH THEMES
        case 'tech_code':
            drawTechCode(ctx, canvas, theme);
            break;
        case 'tech_cyber':
            drawTechCyber(ctx, canvas, theme);
            break;
        case 'tech_ai':
            drawTechAI(ctx, canvas, theme);
            break;
        case 'tech_quantum':
            drawTechQuantum(ctx, canvas, theme);
            break;
        case 'tech_blockchain':
            drawTechBlockchain(ctx, canvas, theme);
            break;
        case 'tech_cloud':
            drawTechCloud(ctx, canvas, theme);
            break;
        case 'tech_iot':
            drawTechIoT(ctx, canvas, theme);
            break;
        case 'tech_machine':
            drawTechMachine(ctx, canvas, theme);
            break;
        case 'tech_robotics':
            drawTechRobotics(ctx, canvas, theme);
            break;
        case 'tech_vr':
            drawTechVR(ctx, canvas, theme);
            break;
        case 'tech_data':
            drawTechData(ctx, canvas, theme);
            break;
        case 'tech_security':
            drawTechSecurity(ctx, canvas, theme);
            break;
        case 'tech_5g':
            drawTech5G(ctx, canvas, theme);
            break;
        case 'tech_edge':
            drawTechEdge(ctx, canvas, theme);
            break;
        case 'tech_devops':
            drawTechDevOps(ctx, canvas, theme);
            break;
        case 'tech_microservices':
            drawTechMicroservices(ctx, canvas, theme);
            break;
        case 'tech_ar':
            drawTechAR(ctx, canvas, theme);
            break;
        case 'tech_neural':
            drawTechNeural(ctx, canvas, theme);
            break;
        case 'tech_serverless':
            drawTechServerless(ctx, canvas, theme);
            break;
        case 'tech_web3':
            drawTechWeb3(ctx, canvas, theme);
            break;
            
        // CREATIVE THEMES
        case 'creative_artistic':
            drawCreativeArtistic(ctx, canvas, theme);
            break;
        case 'creative_vibrant':
            drawCreativeVibrant(ctx, canvas, theme);
            break;
        case 'creative_modern':
            drawCreativeModern(ctx, canvas, theme);
            break;
        case 'creative_bold':
            drawCreativeBold(ctx, canvas, theme);
            break;
        case 'creative_pastel':
            drawCreativePastel(ctx, canvas, theme);
            break;
        case 'creative_dynamic':
            drawCreativeDynamic(ctx, canvas, theme);
            break;
        case 'creative_minimalist':
            drawCreativeMinimalist(ctx, canvas, theme);
            break;
        case 'creative_retro':
            drawCreativeRetro(ctx, canvas, theme);
            break;
        case 'creative_organic':
            drawCreativeOrganic(ctx, canvas, theme);
            break;
        case 'creative_experimental':
            drawCreativeExperimental(ctx, canvas, theme);
            break;
        case 'creative_watercolor':
            drawCreativeWatercolor(ctx, canvas, theme);
            break;
        case 'creative_neon':
            drawCreativeNeon(ctx, canvas, theme);
            break;
        case 'creative_collage':
            drawCreativeCollage(ctx, canvas, theme);
            break;
        case 'creative_geometric':
            drawCreativeGeometric(ctx, canvas, theme);
            break;
        case 'creative_grunge':
            drawCreativeGrunge(ctx, canvas, theme);
            break;
        case 'creative_pop':
            drawCreativePop(ctx, canvas, theme);
            break;
        case 'creative_surreal':
            drawCreativeSurreal(ctx, canvas, theme);
            break;
        case 'creative_digital':
            drawCreativeDigital(ctx, canvas, theme);
            break;
        case 'creative_abstract':
            drawCreativeAbstract(ctx, canvas, theme);
            break;
        case 'creative_handdrawn':
            drawCreativeHanddrawn(ctx, canvas, theme);
            break;
            
        // MEDICAL THEMES
        case 'medical_clinical':
            drawMedicalClinical(ctx, canvas, theme);
            break;
        case 'medical_research':
            drawMedicalResearch(ctx, canvas, theme);
            break;
        case 'medical_pharma':
            drawMedicalPharma(ctx, canvas, theme);
            break;
        case 'medical_cardiology':
            drawMedicalCardiology(ctx, canvas, theme);
            break;
        case 'medical_neurology':
            drawMedicalNeurology(ctx, canvas, theme);
            break;
        case 'medical_surgery':
            drawMedicalSurgery(ctx, canvas, theme);
            break;
        case 'medical_pediatric':
            drawMedicalPediatric(ctx, canvas, theme);
            break;
        case 'medical_emergency':
            drawMedicalEmergency(ctx, canvas, theme);
            break;
        case 'medical_diagnostic':
            drawMedicalDiagnostic(ctx, canvas, theme);
            break;
        case 'medical_genetics':
            drawMedicalGenetics(ctx, canvas, theme);
            break;
        case 'medical_oncology':
            drawMedicalOncology(ctx, canvas, theme);
            break;
        case 'medical_radiology':
            drawMedicalRadiology(ctx, canvas, theme);
            break;
        case 'medical_pathology':
            drawMedicalPathology(ctx, canvas, theme);
            break;
        case 'medical_rehabilitation':
            drawMedicalRehabilitation(ctx, canvas, theme);
            break;
        case 'medical_immunology':
            drawMedicalImmunology(ctx, canvas, theme);
            break;
        case 'medical_dermatology':
            drawMedicalDermatology(ctx, canvas, theme);
            break;
        case 'medical_psychiatry':
            drawMedicalPsychiatry(ctx, canvas, theme);
            break;
        case 'medical_anesthesiology':
            drawMedicalAnesthesiology(ctx, canvas, theme);
            break;
        case 'medical_sports':
            drawMedicalSports(ctx, canvas, theme);
            break;
        case 'medical_telemedicine':
            drawMedicalTelemedicine(ctx, canvas, theme);
            break;
            
        default:
            drawBusinessClassic(ctx, canvas, theme);
            break;
    }
}

// BUSINESS THEME DECORATIONS
function drawBusinessClassic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#3b82f6';
    
    // Classic business lines - clean and professional
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 2;
    
    // Horizontal separator lines
    ctx.beginPath();
    ctx.moveTo(40, canvas.height - 50);
    ctx.lineTo(canvas.width - 40, canvas.height - 50);
    ctx.stroke();
    
    // Corner brackets
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(20, 40);
    ctx.moveTo(20, 20);
    ctx.lineTo(40, 20);
    ctx.moveTo(canvas.width - 20, 20);
    ctx.lineTo(canvas.width - 40, 20);
    ctx.moveTo(canvas.width - 20, 20);
    ctx.lineTo(canvas.width - 20, 40);
    ctx.stroke();
}

function drawBusinessModern(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#1e40af';
    
    // Modern geometric shapes
    ctx.fillStyle = accentColor + '15';
    
    // Overlapping rectangles
    ctx.fillRect(canvas.width - 100, 30, 80, 40);
    ctx.fillRect(canvas.width - 90, 40, 80, 40);
    
    // Abstract triangle
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 60);
    ctx.lineTo(60, canvas.height - 80);
    ctx.lineTo(90, canvas.height - 60);
    ctx.closePath();
    ctx.fill();
}

function drawBusinessExecutive(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#60a5fa';
    
    // Premium border accents
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    // Top accent border
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.stroke();
    
    // Executive diamond pattern
    ctx.fillStyle = accentColor + '20';
    for (let i = 0; i < 3; i++) {
        const x = canvas.width - 60 + (i * 15);
        const y = canvas.height - 40;
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.lineTo(x + 8, y);
        ctx.lineTo(x, y + 8);
        ctx.lineTo(x - 8, y);
        ctx.closePath();
        ctx.fill();
    }
}

function drawBusinessCorporate(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#2563eb';
    
    // Corporate grid pattern
    ctx.strokeStyle = accentColor + '20';
    ctx.lineWidth = 1;
    
    const gridSize = 25;
    for (let x = 0; x < canvas.width; x += gridSize) {
        if (x % (gridSize * 2) === 0) {
            ctx.beginPath();
            ctx.moveTo(x, canvas.height - 60);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
    }
    
    // Corporate icon placeholder
    ctx.fillStyle = accentColor + '40';
    ctx.fillRect(20, canvas.height - 80, 15, 15);
    ctx.fillRect(40, canvas.height - 80, 15, 15);
}

function drawBusinessMinimal(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#4f46e5';
    
    // Single elegant line
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 40);
    ctx.lineTo(canvas.width - 50, canvas.height - 40);
    ctx.stroke();
    
    // Minimal dot accent
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(canvas.width - 30, canvas.height - 40, 3, 0, 2 * Math.PI);
    ctx.fill();
}

function drawBusinessProfessional(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#1d4ed8';
    
    // Professional framework
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.rect(30, canvas.height - 70, canvas.width - 60, 50);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Professional bars
    ctx.fillStyle = accentColor + '30';
    for (let i = 0; i < 4; i++) {
        const height = 10 + (i * 8);
        ctx.fillRect(50 + (i * 20), canvas.height - 50, 15, height);
    }
}

function drawBusinessElegant(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0369a1';
    
    // Elegant curves
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 30);
    ctx.quadraticCurveTo(canvas.width / 2, canvas.height - 60, canvas.width - 30, canvas.height - 30);
    ctx.stroke();
    
    // Elegant flourishes
    ctx.fillStyle = accentColor + '25';
    ctx.beginPath();
    ctx.arc(60, canvas.height - 45, 12, 0, Math.PI);
    ctx.fill();
}

function drawBusinessFormal(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#1e3a8a';
    
    // Formal structure lines
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    // Vertical separators
    ctx.beginPath();
    ctx.moveTo(canvas.width / 3, canvas.height - 60);
    ctx.lineTo(canvas.width / 3, canvas.height - 20);
    ctx.moveTo((canvas.width / 3) * 2, canvas.height - 60);
    ctx.lineTo((canvas.width / 3) * 2, canvas.height - 20);
    ctx.stroke();
    
    // Formal header line
    ctx.beginPath();
    ctx.moveTo(30, canvas.height - 60);
    ctx.lineTo(canvas.width - 30, canvas.height - 60);
    ctx.stroke();
}

function drawBusinessDynamic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#93c5fd';
    
    // Dynamic movement lines
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 5; i++) {
        const x = 40 + (i * 20);
        const startY = canvas.height - 20 - (i * 5);
        const endY = canvas.height - 40 - (i * 3);
        
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x + 15, endY);
        ctx.stroke();
    }
    
    // Dynamic circles
    ctx.fillStyle = accentColor + '30';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(canvas.width - 40 - (i * 25), canvas.height - 40, 8 - (i * 2), 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawBusinessContemporary(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0284c7';
    
    // Contemporary geometric pattern
    ctx.fillStyle = accentColor + '25';
    
    // Hexagonal pattern
    const hexSize = 15;
    for (let i = 0; i < 6; i++) {
        const x = 50 + (i * 25);
        const y = canvas.height - 45;
        
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
            const angle = (j * Math.PI) / 3;
            const xPos = x + hexSize * Math.cos(angle);
            const yPos = y + hexSize * Math.sin(angle);
            if (j === 0) ctx.moveTo(xPos, yPos);
            else ctx.lineTo(xPos, yPos);
        }
        ctx.closePath();
        ctx.fill();
    }
}

function drawBusinessPremium(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#38bdf8';
    
    // Premium luxury accents
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    // Premium border frame
    ctx.beginPath();
    ctx.rect(15, 15, canvas.width - 30, canvas.height - 30);
    ctx.stroke();
    
    // Premium corner ornaments
    ctx.fillStyle = accentColor + '60';
    const ornamentSize = 8;
    
    // Top corners
    ctx.fillRect(20, 20, ornamentSize, ornamentSize);
    ctx.fillRect(canvas.width - 20 - ornamentSize, 20, ornamentSize, ornamentSize);
    
    // Bottom corners
    ctx.fillRect(20, canvas.height - 20 - ornamentSize, ornamentSize, ornamentSize);
    ctx.fillRect(canvas.width - 20 - ornamentSize, canvas.height - 20 - ornamentSize, ornamentSize, ornamentSize);
}

function drawBusinessStrategic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#2563eb';
    
    // Strategic arrow patterns
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    // Strategic flow arrows
    for (let i = 0; i < 4; i++) {
        const x = 50 + (i * 70);
        const y = canvas.height - 40;
        
        // Arrow body
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 30, y);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x + 30, y);
        ctx.lineTo(x + 25, y - 5);
        ctx.moveTo(x + 30, y);
        ctx.lineTo(x + 25, y + 5);
        ctx.stroke();
    }
    
    // Strategic data points
    ctx.fillStyle = accentColor + '40';
    for (let i = 0; i < 5; i++) {
        const x = 40 + (i * 60);
        const height = 10 + (i * 5);
        ctx.fillRect(x, canvas.height - 30, 8, -height);
    }
}

function drawBusinessInnovative(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6366f1';
    
    // Innovation spiral
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    const centerX = canvas.width - 60;
    const centerY = canvas.height - 45;
    
    ctx.beginPath();
    for (let i = 0; i < 50; i++) {
        const angle = i * 0.3;
        const radius = i * 0.5;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Innovation nodes
    ctx.fillStyle = accentColor + '40';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(50 + (i * 40), canvas.height - 50, 6, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawBusinessGrowth(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#1d4ed8';
    
    // Growth chart
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    const points = [
        { x: 40, y: canvas.height - 25 },
        { x: 80, y: canvas.height - 35 },
        { x: 120, y: canvas.height - 45 },
        { x: 160, y: canvas.height - 40 },
        { x: 200, y: canvas.height - 55 },
        { x: 240, y: canvas.height - 65 }
    ];
    
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    
    // Growth bars underneath
    ctx.fillStyle = accentColor + '30';
    points.forEach(point => {
        ctx.fillRect(point.x - 3, point.y, 6, canvas.height - point.y);
    });
}

function drawBusinessLeadership(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#1e40af';
    
    // Leadership pyramid
    ctx.fillStyle = accentColor + '30';
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const pyramidBase = 80;
    const pyramidHeight = 50;
    const centerX = canvas.width - 80;
    const baseY = canvas.height - 25;
    
    ctx.beginPath();
    ctx.moveTo(centerX, baseY - pyramidHeight);
    ctx.lineTo(centerX - pyramidBase / 2, baseY);
    ctx.lineTo(centerX + pyramidBase / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Leadership stars
    ctx.fillStyle = accentColor + '80';
    for (let i = 0; i < 3; i++) {
        drawStar(ctx, 50 + (i * 30), canvas.height - 45, 8, 5);
    }
}

function drawBusinessSuccess(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#059669';
    
    // Success checkmarks
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    for (let i = 0; i < 3; i++) {
        const x = 50 + (i * 60);
        const y = canvas.height - 45;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 8, y + 8);
        ctx.lineTo(x + 20, y - 8);
        ctx.stroke();
    }
    
    // Success trophy outline
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const trophyX = canvas.width - 60;
    const trophyY = canvas.height - 60;
    
    // Trophy cup
    ctx.beginPath();
    ctx.arc(trophyX, trophyY + 10, 15, 0, Math.PI);
    ctx.stroke();
    
    // Trophy base
    ctx.beginPath();
    ctx.rect(trophyX - 20, trophyY + 25, 40, 8);
    ctx.stroke();
}

function drawBusinessGlobal(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0ea5e9';
    
    // Global grid (world map style)
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    // Latitude lines
    for (let i = 1; i < 4; i++) {
        const y = (canvas.height / 4) * i;
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(canvas.width - 30, y);
        ctx.stroke();
    }
    
    // Longitude lines
    for (let i = 1; i < 6; i++) {
        const x = (canvas.width / 6) * i;
        ctx.beginPath();
        ctx.arc(x, canvas.height / 2, canvas.height / 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Global connection nodes
    ctx.fillStyle = accentColor + '60';
    const nodes = [
        { x: 80, y: canvas.height - 60 },
        { x: 150, y: canvas.height - 40 },
        { x: 220, y: canvas.height - 55 },
        { x: 290, y: canvas.height - 45 }
    ];
    
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Connection lines
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    for (let i = 0; i < nodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
        ctx.stroke();
    }
}

function drawBusinessFinance(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#059669';
    
    // Financial currency symbols
    ctx.fillStyle = accentColor + '60';
    ctx.font = 'bold 20px Inter';
    ctx.fillText('$', 40, canvas.height - 30);
    ctx.fillText('€', 70, canvas.height - 30);
    ctx.fillText('¥', 100, canvas.height - 30);
    ctx.fillText('£', 130, canvas.height - 30);
    
    // Financial chart bars
    ctx.fillStyle = accentColor + '40';
    const values = [25, 35, 20, 45, 30, 40];
    
    values.forEach((value, index) => {
        const x = 180 + (index * 25);
        const height = value;
        ctx.fillRect(x, canvas.height - 30, 15, -height);
    });
    
    // Financial trend line
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    values.forEach((value, index) => {
        const x = 187 + (index * 25);
        const y = canvas.height - 30 - value;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}

function drawBusinessConsulting(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#7c3aed';
    
    // Consulting framework boxes
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const boxes = [
        { x: 40, y: canvas.height - 60, w: 60, h: 35 },
        { x: 120, y: canvas.height - 60, w: 60, h: 35 },
        { x: 200, y: canvas.height - 60, w: 60, h: 35 }
    ];
    
    boxes.forEach(box => {
        ctx.beginPath();
        ctx.rect(box.x, box.y, box.w, box.h);
        ctx.stroke();
    });
    
    // Consulting arrows between boxes
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < boxes.length - 1; i++) {
        const fromX = boxes[i].x + boxes[i].w;
        const toX = boxes[i + 1].x;
        const y = boxes[i].y + boxes[i].h / 2;
        
        ctx.beginPath();
        ctx.moveTo(fromX + 5, y);
        ctx.lineTo(toX - 5, y);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(toX - 5, y);
        ctx.lineTo(toX - 10, y - 3);
        ctx.moveTo(toX - 5, y);
        ctx.lineTo(toX - 10, y + 3);
        ctx.stroke();
    }
    
    // Consulting advisory elements
    ctx.fillStyle = accentColor + '30';
    boxes.forEach(box => {
        ctx.fillRect(box.x + 5, box.y + 5, box.w - 10, 8);
    });
}

function drawBusinessAnalytics(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#fbbf24';
    
    // Analytics pie chart
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const centerX = canvas.width - 80;
    const centerY = canvas.height - 50;
    const radius = 25;
    
    const segments = [0.3, 0.4, 0.2, 0.1];
    let currentAngle = 0;
    
    segments.forEach((segment, index) => {
        const startAngle = currentAngle;
        const endAngle = currentAngle + (segment * 2 * Math.PI);
        
        ctx.fillStyle = accentColor + (30 + index * 15);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        currentAngle = endAngle;
    });
    
    // Analytics data points
    ctx.fillStyle = accentColor + '60';
    const dataPoints = [
        { x: 50, y: canvas.height - 25, value: 15 },
        { x: 80, y: canvas.height - 35, value: 25 },
        { x: 110, y: canvas.height - 20, value: 10 },
        { x: 140, y: canvas.height - 45, value: 35 },
        { x: 170, y: canvas.height - 30, value: 20 }
    ];
    
    dataPoints.forEach(point => {
        ctx.fillRect(point.x - 3, point.y, 6, point.value);
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

// STARTUP THEME DECORATIONS
function drawStartupDisruptive(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#a855f7';
    
    // Disruptive lightning bolt
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 70);
    ctx.lineTo(65, canvas.height - 45);
    ctx.lineTo(55, canvas.height - 45);
    ctx.lineTo(70, canvas.height - 20);
    ctx.lineTo(55, canvas.height - 35);
    ctx.lineTo(65, canvas.height - 35);
    ctx.closePath();
    ctx.stroke();
    
    // Disruptive explosion pattern
    ctx.fillStyle = accentColor + '30';
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = canvas.width - 60 + 20 * Math.cos(angle);
        const y = canvas.height - 45 + 20 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawStartupInnovative(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // Innovation lightbulb outline
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const bulbX = 60;
    const bulbY = canvas.height - 50;
    
    // Bulb shape
    ctx.beginPath();
    ctx.arc(bulbX, bulbY, 15, 0, Math.PI * 1.3);
    ctx.stroke();
    
    // Bulb base
    ctx.beginPath();
    ctx.rect(bulbX - 8, bulbY + 10, 16, 8);
    ctx.stroke();
    
    // Innovation sparks
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x1 = bulbX + 25 * Math.cos(angle);
        const y1 = bulbY + 25 * Math.sin(angle);
        const x2 = bulbX + 35 * Math.cos(angle);
        const y2 = bulbY + 35 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Creative elements
    ctx.fillStyle = accentColor + '40';
    for (let i = 0; i < 5; i++) {
        const x = 150 + (i * 30);
        const y = canvas.height - 40 - (Math.sin(i) * 10);
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawStartupUnicorn(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ec4899';
    
    // Unicorn horn (triangle)
    ctx.fillStyle = accentColor + '70';
    ctx.beginPath();
    ctx.moveTo(60, canvas.height - 70);
    ctx.lineTo(50, canvas.height - 40);
    ctx.lineTo(70, canvas.height - 40);
    ctx.closePath();
    ctx.fill();
    
    // Magical sparkles
    ctx.fillStyle = accentColor + '60';
    const sparkles = [
        { x: 100, y: canvas.height - 60, size: 4 },
        { x: 130, y: canvas.height - 45, size: 6 },
        { x: 160, y: canvas.height - 55, size: 3 },
        { x: 190, y: canvas.height - 40, size: 5 },
        { x: 220, y: canvas.height - 50, size: 4 }
    ];
    
    sparkles.forEach(sparkle => {
        // Star shape
        drawStar(ctx, sparkle.x, sparkle.y, sparkle.size, 5);
    });
    
    // Unicorn rainbow trail
    const colors = ['#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#0000ff', '#4b0082', '#9400d3'];
    
    for (let i = 0; i < colors.length; i++) {
        ctx.strokeStyle = colors[i] + '60';
        ctx.lineWidth = 3;
        
        const y = canvas.height - 30 + (i * 2);
        ctx.beginPath();
        ctx.moveTo(250, y);
        ctx.quadraticCurveTo(300, y - 10, 350, y);
        ctx.stroke();
    }
}

function drawStartupGrowth(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06d6a0';
    
    // Growth rocket
    ctx.fillStyle = accentColor + '70';
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 2;
    
    const rocketX = 60;
    const rocketY = canvas.height - 30;
    
    // Rocket body
    ctx.beginPath();
    ctx.moveTo(rocketX, rocketY - 30);
    ctx.lineTo(rocketX - 8, rocketY);
    ctx.lineTo(rocketX + 8, rocketY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Rocket fins
    ctx.beginPath();
    ctx.moveTo(rocketX - 8, rocketY);
    ctx.lineTo(rocketX - 15, rocketY + 8);
    ctx.lineTo(rocketX - 5, rocketY + 5);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(rocketX + 8, rocketY);
    ctx.lineTo(rocketX + 15, rocketY + 8);
    ctx.lineTo(rocketX + 5, rocketY + 5);
    ctx.closePath();
    ctx.fill();
    
    // Growth trajectory
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(rocketX, rocketY - 30);
    ctx.quadraticCurveTo(150, canvas.height - 80, 250, canvas.height - 60);
    ctx.quadraticCurveTo(320, canvas.height - 40, 380, canvas.height - 20);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Growth metrics
    ctx.fillStyle = accentColor + '40';
    const metrics = [120, 140, 160, 180, 200];
    metrics.forEach((x, index) => {
        const height = 15 + (index * 8);
        ctx.fillRect(x, canvas.height - 25, 12, -height);
    });
}

function drawStartupVenture(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Venture capital stack of coins
    ctx.fillStyle = accentColor + '70';
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
        const x = 60;
        const y = canvas.height - 25 - (i * 4);
        
        ctx.beginPath();
        ctx.ellipse(x, y, 12, 4, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Dollar sign on top coin
        if (i === 4) {
            ctx.fillStyle = accentColor + '100';
            ctx.font = 'bold 12px Inter';
            ctx.fillText('$', x - 3, y + 3);
        }
    }
    
    // Investment arrow
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.moveTo(100, canvas.height - 50);
    ctx.lineTo(200, canvas.height - 30);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(200, canvas.height - 30);
    ctx.lineTo(190, canvas.height - 35);
    ctx.moveTo(200, canvas.height - 30);
    ctx.lineTo(190, canvas.height - 25);
    ctx.stroke();
    
    // Venture funding rounds
    ctx.fillStyle = accentColor + '50';
    const rounds = ['A', 'B', 'C'];
    rounds.forEach((round, index) => {
        const x = 250 + (index * 40);
        
        ctx.beginPath();
        ctx.arc(x, canvas.height - 40, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(round, x - 4, canvas.height - 36);
        ctx.fillStyle = accentColor + '50';
    });
}

// Helper function to draw stars
function drawStar(ctx, x, y, radius, points) {
    const angle = Math.PI / points;
    
    ctx.beginPath();
    for (let i = 0; i < 2 * points; i++) {
        const r = i % 2 === 0 ? radius : radius / 2;
        const currAngle = i * angle;
        const xPos = x + r * Math.cos(currAngle);
        const yPos = y + r * Math.sin(currAngle);
        
        if (i === 0) {
            ctx.moveTo(xPos, yPos);
        } else {
            ctx.lineTo(xPos, yPos);
        }
    }
    ctx.closePath();
    ctx.fill();
}

// Continue with more theme decoration functions...

function drawStartupTech(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#3b82f6';
    
    // Tech startup binary pattern
    ctx.fillStyle = accentColor + '40';
    ctx.font = '12px monospace';
    
    const binary = '1011010001110101';
    for (let i = 0; i < binary.length; i++) {
        ctx.fillText(binary[i], 50 + (i * 15), canvas.height - 30);
    }
    
    // Startup tech nodes
    ctx.fillStyle = accentColor + '60';
    const nodes = [
        { x: 60, y: canvas.height - 60 },
        { x: 120, y: canvas.height - 50 },
        { x: 180, y: canvas.height - 70 }
    ];
    
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Connection lines
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    for (let i = 0; i < nodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
        ctx.stroke();
    }
}

function drawStartupBold(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#dc2626';
    
    // Bold geometric shapes
    ctx.fillStyle = accentColor + '70';
    
    // Bold triangle
    ctx.beginPath();
    ctx.moveTo(60, canvas.height - 70);
    ctx.lineTo(40, canvas.height - 30);
    ctx.lineTo(80, canvas.height - 30);
    ctx.closePath();
    ctx.fill();
    
    // Bold rectangles
    ctx.fillRect(120, canvas.height - 60, 30, 40);
    ctx.fillRect(170, canvas.height - 50, 25, 30);
    ctx.fillRect(220, canvas.height - 65, 35, 45);
    
    // Bold exclamation point
    ctx.fillStyle = accentColor + '90';
    ctx.fillRect(canvas.width - 40, canvas.height - 60, 8, 30);
    ctx.fillRect(canvas.width - 40, canvas.height - 20, 8, 8);
}

function drawStartupModern(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // Modern wave pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += 10) {
        const y = canvas.height - 40 + Math.sin(x * 0.02) * 15;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Modern circles
    ctx.fillStyle = accentColor + '40';
    for (let i = 0; i < 4; i++) {
        const x = 80 + (i * 60);
        const y = canvas.height - 60;
        const radius = 8 + (i * 2);
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawStartupDynamic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Dynamic energy lines
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x1 = canvas.width - 80 + 25 * Math.cos(angle);
        const y1 = canvas.height - 50 + 25 * Math.sin(angle);
        const x2 = canvas.width - 80 + 40 * Math.cos(angle);
        const y2 = canvas.height - 50 + 40 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Dynamic movement arrows
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 4; i++) {
        const x = 50 + (i * 50);
        const y = canvas.height - 40 - (i * 5);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 25, y - 10);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x + 25, y - 10);
        ctx.lineTo(x + 20, y - 5);
        ctx.moveTo(x + 25, y - 10);
        ctx.lineTo(x + 20, y - 15);
        ctx.stroke();
    }
}

function drawStartupAgile(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#10b981';
    
    // Agile spiral methodology
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    const centerX = 80;
    const centerY = canvas.height - 50;
    
    ctx.beginPath();
    for (let i = 0; i < 30; i++) {
        const angle = i * 0.4;
        const radius = i * 1.2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Agile iteration markers
    ctx.fillStyle = accentColor + '70';
    const iterations = ['1', '2', '3', '4'];
    
    iterations.forEach((iteration, index) => {
        const x = 150 + (index * 40);
        const y = canvas.height - 45;
        
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(iteration, x - 3, y + 3);
        ctx.fillStyle = accentColor + '70';
    });
}

function drawStartupFuture(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06b6d4';
    
    // Futuristic hexagon grid
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const hexSize = 15;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            const x = 50 + col * (hexSize * 1.5) + (row % 2) * (hexSize * 0.75);
            const y = canvas.height - 60 + row * (hexSize * Math.sqrt(3) / 2);
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const xPos = x + hexSize * Math.cos(angle);
                const yPos = y + hexSize * Math.sin(angle);
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }
    
    // Future energy core
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, canvas.height - 50, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Energy rings
    for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = accentColor + (30 - i * 10);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width - 60, canvas.height - 50, 8 + (i * 8), 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function drawStartupMVP(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f97316';
    
    // MVP building blocks
    ctx.fillStyle = accentColor + '60';
    
    const blocks = [
        { x: 50, y: canvas.height - 40, w: 25, h: 20 },
        { x: 80, y: canvas.height - 50, w: 25, h: 30 },
        { x: 110, y: canvas.height - 35, w: 25, h: 15 }
    ];
    
    blocks.forEach(block => {
        ctx.fillRect(block.x, block.y, block.w, block.h);
    });
    
    // MVP labels
    ctx.fillStyle = accentColor + '90';
    ctx.font = 'bold 14px Inter';
    ctx.fillText('M', 56, canvas.height - 25);
    ctx.fillText('V', 86, canvas.height - 25);
    ctx.fillText('P', 116, canvas.height - 25);
    
    // Iteration arrow
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.arc(180, canvas.height - 40, 20, 0, Math.PI * 1.5);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(200, canvas.height - 40);
    ctx.lineTo(195, canvas.height - 35);
    ctx.moveTo(200, canvas.height - 40);
    ctx.lineTo(195, canvas.height - 45);
    ctx.stroke();
}

function drawStartupPivot(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#84cc16';
    
    // Pivot direction change
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    
    // Original direction
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 50);
    ctx.lineTo(120, canvas.height - 50);
    ctx.stroke();
    
    // Pivot point
    ctx.fillStyle = accentColor + '90';
    ctx.beginPath();
    ctx.arc(120, canvas.height - 50, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // New direction
    ctx.beginPath();
    ctx.moveTo(120, canvas.height - 50);
    ctx.lineTo(180, canvas.height - 25);
    ctx.stroke();
    
    // Arrow heads
    ctx.beginPath();
    ctx.moveTo(180, canvas.height - 25);
    ctx.lineTo(175, canvas.height - 30);
    ctx.moveTo(180, canvas.height - 25);
    ctx.lineTo(175, canvas.height - 20);
    ctx.stroke();
    
    // Pivot measurement arc
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    
    ctx.beginPath();
    ctx.arc(120, canvas.height - 50, 30, 0, -Math.PI / 4);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawStartupScale(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6366f1';
    
    // Scaling steps
    ctx.fillStyle = accentColor + '60';
    
    const steps = [15, 25, 35, 45, 55];
    steps.forEach((height, index) => {
        const x = 60 + (index * 40);
        const y = canvas.height - 30;
        
        ctx.fillRect(x, y - height, 25, height);
        
        // Step numbers
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText((index + 1).toString(), x + 10, y - height / 2 + 3);
        ctx.fillStyle = accentColor + '60';
    });
    
    // Scale multiplier
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(280, canvas.height - 60);
    ctx.lineTo(350, canvas.height - 30);
    ctx.stroke();
    
    // Multiplier symbols
    ctx.fillStyle = accentColor + '90';
    ctx.font = 'bold 16px Inter';
    ctx.fillText('×10', 320, canvas.height - 40);
}

function drawStartupSeed(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#65a30d';
    
    // Seed growth stages
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    // Seed
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.ellipse(60, canvas.height - 25, 4, 6, 0, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sprout
    ctx.beginPath();
    ctx.moveTo(120, canvas.height - 25);
    ctx.lineTo(120, canvas.height - 40);
    ctx.stroke();
    
    // Small leaf
    ctx.fillStyle = accentColor + '60';
    ctx.beginPath();
    ctx.ellipse(125, canvas.height - 35, 8, 4, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Growing plant
    ctx.strokeStyle = accentColor + '70';
    ctx.beginPath();
    ctx.moveTo(180, canvas.height - 25);
    ctx.lineTo(180, canvas.height - 55);
    ctx.stroke();
    
    // Multiple leaves
    const leafPositions = [
        { x: 185, y: canvas.height - 50 },
        { x: 175, y: canvas.height - 45 },
        { x: 185, y: canvas.height - 40 }
    ];
    
    leafPositions.forEach(leaf => {
        ctx.fillStyle = accentColor + '60';
        ctx.beginPath();
        ctx.ellipse(leaf.x, leaf.y, 6, 3, Math.PI / 6, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Mature tree
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(240, canvas.height - 25);
    ctx.lineTo(240, canvas.height - 65);
    ctx.stroke();
    
    // Tree crown
    ctx.fillStyle = accentColor + '50';
    ctx.beginPath();
    ctx.arc(240, canvas.height - 65, 20, 0, 2 * Math.PI);
    ctx.fill();
}

function drawStartupDisrupt(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ef4444';
    
    // Disruption wave
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    for (let x = 50; x < canvas.width - 50; x += 5) {
        const frequency = 0.05;
        const amplitude = 20;
        const y = canvas.height - 45 + Math.sin(x * frequency) * amplitude;
        
        if (x === 50) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Disruption impact points
    ctx.fillStyle = accentColor + '80';
    const impacts = [100, 180, 260, 340];
    
    impacts.forEach(x => {
        const y = canvas.height - 45 + Math.sin(x * 0.05) * 20;
        
        // Impact explosion
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const lineLength = 15;
            const x2 = x + lineLength * Math.cos(angle);
            const y2 = y + lineLength * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        // Impact center
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawStartupLaunch(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0ea5e9';
    
    // Launch countdown
    ctx.fillStyle = accentColor + '70';
    ctx.font = 'bold 20px Inter';
    
    const countdown = ['3', '2', '1', '🚀'];
    countdown.forEach((number, index) => {
        const x = 60 + (index * 60);
        const y = canvas.height - 40;
        
        if (index < 3) {
            // Number circle
            ctx.beginPath();
            ctx.arc(x, y, 20, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(number, x - 6, y + 6);
            ctx.fillStyle = accentColor + '70';
        } else {
            // Rocket emoji
            ctx.fillText(number, x - 10, y + 8);
        }
    });
    
    // Launch trajectory
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(280, canvas.height - 20);
    ctx.quadraticCurveTo(350, canvas.height - 80, 420, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Success stars
    ctx.fillStyle = accentColor + '80';
    for (let i = 0; i < 5; i++) {
        const x = 350 + (i * 15);
        const y = canvas.height - 60 + (Math.sin(i) * 8);
        drawStar(ctx, x, y, 4, 5);
    }
}

function drawStartupViral(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ec4899';
    
    // Viral spread network
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const centerNode = { x: canvas.width / 2, y: canvas.height - 45 };
    const outerNodes = [];
    
    // Create outer nodes in a circle
    for (let i = 0; i < 8; i++) {
        const angle = (i * 2 * Math.PI) / 8;
        const radius = 60;
        outerNodes.push({
            x: centerNode.x + radius * Math.cos(angle),
            y: centerNode.y + radius * Math.sin(angle)
        });
    }
    
    // Draw connections from center to outer nodes
    outerNodes.forEach(node => {
        ctx.beginPath();
        ctx.moveTo(centerNode.x, centerNode.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
    });
    
    // Draw some connections between outer nodes
    for (let i = 0; i < outerNodes.length; i++) {
        const nextIndex = (i + 2) % outerNodes.length;
        ctx.beginPath();
        ctx.moveTo(outerNodes[i].x, outerNodes[i].y);
        ctx.lineTo(outerNodes[nextIndex].x, outerNodes[nextIndex].y);
        ctx.stroke();
    }
    
    // Draw nodes
    ctx.fillStyle = accentColor + '80';
    
    // Center node (larger)
    ctx.beginPath();
    ctx.arc(centerNode.x, centerNode.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Outer nodes
    outerNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Viral indicators (expanding circles)
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 2;
    
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(centerNode.x, centerNode.y, 8 + (i * 15), 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function drawStartupEcosystem(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#059669';
    
    // Ecosystem components
    const components = [
        { name: 'Startup', x: 80, y: canvas.height - 50, color: accentColor + '70' },
        { name: 'Investor', x: 160, y: canvas.height - 35, color: accentColor + '60' },
        { name: 'Mentor', x: 240, y: canvas.height - 60, color: accentColor + '50' },
        { name: 'Talent', x: 320, y: canvas.height - 45, color: accentColor + '80' }
    ];
    
    // Draw components
    components.forEach(component => {
        ctx.fillStyle = component.color;
        ctx.beginPath();
        ctx.arc(component.x, component.y, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Labels
        ctx.fillStyle = accentColor + '90';
        ctx.font = '10px Inter';
        ctx.fillText(component.name, component.x - 15, component.y + 25);
    });
    
    // Ecosystem connections
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < components.length; i++) {
        for (let j = i + 1; j < components.length; j++) {
            ctx.beginPath();
            ctx.moveTo(components[i].x, components[i].y);
            ctx.lineTo(components[j].x, components[j].y);
            ctx.stroke();
        }
    }
    
    // Ecosystem boundary
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    
    ctx.beginPath();
    ctx.ellipse(200, canvas.height - 48, 140, 40, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawStartupRevolution(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#7c2d12';
    
    // Revolutionary gear
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '50';
    ctx.lineWidth = 3;
    
    const gearX = 80;
    const gearY = canvas.height - 50;
    const gearRadius = 25;
    const teeth = 12;
    
    ctx.beginPath();
    for (let i = 0; i < teeth; i++) {
        const angle = (i * 2 * Math.PI) / teeth;
        const outerRadius = gearRadius + 5;
        const innerRadius = gearRadius - 2;
        
        const x1 = gearX + outerRadius * Math.cos(angle - 0.1);
        const y1 = gearY + outerRadius * Math.sin(angle - 0.1);
        const x2 = gearX + outerRadius * Math.cos(angle + 0.1);
        const y2 = gearY + outerRadius * Math.sin(angle + 0.1);
        const x3 = gearX + innerRadius * Math.cos(angle + 0.15);
        const y3 = gearY + innerRadius * Math.sin(angle + 0.15);
        const x4 = gearX + innerRadius * Math.cos(angle - 0.15);
        const y4 = gearY + innerRadius * Math.sin(angle - 0.15);
        
        if (i === 0) ctx.moveTo(x1, y1);
        else ctx.lineTo(x1, y1);
        
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.lineTo(x4, y4);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Center hole
    ctx.fillStyle = accentColor + '90';
    ctx.beginPath();
    ctx.arc(gearX, gearY, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Revolutionary arrow
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    ctx.arc(gearX, gearY, 35, -Math.PI / 4, Math.PI / 2);
    ctx.stroke();
    
    // Arrow head
    const arrowX = gearX + 35 * Math.cos(Math.PI / 2);
    const arrowY = gearY + 35 * Math.sin(Math.PI / 2);
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX - 8, arrowY - 8);
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 8, arrowY - 8);
    ctx.stroke();
    
    // Revolution waves
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    
    for (let i = 1; i <= 3; i++) {
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(gearX, gearY, 40 + (i * 20), 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.setLineDash([]);
}

// TECH THEME DECORATIONS
function drawTechCode(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#22c55e';
    
    // Code brackets and symbols
    ctx.fillStyle = accentColor + '60';
    ctx.font = '18px monospace';
    
    const codeSymbols = ['{', '}', '<', '>', '[', ']', '(', ')'];
    codeSymbols.forEach((symbol, index) => {
        const x = 50 + (index * 35);
        const y = canvas.height - 35;
        ctx.fillText(symbol, x, y);
    });
    
    // Code lines
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
        const y = canvas.height - 65 + (i * 8);
        const width = 80 + Math.random() * 100;
        
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(50 + width, y);
        ctx.stroke();
    }
    
    // Binary pattern
    ctx.fillStyle = accentColor + '30';
    ctx.font = '12px monospace';
    const binary = '10110100111010110100';
    
    for (let i = 0; i < binary.length; i++) {
        ctx.fillText(binary[i], canvas.width - 200 + (i * 10), canvas.height - 25);
    }
}

function drawTechCyber(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06b6d4';
    
    // Cyber grid
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    const gridSize = 20;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 80);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = canvas.height - 80; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Cyber nodes
    ctx.fillStyle = accentColor + '80';
    const nodes = [
        { x: 60, y: canvas.height - 60 },
        { x: 140, y: canvas.height - 40 },
        { x: 220, y: canvas.height - 55 },
        { x: 300, y: canvas.height - 35 }
    ];
    
    nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Cyber glow effect
        for (let i = 1; i <= 3; i++) {
            ctx.strokeStyle = accentColor + (20 - i * 5);
            ctx.lineWidth = i;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 6 + (i * 3), 0, 2 * Math.PI);
            ctx.stroke();
        }
    });
    
    // Cyber connections
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < nodes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y);
        ctx.stroke();
    }
    
    // Cyber HUD elements
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    // Corner brackets
    const corners = [
        { x: 20, y: canvas.height - 70 },
        { x: canvas.width - 20, y: canvas.height - 70 },
        { x: 20, y: canvas.height - 20 },
        { x: canvas.width - 20, y: canvas.height - 20 }
    ];
    
    corners.forEach(corner => {
        const size = 15;
        
        ctx.beginPath();
        if (corner.x === 20) {
            // Left brackets
            ctx.moveTo(corner.x, corner.y - size);
            ctx.lineTo(corner.x, corner.y);
            ctx.lineTo(corner.x + size, corner.y);
        } else {
            // Right brackets
            ctx.moveTo(corner.x, corner.y - size);
            ctx.lineTo(corner.x, corner.y);
            ctx.lineTo(corner.x - size, corner.y);
        }
        ctx.stroke();
    });
}

function drawTechAI(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // AI neural network
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    // Input layer
    const inputNodes = [
        { x: 60, y: canvas.height - 65 },
        { x: 60, y: canvas.height - 45 },
        { x: 60, y: canvas.height - 25 }
    ];
    
    // Hidden layer
    const hiddenNodes = [
        { x: 150, y: canvas.height - 70 },
        { x: 150, y: canvas.height - 50 },
        { x: 150, y: canvas.height - 30 },
        { x: 150, y: canvas.height - 10 }
    ];
    
    // Output layer
    const outputNodes = [
        { x: 240, y: canvas.height - 55 },
        { x: 240, y: canvas.height - 35 }
    ];
    
    // Draw connections
    inputNodes.forEach(inputNode => {
        hiddenNodes.forEach(hiddenNode => {
            ctx.beginPath();
            ctx.moveTo(inputNode.x, inputNode.y);
            ctx.lineTo(hiddenNode.x, hiddenNode.y);
            ctx.stroke();
        });
    });
    
    hiddenNodes.forEach(hiddenNode => {
        outputNodes.forEach(outputNode => {
            ctx.beginPath();
            ctx.moveTo(hiddenNode.x, hiddenNode.y);
            ctx.lineTo(outputNode.x, outputNode.y);
            ctx.stroke();
        });
    });
    
    // Draw nodes
    ctx.fillStyle = accentColor + '70';
    
    [...inputNodes, ...hiddenNodes, ...outputNodes].forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // AI brain pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    const brainX = canvas.width - 80;
    const brainY = canvas.height - 45;
    
    // Brain outline
    ctx.beginPath();
    ctx.arc(brainX, brainY, 25, 0, Math.PI);
    ctx.stroke();
    
    // Brain divisions
    ctx.beginPath();
    ctx.moveTo(brainX - 25, brainY);
    ctx.quadraticCurveTo(brainX, brainY - 15, brainX + 25, brainY);
    ctx.stroke();
    
    // AI thinking dots
    ctx.fillStyle = accentColor + '80';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(brainX - 10 + (i * 10), brainY + 35, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawTechQuantum(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Quantum particles
    ctx.fillStyle = accentColor + '70';
    
    const particles = [];
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: 50 + Math.random() * (canvas.width - 100),
            y: canvas.height - 70 + Math.random() * 50,
            size: 2 + Math.random() * 4
        });
    }
    
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Quantum entanglement lines
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const distance = Math.sqrt(
                Math.pow(particles[i].x - particles[j].x, 2) +
                Math.pow(particles[i].y - particles[j].y, 2)
            );
            
            if (distance < 80) {
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    ctx.setLineDash([]);
    
    // Quantum states superposition
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 40;
    
    // Superposition orbits
    for (let i = 0; i < 3; i++) {
        const radius = 15 + (i * 10);
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Quantum bit states
    ctx.fillStyle = accentColor + '80';
    ctx.font = 'bold 14px Inter';
    ctx.fillText('|0⟩', centerX - 40, centerY - 20);
    ctx.fillText('|1⟩', centerX + 25, centerY - 20);
    ctx.fillText('|ψ⟩', centerX - 5, centerY + 5);
}

function drawTechBlockchain(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#fbbf24';
    
    // Blockchain blocks
    ctx.fillStyle = accentColor + '60';
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const blockWidth = 50;
    const blockHeight = 30;
    const blocks = [];
    
    for (let i = 0; i < 5; i++) {
        const x = 50 + (i * (blockWidth + 10));
        const y = canvas.height - 50;
        
        blocks.push({ x, y });
        
        // Block rectangle
        ctx.beginPath();
        ctx.rect(x, y, blockWidth, blockHeight);
        ctx.fill();
        ctx.stroke();
        
        // Block hash visualization
        ctx.fillStyle = accentColor + '90';
        ctx.font = '8px monospace';
        ctx.fillText(`#${i + 1}`, x + 5, y + 12);
        ctx.fillText(`${Math.random().toString(36).substr(2, 6)}`, x + 5, y + 22);
        ctx.fillStyle = accentColor + '60';
    }
    
    // Chain links
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < blocks.length - 1; i++) {
        const fromX = blocks[i].x + blockWidth;
        const toX = blocks[i + 1].x;
        const y = blocks[i].y + blockHeight / 2;
        
        ctx.beginPath();
        ctx.moveTo(fromX, y);
        ctx.lineTo(toX, y);
        ctx.stroke();
        
        // Chain link symbol
        ctx.beginPath();
        ctx.arc(fromX + 5, y, 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Cryptographic elements
    ctx.fillStyle = accentColor + '50';
    ctx.font = '12px monospace';
    
    const cryptoSymbols = ['🔐', '🔑', '⛓️'];
    cryptoSymbols.forEach((symbol, index) => {
        ctx.fillText(symbol, canvas.width - 80 + (index * 25), canvas.height - 30);
    });
}

function drawTechCloud(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0ea5e9';
    
    // Cloud shape
    ctx.fillStyle = accentColor + '50';
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const cloudX = 100;
    const cloudY = canvas.height - 50;
    
    // Main cloud body
    ctx.beginPath();
    ctx.arc(cloudX, cloudY, 20, 0, Math.PI * 2);
    ctx.arc(cloudX + 20, cloudY, 25, 0, Math.PI * 2);
    ctx.arc(cloudX + 40, cloudY, 20, 0, Math.PI * 2);
    ctx.arc(cloudX + 15, cloudY - 15, 15, 0, Math.PI * 2);
    ctx.arc(cloudX + 25, cloudY - 15, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Cloud data streams
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const streams = [
        { x: cloudX - 30, y: cloudY - 10 },
        { x: cloudX - 25, y: cloudY + 10 },
        { x: cloudX + 70, y: cloudY - 5 },
        { x: cloudX + 75, y: cloudY + 15 }
    ];
    
    streams.forEach(stream => {
        // Data arrows pointing to cloud
        if (stream.x < cloudX) {
            ctx.beginPath();
            ctx.moveTo(stream.x, stream.y);
            ctx.lineTo(stream.x + 20, stream.y);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(stream.x + 20, stream.y);
            ctx.lineTo(stream.x + 15, stream.y - 3);
            ctx.moveTo(stream.x + 20, stream.y);
            ctx.lineTo(stream.x + 15, stream.y + 3);
            ctx.stroke();
        } else {
            // Data arrows from cloud
            ctx.beginPath();
            ctx.moveTo(stream.x - 20, stream.y);
            ctx.lineTo(stream.x, stream.y);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(stream.x, stream.y);
            ctx.lineTo(stream.x - 5, stream.y - 3);
            ctx.moveTo(stream.x, stream.y);
            ctx.lineTo(stream.x - 5, stream.y + 3);
            ctx.stroke();
        }
    });
    
    // Cloud services icons
    ctx.fillStyle = accentColor + '80';
    ctx.font = '14px Inter';
    
    const services = ['📊', '🗄️', '⚡', '🔧'];
    services.forEach((service, index) => {
        const x = cloudX - 10 + (index * 15);
        const y = cloudY + 5;
        ctx.fillText(service, x, y);
    });
    
    // Network connections
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    const devices = [
        { x: 50, y: canvas.height - 25 },
        { x: 200, y: canvas.height - 25 },
        { x: 300, y: canvas.height - 30 }
    ];
    
    devices.forEach(device => {
        ctx.beginPath();
        ctx.moveTo(device.x, device.y);
        ctx.lineTo(cloudX + 20, cloudY + 15);
        ctx.stroke();
        
        // Device representation
        ctx.fillStyle = accentColor + '60';
        ctx.fillRect(device.x - 5, device.y - 5, 10, 10);
    });
    
    ctx.setLineDash([]);
}

// Continue with all remaining theme decoration functions...
// I'll add the rest in the next function call to avoid hitting length limits

function drawTechIoT(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#10b981';
    
    // IoT devices network
    const devices = [
        { x: 60, y: canvas.height - 60, type: '📱', name: 'Phone' },
        { x: 120, y: canvas.height - 40, type: '💡', name: 'Light' },
        { x: 180, y: canvas.height - 65, type: '🌡️', name: 'Sensor' },
        { x: 240, y: canvas.height - 35, type: '🏠', name: 'Home' },
        { x: 300, y: canvas.height - 55, type: '🚗', name: 'Car' }
    ];
    
    // Central hub
    const hub = { x: canvas.width / 2, y: canvas.height - 50 };
    
    // Draw connections to hub
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    devices.forEach(device => {
        ctx.beginPath();
        ctx.moveTo(device.x, device.y);
        ctx.lineTo(hub.x, hub.y);
        ctx.stroke();
    });
    
    // Draw devices
    ctx.fillStyle = accentColor + '70';
    devices.forEach(device => {
        ctx.beginPath();
        ctx.arc(device.x, device.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Device icon
        ctx.fillStyle = accentColor + '90';
        ctx.font = '12px Inter';
        ctx.fillText(device.type, device.x - 6, device.y + 20);
        ctx.fillStyle = accentColor + '70';
    });
    
    // Central hub
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(hub.x, hub.y, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // WiFi signal rings
    for (let i = 1; i <= 3; i++) {
        ctx.strokeStyle = accentColor + (30 - i * 8);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hub.x, hub.y, 12 + (i * 8), 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function drawTechMachine(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#dc2626';
    
    // Machine learning data flow
    ctx.fillStyle = accentColor + '60';
    
    // Data input
    const inputData = [];
    for (let i = 0; i < 8; i++) {
        const x = 50;
        const y = canvas.height - 70 + (i * 5);
        inputData.push({ x, y });
        
        ctx.fillRect(x, y, 20, 3);
    }
    
    // Processing unit
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(120, canvas.height - 70, 60, 40);
    ctx.stroke();
    
    // ML label
    ctx.fillStyle = accentColor + '90';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('ML', 145, canvas.height - 45);
    
    // Processing gears
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 3; i++) {
        const x = 130 + (i * 15);
        const y = canvas.height - 60;
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Gear teeth
        for (let j = 0; j < 8; j++) {
            const angle = (j * Math.PI) / 4;
            const x1 = x + 5 * Math.cos(angle);
            const y1 = y + 5 * Math.sin(angle);
            const x2 = x + 7 * Math.cos(angle);
            const y2 = y + 7 * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }
    
    // Output predictions
    ctx.fillStyle = accentColor + '50';
    for (let i = 0; i < 4; i++) {
        const x = 220;
        const y = canvas.height - 65 + (i * 8);
        const accuracy = 0.7 + (i * 0.08);
        const width = accuracy * 80;
        
        ctx.fillRect(x, y, width, 4);
        
        ctx.fillStyle = accentColor + '80';
        ctx.font = '10px Inter';
        ctx.fillText(`${(accuracy * 100).toFixed(0)}%`, x + width + 5, y + 3);
        ctx.fillStyle = accentColor + '50';
    }
    
    // Data arrows
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    // Input arrow
    ctx.beginPath();
    ctx.moveTo(80, canvas.height - 50);
    ctx.lineTo(110, canvas.height - 50);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(110, canvas.height - 50);
    ctx.lineTo(105, canvas.height - 47);
    ctx.moveTo(110, canvas.height - 50);
    ctx.lineTo(105, canvas.height - 53);
    ctx.stroke();
    
    // Output arrow
    ctx.beginPath();
    ctx.moveTo(190, canvas.height - 50);
    ctx.lineTo(210, canvas.height - 50);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(210, canvas.height - 50);
    ctx.lineTo(205, canvas.height - 47);
    ctx.moveTo(210, canvas.height - 50);
    ctx.lineTo(205, canvas.height - 53);
    ctx.stroke();
}

function drawTechRobotics(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6b7280';
    
    // Robot head
    ctx.fillStyle = accentColor + '60';
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const robotX = 80;
    const robotY = canvas.height - 50;
    
    // Head
    ctx.beginPath();
    ctx.rect(robotX - 15, robotY - 25, 30, 25);
    ctx.fill();
    ctx.stroke();
    
    // Eyes
    ctx.fillStyle = accentColor + '90';
    ctx.fillRect(robotX - 10, robotY - 20, 6, 6);
    ctx.fillRect(robotX + 4, robotY - 20, 6, 6);
    
    // Mouth
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(robotX - 8, robotY - 8);
    ctx.lineTo(robotX + 8, robotY - 8);
    ctx.stroke();
    
    // Body
    ctx.fillStyle = accentColor + '50';
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(robotX - 12, robotY, 24, 20);
    ctx.fill();
    ctx.stroke();
    
    // Arms
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    
    // Left arm
    ctx.beginPath();
    ctx.moveTo(robotX - 12, robotY + 5);
    ctx.lineTo(robotX - 25, robotY + 5);
    ctx.lineTo(robotX - 25, robotY + 15);
    ctx.stroke();
    
    // Right arm
    ctx.beginPath();
    ctx.moveTo(robotX + 12, robotY + 5);
    ctx.lineTo(robotX + 25, robotY + 5);
    ctx.lineTo(robotX + 25, robotY + 15);
    ctx.stroke();
    
    // Robot path/movement
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(robotX, robotY + 25);
    ctx.lineTo(150, canvas.height - 30);
    ctx.lineTo(220, canvas.height - 60);
    ctx.lineTo(290, canvas.height - 40);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Robot sensors/signals
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI) / 2 - Math.PI / 4;
        const x1 = robotX + 20 * Math.cos(angle);
        const y1 = robotY - 15 + 20 * Math.sin(angle);
        const x2 = robotX + 35 * Math.cos(angle);
        const y2 = robotY - 15 + 35 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    // Technology components
    ctx.fillStyle = accentColor + '70';
    const components = ['⚙️', '🔧', '⚡', '📡'];
    components.forEach((component, index) => {
        ctx.font = '16px Inter';
        ctx.fillText(component, 340 + (index * 25), canvas.height - 35);
    });
}

function drawTechVR(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#a855f7';
    
    // VR headset
    ctx.fillStyle = accentColor + '60';
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const headsetX = 80;
    const headsetY = canvas.height - 45;
    
    // Headset main body
    ctx.beginPath();
    ctx.ellipse(headsetX, headsetY, 25, 15, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Headset strap
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(headsetX, headsetY, 30, -Math.PI / 3, -2 * Math.PI / 3, true);
    ctx.stroke();
    
    // VR lenses
    ctx.fillStyle = accentColor + '90';
    ctx.beginPath();
    ctx.arc(headsetX - 8, headsetY, 6, 0, 2 * Math.PI);
    ctx.arc(headsetX + 8, headsetY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Virtual reality space
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    // 3D wireframe cube
    const cubeX = 180;
    const cubeY = canvas.height - 45;
    const cubeSize = 20;
    
    // Front face
    ctx.beginPath();
    ctx.rect(cubeX, cubeY, cubeSize, cubeSize);
    ctx.stroke();
    
    // Back face (offset)
    ctx.beginPath();
    ctx.rect(cubeX + 10, cubeY - 10, cubeSize, cubeSize);
    ctx.stroke();
    
    // Connecting lines
    ctx.beginPath();
    ctx.moveTo(cubeX, cubeY);
    ctx.lineTo(cubeX + 10, cubeY - 10);
    ctx.moveTo(cubeX + cubeSize, cubeY);
    ctx.lineTo(cubeX + cubeSize + 10, cubeY - 10);
    ctx.moveTo(cubeX, cubeY + cubeSize);
    ctx.lineTo(cubeX + 10, cubeY + cubeSize - 10);
    ctx.moveTo(cubeX + cubeSize, cubeY + cubeSize);
    ctx.lineTo(cubeX + cubeSize + 10, cubeY + cubeSize - 10);
    ctx.stroke();
    
    // VR portal effect
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.ellipse(cubeX + 10, cubeY + 10, 15 + (i * 8), 10 + (i * 5), 0, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Virtual elements floating
    ctx.fillStyle = accentColor + '60';
    const virtualElements = [
        { x: 280, y: canvas.height - 60, size: 4 },
        { x: 300, y: canvas.height - 40, size: 6 },
        { x: 320, y: canvas.height - 55, size: 3 },
        { x: 340, y: canvas.height - 35, size: 5 }
    ];
    
    virtualElements.forEach(element => {
        ctx.beginPath();
        ctx.arc(element.x, element.y, element.size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Floating effect lines
        ctx.strokeStyle = accentColor + '30';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        ctx.beginPath();
        ctx.moveTo(element.x, element.y + element.size);
        ctx.lineTo(element.x, element.y + element.size + 10);
        ctx.stroke();
        
        ctx.setLineDash([]);
    });
}

function drawTechData(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06d6a0';
    
    // Data visualization bars
    ctx.fillStyle = accentColor + '60';
    
    const dataPoints = [
        { x: 60, value: 25, label: 'Q1' },
        { x: 100, value: 40, label: 'Q2' },
        { x: 140, value: 35, label: 'Q3' },
        { x: 180, value: 55, label: 'Q4' }
    ];
    
    dataPoints.forEach(point => {
        ctx.fillRect(point.x, canvas.height - 30, 25, -point.value);
        
        // Labels
        ctx.fillStyle = accentColor + '90';
        ctx.font = '10px Inter';
        ctx.fillText(point.label, point.x + 8, canvas.height - 15);
        ctx.fillStyle = accentColor + '60';
    });
    
    // Data trend line
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    dataPoints.forEach((point, index) => {
        const x = point.x + 12.5;
        const y = canvas.height - 30 - point.value;
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Data points
    ctx.fillStyle = accentColor + '90';
    dataPoints.forEach(point => {
        const x = point.x + 12.5;
        const y = canvas.height - 30 - point.value;
        
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Database symbol
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const dbX = 280;
    const dbY = canvas.height - 50;
    
    // Database cylinder
    ctx.beginPath();
    ctx.ellipse(dbX, dbY - 15, 20, 8, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    ctx.beginPath();
    ctx.rect(dbX - 20, dbY - 15, 40, 20);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(dbX - 20, dbY - 15);
    ctx.lineTo(dbX - 20, dbY + 5);
    ctx.moveTo(dbX + 20, dbY - 15);
    ctx.lineTo(dbX + 20, dbY + 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.ellipse(dbX, dbY + 5, 20, 8, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Data flow arrows
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
        const x = 230 + (i * 8);
        const y = canvas.height - 45 + (i * 2);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 15, y);
        ctx.stroke();
        
        // Arrow head
        ctx.beginPath();
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 10, y - 2);
        ctx.moveTo(x + 15, y);
        ctx.lineTo(x + 10, y + 2);
        ctx.stroke();
    }
}

function drawTechSecurity(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#dc2626';
    
    // Security shield
    ctx.fillStyle = accentColor + '60';
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const shieldX = 80;
    const shieldY = canvas.height - 30;
    
    // Shield shape
    ctx.beginPath();
    ctx.moveTo(shieldX, shieldY - 35);
    ctx.lineTo(shieldX - 20, shieldY - 25);
    ctx.lineTo(shieldX - 20, shieldY - 5);
    ctx.lineTo(shieldX, shieldY + 5);
    ctx.lineTo(shieldX + 20, shieldY - 5);
    ctx.lineTo(shieldX + 20, shieldY - 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Security checkmark
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(shieldX - 8, shieldY - 15);
    ctx.lineTo(shieldX - 2, shieldY - 8);
    ctx.lineTo(shieldX + 8, shieldY - 20);
    ctx.stroke();
    
    // Firewall representation
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 6; i++) {
        const x = 150 + (i * 15);
        const height = 20 + Math.sin(i) * 8;
        
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 25);
        ctx.lineTo(x, canvas.height - 25 - height);
        ctx.stroke();
    }
    
    // Security locks
    ctx.fillStyle = accentColor + '70';
    const locks = [
        { x: 280, y: canvas.height - 50 },
        { x: 310, y: canvas.height - 45 },
        { x: 340, y: canvas.height - 55 }
    ];
    
    locks.forEach(lock => {
        // Lock body
        ctx.fillRect(lock.x - 6, lock.y, 12, 8);
        
        // Lock shackle
        ctx.strokeStyle = accentColor + '80';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(lock.x, lock.y - 3, 5, Math.PI, 0);
        ctx.stroke();
    });
    
    // Encryption symbols
    ctx.fillStyle = accentColor + '80';
    ctx.font = '14px monospace';
    const cryptoText = 'AES-256';
    
    for (let i = 0; i < cryptoText.length; i++) {
        ctx.fillText(cryptoText[i], 380 + (i * 12), canvas.height - 35);
    }
}

function drawTech5G(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // 5G tower
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    const towerX = 80;
    const towerY = canvas.height - 20;
    
    // Tower structure
    ctx.beginPath();
    ctx.moveTo(towerX, towerY);
    ctx.lineTo(towerX, towerY - 50);
    ctx.stroke();
    
    // Tower cross beams
    ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
        const y = towerY - (i * 15);
        const width = 20 - (i * 3);
        
        ctx.beginPath();
        ctx.moveTo(towerX - width, y);
        ctx.lineTo(towerX + width, y);
        ctx.stroke();
        
        // Diagonal supports
        ctx.beginPath();
        ctx.moveTo(towerX - width, y);
        ctx.lineTo(towerX, y - 7);
        ctx.moveTo(towerX + width, y);
        ctx.lineTo(towerX, y - 7);
        ctx.stroke();
    }
    
    // 5G signal waves
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(towerX, towerY - 50, i * 15, -Math.PI / 3, -2 * Math.PI / 3, true);
        ctx.stroke();
    }
    
    // 5G label
    ctx.fillStyle = accentColor + '90';
    ctx.font = 'bold 16px Inter';
    ctx.fillText('5G', towerX - 10, towerY - 55);
    
    // Connected devices
    const devices = [
        { x: 150, y: canvas.height - 40, type: '📱' },
        { x: 200, y: canvas.height - 30, type: '💻' },
        { x: 250, y: canvas.height - 50, type: '🚗' },
        { x: 300, y: canvas.height - 35, type: '🏠' }
    ];
    
    devices.forEach(device => {
        // Signal to device
        ctx.strokeStyle = accentColor + '40';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        ctx.moveTo(towerX, towerY - 50);
        ctx.lineTo(device.x, device.y);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Device
        ctx.fillStyle = accentColor + '70';
        ctx.beginPath();
        ctx.arc(device.x, device.y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Device icon
        ctx.fillStyle = accentColor + '90';
        ctx.font = '12px Inter';
        ctx.fillText(device.type, device.x - 6, device.y + 18);
    });
    
    // Speed indicators
    ctx.fillStyle = accentColor + '50';
    ctx.font = '10px Inter';
    
    const speeds = ['1Gbps', '5Gbps', '10Gbps'];
    speeds.forEach((speed, index) => {
        const x = 350 + (index * 40);
        const y = canvas.height - 40 + (index * 8);
        
        ctx.fillRect(x, y, 30, 6);
        ctx.fillStyle = accentColor + '80';
        ctx.fillText(speed, x, y - 5);
        ctx.fillStyle = accentColor + '50';
    });
}

function drawTechEdge(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Edge computing nodes
    const centerNode = { x: canvas.width / 2, y: canvas.height - 45 };
    const edgeNodes = [];
    
    // Create edge nodes around center
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const radius = 60;
        edgeNodes.push({
            x: centerNode.x + radius * Math.cos(angle),
            y: centerNode.y + radius * Math.sin(angle)
        });
    }
    
    // Draw center cloud
    ctx.fillStyle = accentColor + '50';
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    // Cloud shape (simplified)
    ctx.beginPath();
    ctx.arc(centerNode.x - 10, centerNode.y, 12, 0, Math.PI * 2);
    ctx.arc(centerNode.x + 10, centerNode.y, 15, 0, Math.PI * 2);
    ctx.arc(centerNode.x, centerNode.y - 8, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw edge nodes
    ctx.fillStyle = accentColor + '70';
    edgeNodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        
        // Edge processing indicator
        ctx.fillStyle = accentColor + '90';
        ctx.font = '8px Inter';
        ctx.fillText('E', node.x - 2, node.y + 2);
        ctx.fillStyle = accentColor + '70';
    });
    
    // Connections from center to edges
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    edgeNodes.forEach(node => {
        ctx.beginPath();
        ctx.moveTo(centerNode.x, centerNode.y);
        ctx.lineTo(node.x, node.y);
        ctx.stroke();
    });
    
    // Local processing indicators
    edgeNodes.forEach((node, index) => {
        if (index < 3) { // Only show for some nodes
            ctx.strokeStyle = accentColor + '60';
            ctx.lineWidth = 1;
            
            // Processing waves
            for (let i = 1; i <= 2; i++) {
                ctx.beginPath();
                ctx.arc(node.x, node.y, 10 + (i * 5), 0, 2 * Math.PI);
                ctx.stroke();
            }
        }
    });
    
    // Latency indicators
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    
    const latencies = ['<1ms', '<5ms', '<10ms'];
    latencies.forEach((latency, index) => {
        const x = 50 + (index * 80);
        const y = canvas.height - 15;
        
        ctx.fillText(latency, x, y);
        
        // Latency bar
        ctx.fillStyle = accentColor + '50';
        const width = (3 - index) * 15;
        ctx.fillRect(x, y + 3, width, 4);
        ctx.fillStyle = accentColor + '80';
    });
}

function drawTechDevOps(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#10b981';
    
    // DevOps infinity symbol
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 45;
    
    // Infinity loop
    ctx.beginPath();
    for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
        const x = centerX + 30 * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
        const y = centerY + 15 * Math.sin(t) * Math.cos(t) / (1 + Math.sin(t) * Math.sin(t));
        
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Dev side (left)
    ctx.fillStyle = accentColor + '60';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('DEV', centerX - 60, centerY - 20);
    
    // Development tools
    const devTools = ['</>', '🔧', '📝'];
    devTools.forEach((tool, index) => {
        const x = centerX - 80 + (index * 20);
        const y = centerY + 10;
        
        ctx.fillStyle = accentColor + '70';
        ctx.font = '14px Inter';
        ctx.fillText(tool, x, y);
    });
    
    // Ops side (right)
    ctx.fillStyle = accentColor + '60';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('OPS', centerX + 35, centerY - 20);
    
    // Operations tools
    const opsTools = ['⚙️', '📊', '🚀'];
    opsTools.forEach((tool, index) => {
        const x = centerX + 40 + (index * 20);
        const y = centerY + 10;
        
        ctx.fillStyle = accentColor + '70';
        ctx.font = '14px Inter';
        ctx.fillText(tool, x, y);
    });
    
    // Pipeline stages
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const stages = ['Build', 'Test', 'Deploy'];
    stages.forEach((stage, index) => {
        const x = 60 + (index * 80);
        const y = canvas.height - 15;
        
        // Stage box
        ctx.beginPath();
        ctx.rect(x, y, 60, 12);
        ctx.stroke();
        
        // Stage label
        ctx.fillStyle = accentColor + '80';
        ctx.font = '10px Inter';
        ctx.fillText(stage, x + 5, y + 9);
        
        // Arrow to next stage
        if (index < stages.length - 1) {
            ctx.strokeStyle = accentColor + '70';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.moveTo(x + 65, y + 6);
            ctx.lineTo(x + 75, y + 6);
            ctx.stroke();
            
            // Arrow head
            ctx.beginPath();
            ctx.moveTo(x + 75, y + 6);
            ctx.lineTo(x + 70, y + 3);
            ctx.moveTo(x + 75, y + 6);
            ctx.lineTo(x + 70, y + 9);
            ctx.stroke();
            
            ctx.strokeStyle = accentColor + '50';
        }
    });
}

function drawTechMicroservices(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6366f1';
    
    // Microservices architecture
    const services = [
        { x: 70, y: canvas.height - 60, w: 40, h: 25, name: 'Auth' },
        { x: 130, y: canvas.height - 45, w: 40, h: 25, name: 'Users' },
        { x: 190, y: canvas.height - 65, w: 40, h: 25, name: 'Orders' },
        { x: 250, y: canvas.height - 50, w: 40, h: 25, name: 'Payment' },
        { x: 310, y: canvas.height - 40, w: 40, h: 25, name: 'Notify' }
    ];
    
    // Draw services
    ctx.fillStyle = accentColor + '60';
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    services.forEach(service => {
        ctx.beginPath();
        ctx.rect(service.x, service.y, service.w, service.h);
        ctx.fill();
        ctx.stroke();
        
        // Service name
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Inter';
        ctx.fillText(service.name, service.x + 5, service.y + 15);
        ctx.fillStyle = accentColor + '60';
    });
    
    // API Gateway
    ctx.fillStyle = accentColor + '70';
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 2;
    
    const gateway = { x: 180, y: canvas.height - 20, w: 80, h: 15 };
    ctx.beginPath();
    ctx.rect(gateway.x, gateway.y, gateway.w, gateway.h);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Inter';
    ctx.fillText('API Gateway', gateway.x + 10, gateway.y + 10);
    
    // Connections from gateway to services
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    services.forEach(service => {
        const serviceCenter = { x: service.x + service.w / 2, y: service.y + service.h };
        const gatewayCenter = { x: gateway.x + gateway.w / 2, y: gateway.y };
        
        ctx.beginPath();
        ctx.moveTo(gatewayCenter.x, gatewayCenter.y);
        ctx.lineTo(serviceCenter.x, serviceCenter.y);
        ctx.stroke();
    });
    
    // Service communication
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    // Some inter-service communication
    ctx.beginPath();
    ctx.moveTo(services[0].x + services[0].w, services[0].y + services[0].h / 2);
    ctx.lineTo(services[1].x, services[1].y + services[1].h / 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(services[2].x + services[2].w, services[2].y + services[2].h / 2);
    ctx.lineTo(services[3].x, services[3].y + services[3].h / 2);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Load balancer
    ctx.fillStyle = accentColor + '50';
    ctx.font = '12px Inter';
    ctx.fillText('⚖️ LB', 400, canvas.height - 35);
}

function drawTechAR(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f97316';
    
    // AR device/phone
    ctx.fillStyle = accentColor + '60';
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const deviceX = 80;
    const deviceY = canvas.height - 50;
    
    // Phone/tablet
    ctx.beginPath();
    ctx.roundRect(deviceX, deviceY, 20, 35, 3);
    ctx.fill();
    ctx.stroke();
    
    // Screen
    ctx.fillStyle = accentColor + '90';
    ctx.fillRect(deviceX + 3, deviceY + 5, 14, 25);
    
    // AR projection cone
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    
    ctx.beginPath();
    ctx.moveTo(deviceX + 20, deviceY + 10);
    ctx.lineTo(deviceX + 80, deviceY - 10);
    ctx.moveTo(deviceX + 20, deviceY + 25);
    ctx.lineTo(deviceX + 80, deviceY + 45);
    ctx.moveTo(deviceX + 80, deviceY - 10);
    ctx.lineTo(deviceX + 80, deviceY + 45);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // AR virtual objects
    ctx.fillStyle = accentColor + '70';
    
    // Virtual cube
    const cubeX = 200;
    const cubeY = canvas.height - 40;
    ctx.fillRect(cubeX, cubeY, 15, 15);
    
    // Cube wireframe
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(cubeX, cubeY, 15, 15);
    ctx.rect(cubeX + 5, cubeY - 5, 15, 15);
    ctx.moveTo(cubeX, cubeY);
    ctx.lineTo(cubeX + 5, cubeY - 5);
    ctx.moveTo(cubeX + 15, cubeY);
    ctx.lineTo(cubeX + 20, cubeY - 5);
    ctx.moveTo(cubeX, cubeY + 15);
    ctx.lineTo(cubeX + 5, cubeY + 10);
    ctx.moveTo(cubeX + 15, cubeY + 15);
    ctx.lineTo(cubeX + 20, cubeY + 10);
    ctx.stroke();
    
    // Virtual sphere
    ctx.fillStyle = accentColor + '60';
    ctx.beginPath();
    ctx.arc(260, canvas.height - 35, 12, 0, 2 * Math.PI);
    ctx.fill();
    
    // Sphere wireframe
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(260, canvas.height - 35, 12, 0, 2 * Math.PI);
    ctx.ellipse(260, canvas.height - 35, 12, 6, 0, 0, 2 * Math.PI);
    ctx.ellipse(260, canvas.height - 35, 6, 12, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // AR markers/anchors
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const markers = [
        { x: 150, y: canvas.height - 25 },
        { x: 320, y: canvas.height - 55 },
        { x: 380, y: canvas.height - 30 }
    ];
    
    markers.forEach(marker => {
        // Marker cross
        ctx.beginPath();
        ctx.moveTo(marker.x - 5, marker.y);
        ctx.lineTo(marker.x + 5, marker.y);
        ctx.moveTo(marker.x, marker.y - 5);
        ctx.lineTo(marker.x, marker.y + 5);
        ctx.stroke();
        
        // Marker circle
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 7, 0, 2 * Math.PI);
        ctx.stroke();
    });
    
    // AR interface elements
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    
    const uiElements = ['📍 Anchor', '👁️ Track', '🎯 Target'];
    uiElements.forEach((element, index) => {
        ctx.fillText(element, 120 + (index * 70), canvas.height - 10);
    });
}

function drawTechNeural(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ef4444';
    
    // Neural network visualization
    const layers = [
        { nodes: 4, x: 60 },
        { nodes: 6, x: 150 },
        { nodes: 4, x: 240 },
        { nodes: 2, x: 330 }
    ];
    
    const nodePositions = [];
    
    // Calculate node positions
    layers.forEach((layer, layerIndex) => {
        const positions = [];
        const spacing = 60 / (layer.nodes + 1);
        
        for (let i = 0; i < layer.nodes; i++) {
            positions.push({
                x: layer.x,
                y: canvas.height - 70 + (i + 1) * spacing
            });
        }
        nodePositions.push(positions);
    });
    
    // Draw connections between layers
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < nodePositions.length - 1; i++) {
        nodePositions[i].forEach(fromNode => {
            nodePositions[i + 1].forEach(toNode => {
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(toNode.x, toNode.y);
                ctx.stroke();
            });
        });
    }
    
    // Draw nodes
    ctx.fillStyle = accentColor + '70';
    
    nodePositions.forEach((layer, layerIndex) => {
        layer.forEach(node => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Activation visualization (random for demo)
            if (Math.random() > 0.6) {
                ctx.strokeStyle = accentColor + '90';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI);
                ctx.stroke();
            }
        });
    });
    
    // Neural activity waves
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
        const y = canvas.height - 15 + (i * 3);
        
        ctx.beginPath();
        for (let x = 50; x < 400; x += 5) {
            const waveY = y + Math.sin((x + i * 50) * 0.02) * 3;
            if (x === 50) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
        }
        ctx.stroke();
    }
    
    // Neural labels
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    
    const labels = ['Input', 'Hidden 1', 'Hidden 2', 'Output'];
    labels.forEach((label, index) => {
        const x = layers[index].x - 10;
        const y = canvas.height - 15;
        ctx.fillText(label, x, y);
    });
}

function drawTechServerless(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // Serverless functions as floating boxes
    const functions = [
        { x: 70, y: canvas.height - 60, name: 'λ1', color: accentColor + '70' },
        { x: 140, y: canvas.height - 45, name: 'λ2', color: accentColor + '60' },
        { x: 210, y: canvas.height - 55, name: 'λ3', color: accentColor + '80' },
        { x: 280, y: canvas.height - 40, name: 'λ4', color: accentColor + '50' }
    ];
    
    functions.forEach(func => {
        // Function container
        ctx.fillStyle = func.color;
        ctx.strokeStyle = accentColor + '90';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.roundRect(func.x, func.y, 30, 20, 5);
        ctx.fill();
        ctx.stroke();
        
        // Lambda symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter';
        ctx.fillText(func.name, func.x + 8, func.y + 13);
        
        // Floating effect (dashed lines to ground)
        ctx.strokeStyle = accentColor + '30';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        
        ctx.beginPath();
        ctx.moveTo(func.x + 15, func.y + 20);
        ctx.lineTo(func.x + 15, canvas.height - 25);
        ctx.stroke();
        ctx.setLineDash([]);
    });
    
    // Event triggers
    ctx.fillStyle = accentColor + '60';
    const triggers = [
        { x: 50, y: canvas.height - 25, type: 'HTTP', target: 0 },
        { x: 120, y: canvas.height - 25, type: 'DB', target: 1 },
        { x: 190, y: canvas.height - 25, type: 'FILE', target: 2 },
        { x: 260, y: canvas.height - 25, type: 'TIME', target: 3 }
    ];
    
    triggers.forEach(trigger => {
        // Trigger box
        ctx.fillRect(trigger.x, trigger.y, 40, 12);
        
        // Trigger label
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Inter';
        ctx.fillText(trigger.type, trigger.x + 5, trigger.y + 8);
        
        // Trigger arrow to function
        ctx.strokeStyle = accentColor + '70';
        ctx.lineWidth = 2;
        
        const targetFunc = functions[trigger.target];
        ctx.beginPath();
        ctx.moveTo(trigger.x + 20, trigger.y);
        ctx.lineTo(targetFunc.x + 15, targetFunc.y + 20);
        ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(
            targetFunc.y + 20 - trigger.y,
            targetFunc.x + 15 - (trigger.x + 20)
        );
        const arrowX = targetFunc.x + 15 - 8 * Math.cos(angle);
        const arrowY = targetFunc.y + 20 - 8 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(targetFunc.x + 15, targetFunc.y + 20);
        ctx.lineTo(arrowX - 3 * Math.cos(angle - Math.PI / 6), arrowY - 3 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(targetFunc.x + 15, targetFunc.y + 20);
        ctx.lineTo(arrowX - 3 * Math.cos(angle + Math.PI / 6), arrowY - 3 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        
        ctx.fillStyle = accentColor + '60';
    });
    
    // Auto-scaling indicator
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const scaleX = 350;
    const scaleY = canvas.height - 45;
    
    // Scaling arrows
    ctx.beginPath();
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + 15, scaleY - 10);
    ctx.moveTo(scaleX, scaleY);
    ctx.lineTo(scaleX + 15, scaleY + 10);
    ctx.stroke();
    
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    ctx.fillText('Auto Scale', scaleX - 20, scaleY + 15);
}

function drawTechWeb3(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Decentralized network nodes
    const nodes = [];
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 45;
    
    // Create nodes in a hexagonal pattern
    for (let i = 0; i < 7; i++) {
        if (i === 0) {
            nodes.push({ x: centerX, y: centerY });
        } else {
            const angle = ((i - 1) * Math.PI) / 3;
            const radius = 50;
            nodes.push({
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            });
        }
    }
    
    // Draw connections between all nodes
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
        }
    }
    
    // Draw nodes
    ctx.fillStyle = accentColor + '70';
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 2;
    
    nodes.forEach((node, index) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, index === 0 ? 12 : 8, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Node validation indicator
        if (Math.random() > 0.5) {
            ctx.strokeStyle = accentColor + '90';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(node.x, node.y, (index === 0 ? 12 : 8) + 3, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.strokeStyle = accentColor + '90';
        ctx.lineWidth = 2;
    });
    
    // Web3 technologies
    ctx.fillStyle = accentColor + '80';
    ctx.font = '12px Inter';
    
    const web3Tech = ['🔗', '💰', '📜', '🌐'];
    const techLabels = ['Blockchain', 'DeFi', 'Smart Contracts', 'dApps'];
    
    web3Tech.forEach((tech, index) => {
        const x = 80 + (index * 70);
        const y = canvas.height - 15;
        
        ctx.fillText(tech, x, y - 8);
        
        ctx.fillStyle = accentColor + '60';
        ctx.font = '8px Inter';
        ctx.fillText(techLabels[index], x - 15, y + 5);
        
        ctx.fillStyle = accentColor + '80';
        ctx.font = '12px Inter';
    });
    
    // Decentralization waves
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 60 + (i * 20), 0, 2 * Math.PI);
        ctx.stroke();
    }
    ctx.setLineDash([]);
    
    // Consensus indicator
    ctx.fillStyle = accentColor + '70';
    ctx.font = '10px Inter';
    ctx.fillText('Consensus: 67%', canvas.width - 100, canvas.height - 15);
    
    // Mining/validation hash
    ctx.fillStyle = accentColor + '50';
    ctx.font = '8px monospace';
    ctx.fillText('0x1a2b3c4d5e6f...', canvas.width - 100, canvas.height - 5);
}

// CREATIVE THEME DECORATIONS
function drawCreativeArtistic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ec4899';
    
    // Artistic brush strokes
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    // Paint brush stroke
    ctx.beginPath();
    ctx.moveTo(50, canvas.height - 60);
    ctx.quadraticCurveTo(100, canvas.height - 80, 150, canvas.height - 40);
    ctx.quadraticCurveTo(200, canvas.height - 20, 250, canvas.height - 50);
    ctx.stroke();
    
    // Paint splatters
    ctx.fillStyle = accentColor + '70';
    const splatters = [
        { x: 80, y: canvas.height - 45, size: 6 },
        { x: 120, y: canvas.height - 65, size: 4 },
        { x: 180, y: canvas.height - 35, size: 8 },
        { x: 220, y: canvas.height - 55, size: 5 }
    ];
    
    splatters.forEach(splatter => {
        ctx.beginPath();
        ctx.arc(splatter.x, splatter.y, splatter.size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Splatter drops
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = splatter.size + Math.random() * 10;
            const dropX = splatter.x + distance * Math.cos(angle);
            const dropY = splatter.y + distance * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(dropX, dropY, 1 + Math.random() * 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Artistic palette
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const paletteX = canvas.width - 80;
    const paletteY = canvas.height - 45;
    
    // Palette shape
    ctx.beginPath();
    ctx.ellipse(paletteX, paletteY, 25, 15, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Paint colors on palette
    const colors = [accentColor + '80', '#ff6b6b80', '#4ecdc480', '#45b7d180', '#96ceb480'];
    colors.forEach((color, index) => {
        ctx.fillStyle = color;
        const angle = (index * Math.PI) / 2.5;
        const x = paletteX + 15 * Math.cos(angle);
        const y = paletteY + 10 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawCreativeVibrant(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Vibrant energy bursts
    const burstCenter = { x: canvas.width / 2, y: canvas.height - 45 };
    
    // Main burst
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const length = 20 + Math.sin(i) * 10;
        
        ctx.beginPath();
        ctx.moveTo(burstCenter.x, burstCenter.y);
        ctx.lineTo(
            burstCenter.x + length * Math.cos(angle),
            burstCenter.y + length * Math.sin(angle)
        );
        ctx.stroke();
    }
    
    // Vibrant particles
    ctx.fillStyle = accentColor + '80';
    for (let i = 0; i < 20; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = 30 + Math.random() * 40;
        const x = burstCenter.x + distance * Math.cos(angle);
        const y = burstCenter.y + distance * Math.sin(angle);
        const size = 2 + Math.random() * 4;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Color spectrum bars
    const spectrumColors = ['#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80', '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080'];
    
    spectrumColors.forEach((color, index) => {
        ctx.fillStyle = color + '60';
        const x = 50 + (index * 20);
        const height = 8 + Math.sin(index * 0.5) * 5;
        
        ctx.fillRect(x, canvas.height - 25, 15, height);
    });
    
    // Vibrant swirls
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
        const centerX = 100 + (i * 80);
        const centerY = canvas.height - 60;
        
        ctx.beginPath();
        for (let t = 0; t < 4 * Math.PI; t += 0.1) {
            const radius = 5 + t * 1.5;
            const x = centerX + radius * Math.cos(t);
            const y = centerY + radius * Math.sin(t);
            
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
}

function drawCreativeModern(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6366f1';
    
    // Modern geometric composition
    ctx.fillStyle = accentColor + '60';
    
    // Large geometric shapes
    const shapes = [
        { type: 'circle', x: 80, y: canvas.height - 50, size: 20 },
        { type: 'square', x: 140, y: canvas.height - 45, size: 25 },
        { type: 'triangle', x: 210, y: canvas.height - 55, size: 22 }
    ];
    
    shapes.forEach(shape => {
        ctx.beginPath();
        
        switch (shape.type) {
            case 'circle':
                ctx.arc(shape.x, shape.y, shape.size, 0, 2 * Math.PI);
                break;
            case 'square':
                ctx.rect(shape.x - shape.size / 2, shape.y - shape.size / 2, shape.size, shape.size);
                break;
            case 'triangle':
                ctx.moveTo(shape.x, shape.y - shape.size / 2);
                ctx.lineTo(shape.x - shape.size / 2, shape.y + shape.size / 2);
                ctx.lineTo(shape.x + shape.size / 2, shape.y + shape.size / 2);
                ctx.closePath();
                break;
        }
        
        ctx.fill();
    });
    
    // Modern lines and connections
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    // Connecting lines between shapes
    for (let i = 0; i < shapes.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(shapes[i].x, shapes[i].y);
        ctx.lineTo(shapes[i + 1].x, shapes[i + 1].y);
        ctx.stroke();
    }
    
    // Modern grid accent
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 1;
    
    const gridStart = canvas.width - 120;
    const gridSize = 15;
    
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const x = gridStart + (i * gridSize);
            const y = canvas.height - 65 + (j * gridSize);
            
            ctx.beginPath();
            ctx.rect(x, y, gridSize, gridSize);
            ctx.stroke();
        }
    }
    
    // Modern accent dots
    ctx.fillStyle = accentColor + '80';
    for (let i = 0; i < 8; i++) {
        const x = 300 + (i * 12);
        const y = canvas.height - 30 + Math.sin(i * 0.8) * 8;
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawCreativeBold(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#dc2626';
    
    // Bold statement shapes
    ctx.fillStyle = accentColor + '80';
    
    // Bold exclamation
    ctx.fillRect(60, canvas.height - 70, 8, 40);
    ctx.fillRect(60, canvas.height - 20, 8, 8);
    
    // Bold geometric patterns
    const boldShapes = [
        { x: 120, y: canvas.height - 60, w: 30, h: 15 },
        { x: 120, y: canvas.height - 40, w: 25, h: 15 },
        { x: 120, y: canvas.height - 20, w: 35, h: 15 }
    ];
    
    boldShapes.forEach(shape => {
        ctx.fillRect(shape.x, shape.y, shape.w, shape.h);
    });
    
    // Bold arrows
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 6;
    
    const arrowX = 200;
    const arrowY = canvas.height - 40;
    
    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowX + 40, arrowY);
    ctx.stroke();
    
    // Arrow head
    ctx.fillStyle = accentColor + '90';
    ctx.beginPath();
    ctx.moveTo(arrowX + 40, arrowY);
    ctx.lineTo(arrowX + 30, arrowY - 10);
    ctx.lineTo(arrowX + 30, arrowY + 10);
    ctx.closePath();
    ctx.fill();
    
    // Bold zigzag pattern
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const x = 280 + (i * 15);
        const y = canvas.height - 50 + (i % 2 === 0 ? -15 : 15);
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Bold impact lines
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x1 = canvas.width - 60 + 15 * Math.cos(angle);
        const y1 = canvas.height - 40 + 15 * Math.sin(angle);
        const x2 = canvas.width - 60 + 25 * Math.cos(angle);
        const y2 = canvas.height - 40 + 25 * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function drawCreativePastel(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f472b6';
    
    // Soft pastel clouds
    ctx.fillStyle = accentColor + '40';
    
    const clouds = [
        { x: 80, y: canvas.height - 50, size: 20 },
        { x: 160, y: canvas.height - 45, size: 25 },
        { x: 240, y: canvas.height - 55, size: 18 }
    ];
    
    clouds.forEach(cloud => {
        // Main cloud body
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size, 0, 2 * Math.PI);
        ctx.arc(cloud.x + cloud.size * 0.7, cloud.y, cloud.size * 0.8, 0, 2 * Math.PI);
        ctx.arc(cloud.x - cloud.size * 0.7, cloud.y, cloud.size * 0.6, 0, 2 * Math.PI);
        ctx.arc(cloud.x, cloud.y - cloud.size * 0.5, cloud.size * 0.7, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Pastel watercolor effect
    const pastelColors = ['#fecaca40', '#fed7d740', '#fef3c740', '#d1fae540', '#bfdbfe40', '#e0e7ff40', '#f3e8ff40'];
    
    pastelColors.forEach((color, index) => {
        ctx.fillStyle = color;
        const x = 50 + (index * 40);
        const y = canvas.height - 25;
        
        // Soft watercolor blobs
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const radius = 8 + Math.sin(i) * 3;
            const blobX = x + radius * Math.cos(angle);
            const blobY = y + radius * Math.sin(angle);
            
            if (i === 0) ctx.moveTo(blobX, blobY);
            else ctx.lineTo(blobX, blobY);
        }
        ctx.closePath();
        ctx.fill();
    });
    
    // Gentle flowing lines
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
        const startY = canvas.height - 65 + (i * 8);
        
        ctx.beginPath();
        for (let x = 50; x < canvas.width - 50; x += 10) {
            const y = startY + Math.sin((x + i * 30) * 0.02) * 5;
            if (x === 50) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Soft sparkles
    ctx.fillStyle = accentColor + '60';
    for (let i = 0; i < 12; i++) {
        const x = 100 + Math.random() * (canvas.width - 200);
        const y = canvas.height - 70 + Math.random() * 40;
        
        drawSoftStar(ctx, x, y, 3);
    }
}

function drawSoftStar(ctx, x, y, size) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5;
        const radius = i % 2 === 0 ? size : size / 2;
        const starX = x + radius * Math.cos(angle);
        const starY = y + radius * Math.sin(angle);
        
        if (i === 0) ctx.moveTo(starX, starY);
        else ctx.lineTo(starX, starY);
    }
    ctx.closePath();
    ctx.fill();
}

function drawCreativeDynamic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f97316';
    
    // Dynamic motion trails
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    const motionPaths = [
        { startX: 50, startY: canvas.height - 60, endX: 150, endY: canvas.height - 30 },
        { startX: 100, startY: canvas.height - 40, endX: 200, endY: canvas.height - 65 },
        { startX: 150, startY: canvas.height - 55, endX: 250, endY: canvas.height - 25 }
    ];
    
    motionPaths.forEach((path, index) => {
        // Motion trail with decreasing opacity
        for (let i = 0; i < 5; i++) {
            const progress = i / 4;
            const x = path.startX + (path.endX - path.startX) * progress;
            const y = path.startY + (path.endY - path.startY) * progress;
            const opacity = (5 - i) * 15;
            
            ctx.strokeStyle = accentColor + opacity;
            ctx.lineWidth = 3 + i;
            
            if (i === 0) {
                ctx.beginPath();
                ctx.moveTo(x, y);
            } else {
                const prevProgress = (i - 1) / 4;
                const prevX = path.startX + (path.endX - path.startX) * prevProgress;
                const prevY = path.startY + (path.endY - path.startY) * prevProgress;
                
                ctx.beginPath();
                ctx.moveTo(prevX, prevY);
                ctx.lineTo(x, y);
                ctx.stroke();
            }
        }
    });
    
    // Dynamic energy spirals
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const spiralCenter = { x: canvas.width - 80, y: canvas.height - 45 };
    
    ctx.beginPath();
    for (let t = 0; t < 6 * Math.PI; t += 0.1) {
        const radius = t * 1.5;
        const x = spiralCenter.x + radius * Math.cos(t);
        const y = spiralCenter.y + radius * Math.sin(t);
        
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Dynamic particles
    ctx.fillStyle = accentColor + '80';
    
    for (let i = 0; i < 15; i++) {
        const x = 300 + Math.random() * 100;
        const y = canvas.height - 70 + Math.random() * 50;
        const size = 2 + Math.random() * 4;
        const velocity = { x: Math.random() * 4 - 2, y: Math.random() * 4 - 2 };
        
        // Particle with motion blur effect
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.6, Math.atan2(velocity.y, velocity.x), 0, 2 * Math.PI);
        ctx.fill();
        
        // Motion trail
        ctx.strokeStyle = accentColor + '40';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - velocity.x * 5, y - velocity.y * 5);
        ctx.stroke();
    }
}

// Continue with remaining Creative themes...

function drawCreativeMinimalist(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6b7280';
    
    // Minimalist single line
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(100, canvas.height - 40);
    ctx.lineTo(canvas.width - 100, canvas.height - 40);
    ctx.stroke();
    
    // Minimalist dot
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 40, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Minimalist spacing elements
    const elements = [
        { x: 120, y: canvas.height - 60 },
        { x: 200, y: canvas.height - 50 },
        { x: 280, y: canvas.height - 55 }
    ];
    
    elements.forEach(element => {
        ctx.strokeStyle = accentColor + '50';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.rect(element.x, element.y, 20, 8);
        ctx.stroke();
    });
}

function drawCreativeRetro(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#eab308';
    
    // Retro sunburst
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    const centerX = 100;
    const centerY = canvas.height - 50;
    
    for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        const length = 25 + (i % 2) * 10;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + length * Math.cos(angle),
            centerY + length * Math.sin(angle)
        );
        ctx.stroke();
    }
    
    // Retro stripes
    const retroColors = [accentColor + '70', '#f97316' + '70', '#ef4444' + '70', '#8b5cf6' + '70'];
    
    retroColors.forEach((color, index) => {
        ctx.fillStyle = color;
        const x = 180 + (index * 25);
        const y = canvas.height - 60;
        
        ctx.fillRect(x, y, 20, 40);
    });
    
    // Retro geometric pattern
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 5; i++) {
        const x = 320 + (i * 20);
        const y = canvas.height - 45;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y - 15);
        ctx.lineTo(x + 20, y);
        ctx.lineTo(x + 10, y + 15);
        ctx.closePath();
        ctx.stroke();
    }
}

function drawCreativeOrganic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#65a30d';
    
    // Organic flowing shapes
    ctx.fillStyle = accentColor + '50';
    
    // Leaf-like shapes
    const leaves = [
        { x: 80, y: canvas.height - 50, rotation: 0 },
        { x: 140, y: canvas.height - 45, rotation: Math.PI / 4 },
        { x: 200, y: canvas.height - 55, rotation: Math.PI / 2 }
    ];
    
    leaves.forEach(leaf => {
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 20, 10, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Leaf vein
        ctx.strokeStyle = accentColor + '80';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(15, 0);
        ctx.stroke();
        
        ctx.restore();
    });
    
    // Organic vine pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let x = 250; x < canvas.width - 50; x += 5) {
        const y = canvas.height - 45 + Math.sin((x - 250) * 0.02) * 15;
        if (x === 250) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Organic growth points
    ctx.fillStyle = accentColor + '70';
    for (let i = 0; i < 8; i++) {
        const x = 260 + (i * 15);
        const y = canvas.height - 45 + Math.sin((x - 250) * 0.02) * 15;
        
        ctx.beginPath();
        ctx.arc(x, y - 8, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawCreativeExperimental(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#a855f7';
    
    // Experimental abstract forms
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    // Random experimental lines
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        ctx.moveTo(
            50 + Math.random() * (canvas.width - 100),
            canvas.height - 70 + Math.random() * 50
        );
        ctx.lineTo(
            50 + Math.random() * (canvas.width - 100),
            canvas.height - 70 + Math.random() * 50
        );
        ctx.stroke();
    }
    
    // Experimental noise pattern
    ctx.fillStyle = accentColor + '40';
    
    for (let i = 0; i < 100; i++) {
        const x = 50 + Math.random() * (canvas.width - 100);
        const y = canvas.height - 70 + Math.random() * 50;
        const size = 1 + Math.random() * 3;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Experimental waveform
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let x = 50; x < canvas.width - 50; x += 2) {
        const frequency1 = 0.03;
        const frequency2 = 0.07;
        const y = canvas.height - 40 + 
                  Math.sin(x * frequency1) * 10 + 
                  Math.sin(x * frequency2) * 5;
        
        if (x === 50) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawCreativeWatercolor(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06b6d4';
    
    // Watercolor bleed effect
    const watercolorSpots = [
        { x: 80, y: canvas.height - 50, size: 25, opacity: '40' },
        { x: 150, y: canvas.height - 45, size: 30, opacity: '30' },
        { x: 220, y: canvas.height - 55, size: 20, opacity: '50' },
        { x: 290, y: canvas.height - 40, size: 35, opacity: '25' }
    ];
    
    watercolorSpots.forEach(spot => {
        // Main watercolor blob
        ctx.fillStyle = accentColor + spot.opacity;
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Watercolor bleeding effect
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * 2 * Math.PI;
            const distance = spot.size + Math.random() * 15;
            const bleedX = spot.x + distance * Math.cos(angle);
            const bleedY = spot.y + distance * Math.sin(angle);
            const bleedSize = 3 + Math.random() * 8;
            
            ctx.fillStyle = accentColor + '20';
            ctx.beginPath();
            ctx.arc(bleedX, bleedY, bleedSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Watercolor brush strokes
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    
    const brushStrokes = [
        { startX: 60, startY: canvas.height - 30, endX: 120, endY: canvas.height - 35 },
        { startX: 180, startY: canvas.height - 25, endX: 240, endY: canvas.height - 30 },
        { startX: 300, startY: canvas.height - 35, endX: 360, endY: canvas.height - 25 }
    ];
    
    brushStrokes.forEach(stroke => {
        ctx.beginPath();
        ctx.moveTo(stroke.startX, stroke.startY);
        ctx.lineTo(stroke.endX, stroke.endY);
        ctx.stroke();
    });
    
    // Watercolor drips
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 6; i++) {
        const x = 100 + (i * 50);
        const startY = canvas.height - 65;
        const dripLength = 10 + Math.random() * 15;
        
        ctx.beginPath();
        ctx.moveTo(x, startY);
        ctx.lineTo(x + Math.random() * 6 - 3, startY + dripLength);
        ctx.stroke();
    }
}

function drawCreativeNeon(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ec4899';
    
    // Neon glow effect
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
    
    // Neon outline text effect
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 3;
    ctx.font = 'bold 24px Inter';
    
    ctx.strokeText('NEON', 80, canvas.height - 30);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Neon tubes
    const neonTubes = [
        { startX: 180, startY: canvas.height - 60, endX: 250, endY: canvas.height - 60 },
        { startX: 180, startY: canvas.height - 45, endX: 230, endY: canvas.height - 45 },
        { startX: 180, startY: canvas.height - 30, endX: 270, endY: canvas.height - 30 }
    ];
    
    neonTubes.forEach(tube => {
        // Outer glow
        ctx.strokeStyle = accentColor + '30';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(tube.startX, tube.startY);
        ctx.lineTo(tube.endX, tube.endY);
        ctx.stroke();
        
        // Inner neon
        ctx.strokeStyle = accentColor + '90';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tube.startX, tube.startY);
        ctx.lineTo(tube.endX, tube.endY);
        ctx.stroke();
    });
    
    // Neon particles
    ctx.fillStyle = accentColor + '80';
    
    for (let i = 0; i < 15; i++) {
        const x = 300 + Math.random() * 100;
        const y = canvas.height - 70 + Math.random() * 50;
        const size = 2 + Math.random() * 4;
        
        // Particle glow
        ctx.save();
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 8;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.restore();
    }
    
    // Neon circuit pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const circuitPoints = [
        { x: 320, y: canvas.height - 25 },
        { x: 340, y: canvas.height - 25 },
        { x: 340, y: canvas.height - 45 },
        { x: 360, y: canvas.height - 45 },
        { x: 360, y: canvas.height - 35 },
        { x: 380, y: canvas.height - 35 }
    ];
    
    ctx.beginPath();
    circuitPoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    
    // Circuit nodes
    ctx.fillStyle = accentColor + '90';
    circuitPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawCreativeCollage(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f97316';
    
    // Collage elements - overlapping shapes
    const collageElements = [
        { type: 'rect', x: 60, y: canvas.height - 60, w: 40, h: 30, rotation: 0.2 },
        { type: 'circle', x: 100, y: canvas.height - 40, r: 15, rotation: 0 },
        { type: 'rect', x: 130, y: canvas.height - 55, w: 35, h: 25, rotation: -0.3 },
        { type: 'triangle', x: 180, y: canvas.height - 45, size: 20, rotation: 0.5 }
    ];
    
    collageElements.forEach((element, index) => {
        ctx.save();
        
        // Vary colors
        const alpha = 40 + (index * 10);
        ctx.fillStyle = accentColor + alpha;
        ctx.strokeStyle = accentColor + '80';
        ctx.lineWidth = 2;
        
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation);
        
        ctx.beginPath();
        
        switch (element.type) {
            case 'rect':
                ctx.rect(-element.w / 2, -element.h / 2, element.w, element.h);
                break;
            case 'circle':
                ctx.arc(0, 0, element.r, 0, 2 * Math.PI);
                break;
            case 'triangle':
                ctx.moveTo(0, -element.size / 2);
                ctx.lineTo(-element.size / 2, element.size / 2);
                ctx.lineTo(element.size / 2, element.size / 2);
                ctx.closePath();
                break;
        }
        
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    });
    
    // Collage paper tears
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 5; i++) {
        const x = 250 + (i * 30);
        const startY = canvas.height - 60;
        
        ctx.beginPath();
        ctx.moveTo(x, startY);
        
        for (let j = 0; j < 20; j++) {
            const y = startY + (j * 2);
            const jitter = Math.sin(j * 0.5) * 3;
            ctx.lineTo(x + jitter, y);
        }
        
        ctx.stroke();
    }
    
    // Collage tape strips
    ctx.fillStyle = accentColor + '30';
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const tapeStrips = [
        { x: 90, y: canvas.height - 65, w: 30, h: 8, rotation: 0.3 },
        { x: 170, y: canvas.height - 50, w: 25, h: 6, rotation: -0.2 }
    ];
    
    tapeStrips.forEach(tape => {
        ctx.save();
        ctx.translate(tape.x, tape.y);
        ctx.rotate(tape.rotation);
        
        ctx.fillRect(-tape.w / 2, -tape.h / 2, tape.w, tape.h);
        ctx.strokeRect(-tape.w / 2, -tape.h / 2, tape.w, tape.h);
        
        ctx.restore();
    });
}

function drawCreativeGeometric(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6366f1';
    
    // Sacred geometry pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height - 45;
    
    // Hexagonal pattern
    const hexRadius = 25;
    
    for (let ring = 0; ring < 3; ring++) {
        const radius = hexRadius + (ring * 15);
        
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    }
    
    // Geometric triangulation
    const points = [];
    for (let i = 0; i < 8; i++) {
        points.push({
            x: 80 + Math.random() * 200,
            y: canvas.height - 70 + Math.random() * 40
        });
    }
    
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    // Connect nearby points
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const distance = Math.sqrt(
                Math.pow(points[i].x - points[j].x, 2) +
                Math.pow(points[i].y - points[j].y, 2)
            );
            
            if (distance < 60) {
                ctx.beginPath();
                ctx.moveTo(points[i].x, points[i].y);
                ctx.lineTo(points[j].x, points[j].y);
                ctx.stroke();
            }
        }
    }
    
    // Geometric points
    ctx.fillStyle = accentColor + '80';
    points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Golden ratio spiral
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const spiralStart = { x: canvas.width - 80, y: canvas.height - 45 };
    
    ctx.beginPath();
    for (let t = 0; t < 4 * Math.PI; t += 0.1) {
        const r = t * 2;
        const x = spiralStart.x + r * Math.cos(t);
        const y = spiralStart.y + r * Math.sin(t);
        
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawCreativeGrunge(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#71717a';
    
    // Grunge texture strokes
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    // Random grungy strokes
    for (let i = 0; i < 25; i++) {
        const startX = 50 + Math.random() * (canvas.width - 100);
        const startY = canvas.height - 70 + Math.random() * 50;
        const endX = startX + (Math.random() - 0.5) * 40;
        const endY = startY + (Math.random() - 0.5) * 20;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // Grunge splatter effect
    ctx.fillStyle = accentColor + '50';
    
    for (let i = 0; i < 40; i++) {
        const x = 50 + Math.random() * (canvas.width - 100);
        const y = canvas.height - 70 + Math.random() * 50;
        const size = 1 + Math.random() * 4;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Grunge wear marks
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 10; i++) {
        const x = 100 + (i * 30);
        const y = canvas.height - 25;
        const length = 5 + Math.random() * 15;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 10 - 5, y - length);
        ctx.stroke();
    }
    
    // Grunge distressed border
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let x = 50; x < canvas.width - 50; x += 5) {
        const y = canvas.height - 15 + Math.sin(x * 0.1) * 3 + (Math.random() - 0.5) * 4;
        if (x === 50) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}

function drawCreativePop(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ef4444';
    
    // Pop art dots (Ben-Day dots)
    ctx.fillStyle = accentColor + '60';
    
    const dotSpacing = 12;
    for (let x = 60; x < 200; x += dotSpacing) {
        for (let y = canvas.height - 70; y < canvas.height - 20; y += dotSpacing) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
    
    // Pop art speech bubble
    ctx.fillStyle = accentColor + '70';
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 3;
    
    const bubbleX = 250;
    const bubbleY = canvas.height - 50;
    
    // Bubble body
    ctx.beginPath();
    ctx.ellipse(bubbleX, bubbleY, 40, 20, 0, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Bubble tail
    ctx.beginPath();
    ctx.moveTo(bubbleX - 25, bubbleY + 10);
    ctx.lineTo(bubbleX - 35, bubbleY + 25);
    ctx.lineTo(bubbleX - 15, bubbleY + 15);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Pop art text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('POP!', bubbleX - 15, bubbleY + 3);
    
    // Pop art explosion
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    const explodeX = canvas.width - 80;
    const explodeY = canvas.height - 45;
    
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const length = 15 + (i % 2) * 10;
        
        ctx.beginPath();
        ctx.moveTo(explodeX, explodeY);
        ctx.lineTo(
            explodeX + length * Math.cos(angle),
            explodeY + length * Math.sin(angle)
        );
        ctx.stroke();
    }
    
    // Pop art color blocks
    const popColors = [accentColor + '70', '#fbbf24' + '70', '#06d6a0' + '70', '#8b5cf6' + '70'];
    
    popColors.forEach((color, index) => {
        ctx.fillStyle = color;
        const x = 350 + (index * 15);
        const y = canvas.height - 50;
        
        ctx.fillRect(x, y, 12, 30);
    });
}

function drawCreativeSurreal(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // Surreal floating elements
    const floatingElements = [
        { x: 80, y: canvas.height - 60, type: 'eye' },
        { x: 150, y: canvas.height - 45, type: 'clock' },
        { x: 220, y: canvas.height - 55, type: 'key' },
        { x: 290, y: canvas.height - 40, type: 'cloud' }
    ];
    
    floatingElements.forEach(element => {
        ctx.save();
        
        switch (element.type) {
            case 'eye':
                // Surreal floating eye
                ctx.fillStyle = accentColor + '60';
                ctx.beginPath();
                ctx.ellipse(element.x, element.y, 15, 10, 0, 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.fillStyle = accentColor + '90';
                ctx.beginPath();
                ctx.arc(element.x, element.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                break;
                
            case 'clock':
                // Melting clock
                ctx.fillStyle = accentColor + '50';
                ctx.beginPath();
                ctx.ellipse(element.x, element.y, 12, 8, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                
                // Clock hands
                ctx.strokeStyle = accentColor + '90';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(element.x, element.y);
                ctx.lineTo(element.x + 8, element.y - 3);
                ctx.moveTo(element.x, element.y);
                ctx.lineTo(element.x + 3, element.y - 6);
                ctx.stroke();
                break;
                
            case 'key':
                // Floating key
                ctx.fillStyle = accentColor + '70';
                ctx.fillRect(element.x - 10, element.y - 2, 15, 4);
                ctx.fillRect(element.x + 5, element.y - 6, 3, 12);
                
                // Key teeth
                ctx.fillRect(element.x + 8, element.y + 2, 4, 2);
                ctx.fillRect(element.x + 8, element.y + 5, 2, 2);
                break;
                
            case 'cloud':
                // Impossible cloud
                ctx.fillStyle = accentColor + '40';
                ctx.beginPath();
                ctx.arc(element.x - 8, element.y, 8, 0, 2 * Math.PI);
                ctx.arc(element.x, element.y, 10, 0, 2 * Math.PI);
                ctx.arc(element.x + 8, element.y, 6, 0, 2 * Math.PI);
                ctx.fill();
                break;
        }
        
        ctx.restore();
    });
    
    // Surreal distortion waves
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 3; i++) {
        const baseY = canvas.height - 25 + (i * 5);
        
        ctx.beginPath();
        for (let x = 50; x < canvas.width - 50; x += 3) {
            const distortion = Math.sin(x * 0.02 + i) * 8 + Math.sin(x * 0.05) * 3;
            const y = baseY + distortion;
            
            if (x === 50) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    }
    
    // Impossible staircase
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const stairX = canvas.width - 100;
    const stairY = canvas.height - 60;
    
    // Impossible stairs going up and down simultaneously
    for (let i = 0; i < 4; i++) {
        const x = stairX + (i * 15);
        const y1 = stairY + (i * 8);
        const y2 = stairY - (i * 8);
        
        ctx.beginPath();
        ctx.rect(x, y1, 12, 8);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x + 6, y2);
        ctx.lineTo(x + 18, y2);
        ctx.lineTo(x + 12, y1 + 8);
        ctx.stroke();
    }
}

function drawCreativeDigital(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06b6d4';
    
    // Digital pixel pattern
    ctx.fillStyle = accentColor + '60';
    
    const pixelSize = 8;
    const pattern = [
        [1, 0, 1, 0, 1, 1, 0, 1],
        [0, 1, 1, 0, 0, 1, 1, 0],
        [1, 1, 0, 1, 1, 0, 0, 1],
        [0, 0, 1, 1, 0, 1, 1, 1]
    ];
    
    pattern.forEach((row, rowIndex) => {
        row.forEach((pixel, colIndex) => {
            if (pixel) {
                const x = 60 + (colIndex * pixelSize);
                const y = canvas.height - 60 + (rowIndex * pixelSize);
                ctx.fillRect(x, y, pixelSize, pixelSize);
            }
        });
    });
    
    // Digital glitch effect
    ctx.fillStyle = accentColor + '80';
    
    for (let i = 0; i < 15; i++) {
        const x = 150 + Math.random() * 100;
        const y = canvas.height - 70 + Math.random() * 50;
        const w = 2 + Math.random() * 8;
        const h = 1 + Math.random() * 3;
        
        ctx.fillRect(x, y, w, h);
    }
    
    // Digital waveform
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let x = 280; x < canvas.width - 50; x += 5) {
        const y = canvas.height - 45 + Math.floor(Math.sin(x * 0.1) * 2) * 8;
        if (x === 280) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Digital scanlines
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 1;
    
    for (let y = canvas.height - 70; y < canvas.height - 20; y += 4) {
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(canvas.width - 50, y);
        ctx.stroke();
    }
    
    // Digital noise
    ctx.fillStyle = accentColor + '40';
    
    for (let i = 0; i < 50; i++) {
        const x = 50 + Math.random() * (canvas.width - 100);
        const y = canvas.height - 70 + Math.random() * 50;
        
        if (Math.random() > 0.7) {
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

function drawCreativeAbstract(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f97316';
    
    // Abstract flowing forms
    ctx.fillStyle = accentColor + '50';
    
    // Organic abstract shape 1
    ctx.beginPath();
    ctx.moveTo(80, canvas.height - 60);
    ctx.bezierCurveTo(120, canvas.height - 80, 160, canvas.height - 30, 200, canvas.height - 50);
    ctx.bezierCurveTo(180, canvas.height - 20, 140, canvas.height - 40, 100, canvas.height - 35);
    ctx.bezierCurveTo(90, canvas.height - 45, 85, canvas.height - 55, 80, canvas.height - 60);
    ctx.fill();
    
    // Abstract color field
    const colorFields = [
        { x: 230, y: canvas.height - 65, w: 40, h: 20, alpha: '60' },
        { x: 250, y: canvas.height - 50, w: 35, h: 25, alpha: '40' },
        { x: 240, y: canvas.height - 35, w: 45, h: 15, alpha: '80' }
    ];
    
    colorFields.forEach(field => {
        ctx.fillStyle = accentColor + field.alpha;
        ctx.fillRect(field.x, field.y, field.w, field.h);
    });
    
    // Abstract gesture lines
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    
    const gestures = [
        { points: [{ x: 320, y: canvas.height - 60 }, { x: 350, y: canvas.height - 45 }, { x: 380, y: canvas.height - 55 }] },
        { points: [{ x: 330, y: canvas.height - 35 }, { x: 360, y: canvas.height - 30 }, { x: 390, y: canvas.height - 40 }] }
    ];
    
    gestures.forEach(gesture => {
        ctx.beginPath();
        gesture.points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    });
    
    // Abstract texture marks
    ctx.fillStyle = accentColor + '60';
    
    for (let i = 0; i < 20; i++) {
        const x = 50 + Math.random() * (canvas.width - 100);
        const y = canvas.height - 70 + Math.random() * 50;
        const size = 2 + Math.random() * 6;
        const rotation = Math.random() * Math.PI;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        ctx.fillRect(-size / 2, -1, size, 2);
        
        ctx.restore();
    }
}

function drawCreativeHanddrawn(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#65a30d';
    
    // Hand-drawn sketchy lines
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    // Sketchy rectangle
    const drawSketchyRect = (x, y, w, h) => {
        ctx.beginPath();
        
        // Top line with hand-drawn wobble
        for (let i = 0; i <= w; i += 2) {
            const wobble = (Math.random() - 0.5) * 2;
            const lineY = y + wobble;
            if (i === 0) ctx.moveTo(x + i, lineY);
            else ctx.lineTo(x + i, lineY);
        }
        
        // Right line
        for (let i = 0; i <= h; i += 2) {
            const wobble = (Math.random() - 0.5) * 2;
            const lineX = x + w + wobble;
            ctx.lineTo(lineX, y + i);
        }
        
        // Bottom line
        for (let i = w; i >= 0; i -= 2) {
            const wobble = (Math.random() - 0.5) * 2;
            const lineY = y + h + wobble;
            ctx.lineTo(x + i, lineY);
        }
        
        // Left line
        for (let i = h; i >= 0; i -= 2) {
            const wobble = (Math.random() - 0.5) * 2;
            const lineX = x + wobble;
            ctx.lineTo(lineX, y + i);
        }
        
        ctx.stroke();
    };
    
    drawSketchyRect(80, canvas.height - 60, 40, 30);
    drawSketchyRect(140, canvas.height - 50, 35, 25);
    
    // Hand-drawn circle
    const drawSketchyCircle = (centerX, centerY, radius) => {
        ctx.beginPath();
        
        for (let angle = 0; angle <= 2 * Math.PI; angle += 0.1) {
            const wobble = (Math.random() - 0.5) * 3;
            const x = centerX + (radius + wobble) * Math.cos(angle);
            const y = centerY + (radius + wobble) * Math.sin(angle);
            
            if (angle === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
    };
    
    drawSketchyCircle(220, canvas.height - 45, 18);
    
    // Hand-drawn hatching
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 15; i++) {
        const x1 = 280 + (i * 3);
        const y1 = canvas.height - 60;
        const x2 = x1 + 20;
        const y2 = canvas.height - 40;
        
        // Add slight randomness to hatching lines
        const wobble1 = (Math.random() - 0.5) * 2;
        const wobble2 = (Math.random() - 0.5) * 2;
        
        ctx.beginPath();
        ctx.moveTo(x1 + wobble1, y1);
        ctx.lineTo(x2 + wobble2, y2);
        ctx.stroke();
    }
    
    // Cross-hatching
    for (let i = 0; i < 15; i++) {
        const x1 = 300 + (i * 3);
        const y1 = canvas.height - 40;
        const x2 = x1 - 20;
        const y2 = canvas.height - 60;
        
        const wobble1 = (Math.random() - 0.5) * 2;
        const wobble2 = (Math.random() - 0.5) * 2;
        
        ctx.beginPath();
        ctx.moveTo(x1 + wobble1, y1);
        ctx.lineTo(x2 + wobble2, y2);
        ctx.stroke();
    }
    
    // Hand-drawn annotations
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    // Arrow pointing to something
    ctx.beginPath();
    ctx.moveTo(350, canvas.height - 55);
    ctx.lineTo(370, canvas.height - 40);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(370, canvas.height - 40);
    ctx.lineTo(365, canvas.height - 45);
    ctx.moveTo(370, canvas.height - 40);
    ctx.lineTo(365, canvas.height - 35);
    ctx.stroke();
    
    // Sketchy notes
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    ctx.fillText('sketch', 375, canvas.height - 35);
}

// MEDICAL THEME DECORATIONS
function drawMedicalClinical(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#dc2626';
    
    // Medical cross
    ctx.fillStyle = accentColor + '70';
    const crossX = 80;
    const crossY = canvas.height - 45;
    
    // Horizontal bar
    ctx.fillRect(crossX - 12, crossY - 4, 24, 8);
    // Vertical bar
    ctx.fillRect(crossX - 4, crossY - 12, 8, 24);
    
    // Clinical grid/chart
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    const gridX = 150;
    const gridY = canvas.height - 65;
    const gridSize = 10;
    
    for (let i = 0; i <= 6; i++) {
        ctx.beginPath();
        ctx.moveTo(gridX + (i * gridSize), gridY);
        ctx.lineTo(gridX + (i * gridSize), gridY + 40);
        ctx.stroke();
    }
    
    for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(gridX, gridY + (i * gridSize));
        ctx.lineTo(gridX + 60, gridY + (i * gridSize));
        ctx.stroke();
    }
    
    // Clinical vital signs line
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const vitalPoints = [
        { x: gridX + 5, y: gridY + 30 },
        { x: gridX + 15, y: gridY + 15 },
        { x: gridX + 25, y: gridY + 25 },
        { x: gridX + 35, y: gridY + 10 },
        { x: gridX + 45, y: gridY + 20 },
        { x: gridX + 55, y: gridY + 35 }
    ];
    
    ctx.beginPath();
    vitalPoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    
    // Medical equipment symbols
    ctx.fillStyle = accentColor + '60';
    ctx.font = '16px Inter';
    
    const medicalSymbols = ['🩺', '💊', '🏥', '🔬'];
    medicalSymbols.forEach((symbol, index) => {
        const x = 250 + (index * 30);
        const y = canvas.height - 30;
        ctx.fillText(symbol, x, y);
    });
    
    // Clinical temperature chart
    ctx.fillStyle = accentColor + '50';
    
    const tempBars = [36.5, 37.2, 38.1, 36.8, 37.5];
    tempBars.forEach((temp, index) => {
        const x = 380 + (index * 12);
        const height = (temp - 36) * 20; // Scale temperature to height
        const y = canvas.height - 25;
        
        ctx.fillRect(x, y - height, 8, height);
    });
}

// Continue with remaining Medical themes...

function drawMedicalResearch(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#059669';
    
    // Research microscope
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const microscopeX = 80;
    const microscopeY = canvas.height - 30;
    
    // Microscope base
    ctx.fillRect(microscopeX - 15, microscopeY, 30, 8);
    
    // Microscope body
    ctx.fillRect(microscopeX - 3, microscopeY - 25, 6, 25);
    
    // Microscope eyepiece
    ctx.beginPath();
    ctx.arc(microscopeX, microscopeY - 25, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Research data visualization
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const dataPoints = [
        { x: 150, y: canvas.height - 50, value: 25 },
        { x: 170, y: canvas.height - 45, value: 40 },
        { x: 190, y: canvas.height - 60, value: 60 },
        { x: 210, y: canvas.height - 35, value: 30 },
        { x: 230, y: canvas.height - 55, value: 50 }
    ];
    
    // Research trend line
    ctx.beginPath();
    dataPoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    
    // Data points
    ctx.fillStyle = accentColor + '80';
    dataPoints.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Research molecules
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const molecules = [
        { x: 280, y: canvas.height - 50 },
        { x: 300, y: canvas.height - 45 },
        { x: 320, y: canvas.height - 55 },
        { x: 340, y: canvas.height - 40 }
    ];
    
    // Molecular bonds
    for (let i = 0; i < molecules.length - 1; i++) {
        ctx.beginPath();
        ctx.moveTo(molecules[i].x, molecules[i].y);
        ctx.lineTo(molecules[i + 1].x, molecules[i + 1].y);
        ctx.stroke();
    }
    
    // Molecular atoms
    ctx.fillStyle = accentColor + '70';
    molecules.forEach(molecule => {
        ctx.beginPath();
        ctx.arc(molecule.x, molecule.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Research progress bar
    ctx.fillStyle = accentColor + '40';
    ctx.fillRect(380, canvas.height - 35, 60, 8);
    
    ctx.fillStyle = accentColor + '80';
    ctx.fillRect(380, canvas.height - 35, 42, 8); // 70% progress
}

function drawMedicalPharma(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0ea5e9';
    
    // Pharmaceutical pills
    ctx.fillStyle = accentColor + '70';
    
    const pills = [
        { x: 70, y: canvas.height - 45, type: 'capsule' },
        { x: 110, y: canvas.height - 50, type: 'tablet' },
        { x: 150, y: canvas.height - 40, type: 'capsule' },
        { x: 190, y: canvas.height - 55, type: 'tablet' }
    ];
    
    pills.forEach(pill => {
        if (pill.type === 'capsule') {
            // Capsule (two half circles connected)
            ctx.beginPath();
            ctx.arc(pill.x - 6, pill.y, 4, Math.PI / 2, 3 * Math.PI / 2);
            ctx.arc(pill.x + 6, pill.y, 4, 3 * Math.PI / 2, Math.PI / 2);
            ctx.closePath();
            ctx.fill();
        } else {
            // Tablet (circle)
            ctx.beginPath();
            ctx.arc(pill.x, pill.y, 6, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    
    // Chemical formula
    ctx.fillStyle = accentColor + '80';
    ctx.font = '12px monospace';
    ctx.fillText('C₈H₁₁NO₂', 230, canvas.height - 35);
    
    // Pharmaceutical bottle
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const bottleX = 320;
    const bottleY = canvas.height - 30;
    
    // Bottle body
    ctx.fillRect(bottleX, bottleY - 30, 15, 30);
    ctx.strokeRect(bottleX, bottleY - 30, 15, 30);
    
    // Bottle cap
    ctx.fillRect(bottleX + 2, bottleY - 35, 11, 5);
    ctx.strokeRect(bottleX + 2, bottleY - 35, 11, 5);
    
    // Dosage chart
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    const doseX = 360;
    const doseY = canvas.height - 50;
    
    // Chart grid
    for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(doseX, doseY + (i * 8));
        ctx.lineTo(doseX + 50, doseY + (i * 8));
        ctx.stroke();
    }
    
    // Dosage bars
    ctx.fillStyle = accentColor + '60';
    const dosages = [3, 2, 4, 2, 3]; // Times per day
    
    dosages.forEach((dose, index) => {
        const x = doseX + 5 + (index * 8);
        const height = dose * 6;
        ctx.fillRect(x, doseY + 32 - height, 6, height);
    });
}

function drawMedicalCardiology(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#ef4444';
    
    // Heart shape
    ctx.fillStyle = accentColor + '70';
    
    const heartX = 80;
    const heartY = canvas.height - 45;
    
    ctx.beginPath();
    ctx.moveTo(heartX, heartY + 5);
    ctx.bezierCurveTo(heartX - 10, heartY - 5, heartX - 15, heartY - 15, heartX, heartY - 8);
    ctx.bezierCurveTo(heartX + 15, heartY - 15, heartX + 10, heartY - 5, heartX, heartY + 5);
    ctx.fill();
    
    // ECG/EKG waveform
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    const ecgData = [];
    let x = 140;
    const baseY = canvas.height - 40;
    
    // Generate ECG pattern
    while (x < 350) {
        if (x % 60 < 5) {
            // P wave
            ecgData.push({ x, y: baseY - 5 });
        } else if (x % 60 < 8) {
            // Q wave
            ecgData.push({ x, y: baseY + 3 });
        } else if (x % 60 < 12) {
            // R wave (spike)
            ecgData.push({ x, y: baseY - 20 });
        } else if (x % 60 < 15) {
            // S wave
            ecgData.push({ x, y: baseY + 5 });
        } else if (x % 60 < 25) {
            // T wave
            ecgData.push({ x, y: baseY - 8 });
        } else {
            // Baseline
            ecgData.push({ x, y: baseY });
        }
        x += 2;
    }
    
    // Draw ECG line
    ctx.beginPath();
    ecgData.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    
    // Heart rate monitor grid
    ctx.strokeStyle = accentColor + '20';
    ctx.lineWidth = 1;
    
    for (let gridX = 140; gridX <= 350; gridX += 10) {
        ctx.beginPath();
        ctx.moveTo(gridX, canvas.height - 60);
        ctx.lineTo(gridX, canvas.height - 20);
        ctx.stroke();
    }
    
    for (let gridY = canvas.height - 60; gridY <= canvas.height - 20; gridY += 8) {
        ctx.beginPath();
        ctx.moveTo(140, gridY);
        ctx.lineTo(350, gridY);
        ctx.stroke();
    }
    
    // Heart rate display
    ctx.fillStyle = accentColor + '90';
    ctx.font = 'bold 14px Inter';
    ctx.fillText('♥ 72 BPM', 380, canvas.height - 35);
}

function drawMedicalNeurology(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#8b5cf6';
    
    // Brain outline
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const brainX = 80;
    const brainY = canvas.height - 50;
    
    ctx.beginPath();
    ctx.arc(brainX, brainY, 20, 0, Math.PI);
    ctx.quadraticCurveTo(brainX - 15, brainY - 5, brainX - 20, brainY + 5);
    ctx.quadraticCurveTo(brainX, brainY + 15, brainX + 20, brainY + 5);
    ctx.quadraticCurveTo(brainX + 15, brainY - 5, brainX, brainY - 20);
    ctx.stroke();
    
    // Brain hemisphere division
    ctx.beginPath();
    ctx.moveTo(brainX, brainY - 20);
    ctx.lineTo(brainX, brainY + 15);
    ctx.stroke();
    
    // Neural network
    const neurons = [
        { x: 150, y: canvas.height - 60 },
        { x: 180, y: canvas.height - 45 },
        { x: 210, y: canvas.height - 55 },
        { x: 240, y: canvas.height - 40 },
        { x: 200, y: canvas.height - 30 },
        { x: 170, y: canvas.height - 35 }
    ];
    
    // Neural connections
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    neurons.forEach((neuron, i) => {
        neurons.forEach((otherNeuron, j) => {
            if (i !== j) {
                const distance = Math.sqrt(
                    Math.pow(neuron.x - otherNeuron.x, 2) + 
                    Math.pow(neuron.y - otherNeuron.y, 2)
                );
                
                if (distance < 50) {
                    ctx.beginPath();
                    ctx.moveTo(neuron.x, neuron.y);
                    ctx.lineTo(otherNeuron.x, otherNeuron.y);
                    ctx.stroke();
                }
            }
        });
    });
    
    // Neural nodes
    ctx.fillStyle = accentColor + '80';
    neurons.forEach(neuron => {
        ctx.beginPath();
        ctx.arc(neuron.x, neuron.y, 4, 0, 2 * Math.PI);
        ctx.fill();
    });
    
    // Brainwave pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let x = 280; x < 420; x += 2) {
        const y = canvas.height - 45 + Math.sin(x * 0.1) * 8 + Math.sin(x * 0.05) * 4;
        if (x === 280) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Neural activity indicators
    ctx.fillStyle = accentColor + '70';
    for (let i = 0; i < 8; i++) {
        const x = 300 + (i * 15);
        const y = canvas.height - 25;
        const activity = Math.random();
        
        if (activity > 0.6) {
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
    }
}

function drawMedicalSurgery(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0f172a';
    
    // Surgical scalpel
    ctx.strokeStyle = accentColor + '80';
    ctx.fillStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const scalpelX = 80;
    const scalpelY = canvas.height - 45;
    
    // Scalpel handle
    ctx.fillRect(scalpelX - 15, scalpelY - 2, 20, 4);
    
    // Scalpel blade
    ctx.beginPath();
    ctx.moveTo(scalpelX + 5, scalpelY - 2);
    ctx.lineTo(scalpelX + 20, scalpelY - 5);
    ctx.lineTo(scalpelX + 22, scalpelY);
    ctx.lineTo(scalpelX + 20, scalpelY + 5);
    ctx.lineTo(scalpelX + 5, scalpelY + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Surgical sutures pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    const sutureX = 140;
    const sutureY = canvas.height - 45;
    
    // Main incision line
    ctx.beginPath();
    ctx.moveTo(sutureX, sutureY);
    ctx.lineTo(sutureX + 60, sutureY);
    ctx.stroke();
    
    // Suture stitches
    for (let i = 0; i < 6; i++) {
        const x = sutureX + 5 + (i * 10);
        
        ctx.beginPath();
        ctx.moveTo(x, sutureY - 5);
        ctx.lineTo(x, sutureY + 5);
        ctx.stroke();
        
        // Cross stitch
        ctx.beginPath();
        ctx.moveTo(x - 2, sutureY - 3);
        ctx.lineTo(x + 2, sutureY + 3);
        ctx.moveTo(x + 2, sutureY - 3);
        ctx.lineTo(x - 2, sutureY + 3);
        ctx.stroke();
    }
    
    // Surgical instruments
    ctx.fillStyle = accentColor + '70';
    
    // Forceps
    const forcepsX = 230;
    const forcepsY = canvas.height - 50;
    
    // Forceps handles
    ctx.fillRect(forcepsX, forcepsY, 2, 20);
    ctx.fillRect(forcepsX + 5, forcepsY, 2, 20);
    
    // Forceps tips
    ctx.beginPath();
    ctx.moveTo(forcepsX, forcepsY);
    ctx.lineTo(forcepsX - 5, forcepsY - 5);
    ctx.moveTo(forcepsX + 7, forcepsY);
    ctx.lineTo(forcepsX + 12, forcepsY - 5);
    ctx.stroke();
    
    // Surgical light representation
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 2;
    
    const lightX = 320;
    const lightY = canvas.height - 60;
    
    // Light rays
    for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const length = 15;
        
        ctx.beginPath();
        ctx.moveTo(lightX, lightY);
        ctx.lineTo(
            lightX + length * Math.cos(angle),
            lightY + length * Math.sin(angle)
        );
        ctx.stroke();
    }
    
    // Light center
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(lightX, lightY, 5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Operation time
    ctx.fillStyle = accentColor + '80';
    ctx.font = '12px Inter';
    ctx.fillText('⏱ 02:45:30', 360, canvas.height - 35);
}

function drawMedicalPediatric(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f97316';
    
    // Child-friendly stethoscope
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '60';
    ctx.lineWidth = 3;
    
    const stethX = 80;
    const stethY = canvas.height - 45;
    
    // Stethoscope chest piece
    ctx.beginPath();
    ctx.arc(stethX, stethY, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    
    // Stethoscope tubes
    ctx.beginPath();
    ctx.arc(stethX, stethY - 8, 20, Math.PI, 2 * Math.PI);
    ctx.stroke();
    
    // Ear pieces
    ctx.fillStyle = accentColor + '70';
    ctx.beginPath();
    ctx.arc(stethX - 20, stethY - 8, 4, 0, 2 * Math.PI);
    ctx.arc(stethX + 20, stethY - 8, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Growth chart
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const chartX = 140;
    const chartY = canvas.height - 60;
    
    // Chart grid
    for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(chartX, chartY + (i * 8));
        ctx.lineTo(chartX + 60, chartY + (i * 8));
        ctx.stroke();
    }
    
    // Growth curve
    const growthPoints = [
        { age: 0, height: 35 },
        { age: 12, height: 28 },
        { age: 24, height: 20 },
        { age: 36, height: 15 },
        { age: 48, height: 8 },
        { age: 60, height: 5 }
    ];
    
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    growthPoints.forEach((point, index) => {
        const x = chartX + (point.age / 60) * 60;
        const y = chartY + point.height;
        
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Pediatric toys/comfort items
    ctx.fillStyle = accentColor + '70';
    ctx.font = '16px Inter';
    
    const comfortItems = ['🧸', '🎈', '🌟', '🎨'];
    comfortItems.forEach((item, index) => {
        const x = 230 + (index * 25);
        const y = canvas.height - 30;
        ctx.fillText(item, x, y);
    });
    
    // Height measurement ruler
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const rulerX = 360;
    const rulerY = canvas.height - 60;
    
    ctx.beginPath();
    ctx.moveTo(rulerX, rulerY);
    ctx.lineTo(rulerX, rulerY + 40);
    ctx.stroke();
    
    // Ruler markings
    for (let i = 0; i <= 8; i++) {
        const markY = rulerY + (i * 5);
        const markLength = i % 2 === 0 ? 8 : 4;
        
        ctx.beginPath();
        ctx.moveTo(rulerX, markY);
        ctx.lineTo(rulerX + markLength, markY);
        ctx.stroke();
    }
    
    // Height measurement
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    ctx.fillText('120cm', rulerX + 12, rulerY + 20);
}

function drawMedicalEmergency(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#dc2626';
    
    // Emergency ambulance cross
    ctx.fillStyle = accentColor + '90';
    
    const crossX = 70;
    const crossY = canvas.height - 45;
    
    // Large emergency cross
    ctx.fillRect(crossX - 15, crossY - 5, 30, 10);
    ctx.fillRect(crossX - 5, crossY - 15, 10, 30);
    
    // Emergency alert zigzag
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 4;
    
    const zigzagPoints = [
        { x: 120, y: canvas.height - 60 },
        { x: 135, y: canvas.height - 40 },
        { x: 150, y: canvas.height - 55 },
        { x: 165, y: canvas.height - 35 },
        { x: 180, y: canvas.height - 50 }
    ];
    
    ctx.beginPath();
    zigzagPoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    
    // Emergency vital signs monitor
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const monitorX = 200;
    const monitorY = canvas.height - 45;
    
    // Rapid heartbeat pattern
    const heartbeatPattern = [];
    for (let x = 0; x < 80; x += 2) {
        let y = 0;
        if (x % 20 < 2) y = -15; // Spike
        else if (x % 20 < 4) y = 5; // Drop
        else y = 0; // Baseline
        
        heartbeatPattern.push({ x: monitorX + x, y: monitorY + y });
    }
    
    ctx.beginPath();
    heartbeatPattern.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    
    // Emergency contact/alert
    ctx.fillStyle = accentColor + '80';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('🚨 PRIORITY 1', 300, canvas.height - 50);
    
    // Emergency response time
    ctx.fillStyle = accentColor + '70';
    ctx.font = '10px Inter';
    ctx.fillText('Response: 4 min', 300, canvas.height - 35);
    
    // Emergency equipment icons
    ctx.fillStyle = accentColor + '60';
    ctx.font = '14px Inter';
    
    const emergencyEquip = ['🚑', '⚡', '💉', '🩹'];
    emergencyEquip.forEach((item, index) => {
        const x = 320 + (index * 20);
        const y = canvas.height - 20;
        ctx.fillText(item, x, y);
    });
}

function drawMedicalOrthopedic(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#64748b';
    
    // Bone structure
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const boneX = 80;
    const boneY = canvas.height - 45;
    
    // Long bone representation
    ctx.fillRect(boneX - 2, boneY - 20, 4, 40);
    
    // Bone ends (epiphyses)
    ctx.beginPath();
    ctx.arc(boneX, boneY - 20, 6, 0, 2 * Math.PI);
    ctx.arc(boneX, boneY + 20, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Joint representation
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const jointX = 140;
    const jointY = canvas.height - 45;
    
    // Joint socket
    ctx.beginPath();
    ctx.arc(jointX, jointY, 12, 0, Math.PI);
    ctx.stroke();
    
    // Joint ball
    ctx.beginPath();
    ctx.arc(jointX, jointY + 5, 8, 0, 2 * Math.PI);
    ctx.stroke();
    
    // X-ray grid pattern
    ctx.strokeStyle = accentColor + '30';
    ctx.lineWidth = 1;
    
    for (let x = 180; x <= 280; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, canvas.height - 60);
        ctx.lineTo(x, canvas.height - 20);
        ctx.stroke();
    }
    
    for (let y = canvas.height - 60; y <= canvas.height - 20; y += 8) {
        ctx.beginPath();
        ctx.moveTo(180, y);
        ctx.lineTo(280, y);
        ctx.stroke();
    }
    
    // Fracture line
    ctx.strokeStyle = accentColor + '80';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(220, canvas.height - 55);
    ctx.lineTo(240, canvas.height - 35);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    // Orthopedic hardware (screws/plates)
    ctx.fillStyle = accentColor + '80';
    
    const screws = [
        { x: 300, y: canvas.height - 50 },
        { x: 310, y: canvas.height - 45 },
        { x: 320, y: canvas.height - 40 }
    ];
    
    screws.forEach(screw => {
        ctx.beginPath();
        ctx.arc(screw.x, screw.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Screw thread lines
        ctx.strokeStyle = accentColor + '60';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(screw.x - 2, screw.y + i);
            ctx.lineTo(screw.x + 2, screw.y + i);
            ctx.stroke();
        }
    });
    
    // Range of motion arc
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.arc(360, canvas.height - 40, 20, Math.PI / 4, 3 * Math.PI / 4);
    ctx.stroke();
    
    // Motion angle markers
    ctx.fillStyle = accentColor + '70';
    ctx.font = '10px Inter';
    ctx.fillText('90°', 380, canvas.height - 50);
}

function drawMedicalDermatology(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#f59e0b';
    
    // Skin cells pattern
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    const cellPattern = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            const x = 70 + (col * 12) + (row % 2) * 6;
            const y = canvas.height - 55 + (row * 10);
            cellPattern.push({ x, y });
        }
    }
    
    // Draw hexagonal cells
    cellPattern.forEach(cell => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = cell.x + 5 * Math.cos(angle);
            const y = cell.y + 5 * Math.sin(angle);
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
    });
    
    // Dermatoscope view
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const scopeX = 200;
    const scopeY = canvas.height - 45;
    
    // Magnification circle
    ctx.beginPath();
    ctx.arc(scopeX, scopeY, 15, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Grid lines inside magnification
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(scopeX - 10, scopeY + (i * 5));
        ctx.lineTo(scopeX + 10, scopeY + (i * 5));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(scopeX + (i * 5), scopeY - 10);
        ctx.lineTo(scopeX + (i * 5), scopeY + 10);
        ctx.stroke();
    }
    
    // Skin lesion/mole
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(scopeX + 3, scopeY - 2, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // UV protection factor
    ctx.fillStyle = accentColor + '70';
    ctx.font = 'bold 12px Inter';
    ctx.fillText('SPF 50+', 250, canvas.height - 50);
    
    // Skin layers diagram
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const layerX = 300;
    const layerY = canvas.height - 60;
    
    // Epidermis
    ctx.beginPath();
    ctx.moveTo(layerX, layerY);
    ctx.lineTo(layerX + 60, layerY);
    ctx.stroke();
    
    // Dermis
    ctx.beginPath();
    ctx.moveTo(layerX, layerY + 15);
    ctx.lineTo(layerX + 60, layerY + 15);
    ctx.stroke();
    
    // Hypodermis
    ctx.beginPath();
    ctx.moveTo(layerX, layerY + 30);
    ctx.lineTo(layerX + 60, layerY + 30);
    ctx.stroke();
    
    // Layer labels
    ctx.fillStyle = accentColor + '70';
    ctx.font = '8px Inter';
    ctx.fillText('Epidermis', layerX + 65, layerY + 5);
    ctx.fillText('Dermis', layerX + 65, layerY + 20);
    ctx.fillText('Hypodermis', layerX + 65, layerY + 35);
    
    // Melanin dots
    ctx.fillStyle = accentColor + '80';
    for (let i = 0; i < 8; i++) {
        const x = layerX + 10 + (i * 6);
        const y = layerY + 5 + Math.random() * 8;
        
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fill();
    }
}

function drawMedicalOphthalmology(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#06b6d4';
    
    // Eye diagram
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const eyeX = 80;
    const eyeY = canvas.height - 45;
    
    // Eye outline
    ctx.beginPath();
    ctx.ellipse(eyeX, eyeY, 20, 12, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Iris
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 8, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Pupil
    ctx.fillStyle = accentColor + '90';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Light reflection
    ctx.fillStyle = '#ffffff80';
    ctx.beginPath();
    ctx.arc(eyeX - 1, eyeY - 1, 1.5, 0, 2 * Math.PI);
    ctx.fill();
    
    // Vision test chart
    ctx.fillStyle = accentColor + '80';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('E', 140, canvas.height - 50);
    
    ctx.font = 'bold 12px monospace';
    ctx.fillText('F P', 155, canvas.height - 50);
    
    ctx.font = 'bold 10px monospace';
    ctx.fillText('T O Z', 140, canvas.height - 35);
    
    ctx.font = 'bold 8px monospace';
    ctx.fillText('L P E D', 155, canvas.height - 35);
    
    // Eyeglasses/lens
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 2;
    
    const glassesX = 220;
    const glassesY = canvas.height - 45;
    
    // Left lens
    ctx.beginPath();
    ctx.arc(glassesX - 10, glassesY, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Right lens
    ctx.beginPath();
    ctx.arc(glassesX + 10, glassesY, 12, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Bridge
    ctx.beginPath();
    ctx.moveTo(glassesX - 2, glassesY);
    ctx.lineTo(glassesX + 2, glassesY);
    ctx.stroke();
    
    // Visual field test
    ctx.strokeStyle = accentColor + '40';
    ctx.lineWidth = 1;
    
    const fieldX = 280;
    const fieldY = canvas.height - 45;
    
    // Field circle
    ctx.beginPath();
    ctx.arc(fieldX, fieldY, 15, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Field grid
    for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(fieldX - 15, fieldY + (i * 7.5));
        ctx.lineTo(fieldX + 15, fieldY + (i * 7.5));
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(fieldX + (i * 7.5), fieldY - 15);
        ctx.lineTo(fieldX + (i * 7.5), fieldY + 15);
        ctx.stroke();
    }
    
    // Blind spot indicator
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(fieldX + 6, fieldY - 3, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Intraocular pressure reading
    ctx.fillStyle = accentColor + '70';
    ctx.font = '12px Inter';
    ctx.fillText('IOP: 15 mmHg', 320, canvas.height - 50);
    
    // Retinal blood vessels
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    const vesselPaths = [
        [{ x: 350, y: canvas.height - 40 }, { x: 365, y: canvas.height - 35 }, { x: 380, y: canvas.height - 30 }],
        [{ x: 355, y: canvas.height - 45 }, { x: 370, y: canvas.height - 40 }, { x: 385, y: canvas.height - 35 }]
    ];
    
    vesselPaths.forEach(path => {
        ctx.beginPath();
        path.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    });
}

function drawMedicalRadiology(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#6b7280';
    
    // X-ray film border
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '20';
    ctx.lineWidth = 2;
    
    const xrayX = 70;
    const xrayY = canvas.height - 60;
    const xrayWidth = 60;
    const xrayHeight = 40;
    
    ctx.fillRect(xrayX, xrayY, xrayWidth, xrayHeight);
    ctx.strokeRect(xrayX, xrayY, xrayWidth, xrayHeight);
    
    // Skeletal structure in X-ray
    ctx.strokeStyle = accentColor + '90';
    ctx.lineWidth = 2;
    
    // Rib cage
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(xrayX + 30, xrayY + 10 + (i * 4), 20, 0, Math.PI);
        ctx.stroke();
    }
    
    // Spine
    ctx.beginPath();
    ctx.moveTo(xrayX + 30, xrayY + 5);
    ctx.lineTo(xrayX + 30, xrayY + 35);
    ctx.stroke();
    
    // Vertebrae
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(xrayX + 30, xrayY + 8 + (i * 3.5), 2, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // CT scan slices
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    const ctX = 150;
    const ctY = canvas.height - 55;
    
    for (let slice = 0; slice < 4; slice++) {
        const sliceX = ctX + (slice * 25);
        
        // Slice outline
        ctx.beginPath();
        ctx.arc(sliceX, ctY, 12, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Internal structures
        ctx.beginPath();
        ctx.arc(sliceX - 3, ctY - 2, 4, 0, 2 * Math.PI);
        ctx.arc(sliceX + 3, ctY + 2, 3, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // MRI gradient
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 2;
    
    const mriX = 280;
    const mriY = canvas.height - 50;
    
    // MRI coil representation
    ctx.beginPath();
    ctx.ellipse(mriX, mriY, 20, 8, 0, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Magnetic field lines
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(mriX, mriY, 25 + (i * 3), 10 + (i * 1.5), 0, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // Radiation warning symbol
    ctx.strokeStyle = accentColor + '80';
    ctx.fillStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const radX = 360;
    const radY = canvas.height - 45;
    
    // Central circle
    ctx.beginPath();
    ctx.arc(radX, radY, 4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Radiation segments
    for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3;
        
        ctx.beginPath();
        ctx.arc(radX, radY, 12, angle - 0.3, angle + 0.3);
        ctx.lineTo(radX, radY);
        ctx.closePath();
        ctx.fill();
    }
    
    // Imaging parameters
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px monospace';
    ctx.fillText('kV: 120', 380, canvas.height - 50);
    ctx.fillText('mAs: 200', 380, canvas.height - 40);
    ctx.fillText('Slice: 1.25mm', 380, canvas.height - 30);
}

function drawMedicalPsychiatry(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#7c3aed';
    
    // Brain with thought patterns
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const brainX = 80;
    const brainY = canvas.height - 45;
    
    // Brain outline
    ctx.beginPath();
    ctx.arc(brainX, brainY, 18, 0, Math.PI);
    ctx.quadraticCurveTo(brainX - 12, brainY - 3, brainX - 18, brainY + 8);
    ctx.quadraticCurveTo(brainX, brainY + 12, brainX + 18, brainY + 8);
    ctx.quadraticCurveTo(brainX + 12, brainY - 3, brainX, brainY - 18);
    ctx.stroke();
    
    // Thought bubbles
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const thoughtBubbles = [
        { x: brainX + 25, y: brainY - 20, size: 8 },
        { x: brainX + 35, y: brainY - 25, size: 6 },
        { x: brainX + 42, y: brainY - 28, size: 4 }
    ];
    
    thoughtBubbles.forEach(bubble => {
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.size, 0, 2 * Math.PI);
        ctx.stroke();
    });
    
    // Mood spectrum
    ctx.fillStyle = accentColor + '60';
    const moodColors = ['80', '70', '60', '50', '40'];
    
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = accentColor + moodColors[i];
        ctx.fillRect(140 + (i * 15), canvas.height - 50, 12, 20);
    }
    
    // Mood scale labels
    ctx.fillStyle = accentColor + '80';
    ctx.font = '8px Inter';
    ctx.fillText('Mood Scale', 145, canvas.height - 55);
    
    // Emotional wave pattern
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    for (let x = 220; x < 320; x += 2) {
        const frequency1 = Math.sin(x * 0.05) * 8;  // Slower wave
        const frequency2 = Math.sin(x * 0.15) * 4;  // Faster wave
        const y = canvas.height - 40 + frequency1 + frequency2;
        
        if (x === 220) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
    
    // Therapy session notes
    ctx.fillStyle = accentColor + '70';
    ctx.font = '10px Inter';
    
    const sessionNotes = ['Session #12', 'Progress: +', 'CBT Techniques'];
    sessionNotes.forEach((note, index) => {
        ctx.fillText(note, 340, canvas.height - 50 + (index * 10));
    });
    
    // Neurotransmitter symbols
    ctx.strokeStyle = accentColor + '60';
    ctx.fillStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const neurotransmitters = [
        { x: 380, y: canvas.height - 35, type: 'serotonin' },
        { x: 400, y: canvas.height - 30, type: 'dopamine' },
        { x: 420, y: canvas.height - 40, type: 'gaba' }
    ];
    
    neurotransmitters.forEach(nt => {
        // Simple molecular representation
        ctx.beginPath();
        ctx.arc(nt.x, nt.y, 3, 0, 2 * Math.PI);
        ctx.fill();
        
        // Molecular bonds
        ctx.beginPath();
        ctx.moveTo(nt.x - 3, nt.y);
        ctx.lineTo(nt.x - 8, nt.y - 3);
        ctx.moveTo(nt.x + 3, nt.y);
        ctx.lineTo(nt.x + 8, nt.y + 3);
        ctx.stroke();
        
        // Bond end atoms
        ctx.beginPath();
        ctx.arc(nt.x - 8, nt.y - 3, 2, 0, 2 * Math.PI);
        ctx.arc(nt.x + 8, nt.y + 3, 2, 0, 2 * Math.PI);
        ctx.fill();
    });
}

function drawMedicalTelemedicine(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#0891b2';
    
    // Digital device screen
    ctx.strokeStyle = accentColor + '70';
    ctx.fillStyle = accentColor + '20';
    ctx.lineWidth = 2;
    
    const screenX = 70;
    const screenY = canvas.height - 55;
    const screenWidth = 50;
    const screenHeight = 35;
    
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    
    // Video call interface
    ctx.fillStyle = accentColor + '60';
    
    // Doctor avatar
    ctx.beginPath();
    ctx.arc(screenX + 15, screenY + 12, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Patient avatar
    ctx.beginPath();
    ctx.arc(screenX + 35, screenY + 12, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Video call controls
    ctx.fillStyle = accentColor + '80';
    ctx.fillRect(screenX + 10, screenY + 25, 6, 4);  // Mute button
    ctx.fillRect(screenX + 20, screenY + 25, 6, 4);  // Video button
    ctx.fillRect(screenX + 30, screenY + 25, 6, 4);  // End call button
    
    // WiFi/Connection signal
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    const wifiX = 140;
    const wifiY = canvas.height - 45;
    
    // WiFi arcs
    for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(wifiX, wifiY, i * 8, Math.PI, 2 * Math.PI);
        ctx.stroke();
    }
    
    // WiFi base point
    ctx.fillStyle = accentColor + '80';
    ctx.beginPath();
    ctx.arc(wifiX, wifiY, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Digital health data transmission
    ctx.strokeStyle = accentColor + '50';
    ctx.lineWidth = 1;
    
    const dataPoints = [];
    for (let i = 0; i < 20; i++) {
        dataPoints.push({
            x: 180 + (i * 5),
            y: canvas.height - 45 + Math.sin(i * 0.5) * 10,
            opacity: Math.random()
        });
    }
    
    dataPoints.forEach(point => {
        if (point.opacity > 0.5) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 1, 0, 2 * Math.PI);
            ctx.fillStyle = accentColor + Math.floor(point.opacity * 100).toString().padStart(2, '0');
            ctx.fill();
        }
    });
    
    // Remote monitoring devices
    ctx.fillStyle = accentColor + '70';
    ctx.font = '14px Inter';
    
    const devices = ['📱', '⌚', '🩺', '💻'];
    devices.forEach((device, index) => {
        const x = 300 + (index * 20);
        const y = canvas.height - 30;
        ctx.fillText(device, x, y);
    });
    
    // Telemedicine metrics
    ctx.fillStyle = accentColor + '80';
    ctx.font = '10px Inter';
    
    const metrics = [
        'Latency: 45ms',
        'Quality: HD',
        'Uptime: 99.9%'
    ];
    
    metrics.forEach((metric, index) => {
        ctx.fillText(metric, 380, canvas.height - 50 + (index * 10));
    });
    
    // Digital prescription pad
    ctx.strokeStyle = accentColor + '60';
    ctx.lineWidth = 1;
    
    const padX = 420;
    const padY = canvas.height - 50;
    
    // Prescription lines
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(padX, padY + (i * 5));
        ctx.lineTo(padX + 30, padY + (i * 5));
        ctx.stroke();
    }
    
    // Digital signature
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(padX + 5, padY + 22);
    ctx.quadraticCurveTo(padX + 15, padY + 18, padX + 25, padY + 22);
    ctx.stroke();
}

// Medical cross decoration function
function drawMedicalCross(ctx, canvas, theme) {
    const accentColor = theme.accentColor || '#059669';
    const centerX = canvas.width - 40;
    const centerY = canvas.height - 40;
    
    ctx.strokeStyle = accentColor + '70';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(centerX + 15, centerY);
    ctx.moveTo(centerX, centerY - 15);
    ctx.lineTo(centerX, centerY + 15);
    ctx.stroke();
}

function drawGradientAccents(ctx, canvas, theme) {
    // Gradient accent bars
    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, theme.accentColor + '00');
    gradient.addColorStop(1, theme.accentColor + '60');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 20, 200, 8);
    ctx.fillRect(canvas.width - 200, canvas.height - 30, 200, 8);
}

function renderStyledTitle(ctx, title, theme, slide) {
    const titleStyle = slide?.titleStyle || {};
    const fontSize = titleStyle.fontSize || parseInt(theme.titleFont.match(/\d+/)[0]);
    const fontWeight = titleStyle.fontWeight || (theme.titleFont.includes('bold') ? 'bold' : 'normal');
    const fontFamily = titleStyle.fontFamily || theme.titleFont.split(' ').slice(-1)[0];
    const color = titleStyle.color || slide?.textColor || theme.textColor;
    const position = titleStyle.position || theme.titlePosition;
    
    ctx.fillStyle = color;
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = titleStyle.align || 'left';
    ctx.textBaseline = 'top';
    
    // Add text shadow for better readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(title, position.x, position.y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

function renderStyledContent(ctx, content, theme, slide, canvas) {
    const contentStyle = slide?.contentStyle || {};
    const fontSize = contentStyle.fontSize || parseInt(theme.contentFont.match(/\d+/)[0]);
    const fontFamily = contentStyle.fontFamily || theme.contentFont.split(' ').slice(-1)[0];
    const color = contentStyle.color || slide?.textColor || theme.textColor;
    const position = contentStyle.position || theme.contentPosition;
    const lineHeight = contentStyle.lineHeight || 28;
    
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textAlign = contentStyle.align || 'left';
    ctx.textBaseline = 'top';
    
    const maxWidth = (canvas.width - position.x) * 0.9;
    const paragraphs = content.split('\n');
    let currentY = position.y;
    
    paragraphs.forEach((paragraph) => {
        if (paragraph.trim() === '') {
            currentY += lineHeight; // Empty line spacing
            return;
        }
        
        // Handle bullet points with custom styling
        let text = paragraph;
        let indent = 0;
        let bulletColor = slide?.accentColor || theme.accentColor;
        
        if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-') || paragraph.trim().startsWith('*')) {
            text = paragraph.trim().substring(1).trim();
            indent = 30;
            
            // Draw custom bullet
            ctx.fillStyle = bulletColor;
            ctx.beginPath();
            ctx.arc(position.x + 10, currentY + fontSize/2, 4, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = color; // Reset text color
        }
        
        // Word wrap with custom styling
        const words = text.split(' ');
        let line = '';
        
        words.forEach((word) => {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            
            if (testWidth > maxWidth - indent && line !== '') {
                ctx.fillText(line.trim(), position.x + indent, currentY);
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        });
        
        if (line.trim() !== '') {
            ctx.fillText(line.trim(), position.x + indent, currentY);
            currentY += lineHeight;
        }
        
        currentY += 5; // Paragraph spacing
    });
}

// Event Listeners
function setupEventListeners() {
    console.log('🔍 Setting up event listeners...');
    console.log('🔍 createSlidesBtn element:', elements.createSlidesBtn);
    console.log('🔍 addSlideBtn element:', elements.addSlideBtn);
    
    elements.createSlidesBtn.addEventListener('click', createSlidesWithAI);
    console.log('✅ Create slides event listener attached');
    
    elements.loadBtn.addEventListener('click', loadPresentation);
    
    // Add slide button with debugging
    if (elements.addSlideBtn) {
        elements.addSlideBtn.addEventListener('click', addNewSlide);
        console.log('✅ Add slide event listener attached');
    } else {
        console.error('❌ Add slide button element not found!');
    }
    
    // AI Improve button with debugging
    if (elements.aiImproveBtn) {
        elements.aiImproveBtn.addEventListener('click', improveWithAI);
        console.log('✅ AI Improve event listener attached');
        
        // Add test event to verify button works
        elements.aiImproveBtn.addEventListener('click', () => {
            console.log('🔥 AI Improve button DEFINITELY clicked!');
        });
    } else {
        console.error('❌ AI Improve button element not found!');
    }
    
    // AI Suggest button with debugging
    if (elements.aiSuggestBtn) {
        elements.aiSuggestBtn.addEventListener('click', getSuggestions);
        console.log('✅ AI Suggest event listener attached');
    } else {
        console.error('❌ AI Suggest button element not found!');
    }
    elements.sendBtn.addEventListener('click', sendChatMessage);
    elements.chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
    
    // Auto-save slide content on change and update preview
    elements.slideTitle.addEventListener('input', () => {
        saveCurrentSlide();
        renderSlideCanvas(); // Live preview update
    });
    elements.slideContent.addEventListener('input', () => {
        saveCurrentSlide();
        renderSlideCanvas(); // Live preview update
    });
    elements.slideNotes.addEventListener('input', saveCurrentSlide);
    
    // Theme selector
    elements.slideTheme.addEventListener('change', () => {
        applyThemeToCurrentSlide();
        saveCurrentSlide();
        renderSlideCanvas(); // Update preview with new theme
    });
    
    // Chat features
    elements.showSessionLogsBtn.addEventListener('click', showSessionLogs);
    elements.clearChatBtn.addEventListener('click', clearChat);
    
    // Tab navigation
    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.addEventListener('click', () => {
            const tabId = navItem.dataset.tab;
            switchTab(tabId);
        });
    });
    
    // Quick action buttons in chat
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-action-btn')) {
            const action = e.target.dataset.action;
            handleQuickAction(action);
        }
    });
    
    // Model selection
    elements.modelSelect.addEventListener('change', (e) => {
        selectedModel = e.target.value;
        console.log(`🔄 Model changed to: ${selectedModel}`);
        // No longer adding system message to chat
    });
    
    // Modal close handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-btn')) {
            const modal = e.target.dataset.modal;
            if (modal === 'questionnaire-modal') {
                closeQuestionnaire();
            } else if (modal) {
                document.getElementById(modal).style.display = 'none';
            } else {
                // Default preview modal
                elements.previewModal.style.display = 'none';
            }
        }
    });
    
    // Close modal on outside click
    elements.previewModal.addEventListener('click', (e) => {
        if (e.target === elements.previewModal) {
            elements.previewModal.style.display = 'none';
        }
    });
    
    // Close questionnaire modal on outside click
    const questionnaireModal = document.getElementById('questionnaire-modal');
    if (questionnaireModal) {
        questionnaireModal.addEventListener('click', (e) => {
            if (e.target === questionnaireModal) {
                closeQuestionnaire();
            }
        });
    }
}

// Ollama Integration
async function testConnection() {
    updateConnectionStatus('connecting');
    
    try {
        const result = await window.electronAPI.testOllamaConnection();
        if (result.success) {
            updateConnectionStatus('connected');
            addChatMessage('system', 'Conectado ao servidor Ollama com sucesso!');
        } else {
            updateConnectionStatus('disconnected');
            addChatMessage('system', `Falha na conexão: ${result.error}`);
        }
    } catch (error) {
        updateConnectionStatus('disconnected');
        addChatMessage('system', `Erro de conexão: ${error.message}`);
    }
}

async function loadAvailableModels() {
    console.log('🔍 Loading available models...');
    console.log('🔍 Proxy URL:', PROXY_BASE_URL);
    console.log('🔍 webAPI object:', webAPI);
    console.log('🔍 window.electronAPI object:', window.electronAPI);
    
    // Update UI to show loading state
    const modelSelect = elements.modelSelect;
    console.log('🔍 Model select element:', modelSelect);
    if (!modelSelect) {
        console.error('❌ Model select element not found!');
        return;
    }
    modelSelect.innerHTML = '<option value="">Carregando modelos...</option>';
    
    try {
        console.log('📡 Calling electronAPI.ollamaModels()...');
        
        // Check if electronAPI is available
        if (!window.electronAPI || !window.electronAPI.ollamaModels) {
            throw new Error('Electron API não está disponível');
        }
        
        const result = await window.electronAPI.ollamaModels();
        console.log('📥 Received result:', result);
        
        if (result.success && result.models && result.models.length > 0) {
            console.log('✅ Found models:', result.models.length);
            modelSelect.innerHTML = '<option value="">Selecione um modelo...</option>';
            
            result.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.name;
                option.textContent = `${model.name} (${formatFileSize(model.size)})`;
                modelSelect.appendChild(option);
                console.log('📝 Added model option:', model.name);
            });
            
            // Auto-select first model
            if (result.models.length > 0) {
                modelSelect.value = result.models[0].name;
                selectedModel = result.models[0].name;
                console.log('🎯 Auto-selected model:', selectedModel);
                
                // Update UI status
                updateConnectionStatus('connected');
                
                addChatMessage('system', `Carregados ${result.models.length} modelos. Selecionado: ${selectedModel}`);
            }
        } else {
            console.log('❌ No models found or request failed:', result);
            modelSelect.innerHTML = '<option value="">Nenhum modelo disponível</option>';
            
            // Update UI status
            updateConnectionStatus('disconnected');
            
            addChatMessage('system', result.error || 'Nenhum modelo encontrado no servidor Ollama');
        }
    } catch (error) {
        console.error('💥 Error loading models:', error);
        modelSelect.innerHTML = '<option value="">Erro ao carregar modelos</option>';
        
        // Update UI status
        updateConnectionStatus('disconnected');
        
        addChatMessage('system', `Erro ao carregar modelos: ${error.message}`);
    }
}

async function sendChatMessage() {
    const message = elements.chatInput.value.trim();
    if (!message) return;
    
    // Check if we're in topic input mode (legacy support)
    if (window.topicInputMode) {
        const topic = message;
        console.log('🔍 User entered topic via chat:', topic);
        
        // Clear topic input mode
        window.topicInputMode = false;
        elements.chatInput.placeholder = 'Ask me anything about your presentation...';
        
        // Remove waiting message
        if (window.waitingMessageId) {
            const waitingElement = document.getElementById(window.waitingMessageId);
            if (waitingElement) {
                waitingElement.remove();
            }
        }
        
        // Clear input and continue with slide creation
        elements.chatInput.value = '';
        
        // Call the slide creation function with the topic
        await continueSlideCreation(topic);
        return;
    }
    
    // Check for special commands
    if (message.toLowerCase().includes('apply suggestions') && window.pendingSuggestions) {
        applyPendingSuggestions();
        elements.chatInput.value = '';
        return;
    }
    
    if (!selectedModel) {
        addChatMessage('system', 'Please select a model first');
        return;
    }
    
    // Add user message to chat
    addChatMessage('user', message);
    elements.chatInput.value = '';
    
    // Show typing indicator
    const typingId = addChatMessage('ai', 'Thinking...', true);
    
    try {
        // Check if message is asking to edit slide directly
        let prompt = message;
        
        if (currentSlideIndex >= 0 && currentSlideIndex < slides.length) {
            const currentSlide = slides[currentSlideIndex];
            
            if (message.toLowerCase().includes('change') || message.toLowerCase().includes('edit') || 
                message.toLowerCase().includes('update') || message.toLowerCase().includes('rewrite')) {
                prompt = `${message}
                
                Current slide:
                Title: "${currentSlide.title}"
                Content: "${currentSlide.content}"
                
                If you're making changes to the slide, format your response as:
                TITLE: [new title if changed]
                CONTENT: [new content if changed]
                
                Otherwise, provide your normal response.`;
            } else {
                // Regular context for general questions
                const context = `Current slide - Title: "${currentSlide.title}", Content: "${currentSlide.content}", Notes: "${currentSlide.notes}"`;
                prompt = `${message}\n\nContext: ${context}`;
            }
        } else {
            // No slides available, just use the message as-is
            if (message.toLowerCase().includes('change') || message.toLowerCase().includes('edit') || 
                message.toLowerCase().includes('update') || message.toLowerCase().includes('rewrite')) {
                addChatMessage('system', 'No slides available to edit. Please create some slides first using the "Create Slides" button.');
                return;
            }
        }
        
        const result = await window.electronAPI.ollamaChat(prompt);
        
        // Remove typing indicator
        document.getElementById(typingId).remove();
        
        if (result.success) {
            // Check if AI provided slide updates
            const response = result.response;
            const titleMatch = response.match(/TITLE:\s*(.+?)(?=\n|$)/i);
            const contentMatch = response.match(/CONTENT:\s*([\s\S]+?)(?=\n\n|\nTITLE:|$)/i);
            
            let appliedChanges = false;
            
            if (currentSlideIndex >= 0 && currentSlideIndex < slides.length) {
                if (titleMatch && titleMatch[1].trim()) {
                    const newTitle = titleMatch[1].trim();
                    elements.slideTitle.value = newTitle;
                    slides[currentSlideIndex].title = newTitle;
                    appliedChanges = true;
                }
                
                if (contentMatch && contentMatch[1].trim()) {
                    const newContent = contentMatch[1].trim();
                    elements.slideContent.value = newContent;
                    slides[currentSlideIndex].content = newContent;
                    appliedChanges = true;
                }
                
                if (appliedChanges) {
                    renderSlides();
                    addChatMessage('ai', '✅ I\'ve updated your slide! Here\'s what I changed:\n\n' + result.response);
                } else {
                    addChatMessage('ai', result.response);
                }
            } else {
                // No current slide to update
                addChatMessage('ai', result.response);
            }
        } else {
            addChatMessage('system', `Error: ${result.error}`);
        }
    } catch (error) {
        document.getElementById(typingId).remove();
        addChatMessage('system', `Error: ${error.message}`);
    }
}

function applyPendingSuggestions() {
    const suggestions = window.pendingSuggestions;
    
    if (suggestions.title) {
        elements.slideTitle.value = suggestions.title;
        slides[currentSlideIndex].title = suggestions.title;
    }
    
    if (suggestions.content) {
        elements.slideContent.value = suggestions.content;
        slides[currentSlideIndex].content = suggestions.content;
    }
    
    renderSlides();
    addChatMessage('ai', '✅ Applied suggestions to your slide!');
    window.pendingSuggestions = null;
}

async function improveWithAI() {
    console.log('🔧 Improve with AI button clicked');
    console.log('🔍 Current selectedModel:', selectedModel);
    console.log('🔍 Current slide index:', currentSlideIndex);
    console.log('🔍 Total slides:', slides.length);
    console.log('🔍 Button element:', elements.aiImproveBtn);
    
    if (!selectedModel) {
        console.log('❌ No model selected');
        addChatMessage('system', '❌ **Por favor, selecione um modelo de IA primeiro**\n\nVá para a seção de configurações ou use o seletor de modelo na barra lateral para escolher um modelo Ollama.');
        return;
    }
    
    if (currentSlideIndex < 0 || currentSlideIndex >= slides.length) {
        addChatMessage('system', '❌ **Nenhum slide selecionado**\n\nPor favor, crie um novo slide ou selecione um slide existente da lista para melhorá-lo.');
        return;
    }
    
    const currentSlide = slides[currentSlideIndex];
    
    if (!currentSlide.title && !currentSlide.content) {
        addChatMessage('system', '❌ **Slide vazio**\n\nPor favor, adicione algum conteúdo ao slide antes de solicitar melhorias.');
        return;
    }
    
    // Create theme list for AI prompt
    const getThemesByCategory = (category) => {
        return Object.keys(slideThemes)
            .filter(key => slideThemes[key].category === category)
            .map(key => `${key}: ${slideThemes[key].name}`)
            .join('\n  ');
    };

    const businessThemes = getThemesByCategory('business');
    const startupThemes = getThemesByCategory('startup');
    const techThemes = getThemesByCategory('tech');
    const creativeThemes = getThemesByCategory('creative');
    const medicalThemes = getThemesByCategory('medical');

    const prompt = `Você é um especialista em design de apresentações e comunicação visual. Analise o conteúdo deste slide e melhore tanto o conteúdo quanto o design visual escolhendo um dos 100 temas pré-configurados disponíveis.

**Slide Atual:**
Título: "${currentSlide.title || 'Sem título'}"
Conteúdo: "${currentSlide.content || 'Sem conteúdo'}"

**Instruções para Melhoria:**
1. **Tema**: Escolha UM tema específico da lista abaixo que melhor combine com o conteúdo
2. **Design Visual**: PRIMEIRO, defina TODOS os parâmetros de estilo entre [ESTILO_INICIO] e [ESTILO_FIM]
3. **Conteúdo**: DEPOIS, forneça o conteúdo melhorado entre [CONTEUDO_INICIO] e [CONTEUDO_FIM]
4. **Coerência**: Garanta que o tema escolhido combine perfeitamente com o assunto

**TEMAS DISPONÍVEIS (100 opções):**

**🏢 BUSINESS (20 temas):**
  ${businessThemes}

**🚀 STARTUP (20 temas):**
  ${startupThemes}

**💻 TECH (20 temas):**
  ${techThemes}

**🎨 CREATIVE (20 temas):**
  ${creativeThemes}

**⚕️ MEDICAL (20 temas):**
  ${medicalThemes}

**Formate sua resposta EXATAMENTE nesta ordem:**

[ESTILO_INICIO]
TEMA: [nome_exato_do_tema_da_lista_acima]
COR_FUNDO: [será ignorada - tema define automaticamente]
COR_TEXTO: [será ignorada - tema define automaticamente]
COR_DESTAQUE: [será ignorada - tema define automaticamente]
TAMANHO_TITULO: [será ignorado - tema define automaticamente]
TAMANHO_TEXTO: [será ignorado - tema define automaticamente]
POSIÇÃO_TITULO: [será ignorada - tema define automaticamente]
DECORAÇÕES: [será ignorada - tema define automaticamente]
[ESTILO_FIM]

[CONTEUDO_INICIO]
TÍTULO: [título melhorado]
CONTEÚDO: [conteúdo melhorado com bullet points se apropriado]
[CONTEUDO_FIM]

**EXEMPLO:**
[ESTILO_INICIO]
TEMA: startup_unicorn
COR_FUNDO: auto
COR_TEXTO: auto
COR_DESTAQUE: auto
TAMANHO_TITULO: auto
TAMANHO_TEXTO: auto
POSIÇÃO_TITULO: auto
DECORAÇÕES: auto
[ESTILO_FIM]

[CONTEUDO_INICIO]
TÍTULO: Revolucionando o Mercado
CONTEÚDO: • Problema identificado: 80% dos usuários enfrentam dificuldades
• Nossa solução: Plataforma inovadora
• Resultados esperados: 50% de melhoria
[CONTEUDO_FIM]

**IMPORTANTE:** 
- Escolha APENAS um tema da lista fornecida acima
- Use o nome EXATO do tema (ex: business_premium, tech_ai, creative_vibrant)
- O tema selecionado definirá automaticamente cores, fontes, posições e decorações
- Foque no conteúdo e na escolha do tema mais apropriado

Responda em português brasileiro e seja estratégico na escolha do tema!`;
    
    addChatMessage('user', `✨ **Melhorar slide com design:** "${currentSlide.title || 'Slide ' + (currentSlideIndex + 1)}"`);
    const typingId = addChatMessage('ai', 'Analisando conteúdo e criando design personalizado...', true);
    
    // Update button state
    elements.aiImproveBtn.disabled = true;
    elements.aiImproveBtn.textContent = '⏳ Processando...';
    
    try {
        const result = await window.electronAPI.ollamaChat(prompt);
        document.getElementById(typingId).remove();
        
        if (result.success && result.response) {
            const response = result.response.trim();
            
            // Parse AI response for content and styling
            const improvements = parseAIImprovements(response);
            
            let appliedChanges = [];
            
            // Apply content improvements
            if (improvements.title && improvements.title !== currentSlide.title) {
                elements.slideTitle.value = improvements.title;
                slides[currentSlideIndex].title = improvements.title;
                appliedChanges.push(`📝 **Título:** "${improvements.title}"`);
            }
            
            if (improvements.content && improvements.content !== currentSlide.content) {
                elements.slideContent.value = improvements.content;
                slides[currentSlideIndex].content = improvements.content;
                appliedChanges.push(`� **Conteúdo:** Estrutura melhorada`);
            }
            
            // Apply visual styling
            if (improvements.styling) {
                slides[currentSlideIndex].style = improvements.styling.theme;
                slides[currentSlideIndex].backgroundColor = improvements.styling.backgroundColor;
                slides[currentSlideIndex].textColor = improvements.styling.textColor;
                slides[currentSlideIndex].accentColor = improvements.styling.accentColor;
                slides[currentSlideIndex].titleStyle = improvements.styling.titleStyle;
                slides[currentSlideIndex].contentStyle = improvements.styling.contentStyle;
                slides[currentSlideIndex].decorations = improvements.styling.decorations;
                
                // Update theme selector to match applied theme
                elements.slideTheme.value = improvements.styling.theme;
                
                console.log('✅ Applied styling:', improvements.styling);
                
                appliedChanges.push(`🎨 **Tema Visual:** ${improvements.styling.theme}`);
                appliedChanges.push(`🌈 **Cores Personalizadas:** Fundo, texto e destaques`);
                if (improvements.styling.decorations.length > 0) {
                    appliedChanges.push(`✨ **Decorações:** ${improvements.styling.decorations.join(', ')}`);
                }
            }
            
            if (appliedChanges.length > 0) {
                renderSlides();
                renderSlideCanvas(); // Update preview with new styling
                const summary = appliedChanges.join('\n');
                addChatMessage('ai', `✅ **Slide redesenhado com sucesso!**\n\n${summary}\n\n**Design Details:**\n${formatDesignSummary(improvements.styling)}`);
            } else {
                // Even if no structured improvements were found, don't show raw response
                // Instead, show a helpful message
                console.log('⚠️ No parseable improvements found in AI response');
                addChatMessage('ai', `🤖 **Analisando seu slide...**\n\nRecebi sua solicitação, mas não consegui identificar melhorias estruturadas no formato esperado.\n\n**Dicas para melhor resultado:**\n• Certifique-se de que há conteúdo suficiente no slide\n• Tente usar um modelo de IA mais avançado\n• Experimente reformular sua solicitação\n\n*Resposta original salva nos logs para análise.*`);
                
                // Save the raw response to logs for debugging
                console.log('Raw AI response for debugging:', response);
            }
        } else {
            addChatMessage('system', `❌ **Erro na comunicação com IA:**\n${result.error || 'Resposta inválida recebida'}`);
        }
    } catch (error) {
        document.getElementById(typingId).remove();
        console.error('Improve AI Error:', error);
        addChatMessage('system', `❌ **Erro inesperado:**\n${error.message}\n\nVerifique se o servidor Ollama está rodando e tente novamente.`);
    } finally {
        // Reset button state
        elements.aiImproveBtn.disabled = false;
        elements.aiImproveBtn.innerHTML = '✨ Melhorar com IA';
    }
}

function parseAIImprovements(response) {
    console.log('🔍 Raw AI response:', response);
    
    const improvements = {
        title: null,
        content: null,
        styling: null
    };
    
    // NEW FORMAT: Extract style block first
    const styleBlockMatch = response.match(/\[ESTILO_INICIO\]([\s\S]*?)\[ESTILO_FIM\]/i);
    const contentBlockMatch = response.match(/\[CONTEUDO_INICIO\]([\s\S]*?)\[CONTEUDO_FIM\]/i);
    
    // Parse styling block if found
    if (styleBlockMatch) {
        const styleContent = styleBlockMatch[1];
        console.log('🎨 Found style block:', styleContent);
        
        const themeMatch = styleContent.match(/TEMA:\s*([\w_]+)/i);
        console.log('🎯 Theme match:', themeMatch);
        
        let selectedTheme = null;
        let themeName = '';
        
        if (themeMatch) {
            themeName = themeMatch[1].toLowerCase();
            
            // Check if the theme exists in our slideThemes object
            if (slideThemes[themeName]) {
                selectedTheme = slideThemes[themeName];
                console.log('✅ Found matching theme:', themeName, selectedTheme);
            } else {
                // Fallback to legacy themes if exact match not found
                const legacyThemeName = themeName.split('_')[0]; // Get base category
                if (legacyThemes[legacyThemeName]) {
                    selectedTheme = legacyThemes[legacyThemeName];
                    themeName = legacyThemeName;
                    console.log('⚠️ Using legacy theme fallback:', legacyThemeName);
                } else {
                    // Ultimate fallback
                    selectedTheme = slideThemes.business_classic;
                    themeName = 'business_classic';
                    console.log('⚠️ Using default theme fallback');
                }
            }
        } else {
            // Default theme
            selectedTheme = slideThemes.business_classic;
            themeName = 'business_classic';
            console.log('⚠️ No theme specified, using default');
        }
        
        // Use the selected theme's properties
        improvements.styling = {
            theme: themeName,
            backgroundColor: selectedTheme.backgroundColor,
            textColor: selectedTheme.textColor,
            accentColor: selectedTheme.accentColor,
            titleStyle: {
                font: selectedTheme.titleFont,
                position: selectedTheme.titlePosition
            },
            contentStyle: {
                font: selectedTheme.contentFont,
                position: selectedTheme.contentPosition
            },
            decorations: selectedTheme.decorations || []
        };
        
        console.log('✅ Applied theme styling:', improvements.styling);
    }
    
    // Parse content block if found
    if (contentBlockMatch) {
        const contentContent = contentBlockMatch[1];
        console.log('📝 Found content block:', contentContent);
        
        const titleMatch = contentContent.match(/TÍTULO:\s*(.+?)(?=\n|$)/i);
        const contentMatch = contentContent.match(/CONTEÚDO:\s*([\s\S]+?)(?=\n\w+:|$)/i);
        
        if (titleMatch) {
            improvements.title = titleMatch[1].trim();
            console.log('✅ Extracted title from block:', improvements.title);
        }
        
        if (contentMatch) {
            improvements.content = contentMatch[1].trim();
            console.log('✅ Extracted content from block:', improvements.content);
        }
    }
    
    // FALLBACK: Try old format if new format not found
    if (!styleBlockMatch && !contentBlockMatch) {
        console.log('⚠️ New format not detected, trying old format...');
        
        // Extract content - old format for backwards compatibility
        const titleMatch = response.match(/(?:TÍTULO|TITLE):\s*(.+?)(?=\n|$)/i);
        const contentMatch = response.match(/(?:CONTEÚDO|CONTENT|CONTEUDO):\s*([\s\S]+?)(?=\n(?:TEMA|THEME|COR_FUNDO|ESTILO|$))/i);
        
        if (titleMatch) {
            improvements.title = titleMatch[1].trim();
            console.log('✅ Extracted title (old format):', improvements.title);
        }
        
        if (contentMatch) {
            let content = contentMatch[1].trim();
            // Clean content from any styling directives that might have leaked in
            content = content.replace(/\n?(?:TEMA|THEME|COR_FUNDO|COR_TEXTO|COR_DESTAQUE|TAMANHO_TITULO|TAMANHO_TEXTO|POSIÇÃO_TITULO|DECORAÇÕES|BACKGROUND|COLOR):.*/gi, '');
            content = content.trim();
            if (content) {
                improvements.content = content;
                console.log('✅ Extracted content (old format):', improvements.content);
            }
        }
        
        // Extract styling - old format
        const themeMatch = response.match(/(?:TEMA|THEME):\s*(\w+)/i);
        const backgroundMatch = response.match(/(?:COR_FUNDO|BACKGROUND):\s*([#\w:]+)/i);
        const textColorMatch = response.match(/(?:COR_TEXTO|TEXT_COLOR):\s*([#\w]+)/i);
        const accentMatch = response.match(/(?:COR_DESTAQUE|ACCENT_COLOR):\s*([#\w]+)/i);
        const titleSizeMatch = response.match(/(?:TAMANHO_TITULO|TITLE_SIZE):\s*(\d+)/i);
        const textSizeMatch = response.match(/(?:TAMANHO_TEXTO|TEXT_SIZE):\s*(\d+)/i);
        const titlePosMatch = response.match(/(?:POSIÇÃO_TITULO|TITLE_POSITION):\s*(\d+),\s*(\d+)/i);
        const decorationsMatch = response.match(/(?:DECORAÇÕES|DECORATIONS):\s*(.+?)(?=\n|$)/i);
        
        // If we found any styling directive, create styling object
        if (themeMatch || backgroundMatch || textColorMatch || accentMatch) {
            improvements.styling = {
                theme: themeMatch ? themeMatch[1].toLowerCase() : 'business',
                backgroundColor: backgroundMatch ? backgroundMatch[1] : '#ffffff',
                textColor: textColorMatch ? textColorMatch[1] : '#1f2937',
                accentColor: accentMatch ? accentMatch[1] : '#3b82f6',
                titleStyle: {
                    fontSize: titleSizeMatch ? parseInt(titleSizeMatch[1]) : 36,
                    position: titlePosMatch ? { x: parseInt(titlePosMatch[1]), y: parseInt(titlePosMatch[2]) } : { x: 50, y: 60 }
                },
                contentStyle: {
                    fontSize: textSizeMatch ? parseInt(textSizeMatch[1]) : 18
                },
                decorations: decorationsMatch ? decorationsMatch[1].split(',').map(d => d.trim()) : []
            };
            console.log('✅ Extracted styling (old format):', improvements.styling);
        }
    }
    
    // ULTRA FALLBACK: if no structured format detected, try to extract basic improvements
    if (!improvements.title && !improvements.content && !improvements.styling) {
        console.log('⚠️ No structured format detected, attempting fallback parsing...');
        
        // Try to extract any meaningful content that could be a title or content
        const lines = response.split('\n').filter(line => line.trim());
        
        // Look for quoted titles in the text
        const quotedTitleMatch = response.match(/[""]([^"""]+)[""]|"([^"]+)"/);
        if (quotedTitleMatch) {
            improvements.title = (quotedTitleMatch[1] || quotedTitleMatch[2]).trim();
            console.log('📝 Fallback quoted title:', improvements.title);
        } else {
            // First non-empty line might be a title (if it's short and doesn't contain colons)
            if (lines[0] && !lines[0].includes(':') && lines[0].length < 100) {
                improvements.title = lines[0].trim();
                console.log('📝 Fallback first line title:', improvements.title);
            }
        }
        
        // Remaining lines might be content
        if (lines.length > 1) {
            const contentLines = lines.slice(improvements.title ? 1 : 0).filter(line => 
                !line.includes('TEMA:') && 
                !line.includes('COR_') && 
                !line.includes('TAMANHO_') &&
                !line.includes('POSIÇÃO_') &&
                !line.includes('DECORAÇÕES:') &&
                line.trim().length > 0
            );
            if (contentLines.length > 0) {
                improvements.content = contentLines.join('\n').trim();
                console.log('📄 Fallback content:', improvements.content);
            }
        }
    }
    
    console.log('🎯 Final parsed improvements:', improvements);
    return improvements;
}

// Test function for debugging AI response parsing
function testAIResponseParsing() {
    console.log('🧪 Testing AI response parsing...');
    
    const testResponses = [
        // Format 1: NEW block format (recommended)
        `[ESTILO_INICIO]
TEMA: startup
COR_FUNDO: gradient:startup
COR_TEXTO: #ffffff
COR_DESTAQUE: #8b5cf6
TAMANHO_TITULO: 42
TAMANHO_TEXTO: 20
POSIÇÃO_TITULO: 50,60
DECORAÇÕES: círculos abstratos, gradiente roxo
[ESTILO_FIM]

[CONTEUDO_INICIO]
TÍTULO: Revolucionando o Mercado
CONTEÚDO: • Problema identificado: 80% dos usuários enfrentam dificuldades
• Nossa solução: Plataforma inovadora
• Resultados esperados: 50% de melhoria
[CONTEUDO_FIM]`,
        
        // Format 2: OLD inline format (backwards compatibility)
        `TÍTULO: Análise de Mercado
CONTEÚDO: Nosso produto resolve um problema real no mercado atual com uma abordagem inovadora.
TEMA: business
COR_FUNDO: #ffffff
COR_TEXTO: #1f2937`,
        
        // Format 3: Natural language (fallback)
        `Este slide pode ser melhorado com um título mais impactante: "Transformando a Indústria"
O conteúdo pode ser estruturado melhor:
- Identificação do problema
- Nossa solução única
- Benefícios para o cliente`
    ];
    
    testResponses.forEach((response, index) => {
        console.log(`\n--- Test ${index + 1} ---`);
        const result = parseAIImprovements(response);
        console.log('Result:', result);
    });
}

// Add to window for debugging
if (typeof window !== 'undefined') {
    window.testAIResponseParsing = testAIResponseParsing;
}

function formatDesignSummary(styling) {
    if (!styling) return 'Nenhum estilo aplicado';
    
    return `• **Tema:** ${styling.theme}
• **Cores:** Fundo ${styling.backgroundColor}, Texto ${styling.textColor}
• **Fontes:** Título ${styling.titleStyle.fontSize}px, Conteúdo ${styling.contentStyle.fontSize}px
• **Decorações:** ${styling.decorations.join(', ') || 'Nenhuma'}`;
}
async function createSlidesWithAI() {
    console.log('🎯 Create Slides button clicked!');
    
    if (!selectedModel) {
        console.log('❌ No model selected');
        addChatMessage('system', 'Please select a model first');
        return;
    }
    
    // Use the standalone questionnaire function
    startStartupQuestionnaire();
}

// Setup questionnaire event listeners
function setupQuestionnaireEventListeners() {
    const backBtn = document.getElementById('questionnaire-back');
    const nextBtn = document.getElementById('questionnaire-next');
    const input = document.getElementById('questionnaire-input');
    
    // Remove existing listeners
    if (backBtn) backBtn.replaceWith(backBtn.cloneNode(true));
    if (nextBtn) nextBtn.replaceWith(nextBtn.cloneNode(true));
    
    // Get fresh references
    const newBackBtn = document.getElementById('questionnaire-back');
    const newNextBtn = document.getElementById('questionnaire-next');
    const newInput = document.getElementById('questionnaire-input');
    
    if (newBackBtn) newBackBtn.addEventListener('click', goToPreviousQuestion);
    if (newNextBtn) newNextBtn.addEventListener('click', goToNextQuestion);
    
    // Enter key to go to next question
    if (newInput) {
        newInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                goToNextQuestion();
            }
        });
    }
}

// Show current questionnaire question
function showQuestionnaireQuestion() {
    const questionnaire = window.startupQuestionnaire;
    if (!questionnaire) return;
    
    const question = questionnaire.questions[questionnaire.currentQuestion];
    const questionElement = document.getElementById('questionnaire-question');
    const inputElement = document.getElementById('questionnaire-input');
    const backBtn = document.getElementById('questionnaire-back');
    const nextBtn = document.getElementById('questionnaire-next');
    const progressText = document.getElementById('questionnaire-progress-text');
    const progressFill = document.getElementById('progress-fill');
    
    // Update question content
    questionElement.innerHTML = `
        <h3>📊 ${question.title}</h3>
        <p>${question.question}</p>
    `;
    
    // Update input
    inputElement.placeholder = question.placeholder;
    inputElement.value = questionnaire.answers[question.key] || '';
    
    // Update progress
    const progress = ((questionnaire.currentQuestion + 1) / questionnaire.questions.length) * 100;
    progressText.textContent = `Pergunta ${questionnaire.currentQuestion + 1} de ${questionnaire.questions.length}`;
    progressFill.style.width = `${progress}%`;
    
    // Update buttons
    backBtn.disabled = questionnaire.currentQuestion === 0;
    nextBtn.textContent = questionnaire.currentQuestion === questionnaire.questions.length - 1 ? 'Gerar Slides →' : 'Próximo →';
    
    // Focus input
    inputElement.focus();
}

// Go to previous question
function goToPreviousQuestion() {
    const questionnaire = window.startupQuestionnaire;
    if (!questionnaire || questionnaire.currentQuestion <= 0) return;
    
    // Save current answer
    const currentQuestion = questionnaire.questions[questionnaire.currentQuestion];
    const input = document.getElementById('questionnaire-input');
    questionnaire.answers[currentQuestion.key] = input.value.trim();
    
    // Go to previous question
    questionnaire.currentQuestion--;
    showQuestionnaireQuestion();
}

// Go to next question or generate slides
function goToNextQuestion() {
    const questionnaire = window.startupQuestionnaire;
    if (!questionnaire) return;
    
    const currentQuestion = questionnaire.questions[questionnaire.currentQuestion];
    const input = document.getElementById('questionnaire-input');
    const answer = input.value.trim();
    
    // Save answer (can be empty - questions are optional)
    questionnaire.answers[currentQuestion.key] = answer || '[Não respondida]';
    
    // Check if this is the last question
    if (questionnaire.currentQuestion === questionnaire.questions.length - 1) {
        // Generate slides
        closeQuestionnaire();
        generateStartupSlides(questionnaire.answers);
        return;
    }
    
    // Go to next question
    questionnaire.currentQuestion++;
    showQuestionnaireQuestion();
}
// Close questionnaire
function closeQuestionnaire() {
    const questionnaireModal = document.getElementById('questionnaire-modal');
    questionnaireModal.style.display = 'none';
    
    // Clear questionnaire data
    window.startupQuestionnaire = null;
    
    addChatMessage('system', '📋 Questionário fechado. Você pode reiniciá-lo a qualquer momento usando o botão "🔄 Reiniciar Questionário".');
}

// Start startup questionnaire (can be called from anywhere)
function startStartupQuestionnaire() {
    console.log('🎯 Starting startup questionnaire automatically...');
    
    if (!selectedModel) {
        addChatMessage('system', '⚠️ Please select an AI model first from the dropdown above, then I\'ll start the questionnaire.');
        return;
    }
    
    // Show questionnaire modal
    const questionnaireModal = document.getElementById('questionnaire-modal');
    questionnaireModal.style.display = 'flex';
    
    // Initialize questionnaire state
    window.startupQuestionnaire = {
        currentQuestion: 0,
        answers: {},
        questions: [
            {
                key: 'problemValidation',
                title: 'Dados de Validação do Problema',
                question: 'Descreva seus dados de validação do problema (pesquisa de mercado, entrevistas com usuários, pontos de dor identificados):',
                placeholder: 'Exemplo: Entrevistei 200+ usuários potenciais, 85% relataram gastar 3+ horas diárias com este problema...'
            },
            {
                key: 'solutionData',
                title: 'Dados da Solução',
                question: 'Descreva os dados de sua solução (como sua solução resolve o problema):',
                placeholder: 'Exemplo: Nossa plataforma com IA reduz o tempo de tarefa em 70%, validado através de programa piloto de 3 meses...'
            },
            {
                key: 'mvp',
                title: 'Produto Mínimo Viável',
                question: 'Descreva seu MVP (funcionalidades, estado atual, feedback dos usuários):',
                placeholder: 'Exemplo: MVP baseado na web com funcionalidades principais implantadas, 50+ usuários beta ativos, pontuação de satisfação 4.2/5...'
            },
            {
                key: 'validatedSolution',
                title: 'Solução Validada',
                question: 'Descreva sua solução validada (métricas, tração, prova de conceito):',
                placeholder: 'Exemplo: 300% de crescimento de usuários em 6 meses, $15K MRR, 92% de taxa de retenção de usuários...'
            },
            {
                key: 'market',
                title: 'Mercado-Alvo',
                question: 'Descreva seu mercado-alvo (tamanho, segmentos, concorrência, oportunidade):',
                placeholder: 'Exemplo: Mercado endereçável de $2.5B, focando PMEs na área da saúde, crescimento anual de 15%...'
            },
            {
                key: 'timeMinutes',
                title: 'Duração da Apresentação',
                question: 'Quantos minutos sua apresentação deve durar? (Cada slide terá 25-45 segundos baseado na complexidade do conteúdo):',
                placeholder: 'Exemplo: 5 (criará número ótimo de slides baseado no tempo)'
            }
        ]
    };
    
    // Set up questionnaire event listeners
    setupQuestionnaireEventListeners();
    
    // Show first question
    showQuestionnaireQuestion();
    
    // Add message to chat
    addChatMessage('system', '🚀 **Questionário de Startup Iniciado**');
    addChatMessage('system', 'Por favor, complete o questionário no topo da tela para gerar seu pitch de startup.');
}

// Generate startup slides based on questionnaire answers
async function generateStartupSlides(answers) {
    console.log('🔍 Generating startup slides with answers:', answers);
    
    // Calculate timing constraints
    const totalMinutes = parseInt(answers.timeMinutes) || 5;
    const totalSeconds = totalMinutes * 60;
    const minSlideTime = 25; // seconds
    const maxSlideTime = 45; // seconds
    
    // Calculate max possible slides (if all slides were minimum duration)
    const maxPossibleSlides = Math.floor(totalSeconds / minSlideTime);
    
    // Check if we have space to create slides
    const remainingSlots = maxPossibleSlides - slides.length;
    if (remainingSlots <= 0) {
        addChatMessage('system', `⚠️ Time limit reached! With ${totalMinutes} minutes (${totalSeconds}s), you can have maximum ${maxPossibleSlides} slides at 25s each. You currently have ${slides.length} slides.`);
        return;
    }
    
    // Determine optimal number of slides to create
    const avgSlideTime = 35; // aim for middle of 25-45 range
    const optimalSlides = Math.floor(totalSeconds / avgSlideTime);
    const slidesToCreate = Math.min(optimalSlides - slides.length, remainingSlots, 8); // Cap at 8 new slides per creation
    
    console.log(`🎯 Timing: ${totalMinutes} min = ${totalSeconds}s, Max possible: ${maxPossibleSlides}, Creating ${slidesToCreate} slides`);
    
    const promptText = `Crie uma apresentação profissional de pitch de startup baseada nos seguintes dados validados. 
    Gere exatamente ${slidesToCreate} slides para uma apresentação de ${totalMinutes} minutos (${totalSeconds} segundos no total).
    
    REQUISITOS DE TEMPO:
    - Cada slide deve ter entre 25-45 segundos
    - Você pode variar a duração dos slides baseado na complexidade do conteúdo
    - Tempo total disponível: ${totalSeconds} segundos
    - Slides atuais: ${slides.length}
    - Slides para criar: ${slidesToCreate}
    
    DADOS DA STARTUP:
    - Validação do Problema: ${answers.problemValidation}
    - Dados da Solução: ${answers.solutionData}  
    - MVP: ${answers.mvp}
    - Solução Validada: ${answers.validatedSolution}
    - Mercado: ${answers.market}
    - Tempo da Apresentação: ${totalMinutes} minutos
    
    SELEÇÃO DE TEMA VISUAL:
    Escolha UM tema visual que melhor se adeque ao tipo de startup e use o MESMO tema para TODOS os slides.
    
    Temas disponíveis por categoria:
    
    🏢 BUSINESS: business_classic, business_modern, business_executive, business_corporate, business_minimal, business_professional, business_elegant, business_formal, business_dynamic, business_contemporary, business_premium, business_strategic, business_innovative, business_growth, business_leadership, business_success, business_global, business_finance, business_consulting, business_analytics
    
    🚀 STARTUP: startup_disruptive, startup_innovative, startup_unicorn, startup_growth, startup_venture, startup_tech, startup_bold, startup_modern, startup_dynamic, startup_agile, startup_future, startup_mvp, startup_pivot, startup_scale, startup_seed, startup_disrupt, startup_launch, startup_viral, startup_ecosystem, startup_revolution
    
    💻 TECH: tech_code, tech_cyber, tech_ai, tech_quantum, tech_blockchain, tech_cloud, tech_iot, tech_machine, tech_robotics, tech_vr, tech_data, tech_security, tech_5g, tech_edge, tech_devops, tech_microservices, tech_ar, tech_neural, tech_serverless, tech_web3
    
    🎨 CREATIVE: creative_artistic, creative_vibrant, creative_modern, creative_bold, creative_pastel, creative_dynamic, creative_minimalist, creative_retro, creative_organic, creative_experimental, creative_watercolor, creative_neon, creative_collage, creative_geometric, creative_grunge, creative_pop, creative_surreal, creative_digital, creative_abstract, creative_handdrawn
    
    Escolha o tema mais apropriado baseado no tipo de startup e inclua na primeira linha da sua resposta:
    SELECTED_THEME: [nome_do_tema_escolhido]
    
    Crie slides usando este formato EXATO:
    
    SLIDE_1_TITLE: [Título atraente para slide 1]
    SLIDE_1_CONTENT: [Conteúdo otimizado para apresentação - pode ser 25-45 segundos]
    SLIDE_1_NOTES: [Notas do apresentador com orientação específica de tempo (ex: "30 segundos - enfatizar métricas-chave")]
    
    SLIDE_2_TITLE: [Título atraente para slide 2] 
    SLIDE_2_CONTENT: [Conteúdo otimizado para apresentação - pode ser 25-45 segundos]
    SLIDE_2_NOTES: [Notas do apresentador com orientação específica de tempo]
    
    Continue este padrão para ${slidesToCreate} slides.
    
    DIRETRIZES DE ESTRUTURA DOS SLIDES:
    1. Problema e Oportunidade de Mercado (baseado na validação do problema e dados de mercado) - 35-40 segundos
    2. Visão Geral da Solução (baseado nos dados da solução) - 30-35 segundos
    3. MVP e Demo do Produto (baseado nas informações do MVP) - 40-45 segundos
    4. Tração e Validação (baseado na solução validada) - 35-40 segundos
    5. Tamanho do Mercado e Concorrência (baseado nos dados de mercado) - 25-30 segundos
    6. Modelo de Negócio e Receita (inferir dos dados de validação) - 30-35 segundos
    7. Equipe e Execução (slide geral da equipe startup) - 25-30 segundos
    8. Projeções Financeiras (baseado nos dados de tração) - 35-40 segundos
    9. Pedido de Investimento e Uso dos Fundos (pedido padrão de startup) - 40-45 segundos
    10. Próximos Passos e Cronograma (baseado no estágio atual) - 25-30 segundos
    
    REQUISITOS DE FORMATAÇÃO:
    - Primeira linha: SELECTED_THEME: [nome_do_tema]
    - Use EXATAMENTE: SLIDE_X_TITLE:, SLIDE_X_CONTENT:, SLIDE_X_NOTES:
    - Varie a duração dos slides (25-45 segundos) baseado na importância do conteúdo
    - Inclua recomendações específicas de tempo nas notas do apresentador
    - Inclua pontos de dados específicos e métricas das informações fornecidas
    - Tom profissional de pitch de startup em toda apresentação
    - Foque em tração, validação e oportunidade de mercado
    - Responda em português
    
    Comece com SELECTED_THEME: seguido dos slides no formato SLIDE_1_TITLE:.`;
    
    const typingId = addChatMessage('ai', `🚀 Criando ${slidesToCreate} slides de pitch de startup (${Math.floor(totalSeconds/slidesToCreate)}s cada)...`, true);
    
    console.log('🔍 Preparing to call Ollama API...');
    console.log('🔍 Prompt length:', promptText.length);
    
    // Disable the create slides button while processing
    elements.createSlidesBtn.disabled = true;
    elements.createSlidesBtn.textContent = '⏳ Creating...';
    
    try {
        console.log('📡 Calling window.electronAPI.ollamaChat...');
        const result = await window.electronAPI.ollamaChat(promptText);
        console.log('📥 Ollama API result:', result);
        
        document.getElementById(typingId).remove();
        
        if (result.success) {
            console.log('✅ API call successful, parsing response...');
            const response = result.response;
            console.log('🔍 Response length:', response.length);
            console.log('🔍 Response preview:', response.substring(0, 200) + '...');
            
            const createdSlides = parseAISlides(response);
            console.log('🔍 Parsed slides count:', createdSlides.length);
            console.log('🔍 Parsed slides:', createdSlides);
            
            if (createdSlides.length > 0) {
                // Get the selected theme from the first slide (all slides should have the same theme)
                const selectedTheme = createdSlides[0].theme || 'startup_modern';
                
                // Add the new slides to our slides array
                createdSlides.forEach(slide => {
                    slides.push({
                        id: Date.now() + Math.random(),
                        title: slide.title,
                        content: slide.content,
                        notes: slide.notes,
                        theme: selectedTheme // Apply the AI-selected theme
                    });
                });
                
                // Re-render slides list and load the first new slide
                renderSlides();
                if (createdSlides.length > 0) {
                    loadSlide(slides.length - createdSlides.length); // Load first created slide
                }
                
                // Calculate actual timing statistics
                const totalTime = totalMinutes * 60;
                const avgTimePerSlide = Math.floor(totalTime / slides.length);
                const maxPossibleSlides = Math.floor(totalTime / 25); // at minimum 25s per slide
                
                addChatMessage('ai', `🎉 Criados com sucesso ${createdSlides.length} slides de pitch de startup!\n\n📊 Detalhes da Apresentação:\n• Tempo total: ${totalMinutes} minutos (${totalTime}s)\n• Total de slides: ${slides.length}\n• Tempo médio por slide: ${avgTimePerSlide} segundos\n• Faixa de tempo por slide: 25-45 segundos\n• Máximo de slides possível: ${maxPossibleSlides}\n• 🎨 Tema selecionado: ${selectedTheme}\n\n🚀 Seu pitch de startup está pronto! Todos os slides usam o mesmo tema visual para consistência.`);
                
                if (slides.length >= maxPossibleSlides) {
                    addChatMessage('ai', `⚠️ Você atingiu o limite de tempo! Com ${totalMinutes} minutos, você pode ter no máximo ${maxPossibleSlides} slides de 25 segundos cada.`);
                }
            } else {
                addChatMessage('ai', 'I created content but had trouble parsing it into slides. Here\'s what I generated:\n\n' + result.response);
            }
        } else {
            console.log('❌ API call failed:', result.error);
            addChatMessage('system', `Error creating slides: ${result.error}`);
        }
    } catch (error) {
        console.error('💥 Exception in generateStartupSlides:', error);
        document.getElementById(typingId).remove();
        addChatMessage('system', `Error: ${error.message}`);
    } finally {
        console.log('🔄 Cleaning up - re-enabling button...');
        // Re-enable the button
        elements.createSlidesBtn.disabled = false;
        elements.createSlidesBtn.innerHTML = '🎯 Create Startup Pitch';
        
        // Update button state based on slide count
        updateCreateSlidesButton();
        console.log('✅ Cleanup complete');
        
        // Clear questionnaire data
        window.startupQuestionnaire = null;
    }
}

// Continue slide creation with the provided topic
async function continueSlideCreation(topic) {
    console.log('🔍 Continuing slide creation with topic:', topic);
    
    if (!topic || topic.trim() === '') {
        console.log('❌ No topic provided');
        addChatMessage('system', 'Please provide a topic for your presentation');
        return;
    }
    
    const remainingSlides = 5 - slides.length;
    const slidesToCreate = Math.min(remainingSlides, 5);
    
    const promptText = `Create a professional presentation about "${topic}". 
    Generate exactly ${slidesToCreate} slides with the following EXACT structure format:
    
    SLIDE_1_TITLE: [Title for slide 1]
    SLIDE_1_CONTENT: [Detailed content for slide 1 with bullet points or paragraphs]
    SLIDE_1_NOTES: [Speaker notes for slide 1]
    
    SLIDE_2_TITLE: [Title for slide 2]
    SLIDE_2_CONTENT: [Detailed content for slide 2 with bullet points or paragraphs]
    SLIDE_2_NOTES: [Speaker notes for slide 2]
    
    Continue this pattern for ${slidesToCreate} slides.
    
    IMPORTANT FORMATTING RULES:
    - Use EXACTLY the format above: SLIDE_X_TITLE:, SLIDE_X_CONTENT:, SLIDE_X_NOTES:
    - Replace X with the slide number (1, 2, 3, etc.)
    - Each slide should have all three sections
    - Don't add extra text or explanations outside this format
    - Don't use markdown formatting or bullet symbols in the labels
    
    Make sure each slide has:
    - A clear, compelling title (keep under 80 characters)
    - Well-structured content with bullet points or paragraphs
    - Practical speaker notes
    - Professional tone suitable for business presentations
    
    Topics should flow logically and cover the subject comprehensively.
    
    Start your response immediately with SLIDE_1_TITLE: and follow the exact format.`;
    
    addChatMessage('user', `Create ${slidesToCreate} slides about: ${topic}`);
    const typingId = addChatMessage('ai', `🎯 Creating ${slidesToCreate} professional slides about "${topic}"...`, true);
    
    console.log('🔍 Preparing to call Ollama API...');
    console.log('🔍 Prompt length:', promptText.length);
    
    // Disable the create slides button while processing
    elements.createSlidesBtn.disabled = true;
    elements.createSlidesBtn.textContent = '⏳ Creating...';
    
    try {
        console.log('📡 Calling window.electronAPI.ollamaChat...');
        const result = await window.electronAPI.ollamaChat(promptText);
        console.log('📥 Ollama API result:', result);
        
        document.getElementById(typingId).remove();
        
        if (result.success) {
            console.log('✅ API call successful, parsing response...');
            const response = result.response;
            console.log('🔍 Response length:', response.length);
            console.log('🔍 Response preview:', response.substring(0, 200) + '...');
            
            const createdSlides = parseAISlides(response);
            console.log('🔍 Parsed slides count:', createdSlides.length);
            console.log('🔍 Parsed slides:', createdSlides);
            
            if (createdSlides.length > 0) {
                // Add the new slides to our slides array
                createdSlides.forEach(slide => {
                    slides.push({
                        id: Date.now() + Math.random(),
                        title: slide.title,
                        content: slide.content,
                        notes: slide.notes
                    });
                });
                
                // Re-render slides list and load the first new slide
                renderSlides();
                if (createdSlides.length > 0) {
                    loadSlide(slides.length - createdSlides.length); // Load first created slide
                }
                
                addChatMessage('ai', `✅ Successfully created ${createdSlides.length} slides about "${topic}"!\n\n📊 Total slides: ${slides.length}\n\nYou can now edit each slide individually or ask me to improve them.`);
                
                // Remove the fixed 5-slide limit message since we're using dynamic limits
            } else {
                addChatMessage('ai', 'I created content but had trouble parsing it into slides. Here\'s what I generated:\n\n' + result.response);
            }
        } else {
            console.log('❌ API call failed:', result.error);
            addChatMessage('system', `Error creating slides: ${result.error}`);
        }
    } catch (error) {
        console.error('💥 Exception in continueSlideCreation:', error);
        document.getElementById(typingId).remove();
        addChatMessage('system', `Error: ${error.message}`);
    } finally {
        console.log('🔄 Cleaning up - re-enabling button...');
        // Re-enable the button
        elements.createSlidesBtn.disabled = false;
        elements.createSlidesBtn.innerHTML = '🎯 Create Slides';
        
        // Update button state based on slide count
        updateCreateSlidesButton();
        console.log('✅ Cleanup complete');
    }
}

// Parse AI response into slide objects
function parseAISlides(response) {
    console.log('🔍 Starting to parse AI response for slides...');
    console.log('🔍 Response length:', response.length);
    console.log('🔍 Full response:', response);
    
    const slides = [];
    let selectedTheme = null;
    
    // Extract selected theme first
    const themeMatch = response.match(/SELECTED_THEME:\s*([a-zA-Z_]+)/i);
    if (themeMatch) {
        selectedTheme = themeMatch[1].trim();
        console.log('🎨 Found selected theme:', selectedTheme);
    }
    
    // Primary parsing method - structured format
    const slidePattern = /SLIDE_(\d+)_TITLE:\s*(.+?)\s*SLIDE_\1_CONTENT:\s*([\s\S]+?)\s*SLIDE_\1_NOTES:\s*([\s\S]+?)(?=SLIDE_\d+_TITLE:|$)/gi;
    
    let match;
    while ((match = slidePattern.exec(response)) !== null) {
        const title = match[2].trim();
        const content = match[3].trim();
        const notes = match[4].trim();
        
        console.log('✅ Found structured slide:', { title, content: content.substring(0, 50) + '...', notes: notes.substring(0, 30) + '...' });
        
        if (title && content) {
            slides.push({
                title: title,
                content: content,
                notes: notes || 'No speaker notes provided.',
                theme: selectedTheme || 'startup_modern' // Default theme if not selected
            });
        }
    }
    
    // If structured format worked, return the results
    if (slides.length > 0) {
        console.log('✅ Structured parsing successful, found', slides.length, 'slides with theme:', selectedTheme);
        return slides;
    }
    
    console.log('⚠️ Structured parsing failed, trying alternative methods...');
    
    // Alternative parsing method 1 - Simple numbered slides
    const simplePattern = /(?:slide\s*\d+|^\d+\.|\*\*slide\s*\d+)/gim;
    const sections = response.split(simplePattern).filter(section => section.trim().length > 0);
    
    console.log('🔍 Split into sections:', sections.length);
    
    sections.forEach((section, index) => {
        if (index === 0 && !section.toLowerCase().includes('title')) {
            return; // Skip introduction text
        }
        
        const lines = section.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        let title = '';
        let content = '';
        let notes = '';
        let currentSection = 'title';
        
        for (let line of lines) {
            // Check for section headers
            if (line.toLowerCase().includes('title:') || line.toLowerCase().startsWith('title')) {
                currentSection = 'title';
                title = line.replace(/^title:?\s*/i, '').trim();
                continue;
            } else if (line.toLowerCase().includes('content:') || line.toLowerCase().includes('body:')) {
                currentSection = 'content';
                content = line.replace(/^(content|body):?\s*/i, '').trim();
                continue;
            } else if (line.toLowerCase().includes('notes:') || line.toLowerCase().includes('speaker')) {
                currentSection = 'notes';
                notes = line.replace(/^(notes|speaker\s*notes):?\s*/i, '').trim();
                continue;
            }
            
            // Assign content based on current section
            if (currentSection === 'title' && !title) {
                title = line;
            } else if (currentSection === 'content' || (!title && line.length > 10)) {
                if (!title && line.length < 100) {
                    title = line;
                } else {
                    content += (content ? '\n' : '') + line;
                }
            } else if (currentSection === 'notes') {
                notes += (notes ? '\n' : '') + line;
            }
        }
        
        // If we have at least a title, create a slide
        if (title && title.length > 0) {
            console.log('✅ Parsed alternative slide:', { title, content: content.substring(0, 50) + '...', notes: notes.substring(0, 30) + '...' });
            slides.push({
                title: title,
                content: content || 'Content not clearly specified.',
                notes: notes || 'No speaker notes provided.',
                theme: selectedTheme || 'startup_modern' // Use selected theme or default
            });
        }
    });
    
    // If we still don't have slides, try a more aggressive approach
    if (slides.length === 0) {
        console.log('⚠️ Alternative parsing failed, trying aggressive method...');
        
        // Split by common slide indicators
        const aggressiveSplits = response.split(/(?:\n\s*\n|\n(?=\d+\.|\*\*|\#\#|slide|title))/i);
        
        for (let section of aggressiveSplits) {
            section = section.trim();
            if (section.length < 10) continue;
            
            const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length === 0) continue;
            
            // First substantial line is probably the title
            let title = lines[0].replace(/^\d+\.\s*|\*\*|\#\#/g, '').trim();
            let content = lines.slice(1).join('\n').trim();
            
            if (title.length > 0) {
                console.log('✅ Aggressively parsed slide:', { title, content: content.substring(0, 50) + '...' });
                slides.push({
                    title: title,
                    content: content || 'Content extracted from AI response.',
                    notes: 'Generated automatically from AI response.',
                    theme: selectedTheme || 'startup_modern' // Use selected theme or default
                });
            }
        }
    }
    
    // Final fallback - create slides from the entire response
    if (slides.length === 0) {
        console.log('⚠️ All parsing methods failed, creating fallback slides...');
        
        // Split response into chunks and create slides
        const chunks = response.match(/.{1,500}/g) || [response];
        chunks.forEach((chunk, index) => {
            if (chunk.trim().length > 20) {
                const lines = chunk.split('\n').filter(l => l.trim().length > 0);
                const title = lines[0] ? lines[0].substring(0, 80).trim() : `Generated Slide ${index + 1}`;
                const content = lines.slice(1).join('\n').trim() || chunk.trim();
                
                slides.push({
                    title: title,
                    content: content,
                    notes: 'Generated from AI response - please review and edit as needed.',
                    theme: selectedTheme || 'startup_modern' // Use selected theme or default
                });
            }
        });
    }
    
    console.log('🔍 Final parsing result:', slides.length, 'slides created');
    slides.forEach((slide, index) => {
        console.log(`Slide ${index + 1}:`, { 
            title: slide.title.substring(0, 50), 
            contentLength: slide.content.length,
            notesLength: slide.notes.length 
        });
    });
    
    return slides;
}

// Update the create slides button based on current slide count and time limit
function updateCreateSlidesButton() {
    console.log('🔄 Updating create slides button. Current slides:', slides.length);
    console.log('🔍 createSlidesBtn element in update:', elements.createSlidesBtn);
    
    // We'll determine max slides dynamically when user provides time input
    // For now, just show the current state
    elements.createSlidesBtn.disabled = false;
    elements.createSlidesBtn.innerHTML = '🔄 Reiniciar Questionário';
    elements.createSlidesBtn.title = `Reiniciar o questionário de pitch de startup (${slides.length} slides criados)`;
    console.log('✅ Button updated - slides:', slides.length);
}

async function getSuggestions() {
    if (!selectedModel) {
        addChatMessage('system', 'Please select a model first');
        return;
    }
    
    if (currentSlideIndex < 0 || currentSlideIndex >= slides.length) {
        addChatMessage('system', 'No slide selected. Please create or select a slide first.');
        return;
    }
    
    const currentSlide = slides[currentSlideIndex];
    const prompt = `Please provide 3-5 specific suggestions to improve this slide:
    
    Title: ${currentSlide.title}
    Content: ${currentSlide.content}
    Notes: ${currentSlide.notes}
    
    Focus on clarity, engagement, and visual appeal. Provide actionable recommendations. 
    If you have specific text improvements, format them as:
    SUGGESTED_TITLE: [new title]
    SUGGESTED_CONTENT: [new content]
    
    Otherwise, provide general improvement suggestions.`;
    
    addChatMessage('user', 'Get suggestions for current slide');
    const typingId = addChatMessage('ai', 'Analyzing your slide for suggestions...', true);
    
    try {
        const result = await window.electronAPI.ollamaChat(prompt);
        document.getElementById(typingId).remove();
        
        if (result.success) {
            addChatMessage('ai', result.response);
        } else {
            addChatMessage('system', `Error: ${result.error}`);
        }
    } catch (error) {
        document.getElementById(typingId).remove();
        addChatMessage('system', `Error: ${error.message}`);
    }
}

// Slide Management
function renderSlides() {
    elements.slidesList.innerHTML = '';
    
    slides.forEach((slide, index) => {
        const slideElement = document.createElement('div');
        slideElement.className = `slide-item ${index === currentSlideIndex ? 'active' : ''}`;
        slideElement.innerHTML = `
            <h4>${slide.title || 'Untitled Slide'}</h4>
            <p>${slide.content ? slide.content.substring(0, 80) + '...' : 'No content'}</p>
            <div class="slide-controls">
                <button class="btn btn-secondary" onclick="previewSlide(${index})" title="Preview slide">
                    👁️
                </button>
                <button class="btn btn-secondary" onclick="duplicateSlide(${index})" title="Duplicate slide">
                    📋
                </button>
                <button class="btn btn-secondary" onclick="deleteSlide(${index})" title="Delete slide">
                    🗑️
                </button>
            </div>
        `;
        
        slideElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn')) {
                loadSlide(index);
            }
        });
        
        elements.slidesList.appendChild(slideElement);
        
        // Add separator between slides (but not after the last one)
        if (index < slides.length - 1) {
            const separator = document.createElement('div');
            separator.className = 'slide-separator';
            elements.slidesList.appendChild(separator);
        }
    });
    
    // Update create slides button when slides change
    updateCreateSlidesButton();
}

function loadSlide(index) {
    if (slides.length === 0) {
        // No slides available
        currentSlideIndex = -1;
        elements.slideTitle.value = '';
        elements.slideContent.value = '';
        elements.slideNotes.value = '';
        elements.slideTheme.value = 'business';
        renderSlides();
        renderSlideCanvas(); // Update preview
        return;
    }
    
    if (index >= 0 && index < slides.length) {
        currentSlideIndex = index;
        const slide = slides[index];
        
        elements.slideTitle.value = slide.title;
        elements.slideContent.value = slide.content;
        elements.slideNotes.value = slide.notes;
        elements.slideTheme.value = slide.theme || slide.style || 'startup_modern';
        
        renderSlides();
        renderSlideCanvas(); // Update preview
    }
}

function saveCurrentSlide() {
    if (currentSlideIndex >= 0 && currentSlideIndex < slides.length) {
        slides[currentSlideIndex] = {
            ...slides[currentSlideIndex],
            title: elements.slideTitle.value,
            content: elements.slideContent.value,
            notes: elements.slideNotes.value,
            theme: elements.slideTheme.value
        };
        renderSlides();
    }
    // If no slides exist (currentSlideIndex === -1), do nothing
}

function addNewSlide() {
    const defaultTheme = slideThemes.business_classic; // Use business_classic as default
    
    const newSlide = {
        id: Date.now(),
        title: 'Novo Slide',
        content: 'Digite seu conteúdo aqui...',
        notes: 'Adicionar notas do apresentador...',
        theme: 'startup_modern', // Default theme
        backgroundColor: defaultTheme.backgroundColor,
        textColor: defaultTheme.textColor,
        accentColor: defaultTheme.accentColor,
        titleStyle: {
            fontSize: 36,
            position: { x: 50, y: 60 }
        },
        contentStyle: {
            fontSize: 18,
            position: { x: 50, y: 140 }
        },
        decorations: ['corporate', 'clean']
    };
    
    slides.push(newSlide);
    currentSlideIndex = slides.length - 1;
    renderSlides();
    loadSlide(currentSlideIndex);
    elements.slideTitle.focus();
}

function deleteSlide(index) {
    if (slides.length <= 0) {
        addChatMessage('system', 'No slides to delete');
        return;
    }
    
    if (confirm('Tem certeza de que deseja excluir este slide?')) {
        slides.splice(index, 1);
        
        if (slides.length === 0) {
            // No slides left
            currentSlideIndex = -1;
            elements.slideTitle.value = '';
            elements.slideContent.value = '';
            elements.slideNotes.value = '';
        } else {
            // Adjust current slide index
            if (currentSlideIndex >= slides.length) {
                currentSlideIndex = slides.length - 1;
            } else if (currentSlideIndex > index) {
                currentSlideIndex--;
            }
            loadSlide(currentSlideIndex);
        }
        
        renderSlides();
    }
}

function duplicateSlide(index) {
    const slideToClone = slides[index];
    const newSlide = {
        ...slideToClone,
        id: Date.now(),
        title: slideToClone.title + ' (Cópia)'
    };
    
    slides.splice(index + 1, 0, newSlide);
    currentSlideIndex = index + 1;
    renderSlides();
    loadSlide(currentSlideIndex);
}

function previewSlide(index) {
    const slide = slides[index];
    const previewContent = document.getElementById('preview-content');
    
    previewContent.innerHTML = `
        <h1>${slide.title}</h1>
        <div class="content">${slide.content.replace(/\n/g, '<br>')}</div>
        ${slide.notes ? `<div class="notes"><strong>💬 Speaker Notes:</strong><br>${slide.notes.replace(/\n/g, '<br>')}</div>` : ''}
    `;
    
    elements.previewModal.style.display = 'block';
}

// File Operations
async function loadPresentation() {
    try {
        const result = await window.electronAPI.loadFile();
        
        if (result.success) {
            // Handle JSON files (backward compatibility)
            if (result.content) {
                const data = JSON.parse(result.content);
                
                if (data.slides && Array.isArray(data.slides)) {
                    slides = data.slides;
                    currentSlideIndex = 0;
                    renderSlides();
                    loadSlide(0);
                    addChatMessage('system', `📁 Presentation loaded from: ${result.filePath}`);
                } else {
                    addChatMessage('system', 'Invalid presentation file format');
                }
            } else {
                // This would be for PPTX files when we implement loading
                addChatMessage('system', 'PPTX file detected but loading is not yet implemented');
            }
        } else {
            addChatMessage('system', `Load failed: ${result.error}`);
        }
    } catch (error) {
        addChatMessage('system', `Load error: ${error.message}`);
    }
}

// UI Helpers
function addChatMessage(type, content, isTemporary = false) {
    console.log('💬 Adding chat message:', type, content.substring(0, 50) + '...');
    
    // Skip displaying system messages in the chat UI
    if (type === 'system') {
        console.log('🔇 System message suppressed from UI:', content);
        return 'system-' + Date.now(); // Return a dummy ID for compatibility
    }
    
    // Log to session if it's a user message or AI response
    if (type === 'user' || type === 'ai') {
        sessionLogs.push({
            timestamp: new Date().toISOString(),
            type: type,
            content: content,
            slideIndex: currentSlideIndex,
            slideTitle: currentSlideIndex >= 0 && slides[currentSlideIndex] ? slides[currentSlideIndex].title : 'No slide'
        });
    }
    
    const messageDiv = document.createElement('div');
    const messageId = 'msg-' + Date.now();
    messageDiv.id = messageId;
    messageDiv.className = `chat-message ${type}-message`;
    
    // Add timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isTemporary) {
        contentDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div> ' + content;
    } else {
        // Handle markdown-like formatting
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>') // Code
            .replace(/\n/g, '<br>'); // Line breaks
            
        contentDiv.innerHTML = formattedContent;
    }
    
    messageDiv.appendChild(timestamp);
    messageDiv.appendChild(contentDiv);
    
    // Add message type indicator
    const typeIndicator = document.createElement('div');
    typeIndicator.className = 'message-type';
    switch(type) {
        case 'user':
            typeIndicator.innerHTML = '👤 Você';
            break;
        case 'ai':
            typeIndicator.innerHTML = '🤖 IA';
            break;
        default:
            typeIndicator.innerHTML = '💬 Chat';
    }
    messageDiv.insertBefore(typeIndicator, timestamp);
    
    if (elements.chatMessages) {
        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        console.log('✅ Message added to chat');
    } else {
        console.error('❌ chatMessages element not found!');
    }
    
    return messageId;
}

function applyThemeToCurrentSlide() {
    if (currentSlideIndex < 0 || currentSlideIndex >= slides.length) return;
    
    const selectedTheme = elements.slideTheme.value;
    const theme = slideThemes[selectedTheme];
    
    if (!theme) return;
    
    // Apply theme to current slide
    slides[currentSlideIndex].style = selectedTheme;
    slides[currentSlideIndex].backgroundColor = theme.backgroundColor;
    slides[currentSlideIndex].textColor = theme.textColor;
    slides[currentSlideIndex].accentColor = theme.accentColor;
    slides[currentSlideIndex].titleStyle = {
        fontSize: parseInt(theme.titleFont.match(/\d+/)[0]),
        position: theme.titlePosition
    };
    slides[currentSlideIndex].contentStyle = {
        fontSize: parseInt(theme.contentFont.match(/\d+/)[0]),
        position: theme.contentPosition
    };
    slides[currentSlideIndex].decorations = [...theme.decorations];
    
    console.log(`🎨 Applied ${selectedTheme} theme to slide ${currentSlideIndex + 1}`);
    
    // Update preview
    renderSlideCanvas();
}

// Chat enhancement functions
function switchTab(tabId) {
    // Remove active class from all nav items and tab contents
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected nav item and tab content
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}-content`).classList.add('active');
    
    // Just log to console instead of chat (no system message)
    console.log(`🔄 Tab switched to: ${getTabName(tabId)}`);
}

function getTabName(tabId) {
    const names = {
        'slides': 'Editor de Slides',
        'chat': 'Chat com IA'
    };
    return names[tabId] || tabId;
}

function handleQuickAction(action) {
    switch (action) {
        case 'improve':
            improveWithAI();
            break;
        case 'suggestions':
            getSuggestions();
            break;
        case 'create':
            createSlidesWithAI();
            break;
    }
}

function showSessionLogs() {
    const modal = elements.sessionLogsModal;
    const logsContent = document.getElementById('session-logs-content');
    const totalInteractions = document.getElementById('total-interactions');
    const sessionStart = document.getElementById('session-start');
    const lastModel = document.getElementById('last-model');
    
    // Update stats
    totalInteractions.textContent = sessionLogs.length;
    sessionStart.textContent = sessionLogs.length > 0 ? 
        new Date(sessionLogs[0].timestamp).toLocaleString() : '-';
    lastModel.textContent = selectedModel || '-';
    
    // Generate logs HTML
    if (sessionLogs.length === 0) {
        logsContent.innerHTML = `
            <div class="empty-logs">
                <div class="empty-icon">📝</div>
                <h4>Nenhuma interação registrada</h4>
                <p>Comece uma conversa com a IA para ver os logs aparecerem aqui.</p>
            </div>
        `;
    } else {
        const logsHTML = sessionLogs.map((log, index) => `
            <div class="log-entry ${log.type}">
                <div class="log-header">
                    <span class="log-type">${log.type === 'user' ? '👤 Usuário' : '🤖 IA'}</span>
                    <span class="log-timestamp">${new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span class="log-context">Slide: ${log.slideTitle}</span>
                </div>
                <div class="log-content">${log.content.substring(0, 200)}${log.content.length > 200 ? '...' : ''}</div>
            </div>
        `).join('');
        
        logsContent.innerHTML = logsHTML;
    }
    
    modal.style.display = 'flex';
}

function clearChat() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de chat? Esta ação não pode ser desfeita.')) {
        elements.chatMessages.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">🤖</div>
                <h3>Chat limpo!</h3>
                <p>Histórico removido. Como posso ajudar você agora?</p>
                <div class="quick-actions-chat">
                    <button class="quick-action-btn" data-action="improve">✨ Melhorar slide atual</button>
                    <button class="quick-action-btn" data-action="suggestions">💡 Dar sugestões</button>
                    <button class="quick-action-btn" data-action="create">🎯 Criar novos slides</button>
                </div>
            </div>
        `;
        sessionLogs = [];
        console.log('🗑️ Chat cleared - History removed');
        // No longer adding system message to chat
    }
}

function updateConnectionStatus(status) {
    const statusBadge = document.querySelector('#connection-status');
    const statusText = statusBadge ? statusBadge.querySelector('span') : null;
    
    if (!statusBadge || !statusText) {
        console.warn('Connection status elements not found');
        return;
    }
    
    switch (status) {
        case 'connected':
        case true:
            statusBadge.className = 'status-badge connected';
            statusText.textContent = 'Online';
            break;
        case 'connecting':
            statusBadge.className = 'status-badge connecting';
            statusText.textContent = 'Connecting...';
            break;
        default:
            statusBadge.className = 'status-badge stopped';
            statusText.textContent = 'Offline';
    }
}

function formatFileSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, starting initialization...');
    console.log('🔍 Checking if window.electronAPI exists:', !!window.electronAPI);
    console.log('🔍 Available electronAPI methods:', window.electronAPI ? Object.keys(window.electronAPI) : 'None');
    
    // Quick test - check if the button exists
    const testBtn = document.getElementById('create-slides-btn');
    console.log('🔍 Create slides button found:', !!testBtn);
    if (testBtn) {
        console.log('🔍 Button text:', testBtn.textContent);
        console.log('🔍 Button disabled:', testBtn.disabled);
    }
    
    try {
        init();
    } catch (error) {
        console.error('💥 Error during initialization:', error);
    }
});
