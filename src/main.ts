import "./style.css"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { PCDLoader } from "three/addons/loaders/PCDLoader.js"

import Stats from "three/addons/libs/stats.module.js"
import { GUI } from "three/addons/libs/lil-gui.module.min.js"

type World = {
  canvas: HTMLCanvasElement
  renderer: THREE.Renderer
  camera: THREE.Camera
  scene: THREE.Scene
  raycaster: THREE.Raycaster
  pointer: THREE.Vector2
}

const guiControls = {
  state: "view",
}

function main() {
  const world = createWorld()
  const { canvas, renderer, camera, scene, raycaster, pointer } = world
  const debugTools = createDebuggingTools(scene)
  const controls = createControls(renderer, camera)
  loadPointCloud(scene)

  init(world)

  function render() {
    controls.orbitControls.enabled = guiControls.state !== "create"
    controls.orbitControls.update()

    const points = scene.getObjectByName("point-cloud")

    if (points && !controls.orbitControls.enabled) {
      const cube = scene.getObjectByName("raycast-test")
      raycaster.setFromCamera(pointer, camera)

      const intersects = raycaster.intersectObject(points)

      if (intersects.length > 0) {
        cube.position.copy(intersects[0].point)
        cube.scale.set(1, 1, 1)
      }
    }
    renderer.render(scene, camera)
    debugTools.stats.update()
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

function createWorld(): World {
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

  // NOTE(Kevin): I don't fully understand raycasting, but I assume I need it in
  // order to get the point in 3D space from the perspective of the camera
  const raycaster = new THREE.Raycaster()
  raycaster.params.Points.threshold = 0.1

  const pointer = new THREE.Vector2()

  return {
    canvas,
    renderer,
    camera,
    scene,
    raycaster,
    pointer,
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

  // NOTE(Kevin): Feels a bit hacky to use this, but I the idea is to have some
  // different modes: view, drawing, selection. Imagine selection icons etc from
  // photoshop. Lost too much time on the raycast at the moment
  const states = ["view", "create", "transform"] as const
  const gui = new GUI()
  gui.add(guiControls, "state", states)
  gui.open()

  return {
    orbitControls,
    guiControls,
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

function init(world: World) {
  world.camera.position.set(0, -10, 4) // NOTE(Kevin): seems like a decent starting point
  world.camera.lookAt(world.scene.position)

  const cube = createCube(world.scene)
  cube.name = "raycast-test"

  window.addEventListener(
    "resize",
    onWindowResize.bind(null, world.camera, world.renderer)
  )
  world.renderer.domElement.addEventListener(
    "pointerdown",
    onPointerDown(world)
  )
}

function onWindowResize(camera: THREE.Camera, renderer: THREE.Renderer) {
  camera.aspect = window.innerWidth / window.innerHeight
  // NOTE(Kevin): Seems to be required, otherwise the images looks flat when
  // resizing to a bigger screen
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function onPointerDown(world: World) {
  return (event: PointerEvent) => {
    world.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    world.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }
}

main()
