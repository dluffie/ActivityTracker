import './Input.css';

const Input = ({
    label,
    type = 'text',
    error,
    icon: Icon,
    className = '',
    ...props
}) => {
    return (
        <div className={`form-group ${className}`}>
            {label && <label className="form-label">{label}</label>}
            <div className="input-wrapper">
                {Icon && (
                    <span className="input-icon">
                        <Icon size={18} />
                    </span>
                )}
                <input
                    type={type}
                    className={`form-input ${Icon ? 'has-icon' : ''} ${error ? 'form-input-error' : ''}`}
                    {...props}
                />
            </div>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export default Input;
