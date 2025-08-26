const activities = [];

async function logActivity(event, payload = {}) {
  const activity = {
    event,
    payload,
    timestamp: new Date()
  };
  activities.push(activity);
  if (activities.length > 1000) activities.shift();
  return activity;
}

async function getStats() {
  const total = activities.length;
  const byEvent = activities.reduce((acc, a) => {
    acc[a.event] = (acc[a.event] || 0) + 1;
    return acc;
  }, {});
  const last24h = activities.filter(a => Date.now() - a.timestamp.getTime() <= 24*60*60*1000).length;
  return { total, byEvent, last24h };
}

async function getRecentActivities(limit = 20) {
  return activities.slice(-limit).reverse();
}

module.exports = { logActivity, getStats, getRecentActivities };
