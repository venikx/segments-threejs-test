import "./style.css"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

import Stats from "three/addons/libs/stats.module.js"

function main() {
  const { canvas, renderer, camera, scene } = createWorld()
  const cube = createCube(scene)
  const debugTools = createDebuggingTools(scene)
  const controls = createControls(renderer, camera)

  function render(time) {
    time *= 0.001 // convert time to seconds

    cube.rotation.x = time
    cube.rotation.y = time

    renderer.render(scene, camera)

    debugTools.stats.update()
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

function createWorld() {
  const canvas: HTMLCanvasElement = document.querySelector("#c")
  if (!canvas) throw new Error("No canvas element to hook into.")

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

  return {
    canvas,
    renderer,
    camera,
    scene,
  }
}

function createCube(scene: THREE.Scene) {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 })
  const cube = new THREE.Mesh(geometry, material)
  scene.add(cube)

  return cube
}

// NOTE(Kevin): It's probably not super usefull, but I wanted to if I severely
// impact performance or not.
function createDebuggingTools(scene: THREE.Scene) {
  scene.add(new THREE.AxesHelper(1))
  const stats = new Stats()
  document.body.appendChild(stats.dom)

  return {
    stats,
  }
}

function createControls(renderer: THREE.Renderer, camera: THREE.Camera) {
  const orbitControls = new OrbitControls(camera, renderer.domElement)
  orbitControls.minDistance = 0.01
  orbitControls.maxDistance = 1000
  orbitControls.update()

  return {
    orbitControls,
  }
}

main()
