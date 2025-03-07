import { useState } from 'preact/hooks'
import greenMarker from "./foto/greenmarker.png"
import redMarker from "./foto/redmarker.png"
import walk from "./foto/icons8-walking-50.png"
import car from "./foto/icons8-car-50.png"
import bicycle from "./foto/icons8-cyclist-50.png"
import bus from "./foto/icons8-bus-50.png"
import clearButton from "./foto/icons8-x-50.png"
import tourist from "./foto/icons8-tourist-50.png"
import run from "./foto/icons8-run-50.png"
import {useEffect, useRef} from "react";
import * as maplibregl from "maplibre-gl";
import {Protocol} from "pmtiles";
import {Marker, LngLat} from "maplibre-gl";
import type {FeatureCollection} from 'geojson';
import { format } from 'react-string-format';

type TransportType = "walk" | "bicycle" | "car" | "bus"
type Speed = "tourist" | "walk" | "run" | "bicycle" | "car" | "bus"

interface Point {
    lon: number;
    lat: number;
}

interface Path {
    points: Point[];
}

export function App() {
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [startMarker, setStartMarker] = useState<maplibregl.Marker | null>(null);
    const [endMarker, setEndMarker] = useState<maplibregl.Marker | null>(null)
    const [startPoint, setStartPoint] = useState<LngLat | null>(null);
    const [endPoint, setEndPoint] = useState<LngLat | null>(null)
    const [transportType, setTransportType] = useState<TransportType>("walk")
    const [speed, setSpeed] = useState<Speed>("walk")
    const [panelOpen, setPanelOpen] = useState(true)
    const [path, setPath] = useState<FeatureCollection | null>(null)
    const [pathExists, setPathExists] = useState(false)
    const [pathTimeValue, setPathTimeValue] = useState<number | null>(null)
    const [pathLengthValue, setPathLengthValue] = useState<number | null>(null)
    const fromInputRef = useRef<HTMLInputElement | null>(null)
    const toInputRef = useRef<HTMLInputElement | null>(null)
    // const pathTimeRef = useRef<HTMLInputElement | null>(null)
    const pathTimeRef = useRef<HTMLParagraphElement | null>(null)
    const pathLengthRef = useRef<HTMLParagraphElement | null>(null)
    useEffect(() => {
        maplibregl.addProtocol("pmtiles", new Protocol().tile);
        setMap(new maplibregl.Map({
            style: 'https://s.vfosnar.cz/vmt/embed_style.json',
            center: [15.786, 50.038],
            zoom: 12.631284857541836,
            container: 'map',
        }));
    }, [])

    useEffect(() => {
        const markerStart = new maplibregl.Marker({
            draggable: true,
            color: "#007f00"
        });

        const markerEnd = new maplibregl.Marker({
            draggable:true,
            color: "#c82a29"
        });

        markerStart?.on('dragend', (event) => {
            setStartPoint(event.target.getLngLat())
        });
        markerEnd?.on('dragend', (e) => {
            setEndPoint(e.target.getLngLat());
        });

        setStartMarker(markerStart)
        setEndMarker(markerEnd)
    }, [map])

    const firstStart = useRef(true);
    const firstEnd = useRef(true);
    useEffect(() => {
        if (firstStart.current) {
            firstStart.current = false
            return
        }
        if (firstEnd.current) {
            firstEnd.current = false
            return
        }
        handleForm()
    }, [startPoint, endPoint, transportType])

    function placeMarker(e: MouseEvent, marker: Marker, type: String) {
        marker.remove()
        marker.setLngLat(map!.unproject([e.clientX, e.clientY]));
        marker.addTo(map!);
        type == "s" ? setStartPoint(map!.unproject([e.clientX, e.clientY])) : setEndPoint(map!.unproject([e.clientX, e.clientY]))
    }

    async function handleForm() {
        let pathParameters = {
            "from": startPoint ? startPoint : null,
            "end": endPoint ? endPoint : null,
            // "time": document.querySelector("#time").value,
            "transportType": transportType
        }
        let generatedPaths = await generatePaths(pathParameters);
        if (generatedPaths.error == null) {
            setPathExists(true)
        }
        fillFromTo(generatedPaths.from, generatedPaths.to);
        renderPaths(generatedPaths.paths);
        setPathLengthValue(generatedPaths.pathLength)
        // setPathTimeValue(generatedPaths.pathTime)
    }

    const firstValue = useRef(true);
    useEffect(() => {
        if (firstValue.current) {
            firstValue.current = false
            return
        }
        if (pathLengthValue?.valueOf() == null) pathLengthRef.current!.innerText = ""
        else if (pathLengthValue?.valueOf() < 1000) {
            pathLengthRef.current!.innerText = format('{0} m', pathLengthValue?.valueOf())
            calculateTime();
        }
        else {
            pathLengthRef.current!.innerText = format('{0} km',  Math.round((pathLengthValue?.valueOf() / 1000) * 100) / 100)
            calculateTime()
        }
    }, [pathLengthValue, transportType, speed])

    function calculateTime() {
        if (pathLengthValue == null) return
        let km = pathLengthValue.valueOf() / 1000;
        switch (speed) {
            case "tourist":
                setPathTimeValue(Math.floor((km / 3) * 60));
                break;
            case "walk":
                setPathTimeValue(Math.floor((km / 4) * 60));
                break;
            case "run":
                setPathTimeValue(Math.floor((km / 5) * 60));
                break;
            case "car":
                setPathTimeValue(Math.floor((km / 50) * 60));
        }
    }

    const firstTime = useRef(true);
    useEffect(() => {
        if (firstTime.current) {
            firstTime.current = false
            return
        }
        if (pathTimeValue?.valueOf() == undefined) pathTimeRef.current!.innerText = ""
        else if (pathTimeValue?.valueOf() < 60) pathTimeRef.current!.innerText = format('{0} min', pathTimeValue?.valueOf())
        else {
            let value = Math.round((pathTimeValue?.valueOf() / 60) * 100) / 100
            let hours = Math.floor(value);
            let minutes = Math.floor((value - hours) * 60)
            pathTimeRef.current!.innerText = format('{0}:{1} h', hours, minutes)
        }
    }, [pathTimeValue])

    function fillFromTo(from: string, to: string) {
        from == undefined ? fromInputRef.current!.value = "" : fromInputRef.current!.value = from;
        to == undefined ? toInputRef.current!.value = "" : toInputRef.current!.value = to;
    }

    function renderPaths(generatedPaths: Path[]) {
        let linesArray: any[] = []
        generatedPaths.forEach((path) => {
            linesArray.push(path.points.map(point => [point.lon, point.lat]));
        })


        setPath({
            "type": "FeatureCollection",
            "features": linesArray.map(coords => ({
                "type": "Feature",
                "properties": {}, // You can add custom properties here
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                }
            }))
        });
    }

    const firstPath = useRef(true);
    useEffect(() => {
        if (firstPath.current) {
            firstPath.current = false
            return
        }
        if (!map?.getSource('multi-lines')) {
            // Add the multi-line source

            map?.addSource('multi-lines', {
                'type': 'geojson',
                'data': path
            } as any);
        } else {
            map?.removeLayer('multi-line-layer');
            map?.removeSource('multi-lines');
            map?.addSource('multi-lines', {
                'type': 'geojson',
                'data': path
            } as any);
        }

        map?.addLayer({
            'id': 'multi-line-layer',
            'type': 'line',
            'source': 'multi-lines',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': ['get', 'color'], // You can dynamically set colors if needed
                'line-width': 4
            }
        });
    }, [path]);

    async function generatePaths(parameters: any) {
        try {
            let args = {
                method: 'POST', // or 'PUT'
                headers: {
                    'Access-Control-Allow-Origin':'*',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    parameters
                })
            };
            const response = await fetch(import.meta.env.VITE_BACKEND || 'http://localhost:8080/', args);
            return await response.json();
        } catch (error) {
            console.log(error);
        }
    }
    function clearMenu() {
        // @ts-ignore
        fromInputRef.current.value = ""
        // @ts-ignore
        toInputRef.current.value = ""
        startMarker?.remove()
        endMarker?.remove()
        map?.removeLayer('multi-line-layer');
        map?.removeSource('multi-lines');
        setPathExists(false)
    }

    function changeTransportType(type: TransportType) {
        switch (type) {
            case "walk":
                setTransportType("walk");
                setSpeed("walk");
                break
            case "bicycle":
                setTransportType("bicycle");
                setSpeed("bicycle");
                break
            case "car":
                setTransportType("car");
                setSpeed("car");
                break
            case "bus":
                setTransportType("bus");
                setSpeed("bus");
                break
        }
    }

    return (
        <>
            <section>
                <div id="map" className="h-screen"></div>
            </section>
            <div></div>
            <section className="fixed z-1 top-0 right-0 overflow-x-hidden flex flex-row h-screen">
                <button onClick={() => setPanelOpen(!panelOpen)} className="top-1/2 text-2xl px-2 py-12 rounded-l-xl bg-gray-100 brightness-95 hover:text-green-700 self-center">{panelOpen ? ">" : "<"}</button>
                {panelOpen && (
                    <div className="w-80 h-screen z-1 bg-gray-100">
                        <div className="flex flex-row mt-8 justify-between mx-5">
                            <img onClick={() => clearMenu()} src={clearButton} alt="" srcSet=""
                                 className="opacity-70 hover:opacity-100 max-w-12 max-h-12 self-center text-xl cursor-pointer p-2 -ml-2"/>
                            <div className="flex flex-row">
                                <label>
                                    <input defaultChecked={true} onClick={() => changeTransportType("walk")} type="radio" name="transportType" value="walk" id="walk"
                                           className="absolute opacity-0 w-0 h-0 peer"/>
                                    <img src={walk} alt="Option 1"
                                         className="cursor-pointer bg-white rounded peer-checked:outline-green-600 peer-checked:outline my-2 mx-1 hover:outline-gray-300 hover:outline hover:outline-3"/>
                                </label>
                                <label>
                                    <input onClick={() => changeTransportType("bicycle")} type="radio" name="transportType" value="bike"
                                           className="absolute opacity-0 w-0 h-0 peer"/>
                                    <img src={bicycle} alt="Option 2"
                                         className="cursor-pointer bg-white rounded peer-checked:outline-green-600 peer-checked:outline my-2 mx-1 hover:outline-gray-300 hover:outline hover:outline-3"/>
                                </label>
                                <label>
                                    <input onClick={() => changeTransportType("car")} type="radio" name="transportType" value="car"
                                           className="absolute opacity-0 w-0 h-0 peer"/>
                                    <img src={car} alt="Option 3"
                                         className="cursor-pointer bg-white rounded peer-checked:outline-green-600 peer-checked:outline my-2 mx-1 hover:outline-gray-300 hover:outline hover:outline-3"/>
                                </label>
                                <label>
                                    <input onClick={() => changeTransportType("bus")} type="radio" name="transportType" value="bus"
                                           className="absolute opacity-0 w-0 h-0 peer"/>
                                    <img src={bus} alt="Option 4"
                                         className="cursor-pointer bg-white rounded peer-checked:outline-green-600 peer-checked:outline my-2 mx-1 hover:outline-gray-300 hover:outline hover:outline-3"/>
                                </label>
                            </div>
                        </div>
                        <div className="flex flex-row my-3">
                            <img onDragEnd={(e) => placeMarker(e, startMarker!, "s")} src={greenMarker} alt="" srcSet="" id="startMarker"
                                 className="ml-4 max-w-9 h-auto duration-200 cursor-pointer hover:duration-200 hover:scale-125"/>
                            <input ref={fromInputRef} type="text" name="from" id="from" placeholder="From"
                                   className="bg-white rounded w-60 max-h-12 text-l my-1 ml-2 px-3 outline outline-2 outline-gray-300 hover:outline-gray-400 focus:outline-green-600"/>
                        </div>
                        <div className="flex flex-row">
                            <img onDragEnd={(e) => placeMarker(e, endMarker!, "e")} src={redMarker} alt="" srcSet="" id="toMarker"
                                 className="ml-4 max-w-9 h-auto duration-200 cursor-pointer hover:duration-200 hover:scale-125"/>
                            <input ref={toInputRef} type="text" name="to" id="to" placeholder="To"
                                   className="bg-white rounded w-60 max-h-12 text-l my-1 ml-2 px-3 outline outline-2 outline-gray-300 hover:outline-gray-400 focus:outline-green-600"/>
                        </div>
                        <div className="flex flex-row justify-center">
                            <input onClick={() => handleForm()} type="submit" value="Route"
                                   className="w-64 bg-green-600 text-white text-xl rounded-md ml-10 m-5 cursor-pointer h-8 hover:brightness-90"/>
                        </div>
                        <div className="flex flex-row justify-between mx-8">
                            {pathExists && (
                                <div className="flex flex-col w-20 py-2 rounded-xl text-center bg-white ">
                                    {/*<input ref={pathTimeRef} type="text" name="length" id="length"/>*/}
                                    <p ref={pathTimeRef} className="text-xl"></p>
                                    <p ref={pathLengthRef} className="text-l"></p>
                                </div>
                            )}
                            <span></span>
                            {transportType == "walk" && (
                                <div className="flex flex-row">
                                    <label className="w-12 px-1">
                                        <input onClick={() => setSpeed("tourist")} type="radio" name="walkSpeed"
                                               value="tourist"
                                               className="absolute opacity-0 w-0 h-0 peer"/>
                                        <img src={tourist} alt="Speed 1"
                                             className="cursor-pointer bg-white rounded peer-checked:outline-green-600 hover:outline-gray-300 outline outline-gray-100 my-2"/>
                                    </label>
                                    <label className="w-12 px-1">
                                        <input defaultChecked={true} onClick={() => setSpeed("walk")} type="radio" name="walkSpeed"
                                               value="walk"
                                               className="absolute opacity-0 w-0 h-0 peer"/>
                                        <img src={walk} alt="Speed 2"
                                             className="cursor-pointer bg-white rounded peer-checked:outline-green-600 hover:outline-gray-300 outline outline-gray-100 my-2"/>
                                    </label>
                                    <label className="w-12 px-1">
                                        <input onClick={() => setSpeed("run")} type="radio" name="walkSpeed"
                                               value="run"
                                               className="absolute opacity-0 w-0 h-0 peer"/>
                                        <img src={run} alt="Speed 3"
                                             className="cursor-pointer bg-white rounded peer-checked:outline-green-600 hover:outline-gray-300 outline outline-gray-100 my-2"/>
                                    </label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </>
    )
}
