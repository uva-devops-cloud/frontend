import { useEffect, useState } from 'react';
import { fetchUsers, fetchGrades, postToken, User, Grade } from '../API/Api'; // Adjust the import path as needed

const SomeComponent = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [token] = useState<string | null>(null);

    useEffect(() => {
        const getUsers = async () => {
            try {
                const usersData = await fetchUsers();
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        const getGrades = async () => {
            try {
                const gradesData = await fetchGrades();
                setGrades(gradesData);
            } catch (error) {
                console.error('Error fetching grades:', error);
            }
        };

        getUsers();
        getGrades();
    }, []);

    const handlePostToken = async () => {
        if (token) {
            try {
                await postToken(token);
            } catch (error) {
                console.error('Error posting token:', error);
            }
        }
    };

    return (
        <div>
            <h1>Users</h1>
            <ul>
                {users.map(user => (
                    <li key={user.id}>{user.name} - {user.email}</li>
                ))}
            </ul>

            <h1>Grades</h1>
            <ul>
                {grades.map(grade => (
                    <li key={grade.id}>{grade.studentName} - {grade.grade}</li>
                ))}
            </ul>

            <button onClick={handlePostToken}>Post Token</button>
        </div>
    );
};

export default SomeComponent;