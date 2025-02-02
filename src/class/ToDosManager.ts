import { IToDo, ToDo, TaskStatus } from './ToDo'
import { updateDocument } from "../firebase"

export interface IToDosManager {
    toDosList: ToDo[]
}

export class ToDosManager {

    //To Satisfy IToDosManager
    toDosList: ToDo[] = []


    //Class internals
    projectId: string
    onToDoCreated = () => { }
    onToDoEdited = () => { }


    constructor(id: string, data?: Partial<ToDosManager>) {
        this.toDosList = data?.toDosList || [];
        this.projectId = id
    }

    addToDo(data: IToDo) {

        let color: string

        if (data.date.toDateString() == "Invalid Date") {
            data.date = new Date(2024, 1, 1)
        }

        const toDo = new ToDo(data)

        this.toDosList.push(toDo)
        this.onToDoCreated()

        const staticToDosManager = ToDosManager.toPlainObject(this)
        updateDocument("/projects", this.projectId, { toDosManager: staticToDosManager });
    }


    getTaskById(taskId: string) {

        const task = this.toDosList.find((task) => {
            return task.id === taskId
        })

        return task
    }

    editTask(taskId: string, data: IToDo) {


        const task = this.getTaskById(taskId)!

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
        const staticToDosManager = ToDosManager.toPlainObject(this)
        updateDocument("/projects", this.projectId, { toDosManager: staticToDosManager });

    }


    //To PlainObject
    static toPlainObject(toDosManager: ToDosManager): Record<string, any> {
        return {
            toDosList: toDosManager.toDosList.map(toDo => toDo.toPlainObject()),
        };
    }

    // Rebuild
    static fromData(id: string, data: any): ToDosManager {
        const toDosList = (data.toDosList || []).map((toDoData: any) => {

            return new ToDo({
                description: toDoData.description,
                status: toDoData.status as TaskStatus,
                date: new Date(toDoData.date), 
            });
        });
    
        return new ToDosManager(id, { toDosList });
    }
}


