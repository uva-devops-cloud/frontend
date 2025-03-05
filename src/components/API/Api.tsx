

const endpoint = 'https://yj2nmxb5j7.execute-api.eu-west-2.amazonaws.com'; //API

export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Grade {
    id: number;
    studentName: string;
    grade: string;
}

// Fetch users
export const fetchUsers = async (): Promise<User[]> => {
    const response = await fetch(`${endpoint}/users`);
    if (!response.ok) {
        throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    return data;
};

// Fetch grades
export const fetchGrades = async (): Promise<Grade[]> => {
    const response = await fetch(`${endpoint}/grades`);
    if (!response.ok) {
        throw new Error('Failed to fetch grades');
    }
    const data = await response.json();
    return data;
};

// Post token
export const postToken = async (token: string): Promise<void> => {
    const response = await fetch(`${endpoint}/tokens`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        throw new Error('Failed to post token');
    }

    const result = await response.json();
    console.log('Token posted successfully:', result);
};