import * as React from "react"
import * as OBC from "@thatopen/components"
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { downloadFile, downloadFilesContainingText, getURL, openDB, updateDocument, uploadFile } from "../firebase"
import { Project, ModelVisibility } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";
import * as OBCF from "@thatopen/components-front";
import { IfcAPI } from "web-ifc";
import * as CUI from "@thatopen/ui-obc";
import { FragmentsGroup } from "@thatopen/fragments"


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


  //Convert geometry to tiles function
  const tileGeometry = async (filePath: string, ifcBuffer: ArrayBuffer) => {
    const tiler = components.get(OBC.IfcGeometryTiler);

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
            uploadFile(props.project.name + "/Tiles/" + name, new Blob([bits[0]]))
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

    //Upload the fragments file
    const fragmentBinary = fragmentsManager.export(model)
    const blob = new Blob([fragmentBinary])
    await uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/" + filePath.slice(0, -4) + ".frag", blob)

    //Upload the properties file
    const properties = model.getLocalProperties();
    if (properties) {
      const jsonProperties = JSON.stringify(properties);
      const blob = new Blob([jsonProperties], { type: 'application/json' });
      const file = new File([blob], "frag-props.json");
      await uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/" + filePath.slice(0, -4) + "frag-props.json", blob)
      console.log("Archivo JSON subido exitosamente a Firebase.");
    } else {
      console.log("No hay propiedades locales para convertir en JSON.");
    }

    props.projectsManager.editModelDictionary(props.project, filePath, "Shown")
    setModelDictionaryVersion(props.project.modelDictionaryVersion)

    console.log(props.project.modelDictionaryVersion)
    await updateDocument("/projects", props.project.id, {
      modelDictionary: props.project.modelDictionary
    })

  }

  //Convert properties to tiles function
  const tileProperties = async (filePath: string, ifcBuffer: ArrayBuffer) => {
    const propsTiler = components.get(OBC.IfcPropertiesTiler);
    const projectName = props.project.name;

    propsTiler.settings.wasm = {
      path: "https://unpkg.com/web-ifc@0.0.57/",
      absolute: true,
    };

    interface StreamedProperties {
      types: {
        [typeID: number]: number[];
      };

      ids: {
        [id: number]: number;
      };

      indexesFile: string;
    }

    const jsonFile: StreamedProperties = {
      types: {},
      ids: {},
      indexesFile: `${filePath.slice(0, -4)}.ifc-processed-properties-indexes`,
    };


    let counter = 0;

    const files: { name: string; bits: Blob }[] = [];

    propsTiler.onPropertiesStreamed.add(async (props) => {
      if (!jsonFile.types[props.type]) {
        jsonFile.types[props.type] = [];
      }
      jsonFile.types[props.type].push(counter);

      for (const id in props.data) {
        jsonFile.ids[id] = counter;
      }

      const name = `${filePath.slice(0, -4)}.ifc-processed-properties-${counter}`;
      const bits = new Blob([JSON.stringify(props.data)]);
      files.push({ bits, name });

      counter++;
    });

    propsTiler.onProgress.add(async (progress) => {
      console.log(progress);
    });


    propsTiler.onIndicesStreamed.add(async (props) => {
      files.push({
        name: `${filePath.slice(0, -4)}.ifc-processed-properties.json`,
        bits: new Blob([JSON.stringify(jsonFile)]),
      });

      const relations = components.get(OBC.IfcRelationsIndexer);
      const serializedRels = relations.serializeRelations(props);

      files.push({
        name: `${filePath.slice(0, -4)}.ifc-processed-properties-indexes`,
        bits: new Blob([serializedRels]),
      });


      await Promise.all(
        files.map(({ name, bits }) =>
          uploadFile(projectName + "/Tiles/" + name, bits)
        )
      );
    });

    const ifcArrayBuffer = new Uint8Array(ifcBuffer);


    //Then, try to tile the file
    try {
      // This triggers the conversion, so the listeners start to be called
      await propsTiler.streamFromBuffer(ifcArrayBuffer);
    }
    catch (error) {
      console.log("An error ocurred:" + error)
    }
  }


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

    //Now we'll create a function that will stream the given model. We will also allow to stream the properties optionally. 
    async function loadTiledModel(geometryURL: string, propertiesURL?: string) {
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
      /*
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
        */
    }

    //Then the fragmentsManager. Then, add the funcionality for onFragmentsLoaded
    //A fragment is a THREEJS representation of an IFC
    const fragmentsManager = components.get(OBC.FragmentsManager)

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
          
          world.scene.three.add(model)
          const indexer = components.get(OBC.IfcRelationsIndexer)
          if (model.hasProperties) {
            await indexer.process(model)
            
            //Classifier
            /*
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
              */
             console.log("Not tiled model loaded")
          }
        }
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

  //Functionality for the load button
  const loadIfcBtn = async () => {
    const result = await props.projectsManager.loadIFC();
    const blob = new Blob([result?.buffer!])
    await uploadFile(props.project.name + "/" + result?.fileName!.slice(0, -4) + "/" + result?.fileName!, blob)
    await tileGeometry(result?.fileName!, result?.buffer!)
    await tileProperties(result?.fileName!, result?.buffer!)
    console.log("Tiling done!")
  };

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
            <bim-grid floating style="padding: 20px;"></bim-grid>
          `;
    })

    //Element property panel
    const elementPropertyPanel = BUI.Component.create<BUI.Panel>(() => {
      const [propsTable, updatePropsTable] = CUI.tables.elementProperties({
        components,
        fragmentIdMap: {},
      })

      const highlighter = components.get(OBCF.Highlighter)
      highlighter.events.select.onHighlight.add((fragmentIdMap) => {
        if (!floatingGrid) return
        floatingGrid.layout = "second"
        updatePropsTable({ fragmentIdMap })
        propsTable.expanded = false
      })

      highlighter.events.select.onClear.add(() => {
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
        </bim-panel>
      `;
    })

    //Classifications panel
    const classifierPanel = BUI.Component.create<BUI.Panel>(() => {
      return BUI.html
        `
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

    //Toolbar
    const toolbar = BUI.Component.create<BUI.Toolbar>(() => {
      return BUI.html`
            <bim-toolbar style="justify-self: center;">
              <bim-toolbar-section label="Load Models">
              <bim-button 
              icon="line-md:arrow-align-top"
              label="Load IFC"
              @click=${() => { loadIfcBtn() }}>
              </bim-button>
              </bim-toolbar-section>
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
    components.dispose();

    setViewer()
    setupUI()
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