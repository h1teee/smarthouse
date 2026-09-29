const fs = require('fs');
const path = '/home/alexandr/Рабочий стол/smarthouse-main/frontend/src/screens/UKAnalyticsScreen/UKAnalyticsScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('fetch(API_URL')) {
  // Add imports
  content = content.replace(
    `import React, { useState } from 'react';`,
    `import React, { useState, useEffect } from 'react';\nimport { API_URL, getAuthHeaders } from '@/config/api';`
  );

  // Add state and fetch inside component
  content = content.replace(
    `  const [activeBar, setActiveBar] = useState<number | null>(null);`,
    `  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [aiText, setAiText] = useState('В районе пр. Космонавтов участились жалобы на напор воды. Скорость закрытия заявок выросла на 15% по сравнению с прошлым месяцем.');

  useEffect(() => {
    fetch(API_URL + '/api/uk/analytics', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => { if(data && data.total_requests !== undefined) setStats({ total: data.total_requests, pending: data.pending, approved: data.approved, rejected: data.rejected })})
      .catch(() => {});
      
    fetch(API_URL + '/api/uk/analytics/ai', { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(data => { if(data && data.analysis) setAiText(data.analysis) })
      .catch(() => {});
  }, []);`
  );

  // Update AI text block
  content = content.replace(
    `В районе пр. Космонавтов участились жалобы на напор воды. \n            Скорость закрытия заявок выросла на 15% по сравнению с прошлым месяцем.`,
    `{aiText}`
  );

  fs.writeFileSync(path, content, 'utf8');
}
