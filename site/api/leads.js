const GAS_URL = process.env.GAS_URL || 'https://script.google.com/macros/s/AKfycbydDc4GAO8NgdjyTBhYV8JLUqfVAXzSs0i4CmzGvYdX8EBKuP1L5u_MoX7SPUnvoxfn1A/exec';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  if (!req.body) return {};

  if (typeof req.body === 'string') {
    return JSON.parse(req.body);
  }

  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'));
  }

  return req.body;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { ok: false, error: 'Method not allowed' });
  }

  try {
    const data = parseBody(req);
    const nome = typeof data.nome === 'string' ? data.nome.trim() : '';
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    const telefone = typeof data.telefone === 'string' ? data.telefone.trim() : '';
    const telefoneDigits = telefone.replace(/\D/g, '');
    const origem = typeof data.origem === 'string' ? data.origem.trim() : 'instagram';
    const userAgent = req.headers['user-agent'] || data.userAgent || '';

    if (
      !nome ||
      !email ||
      !telefone ||
      telefoneDigits.length < 10 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return sendJson(res, 400, { ok: false, error: 'Dados invalidos para o lead' });
    }

    const gasResponse = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        nome,
        email,
        telefone,
        origem,
        userAgent
      })
    });

    const gasText = await gasResponse.text();
    let gasPayload = null;

    try {
      gasPayload = gasText ? JSON.parse(gasText) : null;
    } catch (error) {
      gasPayload = null;
    }

    if (!gasResponse.ok || (gasPayload && gasPayload.ok === false)) {
      return sendJson(res, 502, {
        ok: false,
        error: gasPayload && gasPayload.error ? gasPayload.error : 'Falha ao salvar lead no Apps Script'
      });
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
