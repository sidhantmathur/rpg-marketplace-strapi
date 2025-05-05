import "@testing-library/jest-dom";

declare global {
  namespace jest {
    interface Matchers<R = void> {
      toBeInTheDocument(): R;
      toHaveClass(className: string): R;
      toHaveAttribute(attr: string, value?: string): R;
      toHaveTextContent(text: string | RegExp): R;
      toBeVisible(): R;
      toBeDisabled(): R;
      toBeEnabled(): R;
      toBeEmpty(): R;
      toBeInvalid(): R;
      toBeRequired(): R;
      toBeValid(): R;
      toHaveFocus(): R;
      toHaveFormValues(values: Record<string, any>): R;
      toBeChecked(): R;
      toBePartiallyChecked(): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveValue(value?: string | string[] | number): R;
    }
  }
}
