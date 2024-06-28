type LoginWizardErrorCode =
  | "emailNotAllowed"
  | "userAlreadyExists"
  | "invalidOTP";

export class LoginWizardError extends Error {
  code: LoginWizardErrorCode;

  constructor(code: LoginWizardErrorCode, message?: string) {
    super(message); // Pass message to the base Error class
    this.code = code; // Set the custom error code
    this.name = this.constructor.name; // Set the error name to the class name

    // Ensure the stack trace is captured correctly
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
