import * as React from "react";
import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import { Project } from "../class/Project";
import { ToDo } from "../class/ToDo";
import { ToDosManager, todoTool } from "../bim-components/TodoCreator";
import { ProjectsManager } from "../class/ProjectsManager";

interface Props {
    project: Project
    onOpenNewForm: () => void;
    onOpenEditForm: () => void;
    components: OBC.Components;
    projectsManager: ProjectsManager;
    modelsPage: boolean;
}

export function ToDoList(props: Props) {

    //Components instance, this is like the manager. Then we get the toDosManager
    const components: OBC.Components = props.components
    const toDosManager = components.get(ToDosManager)

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

    //OnRowCreated method for selecting the elements associated to a task
    const onRowCreated = (event) => {
        event.stopImmediatePropagation()
        const { row } = event.detail
        row.addEventListener("click", () => {
            const todo = toDosManager.getTaskById(row.data.Id, projectId)
            const ifcGuids = todo?.ifcGuids
            const todoCamera = todo?.camera
            console.log(todoCamera)
            console.log(todo)
            if (ifcGuids && todoCamera) {
                toDosManager.highlightToDo(ifcGuids, todoCamera)
            }

        })
    }

    // BIM Table for tasks
    const tasksTable = BUI.Component.create<BUI.Table>(() =>
        props.modelsPage
            ? BUI.html`
            <bim-table @rowcreated=${onRowCreated} id="tasks-table" style="background-color: #f1f2f4; border-radius: 8px; height: auto"></bim-table>
        `
            : BUI.html`
            <bim-table id="tasks-table" style="background-color: #f1f2f4; border-radius: 8px;"></bim-table>
        `
    );


    //SearchBox
    const inputBox = BUI.Component.create<BUI.TextInput>(() => {
        return BUI.html`
              <bim-text-input placeholder="Search tasks"></bim-text-input>
            `
    })
    inputBox.addEventListener("input", () => {
        tasksTable.queryString = inputBox.value
    })

    //Fast filter
    const quickFilters = BUI.Component.create(() => {
        const onOptionClick = (option: string) => {
            const query = "Status?"+option;
            tasksTable.queryString = query;
            // We also update the search box to reflect the current query
            inputBox.value = query;
        };


        return BUI.html`
          <div style="display: flex; gap: 0.5rem">
            <bim-dropdown label="Filter by status">
                <bim-option @click=${()=>onOptionClick("")} label="None"></bim-option>
                <bim-option @click=${()=>onOptionClick("Pending")} label="Pending"></bim-option>
                <bim-option @click=${()=>onOptionClick("Overdue")} label="Overdue"></bim-option>
                <bim-option @click=${()=>onOptionClick("Finished")} label="Finished"></bim-option> 
            </bim-dropdown>
          </div>
        `;
    });

    //Effects
    React.useEffect(() => {
        todoContainer.current?.appendChild(tasksTable)
        toDoSectionHeader.current?.appendChild(inputBox)
        if (!props.modelsPage) {
            toDoSectionHeader.current?.appendChild(quickFilters)
        }

    }, [])

    React.useEffect(() => {
        const [todoButton, todoPriorityButton] = todoTool({ components, projectsManager, projectId })

        if (props.modelsPage) {
            todoBtnContainer.current?.appendChild(todoPriorityButton)
            todoBtnContainer.current?.appendChild(todoButton)
        }
    }, [])

    React.useEffect(() => {
        toDosManager.onToDoModified = () => {
            setToDosList([...props.project.toDosList]);
        };
    }, []);

    // Effect used everytime the toDosList state changes
    React.useEffect(() => {
        const formattedData = toDosList.map(toDo => ({
            data: {
                Id: toDo.id,
                Name: toDo.name,
                Description: toDo.description,
                Status: toDo.status,
                Date: toDo.date.toDateString(),
                Elements: toDo.ifcGuids.length,
                Options: ""
            }
        }));

        const table = document.getElementById("tasks-table") as BUI.Table;
        if (table) {
            table.data = formattedData;
            table.hiddenColumns = ["Id"]
            if (props.modelsPage) {
                table.hiddenColumns = ["Description", "Id"]
            }
            else {
                table.hiddenColumns = ["Id"]
            }

            table.dataTransform.Options = (value, rowData) => {
                return BUI.html`
                <div
                style = "display: flex; gap: 2px;"
                >
                    <bim-button
                    icon="material-symbols:edit-square-outline"
                    tooltip-title="Edit"
                    @click=${() => {
                        {
                            const taskId = rowData.Id as string
                            toDosManager.editTask(taskId, projectId)
                        }
                    }}
                    >
                    </bim-button>
                    <bim-button
                        icon="material-symbols:delete"
                        tooltip-title="Delete"
                        @click=${() => {
                        {
                            const taskId = rowData.Id as string
                            toDosManager.deleteTask(taskId, projectId)
                        }
                    }}
                    >
                    </bim-button>
                    ${props.modelsPage ?
                        BUI.html`
                    <bim-button
                        icon="material-symbols:add-link-rounded"
                        tooltip-title="Add Element"
                        @click=${() => {
                                {
                                    const taskId = rowData.Id as string
                                    toDosManager.addModelElementToTask(taskId, projectId)
                                }
                            }}
                    >
                    </bim-button>
                    `
                        : ""
                    }
                    </div> 
            `;
            }
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
                    <div ref={todoBtnContainer} style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                    }}>
                    </div>

                </div>
            </div>
            <div
                id="todo-list"
                style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "10px 10px",
                    rowGap: 20,
                    overflowY: "auto",
                    height: "auto"
                }}
            >
                {<div id="todos-list" ref={todoContainer}></div>}

            </div>
        </div>
    )
}

