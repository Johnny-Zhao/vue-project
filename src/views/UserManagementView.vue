<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createUserApi, deleteUserApi, fetchUsersApi, updateUserApi } from '@/api/users'
import type { UserRole } from '@/features/auth/types'
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserItem,
  UserPageResult,
  UserQuery,
  UserStatus,
} from '@/types/user'

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const requestError = ref('')

const users = ref<UserItem[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const keyword = ref('')
const roleFilter = ref<UserRole | ''>('')
const statusFilter = ref<UserStatus | ''>('')

const dialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedUserId = ref<number | null>(null)

const form = reactive<CreateUserPayload>({
  username: '',
  password: '',
  name: '',
  role: 'viewer',
  status: 'active',
})

const isEditing = computed(() => dialogMode.value === 'edit' && selectedUserId.value !== null)

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试。'
}

function resetForm() {
  selectedUserId.value = null
  form.username = ''
  form.password = ''
  form.name = ''
  form.role = 'viewer'
  form.status = 'active'
}

function openCreateDialog() {
  dialogMode.value = 'create'
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(user: UserItem) {
  dialogMode.value = 'edit'
  selectedUserId.value = user.id
  form.username = user.username
  form.password = ''
  form.name = user.name
  form.role = user.role
  form.status = user.status
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  resetForm()
}

async function loadUsers(options: { resetPage?: boolean } = {}) {
  loading.value = true
  requestError.value = ''

  try {
    if (options.resetPage) {
      currentPage.value = 1
    }

    const query: UserQuery = {
      keyword: keyword.value.trim() || undefined,
      role: roleFilter.value || undefined,
      status: statusFilter.value || undefined,
      page: currentPage.value,
      pageSize: pageSize.value,
    }

    const result: UserPageResult = await fetchUsersApi(query)
    users.value = result.list
    total.value = result.total
    currentPage.value = result.page
    pageSize.value = result.pageSize
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  saving.value = true
  requestError.value = ''

  try {
    if (isEditing.value) {
      const payload: UpdateUserPayload = {
        name: form.name,
        role: form.role,
        status: form.status,
        password: form.password.trim() || undefined,
      }

      await updateUserApi(selectedUserId.value as number, payload)
      ElMessage.success('用户已更新')
    } else {
      await createUserApi({
        username: form.username,
        password: form.password,
        name: form.name,
        role: form.role,
        status: form.status,
      })
      ElMessage.success('用户已创建')
    }

    closeDialog()
    await loadUsers()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    saving.value = false
  }
}

async function handleDelete(user: UserItem) {
  await ElMessageBox.confirm(`确认删除用户“${user.name}”吗？`, '删除用户', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消',
  })

  deletingId.value = user.id
  requestError.value = ''

  try {
    await deleteUserApi(user.id)
    ElMessage.success('用户已删除')
    await loadUsers()
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    deletingId.value = null
  }
}

function handlePageChange(page: number) {
  currentPage.value = page
  void loadUsers()
}

function handlePageSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  void loadUsers()
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <section class="user-page">
    <article class="page-card">
      <div class="page-head">
        <div>
          <p class="section-label">PostgreSQL 用户管理</p>
          <h2>登录账号现在来自 PostgreSQL</h2>
          <p class="page-copy">
            这里维护后台登录用户。新增、禁用、修改角色后，会直接影响后端登录和 JWT 鉴权结果。
          </p>
        </div>

        <div class="head-actions">
          <el-button @click="loadUsers({ resetPage: true })">刷新</el-button>
          <el-button type="primary" @click="openCreateDialog">新建用户</el-button>
        </div>
      </div>

      <div v-if="requestError" class="error-banner">{{ requestError }}</div>

      <div class="filter-bar">
        <el-input v-model="keyword" clearable placeholder="按用户名、姓名搜索" />
        <el-select v-model="roleFilter" clearable placeholder="角色">
          <el-option label="admin" value="admin" />
          <el-option label="viewer" value="viewer" />
        </el-select>
        <el-select v-model="statusFilter" clearable placeholder="状态">
          <el-option label="active" value="active" />
          <el-option label="disabled" value="disabled" />
        </el-select>
        <el-button type="primary" :loading="loading" @click="loadUsers({ resetPage: true })">
          查询
        </el-button>
      </div>

      <el-table v-loading="loading" class="user-table" :data="users" row-key="id" stripe border>
        <el-table-column prop="username" label="用户名" min-width="140" />
        <el-table-column prop="name" label="姓名" min-width="140" />
        <el-table-column prop="role" label="角色" width="120" />
        <el-table-column prop="status" label="状态" width="120" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
            <el-button
              link
              type="danger"
              :loading="deletingId === row.id"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :page-sizes="[5, 10, 20]"
          :total="total"
          background
          layout="total, sizes, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </article>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑用户' : '新建用户'"
      width="560px"
      destroy-on-close
      @closed="closeDialog"
    >
      <el-form class="dialog-form" label-position="top">
        <div class="form-grid">
          <el-form-item label="用户名">
            <el-input
              v-model="form.username"
              maxlength="30"
              placeholder="例如：admin"
              :disabled="isEditing"
            />
          </el-form-item>

          <el-form-item label="姓名">
            <el-input v-model="form.name" maxlength="30" placeholder="例如：管理员" />
          </el-form-item>

          <el-form-item label="密码">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              maxlength="100"
              :placeholder="isEditing ? '留空表示不修改密码' : '请输入登录密码'"
            />
          </el-form-item>

          <el-form-item label="角色">
            <el-select v-model="form.role">
              <el-option label="admin" value="admin" />
              <el-option label="viewer" value="viewer" />
            </el-select>
          </el-form-item>

          <el-form-item label="状态">
            <el-select v-model="form.status">
              <el-option label="active" value="active" />
              <el-option label="disabled" value="disabled" />
            </el-select>
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <div class="dialog-actions">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            {{ isEditing ? '保存修改' : '创建用户' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.user-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.page-card {
  padding: 1.1rem;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.05);
}

.section-label {
  color: #2563eb;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-size: 0.68rem;
  font-weight: 700;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.page-head h2 {
  margin-top: 0.28rem;
  color: #0f172a;
  font-size: 1.12rem;
  font-weight: 700;
}

.page-copy {
  margin-top: 0.48rem;
  color: #64748b;
  font-size: 0.9rem;
}

.head-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.error-banner {
  margin-top: 0.9rem;
  padding: 0.88rem 1rem;
  border-radius: 14px;
  background: rgba(248, 113, 113, 0.08);
  color: #dc2626;
  border: 1px solid rgba(248, 113, 113, 0.16);
  font-size: 0.88rem;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 160px 160px auto;
  gap: 0.7rem;
  margin-top: 0.95rem;
}

.user-table {
  margin-top: 0.9rem;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.9rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.dialog-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.dialog-form :deep(.el-form-item__label) {
  padding-bottom: 0.35rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.65rem;
}

@media (max-width: 1080px) {
  .page-head {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-bar {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .pagination-wrap {
    justify-content: flex-start;
    overflow-x: auto;
  }
}
</style>
