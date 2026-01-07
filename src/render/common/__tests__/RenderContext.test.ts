import { prettify } from '../../../helpers/prettify';
import { RenderContext } from '../RenderContext';

describe('RenderContext', async () => {
  test('prettify', () => {
    const ctx = new RenderContext();
    const target = prettify(`interface A{}`, 'typescript');
    ctx.addCodeBlock('interface A{}');
    expect(ctx.toCode('typescript', true)).toBe(target);
  });

  test('raw', () => {
    const ctx = new RenderContext();
    ctx.addCodeBlock('raw string');
    expect(ctx.toCode()).toBe('raw string');
  });
});
