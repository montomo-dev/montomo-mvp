import test from 'node:test';
import assert from 'node:assert/strict';
import { Input } from '../js/input.js';
const events = new Map();
globalThis.window = { addEventListener: (name, fn) => events.set(name, fn) };
globalThis.document = { activeElement: null, hidden: false, addEventListener: (name, fn) => events.set(name, fn) };

test('two physical inputs for one action release independently and blur clears held input', () => {
  const input = new Input();
  input.press('ok', 'KeyZ'); input.press('ok', 'Enter');
  input.release('ok', 'KeyZ');
  assert.equal(input.isHeld('ok'), true);
  input.release('ok', 'Enter');
  assert.equal(input.isHeld('ok'), false);
  input.press('right', 'pointer-7');
  events.get('blur')();
  assert.equal(input.isHeld('right'), false);
  assert.equal(input.wasPressed('right'), false);
});

test('document controls keep native Enter and typed names do not trigger game actions', () => {
  const input = new Input();
  let prevented = false;
  document.activeElement = { tagName: 'BUTTON' };
  events.get('keydown')({code:'Enter', preventDefault:()=>prevented=true});
  assert.equal(prevented,false); assert.equal(input.wasPressed('ok'),false);
  document.activeElement = {tagName:'INPUT'};
  events.get('keydown')({code:'KeyZ', preventDefault:()=>prevented=true});
  assert.equal(input.wasPressed('ok'),false);
  document.activeElement = null;
  events.get('keydown')({code:'KeyZ', preventDefault:()=>prevented=true});
  assert.equal(input.wasPressed('ok'),true);
  document.hidden = true; events.get('visibilitychange')();
  assert.equal(input.isHeld('ok'),false);
});
