import * as React from "react";


import { Project } from "../class/Project";
import { ToDoItem } from "./ToDoItem";
import { ToDo } from "../class/ToDo";
import { SearchBox } from "./SearchBox";

interface Props {
    project: Project
    onOpenNewForm: () => void;
    onOpenEditForm: () => void;
    sendId: (id: string) => void
}

export function ToDoList(props: Props) {
    //States
    const [toDosList, setToDosList] = React.useState<ToDo[]>(props.project.toDosManager.toDosList);
    const [activeTaskId, setActiveTaskId] = React.useState<string>("")

    props.project.toDosManager.onToDoCreated = () => {
        setToDosList([...props.project.toDosManager.toDosList])
    }

    props.project.toDosManager.onToDoEdited = () => {
        setToDosList([...props.project.toDosManager.toDosList])
    }

    const handleIdFromItem = (id: string) => {
        setActiveTaskId(id)
        props.sendId(id)
    }

    // Update the todos list

    const toDoItems = toDosList.map((toDo) => {
        return (

            <ToDoItem toDo={toDo} key={toDo.id} onOpenEditForm={props.onOpenEditForm} sendId={handleIdFromItem} />
        )
    })


    //For the searchbox
    const onToDoSearch = (value: string) => {
        const filteredProjects = props.project.toDosManager.toDosList.filter((toDo) => {
            return toDo.description.includes(value)
        })
        setToDosList(filteredProjects)
    }


    return (
        <div className="dashboard-card"
            style={{
                flexGrow: 1,
                overflowY: "auto",
            }}>
            <div
                style={{
                    padding: "20px 30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                <h4>To-Do</h4>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "end",
                        columnGap: 20
                    }}
                >
                    <div
                        style={{ display: "flex", alignItems: "center", columnGap: 10 }}
                    >
                        <span className="material-icons-round">search</span>
                        <SearchBox
                            onChange={(value) => onToDoSearch(value)}
                            typeOfSearchBox="task"
                        />
                    </div>
                    <span id="add-todo" className="material-icons-round" onClick={props.onOpenNewForm}>
                        add
                    </span>
                </div>
            </div>
            <div
                id="todo-list"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "10px 30px",
                    rowGap: 20,
                    overflowY: "auto",
                    height: "auto"
                }}
            >
                {props.project.toDosManager.toDosList.length > 0 ? <div id="todos-list">{toDoItems}</div> : <p> There are no tasks</p>}

            </div>
        </div>
    )
}

