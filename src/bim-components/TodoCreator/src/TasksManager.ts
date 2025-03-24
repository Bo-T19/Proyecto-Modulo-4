import * as OBC from "@thatopen/components"
import * as OBCF from "@thatopen/components-front"
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { ProjectsManager } from "../../../class/ProjectsManager"
import { ToDo } from "../../../class/ToDo"
import { updateDocument } from "../../../firebase"
import { TaskStatus, TodoData } from "./base-types"
import CameraControls from 'camera-controls';

export class ToDosManager extends OBC.Component implements OBC.Disposable {
    enabled = true
    static uuid = "b3393707-46dc-4afa-ac43-0faac283159c"

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(ToDosManager.uuid, this)
    }

    //Dispose
    onDisposed: OBC.Event<any> = new OBC.Event()
    async dispose ()
    {
      this.enabled = false
      this.onDisposed.trigger()
    }
    //To Satisfy IToDosManager

    //Class internals
    projectsManager: ProjectsManager
    onToDoModified = () => { }

    //Set the projects manager (Super important!)
    setProjectsManager(projectsManager: ProjectsManager) {
        this.projectsManager = projectsManager
    }

    //Private properties and setters
    private _world: OBC.World
    private _cameraControls: CameraControls

    set world(world: OBC.World) {
        this._world = world;
        const camera = world.camera;
        if (!camera.hasCameraControls()) {
            throw new Error("The world camera doesn't have camera controls");
        }
        this._cameraControls = camera.controls;
    }


    //Setup method
    setup() {
        const highlighter = this.components.get(OBCF.Highlighter)
        highlighter.add(`${ToDosManager.uuid}-status-Pending`, new THREE.Color(0xf4d03f));
        highlighter.add(`${ToDosManager.uuid}-status-Overdue`, new THREE.Color(0xe74c3c));
        highlighter.add(`${ToDosManager.uuid}-status-Finished`, new THREE.Color(0x52be80));
    }

    //Methods
    highlightByStatus(enablePriorityHighlight: boolean, projectId: string) {
        if (!this.enabled) return
        const highlighter = this.components.get(OBCF.Highlighter)
        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        if (enablePriorityHighlight) {
            for (const todo of project.toDosList) {
                const fragments = this.components.get(OBC.FragmentsManager)
                const fragmentIdMap = fragments.guidToFragmentIdMap(todo.ifcGuids)
                console.log(todo.status)
                highlighter.highlightByID(`${ToDosManager.uuid}-status-${todo.status}`, fragmentIdMap, false, false)
            }
        } else {
            highlighter.clear()
        }
    }

    addToDo(data: TodoData, projectId: string) {
        if (!this.enabled) return
        const camera = this._world.camera
        if (!(camera.hasCameraControls())) {
            throw new Error("The world camera doesn't have camera controls")
        }

        const position = new THREE.Vector3()
        camera.controls.getPosition(position)
        const target = new THREE.Vector3()
        camera.controls.getTarget(target)


        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        let color: string

        if (isNaN(data.date.getDate())) {
            data.date = new Date(2024, 1, 1)
        }

        if (data.name.length < 5) {
            throw new Error(`The name must have at least 5 characters`)
        }

        data.camera = { position, target }

        const toDo = new ToDo(data)
        project.toDosList.push(toDo)

        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)
        updateDocument("/projects", projectId, { toDosList: staticToDosList });
        this.onToDoModified()
    }


    getTaskById(taskId: string, projectId: string) {
        if (!this.enabled) return
        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = project.toDosList.find((task) => {
            return task.id === taskId
        })

        return task
    }

    editTask(taskId: string, projectId: string) {
        if (!this.enabled) return
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
                        const editToDoData: TodoData =
                        {
                            name: task.name,
                            description: formData.get("description") as string,
                            status: formData.get("status") as TaskStatus,
                            date: new Date(formData.get("date") as string),
                            ifcGuids: task.ifcGuids,
                            camera: task.camera
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
        if (!this.enabled) return
        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = this.getTaskById(taskId, projectId)
        if (!task) return

        project.toDosList = project.toDosList.filter(item => item !== task)
        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)
        updateDocument("/projects", projectId, { toDosList: staticToDosList });
        this.onToDoModified()
    }

    addModelElementToTask(taskId: string, projectId: string) {
        if (!this.enabled) return
        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = this.getTaskById(taskId, projectId)
        if (!task) return

        const fragmentsManager = this.components.get(OBC.FragmentsManager)
        const highlighter = this.components.get(OBCF.Highlighter)
        const guids = fragmentsManager.fragmentIdMapToGuids(highlighter.selection.select)

        task.ifcGuids = [...new Set([...task.ifcGuids, ...guids])];
        this.onToDoModified()
        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)

        updateDocument("/projects", projectId, { toDosList: staticToDosList });
    }

    //Highlight to do for when a row is selected
    async highlightToDo(guids: string[], toDoCamera: { position: THREE.Vector3, target: THREE.Vector3 }) {
        if (!this.enabled) return
        const fragments = this.components.get(OBC.FragmentsManager)
        if (guids) {
            const fragmentIdMap = fragments.guidToFragmentIdMap(guids)
            const highlighter = this.components.get(OBCF.Highlighter)
            highlighter.highlightByID("select", fragmentIdMap, true, false)
        }
        if (!this._world) {
            throw new Error("No world found")
        }

        await this._cameraControls.setLookAt(
            toDoCamera.position.x,
            toDoCamera.position.y,
            toDoCamera.position.z,
            toDoCamera.target.x,
            toDoCamera.target.y,
            toDoCamera.target.z,
            true
        )
    }

    //To PlainObject
    static toPlainObject(toDosList: TodoData[]): Record<string, any> {
        return {
            toDosList: toDosList.map(({ name, description, status, date, ifcGuids, camera }) => ({
                name,
                description,
                status,
                date: date instanceof Date ? date.toISOString() : date,
                ifcGuids: [...ifcGuids],
                camera: JSON.stringify(camera)
            })),
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
                ifcGuids: toDoData.ifcGuids,
                camera: JSON.parse(toDoData.camera)
            });
        });

        return toDosList;
    }
}