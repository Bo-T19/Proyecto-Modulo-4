import { updateDocument } from "../firebase"
import { IProject, ModelVisibility, Project } from "./Project"
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
        project.color = this.colorArray[Math.floor(Math.random() * 6)]
        this.list.push(project)
        this.projectNames.push(project.name)
        this.onProjectCreated(project)

        return project
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

        completeData.toDosList = [
            ...project.toDosList,
            ...completeData.toDosList
        ];

        //Remove Duplicates based on the Id
        completeData.toDosList = Array.from(
            new Map(completeData.toDosList.map(obj => [obj.id, obj])).values()
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

    }

    //Edit the model dictionary
    editModelDictionary(project: Project, modelName: string, visibility: ModelVisibility) {
        if (project.modelDictionary[modelName] !== visibility) {
            project.modelDictionary[modelName] = visibility;
        }
        project.modelDictionaryVersion++
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
                            toDosList: project.toDosList,
                            modelDictionary: project.modelDictionary
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
                            toDosList: project.toDosList,
                            modelDictionary: project.modelDictionary
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

    //Load an IfcModel
    loadIFC(): Promise<{ buffer: ArrayBuffer; fileName: string } | null> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.ifc';
    
            const reader = new FileReader();
    
            reader.addEventListener('load', () => {
                if (reader.result instanceof ArrayBuffer && input.files) {
                    resolve({
                        buffer: reader.result,
                        fileName: input.files[0].name
                    });
                } else {
                    reject(new Error("Couldn't read the file"));
                }
            });
    
            reader.addEventListener('error', () => {
                reject(new Error("Couldn't read the file"));
            });
    
            input.addEventListener('change', () => {
                const filesList = input.files;
                if (!filesList || filesList.length === 0) {
                    reject(new Error("Didn't select any file"));
                    return;
                }
                reader.readAsArrayBuffer(filesList[0]);
            });
    
            input.click();
        });
    }
    

    //GetProject by ID
    getProject(id: string) {
        const project = this.list.find((project) => {
            return project.id === id
        })
        return project
    }

}