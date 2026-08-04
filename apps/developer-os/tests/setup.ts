import '@testing-library/jest-dom/vitest';import 'fake-indexeddb/auto';
Object.defineProperty(globalThis,'crypto',{value:{randomUUID:()=>`00000000-0000-4000-8000-${Math.random().toString().slice(2,14).padEnd(12,'0')}`},configurable:true});
