import * as React from "react";
import { IUser, User } from "../class/User";
import { UsersManager } from "../class/UsersManager";
import { getCollection } from "../firebase";
import * as Firestore from "firebase/firestore"

interface Props {
    usersManager: UsersManager;
    onCloseForm: () => void;
}

export function CreateUserForm(props: Props) {




    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const userForm = document.getElementById("new-user-form")
        if (!(userForm && userForm instanceof HTMLFormElement)) { return }

        const formData = new FormData(userForm)

        const newUserData: IUser =
        {
            name: formData.get("name") as string,
            email: formData.get("email") as string,
            company: formData.get("company") as string,
            role: formData.get("role") as string,
            area: formData.get("area") as string,
            phoneNumber: formData.get("phoneNumber") as string

        }
        try {

            const newUser = props.usersManager.newUser(newUserData)
            const projectsCollection = getCollection<IUser>("/users")
            Firestore.addDoc(projectsCollection, newUserData)
            userForm.reset()
            const modal = document.getElementById("new-user-modal")
            if (!(modal && modal instanceof HTMLDialogElement)) { return }
            modal.close()
            props.onCloseForm()
        }
        catch (error) {
            alert(error)
        }
    }



    const onCancelButtonClick = () => {
        const modal = document.getElementById("new-user-modal")
        if (!(modal && modal instanceof HTMLDialogElement)) { return }
        modal.close()
        props.onCloseForm()
    }


    return (
        <dialog id="new-user-modal">
            <form onSubmit={(e) => { onFormSubmit(e) }} id="new-user-form">
                <h2>New User</h2>
                <div className="input-list">
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">account_circle</span>Name
                        </label>
                        <input
                            name="name"
                            type="text"
                            placeholder="What's the name of the user?"
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">email</span>Email
                        </label>
                        <input
                            name="email"
                            placeholder="Write the user's email"
                            defaultValue={""}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">work</span>Company
                        </label>
                        <input
                            name="company"
                            placeholder="Write the user's company"
                            defaultValue={""}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">engineering</span>Role
                        </label>
                        <input
                            name="role"
                            placeholder="Write the user's role"
                            defaultValue={""}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">workspaces</span>Area
                        </label>
                        <input
                            name="area"
                            placeholder="Write the user's area"
                            defaultValue={""}
                        />
                    </div>
                    <div className="form-field-container">
                        <label>
                            <span className="material-icons-round">phone</span>Phone number
                        </label>
                        <input
                            name="phoneNumber"
                            placeholder="Write the user's phone number"
                            defaultValue={""}
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
                            id="form-cancel-button"
                            type="button"
                            style={{ backgroundColor: "transparent" }}
                            onClick={onCancelButtonClick}
                        >
                            Cancel
                        </button>
                        <button type="submit" style={{ backgroundColor: "rgb(18, 145, 18)" }}>
                            Accept
                        </button>
                    </div>
                </div>
            </form>
        </dialog>
    )
}