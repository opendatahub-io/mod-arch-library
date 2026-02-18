import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FieldGroupHelpLabelIcon from '~/components/FieldGroupHelpLabelIcon';

describe('FieldGroupHelpLabelIcon', () => {
  it('should render with content', () => {
    render(<FieldGroupHelpLabelIcon content="Test help content" />);

    const button = screen.getByRole('button', { name: 'More info' });
    expect(button).toBeInTheDocument();
  });

  it('should render with React element as content', () => {
    const content = (
      <div>
        <strong>Help title</strong>
        <p>Help description</p>
      </div>
    );
    render(<FieldGroupHelpLabelIcon content={content} />);

    const button = screen.getByRole('button', { name: 'More info' });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick handler when provided', () => {
    const handleClick = jest.fn();

    render(<FieldGroupHelpLabelIcon content="Test help content" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: 'More info' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should work without onClick handler (backward compatibility)', () => {
    render(<FieldGroupHelpLabelIcon content="Test help content" />);

    const button = screen.getByRole('button', { name: 'More info' });

    // Should not throw error when clicked without onClick handler
    fireEvent.click(button);

    expect(button).toBeInTheDocument();
  });

  it('should call onClick multiple times when clicked multiple times', () => {
    const handleClick = jest.fn();

    render(<FieldGroupHelpLabelIcon content="Test help content" onClick={handleClick} />);

    const button = screen.getByRole('button', { name: 'More info' });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(3);
  });
});
