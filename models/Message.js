const db = require('../db');

module.exports = {
  send: ({ sender, recipient, message }) => {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO messages (sender, recipient, message, timestamp)
        VALUES (?, ?, ?, datetime('now'))
      `;
      db.run(query, [sender, recipient, message], function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      });
    });
  },

  getConversation: (user1, user2) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM messages
        WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
        ORDER BY timestamp ASC
      `;
      db.all(query, [user1, user2, user2, user1], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getChatListForUser: (username) => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT DISTINCT
          CASE WHEN sender = ? THEN recipient ELSE sender END AS chatPartner
        FROM messages
        WHERE sender = ? OR recipient = ?
      `;
      db.all(query, [username, username, username], (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(r => r.chatPartner));
      });
    });
  }
};
