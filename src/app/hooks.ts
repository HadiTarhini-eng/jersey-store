import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/** Typed dispatch — use instead of plain `useDispatch`. */
export const useAppDispatch: () => AppDispatch = useDispatch;

/** Typed selector — use instead of plain `useSelector`. */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
