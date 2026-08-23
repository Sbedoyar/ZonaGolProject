import { useEffect, useState } from 'react'
import { getUsers } from '../services/userService'

function UserList() {
    const [users, setUsers] = useState([])

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            const data = await getUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error consultando usuarios', error)
        }
    }

    return (
        <div>
            <h2>Usuarios</h2>

            <table>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Correo electrónico</th>
                    </tr>
                </thead>

                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.name}</td>
                            <td>{user.email}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default UserList