use wasm_bindgen::prelude::*;
// use naturalneighbor::{Point, Interpolator};
use rbf_interp::{Scatter,Basis};
use nalgebra::base::DVector;
use js_sys::{Float64Array};
use contour::{ContourBuilder};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use geo_types::geometry::Coord;

extern crate console_error_panic_hook;

#[derive(Serialize, Deserialize)]
struct OutputObject {
    contours: Vec<OutputLine>,
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
struct OutputLine {
    id: String,
    length: f64,
    elevation: f64,
    points: Vec<OutputPoint>,
}

#[derive(Serialize, Deserialize)]
struct OutputPoint {
    x: f64,
    y: f64,
    z: f64,
}

#[wasm_bindgen]
extern "C" {
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = window)]
    fn postMessage();
    #[wasm_bindgen(js_namespace = window)]
    fn notifyProgress(start: u32, stop: u32, message: &str);
    #[wasm_bindgen(js_namespace = window)]
    fn addLine(line: OutputLine);
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub fn interpolate_2D(data: Float64Array, canvas_w: u32, canvas_h: u32, thresholds: Float64Array) -> JsValue {
    const GRID_DENSITY: u32 = 16;
    let grid_w = canvas_w * GRID_DENSITY;
    let grid_h = canvas_h * GRID_DENSITY;

    init_panic_hook();
    // Create a vector of points from the input array.
    notifyProgress(0, 4, "Starting isolines calculation...");

    let mut points_struct: Vec<DVector<f64>> = Vec::new();
    let mut elevations: Vec<DVector<f64>> = Vec::new();

    notifyProgress(1, 4, "Preparing Data...");
    
    for i in 0..data.length() as i32 {
        if i % 3 == 0 {
            notifyProgress(i as u32, data.length(), "Preparing Data...");

            let x = data.at(i).unwrap() * GRID_DENSITY as f64;
            let y = data.at(i + 1).unwrap() * GRID_DENSITY as f64;
            let z = data.at(i + 2).unwrap();
            let d_vec = DVector::from_vec(vec![x.into(), y.into()]);
            points_struct.push(d_vec);
            elevations.push(DVector::from_vec(vec![z as f64]));
        }
    }

    // Create an interpolator from the points.
    let interpolator = Scatter::create(
        points_struct,
        elevations.clone(),
        Basis::PolyHarmonic(0),
        0 as usize
    );

    // Create a grid to store the interpolated values.
    let mut grid:Vec<f64> = Vec::new();

    // Interpolate the values at the grid points.
    let mut i: u32 = 0;

    notifyProgress(2, 4, "Interpolating...");

    for y in 0..(grid_h) {
        for x in 0..(grid_w) {
            let d_vec = interpolator
                .eval(DVector::from_vec(vec![x.into(), y.into()]));

            notifyProgress(y as u32, grid_w * grid_h, "Interpolating...");

            let unrwapped_value = d_vec[0];

            grid.push(unrwapped_value);
            let str_value = unrwapped_value.to_string();

            i += 1;
        }
    }

    let c = ContourBuilder::new(grid_w, grid_h, false)
        .x_step(1.0)
        .y_step(1.0);

    notifyProgress(2, 4, "Building Contours...");
    
    let res = c
        .lines(&grid, &float64_array_to_vec(thresholds))
        .unwrap();

    let mut out = OutputObject {
        contours: Vec::new(),
    };

    notifyProgress(3,5, "Preparing Output...");

    for i in 0..res.len() {
        let contour_line = &res[i];
        let multiline_string = contour_line.geometry();
        
        for linestring in multiline_string.iter() {
            let mut line = OutputLine {
                id: Uuid::new_v4().to_string(),
                points: Vec::new(),
                elevation: 0.0,
                length: 0.0,
            };

            let mut async_line = OutputLine {
                id: Uuid::new_v4().to_string(),
                points: Vec::new(),
                elevation: 0.0,
                length: 0.0,
            };

            let mut last_coord: Coord = *linestring.coords().next().unwrap();

            line.elevation = contour_line.threshold();
            async_line.elevation = contour_line.threshold();
            let elevation = line.elevation;
            for (j, coord) in linestring.coords().enumerate() {
                notifyProgress(i as u32, res.len() as u32, "Preparing Output...");
                let distance = distance_between_coords(last_coord, *coord);
                line.length += distance;
                last_coord = *coord;
                line.points.push({
                    OutputPoint {
                        x: coord.x / GRID_DENSITY as f64,
                        y: coord.y / GRID_DENSITY as f64,
                        z: elevation,
                    }
                });
                async_line.id = line.id.clone();
                async_line.length += distance;

                async_line.points.push({
                    OutputPoint {
                        x: coord.x / GRID_DENSITY as f64,
                        y: coord.y / GRID_DENSITY as f64,
                        z: elevation,
                    }
                });
            }

            out.contours.push(line);
        }

    }

    notifyProgress(4, 4, "Done...");

    return serde_wasm_bindgen::to_value(&out).unwrap();
}

fn distance_between_coords(coord1: Coord, coord2: Coord) -> f64 {
    let x_diff = coord1.x - coord2.x;
    let y_diff = coord1.y - coord2.y;
    (x_diff.powi(2) + y_diff.powi(2)).sqrt()
}

fn float64_array_to_vec(array: Float64Array) -> Vec<f64> {
    let mut result = Vec::with_capacity(array.length() as usize);

    // Iterate over the elements of the Float64Array
    for i in 0..array.length() {
        result.push(array.get_index(i));
    }

    result
}

