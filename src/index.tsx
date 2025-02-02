import * as React from "react"
import * as ReactDOM from "react-dom/client"
import * as Router from "react-router-dom"

//Components
import { Sidebar } from "./react-components/Sidebar"
import { ProjectsPage } from "./react-components/ProjectsPage"
import { ProjectsManager } from "./class/ProjectsManager"
import { ProjectDetailsPage } from "./react-components/ProjectDetailsPage"
import { UsersPage } from "./react-components/UsersPage"
import { UsersManager } from "./class/UsersManager"

//Insert the components in the page
const rootElement = document.getElementById("app") as HTMLDivElement
const appRoot = ReactDOM.createRoot(rootElement)


const projectsManager = new ProjectsManager()
const usersManager = new UsersManager()

appRoot.render(
    <>
        <Router.BrowserRouter>
            <Sidebar />
            <Router.Routes>
                <Router.Route path="/" element={<ProjectsPage projectsManager={projectsManager} />} />
                <Router.Route path="/project/:id" element={<ProjectDetailsPage  projectsManager={projectsManager}/>} />
                <Router.Route path="/users" element ={<UsersPage usersManager={usersManager}/>}/>
            </Router.Routes>
        </Router.BrowserRouter>
    </>
)