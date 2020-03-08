export const actionToString = function toString(this: any) {
  return JSON.stringify({ ...this });
};
