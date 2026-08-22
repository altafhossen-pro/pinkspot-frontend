
const fs = require('fs');
const path = 'f:/Personal Projects/forpink-version-2/ecommerce-frontend/src/app/admin/dashboard/products/create/page.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add fields to formData
content = content.replace(
  'title: \'\',',
  'title: \'\',\n        subtitleName: \'\',\n        isSubtitleEnabled: true,'
);

// 2. Fetch global subtitle in fetchCategories (as a convenient place since it's called on mount)
content = content.replace(
  'const fetchCategories = async () => {',
  'const fetchGlobalSubtitle = async () => {\n        try {\n            const { settingsAPI } = require(\'@/services/api\');\n            const data = await settingsAPI.getSiteSettings();\n            if (data.success && data.data && data.data.globalProductSubtitle) {\n                setFormData(prev => ({\n                    ...prev,\n                    subtitleName: data.data.globalProductSubtitle.text || \'\',\n                    isSubtitleEnabled: data.data.globalProductSubtitle.isEnabled ?? true\n                }));\n            }\n        } catch (error) {\n            console.error(\'Error fetching global subtitle:\', error);\n        }\n    }\n\n    const fetchCategories = async () => {'
);

content = content.replace(
  'fetchCategories()',
  'fetchCategories();\n                fetchGlobalSubtitle();'
);

fs.writeFileSync(path, content, 'utf8');

