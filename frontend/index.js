let map;

const form = document.querySelector(".route");

let startIcon = L.icon({
    iconUrl: '../foto/greenmarker.png',
    iconSize: [30, 45]
});
let endIcon = L.icon({
    iconUrl: '../foto/redmarker.png',
    iconSize: [30, 45],
});

let startMarker = L.marker([50.0334524, 15.7773391], {draggable:'true', icon:startIcon});
let endMarker = L.marker([50.0334524, 15.7773391], {draggable:'true', icon:endIcon});

async function start() {
    create_map();
    handleForm();
    createMenu();
}

function create_map() {
    map = L.map('map').setView([50.0334524, 15.7773391], 13);
    // load a tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
}

async function createForm() {
    form.addEventListener("submit", () => {
        handleForm();
    });
}


async function handleForm() {
    let parameters = {
        "from": startMarker.getLatLng(),
        "end": endMarker.getLatLng(),
        "time": document.querySelector("#time").value,
        "transportType": document.querySelector('input[name="transportType"]:checked').value
    }
    console.log(parameters);
    let generatedPaths = await generatePaths(parameters);
    console.log(generatedPaths);
    renderPaths(generatedPaths);
}

async function generatePaths(parameters) {
    try {
        let args = {
            method: 'POST', // or 'PUT'
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                parameters
            })
        };
        const response = await fetch('http://localhost:8080/', args);
        return await response.json();
    } catch (error) {
        console.log(error);
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

function createMenu() {
    document.querySelector(".side-bar button").addEventListener("click", () => {
        let menu = document.querySelector(".side-menu");
        if (menu.style.width == "0vw") {
            document.querySelector(".side-bar button").innerHTML = ">";
            menu.style.width = "19vw";
        } else {
            document.querySelector(".side-bar button").innerHTML = "<";
            menu.style.width = "0vw";
        }
    });
    createMarkers();
    createClearButton();
}

function createMarkers() {
    document.querySelector("#fromMarker").addEventListener("dragend", (e) => {
        map.removeLayer(startMarker);
        startMarker.setLatLng(map.containerPointToLatLng(L.point([e.clientX,e.clientY])))
        map.addLayer(startMarker);
    });
    document.querySelector("#endMarker").addEventListener("dragend", (e) => {
        map.removeLayer(endMarker);
        endMarker.setLatLng(map.containerPointToLatLng(L.point([e.clientX,e.clientY])))
        map.addLayer(endMarker);
    })
}

function createClearButton() {
    document.querySelector(".clearButton").addEventListener("click", () => {
        document.querySelector("#from").value = "";
        document.querySelector("#to").value = "";
        document.querySelector("#time").value = "";
        map.removeLayer(startMarker);
        map.removeLayer(endMarker);
    });
}
start();