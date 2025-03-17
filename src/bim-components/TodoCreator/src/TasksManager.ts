import * as OBC from "@thatopen/components"
import * as BUI from "@thatopen/ui"
import { ProjectsManager } from "../../../class/ProjectsManager"
import { IToDo, ToDo } from "../../../class/ToDo"
import { updateDocument } from "../../../firebase"

//Create the taskStatus type
export type TaskStatus = "Pending" | "Overdue" | "Finished"

//ToDo type
export interface TodoData {
    name: string
    description: string
    status: TaskStatus
    date: Date
}

export class ToDosManager extends OBC.Component {
    enabled = true
    static uuid = "b3393707-46dc-4afa-ac43-0faac283159c"

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(ToDosManager.uuid, this)
    }

    //To Satisfy IToDosManager

    //Class internals
    projectsManager: ProjectsManager
    onToDoModified = () => { }

    //Set the projects manager (Super important!)
    setProjectsManager(projectsManager: ProjectsManager) {
        this.projectsManager = projectsManager
    }


    //Methods
    addToDo(data: IToDo, projectId: string) {

        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        let color: string

        if (isNaN(data.date.getDate())) {
            data.date = new Date(2024, 1, 1)
        }

        if (data.name.length < 5) {
            throw new Error(`The name must have at least 5 characters`)
        }

        const toDo = new ToDo(data)
        project.toDosList.push(toDo)

        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)
        updateDocument("/projects", projectId, { toDosList: staticToDosList });
        this.onToDoModified()
    }


    getTaskById(taskId: string, projectId: string) {

        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = project.toDosList.find((task) => {
            return task.id === taskId
        })

        return task
    }

    editTask(taskId: string, projectId: string) {

        //Get the task and the project
        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = this.getTaskById(taskId, projectId)
        if (!task) return

        //Edit ToDo Modal
        const editToDoModal = BUI.Component.create<HTMLDialogElement>(() => {
        return BUI.html`
        <dialog id="edit-todo-modal">
                <form id="edit-todo-form" onsubmit={onFormSubmit}>
                    <h2>Edit Task</h2>
                    <div class="input-list">
                        <div class="form-field-container">
                            <label for="description">
                                <span class="material-icons-round">subject</span>
                                Description
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                cols="30"
                                rows="5"
                                placeholder="Give your task a short description."
                            ></textarea>
                        </div>
                        <div class="form-field-container">
                            <label for="status">
                                <span class="material-icons-round">not_listed_location</span>
                                Status
                            </label>
                            <select id="status" name="status">
                                <option value="Pending">Pending</option>
                                <option value="Overdue">Overdue</option>
                                <option value="Finished">Finished</option>
                            </select>
                        </div>
                        <div class="form-field-container">
                            <label for="date">
                                <span class="material-icons-round">calendar_month</span>
                                Finish Date
                            </label>
                            <input id="date" name="date" type="date" />
                        </div>
                        <div style="display: flex; margin: 10px 0px 10px auto; gap: 10px;">
                        <bim-button
                            style="background-color: red;"
                            label="Cancel"
                            @click=${() => {
                        {
                            const modal = document.getElementById("edit-todo-modal")
                            if (!(modal && modal instanceof HTMLDialogElement)) { return }
                            modal.close()
                            modal.remove()
                        }
                    }}
                        >
                        </bim-button>
                        <bim-button 
                        label="Edit"
                        @click=${() => {
                        {
                            const modal = document.getElementById("edit-todo-modal")
                            if (!(modal && modal instanceof HTMLDialogElement)) { return }
                            const editDoDoForm = document.getElementById("edit-todo-form")
                            if (!(editDoDoForm && editDoDoForm instanceof HTMLFormElement)) { return }

                            const formData = new FormData(editDoDoForm)
                            const editToDoData: IToDo =
                            {
                                name: task.name,
                                description: formData.get("description") as string,
                                status: formData.get("status") as TaskStatus,
                                date: new Date(formData.get("date") as string),
                            }

                            try {
                                if (editToDoData.date.toDateString() == "Invalid Date") {
                                    editToDoData.date = new Date(2024, 1, 1)
                                }
                                for (const key in editToDoData) {
                                    if (task.hasOwnProperty(key) && editToDoData[key]) {
                                        task[key] = editToDoData[key];
                                    }
                                }
                                task.setColor()
                                this.onToDoModified()
                                const staticToDosList = ToDosManager.toPlainObject(project.toDosList)
                        
                                updateDocument("/projects", projectId, { toDosList: staticToDosList });
                            }
                            catch (error) {
                                alert(error)
                            }
                            modal.close()
                            modal.remove()
                        }
                    }
                    }
                    >
                    </bim-button>
                    </div>
                    </div>
                </form>
            </dialog>
        `
        })

        document.body.appendChild(editToDoModal)
        editToDoModal.showModal()
        
    }


    deleteTask(taskId: string, projectId: string) {
        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = this.getTaskById(taskId, projectId)
        if (!task) return

        project.toDosList = project.toDosList.filter(item => item !== task)
        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)
        updateDocument("/projects", projectId, { toDosList: staticToDosList });
        this.onToDoModified()
    }

    //To PlainObject
    static toPlainObject(toDosList: ToDo[]): Record<string, any> {
        return {
            toDosList: toDosList.map(toDo => toDo.toPlainObject()),
        };
    }

    // Rebuild
    static fromData(data: any) {
        if (typeof data === 'object' && data !== null && 'toDosList' in data) {
            data = data.toDosList;
        }

        if (!Array.isArray(data)) {
            console.log("Error: fromData esperaba un array, pero recibió:", data);
            return [];
        }

        const toDosList = (data || []).map((toDoData: any) => {
            return new ToDo({
                name: toDoData.name,
                description: toDoData.description,
                status: toDoData.status as TaskStatus,
                date: new Date(toDoData.date),
            });
        });

        return toDosList;
    }
}