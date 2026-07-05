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

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// Background objects for refraction - to create the "Apple style clear liquid" we need colorful, blurry shapes
const bgGroup = new THREE.Group();
// Neocities site colors (Cyan, Blue, Purple)
const colors = [0x00d9ff, 0x0044ff, 0xaa00ff, 0x051025, 0x0088ff];
const bgObjects = [];

for (let i = 0; i < 5; i++) {
    const bgMat = new THREE.MeshBasicMaterial({
        color: colors[i],
    });
    // Create large planes or spheres to fill the background
    const bgGeo = new THREE.SphereGeometry(3, 64, 64);
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        -10 - Math.random() * 5
    );
    bgGroup.add(bgMesh);
    bgObjects.push({
        mesh: bgMesh,
        speedX: (Math.random() - 0.5) * 0.01,
        speedY: (Math.random() - 0.5) * 0.01,
        offsetX: Math.random() * Math.PI * 2,
        offsetY: Math.random() * Math.PI * 2
    });
}
scene.add(bgGroup);

// Setup Glass Material (Liquid Glassmorphism)
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 1.0, // glass-like fully transmissive
    thickness: 2.5, // thickness of the glass
    ior: 1.5, // index of refraction (glass)
    dispersion: 1.2, // chromatic aberration
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.0,
});

// Setup Geometry: A soft, morphing sphere for the "liquid" feel
// Using an Icosahedron as it provides a good base for subdivision/distortion
const geometry = new THREE.IcosahedronGeometry(2, 64);
const mesh = new THREE.Mesh(geometry, glassMaterial);
scene.add(mesh);

// Save the original vertices for animation (morphing)
const originalPositions = geometry.attributes.position.clone();

// Scroll and Animation Variables
let targetScroll = 0;
let currentScroll = 0;

window.addEventListener('scroll', () => {
    // targetScroll will be between 0 and 1
    targetScroll = window.scrollY / (document.body.scrollHeight - window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Smooth scroll interpolation
    currentScroll += (targetScroll - currentScroll) * 0.05;

    // Rotate glass object based on scroll and time
    mesh.rotation.x = currentScroll * Math.PI * 2 + time * 0.1;
    mesh.rotation.y = currentScroll * Math.PI * 2 + time * 0.15;

    // Scale object slightly based on scroll
    const targetScale = 1 + currentScroll * 0.5;
    mesh.scale.set(targetScale, targetScale, targetScale);

    // Animate vertices for a "liquid" flowing effect
    const positionAttribute = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    // Deform geometry based on noise/sine waves to look like liquid
    for ( let i = 0; i < positionAttribute.count; i ++ ) {
        vertex.fromBufferAttribute( originalPositions, i );

        // Complex wave combining time and scroll position
        const wave1 = Math.sin(vertex.x * 1.5 + time * 0.5) * 0.1;
        const wave2 = Math.cos(vertex.y * 1.5 + time * 0.8) * 0.1;
        const wave3 = Math.sin(vertex.z * 1.5 + time * 1.2 + currentScroll * Math.PI * 2) * 0.1;

        // The liquid gets more distorted as you scroll
        const distortionAmount = 0.8 + currentScroll * 1.5;

        vertex.multiplyScalar(1 + (wave1 + wave2 + wave3) * distortionAmount);

        positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.computeVertexNormals();
    positionAttribute.needsUpdate = true;

    // Animate background objects (floating blobs)
    bgObjects.forEach((obj) => {
        obj.mesh.position.y += Math.sin(time * 0.2 + obj.offsetY) * 0.02;
        obj.mesh.position.x += Math.cos(time * 0.2 + obj.offsetX) * 0.02;

        // Gentle rotation
        obj.mesh.rotation.x += 0.005;
        obj.mesh.rotation.y += 0.005;
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
