import { render } from 'preact'
import './index.css'
import { App } from './app.tsx'
import 'maplibre-gl/dist/maplibre-gl.css';

render(<App />, document.getElementById('app')!)
