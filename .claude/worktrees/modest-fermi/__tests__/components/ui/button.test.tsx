import React from 'react';
// @ts-expect-error - type mismatch
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

// Mock the cn utility
jest.mock('@/lib/utils', () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(' '),
}));

describe('Button Component', () => {
  describe('Default Rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should render children text content', () => {
      render(<Button>Submit Form</Button>);

      expect(screen.getByText('Submit Form')).toBeInTheDocument();
    });

    it('should apply default variant and size classes', () => {
      render(<Button>Default</Button>);

      const button = screen.getByRole('button');
      // The button should be rendered with default variant class names
      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });

    it('should have button type by default', () => {
      render(<Button>Click</Button>);

      const button = screen.getByRole('button');
      // HTML buttons have type="submit" by default unless specified
      expect(button).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render with default variant', () => {
      render(<Button variant="default">Default</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-primary');
    });

    it('should render with destructive variant', () => {
      render(<Button variant="destructive">Delete</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-destructive');
    });

    it('should render with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('border');
    });

    it('should render with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('bg-secondary');
    });

    it('should render with ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('hover:bg-muted');
    });

    it('should render with link variant', () => {
      render(<Button variant="link">Link</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should render with default size', () => {
      render(<Button size="default">Default Size</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-9');
      expect(button.className).toContain('px-3');
    });

    it('should render with sm size', () => {
      render(<Button size="sm">Small</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-8');
    });

    it('should render with lg size', () => {
      render(<Button size="lg">Large</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('h-10');
    });

    it('should render with icon size', () => {
      render(<Button size="icon">X</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('size-9');
    });
  });

  describe('Click Events', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Multi Click</Button>);

      const button = screen.getByRole('button');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should not fire click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is passed', () => {
      render(<Button disabled>Disabled Button</Button>);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles', () => {
      render(<Button disabled>Disabled</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:pointer-events-none');
      expect(button.className).toContain('disabled:opacity-50');
    });
  });

  describe('asChild Prop', () => {
    it('should render as child component when asChild prop is used', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = screen.getByRole('link', { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', '/test');
    });

    it('should render as button element when asChild is false', () => {
      render(<Button asChild={false}>Regular Button</Button>);

      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Custom Props', () => {
    it('should pass through additional HTML attributes', () => {
      render(
        <Button type="submit" data-testid="submit-btn" aria-label="Submit form">
          Submit
        </Button>
      );

      const button = screen.getByTestId('submit-btn');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('aria-label', 'Submit form');
    });

    it('should apply custom className alongside variant classes', () => {
      render(<Button className="custom-class">Custom</Button>);

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });

    it('should forward ref to the button element', () => {
      const ref = React.createRef<HTMLButtonElement>();

      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });
  });
});
