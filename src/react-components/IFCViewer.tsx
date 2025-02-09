import * as React from "react"
import * as OBC from "@thatopen/components"
import * as CUI from "@thatopen/ui-obc";
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { downloadFile, uploadFile } from "../firebase"
import { Project, ModelVisibility } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";

interface Props {
  project: Project,
  projectsManager: ProjectsManager
}
export function IFCViewer(props: Props) {

  //Components instance, this is like the manager of our IFCViewer
  const components = new OBC.Components();

  //Setting the viewer
  const setViewer = async () => {

    //Setting the world, which means: camera, scene, renderer, etc
    const worlds = components.get(OBC.Worlds)

    const world = worlds.create<
      OBC.SimpleScene,
      OBC.OrthoPerspectiveCamera,
      OBC.SimpleRenderer>()

    const sceneComponent = new OBC.SimpleScene(components)
    world.scene = sceneComponent
    world.scene.setup()

    const viewerContainer = document.getElementById("viewer-container") as HTMLElement
    const rendererComponent = new OBC.SimpleRenderer(components, viewerContainer)
    world.renderer = rendererComponent


    const cameraComponent = new OBC.OrthoPerspectiveCamera(components)
    world.camera = cameraComponent
    world.scene.three.background = new THREE.Color(220, 220, 215);


    cameraComponent.updateAspect()
    components.init()


    //IFC Loader. First we get from components the IfcLoader
    const ifcLoader = components.get(OBC.IfcLoader)
    ifcLoader.setup()//We need to start the Loader

    //Then the fragmentsManager. Then, add the funcionality for onFragmentsLoaded
    //A fragment is a THREEJS representation of an IFC
    const fragmentsManager = components.get(OBC.FragmentsManager)

    fragmentsManager.onFragmentsLoaded.add((model) => {
      world.scene.three.add(model)
      console.log(model.name)
      if (model?.name && model.name in props.project.modelDictionary) return
      const fragmentBinary = fragmentsManager.export(model)
      const blob = new Blob([fragmentBinary])
      const filePath = props.project.name + "/" + model.name + ".frag"
      uploadFile(filePath, blob)
      props.projectsManager.editModelDictionary(props.project, model.name, "Shown")
      console.log("fragmentLoaded")

    })

    for (const [key, value] of Object.entries(props.project.modelDictionary)) {

      if (value === "Shown") {
        const binary = await downloadFile(props.project.name + "/" + key + ".frag")
        if (!(binary instanceof ArrayBuffer)) return
        const fragmentBinary = new Uint8Array(binary)
        const fragmentsManager = components.get(OBC.FragmentsManager)
        fragmentsManager.load(fragmentBinary)
      }
      rendererComponent.resize();
      cameraComponent.updateAspect();
    }



    //Important, whenever there are changes in the size of the app
    viewerContainer.addEventListener("resize", () => {
      rendererComponent.resize()
      cameraComponent.updateAspect()
    })
  }

  //Setting the grid and the tool bar for the buttons
  const setupUI = () => {
    const viewerContainer = document.getElementById("viewer-container") as HTMLElement
    if (!viewerContainer) return

    const floatingGrid = BUI.Component.create<BUI.Grid>(() => {
      return BUI.html`
            <bim-grid floating style="padding: 20px;"></bim-grid>
          `;
    })
    const toolbar = BUI.Component.create<BUI.Toolbar>(() => {
      const [loadIfcBtn] = CUI.buttons.loadIfc({ components: components })
      return BUI.html`
            <bim-toolbar style="justify-self: center;">
              <bim-toolbar-section>
                ${loadIfcBtn}
              </bim-toolbar-section>
            </bim-toolbar>
          `;
    });

    floatingGrid.layouts = {
      main: {
        template: `
              "empty" 1fr
              "toolbar" auto
              /1fr
            `,
        elements: { toolbar },
      },
    }
    floatingGrid.layout = "main"
    viewerContainer.appendChild(floatingGrid)
  }


  //useEffect for setting it all
  React.useEffect(() => {
    setupUI()
    setViewer()

    return () => {
      if (components) {
        components.dispose()
      }
    }
  }, [])

  return (<
    bim-viewport
    id="viewer-container"
  />)
}
