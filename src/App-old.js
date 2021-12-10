import React, { useState, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { TRANSITION_EVENTS } from 'deck.gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { GridLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { MapboxLayer } from '@deck.gl/mapbox';
import { LinearInterpolator } from '@deck.gl/core';

import policePrecincts from './Police_Districts.geojson'
import data from './clean.json'

import mapboxgl from 'mapbox-gl'

import { StaticMap } from 'react-map-gl'

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const MAP_BOX_ACCESS_TOKEN = process.env.REACT_APP_MAP_LEAFLET_KEY
const MAP_BOX_STYLE_ID = process.env.REACT_APP_MAP_BOX_STYLE_ID
const transitionInterpolator = new LinearInterpolator({
  transitionProps: ['bearing', 'zoom']
})

const heatMapLayer = new HeatmapLayer({
  id: 'HeatmapLayer',
  data,
  // radiusPixels: 25,
  getPosition: (d) => d.COORDINATES,
  getWeight: (d) => Number(d.count)
  // aggregation: 'SUM',
  // colorRange: [
  //   [37, 37, 37],
  //   [99, 99, 99],
  //   [150, 150, 150],
  //   [189, 189, 189],
  //   [217, 217, 217],
  //   [247, 247, 247]
  // ],
})

const layers = [heatMapLayer]

function App () {
  // DeckGL and mapbox will both draw into this WebGL context
  const [glContext, setGLContext] = useState()
  const deckRef = useRef(null)
  const mapRef = useRef(null)
  const [initialViewState, setInitialViewState] = useState({
    latitude: 38.914751,
    longitude: -77.032112,
    zoom: 10,
    bearing: 0,
    pitch: 45
  })

  const rotateCamera = useCallback(() => {
    setInitialViewState((viewState) => ({
      ...viewState,
      bearing: viewState.bearing + 120,
      zoom: (viewState.zoom <= 12) ? viewState.zoom + 0.8 : viewState.zoom,
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


    // map.addLayer(new MapboxLayer({ id: 'GridLayer', deck }), firstLabelLayerId)
    // map.addLayer(
    //   new MapboxLayer({ id: 'geojson-layer', deck }),
    //   firstLabelLayerId
    // )
     map.addLayer(new MapboxLayer({ id: 'HeatmapLayer', deck }), firstLabelLayerId)
    
    // map.addLayer(buildingLayer, firstLabelLayerId)

    // map.addLayer(heatMapLayer, firstLabelLayerId)
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

        // <HeatmapLayer 
        //   id='HeatmapLayer'
        //   data={data}
        //   radiusPixels={25}
        //   getPosition={ (d) => d.COORDINATES}
        //   getWeight={ (d) => Number(d.count)}
        // />
      )}
    </DeckGL>
  )
}

export default App