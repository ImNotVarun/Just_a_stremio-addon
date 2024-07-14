const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const fs = require('fs');
const path = require('path');
const CronJob = require('cron').CronJob;

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
    ]
};

// Define your stream items
const streams = [
    {
        id: 'cs:match1',
        name: 'Bigg_Boss',
        type: 'movie',
        poster: 'https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3-poster-252x300.jpg',
        description: 'Watch Bigg Boss live!'
    },
    {
        id: 'cs:match2',
        name: 'Cricket',
        type: 'movie',
        poster: 'https://media.gettyimages.com/id/1435854596/photo/india-v-pakistan-icc-mens-t20-world-cup.jpg?s=1024x1024&w=gi&k=20&c=99J0tacpwRdfql_dj6-IDK2lMhSbFRFJj7ux7xxC3zc=',
        description: 'Watch Cricket Live'
    }
];

// Function to update stream links
const updateStreamLinks = () => {
    const now = new Date();
    console.log('Updating stream links at', now.toISOString());

    for (const match in config.streams) {
        config.streams[match] = config.streams[match].map(stream => {
            if (stream.url === 'https://prod-ent-live-gm.jiocinema.com/hls/live/2105483/uhd_akamai_atv_avc_24x7_bbhindi_day01/master.m3u8') {
                return stream;
            }
            if (stream.url.includes('_day')) {
                const parts = stream.url.split('_day');
                const dayNumber = parseInt(parts[1].slice(0, 2), 10);
                const newDayNumber = `day${(dayNumber + 1).toString().padStart(2, '0')}`;
                return { ...stream, url: `${parts[0]}_${newDayNumber}${parts[1].slice(2)}` };
            }
            return stream;
        });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
    console.log('Stream links updated successfully');
};

// Schedule the update to run at 8:00 PM IST every day
new CronJob('0 20 * * *', updateStreamLinks, null, true, 'Asia/Kolkata');

// Define metadata for movies
const getMovieMeta = (id) => {
    const metas = {
        'cs:match1': {
            id: 'cs:match1',
            type: 'movie',
            name: 'Bigg_Boss',
            poster: 'https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3-poster-252x300.jpg',
            genres: ['Cricket'],
            description: 'Watch Bigg Boss live!',
            logo: 'https://th.bing.com/th/id/OIP.NSH3fafDGGExtEuImqa_SgAAAA?rs=1&pid=ImgDetMain',
            background: 'https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3.jpg',
            runtime: 'Live'
        },
        'cs:match2': {
            id: 'cs:match2',
            type: 'movie',
            name: 'Cricket',
            poster: 'https://media.gettyimages.com/id/1435854596/photo/india-v-pakistan-icc-mens-t20-world-cup.jpg?s=1024x1024&w=gi&k=20&c=99J0tacpwRdfql_dj6-IDK2lMhSbFRFJj7ux7xxC3zc=',
            genres: ['Cricket'],
            description: 'Watch Cricket live!',
            logo: 'https://th.bing.com/th/id/OIP.dPOeUjIRf7m1A_uwrsoSJAAAAA?rs=1&pid=ImgDetMain',
            background: 'https://img1.hscicdn.com/image/upload/f_auto,t_ds_w_1280,q_80/lsci/db/PICTURES/CMS/384000/384081.jpg',
            runtime: 'Live'
        }
    };
    return Promise.resolve(metas[id] || null);
};

// Initialize the addon builder
const builder = new addonBuilder(manifest);

// Define the catalog handler
builder.defineCatalogHandler(({ type, id }) => {
    if (type === 'movie' && id === 'cricket') {
        return Promise.resolve({ metas: streams });
    } else {
        return Promise.resolve({ metas: [] });
    }
});

// Define the meta handler
builder.defineMetaHandler(({ type, id }) => {
    if (type === 'movie') {
        return getMovieMeta(id).then(meta => ({ meta }));
    }
    return Promise.resolve({ meta: null });
});

// Define the stream handler
builder.defineStreamHandler(({ id }) => {
    if (id.startsWith('cs:')) {
        const stream = streams.find(s => s.id === id);
        if (stream) {
            const streamUrls = config.streams[id] || [];
            return Promise.resolve({
                streams: streamUrls.map(streamObj => ({
                    title: streamObj.name,
                    url: streamObj.url,
                    isLive: true
                }))
            });
        }
    }
    return Promise.resolve({ streams: [] });
});

// Set up the server using serveHTTP
const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port }).then(() => {
    console.log(`Addon server is running on http://localhost:${port}`);
}).catch(error => {
    console.error('Failed to start the server:', error);
});

// Error handling for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});