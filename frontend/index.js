let map;

async function start() {
    create_map();
    let generatedPaths = await generatePaths();
    console.log(generatedPaths);
    renderPaths(generatedPaths);
}

function create_map() {
    map = L.map('map').setView([50.0334524, 15.7773391], 13);
        // load a tile layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
        console.log("mapa hotova")
}

async function generatePaths() {
    try {
        let args = {
            method: 'POST', // or 'PUT'
            headers: {
            'Content-Type': 'application/json',
            },
            // body: JSON.stringify({

            // })
        };
        const response = await fetch('http://localhost:8080/', args);
        const data = await response.json()
        return data;
    } catch (error) {
        console.log(error)
    }
}

function renderPaths(generatedPaths) {
    generatedPaths.paths.forEach(path => {
        let mapPoints = path.points.map(point => new L.LatLng(point.lat, point.lon))
        
        let polyline = new L.Polyline(mapPoints, {
            color: 'red',
            weight: 3,
            opacity: 0.5,
            smoothFactor: 1
        });
        polyline.addTo(map);
    });
}
start()