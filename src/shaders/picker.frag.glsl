precision highp float;

uniform float uMaxAltitude;
uniform float uMinAltitude;
uniform float uOriginAltitude;
in vec3 vPosition;
out float outHeight;

void main() {
    float height = vPosition.y;
    float normalizedHeight = (height - uMinAltitude * 0.1) / (uMaxAltitude - uMinAltitude * 0.1) / 0.20 + 0.3;

    // outHeight = vec4(normalizedHeight, normalizedHeight, normalizedHeight, 1.0);
    outHeight = uOriginAltitude + height;
}