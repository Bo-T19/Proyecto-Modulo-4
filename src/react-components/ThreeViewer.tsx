import * as React from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js"
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js"
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js"

export function ThreeViewer() {

    let scene: THREE.Scene | null
    let mesh: THREE.Object3D | null
    let renderer: THREE.WebGLRenderer | null
    let cameraControls: OrbitControls | null
    let camera: THREE.PerspectiveCamera | null
    let axes: THREE.AxesHelper | null
    let grid: THREE.GridHelper | null
    let directionalLight: THREE.DirectionalLight | null
    let mtlLoader: MTLLoader | null
    let objLoader: OBJLoader | null


    const setViewer = () => {
        scene = new THREE.Scene()
        // Este código si quisiera ponerle un color al background: scene.background = new THREE.Color("#ff0000")


        const viewerContainer = document.getElementById("viewer-container") as HTMLElement

        camera = new THREE.PerspectiveCamera(75)
        camera.position.z = 5


        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
        viewerContainer.append(renderer.domElement)


        function resizeViewer() {
            const containerDimensions = viewerContainer.getBoundingClientRect()

            if (!renderer) return
            renderer.setSize(containerDimensions.width, containerDimensions.height)
            const aspectRatio = containerDimensions.width / containerDimensions.height

            if (!camera) return
            camera.aspect = aspectRatio
            camera.updateProjectionMatrix()

        }

        window.addEventListener("resize", resizeViewer)

        resizeViewer()

        const directionalLight = new THREE.DirectionalLight()
        const ambientLight = new THREE.AmbientLight()
        ambientLight.intensity = 0.4

        //scene.add(cube, directionalLight, ambientLight)


        cameraControls = new OrbitControls(camera, viewerContainer)


        function renderScene() {
            if (!renderer) return
            if (!scene) return
            if (!camera) return
            renderer.render(scene, camera)
            requestAnimationFrame(renderScene)
        }

        renderScene()


        const axes = new THREE.AxesHelper()
        scene.add(axes)


        const grid = new THREE.GridHelper()
        grid.material.transparent = true
        grid.material.opacity = 0.4
        grid.material.color = new THREE.Color("#808080")
        scene.add(grid)

        const gui = new GUI({container: viewerContainer})

        const cubeControls = gui.addFolder("Cube")

        const lightControls = gui.addFolder("Light")
        lightControls.add(directionalLight.position, "x", -10, 10, 1)
        lightControls.add(directionalLight.position, "y", -10, 10, 1)
        lightControls.add(directionalLight.position, "z", -10, 10, 1)
        lightControls.add(directionalLight, "intensity", 0, 1, 0.1)
        lightControls.addColor(directionalLight, "color")

        objLoader = new OBJLoader()
        mtlLoader = new MTLLoader()

        mtlLoader.load("../assets/Gear1.mtl", (materials) => {
            materials.preload()
            if (!objLoader) return
    
            objLoader.setMaterials(materials)
            objLoader.load("../assets/Gear1.obj", (object) => {
                if (!scene) return
                scene.add(object)
                mesh = object
            })
        })

        return () => {

        }

    }



    React.useEffect(() => {
        setViewer()
        return () => {
            mesh?.removeFromParent()
            mesh?.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose()
                    child.material.dispose()
                }

                mesh = null

            })
        }

    }, [])

    return (<div
        id="viewer-container"
        style={{ minWidth: 0, position: "relative" }}
        className="dashboard-card"
    />)
}
