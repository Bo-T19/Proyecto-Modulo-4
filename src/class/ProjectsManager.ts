import { updateDocument } from "../firebase"
import { IProject, Project } from "./Project"
import { ToDosManager } from "./ToDosManager"
import * as Firestore from "firebase/firestore"
import { firebaseDB, getCollection } from "../firebase"

//Class
export class ProjectsManager {

    list: Project[] = []

    colorArray: string[] = ["#FF6F61", "#6A5ACD", "#FFB347", "#3498DB", "#27AE60", "#C0392B"]

    onProjectCreated = (project: Project) => { }

    onProjectDeleted = (id) => { }

    projectNames: string[] = []

    //Create new project
    newProject(data: IProject, id?: string) {

        const nameInUse = this.projectNames.includes(data.name)
        if (nameInUse) {
            throw new Error(`A project with name "${data.name}" already exists`)
        }

        if (data.name.length < 5) {
            throw new Error(`The name must have at least 5 characters`)
        }

        if (isNaN(data.finishDate.getDate())) {
            data.finishDate = new Date(2024, 1, 1)
        }


        const project = new Project(data, id)
        project.toDosManager.toDosList = data.toDosManager.toDosList
        project.color = this.colorArray[Math.floor(Math.random() * 6)]
        this.list.push(project)
        this.projectNames.push(project.name)
        this.onProjectCreated(project)

        return project
    }

    //Create a default project (this should be deleted later)
    defaultProject() {
        const defaultData: IProject =
        {
            name: "Default Project",
            description: "A temporary project",
            status: "Active",
            projectType: "Private sector",
            finishDate: new Date("2024-12-31"),
            cost: 15000,
            progress: 75,
            toDosManager: { toDosList: [] }

        }

        this.newProject(defaultData)
    }

    //Get a project by name
    getProjectByName(name: string) {
        const project = this.list.find((project) => {
            return project.name === name
        })
        return project
    }

    //Edit project data
    editProject(project: Project, completeData: IProject) {

        completeData.toDosManager.toDosList = [
            ...project.toDosManager.toDosList,
            ...completeData.toDosManager.toDosList
        ];

        //Remove Duplicates based on the Id
        completeData.toDosManager.toDosList = Array.from(
            new Map(completeData.toDosManager.toDosList.map(obj => [obj.id, obj])).values()
        );

        const projectNames = this.list.map((project) => {
            return project.name
        })

        const nameInUse = projectNames.includes(completeData.name)
        if (completeData.name) {

            if (nameInUse && completeData.name !== project.name) {
                throw new Error(`A project with name "${completeData.name}" already exists`)
            }
            else if (completeData.name.length < 5) {
                throw new Error(`The name must have at least 5 characters`)
            }
            else {
                const index = this.projectNames.indexOf(project.name);
                this.projectNames[index] = completeData.name
                console.log(this.projectNames)
            }
        }


        completeData.finishDate = new Date(completeData.finishDate)
        if (isNaN(completeData.finishDate.getTime())) {
            completeData.finishDate = project.finishDate
        }

        for (const key in completeData) {
            if (project.hasOwnProperty(key) && completeData[key]) {
                project[key] = completeData[key];
            }
            else {
                completeData[key] = project[key]
            }
        }



        updateDocument("/projects", project.id, {
            name: completeData.name,
            description: completeData.description,
            projectType: completeData.projectType,
            status: completeData.status,
            finishDate: completeData.finishDate,
            cost: completeData.cost,
            progress: completeData.progress
        });

        console.log(this)
    }

    //Import a project from JSON or export a project from JSON

    exportToJSON(fileName: string = "projects") {
        const json = JSON.stringify(this.list, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
    }

    importFromJSON() {
        const projectsCollection = getCollection<IProject>("/projects")
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        const reader = new FileReader()
        reader.addEventListener("load", async () => {
            const json = reader.result
            if (!json) { return }
            const projects: IProject[] = JSON.parse(json as string)


            for (const project of projects) {
                const nameInUse = this.projectNames.includes(project.name)
                if (nameInUse) {
                    try {
                        const updateProjectData: IProject =
                        {
                            name: project.name,
                            projectType: project.projectType,
                            status: project.status,
                            description: project.description,
                            finishDate: new Date(project.finishDate),
                            cost: project.cost,
                            progress: project.progress,
                            toDosManager: project.toDosManager

                        }

                        this.editProject(this.getProjectByName(project.name)!, updateProjectData)
                    }
                    catch (error) {
                        console.log(error)
                    }
                }
                else {
                    try {
                        const newProjectData: IProject =
                        {
                            name: project.name,
                            projectType: project.projectType,
                            status: project.status,
                            description: project.description,
                            finishDate: new Date(project.finishDate),
                            cost: project.cost,
                            progress: project.progress,
                            toDosManager: project.toDosManager
                        }

                        

                        if (isNaN(newProjectData.finishDate.getDate())) {
                            newProjectData.finishDate = new Date(2024, 1, 1)
                        }

                        const newProjectDataForFB = structuredClone(newProjectData)

                        const docRef = await Firestore.addDoc(projectsCollection, newProjectDataForFB)
                        this.newProject(newProjectData)

                    } catch (error) {
                        console.log(error)
                    }
                }
            }
        })

        input.addEventListener('change', () => {
            const filesList = input.files
            if (!filesList) { return }
            reader.readAsText(filesList[0])

        })
        input.click()
    }

    //GetProject by ID
    getProject(id: string) {
        const project = this.list.find((project) => {
            return project.id === id
        })
        return project
    }

}