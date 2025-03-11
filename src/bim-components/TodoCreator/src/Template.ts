import * as OBC from "@thatopen/components"
import * as BUI from "@thatopen/ui"
import { ToDosManager } from "./TasksManager"
import { ProjectsManager } from "../../../class/ProjectsManager"

export interface TodoUIState {
    components: OBC.Components
    projectsManager : ProjectsManager
}

export const todoTool = (state: TodoUIState) => {
    const  components  = state.components
    const projectsManager = state.projectsManager
    const todosManager = components.get(ToDosManager)
    todosManager.setProjectsManager(projectsManager)

    //Modal for creating to dos
    const todoModal = BUI.Component.create<HTMLDialogElement>(() => {
        return BUI.html`
       <dialog id="new-todo-modal">
            <form id="new-todo-form" onsubmit="handleFormSubmit(event)">
                <h2>New Task</h2>
                <div class="input-list">
                <div class="form-field-container">
                        <label for="name">
                            <span class="material-icons-round">subject</span>
                            Name
                        </label>
                        <input
                            id="description"
                            name="description"
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
                            <option value="pending">Pending</option>
                            <option value="overdue">Overdue</option>
                            <option value="finished">Finished</option>
                        </select>
                    </div>
                    <div class="form-field-container">
                        <label for="finishDate">
                            <span class="material-icons-round">calendar_month</span>
                            Finish Date
                        </label>
                        <input id="finishDate" name="finishDate" type="date" />
                    </div>
                    <div style="display: flex; margin: 10px 0px 10px auto; column-gap: 10;">
                        <button   id="new-todo-cancel-button" type="button" style="background-color: transparent;">
                            Cancel
                        </button>
                        <button type="submit" style="background-color: rgb(18, 145, 18);">
                            Accept
                        </button>
                    </div>
                </div>
            </form>
        </dialog>
        `
    })
    //Append the modal to the page
    document.body.appendChild(todoModal)

    //Function for closing the modal
    const handleCancelButtonClick = ()=> {
        todoModal.close()
    }
    document.getElementById("new-todo-cancel-button")?.addEventListener("click", handleCancelButtonClick);

    //Button for showing the modal
    return BUI.Component.create<BUI.Button>(() => {
        return BUI.html`
        <bim-button
            @click=${()=>todoModal.showModal()}
            icon="pajamas:todo-done"
            tooltip-title="To-Do"
        >
        </bim-button>
        `
    })
}