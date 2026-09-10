const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/VITE_RAILRADAR_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;

fetch('https://api.railradar.in/v1/trains/12919/route?format=geojson&stops=true', { headers: { Authorization: 'Bearer ' + key } })
  .then(r => r.json())
  .then(d => {
    console.log(JSON.stringify(d, null, 2).substring(0, 1500));
  })
  .catch(console.error);
