import { describe, expect, it } from 'vitest';
import { GeminiRestaurantDraftGenerator } from './gemini-restaurant-draft-generator.js';
import { RestaurantDraftGenerationError } from './restaurant-draft-generator.js';

const apiKey = 'gemini-test-key';

const fullDraft = {
  name: 'Kairú',
  description: 'Comida vegana caseira no Rio Tavares.',
  type: 'fully_vegan',
  address: 'Rodovia Dr. Antônio Luiz Moura Gonzaga, 4703',
  neighborhood: 'Rio Tavares',
  phone: '(48) 99999-8888',
  website: 'https://kairu.com.br',
  instagram: '@kairu.veg',
  openingHours: {
    monday: [],
    tuesday: [{ opens: '11:30', closes: '15:00' }],
    wednesday: [{ opens: '11:30', closes: '15:00' }],
    thursday: [{ opens: '11:30', closes: '15:00' }],
    friday: [{ opens: '11:30', closes: '15:00' }],
    saturday: [{ opens: '12:00', closes: '16:00' }],
    sunday: [],
  },
};

function geminiAnswer(text: string, finishReason = 'STOP') {
  return { candidates: [{ content: { parts: [{ text }] }, finishReason }] };
}

interface Call {
  url: string;
  init: RequestInit;
}

// A fetch that answers with the given status and body and records the call.
function fakeFetch(status: number, body: unknown) {
  const calls: Call[] = [];
  const fetchFn = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, fetchFn: fetchFn as typeof fetch };
}

function generatorAnswering(status: number, body: unknown) {
  const { calls, fetchFn } = fakeFetch(status, body);
  return {
    calls,
    generator: new GeminiRestaurantDraftGenerator(apiKey, fetchFn),
  };
}

describe('GeminiRestaurantDraftGenerator', () => {
  it('asks Gemini with the search tool and the draft schema', async () => {
    const { calls, generator } = generatorAnswering(
      200,
      geminiAnswer(JSON.stringify(fullDraft)),
    );

    await generator.generate('Kairú, no Rio Tavares');

    expect(calls).toHaveLength(1);
    const [{ url, init }] = calls;
    expect(url).toMatch(/models\/gemini-[\w.-]+:generateContent$/);
    expect(url).not.toContain(apiKey);
    expect(init.headers).toMatchObject({ 'x-goog-api-key': apiKey });
    const body = JSON.parse(String(init.body));
    expect(body.tools).toEqual([{ googleSearch: {} }]);
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(body.contents[0].parts[0].text).toBe(
      '<sugestao>Kairú, no Rio Tavares</sugestao>',
    );
  });

  it('returns the draft with the values normalized like the form', async () => {
    const { generator } = generatorAnswering(
      200,
      geminiAnswer(JSON.stringify(fullDraft)),
    );

    expect(await generator.generate('Kairú')).toEqual({
      ...fullDraft,
      phone: '48999998888',
      instagram: 'kairu.veg',
    });
  });

  it('turns invalid fields into null and keeps the rest', async () => {
    const { generator } = generatorAnswering(
      200,
      geminiAnswer(
        JSON.stringify({
          ...fullDraft,
          type: 'vegetarian',
          phone: '9999',
          website: 'instagram',
          description: 'a'.repeat(301),
          openingHours: { monday: [] },
        }),
      ),
    );

    expect(await generator.generate('Kairú')).toMatchObject({
      name: 'Kairú',
      address: fullDraft.address,
      type: null,
      phone: null,
      website: null,
      description: null,
      openingHours: null,
    });
  });

  it('treats a week closed every day as hours not found', async () => {
    const closed = Object.fromEntries(
      Object.keys(fullDraft.openingHours).map((day) => [day, []]),
    );
    const { generator } = generatorAnswering(
      200,
      geminiAnswer(JSON.stringify({ ...fullDraft, openingHours: closed })),
    );

    expect((await generator.generate('Kairú')).openingHours).toBeNull();
  });

  it('accepts the JSON inside a Markdown code block', async () => {
    const { generator } = generatorAnswering(
      200,
      geminiAnswer('```json\n' + JSON.stringify(fullDraft) + '\n```'),
    );

    expect((await generator.generate('Kairú')).name).toBe('Kairú');
  });

  it.each([
    [
      'an error status, with the message of Gemini',
      429,
      { error: { code: 429, message: 'Quota exceeded.' } },
      'O Gemini respondeu com erro 429: Quota exceeded.',
    ],
    [
      'an error status without a body it knows',
      503,
      'Service Unavailable',
      'O Gemini respondeu com erro 503.',
    ],
    [
      'an answer without text',
      200,
      { candidates: [{ finishReason: 'SAFETY' }] },
      'O Gemini não devolveu um rascunho (motivo: SAFETY).',
    ],
    [
      'an answer that is not JSON',
      200,
      geminiAnswer('Não encontrei o restaurante.'),
      'O Gemini devolveu um rascunho que não é JSON.',
    ],
    [
      'a draft without the name',
      200,
      geminiAnswer(JSON.stringify({ ...fullDraft, name: null })),
      'O Gemini não encontrou o restaurante.',
    ],
  ])('fails on %s', async (_case, status, body, message) => {
    const { generator } = generatorAnswering(status, body);

    const result = generator.generate('Kairú');

    await expect(result).rejects.toThrow(RestaurantDraftGenerationError);
    await expect(result).rejects.toThrow(message);
  });

  it('fails when Gemini cannot be reached', async () => {
    const generator = new GeminiRestaurantDraftGenerator(apiKey, async () => {
      throw new TypeError('fetch failed');
    });

    await expect(generator.generate('Kairú')).rejects.toThrow(
      'Não foi possível conectar ao Gemini.',
    );
  });

  it('fails when Gemini takes too long', async () => {
    const generator = new GeminiRestaurantDraftGenerator(apiKey, async () => {
      throw new DOMException('The operation timed out.', 'TimeoutError');
    });

    await expect(generator.generate('Kairú')).rejects.toThrow(
      'O Gemini demorou demais para responder.',
    );
  });
});
