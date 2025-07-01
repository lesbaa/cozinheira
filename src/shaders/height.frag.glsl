precision highp float;

uniform float uMaxAltitude;
uniform float uMinAltitude;
uniform bool uContour;
uniform vec3 uPolygonPoints[MAX_POLYGON_VERTICES];
uniform int uNumPolygonPoints;
uniform sampler2D uColorRamp;

varying vec3 vWorldPosition;
varying vec3 vPosition;

// Point in polygon test using the winding number algorithm.
// This is robust for simple, complex, and self-intersecting polygons.
bool isPointInPolygon2D(vec2 p, vec3 polygonVertices[MAX_POLYGON_VERTICES], int numVertices) {
    if (numVertices < 3) {
        return false;
    }
    
    float totalAngle = 0.0;
    for (int i = 0; i < numVertices; ++i) {
        vec2 p1 = polygonVertices[i].xz;
        vec2 p2 = polygonVertices[(i + 1) % numVertices].xz;
        
        vec2 v1 = p1 - p;
        vec2 v2 = p2 - p;
        
        totalAngle += atan(v1.x * v2.y - v1.y * v2.x, v1.x * v2.x + v1.y * v2.y);
    }
    
    // A point is inside if the total angle is 2*PI or -2*PI
    return abs(totalAngle) > 3.14159; // Using PI avoids precision issues with 2*PI
}

void main() {
    // Since we know the polygon and terrain lie on the XZ plane,
    // we can perform a simple 2D check using the .xz components.
    vec2 pointToTest = vPosition.xz;

    if (uNumPolygonPoints > 0 && !isPointInPolygon2D(pointToTest, uPolygonPoints, uNumPolygonPoints)) {
        discard;
    }

    float height = vPosition.y;
    float normalizedHeight = (height - uMinAltitude * 0.1) / (uMaxAltitude - uMinAltitude * 0.1) / 0.20 + 0.3;
    float contour = step(0.001, sin(vPosition.y * 20.0) * 0.5 + 0.5);

    vec4 color = texture2D(uColorRamp, vec2(0.5, 1.0 -normalizedHeight));

    float value = uContour ? min(normalizedHeight, contour) : normalizedHeight;

    gl_FragColor = color;
}