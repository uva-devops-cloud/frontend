import { useEffect, useState } from 'react';
import { fetchCourses, fetchProgram, fetchStudent, postToken, Student, Program, Course } from '../API/Api';


const SomeComponent = () => {
    const [student, setStudent] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [token] = useState<string | null>(null);

    useEffect(() => {
        const getStudent = async () => {
            try {
                const studentData = await fetchStudent();
                setStudent(studentData);
            } catch (error) {
                console.error('Error fetching student data:', error);
            }
        };

        const getCourses = async () => {
            try {
                const coursesData = await fetchCourses();
                setCourses(coursesData);
            } catch (error) {
                console.error('Error fetching grades:', error);
            }
        };

        getStudent();
        getCourses();
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
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container-fluid">
                <a className="navbar-brand" href="#">Studee</a>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <a className="nav-link active" aria-current="page" href="#">AI Assistant</a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#">Parameters</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

    );
};

export default SomeComponent;

/*<div className="wrapper">


<h1>Student Data</h1>
<ul>
    {student.map(user => (
        <li key={user.id}>{user.name} - {user.email}</li>
    ))}
</ul>

<h1>Courses</h1>
<ul>
    {courses.map(course => (
        <li key={course.id}>{course.course_name} - {course.course_code}</li>
    ))}
</ul>

<button onClick={handlePostToken}>Post Token</button>

</div>*/