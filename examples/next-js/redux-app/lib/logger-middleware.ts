import type { Middleware } from "@reduxjs/toolkit";

export const loggerMiddleware: Middleware = ({ getState }) => (next) =>
  (action) => {
    const actionType =
      typeof action === "object" && action !== null && "type" in action
        ? String(action.type)
        : "unknown action";

    console.groupCollapsed(`[redux] ${actionType}`);
    console.log("action", action);

    const result = next(action);

    console.log("state", getState());
    console.groupEnd();

    return result;
  };
