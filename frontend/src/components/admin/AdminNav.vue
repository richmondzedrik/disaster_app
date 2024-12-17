<template>
  <nav class="admin-nav">
    <div class="nav-header">
      <h2>Admin Panel</h2>
    </div>
    <ul class="nav-links">
      <li>
        <router-link to="/admin/dashboard" active-class="active">
          <i class="fas fa-tachometer-alt"></i>
          Dashboard
        </router-link>
      </li>
      <li>
        <router-link to="/admin/users" active-class="active">
          <i class="fas fa-users"></i>
          Users
        </router-link>
      </li>
      <li>
        <router-link to="/admin/posts" active-class="active">
          <i class="fas fa-newspaper"></i>
          Posts
        </router-link>
      </li>
      <li>
        <router-link to="/admin/alerts" active-class="active">
          <i class="fas fa-bell"></i>
          Alerts
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup>
// No additional script needed for now
</script>

<style scoped>
.admin-nav {
  background: #1a1a1a;
  width: 250px;
  min-height: 100vh;
  padding: 1rem;
  color: white;
}

.nav-header {
  padding: 1rem;
  border-bottom: 1px solid #333;
  margin-bottom: 1rem;
}

.nav-header h2 {
  color: #fff;
  font-size: 1.5rem;
  margin: 0;
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  margin-bottom: 0.5rem;
}

.nav-links a {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: #ccc;
  text-decoration: none;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-links a i {
  margin-right: 0.75rem;
  width: 20px;
  text-align: center;
}

.nav-links a:hover {
  background: #333;
  color: white;
}

.nav-links a.active {
  background: #005C5C;
  color: white;
}
</style>