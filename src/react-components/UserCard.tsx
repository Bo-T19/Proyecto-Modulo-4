
import * as React from "react";
import { User } from "../class/User";

interface Props {
    user: User
}

export function UserCard(props: Props) {

    return (
        <div
            className="user"
            style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "15px",
                padding: "10px",
                borderBottom: "1px solid #ccc",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "15px", width: "250px" }}>
                <div
                    style={{
                        border: "2px solid var(--primary-200)",
                        backgroundColor: props.user.color,
                        borderRadius: "5px",
                        width: "50px",
                        height: "50px",
                        fontSize: "large",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        color: "black",
                        flexShrink: 0
                    }}
                >
                    {props.user.initials}
                </div>
                <div style={{ fontWeight: "bold" }}>{props.user.name}</div>
            </div>

            <div
                style={{
                    width: "300px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    overflowWrap: "break-word",
                    textAlign: "left",
                }}
                className="item"
            >
                {props.user.email}
            </div>

            <div
                style={{
                    width: "150px",
                    textAlign: "left",
                }}
                className="item"
            >
                {props.user.phoneNumber}
            </div>

            <div
                style={{
                    width: "250px",
                    textAlign: "left",
                    overflowWrap: "break-word",
                }}
                className="item"
            >
                {props.user.company}
            </div>

            <div
                style={{
                    width: "150px",
                    textAlign: "left",
                    overflowWrap: "break-word",
                }}
                className="item"
            >
                {props.user.area}
            </div>

            <div
                style={{
                    width: "150px",
                    textAlign: "left",
                    overflowWrap: "break-word",
                }}
                className="item"
            >
                {props.user.role}
            </div>
        </div>


    )
}

