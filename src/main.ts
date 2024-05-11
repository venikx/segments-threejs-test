import "./style.css"
import * as THREE from "three"

function main() {
  const canvas = document.querySelector("#c")
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  renderer.setSize(window.innerWidth, window.innerHeight)

  const camera = new THREE.PerspectiveCamera(
    45, // field of view
    window.innerWidth / window.innerHeight, // aspect ratio
    1, // near the plane
    1000 // far from the plane => so is this maximum drawing distance?
  )
  camera.position.z = 2

  const scene = new THREE.Scene()
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  function render(time) {
    time *= 0.001 // convert time to seconds

    cube.rotation.x = time
    cube.rotation.y = time

    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

main()
