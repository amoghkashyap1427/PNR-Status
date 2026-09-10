const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const keyMatch = env.match(/VITE_RAILRADAR_KEY=(.*)/);
const key = keyMatch ? keyMatch[1].trim() : null;
fetch('https://api.railradar.in/v1/trains/13333/live?date=2026-07-10', { headers: { Authorization: 'Bearer ' + key } })
  .then(r => r.json())
  .then(d => {
    console.log('Source:', d.data.route[0]);
    console.log('Dest:', d.data.route[d.data.route.length - 1]);
    console.log('Current Location Obj:', d.data.currentLocation);
  });
