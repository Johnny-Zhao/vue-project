<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import EntityForm from '@/components/EntityForm.vue'
import type { FormModel } from '@/components/formSchemas'
import { fetchAiRuntimeConfigApi, updateAiRuntimeConfigApi } from '@/features/ai-config/api'
import {
  createAiRuntimeConfigFields,
  createAiRuntimeConfigInitialValue,
} from '@/features/ai-config/formSchema'
import type { AiRuntimeConfigItem, UpdateAiRuntimeConfigPayload } from '@/features/ai-config/types'

const loading = ref(false)
const saving = ref(false)
const requestError = ref('')
const configDetail = ref<AiRuntimeConfigItem | null>(null)
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
      tip: '出于安全考虑，这个页面只展示状态，不展示真实密钥。',
    },
    {
      label: '接口地址',
      value: configDetail.value.endpointLabel,
      tip: '实际调用地址仍由服务端环境变量控制。',
    },
    {
      label: '最后更新人',
      value: configDetail.value.updatedByName,
      tip: '便于审计配置由谁修改。',
    },
    {
      label: '最后更新时间',
      value: configDetail.value.updatedAt,
      tip: '方便确认当前生效配置版本。',
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

// 加载当前 AI 配置详情。
async function loadAiRuntimeConfig() {
  loading.value = true
  requestError.value = ''

  try {
    const result = await fetchAiRuntimeConfigApi()
    configDetail.value = result
    formModel.value = createAiRuntimeConfigInitialValue(result)
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

void loadAiRuntimeConfig()
</script>

<template>
  <section class="ai-config-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">AI 运行配置</p>
        <h2>AI 配置管理</h2>
        <p class="intro">
          统一维护车辆 AI
          分析的模型、超时、缓存与重算策略。密钥与真实网关地址仍由服务端环境变量托管，页面只负责业务配置。
        </p>
      </div>

      <div class="head-actions">
        <el-button :loading="loading" @click="loadAiRuntimeConfig">刷新配置</el-button>
      </div>
    </div>

    <div v-if="requestError" class="error-banner">{{ requestError }}</div>

    <div class="status-grid">
      <article v-for="item in statusCards" :key="item.label" class="status-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <p>{{ item.tip }}</p>
      </article>
    </div>

    <section class="form-card">
      <div class="card-head">
        <div>
          <h3>业务可配置项</h3>
          <p>这些配置保存到 PostgreSQL，并且会记录审计日志。</p>
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
  gap: 1.25rem;

  .page-head,
  .form-card,
  .status-card,
  .error-banner {
    border: 1px solid rgba(29, 59, 54, 0.1);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 18px 40px rgba(19, 35, 33, 0.08);
  }

  .page-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;

    .eyebrow {
      color: #7a5d2d;
      font-size: 0.76rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      margin-top: 0.35rem;
      color: #173937;
      font-size: 1.75rem;
      font-weight: 700;
    }

    .intro {
      max-width: 48rem;
      margin-top: 0.75rem;
      color: #556260;
      line-height: 1.7;
    }

    .head-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  }

  .error-banner {
    padding: 1rem 1.2rem;
    border-color: rgba(248, 113, 113, 0.2);
    background: rgba(248, 113, 113, 0.08);
    color: #dc2626;
  }

  .status-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;

    .status-card {
      padding: 1.15rem 1.2rem;
      background: linear-gradient(135deg, #f7faf8 0%, #fffdf8 100%);

      span {
        color: #6b7280;
        font-size: 0.82rem;
      }

      strong {
        display: block;
        margin-top: 0.45rem;
        color: #173937;
        font-size: 1.08rem;
        line-height: 1.5;
        word-break: break-word;
      }

      p {
        margin-top: 0.55rem;
        color: #556260;
        font-size: 0.88rem;
        line-height: 1.6;
      }
    }
  }

  .form-card {
    padding: 1.4rem 1.5rem;

    .card-head {
      margin-bottom: 1rem;

      h3 {
        color: #173937;
        font-size: 1.12rem;
        font-weight: 700;
      }

      p {
        margin-top: 0.45rem;
        color: #556260;
        line-height: 1.6;
      }
    }
  }
}

@media (max-width: 980px) {
  .ai-config-page {
    .page-head {
      flex-direction: column;
      align-items: stretch;
    }

    .status-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
