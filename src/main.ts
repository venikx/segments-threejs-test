import "./style.css"
import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { TransformControls } from "three/addons/controls/TransformControls.js"
import { PCDLoader } from "three/addons/loaders/PCDLoader.js"

import Stats from "three/addons/libs/stats.module.js"
import { GUI } from "three/addons/libs/lil-gui.module.min.js"

type World = {
  canvas: HTMLCanvasElement
  renderer: THREE.Renderer
  camera: THREE.PerspectiveCamera
  scene: THREE.Scene
  raycaster: THREE.Raycaster
}

const guiControls = {
  state: "view",
}
let isDragging = false
let startPoint = new THREE.Vector3()
let drawingCuboid: THREE.Mesh | null = null
const cuboids: THREE.Mesh[] = []

function main() {
  const world = createWorld()
  const { renderer, camera, scene } = world
  const debugTools = createDebuggingTools(scene)
  const controls = createControls(renderer, camera, scene)
  loadPointCloud(scene)

  init(world, controls)

  function render() {
    renderer.render(scene, camera)
    debugTools.stats.update()
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}

function createWorld(): World {
  const canvas = document.querySelector<HTMLCanvasElement>("#c")
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

  return {
    canvas,
    renderer,
    camera,
    scene,
    raycaster,
  }
}

function createCuboid() {
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({ color: 0x44aa88 })

  return new THREE.Mesh(geometry, material)
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

type Controls = {
  orbitControls: OrbitControls
  transformControls: TransformControls
}
function createControls(
  renderer: THREE.Renderer,
  camera: THREE.PerspectiveCamera,
  scene: THREE.Scene
): Controls {
  const orbitControls = new OrbitControls(camera, renderer.domElement)
  orbitControls.minDistance = 0.01
  orbitControls.maxDistance = 1000
  orbitControls.update()

  const transformControls = new TransformControls(camera, renderer.domElement)
  window.addEventListener("keydown", function (event) {
    if (event.key === "t") transformControls.setMode("translate")
    if (event.key === "r") transformControls.setMode("rotate")
    if (event.key === "s") transformControls.setMode("scale")
    if (event.key === "Escape") transformControls.detach()

    console.log("Transform Mode: ", transformControls.mode)
  })
  scene.add(transformControls)

  // NOTE(Kevin): Feels a bit hacky to use this, but I the idea is to have some
  // different modes: view, drawing, selection. Imagine selection icons etc from
  // photoshop. Lost too much time on the raycast at the moment
  const states = ["view", "create", "transform"] as const
  const gui = new GUI()
  gui.add(guiControls, "state", states).onChange((s) => {
    console.log("Current State", String(s))
    orbitControls.enabled = s === "view"
    orbitControls.update()
    console.log("Orbit Controls", String(orbitControls.enabled))

    if (s !== "transform") transformControls.detach()
  })
  gui.open()

  return {
    orbitControls,
    transformControls,
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

function init(world: World, controls: Controls) {
  world.camera.position.set(0, -20, 10) // NOTE(Kevin): seems like a decent starting point
  world.camera.lookAt(world.scene.position)

  window.addEventListener(
    "resize",
    onWindowResize.bind(null, world.camera, world.renderer)
  )

  world.renderer.domElement.addEventListener(
    "pointerdown",
    onPointerDown(world, controls)
  )

  world.renderer.domElement.addEventListener(
    "pointermove",
    onPointerMove(world)
  )
  world.renderer.domElement.addEventListener(
    "pointerup",
    onPointerUp.bind(null, world)
  )
}

function onWindowResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.Renderer
) {
  camera.aspect = window.innerWidth / window.innerHeight
  // NOTE(Kevin): Seems to be required, otherwise the images looks flat when
  // resizing to a bigger screen
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.updateProjectionMatrix()
}

function onPointerDown(world: World, controls: Controls) {
  return (event: PointerEvent) => {
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )

    if (guiControls.state === "create") {
      isDragging = true
      const points = world.scene.getObjectByName("point-cloud")

      world.raycaster.setFromCamera(mouse, world.camera)
      const intersects = world.raycaster.intersectObject(points)

      if (intersects.length > 0) {
        startPoint.copy(intersects[0].point)

        // NOTE(Kevin): Draw a temporary cuboid, and modify it's size in onPointerMove
        if (!drawingCuboid) {
          drawingCuboid = createCuboid()
          drawingCuboid.position.copy(startPoint)
          world.scene.add(drawingCuboid)
        }
      }
    }
    if (guiControls.state === "transform") {
      world.raycaster.setFromCamera(mouse, world.camera)
      const intersects = world.raycaster.intersectObjects(cuboids)

      if (intersects.length > 0) {
        const object = intersects[0].object
        controls.transformControls.attach(object)
      }
    }
  }
}

function onPointerMove(world: World) {
  return (event: PointerEvent) => {
    if (!isDragging || !drawingCuboid) return
    const points = world.scene.getObjectByName("point-cloud")

    // NOTE(Kevin): I wonder if I actually need a raycaster here, for now it's just
    // a copy past from above (perf is low)
    const mouse = new THREE.Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    )
    world.raycaster.setFromCamera(mouse, world.camera)
    const intersects = world.raycaster.intersectObject(points)

    if (intersects.length > 0) {
      const endPoint = intersects[0].point
      const sizeVector = new THREE.Vector3().subVectors(endPoint, startPoint)
      drawingCuboid.scale.set(sizeVector.x, sizeVector.y, sizeVector.z)
      drawingCuboid.position.addVectors(
        startPoint,
        sizeVector.multiplyScalar(0.5)
      )
    }
  }
}

function onPointerUp(world: World) {
  isDragging = false

  if (drawingCuboid) {
    cuboids.push(drawingCuboid)
    drawingCuboid = null
  }
}

main()
