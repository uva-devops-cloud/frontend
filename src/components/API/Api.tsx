import { getAuthHeaders } from '../../components/resources/AuthUtility';
const endpoint = 'https://d1npgfnzouv53u.cloudfront.net/api'; //API in cloudfront domain

export interface Student {
    id: number;
    name: string;
    email: string;
    start_year: number;
    graduation_year: number;
    address: string;
}

// Commenting out unused interfaces
/*
export interface Course {
    id: number;
    course_code: number;
    course_name: string;
    credits: number;
    semester: string;
}

export interface Program {
    id: number;
    program_name: string;
    director: string;
}
*/

// Fetch authenticated student data (returns just the user's own data)
export const fetchStudent = async (): Promise<Student[]> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${endpoint}/student`, { headers });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required');
            }
            throw new Error('Failed to fetch student data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching student:', error);
        throw error;
    }
};

// Commenting out unused API calls
/*
// Fetch courses
export const fetchCourses = async (): Promise<Course[]> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${endpoint}/courses`, { headers });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required');
            }
            throw new Error('Failed to fetch course data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching courses:', error);
        throw error;
    }
};

// Fetch program
export const fetchProgram = async (): Promise<Program[]> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${endpoint}/programs`, { headers });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required');
            }
            throw new Error('Failed to fetch program data');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching program:', error);
        throw error;
    }
};
*/

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

// Update student
export const updateStudent = async (
    studentId: number,
    partialData: Partial<Omit<Student, 'id'>>
): Promise<Student> => {
    try {
        const headers = await getAuthHeaders();
        const response = await fetch(`${endpoint}/student/${studentId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(partialData),
        });

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Authentication required');
            }
            throw new Error(`Error updating student: ${response.status}`);
        }

        return response.json();
    } catch (error) {
        console.error('Error updating student:', error);
        throw error;
    }
};