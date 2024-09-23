import { runtime } from './runtime.js';

before(async () => await runtime.setup());
after(async () => await runtime.teardown());
