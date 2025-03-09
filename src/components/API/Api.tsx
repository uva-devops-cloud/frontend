import { getAuthHeaders } from '../../components/resources/AuthUtility';
const endpoint = 'https://yj2nmxb5j7.execute-api.eu-west-2.amazonaws.com/Test'; //API

export interface Student {
    id: number;
    name: string;
    email: string;
    start_year: number;
    graduation_year: number;
    address: string;
}

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

/* Seeding as part of testing*/


export const seedStudent = async (): Promise<Student> => {
    try {
        const headers = await getAuthHeaders();
        const mockStudent = {
            name: "John Doe",
            email: "john.doe@student.uva.nl",
            start_year: 2022,
            graduation_year: 2026,
            address: "123 Amsterdam Street"
        };

        const response = await fetch(`${endpoint}/student`, {
            method: 'POST',
            headers,
            body: JSON.stringify(mockStudent)
        });

        if (!response.ok) {
            throw new Error(`Failed to seed student data: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error seeding student data:', error);
        throw error;
    }
};

// Seed courses data
export const seedCourses = async (): Promise<Course[]> => {
    try {
        const headers = await getAuthHeaders();
        const mockCourses = [
            {
                course_code: 5284,
                course_name: "DevOps Engineering",
                credits: 6,
                semester: "Fall 2024"
            },
            {
                course_code: 5382,
                course_name: "Cloud Computing",
                credits: 6,
                semester: "Spring 2025"
            }
        ];

        const responses = await Promise.all(mockCourses.map(course =>
            fetch(`${endpoint}/courses`, {
                method: 'POST',
                headers,
                body: JSON.stringify(course)
            })
        ));

        for (const response of responses) {
            if (!response.ok) {
                throw new Error(`Failed to seed course data: ${response.status}`);
            }
        }

        const results = await Promise.all(responses.map(res => res.json()));
        return results;
    } catch (error) {
        console.error('Error seeding course data:', error);
        throw error;
    }
};

// Seed program data - using the 'programs' route as specified
export const seedProgram = async (): Promise<Program> => {
    try {
        const headers = await getAuthHeaders();
        const mockProgram = {
            program_name: "MSc Computer Science",
            director: "Dr. Jane Smith"
        };

        const response = await fetch(`${endpoint}/programs`, { // Using 'programs' as specified
            method: 'POST',
            headers,
            body: JSON.stringify(mockProgram)
        });

        if (!response.ok) {
            throw new Error(`Failed to seed program data: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error seeding program data:', error);
        throw error;
    }
};