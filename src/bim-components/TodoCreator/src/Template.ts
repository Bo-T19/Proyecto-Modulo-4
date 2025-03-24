import * as OBC from "@thatopen/components"
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui"
import { ToDosManager } from "./TasksManager"
import { ProjectsManager } from "../../../class/ProjectsManager"
import { TaskStatus, TodoData } from "./base-types";
import { Vector3 } from "three";

export interface TodoUIState {
    components: OBC.Components
    projectsManager: ProjectsManager
    projectId: string
}

export const todoTool = (state: TodoUIState) => {
    const components = state.components
    const projectsManager = state.projectsManager
    const projectId = state.projectId
    const todosManager = components.get(ToDosManager)
    todosManager.setProjectsManager(projectsManager)

    //Modal for creating to dos
    const todoModal = BUI.Component.create<HTMLDialogElement>(() => {
        return BUI.html`
       <dialog id="new-todo-modal">
            <form id="new-todo-form" onsubmit={onFormSubmit}>
                <h2>New Task</h2>
                <div class="input-list">
                <div class="form-field-container">
                        <label for="name">
                            <span class="material-icons-round">subject</span>
                            Name
                        </label>
                        <input
                            id="description"
                            name="name"
                            cols="30"
                            rows="1"
                            placeholder="Give your task a name."
                        />
                    </div>
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
                    const modal = document.getElementById("new-todo-modal")
                    if (!(modal && modal instanceof HTMLDialogElement)) { return }
                    modal.close()
                    modal.remove()
                }
            }}
                    >
                    </bim-button>
                    <bim-button 
                    label="Create"
                    @click=${() => {
                {
                    const newToDOForm = document.getElementById("new-todo-form")
                    if (!(newToDOForm && newToDOForm instanceof HTMLFormElement)) { return }

                    const formData = new FormData(newToDOForm)
                    const fragmentsManager = components.get(OBC.FragmentsManager)
                    const highlighter = components.get(OBCF.Highlighter)
                    const guids = fragmentsManager.fragmentIdMapToGuids(highlighter.selection.select)

                    const newToDoData: TodoData =
                    {
                        name: formData.get("name") as string,
                        description: formData.get("description") as string,
                        status: formData.get("status") as TaskStatus,
                        date: new Date(formData.get("date") as string),
                        ifcGuids: guids,
                        camera: {
                            position: new Vector3,
                            target: new Vector3
                        }
                    }
                    try {
                        const newToDo = todosManager.addToDo(newToDoData, projectId)
                        newToDOForm.reset()
                        const modal = document.getElementById("new-todo-modal")
                        if (!(modal && modal instanceof HTMLDialogElement)) { return }
                        modal.close()
                        modal.remove()
                    }
                    catch (error) {
                        alert(error)
                    }
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

    //Dispose
    todosManager.onDisposed.add(() => {
        todoButton.remove()
        todoPriorityButton.remove()
        todoModal.remove
        console.log("Disposed")
    }
    )

    //Button for showing the modal
    const todoButton = BUI.Component.create<BUI.Button>(() => {
        return BUI.html`
        <bim-button
            @click=${() => {
                {
                    //Append the modal to the page
                    document.body.appendChild(todoModal)
                    todoModal.showModal()
                }
            }}
            icon="pajamas:todo-done"
            tooltip-title="To-Do"
        >
        </bim-button>
        `
    })

    const onTogglePriority = (event: Event) => {
        const btn = event.target as BUI.Button
        btn.active = !btn.active
        todosManager.highlightByStatus(btn.active, projectId)
    }

    const todoPriorityButton = BUI.Component.create<BUI.Button>(() => {
        return BUI.html`
          <bim-button 
            icon="iconoir:fill-color"
            tooltip-title="Show Priority Filter"
            @click=${onTogglePriority}
          ></bim-button>
        `
    })


    return [todoButton, todoPriorityButton]
}