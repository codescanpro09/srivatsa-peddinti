import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Setup basic scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
// document.body.appendChild(renderer.domElement);
const container = document.getElementById('canvas-container');
if(container) {
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
}

// Add lighting - Softer, more elegant lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 2);
directionalLight1.position.set(5, 5, 5);
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0x8cb5ff, 1); // Subtle blue rim light
directionalLight2.position.set(-5, -5, -5);
scene.add(directionalLight2);

// Setup Environment Map for realistic glass reflections
new RGBELoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/equirectangular/royal_esplanade_1k.hdr', function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
});

// Premium Background for Refraction
const bgGroup = new THREE.Group();
const colors = [0x8A2387, 0xE94057, 0xF27121, 0x00d2ff, 0x3a7bd5];
const bgObjects = [];

for (let i = 0; i < 5; i++) {
    const bgMat = new THREE.MeshBasicMaterial({
        color: colors[i]
    });
    const bgGeo = new THREE.SphereGeometry(6, 64, 64);
    const bgMesh = new THREE.Mesh(bgGeo, bgMat);
    bgMesh.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        -15 - Math.random() * 10
    );
    bgGroup.add(bgMesh);
    bgObjects.push({
        mesh: bgMesh,
        offsetX: Math.random() * Math.PI * 2,
        offsetY: Math.random() * Math.PI * 2,
        baseX: bgMesh.position.x,
        baseY: bgMesh.position.y
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
    dispersion: 0.0, // Reduced dispersion for a more formal look
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

    // Animate background objects
    bgObjects.forEach((obj) => {
        obj.mesh.position.x = obj.baseX + Math.sin(time * 0.2 + obj.offsetX) * 5;
        obj.mesh.position.y = obj.baseY + Math.cos(time * 0.15 + obj.offsetY) * 5;
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

// Intersection Observer for fade-in animations on scroll
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            entry.target.classList.add('visible');
            obs.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-in').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    observer.observe(element);
});
