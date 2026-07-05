import * as THREE from 'three';

// Setup basic scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Add lighting - Softer, more elegant lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
directionalLight1.position.set(5, 5, 5);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0x8cb5ff, 1); // Subtle blue rim light
directionalLight2.position.set(-5, -5, -5);
scene.add(directionalLight2);

// Formal Background for Refraction
// Replacing ugly neon colors with sleek, dark, formal colors: deep midnight blues, slate grays, muted purples
const bgGroup = new THREE.Group();
const colors = [0x0a1128, 0x1c2541, 0x3a506b, 0x0f172a, 0x1e1e24];
const bgObjects = [];

for (let i = 0; i < 5; i++) {
    const bgMat = new THREE.MeshPhysicalMaterial({
        color: colors[i],
        roughness: 0.8,
        metalness: 0.2
    });
    // Larger, smoother background elements
    const bgGeo = new THREE.SphereGeometry(4, 64, 64);
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        -12 - Math.random() * 8
    );
    bgGroup.add(bgMesh);
    bgObjects.push({
        mesh: bgMesh,
        offsetX: Math.random() * Math.PI * 2,
        offsetY: Math.random() * Math.PI * 2
    });
}
scene.add(bgGroup);

// Setup Glass Material (Formal Liquid Glassmorphism)
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.02, // Clearer glass
    transmission: 1.0, // Fully transmissive
    thickness: 2.0, // Elegant thickness
    ior: 1.52, // Glass IOR
    dispersion: 0.5, // Reduced dispersion for a more formal look (less rainbow, more pure)
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.0,
});

// Setup Geometry: A soft, morphing sphere for the "liquid" feel
const geometry = new THREE.IcosahedronGeometry(2, 64);
const mesh = new THREE.Mesh(geometry, glassMaterial);
scene.add(mesh);

// Save the original vertices for animation (morphing)
const originalPositions = geometry.attributes.position.clone();

// Scroll and Animation Variables
let targetScroll = 0;
let currentScroll = 0;

window.addEventListener('scroll', () => {
    // Calculate total scrollable height
    const scrollableHeight = document.body.scrollHeight - window.innerHeight;
    if (scrollableHeight > 0) {
        targetScroll = window.scrollY / scrollableHeight;
    }
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Smooth scroll interpolation
    currentScroll += (targetScroll - currentScroll) * 0.05;

    // Rotate glass object smoothly based on scroll and time
    mesh.rotation.x = currentScroll * Math.PI * 2 + time * 0.05;
    mesh.rotation.y = currentScroll * Math.PI * 2 + time * 0.08;

    // Scale object slightly based on scroll for dramatic effect
    const targetScale = 1 + Math.sin(currentScroll * Math.PI) * 0.3;
    mesh.scale.set(targetScale, targetScale, targetScale);

    // Animate vertices for a "liquid" flowing effect (Formal / Calmer flow)
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for ( let i = 0; i < positionAttribute.count; i ++ ) {
        vertex.fromBufferAttribute( originalPositions, i );

        // Slower, smoother wave equations
        const wave1 = Math.sin(vertex.x * 1.2 + time * 0.3) * 0.08;
        const wave2 = Math.cos(vertex.y * 1.2 + time * 0.4) * 0.08;
        const wave3 = Math.sin(vertex.z * 1.2 + time * 0.5 + currentScroll * Math.PI) * 0.08;

        // Distortion scales subtly with scroll
        const distortionAmount = 0.5 + currentScroll * 0.8;

        vertex.multiplyScalar(1 + (wave1 + wave2 + wave3) * distortionAmount);

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;

    // Animate background objects (Slow, floating blobs)
    bgObjects.forEach((obj) => {
        obj.mesh.position.y += Math.sin(time * 0.1 + obj.offsetY) * 0.005;
        obj.mesh.position.x += Math.cos(time * 0.1 + obj.offsetX) * 0.005;
        obj.mesh.rotation.x += 0.001;
        obj.mesh.rotation.y += 0.001;
    });

    renderer.render(scene, camera);
}

animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
