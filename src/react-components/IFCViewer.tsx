import * as React from "react"
import * as OBC from "@thatopen/components"
import * as CUI from "@thatopen/ui-obc";
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { downloadFile, updateDocument, uploadFile } from "../firebase"
import { Project, ModelVisibility } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";
import { IfcAPI } from "web-ifc";


interface Props {
  project: Project,
  projectsManager: ProjectsManager
}
export function IFCViewer(props: Props) {

  //State for tracking the modelDictionary
  const [modelDictionaryVersion, setModelDictionaryVersion] = React.useState(props.project.modelDictionaryVersion);

  //Components instance, this is like the manager of our IFCViewer. Also the tiler
  const components = new OBC.Components();


  //Convert geometry to tiles function

  const tileGeometry = async (filePath: string, ifcBuffer: ArrayBuffer) => {
    const tiler = components.get(OBC.IfcGeometryTiler);
    console.log("Tiler:", tiler);
    console.log("Tiler settings:", tiler?.settings);
    console.log("Tiler settings.wasm:", tiler?.settings?.wasm);

    const wasm = {
      path: "https://unpkg.com/web-ifc@0.0.57/",
      absolute: true,
    };

    tiler.settings.wasm = wasm;

    console.log("Configuración WASM:", tiler.settings.wasm);
    tiler.settings.minGeometrySize = 20;
    tiler.settings.minAssetsSize = 1000;


    let files: { name: string; bits: (Uint8Array | string)[] }[] = [];
    let geometriesData: OBC.StreamedGeometries = {};
    let geometryFilesCount = 1;



    tiler.onGeometryStreamed.add((geometry) => {
      const { buffer, data } = geometry;
      const bufferFileName = `${filePath}-processed-geometries-${geometryFilesCount}`;
      for (const expressID in data) {
        const value = data[expressID];
        value.geometryFile = bufferFileName;
        geometriesData[expressID] = value;
      }
      files.push({ name: bufferFileName, bits: [buffer] });
      geometryFilesCount++;
    });


    let assetsData: OBC.StreamedAsset[] = [];

    tiler.onAssetStreamed.add((assets) => {
      assetsData = [...assetsData, ...assets];
    });


    tiler.onIfcLoaded.add((groupBuffer) => {
      files.push({
        name: `${filePath}-processed-global`,
        bits: [groupBuffer],
      });
    });

    tiler.onProgress.add((progress) => {
      if (progress !== 1) return;
      setTimeout(async () => {
        const processedData = {
          geometries: geometriesData,
          assets: assetsData,
          globalDataFileId: `${filePath}-processed-global`,
        };
        files.push({
          name: `${filePath}-processed.json`,
          bits: [JSON.stringify(processedData)],
        });


        await Promise.all(
          files.map(({ name, bits }) =>
            uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/GT/" + name, new Blob([bits[0]]))
          )
        );


        assetsData = [];
        geometriesData = {};
        files = [];
        geometryFilesCount = 1;
      });
    });

    const ifcArrayBuffer = new Uint8Array(ifcBuffer);


    //Then, try to tile
    try {
      // This triggers the conversion, so the listeners start to be called
      await tiler.streamFromBuffer(ifcArrayBuffer);
    }
    catch (error) {
      console.log("An error ocurred:" + error)
    }


    //Then, create the fragments group and load it to Firbase. Initialize the components and thee fragments manager

    const fragmentsManager = components.get(OBC.FragmentsManager)
    
    //IFC Loader. First we get from components the IfcLoader
    const ifcLoader = components.get(OBC.IfcLoader)
    ifcLoader.setup()//We need to start the Loader

    const model = await ifcLoader.load(ifcArrayBuffer);
    const fragmentBinary = fragmentsManager.export(model)
    const blob = new Blob([fragmentBinary])
    await uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/" + filePath.slice(0, -4) + ".frag", blob)

    
    props.projectsManager.editModelDictionary(props.project, filePath, "Shown")
    setModelDictionaryVersion(props.project.modelDictionaryVersion)

    console.log(props.project.modelDictionaryVersion)
    await updateDocument("/projects", props.project.id, {
      modelDictionary: props.project.modelDictionary
    })
    //fragmentsManager.dispose()
  }


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
    /*
        fragmentsManager.onFragmentsLoaded.add(async (model) => {
          world.scene.three.add(model)
          if (model?.name && model.name in props.project.modelDictionary) return
          const fragmentBinary = fragmentsManager.export(model)
          const blob = new Blob([fragmentBinary])
          const filePath = props.project.name + "/" + model.name + ".frag"
          uploadFile(filePath, blob)
          props.projectsManager.editModelDictionary(props.project, model.name, "Shown")
          await updateDocument("/projects", props.project.id, {
            modelDictionary: props.project.modelDictionary
          })
    
    
    
        })*/

    for (const [key, value] of Object.entries(props.project.modelDictionary)) {

      if (value === "Shown") {
        const binary = await downloadFile(props.project.name + "/" +key.slice(0,-4)+"/"+ key.slice(0,-4) + ".frag")
        if (!(binary instanceof ArrayBuffer)) return
        const fragmentBinary = new Uint8Array(binary)
        const fragmentsManager = components.get(OBC.FragmentsManager)
        const model = fragmentsManager.load(fragmentBinary)
        world.scene.three.add(model)
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
      const loadIfcBtn = async () => {
        const result = await props.projectsManager.loadIFC();
        const blob = new Blob([result?.buffer!])
        await uploadFile(props.project.name + "/" + result?.fileName!.slice(0, -4) + "/" + result?.fileName!, blob)
        await tileGeometry(result?.fileName!, result?.buffer!)
        console.log("Tiling done!")

      };

      return BUI.html`
            <bim-toolbar style="justify-self: center;">
              <bim-toolbar-section>
              <bim-button icon="line-md:arrow-align-top"
                @click=${() => { loadIfcBtn() }}>
              </bim-button>
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

  //useEffect for when the props.project.modelDictionaryVersion changes
  React.useEffect(() => {
    setModelDictionaryVersion(props.project.modelDictionaryVersion);
  }, [props.project.modelDictionaryVersion]);


  //useEffect for setting it all
  React.useEffect(() => {
    console.log("modelDictionaryVersion changed:", props.project.modelDictionaryVersion);
    components.dispose();
    setupUI()
    setViewer()

    return () => {

      if (components) {
        components.dispose()
      }
    }
  }, [modelDictionaryVersion])



  return (<
    bim-viewport
    id="viewer-container"
  />)
}