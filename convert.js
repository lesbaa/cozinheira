#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

import * as turf from '@turf/turf';

// const args = process.argv.slice(2);

const topographyData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'src/raw-data/topography.json'), 'utf8'));
const originBoundaryData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'src/raw-data/origin-boundary.json'), 'utf8'));
const featureData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'src/raw-data/features.json'), 'utf8'));

const boundaryData = turf.featureCollection(topographyData.features);

const points = topographyData.features.map(feature => feature.geometry.coordinates);

const featureCoordinatesWithValidAltitude = featureData.features.filter(feature => { 
  const featureCoordinates = feature.geometry.coordinates;
  const isDefined = featureCoordinates.length === 3;
  const isNotNull = featureCoordinates[2] !== null;
  const isNotZero = featureCoordinates[2] !== 0;
  return isDefined && isNotNull && isNotZero;
}).map(feature => feature.geometry.coordinates);

const out = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {
        name: 'topography',
      },
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          ...points,
          ...featureCoordinatesWithValidAltitude,
        ],
      },
    },
    ...originBoundaryData.features,
  ],
}

class IdGenerator {
  constructor() {
    this.id = 0;
  }
  generate() {
    return this.id++;
  }
}

const idGenerator = new IdGenerator();

const carvp = [
  277
]

const oliv = [
  287,
  360,
  285,
  284,
  286,
  280,
  281,
  306,
  355,
  357,
  278,
  279,
  364, // STUMP
  363,
  362, // STUMP
  290,
  304,
  301,
  317,
  305,
  303,
  302,
  291,
  289,
  288,
  292,
  300,
  366,
  367,
  356,
  322,
  359,
  320,
  321,
  323,
  324,
  325,
  326,
  327,
  318,
  319,
  369,
  352,
  353,
  368,
  299,
  297,
  294,
  351,
  296,
  298,
  295,
]

const remove = [
  365
]

const counts = {}

const featuresWithCorrectID = {
  ...featureData,
  features: featureData.features.map(feature => {
    const id = idGenerator.generate();

    if (carvp.includes(feature.properties.id)) {
      if (feature.properties.featureType !== 'UNKNOWN') {
        console.warn(`Feature ${feature.properties.id} already has a feature type other than UNKNOWN: ${feature.properties.featureType}`);
      }

      const featureType = feature.properties.featureType === 'UNKNOWN'
        ? 'CARVP'
        : feature.properties.featureType;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          description: featureType,
          name: featureType,
          featureType,
          id,
        },
      }
    }

    if (oliv.includes(feature.properties.id)) {
      if (feature.properties.featureType !== 'UNKNOWN') {
        console.warn(`Feature ${feature.properties.id} already has a feature type other than UNKNOWN: ${feature.properties.featureType}`);
      }

      const featureType = feature.properties.featureType === 'UNKNOWN'
        ? 'OLIVEIRA'
        : feature.properties.featureType;

      return {
        ...feature,
        properties: {
          ...feature.properties,
          description: featureType,
          name: featureType,
          featureType,
          id,
        },
      }
    }

    if (counts[feature.properties.featureType]) {
      counts[feature.properties.featureType]++;
    } else {
      counts[feature.properties.featureType] = 1;
    }

    return {
      ...feature,
      properties: {
        ...feature.properties,
        id,
      },
    }
  }).filter(feature => !remove.includes(feature.properties.id)),
}

console.table(counts);



fs.writeFileSync(path.join(import.meta.dirname, 'src/data/features.json'), JSON.stringify(featuresWithCorrectID, null, 2));

fs.writeFileSync(path.join(import.meta.dirname, 'src/data/cozinheira-multi-point.json'), JSON.stringify(out, null, 2));