
const fs = require('fs');
const path = 'f:/Personal Projects/forpink-version-2/ecommerce-frontend/src/services/api.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  'updateSiteSettings: (siteData, token) => {',
  'updateGlobalProductSubtitle: (data, token) => {\n        return apiCall(\'/settings/global-subtitle\', {\n            method: \'PATCH\',\n            headers: {\n                \'Authorization\': \Bearer \\,\n                \'Content-Type\': \'application/json\',\n            },\n            body: JSON.stringify(data),\n        });\n    },\n\n    updateSiteSettings: (siteData, token) => {'
);
fs.writeFileSync(path, content, 'utf8');

