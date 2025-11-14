in vec3 vWorldPosition;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;

out vec4 outColor;

void main() {
    vec4 color = texture2D(uTexture, vPosition.xy);
    outColor = color;
}