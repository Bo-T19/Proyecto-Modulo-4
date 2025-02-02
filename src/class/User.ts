import { v4 as uuidv4 } from 'uuid'


//User interface

export interface IUser {
    name: string
    email: string
    company: string
    role: string
    area: string
    phoneNumber: string
}


//User class
export class User implements IUser {


    //To satisfy IUser

    name: string
    email: string
    company: string
    role: string
    area: string
    phoneNumber: string


    //Class internals
    id: string
    initials: string
    color: string

    constructor(data: IUser, id = uuidv4()) {
        for (const key in data) {
            this[key] = data[key]
        }

        this.id = id
        this.initials = this.name[0].toUpperCase() + this.name[1].toUpperCase()
    }
}