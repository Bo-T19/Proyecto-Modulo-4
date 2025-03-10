import * as OBC from "@thatopen/components"

//Create the taskStatus type
export type TaskStatus = "Pending" | "Overdue" | "Finished"

//ToDo type
export interface TodoData {
    name: string
    description: string
    status: TaskStatus
    date: Date
}

export class TodoCreator extends OBC.Component {
    enabled = true
    static uuid = "b3393707-46dc-4afa-ac43-0faac283159c"

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(TodoCreator.uuid, this)
    }

    addToDo() {
        console.log("Something")
    }
}