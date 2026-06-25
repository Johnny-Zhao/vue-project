<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import EntityForm from '@/components/EntityForm.vue'
import type { FormModel } from '@/components/formSchemas'
import {
  fetchAiFeedbackStatsApi,
  fetchAiRuntimeConfigApi,
  updateAiRuntimeConfigApi,
} from '@/features/ai-config/api'
import {
  createAiRuntimeConfigFields,
  createAiRuntimeConfigInitialValue,
} from '@/features/ai-config/formSchema'
import type {
  AiFeedbackStatsItem,
  AiFeedbackType,
  AiRuntimeConfigItem,
  UpdateAiRuntimeConfigPayload,
} from '@/features/ai-config/types'

const loading = ref(false)
const saving = ref(false)
const requestError = ref('')
const configDetail = ref<AiRuntimeConfigItem | null>(null)
const feedbackStats = ref<AiFeedbackStatsItem | null>(null)
const formModel = ref<FormModel>(createAiRuntimeConfigInitialValue())

const formFields = createAiRuntimeConfigFields()

const statusCards = computed(() => {
  if (!configDetail.value) {
    return []
  }

  return [
    {
      label: 'API Key 状态',
      value: configDetail.value.apiKeyConfigured ? '已配置' : '未配置',
      tip: '页面只展示状态，不直接回显真实密钥。',
    },
    {
      label: '接口地址',
      value: configDetail.value.endpointLabel,
      tip: '真实调用地址仍以服务端环境变量为准。',
    },
    {
      label: '最后更新人',
      value: configDetail.value.updatedByName,
      tip: '便于追踪配置由谁修改。',
    },
    {
      label: '最后更新时间',
      value: formatDateTime(configDetail.value.updatedAt),
      tip: '用于确认当前生效配置版本。',
    },
  ]
})

const feedbackCards = computed(() => {
  const stats = feedbackStats.value

  return [
    {
      label: '有帮助',
      value: String(stats?.helpfulCount ?? 0),
      tone: 'success',
      tip: '用户认为分析结果可直接参考。',
    },
    {
      label: '不准确',
      value: String(stats?.inaccurateCount ?? 0),
      tone: 'danger',
      tip: '说明提示词、规则或档案质量还需要继续校正。',
    },
    {
      label: '需重试',
      value: String(stats?.retryCount ?? 0),
      tone: 'warning',
      tip: '常用于结果不稳定、超时或内容不完整的场景。',
    },
    {
      label: '最近反馈',
      value: resolveLatestFeedbackText(stats),
      tone: 'normal',
      tip: '帮助快速判断最近一条反馈落在什么车辆、什么结论上。',
    },
  ]
})

function resolveErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : '请求失败，请稍后重试'
}

// 将表单模型转换为保存参数。
function buildSubmitPayload(model: FormModel): UpdateAiRuntimeConfigPayload {
  return {
    model: String(model.model ?? '').trim(),
    requestTimeoutMs: Number(model.requestTimeoutMs ?? 0),
    enableCache: Boolean(model.enableCache),
    allowManualRefresh: Boolean(model.allowManualRefresh),
    suggestRefreshOnSourceChange: Boolean(model.suggestRefreshOnSourceChange),
    openaiStore: Boolean(model.openaiStore),
  }
}

// 格式化日期时间，避免页面直接展示原始字符串。
function formatDateTime(value?: string | null) {
  if (!value) {
    return '暂无'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
  })
}

// 将反馈类型翻译为页面可读文案。
function resolveFeedbackTypeLabel(type: AiFeedbackType | null | undefined) {
  switch (type) {
    case 'helpful':
      return '有帮助'
    case 'inaccurate':
      return '不准确'
    case 'retry':
      return '需重试'
    default:
      return '暂无'
  }
}

// 组合最近反馈文案，便于在配置页快速查看闭环状态。
function resolveLatestFeedbackText(stats: AiFeedbackStatsItem | null) {
  if (!stats?.latestFeedbackAt) {
    return '暂无反馈记录'
  }

  const feedbackTypeLabel = resolveFeedbackTypeLabel(stats.latestFeedbackType)
  const plateNumber = stats.latestVehiclePlateNumber || '未知车辆'

  return `${plateNumber} · ${feedbackTypeLabel} · ${formatDateTime(stats.latestFeedbackAt)}`
}

// 并行加载配置详情与反馈统计。
async function loadAiConfigPageData() {
  loading.value = true
  requestError.value = ''

  try {
    const [configResult, statsResult] = await Promise.all([
      fetchAiRuntimeConfigApi(),
      fetchAiFeedbackStatsApi(),
    ])

    configDetail.value = configResult
    feedbackStats.value = statsResult
    formModel.value = createAiRuntimeConfigInitialValue(configResult)
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    loading.value = false
  }
}

// 重置表单为当前已保存配置。
function handleReset() {
  formModel.value = createAiRuntimeConfigInitialValue(configDetail.value ?? undefined)
}

