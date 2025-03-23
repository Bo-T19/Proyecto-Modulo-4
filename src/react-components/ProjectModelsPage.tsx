import * as React from "react";
import * as Router from "react-router-dom";
import { ProjectsManager } from "../class/ProjectsManager";
import { ProjectSummary } from "./ProjectSummary";
import { EditProjectForm } from "./EditProjectForm";
import { ToDoList } from "./ToDoList";
import { IFCViewer } from "./IFCViewer";
import * as OBC from "@thatopen/components"
import { deleteDocument } from "../firebase";
import { ShowModelsWindow } from "./ShowModelsWindow";
import { ModelsManagementTable } from "./ModelsManagementTable";

interface Props {
    projectsManager: ProjectsManager
}

export function ProjectModelsPage(props: Props) {


    //Components instance, important for the IFCViewer and the ToDos
    const components = new OBC.Components();

    const routeParams = Router.useParams<{ id: string }>()
    if (!routeParams.id) { return (<p> There is no project id</p>) }
    const project = props.projectsManager.getProject(routeParams.id)
    if (!project) { return (<p> Project couldn't be found</p>) }

    //State for the ModelsVisibilityForm and methods for showing it, also for NewToDoForm and EditToDoForm
    const [showShowModels, setShowModels] = React.useState(false)
    const [showNewToDoForm, setNewToDoForm] = React.useState(false)
    const [showEditToDoForm, setEditToDoForm] = React.useState(false)

    //NewToDoForm
    const onNewToDoClick = () => {
        setNewToDoForm(true);
    }

    React.useEffect(() => {
        if (showNewToDoForm) {
            const modal = document.getElementById("new-todo-modal");
            if (modal && modal instanceof HTMLDialogElement) {
                modal.showModal();
            }
        }
    }, [showNewToDoForm]);

    //EditToDoForm
    const handleCloseEditToDoForm = () => {
        setEditToDoForm(false);
    };


    const onEditToDoClick = () => {
        setEditToDoForm(true);
    }

        //ShowModelsWindow
        const handleCloseShowModels = () => {
            setShowModels(false)
        }
    
        const onShowModelsClick = () => {
            setShowModels(true)
        }
    
        React.useEffect(() => {
            if (showShowModels) {
                const modal = document.getElementById("show-models-modal");
                if (modal && modal instanceof HTMLDialogElement) {
                    modal.showModal();
                }
            }
        }, [showShowModels]);
    

    React.useEffect(() => {
        if (showEditToDoForm) {
            const modal = document.getElementById("edit-todo-modal");
            if (modal && modal instanceof HTMLDialogElement) {
                modal.showModal();
            }
        }
    }, [showEditToDoForm]);


    React.useEffect(() => {
        if (showShowModels) {
            const modal = document.getElementById("show-models-modal");
            if (modal && modal instanceof HTMLDialogElement) {
                modal.showModal();
            }
        }
    }, [showShowModels]);

    return (
        <div className="page" id="project-models" >
            <header>
                <div>
                    <h2 data-project-info="name">{project.name}</h2>
                    <p data-project-info="description" style={{ color: "#969696" }}>
                        {project.description}
                    </p>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <Router.Link to={`/project/${project.id}`} key={project.id} >
                        <button id="go-to-project-details">
                            <p style={{ width: "100%" }}>Project page</p>
                        </button>
                    </Router.Link>
                    <button id="show-models" onClick={onShowModelsClick} className="btn-secondary">
                        <p style={{ width: "100%" }}>Models visibility</p>
                    </button>
                </div>
            </header>
            {showShowModels ? < ShowModelsWindow
                project={project}
                projectsManager={props.projectsManager}
                onCloseForm={handleCloseShowModels}
            /> : <></>}
            <div className="main-page-content" style={{ height: "calc(100vh - 20px)", overflow: "hidden" }}>
                <ToDoList project={project} onOpenNewForm={onNewToDoClick} onOpenEditForm={onEditToDoClick} components={components} projectsManager={props.projectsManager} />
                <IFCViewer project={project} projectsManager={props.projectsManager} components={components} />
            </div>
        </div>
    )
}
