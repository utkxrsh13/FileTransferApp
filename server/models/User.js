// Simple User model for in-memory storage
// In production, replace with proper database model (MongoDB, PostgreSQL, etc.)

export class User {
  constructor(id, username, email, password) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.password = password;
    this.createdAt = new Date();
    this.isOnline = false;
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      createdAt: this.createdAt,
      isOnline: this.isOnline
    };
  }
}