// 提交并保存当前 AI 配置。
async function handleSubmit(model: FormModel) {
  saving.value = true
  requestError.value = ''

  try {
    const result = await updateAiRuntimeConfigApi(buildSubmitPayload(model))
    configDetail.value = result
    formModel.value = createAiRuntimeConfigInitialValue(result)
    ElMessage.success('AI 配置已保存')
  } catch (error) {
    requestError.value = resolveErrorMessage(error)
  } finally {
    saving.value = false
  }
}

void loadAiConfigPageData()
</script>

<template>
  <section class="ai-config-page">
    <div class="page-head">
      <div class="page-head__content">
        <p class="eyebrow">AI 运行配置</p>
        <h2>AI 配置管理</h2>
        <p class="intro">
          统一维护车辆 AI 分析的模型、超时、缓存与重算策略，并在同一页面查看反馈闭环情况。
        </p>
      </div>

      <div class="head-actions">
        <el-button size="small" :loading="loading" @click="loadAiConfigPageData">刷新</el-button>
      </div>
    </div>

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <div class="overview-layout">
      <section class="panel-card">
        <div class="panel-head">
          <div>
            <h3>运行状态</h3>
            <p>关注密钥、地址和配置更新时间。</p>
          </div>
        </div>

        <div class="status-grid">
          <article v-for="item in statusCards" :key="item.label" class="status-card">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.tip }}</p>
          </article>
        </div>
      </section>

      <section class="panel-card">
        <div class="panel-head">
          <div>
            <h3>反馈闭环</h3>
            <p>统计用户对 AI 分析结果的评价，便于判断模型是否稳定。</p>
          </div>
        </div>

        <div class="feedback-grid">
          <article
            v-for="item in feedbackCards"
            :key="item.label"
            class="feedback-card"
            :class="`feedback-card--${item.tone}`"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <p>{{ item.tip }}</p>
          </article>
        </div>
      </section>
    </div>

    <section class="panel-card panel-card--form">
      <div class="panel-head">
        <div>
          <h3>业务可配置项</h3>
          <p>这些配置保存到 PostgreSQL，并会记录审计日志。</p>
        </div>
      </div>

      <EntityForm
        v-model="formModel"
        :fields="formFields"
        :initial-value="formModel"
        :loading="saving"
        :columns="2"
        submit-text="保存配置"
        cancel-text="恢复当前值"
        @submit="handleSubmit"
        @cancel="handleReset"
      />
    </section>
  </section>
</template>

<style scoped lang="less">
.ai-config-page {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  .page-head,
  .panel-card,
  .error-banner {
    border: 1px solid #d9e2ec;
    background: #fff;
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.9rem;
    padding: 0.95rem 1rem;

    &__content {
      min-width: 0;
    }

    .eyebrow {
      color: #6b7280;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    h2 {
      margin-top: 0.2rem;
      color: #0f172a;
      font-size: 1.2rem;
      font-weight: 700;
      line-height: 1.35;
    }

    .intro {
      max-width: 46rem;
      margin-top: 0.35rem;
      color: #64748b;
      font-size: 0.84rem;
      line-height: 1.55;
    }

    .head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      :deep(.el-button) {
        border-radius: 0;
        padding: 6px 12px;
        font-size: 0.8rem;
      }
    }
  }

  .error-banner {
    padding: 0.7rem 0.85rem;
    border-color: #fecaca;
    background: #fef2f2;
    color: #dc2626;
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .overview-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.9rem;
  }

  .panel-card {
    padding: 0.9rem;

    &--form {
      padding-bottom: 0.8rem;
    }

    .panel-head {
      margin-bottom: 0.75rem;

      h3 {
        color: #0f172a;
        font-size: 0.98rem;
        font-weight: 700;
        line-height: 1.4;
      }

      p {
        margin-top: 0.22rem;
        color: #64748b;
        font-size: 0.8rem;
        line-height: 1.5;
      }
    }
  }

  .status-grid,
  .feedback-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
  }

  .status-card,
  .feedback-card {
    padding: 0.75rem 0.8rem;
    border: 1px solid #e2e8f0;
    background: #fcfcfd;

    span {
      color: #64748b;
      font-size: 0.76rem;
      line-height: 1.4;
    }

    strong {
      display: block;
      margin-top: 0.3rem;
      color: #0f172a;
      font-size: 0.92rem;
      font-weight: 700;
      line-height: 1.45;
      word-break: break-word;
    }

    p {
      margin-top: 0.28rem;
      color: #64748b;
      font-size: 0.76rem;
      line-height: 1.5;
    }
  }

  .feedback-card {
    &--success {
      border-color: #bbf7d0;
      background: #f0fdf4;
    }

    &--warning {
      border-color: #fde68a;
      background: #fffbeb;
    }

    &--danger {
      border-color: #fecaca;
      background: #fef2f2;
    }

    &--normal {
      background: #f8fafc;
    }
  }
}

@media (max-width: 1080px) {
  .ai-config-page {
    .overview-layout {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 768px) {
  .ai-config-page {
    .page-head {
      flex-direction: column;
      align-items: stretch;
    }

    .status-grid,
    .feedback-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
