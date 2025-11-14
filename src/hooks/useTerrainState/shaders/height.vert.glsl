// out vec3 vWorldPosition;
out vec3 vPosition;
// out vec3 vNormal;

void main() {
    // vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vPosition = position;
    // vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}