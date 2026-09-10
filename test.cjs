const fs = require('fs');
const key = fs.readFileSync('.env', 'utf8').split('=')[1].trim();
fetch('https://api.railradar.in/v1/trains/13333/live', { headers: { Authorization: 'Bearer ' + key } })
  .then(r => r.json())
  .then(d => {
    console.log('Source:', d.data.route[0]);
    console.log('Dest:', d.data.route[d.data.route.length - 1]);
    console.log('Current Location Obj:', d.data.currentLocation);
  });
