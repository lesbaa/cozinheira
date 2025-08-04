#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const currentData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'src/data/cozinheira-multi-point.json'), 'utf8'));
const multipointPoints = currentData.features.find(feature => feature.properties.name === 'topography').geometry.coordinates.map(point => point.join());

const topographyData = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'src/raw-data/topography.json'), 'utf8'));
const topoPoints = topographyData.features.map(feature => feature.geometry.coordinates.join());

// ignore all the shit in here...
const out = {}

fs.writeFileSync(path.join(import.meta.dirname, 'src/raw-data/topography-1.json'), JSON.stringify(out, null, 2));