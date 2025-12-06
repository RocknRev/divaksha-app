import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Divaksha app', () => {
  render(<App />);
  const brandElement = screen.getByText(/Divaksha/i);
  expect(brandElement).toBeInTheDocument();
});

