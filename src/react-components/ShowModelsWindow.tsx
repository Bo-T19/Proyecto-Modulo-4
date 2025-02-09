import * as React from "react";
import * as Router from "react-router-dom";
import * as BUI from "@thatopen/ui"

import { Project, IProject, ProjectStatus, ProjectType, ModelVisibility } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";

interface Props {
    project: Project
    projectsManager: ProjectsManager
    onCloseForm: () => void;
}


export function ShowModelsWindow(props: Props) {
    //References
    const modelsTableContainer = React.useRef<HTMLDivElement>(null)


    //States
    const [models, setModels] = React.useState<Record<string, ModelVisibility>>(props.project.modelDictionary)

    const routeParams = Router.useParams<{ id: string }>()
    if (!routeParams.id) { return (<p> There is no project id</p>) }
    const project = props.projectsManager.getProject(routeParams.id)
    if (!project) { return (<p> Project couldn't be fount</p>) }

    const onCancelButtonClick = () => {
        const modal = document.getElementById("show-models-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }
        modal.close()
        props.onCloseForm()
    }


    const onAcceptButtonClick = () => {
        const table = document.querySelector("bim-table");
        if(!table) return
        /*
        const tableData = table.data
        for

*/
        const modal = document.getElementById("show-models-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }
        modal.close()
        props.onCloseForm()
    }


    //BIM Table for models
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

                Visibility: () => {
                    return BUI.html`
                    <div>
                        <input type="checkbox" id="Visibility">
                    </div>  
                    `
                },

                Delete: () => {
                    return BUI.html`
                    <div>
                        <bim-button icon="material-symbols:delete" style="background-color: red"></bim-button>
                    </div>  
                    `
                }
            }

        }

    }, [])


    return (
        <dialog id="show-models-modal" >
            <form id="show-models-form" style={{width: "auto", padding: "10px", borderRadius: "8px"}}>
                <div className="modal-content" >
                    <h2>Select models</h2>
                    <div className="model-list" ref={modelsTableContainer}></div>
                    <div className="modal-buttons"
                        style={{
                            margin: "10px 0px 10px auto",
                            columnGap: 10,
                            display: "flex", 
                            justifyContent: "flex-end", 
                            gap: "10px"
                        }}>
                        <button onClick={onCancelButtonClick}  style={{backgroundColor: "transparent"}}>Cancel</button>
                        <button onClick={onAcceptButtonClick} style={{ backgroundColor: "rgb(18, 145, 18)" }}>Accept</button>
                    </div>
                </div>

            </form>

        </dialog>
    )
}
