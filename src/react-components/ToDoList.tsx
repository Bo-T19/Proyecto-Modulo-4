import * as React from "react";
import * as BUI from "@thatopen/ui"
import * as OBC from "@thatopen/components"
import { Project } from "../class/Project";
import { ToDoItem } from "./ToDoItem";
import { ToDo } from "../class/ToDo";
import { ToDosManager, todoTool } from "../bim-components/TodoCreator";
import { ProjectsManager } from "../class/ProjectsManager";

interface Props {
    project: Project
    onOpenNewForm: () => void;
    onOpenEditForm: () => void;
    sendId: (id: string) => void;
    components: OBC.Components
    projectsManager: ProjectsManager
}

export function ToDoList(props: Props) {

    //Components instance, this is like the manager
    const components: OBC.Components = props.components

    //Projects Manager and projectId
    const projectsManager = props.projectsManager
    const projectId = props.project.id


    //References
    const todoContainer = React.useRef<HTMLDivElement>(null)
    const toDoSectionHeader = React.useRef<HTMLDivElement>(null)
    const todoBtnContainer = React.useRef<HTMLDivElement>(null)
    //States
    const [toDosList, setToDosList] = React.useState<ToDo[]>(props.project.toDosList);
    const [activeTaskId, setActiveTaskId] = React.useState<string>("")
    console.log(toDosList)
    /*
    props.project.toDosManager.onToDoCreated = () => {
        setToDosList([...props.project.toDosManager.toDosList])
    }

    props.project.toDosManager.onToDoEdited = () => {
        setToDosList([...props.project.toDosManager.toDosList])
    }
*/


    //BIM Table for tasks
    const tasksTable = BUI.Component.create<BUI.Table>(() => {
        return BUI.html`
        <bim-table style="background-color: #f1f2f4; border-radius: 8px;"></bim-table>
      `
    })

    //SearchBox
    const inputBox = BUI.Component.create<BUI.TextInput>(() => {
        return BUI.html`
              <bim-text-input placeholder="Search tasks"></bim-text-input>
            `
    })
    inputBox.addEventListener("input", () => {
        tasksTable.queryString = inputBox.value
    })

    //Effects
    React.useEffect(() => {
        todoContainer.current?.appendChild(tasksTable)
        toDoSectionHeader.current?.appendChild(inputBox)
    }, [])

    React.useEffect(()=>{
        const todoButton = todoTool({components, projectsManager,  projectId})
        todoBtnContainer.current?.appendChild(todoButton)
    }, [])

    React.useEffect(() => {
        // Effect used everytime the users state changes
        const formattedData = toDosList.map(toDo => ({
            data: {
                Name: toDo.name,
                Description: toDo.description,
                Status: toDo.status,
                Date: toDo.date.toDateString(),
            }
        }));

        const table = document.querySelector("bim-table");
        if (table) {
            table.data = formattedData;
        }

    }, [toDosList]);


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
                        ref={toDoSectionHeader}
                    >
                        <span className="material-icons-round">search</span>
                    </div>
                    <div    ref = {todoBtnContainer}>
                        <span id="add-todo" className="material-icons-round" onClick={props.onOpenNewForm}>
                            add
                        </span>
                    </div>

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
                {<div id="todos-list" ref={todoContainer} ></div>}

            </div>
        </div>
    )
}

