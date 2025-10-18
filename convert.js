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

const featuresWithCorrectID = {
  ...featureData,
  features: featureData.features.map(feature => {
    return {
      ...feature,
      properties: {
        ...feature.properties,
        id: idGenerator.generate(),
      },
    }
  }),
}



fs.writeFileSync(path.join(import.meta.dirname, 'src/data/features.json'), JSON.stringify(featuresWithCorrectID, null, 2));

fs.writeFileSync(path.join(import.meta.dirname, 'src/data/cozinheira-multi-point.json'), JSON.stringify(out, null, 2));