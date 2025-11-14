precision highp float;

uniform float uMaxValue;
uniform float uMinValue;
uniform bool uContour;
uniform vec4 uContourColor;
uniform bool uShowSlope;

uniform vec3 uPerimeterPoints[MAX_POLYGON_VERTICES];
uniform int uNumPerimeterPoints;
uniform sampler2D uColorRamp;

in vec3 vPosition;
in vec3 vNormal;

out vec4 outColor;

// Point in polygon test using the winding number algorithm.
// This is robust for simple, complex, and self-intersecting polygons.
bool isPointInPolygon2D(vec2 p, vec3 perimeterVertices[MAX_POLYGON_VERTICES], int numVertices) {
    if (numVertices < 3) {
        return false;
    }
    
    float totalAngle = 0.0;
    for (int i = 0; i < numVertices; ++i) {
        vec2 p1 = perimeterVertices[i].xz;
        vec2 p2 = perimeterVertices[(i + 1) % numVertices].xz;
        
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

   vec4 contourColorWithAlpha = vec4(uContourColor.r, uContourColor.g, uContourColor.b, 1.0);

    vec2 pointToTest = vPosition.xz;

    // if (uNumPerimeterPoints > 0 && !isPointInPolygon2D(pointToTest, uPerimeterPoints, uNumPerimeterPoints)) {
    //     discard;
    // }

    if (uShowSlope) {
      vec3 up = vec3(1.0, 0.0, 0.0);
      float slope = (1.0 - dot(abs(vNormal), up)) * 0.5;
      outColor = vec4(slope, slope, slope, 1.0);
      return;
    }

    float height = vPosition.y;
    float normalizedHeight = (height - uMinValue * 0.1) / (uMaxValue - uMinValue * 0.1) / 0.20 + 0.3;
    float contour = smoothstep(0.0001, 0.001, sin(vPosition.y * 20.0) * 0.5 + 0.5);

    vec4 color = texture2D(uColorRamp, vec2(0.5, 1.0 -normalizedHeight));

    outColor = mix(contourColorWithAlpha, color, uContour ? contour : 1.0);
}