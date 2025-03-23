import { v4 as uuidv4 } from 'uuid'
import { TodoData, ToDoInputData } from '../bim-components/TodoCreator'

//Create the taskStatus type
export type TaskStatus = "Pending" | "Overdue" | "Finished"

//ToDo type

//Class
export class ToDo implements TodoData{

    //To satisfy IToDo
    name: string
    description: string
    status: TaskStatus
    date: Date
    ifcGuids: string[]
    camera: { position: THREE.Vector3; target: THREE.Vector3 }

    //Class internals
    toDoColorList: string[] = ["#008000", "#8B4513", "#FF0000"]
    color: string
    id: string

    constructor(data: ToDoInputData) {
        for (const key in data) {
            this[key] = data[key]
        }

        console.log(data)
        this.id =uuidv4()
        this.setColor()
    }

    setColor() {
        switch (this.status) {
            case "Finished":
                this.color = this.toDoColorList[0]
                break;
            case "Pending":
                this.color = this.toDoColorList[1]
                break;
            case "Overdue":
                this.color = this.toDoColorList[2]
                break;
            default:
                this.color
                break;
        }
    }


    toPlainObject(): Record<string, any> {
        return {
            name : this.name,
            description: this.description,
            status: this.status,
            date: this.date.toISOString(), 
            color: this.color,
            id: this.id,
        };
    }

}