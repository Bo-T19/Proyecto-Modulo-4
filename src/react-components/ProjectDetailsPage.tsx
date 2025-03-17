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

interface Props {
    projectsManager: ProjectsManager
}

export function ProjectDetailsPage(props: Props) {
    //Components instance, important for the IFCViewer and the ToDos
    const components = new OBC.Components();

    const routeParams = Router.useParams<{ id: string }>()
    if (!routeParams.id) { return (<p> There is no project id</p>) }
    const project = props.projectsManager.getProject(routeParams.id)
    if (!project) { return (<p> Project couldn't be found</p>) }

    //State for the EditProjectForm and methods for showing it, also for NewToDoForm and EditToDoForm
    const [showEditProjectForm, setEditProjectForm] = React.useState(false)
    const [showNewToDoForm, setNewToDoForm] = React.useState(false)
    const [showEditToDoForm, setEditToDoForm] = React.useState(false)
    const [showShowModels, setShowModels] = React.useState(false)
    const [activeTaskId, setActiveTaskId] = React.useState<string>("")


    //EditProjectForm
    const handleCloseEditProjectForm = () => {
        setEditProjectForm(false);
    }


    const onEditProjectClick = () => {
        setEditProjectForm(true);
    }

    React.useEffect(() => {
        if (showEditProjectForm) {
            const modal = document.getElementById("edit-project-modal");
            if (modal && modal instanceof HTMLDialogElement) {
                modal.showModal();
            }
        }
    }, [showEditProjectForm]);




    //NewToDoForm
    const handleCloseNewToDoForm = () => {
        setNewToDoForm(false);
    };


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

    React.useEffect(() => {
        if (showEditToDoForm) {
            const modal = document.getElementById("edit-todo-modal");
            if (modal && modal instanceof HTMLDialogElement) {
                modal.showModal();
            }
        }
    }, [showEditToDoForm]);


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

    //Task Id 

    const setId = (id: string) => {
        setActiveTaskId(id)
    }


    //Firebase

    const navigateTo = Router.useNavigate()
    props.projectsManager.onProjectDeleted = async (id) => {
        await deleteDocument("/projects", id)
        navigateTo("/")
    }


    return (
        <div className="page" id="project-details" >
            <header>
                <div>
                    <h2 data-project-info="name">{project.name}</h2>
                    <p data-project-info="description" style={{ color: "#969696" }}>
                        {project.description}
                    </p>
                </div>

                <button id="show-models" onClick={onShowModelsClick} className="btn-secondary">
                    <p style={{ width: "100%" }}>Show models</p>
                </button>
            </header>
            {showEditProjectForm ? <EditProjectForm project={project}
                projectsManager={props.projectsManager}
                onCloseForm={handleCloseEditProjectForm} /> : <></>}
            {showShowModels ? < ShowModelsWindow
                project={project}
                projectsManager={props.projectsManager}
                onCloseForm={handleCloseShowModels}
            /> : <></>}

            <div className="main-page-content" style={{ height: "calc(100vh - 20px)", overflow: "hidden" }}>
                <div style={{ display: "flex", flexDirection: "column", rowGap: 30, overflowY: "auto", height: "100%" }}>
                    <ProjectSummary project={project} projectsManager={props.projectsManager} onOpenForm={onEditProjectClick} />
                    <ToDoList project={project} onOpenNewForm={onNewToDoClick} onOpenEditForm={onEditToDoClick} sendId={setId} components={components} projectsManager={props.projectsManager}/>
                </div>

                <IFCViewer project={project} projectsManager={props.projectsManager} components={components} />

            </div>
        </div>
    )
}
