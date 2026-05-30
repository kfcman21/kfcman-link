const fs = require('fs');

fetch('http://kfcman.link').then(r => r.text()).then(t => {
  console.log('Response length:', t.length);
  const crit = ['admin-approval-section','monitor-cpu-val','admin-empty-state','admin-table-wrapper','admin-pending-body','settings-subview-admin','settings-subtabs-bar','btn-settings-subtab-admin','eusseuk-section','settings-section'];
  crit.forEach(id => {
    const found = t.includes('id="' + id + '"');
    console.log(id + ':', found ? 'FOUND' : 'MISSING');
  });
}).catch(console.error);
