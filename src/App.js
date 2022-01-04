import React, { useState, useRef, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { TRANSITION_EVENTS } from 'deck.gl';
import { GeoJsonLayer, ColumnLayer } from '@deck.gl/layers';
import { GridLayer } from '@deck.gl/aggregation-layers';
import { LinearInterpolator } from '@deck.gl/core';
import mapboxgl from 'mapbox-gl'
import { _MapContext as MapContext, StaticMap, NavigationControl } from 'react-map-gl'

import policePrecincts from './Police_Districts.geojson';
import arrestData from './arrest-data.json'
import curfewViolationArrestData from './curfew-violation-arrest-data.json'

const cloudfrontUrl = 'https://d3bun1a589g4ul.cloudfront.net/data/'

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const MAP_BOX_ACCESS_TOKEN = process.env.REACT_APP_MAP_LEAFLET_KEY
const MAP_BOX_STYLE_ID = process.env.REACT_APP_MAP_BOX_STYLE_ID
const minZoom = 11
const zoom = 10
const zoomTarget = 12

const navControlStyle = {
  right: 10,
  top: 2,
  zIndex: 10
}

const transitionInterpolator = new LinearInterpolator({
  transitionProps: ['bearing', 'zoom']
})


function App() {
  const settings = {
    touchZoom: false,
    scrollWheelZoom: false,
    touchRotate: false,
    dragPan: false,
    dragRotate: false,
    scrollZoom: false,
  }
  const [initialViewState, setInitialViewState] = useState({
    latitude: 38.914751,
    longitude: -77.032112,
    zoom,
    minZoom,
    bearing: 0,
    pitch: 45,
    ...settings
  })

  const rotateCamera = useCallback(() => {
    setInitialViewState((viewState) => ({
      ...viewState,
      bearing: viewState.bearing + 120,
      zoom: (viewState.zoom <= zoomTarget) ? viewState.zoom + 0.8 : viewState.zoom,
      transitionDuration: 7000,
      transitionInterpolator,
      onTransitionEnd: rotateCamera,
      transitionInterruption: TRANSITION_EVENTS.IGNORE
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
          transitionInterruption: TRANSITION_EVENTS.IGNORE
        }))
      }
    },
    []
  )

  const onMapLoad = useCallback(() => {
    rotateCamera()
  }, [rotateCamera])

  return (
    <DeckGL
      ContextProvider={MapContext.Provider}
      initialViewState={initialViewState}
      onViewStateChange={onViewStateChange}
      controller={{ ...settings }}
    >
      <GridLayer
        id='GridLayer'
        data={arrestData}
        pickable={true}
        extruded={true}
        cellSize={200}
        colorRange={[
          [0, 191, 255, 100],
          [8, 146, 208, 100],
          [0, 115, 207, 100],
          [21, 96, 189, 100],
          [0, 0, 205, 100]
        ]}
        elevationScale={5}
        getPosition={(d) => d.COORDINATES}
        getElevationValue={(points) => points.reduce((max, p) => p.count > max ? p.count : max, -Infinity)}
      />
      <ColumnLayer
        id='CurfewGridLayer'
        data={curfewViolationArrestData}
        pickable={true}
        extruded={true}
        // cellSize={200}
        colorRange={[
          [37, 0, 0, 100], [99, 0, 0, , 100], [150, 0, 0], [189, 0, 0], [217, 0, 0], [247, 0, 0]
        ]}
        elevationScale={30}
        radius={200}
        getElevation={(d) => d.count}
        getPosition={(d) => d.COORDINATES}
        getFillColor={[37, 0, 0, 100], [99, 0, 0, 100, 100], [150, 0, 0, 100], [189, 0, 0, 100], [217, 0, 0, 100], [247, 0, 0, 100]}
      />
      <GeoJsonLayer
        id={'geojson-layer'}
        data={policePrecincts}
        stroked={true}
        wireframe={true}
        extruded={false}
        lineWidthScale={1}
        lineWidthMinPixels={3}
        filled={true}

        getFillColor={[255, 255, 255, 100]}
        getLineColor={[0, 0, 255, 255]}
        getLineWidth={3}
        opacity={1}
      />

      <StaticMap
        mapboxApiAccessToken={MAP_BOX_ACCESS_TOKEN}
        mapStyle={MAP_BOX_STYLE_ID}
        onLoad={onMapLoad}
      >

        <div className='mapboxgl-ctrl-bottom-right' style={{ position: "absolute", right: 30, top: 100, zIndex: 100 }}>
          <NavigationControl
            showCompass={false}
            captureScroll={true}
            style={navControlStyle}
            onViewportChange={viewport => {
              console.log('click')
              this.setState({ viewport })
            }} />
        </div>
      </StaticMap>
    </DeckGL>
  )
}

export default App