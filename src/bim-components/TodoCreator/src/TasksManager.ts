import * as OBC from "@thatopen/components"
import { ProjectsManager } from "../../../class/ProjectsManager"
import { IToDo, ToDo } from "../../../class/ToDo"
import { updateDocument } from "../../../firebase"

//Create the taskStatus type
export type TaskStatus = "Pending" | "Overdue" | "Finished"

//ToDo type
export interface TodoData {
    name: string
    description: string
    status: TaskStatus
    date: Date
}

export class ToDosManager extends OBC.Component {
    enabled = true
    static uuid = "b3393707-46dc-4afa-ac43-0faac283159c"

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(ToDosManager.uuid, this)
    }

    //To Satisfy IToDosManager

    //Class internals
    projectsManager: ProjectsManager
    onToDoCreated = () => { }
    onToDoEdited = () => { }

    //Set the projects manager (Super important!)
    setProjectsManager(projectsManager: ProjectsManager) {
        this.projectsManager = projectsManager
    }

    //Methods
    addToDo(data: IToDo, projectId: string) {

        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        let color: string

        if (data.date.toDateString() == "Invalid Date") {
            data.date = new Date(2024, 1, 1)
        }

        console.log(data)
        const toDo = new ToDo(data)
        project.toDosList.push(toDo)

        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)
        updateDocument("/projects", projectId, { toDosList: staticToDosList });
        this.onToDoCreated()
    }


    getTaskById(taskId: string, projectId: string) {

        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = project.toDosList.find((task) => {
            return task.id === taskId
        })

        return task
    }

    editTask(taskId: string, projectId: string, data: IToDo) {

        const project = this.projectsManager.getProject(projectId)
        if (!project) return

        const task = this.getTaskById(taskId, projectId)!

        if (data.date.toDateString() == "Invalid Date") {
            data.date = new Date(2024, 1, 1)
        }

        for (const key in data) {
            if (task.hasOwnProperty(key) && data[key]) {
                task[key] = data[key];
            }
        }
        task.setColor()
        this.onToDoEdited()
        const staticToDosList = ToDosManager.toPlainObject(project.toDosList)

        console.log(staticToDosList)
        updateDocument("/projects", projectId, { toDosList: staticToDosList });
    }


    //To PlainObject
    static toPlainObject(toDosList: ToDo[]): Record<string, any> {
        return {
            toDosList: toDosList.map(toDo => toDo.toPlainObject()),
        };
    }

    // Rebuild
    static fromData(data: any) {
        if (typeof data === 'object' && data !== null && 'toDosList' in data) {
            data = data.toDosList;
        }

        if (!Array.isArray(data)) {
            console.log("Error: fromData esperaba un array, pero recibió:", data);
            return [];
        }

        const toDosList = (data || []).map((toDoData: any) => {
            return new ToDo({
                name: toDoData.name,
                description: toDoData.description,
                status: toDoData.status as TaskStatus,
                date: new Date(toDoData.date),
            });
        });

        return toDosList;
    }
}