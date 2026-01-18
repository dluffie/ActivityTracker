import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showClose = true
}) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal modal-${size}`}>
                {(title || showClose) && (
                    <div className="modal-header">
                        <h3 className="modal-title">{title}</h3>
                        {showClose && (
                            <button className="modal-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        )}
                    </div>
                )}
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
