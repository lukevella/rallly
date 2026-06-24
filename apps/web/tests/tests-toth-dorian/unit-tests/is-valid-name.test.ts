import { isValidName as validName } from "../../../src/utils/is-valid-name";

describe("isValidName", () => {
  it("should return true for a valid name", () => {
    expect(validName("Dorian Toth")).toBe(true);
  });

  it("should return false for a invalid name", () => {
    expect(validName("S2410307044")).toBe(false);
  });

  it("should return true for a valid name with title and so on", () => {
    expect(validName("Dr. Gerald Harald Müller Bsc.")).toBe(true);
  });

  it("should return false for a invalid name because its a url", () => {
    expect(validName("https://www.youtube.com/watch?v=8Pc0AEbfnBM")).toBe(
      false,
    );
  });

  it("should return false for a invalid name because its a email", () => {
    expect(validName("gerald.harald.mueller@gmail.com")).toBe(false);
  });

  it("should return false for a invalid name because its a phone number", () => {
    expect(validName("+43668985475")).toBe(false);
  });
});
