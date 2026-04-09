import { useRef, useCallback } from 'react';

export function useHistory(canvas) {
  const stack = useRef([]);
  const pointer = useRef(-1);

  const push = useCallback(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const snap = canvas.current.toDataURL();
    stack.current = stack.current.slice(0, pointer.current + 1);
    stack.current.push(snap);
    pointer.current = stack.current.length - 1;
  }, [canvas]);

  const undo = useCallback(() => {
    if (pointer.current <= 0) return;
    pointer.current -= 1;
    const img = new Image();
    img.src = stack.current[pointer.current];
    img.onload = () => {
      const ctx = canvas.current.getContext('2d');
      ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
      ctx.drawImage(img, 0, 0);
    };
  }, [canvas]);

  const redo = useCallback(() => {
    if (pointer.current >= stack.current.length - 1) return;
    pointer.current += 1;
    const img = new Image();
    img.src = stack.current[pointer.current];
    img.onload = () => {
      const ctx = canvas.current.getContext('2d');
      ctx.clearRect(0, 0, canvas.current.width, canvas.current.height);
      ctx.drawImage(img, 0, 0);
    };
  }, [canvas]);

  const clear = useCallback(() => {
    stack.current = [];
    pointer.current = -1;
  }, []);

  return { push, undo, redo, clear };
}