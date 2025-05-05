import { TextEncoder, TextDecoder } from 'node:util';
import 'whatwg-fetch';

Object.defineProperties(globalThis, {
  TextEncoder: { value: TextEncoder },
  TextDecoder: { value: TextDecoder },
}); 