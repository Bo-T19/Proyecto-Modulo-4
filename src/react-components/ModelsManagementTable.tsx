import * as React from "react";
import * as Router from "react-router-dom";
import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"

import { Project, IProject, ProjectStatus, ProjectType, ModelVisibility } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";
import { deleteFilesContainingText, deleteFolderRecursive, downloadFile, downloadFilesContainingText, getURL, openDB, updateDocument, uploadFile } from "../firebase"

interface Props {
    project: Project
    projectsManager: ProjectsManager
    components: OBC.Components
}

export function ModelsManagementTable(props: Props) {

    //References
    const modelsTableContainer = React.useRef<HTMLDivElement>(null)
    const uploadButtonContainer = React.useRef<HTMLDivElement>(null)

    //State for managing the model visibility and reloading the table
    const [models, setModels] = React.useState<Record<string, ModelVisibility>>(
        { ...props.project.modelDictionary }
    );
    const [modelDictionaryVersion, setModelDictionaryVersion] = React.useState(props.project.modelDictionaryVersion);

    //Components instance, this is like the manager of our IFCViewer. Also the tiler
    const components: OBC.Components = props.components

    //Convert an IFC to Fragments function
    const convertToFragments = async (filePath: string, ifcBuffer: Uint8Array) => {

        //Then, load the complete fragmentsGroup
        const fragmentsManager = components.get(OBC.FragmentsManager)

        //IFC Loader. First we get from components the IfcLoader
        const ifcLoader = components.get(OBC.IfcLoader)
        ifcLoader.setup()//We need to start the Loader
        console.log(ifcLoader)
        const model = await ifcLoader.load(ifcBuffer);

        //Upload the fragments file
        const fragmentBinary = fragmentsManager.export(model)
        const blob = new Blob([fragmentBinary])
        await uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/" + filePath.slice(0, -4) + ".frag", blob)

        //Upload the properties file
        const properties = await model.getLocalProperties();
        if (properties) {
            const jsonProperties = JSON.stringify(properties);
            const blob = new Blob([jsonProperties], { type: 'application/json' });
            const file = new File([blob], "frag-props.json");
            await uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/" + filePath.slice(0, -4) + "frag-props.json", blob)
            console.log("Archivo JSON subido exitosamente a Firebase.");
        } else {
            console.log("No hay propiedades locales para convertir en JSON.");
        }
    }

    //Convert geometry to tiles function
    const tileGeometry = async (filePath: string, ifcBuffer: Uint8Array) => {
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

        //Then, try to tile
        try {
            // This triggers the conversion, so the listeners start to be called
            await tiler.streamFromBuffer(ifcBuffer);
        }
        catch (error) {
            console.log(error)
        }
    }

    //Convert properties to tiles function
    const tileProperties = async (filePath: string, ifcBuffer: Uint8Array) => {
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

        //Then, try to tile the file
        try {
            // This triggers the conversion, so the listeners start to be called
            await propsTiler.streamFromBuffer(ifcBuffer);
        }
        catch (error) {
            console.log("An error ocurred:" + error)
        }
    }

    //Setting the ModelsManager
    const setModelsManager = async () => {
        components.init()

        //IFC Loader. First we get from components the IfcLoader
        const ifcLoader = components.get(OBC.IfcLoader)
        ifcLoader.setup()//We need to start the Loader

    }

    //BIM Table for models with all its functionality
    const modelsTable = BUI.Component.create<BUI.Table>(() => {
        return BUI.html`
        <bim-table id="models-table" style="background-color: #f1f2f4; border-radius: 8px;"></bim-table>
      `
    })

    //Bim button for uploading a model
    const loadIfcBtn = async () => {
        const result = await props.projectsManager.loadIFC();
        const blob = new Blob([result?.buffer!])
        const filePath = result?.fileName! as string
        await uploadFile(props.project.name + "/" + filePath.slice(0, -4) + "/" + result?.fileName!, blob)
        const ifcArray = new Uint8Array(result?.buffer!)
        await convertToFragments(result?.fileName!, ifcArray)
        await tileGeometry(result?.fileName!, ifcArray)
        await tileProperties(result?.fileName!, ifcArray)

        props.projectsManager.editModelDictionary(props.project, filePath, "Shown")

        console.log(props.project.modelDictionaryVersion)
        await updateDocument("/projects", props.project.id, {
            modelDictionary: props.project.modelDictionary
        })
        console.log("Tiling done!")
        setModelDictionaryVersion(props.project.modelDictionaryVersion)
    };

    const uploadModelButton = BUI.Component.create<BUI.Button>(() => {
        return BUI.html`
        <bim-button               
        icon="line-md:arrow-align-top"
        label="Load IFC" 
        @click=${async () => { await loadIfcBtn() }}></bim-button>
      `
    })

    React.useEffect(() => {
        setModelsManager()

        modelsTableContainer.current?.appendChild(modelsTable)
        uploadButtonContainer.current?.appendChild(uploadModelButton)

    }, [])

    //Effect for updating the models table data when a model is added
    React.useEffect(() => {
        const formattedData = Object.entries(props.project.modelDictionary).map(([key, value]) => ({
            data: {
                Name: key,
                Delete: ""
            }
        }));

        const table = document.getElementById("models-table") as BUI.Table
        const columns = [
            { name: "Name", width: "300px" },
            { name: "Delete", width: "80px" }
        ];

        modelsTable.columns = columns;

        if (table) {
            table.data = formattedData
            table.dataTransform = {

                Delete: (value, rowData) => {
                    const deleteRow = async () => {
                        delete models[rowData.Name as string]
                        table.data = table.data.filter(item => item.data.Name !== rowData.Name);

                        //Delete the models that are not present in the models dictionary
                        const modelDictionary = props.project.modelDictionary;
                        const modelsKeys = new Set(Object.keys(models));

                        Object.keys(modelDictionary).forEach(async modelName => {
                            if (!modelsKeys.has(modelName)) {
                                await deleteFolderRecursive(props.project.name + "/" + modelName.slice(0, -4) + "/")
                                await deleteFilesContainingText(props.project.name + "/Tiles/", modelName.slice(0, -4))
                            }
                        });

                        //This is EXTREMELY IMPORTANT, the project here is updated in firebase
                        props.project.modelDictionary = models
                        await updateDocument("/projects", props.project.id, {
                            modelDictionary: models
                        });

                        props.project.modelDictionaryVersion++


                    }

                    return BUI.html`
                    <div>
                        <bim-button icon="material-symbols:delete" style="background-color: red" @click=${deleteRow}></bim-button>
                    </div>  
                    `
                }
            }
        }
    }, [modelDictionaryVersion])
    return (<div className= "dashboard-card"style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "10px"}}>
        <div>
            <h4>Models</h4>
        </div>
        <div ref={uploadButtonContainer}></div>
        <div className="model-list" ref={modelsTableContainer}></div>
    </div>
    
    )
}