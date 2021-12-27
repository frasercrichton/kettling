import React, { useState, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { TRANSITION_EVENTS } from 'deck.gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import { MapboxLayer } from '@deck.gl/mapbox';
import { LinearInterpolator } from '@deck.gl/core';
import mapboxgl from 'mapbox-gl'
import { StaticMap } from 'react-map-gl'

import policePrecincts from './Police_Districts.geojson';
import data from './clean.json'
// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const MAP_BOX_ACCESS_TOKEN = process.env.REACT_APP_MAP_LEAFLET_KEY
const MAP_BOX_STYLE_ID = process.env.REACT_APP_MAP_BOX_STYLE_ID
const minZoom = 10

const transitionInterpolator = new LinearInterpolator({
  transitionProps: ['bearing', 'zoom']
})

const geoJsonLayer = {
  id: 'geojson-layer',
  data: policePrecincts,
  stroked: true,
  filled: true,
  wireframe: true,
  extruded: false,
  lineWidthScale: 1,
  lineWidthMinPixels: 3,
  getFillColor: [255, 0, 0, 0],
  getLineColor: [0, 0, 255, 255],
  getLineWidth: 3,
  opacity: 0.5
}

const gridLayer = {
  id: 'GridLayer',
  data,
  pickable: true,
  extruded: true,
  cellSize: 200,
  colorRange: [
    [99, 0, 0],
    [150, 0, 0],
    [189, 0, 0],
    [217, 0, 0],
    [247, 0, 0]
  ],
  elevationScale: 6,
  getPosition: (d) => d.COORDINATES
}

const layers = [new GeoJsonLayer(geoJsonLayer),
new GridLayer(gridLayer)]

const buildingLayer = {
  id: '3d-buildings',
  source: 'composite',
  // type: PolygonLayer,
  'source-layer': 'building',
  filter: ['==', 'extrude', 'true'],
  type: 'fill-extrusion',
  minZoom,
  paint: {
    'fill-extrusion-color': '#aaa',

    // use an 'interpolate' expression to add a smooth transition effect to the
    // buildings as the user zooms in
    'fill-extrusion-height': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoom,
      0,
      10.05,
      ['get', 'height']
    ],
    'fill-extrusion-base': [
      'interpolate',
      ['linear'],
      ['zoom'],
      minZoom,
      0,
      10.05,
      ['get', 'min_height']
    ],
    'fill-extrusion-opacity': 0.6
  }
}

function App() {
  // DeckGL and mapbox will both draw into this WebGL context
  const [glContext, setGLContext] = useState()
  const deckRef = useRef(null)
  const mapRef = useRef(null)
  const [initialViewState, setInitialViewState] = useState({
    latitude: 38.914751,
    longitude: -77.032112,
    zoom: 11,
    // minZoom: 9,
    bearing: 0,
    pitch: 45
  })

  const rotateCamera = useCallback(() => {
    setInitialViewState((viewState) => ({
      ...viewState,
      bearing: viewState.bearing + 120,
      zoom: (viewState.zoom <= minZoom) ? viewState.zoom + 0.8 : viewState.zoom,
      transitionDuration: 7000,
      transitionInterpolator,
      onTransitionEnd: rotateCamera,
      transitionInterruption: TRANSITION_EVENTS.BREAK
    }))
  }, [])

  const onViewStateChange = useCallback(
    ({ viewState, interactionState, oldViewState }) => {
      const { isDragging, isPanning, isRotating, isZooming } = interactionState
      if (isDragging || isPanning || isRotating || isZooming) {
        setInitialViewState((viewState) => ({
          ...viewState,
          transitionDuration: 0,
          transitionInterpolator,
          // onTransitionEnd: rotateCamera,

          transitionInterruption: TRANSITION_EVENTS.BREAK

        }))
      }
    },
    []
  )

  const onMapLoad = useCallback(() => {
    const map = mapRef.current.getMap()
    const deck = deckRef.current.deck

    const layers = map.getStyle().layers
    const firstLabelLayerId = layers.find(
      (layer) => layer.type === 'symbol'
    ).id


    map.addLayer(new MapboxLayer({ id: 'GridLayer', deck }), firstLabelLayerId)
    map.addLayer(
      new MapboxLayer({ id: 'geojson-layer', deck }),
      firstLabelLayerId
    )
    map.addLayer(buildingLayer, firstLabelLayerId)
    map.addLayer(gridLayer, firstLabelLayerId)
    rotateCamera()
  }, [rotateCamera])

  return (
    <DeckGL
      ref={deckRef}
      layers={layers}
      initialViewState={initialViewState}
      onViewStateChange={onViewStateChange}
      controller
      onWebGLInitialized={setGLContext}
      glOptions={{
        /* To render vector tile polygons correctly */
        stencil: true
      }}
    >
      {glContext && (
        /* This is important: Mapbox must be instantiated after the WebGLContext is available */
        <StaticMap
          ref={mapRef}
          gl={glContext}
          mapboxApiAccessToken={MAP_BOX_ACCESS_TOKEN}
          mapStyle={MAP_BOX_STYLE_ID}
          onLoad={onMapLoad}
        />
      )}
    </DeckGL>
  )
}

export default App