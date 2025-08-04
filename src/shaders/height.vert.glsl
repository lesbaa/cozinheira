varying vec3 vWorldPosition;
varying vec3 vPosition;
varying vec3 vNormal;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vPosition = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}