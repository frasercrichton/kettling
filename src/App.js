import React, { useState, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { TRANSITION_EVENTS } from 'deck.gl';
import { GeoJsonLayer } from '@deck.gl/layers';
import { GridLayer, HeatmapLayer } from '@deck.gl/aggregation-layers';
import { LinearInterpolator } from '@deck.gl/core';
import mapboxgl from 'mapbox-gl'
import { _MapContext as MapContext, StaticMap } from 'react-map-gl'
import './App.css';

import policePrecincts from './Police_Districts.geojson';
import arrestData from './arrest-data.json'
import curfewViolationArrestData from './curfew-violation-arrest-data.json'

// const cloudfrontUrl = 'https://d3bun1a589g4ul.cloudfront.net/data/'

// eslint-disable-next-line import/no-webpack-loader-syntax
mapboxgl.workerClass = require('worker-loader!mapbox-gl/dist/mapbox-gl-csp-worker').default

const MAP_BOX_ACCESS_TOKEN = process.env.REACT_APP_MAP_LEAFLET_KEY
const MAP_BOX_STYLE_ID = process.env.REACT_APP_MAP_BOX_STYLE_ID
const minZoom = 11
const zoom = 10
const zoomTarget = 12
const opactity = 255
const curfew_opactity = 155
// const navControlStyle = {
//   right: 10,
//   top: 2,
//   zIndex: 10
// }

const heatmapColourRange = [
  [0, 191, 255, opactity],
  [8, 146, 208, opactity],
  [0, 115, 207, opactity],
  [21, 96, 189, opactity],
  [0, 96, 205, opactity]
]


const curfewViolationColourRange = [
  [0, 0, 189, curfew_opactity],
  [0, 0, 205, curfew_opactity]
]

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
      if (interactionState === undefined) {

        return

      }
      const { isDragging, isPanning, isRotating, isZooming } = interactionState
      if (isDragging || isPanning || isRotating || isZooming) {
        setInitialViewState((viewState) => ({
          ...viewState,
          transitionDuration: 0,
          transitionInterpolator,
          onTransitionEnd: rotateCamera,
          transitionInterruption: TRANSITION_EVENTS.IGNORE
        }))
      }
    },
    [rotateCamera]
  )

  const onMapLoad = useCallback(() => {
    rotateCamera()
  }, [rotateCamera])
  return (
    <div>
      <DeckGL
        ContextProvider={MapContext.Provider}
        initialViewState={initialViewState}
        onViewStateChange={onViewStateChange}
        controller={{ ...settings }}
        onLoad={onMapLoad}
      >
        <HeatmapLayer
          id='HeatmapLayer'
          data={arrestData}
          // aggregation='SUM'
          pickable={false}
          colorRange={heatmapColourRange}
          getPosition={(d) => d.COORDINATES}
          getWeight={(d) => d.count}
          radiusPixels={100}
          debounceTimeout={100000}
        // intensity={ (initialViewState.zoom * 1)}

        // updateTriggers={ {
        //   intensity: [initialViewState.zoom]
        // }}
        />
        <GridLayer
          id='GridLayer'
          data={curfewViolationArrestData}
          pickable={true}
          extruded={true}
          cellSize={200}
          colorRange={curfewViolationColourRange}
          // coverage={2}
          elevationScale={5}
          getPosition={(d) => d.COORDINATES}
          getElevationValue={(points) => points.reduce((max, p) => p.count > max ? p.count : max, -Infinity)}
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
          getFillColor={[255, 255, 255, 50]}
          getLineColor={[0, 0, 255, 255]}
          getLineWidth={3}
          opacity={1}
        />
        <StaticMap
          mapboxApiAccessToken={MAP_BOX_ACCESS_TOKEN}
          mapStyle={MAP_BOX_STYLE_ID}
        />
        {/* <div className='mapboxgl-ctrl-bottom-right' style={{ position: "absolute", right: 30, top: 100, zIndex: 100 }}>
        <NavigationControl
          showCompass={false}
          // captureScroll={true}
          style={navControlStyle}
        />
      </div> */}
      </DeckGL>

      <div className='info-panel'>
        <div className='info-panel-heading'>Unrest-Related Arrests Washington DC</div>
        <p>Arrests by location  Curfew Violation police precincts</p>
        <p>
          Datasource: <a href="https://mpdc.dc.gov/page/may-2020-april-2021-unrest-related-arrests-and-persons-interest">May 2020-April 2021 Unrest-Related Arrests and Persons of Interest</a>
        </p>
        <div className="metrics-layout">
          <div className="info-panel-metrics">
            No. of Charges (742 individuals):
            <div className="info-panel-metrics">
              <strong>1 027</strong>
            </div>
          </div>
          <div className="info-panel-metrics">
            No. of Curfew Violation Arrests:
            <div className="info-panel-metrics">
              <strong>393</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App