const groupingConfig = [
    {
      key: 'type', // Column name for this level
      default: 'Uncategorized'
    },
    {
      key: 'enrolled_on',
      default: 'Unknown Year',
      format: date => (date ? new Date(date).getFullYear() : 'Unknown Year') // Custom formatter for years
    },
    {
      key: 'enrolled_on',
      default: 'Unknown Month',
      format: date =>
        date
          ? new Date(date).toLocaleString('default', { month: 'long' }) // Custom formatter for months
          : 'Unknown Month'
    },
    {
      key: 'org_id',
      default: 'Unknown Org'
    }
  ];
  
  module.exports = groupingConfig;
  