import { Wrench } from 'lucide-react';
import './MaintenancePage.css';

const MaintenancePage = () => {
    return (
        <div className="maintenance-page">
            <div className="maintenance-content">
                <div className="maintenance-icon">
                    <Wrench size={56} />
                </div>
                <h1>Under Maintenance</h1>
                <p>
                    We&apos;re currently performing scheduled maintenance to improve your experience.
                    Please check back shortly.
                </p>
                <div className="maintenance-dots">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                </div>
                <button className="maintenance-retry" onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </div>
        </div>
    );
};

export default MaintenancePage;
