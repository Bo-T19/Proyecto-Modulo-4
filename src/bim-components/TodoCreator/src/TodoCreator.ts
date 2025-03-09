import * as OBC from "@thatopen/components"

export class TodoCreator extends OBC.Component {
    enabled = true

    static uuid = "b3393707-46dc-4afa-ac43-0faac283159c"

    constructor(components : OBC.Components){
        super(components)
        this.components.add(TodoCreator.uuid,this)
    }

    addToDo() {
        console.log("Something")
    }
}