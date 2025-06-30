varying vec3 vWorldPosition;
varying vec3 vPosition;

void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}