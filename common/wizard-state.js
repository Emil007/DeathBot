const activeSessions = new Set();
module.exports = { add: (id) => activeSessions.add(id), remove: (id) => activeSessions.delete(id), has: (id) => activeSessions.has(id) };