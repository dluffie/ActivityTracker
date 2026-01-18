import React from 'react';
import './Table.css';

const Table = ({ columns, data, loading, emptyMessage = 'No data found' }) => {
    if (loading) {
        return (
            <div className="table-loading">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!data?.length) {
        return (
            <div className="table-empty">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="table-wrapper">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key} style={{ width: col.width }}>
                                {col.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, idx) => (
                        <tr key={row._id || idx}>
                            {columns.map((col) => (
                                <td key={col.key}>
                                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
