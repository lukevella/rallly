export const getPortal = () => {
  const el = document.getElementById("portal");
  if (el === null) {
    throw new Error("Portal element not found");
  }
  return el;
};
