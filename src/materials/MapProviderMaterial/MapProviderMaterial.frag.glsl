in vec3 vWorldPosition;
in vec3 vPosition;
in vec3 vNormal;

uniform sampler2D uTexture;

void main() {
    vec4 color = texture(uTexture, vPosition);
    gl_FragColor = color;
}