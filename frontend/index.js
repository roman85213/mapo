let map;

const form = document.querySelector(".route");

let startMarker;
let endMarker;

async function start() {
    create_map();
    createForm()
    createMenu();
}

function create_map() {
    maplibregl.addProtocol("pmtiles", new pmtiles.Protocol().tile);
    map = new maplibregl.Map({
        style: 'https://s.vfosnar.cz/vmt/embed_style.json',
        center: [15.786, 50.038],
        zoom: 12.631284857541836,
        container: 'map',
    })

    startMarker = new maplibregl.Marker({
        draggable:true,
        color: "#007f00"
    });
    endMarker = new maplibregl.Marker({
        draggable:true,
        color: "#c82a29"
    });
}

async function createForm() {
    form.addEventListener("submit", () => {
        handleForm();
    });
}


async function handleForm() {
    let parameters = {
        "from": startMarker.getLngLat(),
        "end": endMarker.getLngLat(),
        // "time": document.querySelector("#time").value,
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
            menu.style.width = "16rem";
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
        startMarker.remove();
        startMarker.setLngLat(map.unproject([e.clientX, e.clientY]));
        startMarker.addTo(map);
    });
    document.querySelector("#endMarker").addEventListener("dragend", (e) => {
        endMarker.remove();
        endMarker.setLngLat(map.unproject([e.clientX, e.clientY]));
        endMarker.addTo(map);
    })
}

function createClearButton() {
    document.querySelector(".clearButton").addEventListener("click", () => {
        document.querySelector("#from").value = "";
        document.querySelector("#to").value = "";
        // document.querySelector("#time").value = "";
        startMarker.remove();
        endMarker.remove();
    });
}
start();