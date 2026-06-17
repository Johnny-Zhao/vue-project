<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/features/auth/store'

interface LoginForm {
  username: string
  password: string
  remember: boolean
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const formRef = ref()
const formData = reactive<LoginForm>({
  username: 'admin',
  password: '123456',
  remember: true,
})

const formRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const isValid = await formRef.value?.validate().catch(() => false)
  if (!isValid || loading.value) {
    return
  }

  loading.value = true

  try {
    await authStore.login({ ...formData })

    const redirectTarget =
      typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
        ? route.query.redirect
        : '/'

    await router.replace(redirectTarget)
  } catch {
    // The request layer already shows a unified error message.
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>
    <div class="grid-overlay"></div>

    <article class="login-card">
      <div class="hero-panel">
        <p class="eyebrow">Ops Console</p>
        <h1>Make request handling, auth, and route protection feel like one coherent system.</h1>
        <p class="hero-copy">
          The login now calls the backend for real, and the rest of the app still uses unified token
          storage, 401 redirects, and protected routes.
        </p>

        <div class="hero-pills">
          <span>Unified ApiResponse</span>
          <span>401 Redirect</span>
          <span>Axios Layer</span>
        </div>

        <div class="demo-note">
          <strong>演示账号</strong>
          <p><code>admin / 123456</code>：管理员权限。</p>
          <p><code>viewer / 123456</code>：只读菜单。</p>
          <p>账号来自 PostgreSQL 的 <code>app_users</code> 表。</p>
        </div>
      </div>

      <div class="form-panel">
        <div class="panel-head">
          <p class="panel-label">Sign In</p>
          <h2>登录后台系统</h2>
        </div>

        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-position="top"
          class="login-form"
        >
          <el-form-item label="用户名" prop="username">
            <el-input
              v-model="formData.username"
              placeholder="请输入用户名，例如 admin"
              clearable
            />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="formData.password"
              type="password"
              show-password
              placeholder="请输入登录密码"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="form-meta">
            <el-checkbox v-model="formData.remember">记住登录状态</el-checkbox>
            <span>登录有效期 30 分钟</span>
          </div>

          <el-button type="primary" class="submit-button" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form>
      </div>
    </article>
  </section>
</template>

<style lang="less" scoped>
.login-page {
  @panel-bg: rgba(255, 250, 244, 0.86);
  @hero-text: #f8f1e7;
  @accent: #f1b661;
  @accent-soft: rgba(241, 182, 97, 0.18);
  @deep: #173937;
  @muted: #6b7472;

  position: relative;
  min-height: calc(100vh - 96px);
  display: grid;
  place-items: center;
  overflow: hidden;

  .ambient {
    position: absolute;
    border-radius: 999px;
    filter: blur(24px);
    opacity: 0.6;
  }

  .ambient-left {
    width: 360px;
    height: 360px;
    top: 6%;
    left: -120px;
    background: radial-gradient(circle, rgba(190, 115, 50, 0.34), transparent 70%);
  }

  .ambient-right {
    width: 420px;
    height: 420px;
    right: -140px;
    bottom: -80px;
    background: radial-gradient(circle, rgba(23, 82, 74, 0.28), transparent 72%);
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(23, 57, 55, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23, 57, 55, 0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: radial-gradient(circle at center, rgba(0, 0, 0, 0.72), transparent 92%);
    pointer-events: none;
  }

  .login-card {
    position: relative;
    z-index: 1;
    width: min(1080px, 100%);
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.9fr);
    border-radius: 32px;
    overflow: hidden;
    border: 1px solid rgba(24, 57, 52, 0.1);
    background: @panel-bg;
    box-shadow: 0 26px 60px rgba(26, 44, 40, 0.14);
    backdrop-filter: blur(18px);
  }

  .hero-panel {
    padding: 3rem;
    background:
      linear-gradient(150deg, rgba(19, 70, 62, 0.98), rgba(26, 36, 53, 0.96)),
      radial-gradient(circle at top left, rgba(241, 182, 97, 0.22), transparent 32%);
    color: @hero-text;
  }

  .eyebrow,
  .panel-label {
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .eyebrow {
    color: fade(@hero-text, 72%);
  }

  .hero-panel h1 {
    margin-top: 1rem;
    font-size: clamp(2.2rem, 4vw, 3.5rem);
    line-height: 1.05;
  }

  .hero-copy {
    margin-top: 1rem;
    max-width: 30rem;
    color: fade(@hero-text, 82%);
  }

  .hero-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;

    span {
      padding: 0.55rem 0.85rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
  }

  .demo-note {
    margin-top: 2rem;
    padding: 1.2rem;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.08);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);

    strong {
      display: block;
      margin-bottom: 0.5rem;
    }

    code {
      padding: 0.12rem 0.35rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.12);
      color: @hero-text;
    }
  }

  .form-panel {
    padding: 3rem;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: 1.2rem;
      border-radius: 26px;
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0.12)),
        radial-gradient(circle at top right, @accent-soft, transparent 45%);
      pointer-events: none;
    }
  }

  .panel-head,
  .login-form {
    position: relative;
    z-index: 1;
  }

  .panel-label {
    color: #846033;
  }

  .form-panel h2 {
    margin-top: 0.55rem;
    color: @deep;
    font-size: 1.8rem;
  }

  .login-form {
    margin-top: 1.5rem;
  }

  .form-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin: 0.25rem 0 1.5rem;
    color: @muted;
    font-size: 0.92rem;
  }

  .submit-button {
    width: 100%;
    min-height: 48px;
    border-radius: 14px;
    background: linear-gradient(135deg, #1a5b52, #21453f);
    border: 0;
    box-shadow: 0 12px 24px rgba(26, 69, 63, 0.24);
  }

  @media (max-width: 920px) {
    .login-card {
      grid-template-columns: 1fr;
    }

    .hero-panel,
    .form-panel {
      padding: 2rem;
    }
  }
}
</style>
