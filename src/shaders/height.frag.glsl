uniform float uMaxAltitude;
uniform float uMinAltitude;
uniform bool uContour;
uniform vec3 uPolygonPoints[MAX_POLYGON_VERTICES];
uniform int uNumPolygonPoints;
uniform vec3 uPolygonPlaneNormal;
uniform vec3 uPolygonPlaneOrigin; // A point on the polygon's plane

varying vec3 vWorldPosition;
varying vec3 vPosition;

// Function to project a 3D point onto a plane
vec3 projectPointToPlane(vec3 point, vec3 planeNormal, vec3 planeOrigin) {
    vec3 vecToPlane = point - planeOrigin;
    float dist = dot(vecToPlane, planeNormal);
    return point - dist * planeNormal;
}

// Function to transform 3D points to a 2D local coordinate system on the plane
// This is crucial for the 2D point-in-polygon test
// You need to define two orthogonal basis vectors for your plane.
// E.g., tangent and bitangent, derived from the polygon's first edge and normal.
// For simplicity, let's assume XY plane for now, but you'll adapt it.
// A robust way: Gram-Schmidt orthogonalization for basis vectors.
// For a plane with normal N, pick arbitrary non-collinear vector V (e.g., (1,0,0) or (0,1,0)).
// U = normalize(cross(N, V)); // First basis vector
// W = normalize(cross(N, U)); // Second basis vector, orthogonal to N and U
// Then project and express in U,W basis.

// A simple 2D point-in-convex-polygon test (ray casting/winding number is more general for concave)
// This version is for a convex polygon, assuming consistent winding (e.g., CCW)
bool isPointInConvexPolygon2D(vec2 p, vec2[MAX_POLYGON_VERTICES] polygonVertices2D, int numVertices) {
    bool inside = true;
    for (int i = 0; i < numVertices; i++) {
        vec2 p1 = polygonVertices2D[i];
        vec2 p2 = polygonVertices2D[(i + 1) % numVertices];

        // 2D cross product: (x1*y2 - y1*x2)
        // Checks if point p is on the "left" side of directed edge p1->p2 (for CCW polygon)
        // If any cross product is negative, the point is outside.
        if ((p2.x - p1.x) * (p.y - p1.y) - (p2.y - p1.y) * (p.x - p1.x) < 0.0) {
            inside = false;
            break;
        }
    }
    return inside;
}

void main() {
    // 1. Project the fragment's world position onto the polygon's plane
    vec3 projectedFragPos3D = projectPointToPlane(vWorldPosition, uPolygonPlaneNormal, uPolygonPlaneOrigin);

    // 2. Define a local 2D coordinate system on the plane and project polygon vertices and fragment position into it.
    // This is the trickiest part. You need two orthonormal basis vectors (uBasis, vBasis) for the plane.
    vec3 uBasis, vBasis;
    // Calculate basis vectors. Handle edge cases if normal is aligned with axes.
    if (abs(uPolygonPlaneNormal.x) > 0.9) { // Normal mostly along X
        uBasis = normalize(cross(uPolygonPlaneNormal, vec3(0.0, 1.0, 0.0)));
    } else { // Normal not mostly along X
        uBasis = normalize(cross(uPolygonPlaneNormal, vec3(1.0, 0.0, 0.0)));
    }
    vBasis = cross(uPolygonPlaneNormal, uBasis); // Already orthogonal and length 1 if uBasis is.

    vec2 projectedFragPos2D;
    vec3 fragVec = projectedFragPos3D - uPolygonPlaneOrigin;
    projectedFragPos2D.x = dot(fragVec, uBasis);
    projectedFragPos2D.y = dot(fragVec, vBasis);

    // Project polygon vertices to 2D
    vec2 polygonVertices2D[MAX_POLYGON_VERTICES];
    for (int i = 0; i < uNumPolygonPoints; i++) {
        vec3 polyPointVec = uPolygonPoints[i] - uPolygonPlaneOrigin;
        polygonVertices2D[i].x = dot(polyPointVec, uBasis);
        polygonVertices2D[i].y = dot(polyPointVec, vBasis);
    }

    // 3. Perform 2D point-in-polygon test
    if (!isPointInConvexPolygon2D(projectedFragPos2D, polygonVertices2D, uNumPolygonPoints)) {
        discard; // Discard fragment if it's outside the polygon
    }

    float height = vPosition.y;
    float normalizedHeight = (height - uMinAltitude * 0.1) / (uMaxAltitude - uMinAltitude * 0.1) / 0.20 + 0.3;
    float contour = step(0.001, sin(vPosition.y * 20.0) * 0.5 + 0.5);

    float value = uContour ? min(normalizedHeight, contour) : normalizedHeight;

    gl_FragColor = vec4(value, value, value, 1.0);
}