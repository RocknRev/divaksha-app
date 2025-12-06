import React from 'react';
import { Spinner } from 'react-bootstrap';
import './Loader.css';

interface LoaderProps {
  size?: 'sm' | undefined;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ size, className = '' }) => {
  return (
    <div className={`loader-container ${className}`}>
      <Spinner animation="border" role="status" size={size}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
};

export default Loader;

