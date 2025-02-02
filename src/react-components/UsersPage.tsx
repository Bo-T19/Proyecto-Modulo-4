import * as React from "react";
import * as Firestore from "firebase/firestore"


import { IUser, User } from "../class/User";
import { UsersManager } from "../class/UsersManager";
import { SearchBox } from "./SearchBox";
import { CreateUserForm } from "./CreateUserForm";
import { UserCard } from "./UserCard";
import { firebaseDB, getCollection } from "../firebase"

interface Props {
    usersManager: UsersManager
}

export function UsersPage(props: Props) {

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

}