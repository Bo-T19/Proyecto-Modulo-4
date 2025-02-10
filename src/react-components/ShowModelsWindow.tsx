import * as React from "react";
import * as Router from "react-router-dom";
import * as BUI from "@thatopen/ui"

import { Project, IProject, ProjectStatus, ProjectType, ModelVisibility } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";
import { deleteFile, updateDocument } from "../firebase"


interface Props {
    project: Project
    projectsManager: ProjectsManager
    onCloseForm: () => void;
}


export function ShowModelsWindow(props: Props) {
    //References
    const modelsTableContainer = React.useRef<HTMLDivElement>(null)


    //State for managing the model visibility
    const [models, setModels] = React.useState<Record<string, ModelVisibility>>(
        { ...props.project.modelDictionary }
    );
    
    const routeParams = Router.useParams<{ id: string }>()
    if (!routeParams.id) { return (<p> There is no project id</p>) }
    const project = props.projectsManager.getProject(routeParams.id)
    if (!project) { return (<p> Project couldn't be fount</p>) }

    //BIM Table for models with all its functionality
    const modelsTable = BUI.Component.create<BUI.Table>(() => {
        return BUI.html`
        <bim-table style="background-color: #f1f2f4; border-radius: 8px;"></bim-table>
      `
    })

    React.useEffect(() => {

        modelsTableContainer.current?.appendChild(modelsTable)

        const formattedData = Object.entries(props.project.modelDictionary).map(([key, value]) => ({
            data: {
                Name: key,
                Visibility: "",
                Delete: ""
            }
        }));

        const table = document.querySelector("bim-table");
        const columns = [
            { name: "Name", width: "300px" },
            { name: "Visibility", width: "100px" },
            { name: "Delete", width: "80px" }
        ];

        modelsTable.columns = columns;

        if (table) {
            table.data = formattedData
            table.dataTransform = {

                Visibility: (value, rowData) => {
                    const onChange = (e: Event) => {
                        const input = e.target;
                        if (!(input instanceof BUI.Checkbox)) return;
                        rowData.Visibility = input.checked;


                        if (rowData.Visibility) {
                            setModels((prevModels) => ({
                                ...prevModels,
                                [rowData.Name as string]: "Shown"
                            }));
                        }
                        else {
                            setModels((prevModels) => ({
                                ...prevModels,
                                [rowData.Name as string]: "Hidden"
                            }));
                        }


                    };

                    const isChecked = models[rowData.Name as string] === "Shown";

                    return BUI.html`
                       <bim-checkbox @change=${onChange} .checked=${isChecked}></bim-checkbox> 
                      `;


                },

                Delete: (value, rowData) => {
                    const deleteRow = () => {
                        delete models[rowData.Name as string]
                        table.data = table.data.filter(item => item.data.Name !== rowData.Name);
                    }

                    return BUI.html`
                    <div>
                        <bim-button icon="material-symbols:delete" style="background-color: red" @click=${deleteRow}></bim-button>
                    </div>  
                    `
                }
            }

        }

    }, [])


    //Function for handling the cancel button click
    const onCancelButtonClick = () => {
        const modal = document.getElementById("show-models-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }
        modal.close()
        props.onCloseForm()
    }

    //Function for handling the accept button click
    const onAcceptButtonClick = async () => {
        const table = document.querySelector("bim-table");
        if (!table) return

        const modal = document.getElementById("show-models-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }


        //Delete the models that are not present in the models dictionary
        const modelDictionary = props.project.modelDictionary;
        const modelsKeys = new Set(Object.keys(models));


        Object.keys(modelDictionary).forEach(modelName => {
            if (!modelsKeys.has(modelName)) {
                deleteFile(props.project.name + "/" + modelName + ".frag")
            }
        });

        
        //Change the hidden/show property

        //This is EXTREMELY IMPORTANT, the project here is updated in firebase
        props.project.modelDictionary=models
        await updateDocument("/projects", project.id, {
            modelDictionary: models
        });

        props.project.modelDictionaryVersion++

        modal.close()
        props.onCloseForm()
    }



    return (
        <dialog id="show-models-modal" >
            <div id="show-models-form" style={{ width: "auto", padding: "10px", borderRadius: "8px", backgroundColor: "var(--background)" }}>
                <div className="modal-content" >
                    <h2 style={{ color: "white" }}>Select models</h2>
                    <div className="model-list" ref={modelsTableContainer}></div>
                    <div className="modal-buttons"
                        style={{
                            margin: "10px 0px 10px auto",
                            columnGap: 10,
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px"
                        }}>
                        <button onClick={onCancelButtonClick} style={{ backgroundColor: "transparent" }}>Cancel</button>
                        <button onClick={onAcceptButtonClick} style={{ backgroundColor: "rgb(18, 145, 18)" }}>Accept</button>
                    </div>
                </div>

            </div>

        </dialog>
    )
}
