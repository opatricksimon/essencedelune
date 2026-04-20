function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Leads');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Leads');
      sheet.appendRow([
        'created_at',
        'nome',
        'email',
        'telefone',
        'origem',
        'user_agent'
      ]);
    }

    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var data = JSON.parse(raw);

    sheet.appendRow([
      new Date(),
      data.nome || '',
      data.email || '',
      data.telefone || '',
      data.origem || '',
      data.userAgent || ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        error: String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
