import { useEffect, useState } from 'react';
import { fetchCourses, fetchStudent, fetchProgram, Student, Course, Program } from '../API/Api';

const MainPage = () => {
    const [student, setStudent] = useState<Student[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const [studentData, coursesData, programData] = await Promise.all([
                    fetchStudent(),
                    fetchCourses(),
                    fetchProgram()
                ]);
                setStudent(studentData);
                setCourses(coursesData);
                setPrograms(programData);
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="row">
                <div className="col-md-6">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5>Student Information</h5>
                        </div>
                        <div className="card-body">
                            {student.length > 0 ? (
                                <div>
                                    <p><strong>Name:</strong> {student[0].name}</p>
                                    <p><strong>Email:</strong> {student[0].email}</p>
                                    <p><strong>Start Year:</strong> {student[0].start_year}</p>
                                    <p><strong>Expected Graduation:</strong> {student[0].graduation_year}</p>
                                    <p><strong>Address:</strong> {student[0].address}</p>
                                </div>
                            ) : (
                                <p>No student information available</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h5>Enrolled Courses</h5>
                        </div>
                        <div className="card-body">
                            {courses.length > 0 ? (
                                <ul className="list-group">
                                    {courses.map(course => (
                                        <li key={course.id} className="list-group-item">
                                            <h6>{course.course_name}</h6>
                                            <p className="mb-1"><strong>Code:</strong> {course.course_code}</p>
                                            <p className="mb-1"><strong>Credits:</strong> {course.credits}</p>
                                            <p className="mb-0"><strong>Semester:</strong> {course.semester}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No courses available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5>Academic Programs</h5>
                        </div>
                        <div className="card-body">
                            {programs.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Program Name</th>
                                                <th>Program Director</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {programs.map(program => (
                                                <tr key={program.id}>
                                                    <td>{program.program_name}</td>
                                                    <td>{program.director}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>No program information available</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainPage;