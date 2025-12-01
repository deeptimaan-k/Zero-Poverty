// ==========================================
// COPY THIS CONTENT INTO GOOGLE APPS SCRIPT
// ==========================================

function doGet(e) {
  // Fix: Use getSheets()[0] to grab the first sheet automatically
  // This prevents "Sheet not found" errors if your tab is named "Sheet1"
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "No sheets found in spreadsheet"
    })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    // Return empty array if no data
    return ContentService.createTextOutput(JSON.stringify([]))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[0];
  const rows = data.slice(1);
  
  // Convert to JSON with Clean Keys
  const result = rows.map((row, rowIndex) => {
    let obj = {};
    // Add the row number (1-based index) so we can update it later
    // +2 because rows is sliced (0 is header), so row[0] is sheet row 2
    obj['_rowIndex'] = rowIndex + 2; 

    headers.forEach((header, index) => {
      // CLEANING LOGIC for headers like "Student\n Name"
      let key = header.toString();
      
      // 1. Remove quotes ("), newlines (\n), carriage returns (\r)
      key = key.replace(/["\n\r]/g, '');
      
      // 2. Remove all spaces to make variable-friendly keys
      key = key.replace(/\s+/g, '');
      
      // 3. Normalize Case for specific fields to ensure frontend compatibility
      const lowerKey = key.toLowerCase();
      
      if (lowerKey === 'gender') key = 'Gender';
      if (lowerKey === 'aadhaar') key = 'Aadhaar';
      if (lowerKey === 'dob') key = 'DOB';
      if (lowerKey === 'id') key = 'ID';
      
      obj[key] = row[index];
    });
    return obj;
  });

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    // Fix: Use first sheet for updates too
    const sheet = doc.getSheets()[0];
    
    if (!e.postData || !e.postData.contents) {
      throw new Error("No post data received");
    }

    const postData = JSON.parse(e.postData.contents);
    
    if (postData.action === 'update') {
      const idToFind = String(postData.id);
      const newAdmission = postData.admissionDetailed;
      const newRemark = postData.remark;
      
      const values = sheet.getDataRange().getValues();
      const headers = values[0];
      
      // Helper to find column index loosely
      const findColumn = (possibleNames) => {
        for (let i = 0; i < headers.length; i++) {
          const rawHeader = headers[i].toString().toLowerCase();
          const cleanHeader = rawHeader.replace(/["\n\r\s]/g, ''); // Remove quotes, newlines, spaces
          
          if (possibleNames.includes(cleanHeader)) return i;
        }
        return -1;
      };

      // Find indices based on normalized names
      const idIndex = findColumn(['id']);
      const admissionIndex = findColumn(['admissiondetailed', 'admission']);
      const remarkIndex = findColumn(['remark', 'remarks']);
      
      if (idIndex === -1) throw new Error("ID column not found in Sheet");
      
      let rowIndex = -1;
      // Search for the row with the matching ID
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idIndex]) === idToFind) {
          rowIndex = i + 1; // 1-based index for getRange
          break;
        }
      }
      
      if (rowIndex !== -1) {
        if (admissionIndex !== -1) {
          sheet.getRange(rowIndex, admissionIndex + 1).setValue(newAdmission);
        }
        if (remarkIndex !== -1) {
          sheet.getRange(rowIndex, remarkIndex + 1).setValue(newRemark);
        }
        
        return ContentService.createTextOutput(JSON.stringify({
          status: 'success', 
          message: 'Updated row ' + rowIndex
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
         return ContentService.createTextOutput(JSON.stringify({
          status: 'error', 
          message: 'Student ID not found: ' + idToFind
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Invalid action'}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}