import * as React from "react";
import { Project } from "../class/Project";

interface Props{
    project: Project
}

export function ProjectCard(props: Props) {
    return (

        <div className= "project-card">
            <div className="card-header">
                <p
                    style={{
                        backgroundColor: props.project.color,
                        padding: 10,
                        borderRadius: 8,
                        aspectRatio: 1
                    }}
                >
                    {props.project.initials}
                </p>
                <div>
                    <h5>
                        {props.project.name}
                    </h5>
                    <p>
                        {props.project.description}
                    </p>
                </div>
            </div>
            <div className="card-content">
                <div className="card-property">
                    <p style={{ color: "#969696"}}>Status</p>
                    <p>
                        {props.project.status}
                    </p>
                </div>
                <div className="card-property">
                    <p style={{ color: "#969696" }}>Type</p>
                    <p>
                        {props.project.projectType}
                    </p>
                </div>
                <div className="card-property">
                    <p style={{ color: "#969696" }}>Cost</p>
                    <p>
                        $ {props.project.cost}
                    </p>
                </div>
                <div className="card-property">
                    <p style={{ color: "#969696" }}>Estimated Progress</p>
                    <p>{props.project.progress} %
                    </p>
                </div>
            </div>
        </div>
    
    )
}