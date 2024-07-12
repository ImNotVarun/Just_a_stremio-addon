const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');

// Define the manifest for the addon
const manifest = {
    id: 'org.myaddon.cricketstreams',
    version: '1.0.0',
    name: 'CricketStreams_24/7',
    description: 'A Stremio addon to play cricket streams',
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie'],
    idPrefixes: ['cs:'],
    catalogs: [
        {
            type: 'movie',
            id: 'cricket',
            name: 'Cricket Streams'
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
        description: 'Watch England vs Pakistan live!'
    }
];

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
            let streamUrls = [];
            if (id === 'cs:match1') {
                streamUrls = [
                    'https://prod-ent-live-gm.jiocinema.com/hls/live/2105483/uhd_akamai_atv_avc_24x7_bbhindi_day01/master.m3u8',
                    'https://prod-ent-live-gm.jiocinema.com/hls/live/2105484/uhd_akamai_atv_avc_eptv_bbhindi_day22/master.m3u8'
                ];
            } else if (id === 'cs:match2') {
                streamUrls = [
                    'https://trl01.pctrls.nl:443/procricket/amlst:stream_4_b4550000/playlist.m3u8?vidictid=199153280917&id=4&pk=2FB5E1E3F4AC8AEFAF78C26D5016E249DDA33443AF88CBD5FAB14F74765296EB&userId=ddf77f37-8498-42ee-93d8-b7e34912df39'
                ];
            }
            return Promise.resolve({
                streams: streamUrls.map(url => ({
                    title: stream.name,
                    url: url,
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
