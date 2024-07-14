const fs = require('fs');
const path = require('path');

// Load the configuration file
const configPath = path.resolve(__dirname, '../config.json');
let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const updateStreamLinks = () => {
    const now = new Date();
    console.log('Updating stream links at', now.toISOString());

    for (const match in config.streams) {
        config.streams[match] = config.streams[match].map(url => {
            // Skip the URL that should not be updated
            if (url === 'https://prod-ent-live-gm.jiocinema.com/hls/live/2105483/uhd_akamai_atv_avc_24x7_bbhindi_day01/master.m3u8') {
                return url;
            }
            if (url.includes('_day')) {
                const parts = url.split('_day');
                const dayNumber = parseInt(parts[1].slice(0, 2), 10);
                const newDayNumber = `day${(dayNumber + 1).toString().padStart(2, '0')}`;
                return `${parts[0]}_${newDayNumber}${parts[1].slice(2)}`;
            }
            return url;
        });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 4), 'utf-8');
    console.log('Stream links updated successfully');
};

module.exports = (req, res) => {
    updateStreamLinks();
    res.status(200).send('Stream links checked and updated');
};
