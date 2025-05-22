db = db.getSiblingDB('mern_chat')

db.createUser({
    user: 'user',
    pwd: 'user',
    roles: [
        {
            role: 'readWrite',
            db: 'mern_chat',
        },
    ],
});