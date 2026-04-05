/**
 * Integration tests for the /api/translate POST route handler.
 * Tests the handler directly by importing it and passing mock NextRequest objects.
 */

// Mock global fetch for Google Translate API calls
const originalFetch = global.fetch;

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// Helper to create a mock NextRequest
function createRequest(body: Record<string, unknown>) {
  return new Request('http://localhost:4001/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/translate POST', () => {
  // We need to re-import the module for each test to reset the cache
  let POST: (request: Request) => Promise<Response>;

  beforeEach(async () => {
    jest.resetModules();
    const mod = await import('@/app/api/translate/route');
    POST = mod.POST as any;
  });

  it('returns 400 when text is missing', async () => {
    const req = createRequest({ to: 'ar' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('returns original text when target language is English', async () => {
    const req = createRequest({ text: 'Hello world', to: 'en' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.translatedText).toBe('Hello world');
    expect(data.from).toBe('en');
    expect(data.to).toBe('en');
  });

  it('returns original text with note for unsupported language', async () => {
    const req = createRequest({ text: 'Hello', to: 'xx' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.translatedText).toBe('Hello');
    expect(data.note).toBeDefined();
  });

  it('translates text successfully for supported language', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [[['مرحبا', 'Hello']]],
    }) as any;

    const req = createRequest({ text: 'Hello', to: 'ar' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.translatedText).toBe('مرحبا');
    expect(data.from).toBe('en');
    expect(data.to).toBe('ar');
  });

  it('returns 500 when Google Translate API fails', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 429,
    }) as any;

    const req = createRequest({ text: 'Hello', to: 'fr' });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
    // Falls back to original text
    expect(data.translatedText).toBe('Hello');
  });

  it('returns cached result on second call with same text', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [[['Bonjour', 'Hello']]],
    }) as any;

    // First call - should hit Google API
    const req1 = createRequest({ text: 'Hello', to: 'fr' });
    const res1 = await POST(req1);
    const data1 = await res1.json();

    expect(data1.translatedText).toBe('Bonjour');
    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    const req2 = createRequest({ text: 'Hello', to: 'fr' });
    const res2 = await POST(req2);
    const data2 = await res2.json();

    expect(data2.translatedText).toBe('Bonjour');
    expect(data2.cached).toBe(true);
    // fetch should NOT be called again
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('maps zh locale to zh-CN for Google Translate', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [[['你好', 'Hello']]],
    }) as any;

    const req = createRequest({ text: 'Hello', to: 'zh' });
    const res = await POST(req);
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.translatedText).toBe('你好');

    // Verify the URL used zh-CN
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(fetchCall).toContain('tl=zh-CN');
  });

  it('returns 500 when request body is invalid JSON', async () => {
    const req = new Request('http://localhost:4001/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
