import { useEffect, useState } from 'react';

const LLM = () => {
    const [isLoading, setIsLoading] = useState(true);

    // Get Streamlit URL from environment variable or use fallback
    const streamlitUrl = import.meta.env.VITE_STREAMLIT_URL || 'http://localhost:8501';

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
            {isLoading && <div className="text-center p-5">Loading Streamlit application...</div>}
            <iframe
                src={streamlitUrl}
                width="100%"
                height="calc(100vh - 80px)"
                frameBorder="0"
                title="AI Chatbot"
                allow="microphone"
                style={{ display: isLoading ? 'none' : 'block' }}
                onLoad={() => setIsLoading(false)}
            />
        </div>
    );
};

export default LLM;