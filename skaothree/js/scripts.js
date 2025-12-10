// import { OrbitControls } from '../../javascript/orbit.js';
// import * as THREE from '../../javascript/three3.js';

// // Textures
// var starsTexture = './img/stars.jpg';
// var sunTexture = './img/sun.jpg';
// var mercuryTexture = './img/mercury.jpg';
// var venusTexture = './img/venus.jpg';
// var earthTexture = './img/earth.jpg';
// var marsTexture = './img/mars.jpg';
// var jupiterTexture = './img/jupiter.jpg';
// var saturnTexture = './img/saturn.jpg';
// var saturnRingTexture = './img/saturn ring.png';
// var uranusTexture = './img/uranus.jpg';
// var uranusRingTexture = './img/uranus ring.png';
// var neptuneTexture = './img/neptune.jpg';
// var plutoTexture = './img/pluto.jpg';
// var moonTexture = './img/pluto.jpg';

// const renderer = new THREE.WebGLRenderer({
//   antialias: true,
//   canvas: document.querySelector("canvas")
// });
// renderer.setSize(window.innerWidth, window.innerHeight);

// const scene = new THREE.Scene();

// const camera = new THREE.PerspectiveCamera(
//   45,
//   window.innerWidth / window.innerHeight,
//   0.1,
//   1000
// );
// camera.position.set(-90, 140, 140);

// // Orbit controls
// const orbit = new OrbitControls(camera, renderer.domElement);
// // Enable damping for smoother orbit/zoom
// orbit.enableDamping = true;
// orbit.dampingFactor = 0.05;

// // Allow free panning in screen space
// orbit.enablePan = true;
// orbit.screenSpacePanning = true;

// // Restrict how close/far we can zoom
// orbit.minDistance = 30;
// orbit.maxDistance = 300;

// // Allow full 360° horizontal rotation
// orbit.minAzimuthAngle = -Infinity;
// orbit.maxAzimuthAngle = Infinity;

// // Allow going “above/below” the poles; set this to Math.PI for a typical 180° vertical range
// orbit.minPolarAngle = 0;
// orbit.maxPolarAngle = Math.PI; // or 2 * Math.PI if you truly want to flip upside down

// orbit.update();

// // Ambient light
// const ambientLight = new THREE.AmbientLight(0x333333);
// scene.add(ambientLight);

// const textureLoader = new THREE.TextureLoader();

// // Create a star-sphere instead of using scene.background 
// const starGeo = new THREE.SphereGeometry(500, 64, 64);
// const starMat = new THREE.MeshBasicMaterial({
//   map: textureLoader.load(starsTexture),
//   side: THREE.BackSide
// });
// const starMesh = new THREE.Mesh(starGeo, starMat);
// scene.add(starMesh);

// // Create the Sun
// const sunGeo = new THREE.SphereGeometry(16, 30, 30);
// const sunMat = new THREE.MeshBasicMaterial({
//   map: textureLoader.load(sunTexture)
// });
// const sun = new THREE.Mesh(sunGeo, sunMat);
// scene.add(sun);

// // Utility function to create a planet
// function createPlanete(size, texture, position, ring) {
//   const geo = new THREE.SphereGeometry(size, 30, 30);
//   const mat = new THREE.MeshStandardMaterial({
//     map: textureLoader.load(texture)
//   });
//   const mesh = new THREE.Mesh(geo, mat);
//   const obj = new THREE.Object3D();
//   obj.add(mesh);
//   if (ring) {
//     const ringGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 32);
//     const ringMat = new THREE.MeshBasicMaterial({
//       map: textureLoader.load(ring.texture),
//       side: THREE.DoubleSide
//     });
//     const ringMesh = new THREE.Mesh(ringGeo, ringMat);
//     obj.add(ringMesh);
//     ringMesh.position.x = position;
//     ringMesh.rotation.x = -0.5 * Math.PI;
//   }
//   scene.add(obj);
//   mesh.position.x = position;
//   return { mesh, obj };
// }

