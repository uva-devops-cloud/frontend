import { useEffect } from 'react';

const LLM = () => {
    // Add a class to the parent container when this component mounts
    useEffect(() => {
        // Add the fullwidth class to the container
        const container = document.querySelector('.container.mt-4');
        if (container) {
            container.classList.add('fullwidth-container');
        }

        // Clean up when component unmounts
        return () => {
            if (container) {
                container.classList.remove('fullwidth-container');
            }
        };
    }, []);

    return (
        <div className="streamlit-fullwidth">
            <iframe
                src="https://your-streamlit-app-url.com"
                width="100%"
                height="calc(100vh - 80px)" // Adjust the 80px based on your navbar height
                frameBorder="0"
                title="AI Chatbot"
                allow="microphone"
            />
        </div>
    );
};

export default LLM;