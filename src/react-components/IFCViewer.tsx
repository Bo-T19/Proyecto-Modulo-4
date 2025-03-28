import * as React from "react"
import * as OBC from "@thatopen/components"
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { downloadFile, downloadFilesContainingText, getURL, openDB, updateDocument, uploadFile } from "../firebase"
import { Project } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";
import * as OBCF from "@thatopen/components-front";
import { IfcAPI } from "web-ifc";
import * as CUI from "@thatopen/ui-obc";
import { FragmentsGroup } from "@thatopen/fragments"
import { ToDosManager } from "../bim-components/TodoCreator"
import { SimpleQTO } from "../bim-components/SimpleQTO";
import { elementPropertiesTemplate } from "@thatopen/ui-obc/dist/components/tables/ElementProperties/src/template"

interface Props {
  project: Project,
  projectsManager: ProjectsManager
  components: OBC.Components
}
export function IFCViewer(props: Props) {

  //State for tracking the modelDictionary
  const [modelDictionaryVersion, setModelDictionaryVersion] = React.useState(props.project.modelDictionaryVersion);

  //Components instance, this is like the manager of our IFCViewer. Also the tiler
  const components: OBC.Components = props.components

  // Function to retrieve a file from IndexedDB
  async function getFileFromDB(filePath: string): Promise<Blob | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const splitPath = filePath.split("/")
      const name = splitPath[splitPath.length - 1]
      const transaction = db.transaction("files", "readonly");
      const store = transaction.objectStore("files");
      const request = store.get(name);

      // Resolve the promise when the file is successfully retrieved
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.data); // Return the file data (Blob)
        } else {
          console.log(`Not found file{}` + name)
          resolve(null); // Return null if the file is not found
        }
      };

      // Reject the promise if there's an error
      request.onerror = () => reject(request.error);
    });
  }

  //Override of the FragmentsGroup fetch method
  FragmentsGroup.fetch = async (fileName: string): Promise<Response> => {
    try {
      // Generates the url
      const fileBlob = await getFileFromDB(fileName);
      return new Response(fileBlob, {
        status: 200,
        statusText: "OK",
      });
    } catch (error) {
      console.error("Error al cargar el archivo desde Firebase:", error);
      throw error;
    }
  };

  //Classifications
  const [classificationsTree, updateClassificationsTree] = CUI.tables.classificationTree({
    components,
    classifications: []
  })

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
    const rendererComponent = new OBCF.PostproductionRenderer(components, viewerContainer)
    world.renderer = rendererComponent


    const cameraComponent = new OBC.OrthoPerspectiveCamera(components)
    world.camera = cameraComponent
    world.scene.three.background = new THREE.Color(220, 220, 215);

    cameraComponent.updateAspect()
    components.init()

    //Highlighter
    const highlighter = components.get(OBCF.Highlighter)
    highlighter.setup({ world })
    highlighter.zoomToSelection = true

    //IFC Loader. First we get from components the IfcLoader
    const ifcLoader = components.get(OBC.IfcLoader)
    ifcLoader.setup()//We need to start the Loader

    //Then, we get the streamer
    const ifcStreamer = components.get(OBCF.IfcStreamer);

    ifcStreamer.world = world;

    //Some configurations for the streamer
    world.camera.controls.addEventListener("sleep", () => {
      ifcStreamer.culler.needsUpdate = true;
    });

    ifcStreamer.useCache = true;

    async function clearCache() {
      await ifcStreamer.clearCache();
      window.location.reload();
    }

    ifcStreamer.culler.threshold = 0.1;
    ifcStreamer.culler.maxHiddenTime = 10000;
    ifcStreamer.culler.maxLostTime = 30000;

    //I have to override the streamer fetch function, in order to make it work with firebase:
    ifcStreamer.fetch = async (fileName: string): Promise<Response> => {
      try {
        // Generates the url
        const url = await getURL(fileName);
        const response = await fetch(url);
        return response;
      } catch (error) {
        console.error("Error al cargar el archivo desde Firebase:", error);
        throw error;
      }
    };

    ifcStreamer.url = props.project.name + "/Tiles/"

    //FragmentsManager here, it handles all the models
    const fragmentsManager = components.get(OBC.FragmentsManager)
    fragmentsManager.onFragmentsLoaded.add(async (model) => {
      world.scene.three.add(model)
    }
    )

    //Important, whenever there are changes in the size of the app
    viewerContainer.addEventListener("resize", () => {
      rendererComponent.resize()
      cameraComponent.updateAspect()
    })

    const todosManager = components.get(ToDosManager)
    todosManager.setup()
    todosManager.world = world
  }

  //Now we'll create a function that will stream the given model. We will also allow to stream the properties optionally. 
  const loadTiledModel = async (geometryURL: string, propertiesURL?: string) => {
    const ifcStreamer = components.get(OBCF.IfcStreamer)
    const rawGeometryData = await fetch(geometryURL);
    const geometryData = await rawGeometryData.json();
    let propertiesData;
    if (propertiesURL) {
      const rawPropertiesData = await fetch(propertiesURL);
      propertiesData = await rawPropertiesData.json();
    }
    const model = await ifcStreamer.load(geometryData, true, propertiesData);

    const indexer = components.get(OBC.IfcRelationsIndexer)
    await indexer.process(model)

    //Classifier

    const classifier = components.get(OBC.Classifier)
    await classifier.bySpatialStructure(model)
    classifier.byEntity(model)

    const classifications = [
      { system: "entities", label: "Entities" },
      { system: "spatialStructures", label: "Spatial Containers" },
    ]
    if (updateClassificationsTree) {
      updateClassificationsTree({ classifications })
    }

  }

  const loadShownModels = async () => {
    for (const [key, value] of Object.entries(props.project.modelDictionary)) {

      if (value === "Shown") {

        try {
          const geometryURL = await getURL(props.project.name + "/Tiles/" + key.slice(0, -4) + ".ifc-processed.json")
          const propertyURL = await getURL(props.project.name + "/Tiles/" + key.slice(0, -4) + ".ifc-processed-properties.json")
          downloadFilesContainingText(props.project.name + "/Tiles/", key.slice(0, -4) + ".ifc-processed-properties")

          await loadTiledModel(geometryURL, propertyURL)
          console.log("Tiled model loaded")
        }
        catch (error) {
          const binary = await downloadFile(props.project.name + "/" + key.slice(0, -4) + "/" + key.slice(0, -4) + ".frag")

          const propertiesBuffer = await downloadFile(props.project.name + "/" + key.slice(0, -4) + "/" + key.slice(0, -4) + "frag-props.json");

          if (!(binary instanceof ArrayBuffer)) return
          const fragmentBinary = new Uint8Array(binary)
          const fragmentsManager = components.get(OBC.FragmentsManager)
          const model = fragmentsManager.load(fragmentBinary)
          if (propertiesBuffer) {
            const propertiesJson = JSON.parse(new TextDecoder().decode(propertiesBuffer));
            model.setLocalProperties(propertiesJson)
          }

          const indexer = components.get(OBC.IfcRelationsIndexer)
          if (model.hasProperties) {
            await indexer.process(model)

            //Classifier

            const classifier = components.get(OBC.Classifier)
            await classifier.bySpatialStructure(model)
            classifier.byEntity(model)

            const classifications = [
              { system: "entities", label: "Entities" },
              { system: "spatialStructures", label: "Spatial Containers" },
            ]
            if (updateClassificationsTree) {
              updateClassificationsTree({ classifications })
            }

            console.log("Not tiled model loaded")
          }
        }
      }
    }
  }

  //Functionality for the hide button
  const onToggleVisibility = () => {
    const highlighter = components.get(OBCF.Highlighter)
    const fragments = components.get(OBC.FragmentsManager)
    const selection = highlighter.selection.select
    if (Object.keys(selection).length === 0) return
    for (const fragmentId in selection) {
      const fragment = fragments.list.get(fragmentId)
      const expressIDs = selection[fragmentId]
      for (const id of expressIDs) {
        if (!fragment) continue
        const isHidden = fragment.hiddenItems.has(id)

        if (isHidden) {
          fragment.setVisibility(true, [id])
        }
        else {
          fragment.setVisibility(false, [id])
        }
      }
    }
  }

  //Functionality for the isolate button
  const onIsolate = () => {
    const highlighter = components.get(OBCF.Highlighter)
    const hider = components.get(OBC.Hider)
    const selection = highlighter.selection.select
    hider.isolate(selection)
  }

  //Funcitonality for the show all button
  const onShowAll = () => {
    const hider = components.get(OBC.Hider)
    hider.set(true)
  }

  //Setting the grid and the tool bar for the buttons
  const setupUI = () => {
    const viewerContainer = document.getElementById("viewer-container") as HTMLElement
    if (!viewerContainer) return

    const floatingGrid = BUI.Component.create<BUI.Grid>(() => {
      return BUI.html`
            <bim-grid id= "floating-grid" floating style="padding: 20px;"></bim-grid>
          `;
    })

    //Element property panel
    const elementPropertyPanel = BUI.Component.create<BUI.Panel>(() => {
      const [propsTable, updatePropsTable] = CUI.tables.elementProperties({
        components,
        fragmentIdMap: {},
      })

      const qtosTable = BUI.Component.create<BUI.Table>(() =>
        BUI.html`
         <bim-table id="qtos-table" style="background-color: #f1f2f4; border-radius: 8px;"></bim-table>
        `
      );

      const highlighter = components.get(OBCF.Highlighter)
      highlighter.events.select.onHighlight.add(async (fragmentIdMap) => {
        if (!floatingGrid) return
        floatingGrid.layout = "second"

        console.log
        updatePropsTable({ fragmentIdMap })
        propsTable.expanded = false

        const simpleQto = components.get(SimpleQTO)
        await simpleQto.sumQuantities(fragmentIdMap)

        qtosTable.data = simpleQto.convertQtoSum()

        qtosTable.expanded = false

      })

      highlighter.events.select.onClear.add(() => {
        const simpleQto = components.get(SimpleQTO)
        simpleQto.qtoResult = {}
        const qtosTable = document.getElementById("qtos-table") as BUI.Table
        if (qtosTable) {
          qtosTable.data = simpleQto.convertQtoSum()
        }
        updatePropsTable({ fragmentIdMap: {} })
        if (!floatingGrid) return
        floatingGrid.layout = "main"
      })

      const search = (e: Event) => {
        const input = e.target as BUI.TextInput
        propsTable.queryString = input.value
      }

      return BUI.html`
        <bim-panel>
          <bim-panel-section
            name="property"
            label="Property Information"
            icon="solar:document-bold"
            fixed
          >
            <bim-text-input @input=${search} placeholder="Search..."></bim-text-input>
            ${propsTable}  
          </bim-panel-section>
          <bim-panel-section
            name="quantities"
            label="Quantities"
            icon="material-symbols:summarize"
            fixed
          >
            ${qtosTable}  
          </bim-panel-section>
        </bim-panel>
      `;
    })


    //Classifications panel
    const classifierPanel = BUI.Component.create<BUI.Panel>(() => {
      return BUI.html`
      <bim-panel>
          <bim-panel-section
              name="classifier"
              label="Classifier"
              icon="solar:document-bold"
              fixed
          >
              <bim-label>Classifications</bim-label>
              ${classificationsTree}
          </bim-panel-section>
      </bim-panel>
      `;
    })

    //Functiionality for the classifier button
    const onClassifier = () => {
      if (!floatingGrid) return
      if (floatingGrid.layout !== "classifier") {
        floatingGrid.layout = "classifier"
      } else {
        floatingGrid.layout = "main"
      }
    }

    const onShowPropertiesAndQtos = () => {
      if (!floatingGrid) return
      if (floatingGrid.layout !== "second") {
        floatingGrid.layout = "second"
      } else {
        floatingGrid.layout = "main"
      }
    }

    const onDownloadQuantities =()=>
    {
      const simpleQto = components.get(SimpleQTO)
      simpleQto.exportToJSON()
    }
    //Toolbar
    const toolbar = BUI.Component.create<BUI.Toolbar>(() => {
      return BUI.html`
            <bim-toolbar style="justify-self: center;">
              <bim-toolbar-section label="Visibility">
              <bim-button
              label="Hide"
              icon="material-symbols:multimodal-hand-eye"
              @click=${() => { onToggleVisibility() }}
              >
              </bim-button>
              <bim-button
              label="Isolate"
              icon="material-symbols:switch-access-outline"
              @click=${() => { onIsolate() }}
              >
              </bim-button>
              <bim-button
              label="Show All"
              icon="material-symbols:multimodal-hand-eye-outline-rounded"
              @click=${() => { onShowAll() }}
              >
              </bim-button>
              </bim-toolbar-section>
              <bim-toolbar-section label="Groupings">
              <bim-button
              label="Groups"
              icon="material-symbols:action-key"
              @click=${() => { onClassifier() }}
              >
              </bim-button>
              </bim-toolbar-section>
              </bim-toolbar-section>
              <bim-toolbar-section label="Properties">
              <bim-button
              label="Show Properties"
              icon="material-symbols:event-list"
              @click=${() => { onShowPropertiesAndQtos() }}
              >
              </bim-button>
              <bim-button
              label="Download Quantities"
              icon="material-symbols:sim-card-download"
              @click=${() => { onDownloadQuantities() }}
              >
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
      second: {
        template: `
        "empty elementPropertyPanel" 1fr
        "toolbar toolbar" auto
        /1fr 20rem
        `,
        elements: {
          toolbar,
          elementPropertyPanel
        }
      },
      classifier: {
        template: `
        "empty classifierPanel" 1fr
        "toolbar toolbar" auto
        /1fr 20rem
        `,
        elements: {
          toolbar,
          classifierPanel
        }
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

    setViewer()
    setupUI()
    loadShownModels()
    return () => {

      const viewerContainer = document.getElementById("viewer-container") as HTMLElement
      const floatingGrid = document.getElementById("floating-grid") as HTMLElement;
      const viewerContainerHTML = viewerContainer as HTMLElement
      const floatingGridHTML = floatingGrid as HTMLElement;

      if (viewerContainer && floatingGrid) {
        viewerContainerHTML.removeChild(floatingGridHTML)
      }
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