import './Select.css';

const Select = ({
    label,
    options = [],
    placeholder = 'Select an option',
    error,
    className = '',
    ...props
}) => {
    return (
        <div className={`form-group ${className}`}>
            {label && <label className="form-label">{label}</label>}
            <select
                className={`form-select ${error ? 'form-input-error' : ''}`}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export default Select;
