import * as React from "react";
import * as Firestore from "firebase/firestore"
import * as BUI from "@thatopen/ui"

import { IUser, User } from "../class/User";
import { UsersManager } from "../class/UsersManager";
import { SearchBox } from "./SearchBox";
import { CreateUserForm } from "./CreateUserForm";
import { UserCard } from "./UserCard";
import { firebaseDB, getCollection } from "../firebase"


//Using the grid of the TOE UI Components. We need to declare it first in order to make it understandable as HTML
declare global {
    namespace JSX {
        interface IntrinsicElements {
            "bim-grid": any
        }
    }
}


interface Props {
    usersManager: UsersManager
}

export function UsersPage(props: Props) {

    //States
    const [isLoading, setIsLoading] = React.useState(true);
    const [users, setUsers] = React.useState<User[]>(props.usersManager.list)

    props.usersManager.onUserCreated = () => {
        setUsers([...props.usersManager.list])
    }

    props.usersManager.onUserDeleted = () => {
        setUsers([...props.usersManager.list])
    }

    //Firebase
    const projectsCollection = getCollection<IUser>("/users")

    const getFirestoreUsers = async () => {
        setIsLoading(true);

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
        console.log(users)
        setIsLoading(false);
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
        const onTableCreated = (element?: Element) => {
            if (!element) return;
            const table = element as BUI.Table;
            const formattedData = users.map(user =>
            ({
                data: {
                    Name: user.name,
                    Email: user.email,
                    Company: user.company,
                    Role: user.role,
                    Area: user.area,
                    Phone: user.phoneNumber
                }
            }))
            table.data = formattedData
            console.log(formattedData)
            
        }

        return BUI.html`
            <bim-table ${BUI.ref(onTableCreated)}></bim-table>
          `
    })

    //Panel for the BIM Table
    const content = BUI.Component.create<BUI.Panel>(() => {
        return BUI.html`
            <bim-panel>
                <bim-panel-section label="Users">
                    ${userTable}
                </bim-panel-section>
            </bim-panel>
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
                header: (() => {
                    const header = document.createElement("div")
                    header.style.backgroundColor = "#24474e"
                    header.style.border = "none"
                    return header

                })(),

                footer: (() => {
                    const footer = document.createElement("div")
                    footer.style.backgroundColor = "#4ad3a7"
                    footer.style.border = "none"
                    return footer

                })(),
                content,
            }
        }
    }

    //Creating the grid itself
    React.useEffect(() => {
        BUI.Manager.init()
        const grid = document.getElementById("bimGrid") as BUI.Grid
        grid.layouts = gridLayout
        grid.layout = "primary"
    }, [])



    return (
        <div>
            <bim-grid id="bimGrid"></bim-grid>
        </div>
    )

    //

    /*
        //States
        const [users, setUsers] = React.useState<User[]>(props.usersManager.list)
        const [showUserForm, setShowUserForm] = React.useState(false);
        const [isLoading, setIsLoading] = React.useState(true);
    
        props.usersManager.onUserCreated = () => {
            setUsers([...props.usersManager.list])
        }
    
        props.usersManager.onUserDeleted = () => {
            setUsers([...props.usersManager.list])
        }
    
    
        //Update the user cards
        const userCards = users.map((user) => {
            return (
    
                <UserCard user={user} key={user.id} />
            )
        })
    
    
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
    
    
        //For the searchbox
        const onUserSearch = (value: string) => {
            const filteredProjects = props.usersManager.list.filter((user) => {
                return user.name.includes(value)
            })
            setUsers(filteredProjects)
        }
    
        //Download the projects or upload
        const onDownloadUsersClick = () => {
            props.usersManager.exportToJSON()
        }
    
    
        //Download the projects or upload
        const onUploadUsersClick = () => {
            props.usersManager.importFromJSON()
        }
    
    
        //Firebase
        const projectsCollection = getCollection<IUser>("/users")
    
        const getFirestoreUsers = async () => {
            setIsLoading(true);
    
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
    
            setIsLoading(false);
        }
    
        React.useEffect(() => {
            getFirestoreUsers()
        }, [])
    
    
    
    
        return (<div className="page" id="users-page" >
            <header>
                <h2>Users</h2>
                <SearchBox onChange={(value) => onUserSearch(value)} typeOfSearchBox="user" />
                <div
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 20
    
                    }}>
                    <button onClick={onDownloadUsersClick} id="download">
                        <span className="material-icons-round">download</span>
                    </button>
                    <button onClick={onUploadUsersClick} id="upload">
                        <span className="material-icons-round">file_upload</span>
                    </button>
                    <button onClick={onNewUserClick} id="new-user">
                        <span className="material-icons-round">add</span>New User
                    </button>
                </div>
            </header>
            {showUserForm ? <CreateUserForm usersManager={props.usersManager} onCloseForm={handleCloseForm} /> : <></>}
            {isLoading ? (
                <p>Loading users...</p>
            ) :
                (users.length > 0 ?
    
                    (<div id="projects-list" style={{
                        flexGrow: 1,
                        overflowY: "auto",
                        padding: "20px 40px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "30px",
                    }}>
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: "15px",
                                    padding: "10px",
                                    color: "white",
                                    backgroundColor: "#017CB3",
                                    borderRadius: "10px"
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "15px", width: "250px" }}>
    
                                    Name
    
                                </div>
    
                                <div
                                    style={{
                                        width: "300px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        overflowWrap: "break-word",
                                        textAlign: "left",
                                    }}
                                    className="item"
                                >
                                    E-mail
                                </div>
    
                                <div
                                    style={{
                                        width: "150px",
                                        textAlign: "left",
                                    }}
                                    className="item"
                                >
                                    Phone number
                                </div>
    
                                <div
                                    style={{
                                        width: "250px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        overflowWrap: "break-word",
                                        textAlign: "left",
                                    }}
                                    className="item"
                                >
                                    Company
                                </div>
    
                                <div
                                    style={{
                                        width: "150px",
                                        textAlign: "left",
                                        overflowWrap: "break-word",
                                    }}
                                    className="item"
                                >
                                    Area
                                </div>
    
                                <div
                                    style={{
                                        width: "150px",
                                        textAlign: "left",
                                        overflowWrap: "break-word",
                                    }}
                                    className="item"
                                >
                                    Role
                                </div>
                            </div>
                        </div>
    
                        {userCards}</div>) : (<p> There are no users in the platform</p>))}
    
        </div>
        )
    */
}