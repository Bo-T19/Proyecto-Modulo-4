
import { IUser, User } from "./User"


//Class

export class UsersManager {

    list: User[] = []

    onUserCreated = (user: User) => { }

    onUserDeleted = (id) => { }

    userNames: string[] = []

    colorArray: string[] = ["#fcf43c", "#6f75d9", "#5cc47c", "#b2e2ef", "#eee5b5", "#ffa43c"]

    //Create new user
    newUser(data: IUser, id?: string) {


        const nameInUse = this.userNames.includes(data.name)
        if (nameInUse) {
            throw new Error(`An user with name "${data.name}" already exists`)
        }

        if (data.name.length < 5) {
            throw new Error(`The name must have at least 5 characters`)
        }

        const user = new User(data, id)
        user.color = this.colorArray[Math.floor(Math.random() * 6)]
        this.list.push(user)
        this.userNames.push(user.name)
        this.onUserCreated(user)


    }


    //Get user by name
    getUserByName(name: string) {
        const user = this.list.find((user) => {
            return user.name === name
        })
        return user
    }


    //Get user by ID
    getUser(id: string) {
        const user = this.list.find((user) => {
            return user.id === id
        })
        return user
    }


    //Import and export to JSON
    exportToJSON(fileName: string = "users") {
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
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'application/json'
        const reader = new FileReader()
        reader.addEventListener("load", () => {
            const json = reader.result
            if (!json) { return }
            const users: IUser[] = JSON.parse(json as string)


            for (const user of users) {
                const nameInUse = this.userNames.includes(user.name)
                if (nameInUse) {
                    try {
                        const updateUserData: IUser =
                        {
                            name: user.name,
                            email: user.email,
                            company: user.company,
                            role: user.role,
                            area: user.area,
                            phoneNumber: user.phoneNumber,

                        }

                        for (const key in updateUserData) {
                            if (user.hasOwnProperty(key) && updateUserData[key]) {
                                user[key] = updateUserData[key];
                            }
                        }
                    }
                    catch (error) {
                        console.log(error)
                    }
                }
                else {
                    try {
                        const newUserData: IUser =
                        {
                            name: user.name,
                            email: user.email,
                            company: user.company,
                            role: user.role,
                            area: user.area,
                            phoneNumber: user.phoneNumber,


                        }
                        this.newUser(newUserData)
                    } catch (error) {

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
}