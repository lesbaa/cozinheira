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
        coordinates: points,
      },
    },
    ...originBoundaryData.features,
  ],
}
fs.writeFileSync(path.join(import.meta.dirname, 'src/data/features.json'), JSON.stringify(featureData, null, 2));

fs.writeFileSync(path.join(import.meta.dirname, 'src/data/cozinheira-multi-point.json'), JSON.stringify(out, null, 2));