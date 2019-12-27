const redis = require("redis");

module.exports = {
    getUsers: function getUsers(callback) {
        let client = redis.createClient(process.env.REDIS_URL);

        client.get("users", function (err, users) {
            if (err) {
                return callback(err);
            }

            if (users) {
                users = JSON.parse(users);
            } else {
                users = [
                    {
                        user_id: "db01", email: "user1@example.org", password: "user1", user_metadata: { lang: "en" }, app_metadata: { ref: "U01" }
                    },
                ]
            }

            client.quit();

            callback(null, users);
        });
    },
    getSettings: function getSettings(callback) {
        let client = redis.createClient(process.env.REDIS_URL);

        client.get("settings", function (err, settings) {
            if (err) {
                return callback(err);
            }

            if (settings) {
                settings = JSON.parse(settings);
            } else {
                settings = {};
            }

            client.quit();

            callback(null, settings);
        });
    },
    saveUsers: function saveUsers(users, callback) {
        let client = redis.createClient(process.env.REDIS_URL);

        client.set("users", JSON.stringify(users));
    
        client.quit();
        
        callback(null);
    },
    saveSettings: function saveSettings(settings, callback) {
        let client = redis.createClient(process.env.REDIS_URL);

        client.set("settings", JSON.stringify(settings));
    
        client.quit();
        
        callback(null);
    }
}