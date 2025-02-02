import * as React from "react";
import * as Router from "react-router-dom";

import { Project, IProject, ProjectStatus, ProjectType } from "../class/Project";
import { ProjectsManager } from "../class/ProjectsManager";

interface Props {
    project: Project
    projectsManager: ProjectsManager
    onCloseForm: () => void;
}


export function EditProjectForm(props: Props) {


    const routeParams = Router.useParams<{ id: string }>()
    if (!routeParams.id) { return (<p> There is no project id</p>) }
    const project = props.projectsManager.getProject(routeParams.id)
    if (!project) { return (<p> Project couldn't be fount</p>) }

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const editProjectForm = document.getElementById("edit-project-form")
        if (!(editProjectForm && editProjectForm instanceof HTMLFormElement)) { return }

        const formData = new FormData(editProjectForm)

        const editProjectData: IProject =
        {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            status: formData.get("status") as ProjectStatus,
            projectType: formData.get("type") as ProjectType,
            finishDate: new Date(formData.get("date") as string),
            cost: formData.get("cost") as unknown as number,
            progress: formData.get("progress") as unknown as number,
            toDosManager: project.toDosManager
 
        }
        try {
            console.log(editProjectData)
            props.projectsManager.editProject(project, editProjectData)
            editProjectForm.reset()
            const modal = document.getElementById("edit-project-modal")
            if (!(modal && modal instanceof HTMLDialogElement)) { return }
            modal.close()
            props.onCloseForm()
        }
        catch (error) {
            alert(error)
        }
    }


    const onCancelButtonClick = () => {
        const modal = document.getElementById("edit-project-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }
        modal.close()
        props.onCloseForm()
    }


    return (
        <dialog id="edit-project-modal">
            <form id="edit-project-form">
                <h2>Edit Project</h2>
                <div className="input-list">
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">apartment</span>Name
                        </label>
                        <input
                            name="name"
                            type="text"
                            placeholder="What's the name of your project?"
                            defaultValue={props.project.name}
                        />
                        <p
                            style={{
                                color: "gray",
                                fontSize: "var(--font-sm)",
                                marginTop: 5,
                                fontStyle: "italic"
                            }}
                        >
                            TIP: Give it a short name
                        </p>
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">subject</span>Description
                        </label>
                        <textarea
                            name="description"
                            cols={30}
                            rows={5}
                            placeholder="Give your project a nice description! So people is jealous about it."
                            defaultValue={props.project.description}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">person</span>Type
                        </label>
                        <select name="type" defaultValue={props.project.projectType}>
                            <option>Infrastructure</option>
                            <option>Housing</option>
                            <option>Private sector</option>
                        </select>
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">not_listed_location</span>
                            Status
                        </label>
                        <select name="status" defaultValue={props.project.status}>
                            <option>Pending</option>
                            <option>Active</option>
                            <option>Finished</option>
                        </select>
                    </div>
                    <div className="form-field-container">
                        <label htmlFor="finishDate">
                            <span className="material-icons-round">calendar_month</span>
                            Finish Date
                        </label>
                        <input name="date" type="date" />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">attach_money</span>Cost
                        </label>
                        <textarea
                            name="cost"
                            cols={30}
                            rows={1}
                            placeholder="Enter just an integer number, no more."
                            defaultValue={props.project.cost}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">percent</span>Progress
                        </label>
                        <textarea
                            name="progress"
                            cols={30}
                            rows={1}
                            placeholder="Enter just an integer number from 0 to 100, no more."
                            defaultValue={props.project.progress}
                        />
                    </div>
                    <div
                        style={{
                            display: "flex",
                            margin: "10px 0px 10px auto",
                            columnGap: 10
                        }}
                    >
                        <button
                            id="edit-form-cancel-button"
                            type="button"
                            style={{ backgroundColor: "transparent" }}
                            onClick={onCancelButtonClick}
                        >
                            Cancel
                        </button>
                        <button type="submit" onClick={onFormSubmit} style={{ backgroundColor: "rgb(18, 145, 18)" }}>
                            Accept
                        </button>
                    </div>
                </div>
            </form>
        </dialog>
    )
}
