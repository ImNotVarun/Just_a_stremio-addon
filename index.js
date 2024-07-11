const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const manifest = {
    id: "org.myaddon.m3u8",
    version: "1.0.0",
    name: "BiggBoss_24/7",
    description: "A Stremio addon to play BiggBosslive 24/7",
    resources: ["stream", "catalog"],
    types: ["movie", "series"],
    idPrefixes: ["m3u8:"],
    catalogs: [
        {
            id: "biggbosslive",
            name: "Bigg Boss Live",
            type: "movie",
            extra: [{ name: "search" }],
            poster: "https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3-poster-252x300.jpg"
        }
    ]
};

const builder = new addonBuilder(manifest);

builder.defineCatalogHandler(args => {
    console.log("Catalog handler called with args:", args);
    if (args.type === "movie" && args.id === "biggbosslive") {
        return Promise.resolve({
            metas: [
                {
                    id: "m3u8:https://prod-ent-live-gm.jiocinema.com/hls/live/2105483/uhd_akamai_atv_avc_24x7_bbhindi_day01/master.m3u8",
                    name: "Bigg Boss Live Stream",
                    type: "movie",
                    poster: "https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3-poster-252x300.jpg",
                    background: "https://www.bollyzone.tv/wp-content/uploads/2024/06/Bigg-Boss-OTT-3.jpg",
                    logo: "https://www.news.keralatv.in/media/2022/03/big-boss-4-logo-280x158.jpg",
                    description: "Watch Bigg Boss live 24/7",
                    releaseInfo: "Live",
                    imdbRating: "6.0",
                    genres: ["Reality TV"]
                }
            ]
        });
    } else {
        console.log("No matching catalog found");
        return Promise.resolve({ metas: [] });
    }
});

builder.defineStreamHandler(function (args) {
    console.log("Stream handler called with args:", args);
    const id = args.id;

    if (id.startsWith("m3u8:")) {
        const streamUrl = id.replace("m3u8:", "");
        console.log(`Serving stream URL: ${streamUrl}`);

        return Promise.resolve({
            streams: [
                {
                    title: "Live Stream",
                    url: streamUrl,
                    isLive: true
                }
            ]
        });
    } else {
        console.log('No streams available for ID:', id);
        return Promise.resolve({ streams: [] });
    }
});

// Set up the server using serveHTTP
const port = process.env.PORT || 7000;

serveHTTP(builder.getInterface(), { port }).then(server => {
    console.log(`Addon server is running on http://localhost:${port}`);
}).catch(error => {
    console.error("Failed to start the server:", error);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
