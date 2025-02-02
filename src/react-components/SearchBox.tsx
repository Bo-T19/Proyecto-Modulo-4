import * as React from "react"

interface Props {
    onChange: (value: string) => void
    typeOfSearchBox: "project" | "task" | "user"
}

export function SearchBox(props: Props) {

    const placeholderText =
        props.typeOfSearchBox === "project"
            ? "Search project by name"
            : props.typeOfSearchBox === "task"
            ? "Search task by description"
            : "Search user by name";

    const containerWidth = props.typeOfSearchBox === "project" || props.typeOfSearchBox === "user" ? "40%" : "100%";
    return (
        <div style={{
            display: "flex", alignItems: "center", columnGap: 10,
            width: containerWidth
        }}>
            <input
                onChange={(e) => { props.onChange(e.target.value) }}
                type="text"
                placeholder={placeholderText}
                style={{ width: "100%", height: "20px", backgroundColor: "white" , color: "black"}} />
        </div>
    )

}