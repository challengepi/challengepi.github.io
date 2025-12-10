import * as THREE from "../javascript/three3.js";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    innerWidth/innerHeight,
    0.1,
    1000
  )
  const renderer = new THREE.WebGL1Renderer()
  renderer.setSize(innerWidth,innerHeight)

  document.body.appendChild(renderer.domElement)

  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(5,50,50),
    new THREE.MeshBasicMaterial({
        color:0xFF0000
    })
  )
  scene.add(sphere)
  camera.position.z=15
    function animate (){
        requestAnimationFrame(animate)
        renderer.render(scene,camera)
    }

    animate()