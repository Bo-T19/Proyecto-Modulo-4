import * as React from "react";

import { ToDo, IToDo , TaskStatus} from "../class/ToDo";
import { ToDosManager } from "../class/ToDosManager";


interface Props {
    onCloseForm: () => void;
    toDosManager: ToDosManager
}

export function NewToDoForm(props: Props) {

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        const newToDOForm = document.getElementById("new-todo-form")
        if (!(newToDOForm && newToDOForm instanceof HTMLFormElement)) { return }

        const formData = new FormData(newToDOForm)

        const newToDoData: IToDo =
        {

            description: formData.get("description") as string,
            status: formData.get("status") as TaskStatus,
            date: new Date(formData.get("date") as string),
        }
        try {
            
            props.toDosManager.addToDo(newToDoData)
            newToDOForm.reset()
            const modal = document.getElementById("new-todo-modal")
            if (!(modal && modal instanceof HTMLDialogElement)) { return }
            modal.close()
            props.onCloseForm()
            
        }
        catch (error) {
            alert(error)
        }

    }

    const onCancelButtonClick = () => {
        const modal = document.getElementById("new-todo-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }
        modal.close()
        props.onCloseForm()
    }


    return (
        <dialog id="new-todo-modal">
            <form id="new-todo-form" onSubmit={onFormSubmit}>
                <h2>New task</h2>
                <div className="input-list">
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">subject</span>Description
                        </label>
                        <textarea
                            name="description"
                            cols={30}
                            rows={5}
                            placeholder="Give your task a short description."
                            defaultValue={""}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">not_listed_location</span>
                            Status
                        </label>
                        <select name="status">
                            <option>Pending</option>
                            <option>Overdue</option>
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
                    <div
                        style={{ display: "flex", margin: "10px 0px 10px auto", columnGap: 10 }}
                    >
                        <button
                            id="new-todo-cancel-button"
                            type="button"
                            style={{ backgroundColor: "transparent" }}
                            onClick = {onCancelButtonClick}
                        >
                            Cancel
                        </button>
                        <button type="submit" style={{ backgroundColor: "rgb(18, 145, 18)" }} >
                            Accept
                        </button>
                    </div>
                </div>
            </form>
        </dialog>

    )
}
