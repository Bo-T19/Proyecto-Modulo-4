import * as React from "react";
import * as Firestore from "firebase/firestore"
import * as BUI from "@thatopen/ui"

import { IUser, User } from "../class/User";
import { UsersManager } from "../class/UsersManager";
import { CreateUserForm } from "./CreateUserForm";
import { firebaseDB, getCollection } from "../firebase"

//Using the grid of the TOE UI Components. We need to declare it first in order to make it understandable as HTML

interface Props {
    usersManager: UsersManager
}

export function UsersPage(props: Props) {

    //States
    const [users, setUsers] = React.useState<User[]>(props.usersManager.list)
    const [showUserForm, setShowUserForm] = React.useState(false);

    props.usersManager.onUserCreated = () => {
        setUsers([...props.usersManager.list])
    }

    props.usersManager.onUserDeleted = () => {
        setUsers([...props.usersManager.list])
    }

    //Show or close the New Project Form
    const handleCloseForm = () => {
        setShowUserForm(false);
    };



    const onNewUserClick = () => {
        setShowUserForm(true);
    }

    React.useEffect(() => {
        if (showUserForm) {
            const modal = document.getElementById("new-user-modal");
            if (modal && modal instanceof HTMLDialogElement) {
                modal.showModal();
            }
        }
    }, [showUserForm]);


    //Firebase
    const projectsCollection = getCollection<IUser>("/users")

    const getFirestoreUsers = async () => {

        const firebaseUsers = await Firestore.getDocs(projectsCollection)
        for (const doc of firebaseUsers.docs) {
            const data = doc.data()
            const user: IUser = {
                ...data,
            }

            try {
                props.usersManager.newUser(user)
            }
            catch (error) {
            }
        }

        setUsers([...props.usersManager.list]);

    }

    React.useEffect(() => {
        getFirestoreUsers()
    }, [])


    React.useEffect(() => {
        // Effect used everytime the users state changes
        const formattedData = users.map(user => ({
            data: {
                Name: user.name,
                Email: user.email,
                Company: user.company,
                Role: user.role,
                Area: user.area,
                Phone: user.phoneNumber
            }
        }));

        const table = document.querySelector("bim-table");
        if (table) {
            table.data = formattedData;
        }

    }, [users]);

    //BIM Table
    const userTable = BUI.Component.create<BUI.Table>(() => {

        return BUI.html`
            <bim-table></bim-table>
          `
    })

    //Panel for the BIM Table
    const content = BUI.Component.create<BUI.Panel>(() => {
        return BUI.html`
            <bim-panel style="gap: 8px;">
                <bim-panel-section label="Users">
                    ${userTable}
                </bim-panel-section>
            </bim-panel>
            `
    })

    //Header with the buttons for uploading, downloading and adding new users. And with the search bar

    const header = BUI.Component.create<BUI.Component>(() => {

        const inputBox = BUI.Component.create<BUI.TextInput>(() => {
            return BUI.html`
              <bim-text-input placeholder="Search Users"></bim-text-input>
            `
        })
        inputBox.addEventListener("input", () => {
            userTable.queryString = inputBox.value
        })

        return BUI.html`
            <div style="padding: 4px; display: flex; gap: 8px; height: fit-content; justify-content: space-between; ">
                <div style="width: 500px">
                ${inputBox}
                </div>
            <div style="display: flex; flex-direction: row; gap: 10px;">                
                <bim-button icon="line-md:arrow-align-bottom"
                            @click=${() => {
                        props.usersManager.exportToJSON()
                    }}>

                        </bim-button>

                        <bim-button icon="line-md:arrow-align-top"
                            @click=${() => {
                        props.usersManager.importFromJSON()
                    }}>

                        </bim-button>

                        <bim-button icon="line-md:account-add"
                            @click=${() => {
                        onNewUserClick()
                    }}>
                        </bim-button>
                </div>
            </div>
        `
    })


    //Layouts for the grid
    const gridLayout: BUI.Layouts = {
        primary: {
            template: `
                "header" 40px
                "content" 1fr
                "footer" 40px
                /1fr 
                `,
            elements: {
                header,

                footer: (() => {
                    const footer = document.createElement("div")
                    footer.style.border = "none"
                    return footer

                })(),
                content,
            }
        }
    }

    //Creating the grid itself
    React.useEffect(() => {
        const grid = document.getElementById("bimGrid") as BUI.Grid
        grid.layouts = gridLayout
        grid.layout = "primary"
    }, [])



    return (
        <div>
            {showUserForm ? <CreateUserForm usersManager={props.usersManager} onCloseForm={handleCloseForm} /> : <></>}
            <bim-grid id="bimGrid"></bim-grid>
        </div>
    )
}