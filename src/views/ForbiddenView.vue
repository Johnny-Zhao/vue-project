<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const attemptedPath = computed(() =>
  typeof route.query.from === 'string' && route.query.from.startsWith('/') ? route.query.from : null,
)

function goHome() {
  void router.replace({ name: 'home' })
}

function logoutAndSwitch() {
  authStore.logout()
  void router.replace({ name: 'login' })
}
</script>

<template>
  <section class="forbidden-page">
    <article class="forbidden-card">
      <p class="eyebrow">403 Forbidden</p>
      <h1>You are signed in, but this role cannot access the requested page.</h1>
      <p class="copy">
        This is the typical admin-system fallback for route permission checks. The current account is
        blocked before the page renders.
      </p>

      <div class="info-grid">
        <div>
          <span>Current Role</span>
          <strong>{{ authStore.role ?? 'guest' }}</strong>
        </div>
        <div>
          <span>Requested Path</span>
          <strong>{{ attemptedPath ?? 'unknown' }}</strong>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="primary" @click="goHome">Back to Home</button>
        <button type="button" class="secondary" @click="logoutAndSwitch">Switch Account</button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.forbidden-page {
  display: grid;
  place-items: center;
  min-height: 60vh;
}

.forbidden-card {
  width: min(760px, 100%);
  padding: 2rem;
  border-radius: 32px;
  border: 1px solid rgba(29, 59, 54, 0.12);
  background:
    radial-gradient(circle at top right, rgba(195, 109, 61, 0.15), transparent 24%),
    rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
}

.eyebrow {
  color: #a4511b;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-size: 0.78rem;
  font-weight: 700;
}

.forbidden-card h1 {
  margin-top: 0.75rem;
  color: #173937;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  line-height: 1.1;
}

.copy {
  margin-top: 1rem;
  max-width: 40rem;
  color: #556260;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.info-grid div {
  padding: 1.1rem;
  border-radius: 22px;
  background: #f7f3eb;
}

.info-grid span {
  color: #7a5d2d;
  font-size: 0.82rem;
}

.info-grid strong {
  display: block;
  margin-top: 0.3rem;
  color: #173937;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.75rem;
  flex-wrap: wrap;
}

.actions button {
  border: 0;
  border-radius: 999px;
  padding: 0.8rem 1.15rem;
  cursor: pointer;
}

.actions .primary {
  background: #173937;
  color: #fff8ef;
}

.actions .secondary {
  background: #f0e2ca;
  color: #7a5d2d;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
