let users = [];
let idCounter = 1;

class User {
  constructor(username, role) {
    this.id = idCounter++;
    this.username = username;
    this.role = role;
  }
}

function addUser(username, role) {
  const user = new User(username, role);
  users.push(user);
  return user;
}

function getUsers() {
  return users;
}

function removeUser(id) {
  users = users.filter(u => u.id !== id);
}

module.exports = { addUser, getUsers, removeUser };
