import fs from 'fs';
import path from 'path';

const geojson = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'public/cozinheira.json'), 'utf8'));

const points = geojson.features.map(feature => feature.geometry.coordinates);

const out = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'MultiPoint',
        coordinates: points,
      },
    },
  ]
}

fs.writeFileSync(path.join(import.meta.dirname, 'public/cozinheira-multi-point.geojson'), JSON.stringify(out, null, 2));