module.exports = [
  { key: 'type_identifier', default: 'Unknown Type', format: null },
  { key: 'year', default: 'Unknown Year', format: val => parseInt(val) },
  { key: 'month', default: 'Unknown Month', format: val => parseInt(val) },
  { key: 'org_id', default: 'Unknown Org', format: null },
];
