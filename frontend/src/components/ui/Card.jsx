import './Card.css';

const Card = ({
    children,
    title,
    subtitle,
    action,
    glass = false,
    hover = true,
    className = '',
    ...props
}) => {
    const classNames = [
        'card',
        glass && 'card-glass',
        !hover && 'no-hover',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames} {...props}>
            {(title || action) && (
                <div className="card-header">
                    <div>
                        {title && <h3 className="card-title">{title}</h3>}
                        {subtitle && <p className="card-subtitle">{subtitle}</p>}
                    </div>
                    {action && <div className="card-action">{action}</div>}
                </div>
            )}
            <div className="card-content">
                {children}
            </div>
        </div>
    );
};

export default Card;
