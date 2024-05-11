import "./style.css"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { PCDLoader } from "three/addons/loaders/PCDLoader.js"

import Stats from "three/addons/libs/stats.module.js"

function main() {
  const { canvas, renderer, camera, scene } = createWorld()
  const debugTools = createDebuggingTools(scene)
  const controls = createControls(renderer, camera)
  loadPointCloud(scene)

  init(scene, camera, renderer)

  function render() {
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
// NOTE(Kevin): Rendering the point cloud is already lagging on my computer,
// but I'm wondering if it's due to a scuffed Linux setup
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

function loadPointCloud(scene: THREE.Scene) {
  const loader = new PCDLoader()

  // NOTE(Kevin): I added the file locally, to not deal with network requests
  loader.load("./41089c53-efca-4634-a92a-0c4143092374.pcd", (p) => {
    p.name = "point-cloud"
    p.material.size = 0.05
    scene.add(p)
  })
}

function init(
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.Renderer
) {
  camera.position.set(0, -10, 4) // NOTE(Kevin): seems like a decent starting point
  camera.lookAt(scene.position)

  window.addEventListener("resize", onWindowResize.bind(null, camera, renderer))
}

function onWindowResize(camera: THREE.Camera, renderer: THREE.Renderer) {
  camera.aspect = window.innerWidth / window.innerHeight
  // NOTE(Kevin): Seems to be required, otherwise the images looks flat when
  // resizing to a bigger screen
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

main()
