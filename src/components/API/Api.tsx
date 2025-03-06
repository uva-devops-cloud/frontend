const endpoint = 'https://yj2nmxb5j7.execute-api.eu-west-2.amazonaws.com'; //API

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

// Fetch students
export const fetchStudent = async (): Promise<Student[]> => {
    const response = await fetch(`${endpoint}/student`);
    if (!response.ok) {
        throw new Error('Failed to fetch student data');
    }
    const data = await response.json();
    return data;
};

// Fetch courses
export const fetchCourses = async (): Promise<Course[]> => {
    const response = await fetch(`${endpoint}/courses`);
    if (!response.ok) {
        throw new Error('Failed to fetch course(s) data');
    }
    const data = await response.json();
    return data;
};

// Fetch courses
export const fetchProgram = async (): Promise<Program[]> => {
    const response = await fetch(`${endpoint}/program`);
    if (!response.ok) {
        throw new Error('Failed to fetch program data');
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