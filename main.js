import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Setup basic scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Pure black background

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 20); // Moved back to see the cluster

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

const container = document.getElementById('canvas-container');
if(container) {
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
}

// Setup Environment Map for realistic glass reflections
new RGBELoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// Add lighting - Crucial for the deep blue and dispersive highlights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Intense directional light to cast strong highlights
const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Deep blue point light inside the cluster to give the core color
const blueLight = new THREE.PointLight(0x0044ff, 50, 50);
blueLight.position.set(0, -2, 0);
scene.add(blueLight);

// Colorful lights around the scene to create the "rainbow" dispersion effect on the edges
const pinkLight = new THREE.PointLight(0xff00aa, 20, 30);
pinkLight.position.set(-8, 5, -5);
scene.add(pinkLight);

const cyanLight = new THREE.PointLight(0x00ffff, 20, 30);
cyanLight.position.set(8, 5, -5);
scene.add(cyanLight);

// Setup Glass Material for Pillars
const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe0eaff, // Very light blue tint
    metalness: 0.1,
    roughness: 0.05,
    transmission: 1.0, // Fully transmissive glass
    thickness: 2.5, // High thickness for strong refraction
    ior: 1.6, // Glass IOR
    dispersion: 3.0, // High dispersion for rainbow artifacts on edges
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.5,
    attenuationColor: new THREE.Color(0x002288), // Deep blue attenuation (absorbs other colors)
    attenuationDistance: 4.0
});

// Create the cluster of pillars
const pillarGroup = new THREE.Group();
const pillars = [];

// Layout grid parameters
const gridX = 5;
const gridZ = 5;
const spacing = 1.2;

// Box geometry for the pillars
const geometry = new THREE.BoxGeometry(1, 1, 1);

for (let x = 0; x < gridX; x++) {
    for (let z = 0; z < gridZ; z++) {
        // Skip some corners to make it look like an organic cluster
        if ((x === 0 && z === 0) || (x === gridX-1 && z === 0) ||
            (x === 0 && z === gridZ-1) || (x === gridX-1 && z === gridZ-1)) {
            if (Math.random() > 0.5) continue;
        }

        const mesh = new THREE.Mesh(geometry, glassMaterial);

        // Calculate position
        const posX = (x - gridX / 2) * spacing;
        const posZ = (z - gridZ / 2) * spacing;

        // Distance from center dictates base height (taller in middle)
        const distFromCenter = Math.sqrt(posX*posX + posZ*posZ);
        const baseHeight = Math.max(2, 10 - distFromCenter * 1.5);

        // Add some random variation to height
        const height = baseHeight + (Math.random() - 0.5) * 4;

        mesh.scale.set(1, height, 1);
        mesh.position.set(posX, height / 2 - 4, posZ); // Centered vertically

        pillarGroup.add(mesh);

        // Store original data for animation
        pillars.push({
            mesh: mesh,
            baseY: height / 2 - 4,
            randomOffset: Math.random() * Math.PI * 2,
            gridX: x,
            gridZ: z
        });
    }
}

// Tilt the whole group slightly forward to match perspective of the image
pillarGroup.rotation.x = 0.2;
pillarGroup.rotation.y = -0.5;
scene.add(pillarGroup);


// Scroll and Animation Variables
let targetScroll = 0;
let currentScroll = 0;

window.addEventListener('scroll', () => {
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

    // Rotate entire cluster based on scroll
    pillarGroup.rotation.y = -0.5 + currentScroll * Math.PI;

    // Slight continuous rotation for life
    pillarGroup.rotation.y += time * 0.05;

    // Animate pillars (slow wave effect)
    pillars.forEach((p) => {
        // Wave based on time and position in grid
        const wave = Math.sin(time * 0.5 + p.gridX * 0.5 + p.gridZ * 0.5) * 0.5;
        p.mesh.position.y = p.baseY + wave;
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

// Custom Cursor Implementation
const cursorDot = document.querySelector('.cursor-dot');
const cursorOutline = document.querySelector('.cursor-outline');

if (cursorDot && cursorOutline) {
    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    const interactives = document.querySelectorAll('a, button, .why-card');

    interactives.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.style.width = '80px';
            cursorOutline.style.height = '80px';
            cursorOutline.style.backgroundColor = 'rgba(0, 170, 255, 0.1)';
            cursorOutline.style.borderColor = '#00aaff';
        });

        el.addEventListener('mouseleave', () => {
            cursorOutline.style.width = '40px';
            cursorOutline.style.height = '40px';
            cursorOutline.style.backgroundColor = 'transparent';
            cursorOutline.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        });
    });
}
