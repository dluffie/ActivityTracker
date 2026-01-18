import './Loading.css';

const Loading = ({ size = 'md', fullScreen = false, text = '' }) => {
    if (fullScreen) {
        return (
            <div className="loading-fullscreen">
                <div className="loading-content">
                    <div className={`loading-spinner loading-${size}`} />
                    {text && <p className="loading-text">{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className="loading-container">
            <div className={`loading-spinner loading-${size}`} />
            {text && <p className="loading-text">{text}</p>}
        </div>
    );
};

export default Loading;