// // Create the planets
// const mercury = createPlanete(3.2, mercuryTexture, 28);
// const venus = createPlanete(5.8, venusTexture, 44);
// const earth = createPlanete(6, earthTexture, 62);
// const mars = createPlanete(4, marsTexture, 78);
// const jupiter = createPlanete(12, jupiterTexture, 100);
// const saturn = createPlanete(10, saturnTexture, 138, {
//   innerRadius: 10,
//   outerRadius: 20,
//   texture: saturnRingTexture
// });
// const uranus = createPlanete(7, uranusTexture, 176, {
//   innerRadius: 7,
//   outerRadius: 12,
//   texture: uranusRingTexture
// });
// const neptune = createPlanete(7, neptuneTexture, 200);
// const pluto = createPlanete(2.8, plutoTexture, 216);

// // Moon
// const moonOrbit = new THREE.Object3D();
// earth.obj.add(moonOrbit);
// moonOrbit.position.copy(earth.mesh.position);

// const moonGeo = new THREE.SphereGeometry(1.5, 30, 30);
// const moonMat = new THREE.MeshStandardMaterial({
//   map: textureLoader.load(moonTexture)
// });
// const moonMesh = new THREE.Mesh(moonGeo, moonMat);
// moonMesh.position.x = 8;
// moonMesh.rotation.z = THREE.MathUtils.degToRad(6.7);
// moonOrbit.add(moonMesh);

// // Sunlight
// const pointLight = new THREE.PointLight(0xFFFFFF, 2, 300);
// scene.add(pointLight);

// // Animation loop
// function animate() {
//   sun.rotateY(0.004);
//   mercury.mesh.rotateY(0.004);
//   venus.mesh.rotateY(0.002);
//   earth.mesh.rotateY(0.02);
//   mars.mesh.rotateY(0.018);
//   jupiter.mesh.rotateY(0.04);
//   saturn.mesh.rotateY(0.038);
//   uranus.mesh.rotateY(0.03);
//   neptune.mesh.rotateY(0.032);
//   pluto.mesh.rotateY(0.008);

//   mercury.obj.rotateY(0.04);
//   venus.obj.rotateY(0.015);
//   earth.obj.rotateY(0.01);
//   mars.obj.rotateY(0.008);
//   jupiter.obj.rotateY(0.002);
//   saturn.obj.rotateY(0.0009);
//   uranus.obj.rotateY(0.0004);
//   neptune.obj.rotateY(0.0001);
//   pluto.obj.rotateY(0.00007);

//   // Moon orbit
//   moonOrbit.rotateY(0.03);
//   // Synchronous rotation
//   moonMesh.rotateY(-0.03);

//   // Only needed if using orbit.enableDamping = true
//   orbit.update();

//   renderer.render(scene, camera);
// }

// renderer.setAnimationLoop(animate);

// // Resize
// window.addEventListener('resize', function() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// });

// // Raycaster
// var raycaster = new THREE.Raycaster();
// var mouse = new THREE.Vector2();

// renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);

// sun.name = "sun";
// mercury.name = "mercury";
// venus.name = "venus";
// earth.name = "earth";
// mars.name = "mars";
// jupiter.name = "jupiter";

// function onDocumentMouseDown(event) {
//   event.preventDefault();
//   mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
//   mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
//   raycaster.setFromCamera(mouse, camera);
//   var intersects = raycaster.intersectObjects(scene.children);
//   if (intersects.length > 0) {
//     console.log(intersects[0].object.name + " clicked!");
//   }
// }


import { OrbitControls } from '/skaothree/js/orbit.js';
import * as THREE from '/skaothree/js/three3.js';

// Textures
var starsTexture = './img/stars.jpg';
var sunTexture   = './img/sun.jpg';
var earthTexture = './img/earth.jpg';
var moonTexture  = './img/moon.jpg';

// Renderer
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  canvas: document.querySelector("canvas")
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(-90, 140, 140);

// Orbit controls
const orbit = new OrbitControls(camera, renderer.domElement);
// Enable damping for smoother orbit/zoom
orbit.enableDamping = true;
orbit.dampingFactor = 0.05;
// Allow free panning in screen space
orbit.enablePan = true;
orbit.screenSpacePanning = true;
// Restrict how close/far we can zoom
orbit.minDistance = 30;
orbit.maxDistance = 300;
// Allow full 360° horizontal rotation
orbit.minAzimuthAngle = -Infinity;
orbit.maxAzimuthAngle = Infinity;
// Allow going “above/below” the poles
orbit.minPolarAngle = 0;
orbit.maxPolarAngle = Math.PI;
orbit.update();

