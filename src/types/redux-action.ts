import type { Action } from 'redux';

// Redux 4 and 5 both expose Action. Their names for actions with extra fields differ.
export type ReduxAction = Action & Record<string, unknown>;
