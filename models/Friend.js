const db = require('../db');

module.exports = {
  sendRequest: (requester, recipient) => {
    return new Promise((resolve, reject) => {
      const query = `INSERT OR IGNORE INTO friendships (requester, recipient, status) VALUES (?, ?, 'pending')`;
      db.run(query, [requester, recipient], function (err) {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  acceptRequest: (recipient, requester) => {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE friendships
        SET status = 'accepted'
        WHERE requester = ? AND recipient = ?;
      `;
      db.run(query, [requester, recipient], function (err) {
        if (err) return reject(err);

        // also insert the reverse relationship
        db.run(
          `INSERT OR REPLACE INTO friendships (requester, recipient, status) VALUES (?, ?, 'accepted')`,
          [recipient, requester],
          err2 => (err2 ? reject(err2) : resolve())
        );
      });
    });
  },

  getFriendshipStatus: (user1, user2) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT status FROM friendships WHERE requester = ? AND recipient = ?`;
      db.get(query, [user1, user2], (err, row) => {
        if (err) reject(err);
        else resolve(row?.status || null);
      });
    });
  },

  getPendingRequestsForUser: (username) => {
    return new Promise((resolve, reject) => {
      const query = `SELECT requester FROM friendships WHERE recipient = ? AND status = 'pending'`;
      db.all(query, [username], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  areMutualFriends: async (user1, user2) => {
    const status1 = await module.exports.getFriendshipStatus(user1, user2);
    const status2 = await module.exports.getFriendshipStatus(user2, user1);
    return status1 === 'accepted' && status2 === 'accepted';
  }
};