// Ambient light
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const textureLoader = new THREE.TextureLoader();

// Create a star-sphere instead of using scene.background
const starGeo = new THREE.SphereGeometry(500, 64, 64);
const starMat = new THREE.MeshBasicMaterial({
  map: textureLoader.load(starsTexture),
  side: THREE.BackSide
});
const starMesh = new THREE.Mesh(starGeo, starMat);
scene.add(starMesh);

// Create the Sun
const sunGeo = new THREE.SphereGeometry(16, 30, 30);
const sunMat = new THREE.MeshBasicMaterial({
  map: textureLoader.load(sunTexture)
});
const sun = new THREE.Mesh(sunGeo, sunMat);
// Name the Sun so we can detect clicks
sun.name = "sun";
scene.add(sun);

// Utility function to create a planet
function createPlanete(size, texture, position, ring) {
  const geo = new THREE.SphereGeometry(size, 30, 30);
  const mat = new THREE.MeshStandardMaterial({
    map: textureLoader.load(texture)
  });
  const mesh = new THREE.Mesh(geo, mat);

  // Parent object to allow independent rotation (orbit) of the planet
  const obj = new THREE.Object3D();
  obj.add(mesh);

  // Optional ring
  if (ring) {
    const ringGeo = new THREE.RingGeometry(ring.innerRadius, ring.outerRadius, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      map: textureLoader.load(ring.texture),
      side: THREE.DoubleSide
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    obj.add(ringMesh);
    ringMesh.position.x = position;
    ringMesh.rotation.x = -0.5 * Math.PI;
  }
  scene.add(obj);
  mesh.position.x = position;
  return { mesh, obj };
}

// Create Earth
const earth = createPlanete(6, earthTexture, 62);
// Name the Earth's mesh so clicks can detect "earth"
earth.mesh.name = "earth";

// Create Moon orbit group (revolves around Earth)
const moonOrbit = new THREE.Object3D();
earth.obj.add(moonOrbit);
moonOrbit.position.copy(earth.mesh.position);

// Create Moon
const moonGeo = new THREE.SphereGeometry(1.5, 30, 30);
const moonMat = new THREE.MeshStandardMaterial({
  map: textureLoader.load(moonTexture)
});
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
// Name the Moon mesh so clicks can detect "moon"
moonMesh.name = "moon";
// Position the Moon relative to Earth
moonMesh.position.x = 8;
// Give the Moon a slight tilt
moonMesh.rotation.z = THREE.MathUtils.degToRad(6.7);
moonOrbit.add(moonMesh);

// Sunlight
const pointLight = new THREE.PointLight(0xFFFFFF, 2, 700);
scene.add(pointLight);

// --- Motion toggles ---
let sunPaused   = false;
let earthPaused = false;
let moonPaused  = false;

// Animation loop
function animate() {
  // Sun rotates if not paused
  if (!sunPaused) {
    sun.rotateY(0.004);
  }

  // Earth rotates/revolves if not paused
  if (!earthPaused) {
    earth.mesh.rotateY(0.02);    // Earth's own spin
    earth.obj.rotateY(0.005);    // Earth's revolution around Sun
  }

  // Moon rotates/revolves if not paused
  if (!moonPaused) {
    moonOrbit.rotateY(0.03);     // Moon orbit around Earth
    moonMesh.rotateY(0.014);     // Moon's own spin
  }

  // Update orbit controls (for damping, etc.)
  orbit.update();

  // Render
  renderer.render(scene, camera);
}

// Start animation
renderer.setAnimationLoop(animate);

// Handle window resize
window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Raycaster
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

// Listen for clicks
renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);
function onDocumentMouseDown(event) {
  event.preventDefault();
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check for intersections with scene objects
  var intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    let clickedName = intersects[0].object.name;

    if (clickedName === "sun") {
      sunPaused = !sunPaused;  // Toggle sun motion
      console.log("sun clicked!");
    } 
    else if (clickedName === "earth") {
      earthPaused = !earthPaused;  // Toggle earth motion
      console.log("earth clicked!");
    } 
    else if (clickedName === "moon") {
      moonPaused = !moonPaused;  // Toggle moon motion
      console.log("moon clicked!");
    } 
    else {
      console.log("some other object clicked!");
    }
  }
}
