import { useState } from 'react';
import { seedStudent, seedCourses, seedProgram } from '../API/Api';

interface DataSeederProps {
    onDataSeeded: () => void;
}

const DataSeeder: React.FC<DataSeederProps> = ({ onDataSeeded }) => {
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedResult, setSeedResult] = useState<{
        success: boolean;
        message: string;
    } | null>(null);

    const handleSeedData = async () => {
        if (isSeeding) return;

        setIsSeeding(true);
        setSeedResult(null);

        try {
            // Try to seed all data types
            await Promise.all([
                seedStudent(),
                seedCourses(),
                seedProgram()
            ]);

            setSeedResult({
                success: true,
                message: 'Successfully seeded sample data'
            });

            // Refresh data in parent component
            onDataSeeded();
        } catch (error) {
            setSeedResult({
                success: false,
                message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="mt-3 mb-4">
            <div className="d-flex align-items-center">
                <button
                    className="btn btn-warning me-3"
                    onClick={handleSeedData}
                    disabled={isSeeding}
                >
                    {isSeeding ? 'Seeding Data...' : 'Seed Test Data'}
                </button>

                {seedResult && (
                    <div className={`alert alert-${seedResult.success ? 'success' : 'danger'} mb-0 py-1 px-2`} role="alert">
                        {seedResult.message}
                    </div>
                )}
            </div>
            <small className="text-muted d-block mt-1">
                This will create sample Student, Courses, and Program data in your API.
            </small>
        </div>
    );
};

export default DataSeeder;