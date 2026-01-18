import './Button.css';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    fullWidth = false,
    className = '',
    ...props
}) => {
    const classNames = [
        'btn',
        `btn-${variant}`,
        size !== 'md' && `btn-${size}`,
        fullWidth && 'w-full',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            className={classNames}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <>
                    <span className="loading-spinner" style={{ width: 18, height: 18 }} />
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon size={18} />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon size={18} />}
                </>
            )}
        </button>
    );
};

export default Button;
