import { useEffect, useState } from 'react';

//import { useNavigate } from 'react-router-dom';

const ApiInteractions = () => {
    //const navigate = useNavigate();// for file navigation in browser

    const [users, setUsers] = useState<User[]>([]);// tells users will be of type User will all it's attributes, ([]) is just initial state

    interface User {
        id: number;
        name: string;
        email: string;
    };

    useEffect(() => {
        const fetchUsers = async () => { //define async
            const response = await fetch('https://jsonplaceholder.typicode.com/users');
            const data = await response.json();
            setUsers(data);
        };

        fetchUsers();//need to call function 
    }, []);// because of empty array -> useEffect gets exectued once when component renders

    /*
        const postUser = async (newUser: Omit<User, 'id'>) => { //omits the ID because generated by browser
            const response = await fetch('https://jsonplaceholder.typicode.com/users', {
                method: 'POST', //specify the action
                headers: {
                    'Content-Type': 'application/json', //specify incoming json
                },
                body: JSON.stringify(newUser),  // Send newUser as JSON
            });
    
            if (!response.ok) { //response from browser
                throw new Error('Failed to add user');
            }
    
            const createdUser: User = await response.json();  // Assuming server sends back full user (including id)
            setUsers((prevUsers) => [...prevUsers, createdUser]);  // Update local state, prevUsers represents the previous state of the users array before the update.
        }; */



    return (
        <div>
            <h1>User List</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name} - {user.email}</li>
                ))}
            </ul>
        </div>
    )
}

export default ApiInteractions