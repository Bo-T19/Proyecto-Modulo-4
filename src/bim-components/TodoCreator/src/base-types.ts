//Create the taskStatus type
export type TaskStatus = "Pending" | "Overdue" | "Finished"

//ToDoInputData type
export interface ToDoInputData {
    name: string
    description: string
    status: TaskStatus
    date: Date
    ifcGuids: string[]
}

//ToDo type
export interface TodoData {
    name: string
    description: string
    status: TaskStatus
    date: Date
    ifcGuids: string[]
    camera: {position: THREE.Vector3, target: THREE.Vector3}
}
