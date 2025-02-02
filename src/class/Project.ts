//Create the ProjectStatus and the ProjectType types
export type ProjectStatus = "Pending" | "Active" | "Finished"
export type ProjectType = "Infrastructure" | "Housing" | "Private sector"

import { v4 as uuidv4 } from 'uuid'


import { IToDosManager, ToDosManager } from './ToDosManager'

//Project interface
export interface IProject {
    name: string
    description: string
    status: ProjectStatus
    projectType: ProjectType
    finishDate: Date
    cost: number
    progress: number
    toDosManager: IToDosManager
}

//Class
export class Project implements IProject {

    //To satisfy IProject
    name: string
    description: string
    status: ProjectStatus
    projectType: ProjectType
    finishDate: Date
    cost: number = 0
    progress: number = 0
    

    //Class internals
    id: string
    initials: string
    toDosManager: ToDosManager
    color: string
    colorArray: string[] = ["#FF6F61", "#6A5ACD", "#FFB347", "#3498DB", "#27AE60", "#C0392B"]
    


    constructor(data: IProject, id =uuidv4() ) {
        for (const key in data) {
          this[key] = data[key]
        }

        this.id = id
        this.initials = this.name[0].toUpperCase() + this.name[1].toUpperCase()
        this.color = this.colorArray[ Math.floor(Math.random() * 6)]
        this.toDosManager = new ToDosManager(id)  


      }

}


