const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const fs = require('fs');
const path = require('path');
const CronJob = require('cron').CronJob;
const https = require('https');
const http = require('http');
const os = require('os');

// Function to get local IP address
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const interface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (interface.family === 'IPv4' && !interface.internal) {
                return interface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost
}

const LOCAL_IP = getLocalIP();
const port = process.env.PORT || 7000;
const PUBLIC_URL = `http://${LOCAL_IP}:${port}`;

// Load the configuration file
const configPath = path.resolve(__dirname, 'config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Define the manifest for the addon
const manifest = {
    id: 'org.myaddon.cricketstreams',
    version: '1.0.1',
    name: 'Live_TV',
    description: 'A Stremio addon to Live Streams streams',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'],
    idPrefixes: ['cs:'],
    logo: 'https://open-store.io/icons/stremio.jhayproject/stremio.jhayproject-1.0.0.png',
    catalogs: [
        {
            type: 'movie',
            id: 'cricket',
            name: 'Cricstream'
        }
    ],
    // Add these properties for better Android/TV compatibility
    behaviorHints: {
        adult: false,
        p2p: false
    }
};

// Function to modify acestream URLs for cross-device compatibility
function processAceStreamUrl(url) {
    if (url.includes('127.0.0.1:6878') || url.includes('localhost:6878')) {
        // Replace localhost/127.0.0.1 with the local IP address
        return url.replace(/(?:127\.0\.0\.1|localhost):6878/, `${LOCAL_IP}:6878`);
    }
    return url;
}

// Rest of your streamData object remains the same
const streamData = {
    'cs:match1': {
        id: 'cs:match1',
        type: 'movie',
        name: 'Bigg_Boss',
        poster: 'https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3-poster-252x300.jpg',
        description: 'Watch Bigg Boss live!',
        genres: ['Entertainment'],
        logo: 'https://th.bing.com/th/id/OIP.NSH3fafDGGExtEuImqa_SgAAAA?rs=1&pid=ImgDetMain',
        background: 'https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3.jpg',
        runtime: 'Live'
    },
    'cs:match2': {
        id: 'cs:match2',
        type: 'movie',
        name: 'Cricket',
        poster: 'https://media.gettyimages.com/id/1435854596/photo/india-v-pakistan-icc-mens-t20-world-cup.jpg?s=1024x1024&w=gi&k=20&c=99J0tacpwRdfql_dj6-IDK2lMhSbFRFJj7ux7xxC3zc=',
        description: 'Watch Cricket Live',
        genres: ['Sports'],
        logo: 'https://th.bing.com/th/id/OIP.dPOeUjIRf7m1A_uwrsoSJAAAAA?rs=1&pid=ImgDetMain',
        background: 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/384000/384081.jpg',
        runtime: 'Live'
    }
};

// Modified stream handler for cross-device compatibility
builder.defineStreamHandler(async ({ id }) => {
    if (id.startsWith('cs:') && config.streams[id]) {
        const streamUrls = config.streams[id] || [];
        try {
            const processedStreams = await Promise.all(
                streamUrls.map(async (streamObj) => {
                    let finalUrl = processAceStreamUrl(streamObj.url);
                    
                    if (streamObj.url.includes('port.denver1769.in') || 
                        (streamObj.url.endsWith('.m3u8') && !streamObj.url.includes('jiocinema'))) {
                        try {
                            await processM3U8(finalUrl);
                            console.log(`Successfully processed M3U8 for ${streamObj.name}`);
                        } catch (error) {
                            console.error(`Error processing M3U8 for ${streamObj.name}:`, error);
                        }
                    }
                    
                    return {
                        title: streamObj.name,
                        url: finalUrl,
                        isLive: true
                    };
                })
            );
            
            return { streams: processedStreams };
        } catch (error) {
            console.error('Error processing streams:', error);
            return { streams: [] };
        }
    }
    return { streams: [] };
});

// Modified server startup
serveHTTP(builder.getInterface(), { port })
    .then(() => {
        console.log(`
=========================================
Addon server is running!
Local URL: http://127.0.0.1:${port}
Network URL: ${PUBLIC_URL}

For Android/TV, use the Network URL:
${PUBLIC_URL}
=========================================
        `);
    })
    .catch(error => {
        console.error('Failed to start the server:', error);
        process.exit(1);
    });

// Keep your existing error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
