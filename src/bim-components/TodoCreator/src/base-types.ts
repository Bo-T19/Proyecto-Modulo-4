//Create the taskStatus type
export type TaskStatus = "Pending" | "Overdue" | "Finished"

//ToDo type
export interface TodoData {
    name: string
    description: string
    status: TaskStatus
    date: Date
    ifcGuids: string[]
    camera: {position: THREE.Vector3, target: THREE.Vector3}
}
